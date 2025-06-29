// Filename: server.ts

import * as os from 'node:os';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Initialize MCP Server with proper typing
const server: McpServer = new McpServer({
  name: 'node-os-mcp',
  description: 'A server that provides tools to get information about the operating system.',
  version: '0.0.1',
});

server.tool('cpu_average_usage', 'Get the average CPU usage percentage on the local machine', {}, async () => {
  function cpuAverage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type of Object.keys(cpu.times) as Array<keyof typeof cpu.times>) {
        const value = cpu.times[type];
        if (typeof value === 'number') {
          totalTick += value;
        }
      }

      totalIdle += typeof cpu.times.idle === 'number' ? cpu.times.idle : 0;
    }

    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length,
    };
  }

  const start = cpuAverage();
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 100);
  });
  const end = cpuAverage();

  const idleDiff = end.idle - start.idle;
  const totalDiff = end.total - start.total;
  const usage = totalDiff > 0 ? (1 - idleDiff / totalDiff) * 100 : 0;

  return {
    content: [
      {
        type: 'text',
        text: `Average CPU usage: ${usage.toFixed(2)}%`,
      },
    ],
    isError: false,
  };
});

server.tool('get_hostname', 'Get the hostname of the local machine', {}, async () => ({
  content: [
    {
      type: 'text',
      text: `Hostname: ${os.hostname()}`,
    },
  ],
  isError: false,
}));

server.tool('get_architecture', 'Get the architecture of the local machine', {}, async () => ({
  content: [
    {
      type: 'text',
      text: `Architecture: ${os.arch()}`,
    },
  ],
  isError: false,
}));

server.tool('get_uptime', 'Get the uptime of the local machine in seconds', {}, async () => ({
  content: [
    {
      type: 'text',
      text: `Uptime: ${os.uptime()} seconds`,
    },
  ],
  isError: false,
}));

export { server };
