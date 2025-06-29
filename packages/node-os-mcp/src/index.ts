import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import { server } from './server.js';

// Ensure server has proper typings
type ServerType = {
  connect: (transport: any) => Promise<void>;
};

// Cast server to ServerType if necessary
const typedServer = server as ServerType;

const arguments_ = process.argv.slice(2);
const type = arguments_[0]; // Get the transport type from command line arguments

if (type === 'sse') {
  const app = express();
  let sseTransport: SSEServerTransport;

  app.get('/sse', async (request, response) => {
    sseTransport = new SSEServerTransport('/messages', response);
    await server.connect(sseTransport);
  });

  app.post('/messages', async (request, response) => {
    await typedServer.connect(stdioTransport);
  });

  app.listen(process.env.PORT || 3001);
  console.error('MCP Server running on sse');
} else if (type === 'stdio') {
  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);
  console.error('MCP Server running on stdio');
} else {
  throw new Error(`Unknown transport type: ${type}`);
}
