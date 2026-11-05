import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const root = fileURLToPath(new URL('..', import.meta.url));
const temp = await mkdtemp(path.join(os.tmpdir(), 'mingcute-mcp-pack-'));
const npmCli = process.env.npm_execpath;
if (process.platform === 'win32' && !npmCli) throw new Error('Run this check through npm run check.');
const npm = npmCli ? process.execPath : 'npm';
const npmArgs = npmCli ? [npmCli] : [];
const env = { ...process.env, npm_config_cache: path.join(os.tmpdir(), 'mingcute-mcp-pack-cache') };
let client;
try {
  const packed = JSON.parse(
    execFileSync(npm, [...npmArgs, 'pack', '--ignore-scripts', '--json', '--pack-destination', temp], {
      cwd: root,
      env,
      encoding: 'utf8',
    }),
  )[0];
  assert.ok(
    packed.files.every(
      (f) =>
        f.path === 'package.json' ||
        f.path === 'LICENSE' ||
        f.path.startsWith('README') ||
        f.path === 'bin/run.cjs' ||
        f.path.startsWith('dist/'),
    ),
  );
  assert.ok(!packed.files.some((f) => /\.map$|(?:^|\/)(?:scripts|tests|source)\//.test(f.path)));
  const project = path.join(temp, 'customer');
  const { mkdir } = await import('node:fs/promises');
  await mkdir(project);
  await writeFile(path.join(project, 'package.json'), '{"private":true}');
  execFileSync(
    npm,
    [
      ...npmArgs,
      'install',
      path.join(temp, packed.filename),
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--registry=https://registry.npmjs.org/',
      '--@mingcute:registry=https://registry.npmjs.org/',
    ],
    { cwd: project, env, stdio: 'pipe' },
  );
  const installed = path.join(project, 'node_modules/@mingcute/mcp-server');
  const manifest = JSON.parse(await readFile(path.join(installed, 'package.json'), 'utf8'));
  assert.ok(!manifest.dependencies.tsx);
  client = new Client({ name: 'packed-artifact-check', version: '1.0.0' });
  const runtimeEnv = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key, value]) => value !== undefined && !/MINGCUTE|TOKEN|SECRET|PASSWORD/.test(key),
    ),
  );
  let stderr = '';
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(installed, 'bin/run.cjs')],
    cwd: temp,
    env: runtimeEnv,
    stderr: 'pipe',
  });
  transport.stderr?.on('data', (chunk) => {
    stderr += chunk.toString();
  });
  await client.connect(transport);
  assert.equal(client.getServerVersion().version, manifest.version);
  const { tools } = await client.listTools();
  assert.equal(tools.length, 5);
  assert.ok(tools.every((t) => t.annotations?.readOnlyHint === true));
  const call = async (name, args) => {
    const result = await client.callTool({ name, arguments: args });
    assert.ok(!result.isError, JSON.stringify(result));
    assert.ok(result.structuredContent);
    return result.structuredContent;
  };
  const search = await call('search_icons', { query: 'Home1Filled', limit: 1 });
  assert.equal(search.matches[0].name, 'home-1');
  const icon = await call('get_icon', { name: 'Home1Filled', includeSvg: true });
  assert.deepEqual(Object.keys(icon.svg), ['core-filled']);
  assert.match(icon.svg['core-filled'], /<svg\b/);
  for (const framework of [
    'react',
    'vue',
    'react-native',
    'svelte',
    'solid',
    'vanilla',
    'web-components',
    'webfont',
    'svg',
    'data',
  ]) {
    const usage = await call('get_icon_usage', { name: 'home-1', framework });
    assert.match(usage.example, /core-regular/);
  }
  const categories = await call('list_categories', {});
  assert.equal(categories.catalogue.variantCount, 4526);
  const first = await call('list_icons_by_category', { category: 'buildings', limit: 2 });
  const next = await call('list_icons_by_category', {
    category: 'buildings',
    limit: 2,
    offset: first.nextOffset,
  });
  assert.notEqual(first.icons[0].name, next.icons[0].name);
  const invalid = await client.callTool({
    name: 'get_icon',
    arguments: { name: 'Home1Filled', style: 'line' },
  });
  assert.equal(invalid.isError, true);
  const tooLong = await client.callTool({ name: 'search_icons', arguments: { query: 'x'.repeat(201) } });
  assert.equal(tooLong.isError, true);
  const resource = await client.readResource({ uri: 'mingcute://catalogue' });
  assert.equal(JSON.parse(resource.contents[0].text).catalogue.packageVersion, '3.1.0');
  assert.equal(stderr, '');
  console.log(
    `Packed MCP ${manifest.version}: fresh installation, all five tools, ten framework examples, bundled SVG, validation, pagination, and catalogue resource passed.`,
  );
} finally {
  await client?.close();
  await rm(temp, { recursive: true, force: true });
}
