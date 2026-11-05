import { startMcpServer } from '../interface/mcp/server.js';

export async function runCli(): Promise<void> {
  await startMcpServer();
}
