import fs from 'node:fs/promises';
import { parse } from 'acorn';
import { normalizeName } from '../domain/name.js';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { MingcuteIconSet, MingcuteIconStyle } from '../domain/icon.js';

const root = fileURLToPath(new URL('../..', import.meta.url));
const args = process.argv.slice(2);
const sourceIndex = args.indexOf('--source');
if (sourceIndex === -1 || !args[sourceIndex + 1] || args[sourceIndex + 1].startsWith('-')) {
  throw new Error('Usage: npm run build:data -- --source /path/to/mingcute-icons [--check]');
}
const source = path.resolve(args[sourceIndex + 1]);
const readJson = async (file: string) => JSON.parse(await fs.readFile(file, 'utf8'));
const manifestPath = path.join(source, 'assets/svg/manifest.json');
const manifest = await readJson(manifestPath);
const pkg = await readJson(path.join(source, 'package.json'));
const keywordFile = path.join(root, 'src/data/source/keywords.json');
const curated = await readJson(keywordFile);
const sourceKeywords = await fs.readFile(path.join(source, 'assets/Keywords.js'), 'utf8');
const keywordMap = new Map<string, string[]>();
const syntax = parse(sourceKeywords, { ecmaVersion: 'latest', sourceType: 'module' });
const exported = syntax.body.find((node) => node.type === 'ExportDefaultDeclaration');
if (
  !exported ||
  exported.type !== 'ExportDefaultDeclaration' ||
  exported.declaration.type !== 'ObjectExpression'
)
  throw new Error('Keywords must export a plain object.');
for (const property of exported.declaration.properties) {
  if (
    property.type !== 'Property' ||
    property.computed ||
    property.method ||
    property.kind !== 'init' ||
    property.key.type !== 'Literal' ||
    typeof property.key.value !== 'string' ||
    property.value.type !== 'ArrayExpression'
  )
    throw new Error('Keywords contain unsupported JavaScript.');
  const values = property.value.elements.map((value) => {
    if (!value) return '';
    if (value.type !== 'Literal' || typeof value.value !== 'string')
      throw new Error('Keyword values must be strings.');
    return value.value;
  });
  const key = normalizeName(property.key.value);
  keywordMap.set(key, [...(keywordMap.get(key) ?? []), ...values]);
}
for (const [name, values] of Object.entries(curated)) {
  if (!Array.isArray(values) || values.some((value) => typeof value !== 'string'))
    throw new Error('Curated keywords must be arrays of strings.');
  const key = normalizeName(name);
  keywordMap.set(key, [...(keywordMap.get(key) ?? []), ...values]);
}
const icons = new Map<string, MingcuteIconSet>();
const svgs: Record<string, string> = {};
const styles = ['core-regular', 'core-filled'] as const;
const entries = new Map<string, { path: string; sha256: string }>();
for (const entry of manifest.entries) {
  const key = `${entry.packageStyle}/${entry.path
    .split('/')
    .at(-1)
    ?.replace(/\.svg$/, '')}`;
  if (entries.has(key)) throw new Error(`Duplicate source identity: ${key}`);
  entries.set(key, entry);
}
for (const style of styles) {
  const metadata = await readJson(path.join(source, 'packages/svg', style, 'metadata.json'));
  for (const item of metadata) {
    const entry = entries.get(`${style}/${item.name}`);
    if (!entry) throw new Error(`Missing source: ${style}/${item.name}`);
    const absolute = path.resolve(source, 'assets/svg', entry.path);
    const safeRoot = path.resolve(source, 'assets/svg') + path.sep;
    if (!absolute.startsWith(safeRoot)) throw new Error('Source path escapes SVG root.');
    const svg = await fs.readFile(absolute, 'utf8');
    if (createHash('sha256').update(svg).digest('hex') !== entry.sha256)
      throw new Error(`Source hash mismatch: ${entry.path}`);
    if (
      !/<svg\b/.test(svg) ||
      /<(?:script|foreignObject)\b|\bon\w+\s*=|(?:href|src)\s*=\s*["'](?:https?:|javascript:|data:)/i.test(
        svg,
      )
    )
      throw new Error(`Unsafe SVG: ${entry.path}`);
    const baseName = item.file.replace(/\.svg$/, '');
    const existing = icons.get(baseName);
    if (existing && (existing.category !== item.category || existing.variants[style]))
      throw new Error(`Conflicting icon: ${baseName}`);
    const keywords = [
      ...new Set<string>(
        (keywordMap.get(normalizeName(item.name)) ?? [])
          .filter((v: unknown) => typeof v === 'string')
          .map((v: string) => v.trim())
          .filter(Boolean),
      ),
    ].sort();
    const icon = existing ?? {
      baseName,
      category: item.category,
      keywords: keywords.filter((v) => !/\p{Script=Han}/u.test(v)),
      zhKeywords: keywords.filter((v) => /\p{Script=Han}/u.test(v)),
      variants: {},
    };
    const svgPath = `${style}/${item.file}`;
    (icon.variants as Partial<Record<MingcuteIconStyle, unknown>>)[style] = {
      name: `${baseName}-${style}`,
      style,
      componentName: item.componentName,
      webfontClass: `mgc-${baseName}-${style}`,
      svgPath,
    };
    icons.set(baseName, icon);
    svgs[svgPath] = svg;
  }
}
if (Object.keys(svgs).length !== manifest.count || manifest.failed.length)
  throw new Error('Incomplete source catalogue.');
const catalogue = [...icons.values()].sort((a, b) => a.baseName.localeCompare(b.baseName, 'en'));
const categories = [...new Set(catalogue.map((i) => i.category))].sort().map((name) => ({
  name,
  iconCount: catalogue.filter((i) => i.category === name).length,
  variantCount: catalogue
    .filter((i) => i.category === name)
    .reduce((sum, i) => sum + Object.keys(i.variants).length, 0),
}));
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' }).trim();
const outputs: Record<string, unknown> = {
  'icons.generated.json': catalogue,
  'categories.generated.json': categories,
  'svgs.generated.json': Object.fromEntries(
    Object.entries(svgs).sort(([a], [b]) => a.localeCompare(b, 'en')),
  ),
  'catalogue.generated.json': {
    schemaVersion: 1,
    packageVersion: pkg.version,
    sourceCommit,
    keywordsSha256: createHash('sha256').update(sourceKeywords).digest('hex'),
    curatedKeywordsSha256: createHash('sha256')
      .update(await fs.readFile(keywordFile))
      .digest('hex'),
    manifestSha256: createHash('sha256')
      .update(await fs.readFile(manifestPath))
      .digest('hex'),
    iconCount: catalogue.length,
    variantCount: Object.keys(svgs).length,
    styles,
  },
};
for (const [file, data] of Object.entries(outputs)) {
  const target = path.join(root, 'src/data', file);
  const content = JSON.stringify(data, null, 2) + '\n';
  if (args.includes('--check')) {
    if ((await fs.readFile(target, 'utf8')) !== content) throw new Error(`Stale catalogue: ${file}`);
  } else await fs.writeFile(target, content);
}
console.error(
  `Verified ${catalogue.length} icons and ${Object.keys(svgs).length} SVG variants from Free ${pkg.version}.`,
);
