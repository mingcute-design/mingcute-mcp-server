#!/usr/bin/env node
import('../dist/cli/run.js')
  .then(({ runCli }) => runCli())
  .catch(() => {
    console.error(
      'MingCute MCP could not start. Use Node.js 22.12 or newer and reinstall @mingcute/mcp-server.',
    );
    process.exitCode = 1;
  });
