import icons from '../../data/icons.generated.json' with { type: 'json' };
import categories from '../../data/categories.generated.json' with { type: 'json' };
import svgs from '../../data/svgs.generated.json' with { type: 'json' };
import catalogue from '../../data/catalogue.generated.json' with { type: 'json' };
import type { MingcuteCategory, MingcuteIconSet } from '../../domain/icon.js';

export function loadIconSets(): MingcuteIconSet[] {
  return icons as MingcuteIconSet[];
}
export function loadCategories(): MingcuteCategory[] {
  return categories as MingcuteCategory[];
}
export function loadCatalogue() {
  return catalogue;
}
export async function readSvg(svgPath: string): Promise<string> {
  if (!Object.hasOwn(svgs, svgPath)) throw new Error('SVG is not part of the bundled Free catalogue.');
  return svgs[svgPath as keyof typeof svgs];
}
