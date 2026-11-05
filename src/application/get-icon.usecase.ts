import type { MingcuteIconSet, MingcuteIconStyle, MingcuteStyleFilter } from '../domain/icon.js';
import { readSvg } from '../infrastructure/data/icon-loader.js';
import { IconSearchRepository } from '../infrastructure/search/icon-search.repository.js';
import { filterIconVariants, normaliseStyle } from './search-icons.usecase.js';

export function resolveIcon(repository: IconSearchRepository, name: string, requested?: MingcuteStyleFilter) {
  const icon = repository.getByName(name);
  if (!icon)
    throw new Error(`MingCute icon "${name}" was not found. Use search_icons to find its current name.`);
  const namedStyle = repository.resolveStyle(name);
  const style = normaliseStyle(requested);
  if (namedStyle && style !== 'all' && style !== namedStyle)
    throw new Error('The icon name and requested style conflict.');
  const selected = namedStyle ?? style;
  if (selected !== 'all' && !icon.variants[selected])
    throw new Error('This icon does not have the requested style.');
  return { icon, style: selected };
}

export class GetIconUseCase {
  constructor(private readonly repository: IconSearchRepository) {}
  async execute(input: {
    name: string;
    style?: MingcuteStyleFilter;
    includeSvg?: boolean;
  }): Promise<{ icon: MingcuteIconSet; svg?: Partial<Record<MingcuteIconStyle, string>> }> {
    const { icon, style } = resolveIcon(this.repository, input.name, input.style);
    const response: { icon: MingcuteIconSet; svg?: Partial<Record<MingcuteIconStyle, string>> } = {
      icon: filterIconVariants(icon, style),
    };
    if (input.includeSvg) {
      response.svg = {};
      for (const variant of Object.values(response.icon.variants))
        response.svg[variant.style] = await readSvg(variant.svgPath);
    }
    return response;
  }
}
