import type {
  IconSearchMatch,
  MingcuteIconSet,
  MingcuteIconStyle,
  MingcuteStyleFilter,
  SearchIconsInput,
} from '../domain/icon.js';
import { IconSearchRepository } from '../infrastructure/search/icon-search.repository.js';

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;

export interface SearchIconsResponse {
  readonly matches: IconSearchMatch[];
  readonly guidance: string;
}

export class SearchIconsUseCase {
  constructor(private readonly repository: IconSearchRepository) {}

  execute(input: SearchIconsInput): SearchIconsResponse {
    const query = input.query.trim();
    if (!query) {
      throw new Error('Search query must not be empty.');
    }

    const style = normaliseStyle(input.style);
    if (input.category && !this.repository.listByCategory(input.category, 'all', 1).length)
      throw new Error('Unknown category. Use list_categories to see available categories.');
    const limit = clampLimit(input.limit);
    const matches = this.repository
      .search({
        query,
        style,
        category: input.category,
        limit,
        locale: input.locale,
      })
      .map((match) => ({
        ...match,
        icon: filterIconVariants(match.icon, style),
      }));

    return {
      matches,
      guidance: buildGuidance(matches, query),
    };
  }
}

export function normaliseStyle(style: MingcuteStyleFilter | undefined): MingcuteIconStyle | 'all' {
  if (!style || style === 'all') {
    return 'all';
  }
  if (style === 'line' || style === 'regular' || style === 'core-regular') return 'core-regular';
  if (style === 'fill' || style === 'filled' || style === 'core-filled') return 'core-filled';
  throw new Error('Style must be core-regular, core-filled, or all.');
}

export function filterIconVariants(icon: MingcuteIconSet, style: MingcuteStyleFilter): MingcuteIconSet {
  if (style === 'all') {
    return icon;
  }

  const variant = icon.variants[style as MingcuteIconStyle];
  return {
    ...icon,
    variants: variant ? { [style]: variant } : {},
  };
}

function clampLimit(limit: number | undefined): number {
  if (!limit) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT);
}

function buildGuidance(matches: IconSearchMatch[], query: string): string {
  if (matches.length === 0) {
    return `No MingCute icons matched "${query}". Try a shorter English or Chinese keyword.`;
  }
  return 'Choose one MingCute icon set first, then choose the regular or filled variant that matches the UI context.';
}
