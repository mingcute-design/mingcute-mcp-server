import FlexSearch, { type Document } from "flexsearch";
import type {
  IconSearchMatch,
  MingcuteIconSet,
  MingcuteIconStyle,
  MingcuteStyleFilter,
} from "../../domain/icon";

interface IndexDocument {
  id: string;
  baseName: string;
  variantNames: string;
  componentNames: string;
  keywords: string;
  zhKeywords: string;
  category: string;
  styles: string;
  [key: string]: string;
}

type DocumentIndex = Document<IndexDocument, false>;

const FIELD_WEIGHTS: Record<string, number> = {
  baseName: 12,
  variantNames: 12,
  keywords: 8,
  zhKeywords: 8,
  componentNames: 4,
  category: 4,
  styles: 2,
};

const EXACT_TOKEN_BONUS = 8;
const PREFIX_TOKEN_BONUS = 3;

export class IconSearchRepository {
  private readonly iconMap = new Map<string, MingcuteIconSet>();
  private readonly tokenMap = new Map<string, Set<string>>();
  private document?: DocumentIndex;

  constructor(private readonly icons: readonly MingcuteIconSet[]) {}

  initialise(): void {
    if (this.document) {
      return;
    }

    const document = new FlexSearch.Document<IndexDocument, false>({
      tokenize: "forward",
      cache: true,
      document: {
        id: "id",
        index: [
          "baseName",
          "variantNames",
          "componentNames",
          "keywords",
          "zhKeywords",
          "category",
          "styles",
        ],
      },
    });

    for (const icon of this.icons) {
      const variants = Object.values(icon.variants);
      const variantNames = variants.map((variant) => variant.name);
      const componentNames = variants.map((variant) => variant.componentName);
      const styles = variants.map((variant) => variant.style);

      document.add({
        id: iconKey(icon),
        baseName: icon.baseName,
        variantNames: variantNames.join(" "),
        componentNames: componentNames.join(" "),
        keywords: icon.keywords.join(" "),
        zhKeywords: icon.zhKeywords.join(" "),
        category: icon.category,
        styles: styles.join(" "),
      });

      this.iconMap.set(iconKey(icon), icon);
      this.tokenMap.set(iconKey(icon), buildTokens(icon));
    }

    this.document = document;
  }

  search(params: {
    query: string;
    style: MingcuteStyleFilter;
    category?: string;
    limit: number;
  }): IconSearchMatch[] {
    if (!this.document) {
      throw new Error("IconSearchRepository must be initialised before searching.");
    }

    const queryTokens = tokenize(params.query);
    const scores = new Map<string, { score: number; matched: Set<string> }>();

    for (const token of queryTokens) {
      const results =
        this.document.search(token, {
          enrich: true,
          limit: Math.max(params.limit * 8, 50),
          suggest: true,
        }) ?? [];

      for (const fieldResult of results) {
        for (const entry of fieldResult.result) {
          const id = resolveIconId(entry);
          const icon = id ? this.iconMap.get(id) : undefined;
          if (!id || !icon || !matchesFilters(icon, params.style, params.category)) {
            continue;
          }

          const current = scores.get(id) ?? { score: 0, matched: new Set<string>() };
          current.score += FIELD_WEIGHTS[fieldResult.field as string] ?? 1;
          applyTokenBonus(current, this.tokenMap.get(id), token);
          scores.set(id, current);
        }
      }
    }

    return Array.from(scores.entries())
      .map(([id, value]) => {
        const icon = this.iconMap.get(id);
        if (!icon) {
          throw new Error(`Missing icon metadata for ${id}`);
        }
        return {
          icon,
          score: Number(value.score.toFixed(2)),
          matchedTokens: Array.from(value.matched).sort((a, b) => a.localeCompare(b)),
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.icon.baseName.localeCompare(b.icon.baseName);
      })
      .slice(0, params.limit);
  }

  getByName(name: string): MingcuteIconSet | undefined {
    const normalized = name.trim().toLowerCase();
    return this.icons.find((icon) => {
      if (icon.baseName.toLowerCase() === normalized) {
        return true;
      }
      return Object.values(icon.variants).some(
        (variant) => variant.name.toLowerCase() === normalized,
      );
    });
  }

  listByCategory(category: string, style: MingcuteStyleFilter, limit: number): MingcuteIconSet[] {
    const normalized = category.trim().toLowerCase();
    return this.icons
      .filter((icon) => icon.category.toLowerCase() === normalized)
      .filter((icon) => matchesStyle(icon, style))
      .slice(0, limit);
  }
}

function iconKey(icon: MingcuteIconSet): string {
  return `${icon.category}/${icon.baseName}`;
}

function matchesFilters(
  icon: MingcuteIconSet,
  style: MingcuteStyleFilter,
  category?: string,
): boolean {
  if (category && icon.category.toLowerCase() !== category.trim().toLowerCase()) {
    return false;
  }
  return matchesStyle(icon, style);
}

function matchesStyle(icon: MingcuteIconSet, style: MingcuteStyleFilter): boolean {
  return style === "all" || Boolean(icon.variants[style as MingcuteIconStyle]);
}

function applyTokenBonus(
  scoreData: { score: number; matched: Set<string> },
  tokens: Set<string> | undefined,
  query: string,
): void {
  if (!tokens) {
    return;
  }

  for (const token of tokens) {
    if (token === query) {
      scoreData.score += EXACT_TOKEN_BONUS;
      scoreData.matched.add(token);
    } else if (token.startsWith(query)) {
      scoreData.score += PREFIX_TOKEN_BONUS;
      scoreData.matched.add(token);
    }
  }
}

function buildTokens(icon: MingcuteIconSet): Set<string> {
  const tokens = new Set<string>();
  for (const value of [
    icon.baseName,
    icon.category,
    ...icon.keywords,
    ...icon.zhKeywords,
    ...Object.values(icon.variants).flatMap((variant) => [
      variant.name,
      variant.componentName,
      variant.webfontClass,
      variant.style,
    ]),
  ]) {
    for (const token of tokenize(value)) {
      tokens.add(token);
    }
  }
  return tokens;
}

function tokenize(value: string): string[] {
  return value
    .split(/[\s_,./\\-]+/u)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

function resolveIconId(entry: unknown): string | undefined {
  if (typeof entry === "string") {
    return entry;
  }
  if (!entry || typeof entry !== "object") {
    return undefined;
  }
  const candidate = entry as { id?: unknown; doc?: { id?: unknown } };
  if (typeof candidate.id === "string") {
    return candidate.id;
  }
  if (typeof candidate.doc?.id === "string") {
    return candidate.doc.id;
  }
  return undefined;
}
