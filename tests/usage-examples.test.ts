import { beforeAll, describe, expect, it } from 'vitest';
import { loadIconSets, readSvg } from '../src/infrastructure/data/icon-loader.js';
import { IconSearchRepository } from '../src/infrastructure/search/icon-search.repository.js';
import { UsageExamples } from '../src/application/usage-examples.js';
import { GetIconUseCase } from '../src/application/get-icon.usecase.js';
import { frameworks } from '../src/domain/icon.js';
const repository = new IconSearchRepository(loadIconSets());
beforeAll(() => repository.initialise());
describe('details and usage', () => {
  it('infers filled and regular variants from component and variant names', async () => {
    const get = new GetIconUseCase(repository);
    for (const name of ['Home1Filled', 'home-1-core-filled', 'home_1_fill', 'core-filled/home-1.svg']) {
      expect(Object.keys((await get.execute({ name })).icon.variants)).toEqual(['core-filled']);
      expect(new UsageExamples(repository).execute({ name, framework: 'react' })).toContain(
        "Home1Filled } from '@mingcute/react/core-filled'",
      );
    }
    await expect(get.execute({ name: 'Home1Filled', style: 'line' })).rejects.toThrow('conflict');
    await expect(get.execute({ name: 'missing' })).rejects.toThrow('not found');
  });
  it('returns both bundled SVGs without accessing an external folder', async () => {
    const result = await new GetIconUseCase(repository).execute({ name: 'home-1', includeSvg: true });
    expect(Object.keys(result.svg!)).toHaveLength(2);
    expect(result.svg!['core-regular']).toContain('<svg');
    expect((await new GetIconUseCase(repository).execute({ name: 'home-1.svg' })).icon.baseName).toBe(
      'home-1',
    );
    await expect(readSvg('../../package.json')).rejects.toThrow('bundled');
    await expect(readSvg('toString')).rejects.toThrow('bundled');
  });
  it('generates current style-specific examples for all ten packages', () => {
    const usage = new UsageExamples(repository);
    expect(usage.execute({ name: 'home-1', framework: 'data' })).toContain('Home1Icon');
    for (const framework of frameworks) {
      const result = usage.execute({ name: 'home-1', framework });
      expect(result).toContain('core-regular');
      expect(result).not.toMatch(/mingcute_icon|Home1Line/);
    }
    expect(usage.execute({ name: 'home-1', framework: 'webfont' })).toContain('mgc mgc-home-1-core-regular');
    expect(usage.execute({ name: 'home-1', framework: 'svg' })).toContain(
      '@mingcute/svg/core-regular/home-1.svg?url',
    );
  });
  it('can retrieve every advertised SVG and resolve every component name', async () => {
    for (const icon of loadIconSets())
      for (const variant of Object.values(icon.variants)) {
        expect(repository.getByName(variant.componentName)?.baseName).toBe(icon.baseName);
        expect(await readSvg(variant.svgPath)).toContain('<svg');
      }
  });
});
