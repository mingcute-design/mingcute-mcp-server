import { describe, expect, it } from 'vitest';
import { normalizeName, parseVariantName } from '../src/domain/name.js';
describe('canonical names', () => {
  it('recognizes current styles and legacy style aliases', () => {
    expect(parseVariantName('home-1-core-filled')).toEqual({ baseName: 'home-1', style: 'core-filled' });
    expect(parseVariantName('home_1_line')).toEqual({ baseName: 'home_1', style: 'core-regular' });
    expect(parseVariantName('HOME_1_LINE')?.style).toBe('core-regular');
    expect(normalizeName('Home1Regular')).toBe('home1regular');
  });
});
