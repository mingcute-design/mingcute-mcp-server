import { startMcpServer } from "../interface/mcp/server";

export async function runCli(): Promise<void> {
  await startMcpServer();
}
