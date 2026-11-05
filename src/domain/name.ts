import type { MingcuteIconStyle } from './icon.js';

export function normalizeName(value: string): string {
  return value
    .trim()
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

export function parseVariantName(name: string): { baseName: string; style: MingcuteIconStyle } | undefined {
  const match = /^(.*?)(?:[_-](?:core[_-])?)(regular|filled|line|fill)$/i.exec(name);
  if (!match?.[1]) return undefined;
  return {
    baseName: match[1],
    style: ['line', 'regular'].includes(match[2].toLowerCase()) ? 'core-regular' : 'core-filled',
  };
}
