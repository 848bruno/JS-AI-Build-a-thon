import ModelClient from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.AZURE_INFERENCE_SDK_ENDPOINT;
const apiKey = process.env.AZURE_INFERENCE_SDK_KEY;

if (!endpoint || !apiKey) {
  throw new Error('Missing Azure endpoint or key in environment variables');
}

const client = new ModelClient(endpoint, new AzureKeyCredential(apiKey));

const chatMessages = [
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'What are 3 things to see in Seattle?' },
];

// Use top-level await if your environment supports it
try {
  const response = await client.path('chat/completions').post({
    body: {
      messages: chatMessages,
      maxTokens: 2048,
      model: 'DeepSeek-R1-0528',
    },
  });

  console.log(JSON.stringify(response.body, null, 2));
} catch (error) {
  console.error('Error during model inference:', error);
}
