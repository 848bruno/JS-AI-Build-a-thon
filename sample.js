import fs from 'node:fs';
import path from 'node:path';
import createModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';

const token = process.env.GITHUB_TOKEN;
const endpoint = 'https://models.github.ai/inference';
const model = 'deepseek/DeepSeek-R1-0528';

// Load and encode the sketch image
const imagePath = path.join(process.cwd(), 'contoso_layout_sketch.jpg');
const imageBuffer = fs.readFileSync(imagePath);
const base64Image = imageBuffer.toString('base64');

// Initialize ModelClient (renamed to follow lowercase function convention)
const client = createModelClient(endpoint, new AzureKeyCredential(token));

// Send image and prompt to model
const response = await client.path('/chat/completions').post({
  body: {
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are an expert front-end developer. Convert the provided hand-drawn website layout sketch into a fully responsive HTML and CSS layout. Keep the design modern and clean.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please generate HTML and CSS code for this layout:',
          },
          {
            type: 'image_url', // ⚠️ ESLint: Consider renaming if rule not disabled
            imageUrl: {
              url: `data:JS-AI-Build-a-thon\\contoso_layout_sketch.jpg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    temperature: 0.2,
  },
});

// Handle response
if (isUnexpected(response)) {
  console.error('Unexpected response:', response.body);
} else {
  const completion = response.body.choices?.[0]?.message?.content;
  if (completion) {
    const outputPath = path.join(process.cwd(), 'sketch_layout_output.html');
    fs.writeFileSync(outputPath, completion);
    console.log(`Web page code saved to ${outputPath}`);
  } else {
    console.error(' No completion returned.');
  }
}
