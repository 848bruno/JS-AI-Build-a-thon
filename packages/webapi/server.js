import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Import ModelClient from '@azure-rest/ai-inference'; // ❌ Unused import, remove to fix ESLint
import { AzureChatOpenAI } from '@langchain/openai';
import { dirname } from 'node/path';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { BufferMemory } from 'langchain/memory';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const chatModel = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_INFERENCE_SDK_KEY,
  azureOpenAIApiInstanceName: process.env.INSTANCE_NAME,
  azureOpenAIApiDeploymentName: process.env.DEPLOYMENT_NAME,
  azureOpenAIApiVersion: '2024-08-01-preview',
  temperature: 1,
  maxTokens: 4096,
});

const sessionMemories = {};

function getSessionMemory(sessionId) {
  if (!sessionMemories[sessionId]) {
    const history = new ChatMessageHistory();
    sessionMemories[sessionId] = new BufferMemory({
      chatHistory: history,
      returnMessages: true,
      memoryKey: 'chat_history',
    });
  }

  return sessionMemories[sessionId];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const pdfPath = path.join(projectRoot, 'data/employee_handbook.pdf');

let pdfText = null;
const pdfChunks = [];
const CHUNK_SIZE = 800;

async function loadPDF() {
  if (pdfText) return pdfText;
  if (!fs.existsSync(pdfPath)) return 'PDF not found.';
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);
  pdfText = data.text;
  let currentChunk = '';
  const words = pdfText.split(/\s+/);

  for (const word of words) {
    if ((currentChunk + ' ' + word).length <= CHUNK_SIZE) {
      currentChunk += (currentChunk ? ' ' : '') + word;
    } else {
      pdfChunks.push(currentChunk);
      currentChunk = word;
    }
  }

  if (currentChunk) pdfChunks.push(currentChunk);
  return pdfText;
}

function retrieveRelevantContent(query) {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 3)
    .map((term) => term.replaceAll(/[.,?!;:()"']/g, ''));

  if (queryTerms.length === 0) return [];

  const scoredChunks = pdfChunks.map((chunk) => {
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      const regex = new RegExp(term, 'gi');
      const matches = chunkLower.match(regex);
      if (matches) score += matches.length;
    }

    return { chunk, score };
  });

  return scoredChunks
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.chunk);
}

// ✅ Renamed `res` to `response` for better variable naming
app.post('/chat', async (request, response) => {
  const userMessage = request.body.message;
  const useRAG = request.body.useRAG === undefined ? true : request.body.useRAG;
  const sessionId = request.body.sessionId || 'default';

  let sources = [];
  const memory = getSessionMemory(sessionId);
  const memoryVariables = await memory.loadMemoryVariables({});

  if (useRAG) {
    await loadPDF();
    sources = retrieveRelevantContent(userMessage);
  }

  const systemMessage = useRAG
    ? {
        role: 'system',
        content:
          sources.length > 0
            ? `You are a helpful assistant for Contoso Electronics. You must ONLY use the information provided below to answer.\n\n--- EMPLOYEE HANDBOOK EXCERPTS ---\n${sources.join('\n\n')}\n--- END OF EXCERPTS ---`
            : `You are a helpful assistant for Contoso Electronics. The excerpts do not contain relevant information for this question. Reply politely: "I'm sorry, I don't know. The employee handbook does not contain information about that."`,
      }
    : {
        role: 'system',
        content:
          "You are a helpful and knowledgeable assistant. Answer the user's questions concisely and informatively.",
      };

  try {
    const messages = [systemMessage, ...(memoryVariables.chat_history || []), { role: 'user', content: userMessage }];
    const modelResponse = await chatModel.invoke(messages);

    await memory.saveContext({ input: userMessage }, { output: modelResponse.content });

    response.json({
      reply: modelResponse.content,
      sources,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      error: 'Model call failed',
      message: error.message,
      reply: 'Sorry, I encountered an error. Please try again.',
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(` Server is running on http://localhost:${PORT}`);
});
