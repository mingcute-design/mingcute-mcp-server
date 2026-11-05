import assert from 'node:assert/strict';
import { UsageExamples } from '../dist/application/usage-examples.js';
import { IconSearchRepository } from '../dist/infrastructure/search/icon-search.repository.js';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const catalogue = JSON.parse(await readFile(path.join(root, 'src/data/catalogue.generated.json'), 'utf8'));
const icons = JSON.parse(await readFile(path.join(root, 'src/data/icons.generated.json'), 'utf8'));
const repository = new IconSearchRepository(icons);
repository.initialise();
const usage = new UsageExamples(repository);
const temp = await mkdtemp(path.join(os.tmpdir(), 'mingcute-public-contract-'));
const npmCli = process.env.npm_execpath;
if (process.platform === 'win32' && !npmCli) throw new Error('Run npm run verify:published.');
const npm = npmCli ? process.execPath : 'npm';
const npmArgs = npmCli ? [npmCli] : [];
const packages = [
  'react',
  'vue',
  'react-native',
  'svelte',
  'solid',
  'vanilla',
  'web-components',
  'font',
  'svg',
  'icons',
];
const get = (archive, file) =>
  execFileSync('tar', ['-xOf', archive, 'package/' + file], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
try {
  for (const pkg of packages) {
    const result = JSON.parse(
      execFileSync(
        npm,
        [
          ...npmArgs,
          'pack',
          `@mingcute/${pkg}@${catalogue.packageVersion}`,
          '--ignore-scripts',
          '--json',
          '--pack-destination',
          temp,
          '--registry=https://registry.npmjs.org/',
          '--@mingcute:registry=https://registry.npmjs.org/',
        ],
        {
          cwd: temp,
          env: { ...process.env, npm_config_cache: path.join(os.tmpdir(), 'mingcute-public-contract-cache') },
          encoding: 'utf8',
          maxBuffer: 40 * 1024 * 1024,
        },
      ),
    )[0];
    const archive = path.join(temp, result.filename);
    const manifest = JSON.parse(get(archive, 'package.json'));
    const files = new Set(
      execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
        .trim()
        .split('\n'),
    );
    for (const style of catalogue.styles) {
      if (pkg === 'svg') {
        for (const icon of icons) assert.ok(files.has('package/' + icon.variants[style].svgPath));
      } else if (pkg === 'font') {
        const cssPath = manifest.exports[`./${style}.min.css`].replace(/^\.\//, '');
        const css = get(archive, cssPath);
        for (const icon of icons)
          assert.ok(
            css.includes('.' + icon.variants[style].webfontClass + ':'),
            `Missing font class ${icon.baseName}`,
          );
      } else {
        const typesPath = manifest.exports[`./${style}`].types.replace(/^\.\//, '');
        const types = get(archive, typesPath);
        for (const icon of icons) {
          const variant = icon.variants[style];
          const example = usage.execute({
            name: icon.baseName,
            style,
            framework: pkg === 'icons' ? 'data' : pkg,
          });
          const imported = example.match(
            /import \{ (\w+) \} from '@mingcute\/[^']+\/core-(?:regular|filled)(?:\/[^']+)?';/,
          );
          assert.ok(imported, `Missing current style import for ${pkg}/${icon.baseName}`);
          assert.ok(types.includes(imported[1]), `Missing ${pkg} export ${imported[1]}`);
          if (pkg === 'web-components') assert.ok(manifest.exports[`./${style}/*`]);
        }
      }
    }
    console.log(
      `Verified all ${catalogue.variantCount} variants against published @mingcute/${pkg}@${catalogue.packageVersion}.`,
    );
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}
