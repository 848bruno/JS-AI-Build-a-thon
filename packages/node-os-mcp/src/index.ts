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

async function start() {
  if (type === 'sse') {
    const app = express();
    let sseTransport: SSEServerTransport;

    app.get('/sse', async (request, response) => {
      sseTransport = new SSEServerTransport('/messages', response);
      await typedServer.connect(sseTransport);
    });

    app.post('/messages', async (request, response) => {
      await typedServer.connect(sseTransport);
    });

    app.listen(process.env.PORT || 3001);
    console.error('MCP Server running on sse');
  } else if (type === 'stdio') {
    try {
      const stdioTransport = new StdioServerTransport();
      await typedServer.connect(stdioTransport);
      console.error('MCP Server running on stdio');
    } catch (error: unknown) {
      console.error('Failed to start MCP Server on stdio:', error);
    }
  } else {
    throw new Error(`Unknown transport type: ${type}`);
  }
}

(async () => {
  await start();
})(); // Wrapped in IIFE to support top-level await in CommonJS
