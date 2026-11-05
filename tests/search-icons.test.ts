import { beforeAll, describe, expect, it } from 'vitest';
import { loadIconSets, loadCatalogue } from '../src/infrastructure/data/icon-loader.js';
import { IconSearchRepository } from '../src/infrastructure/search/icon-search.repository.js';
import { SearchIconsUseCase } from '../src/application/search-icons.usecase.js';
const repository = new IconSearchRepository(loadIconSets());
beforeAll(() => repository.initialise());
describe('current Free search', () => {
  it('contains every current source variant', () => {
    expect(loadCatalogue().variantCount).toBe(4526);
    expect(loadIconSets()).toHaveLength(2263);
    expect(loadIconSets().every((icon) => icon.keywords.length + icon.zhKeywords.length > 0)).toBe(true);
    expect(loadIconSets().reduce((n, i) => n + Object.keys(i.variants).length, 0)).toBe(
      loadCatalogue().variantCount,
    );
  });
  it('ranks exact canonical and component names first', () => {
    const search = new SearchIconsUseCase(repository);
    for (const query of ['home-1', 'home_1', 'Home1Regular', 'home-1-core-filled']) {
      expect(search.execute({ query }).matches[0]?.icon.baseName).toBe('home-1');
    }
  });
  it('searches English and Chinese keywords', () => {
    const search = new SearchIconsUseCase(repository);
    expect(search.execute({ query: 'home' }).matches.some((m) => m.icon.baseName === 'home-1')).toBe(true);
    expect(
      search.execute({ query: '主页', locale: 'zh' }).matches.some((m) => m.icon.baseName === 'home-1'),
    ).toBe(true);
  });
  it('filters variants and rejects empty queries and unknown categories', () => {
    const search = new SearchIconsUseCase(repository);
    const result = search.execute({ query: 'home', style: 'fill' });
    expect(Object.keys(result.matches[0].icon.variants)).toEqual(['core-filled']);
    expect(() => search.execute({ query: '   ' })).toThrow('empty');
    expect(() => search.execute({ query: 'home', category: 'missing' })).toThrow('Unknown category');
  });
  it('returns a complete paginated category without duplicates', () => {
    const all = repository.listByCategory('buildings', 'all', 10000);
    expect(all.length).toBeGreaterThan(5);
    const page = repository.listByCategory('buildings', 'all', 5, 5);
    expect(page).toEqual(all.slice(5, 10));
    expect(repository.listByCategory('buildings', 'all', 5, 10000)).toEqual([]);
  });
});

it('uses locale-specific keyword fields without hiding canonical names', () => {
  const original = loadIconSets().find((icon) => icon.baseName === 'home-1')!;
  const localized = new IconSearchRepository([{ ...original, keywords: ['banana'], zhKeywords: ['香蕉'] }]);
  localized.initialise();
  const search = new SearchIconsUseCase(localized);
  expect(search.execute({ query: '香蕉', locale: 'en' }).matches).toEqual([]);
  expect(search.execute({ query: '香蕉', locale: 'zh' }).matches).toHaveLength(1);
  expect(search.execute({ query: 'Home1Regular', locale: 'zh' }).matches).toHaveLength(1);
});

it('applies category filtering before a global candidate limit can hide matching icons', () => {
  const fixtures = Array.from({ length: 100 }, (_, index) => {
    const baseName = `fixture-${index}`;
    return {
      baseName,
      category: index < 90 ? 'first' : 'target',
      keywords: ['sharedword'],
      zhKeywords: [],
      variants: {
        'core-regular': {
          name: `${baseName}-core-regular`,
          style: 'core-regular' as const,
          componentName: `Fixture${index}Regular`,
          webfontClass: `mgc-${baseName}-core-regular`,
          svgPath: `core-regular/${baseName}.svg`,
        },
      },
    };
  });
  const filtered = new IconSearchRepository(fixtures);
  filtered.initialise();
  expect(
    new SearchIconsUseCase(filtered).execute({ query: 'sharedword', category: 'target', limit: 5 }).matches,
  ).toHaveLength(5);
});
