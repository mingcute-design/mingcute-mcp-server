export type MingcuteIconStyle = 'core-regular' | 'core-filled';
export type MingcuteStyleFilter = MingcuteIconStyle | 'regular' | 'filled' | 'line' | 'fill' | 'all';
export const frameworks = [
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
] as const;
export type UsageFramework = (typeof frameworks)[number];

export interface MingcuteIconVariant {
  readonly name: string;
  readonly style: MingcuteIconStyle;
  readonly componentName: string;
  readonly webfontClass: string;
  readonly svgPath: string;
}
export interface MingcuteIconSet {
  readonly baseName: string;
  readonly category: string;
  readonly keywords: readonly string[];
  readonly zhKeywords: readonly string[];
  readonly variants: Partial<Record<MingcuteIconStyle, MingcuteIconVariant>>;
}
export interface MingcuteCategory {
  readonly name: string;
  readonly iconCount: number;
  readonly variantCount: number;
}
export interface IconSearchMatch {
  readonly icon: MingcuteIconSet;
  readonly score: number;
  readonly matchedTokens: readonly string[];
}
export interface SearchIconsInput {
  readonly query: string;
  readonly style?: MingcuteStyleFilter;
  readonly category?: string;
  readonly limit?: number;
  readonly locale?: 'auto' | 'en' | 'zh';
}
