import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  MingcuteCategory,
  MingcuteIconSet,
  MingcuteIconStyle,
  MingcuteIconVariant,
} from "../domain/icon";
import { parseVariantName, toComponentName, toWebfontClass } from "../domain/name";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_ICON_ROOT = path.resolve(PROJECT_ROOT, "../../MyGithub/MingCute");
const SVG_ROOT = process.env.MINGCUTE_ICONS_ROOT
  ? path.resolve(process.env.MINGCUTE_ICONS_ROOT, "svg")
  : path.join(DEFAULT_ICON_ROOT, "svg");
const KEYWORD_FILE = path.join(PROJECT_ROOT, "src/data/source/keywords.json");
const OUTPUT_ICONS = path.join(PROJECT_ROOT, "src/data/icons.generated.json");
const OUTPUT_CATEGORIES = path.join(PROJECT_ROOT, "src/data/categories.generated.json");

type KeywordMap = Record<string, unknown[]>;

interface MutableIconSet {
  baseName: string;
  category: string;
  keywords: string[];
  zhKeywords: string[];
  variants: Partial<Record<MingcuteIconStyle, MingcuteIconVariant>>;
}

async function main(): Promise<void> {
  const keywordMap = await loadKeywords();
  const iconSets = await buildIconSets(keywordMap);
  const categories = buildCategories(iconSets);

  await fs.mkdir(path.dirname(OUTPUT_ICONS), { recursive: true });
  await fs.writeFile(OUTPUT_ICONS, `${JSON.stringify(iconSets, null, 2)}\n`);
  await fs.writeFile(OUTPUT_CATEGORIES, `${JSON.stringify(categories, null, 2)}\n`);

  console.error(
    `Generated ${iconSets.length} MingCute icon sets and ${categories.length} categories.`,
  );
}

async function loadKeywords(): Promise<KeywordMap> {
  const content = await fs.readFile(KEYWORD_FILE, "utf8");
  return JSON.parse(content) as KeywordMap;
}

async function buildIconSets(keywordMap: KeywordMap): Promise<MingcuteIconSet[]> {
  const icons = new Map<string, MutableIconSet>();
  const categories = await fs.readdir(SVG_ROOT, { withFileTypes: true });

  for (const categoryEntry of categories) {
    if (!categoryEntry.isDirectory()) {
      continue;
    }

    const category = categoryEntry.name;
    const categoryDir = path.join(SVG_ROOT, category);
    const files = await fs.readdir(categoryDir, { withFileTypes: true });

    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith(".svg")) {
        continue;
      }

      const name = path.basename(file.name, ".svg");
      const parsed = parseVariantName(name);
      if (!parsed) {
        continue;
      }

      const key = `${category}/${parsed.baseName}`;
      const existing =
        icons.get(key) ?? createIconSet(parsed.baseName, category, keywordMap[parsed.baseName]);

      existing.variants[parsed.style] = {
        name,
        style: parsed.style,
        componentName: toComponentName(parsed.baseName, parsed.style),
        webfontClass: toWebfontClass(name),
        svgPath: path.posix.join("svg", category, file.name),
      };

      icons.set(key, existing);
    }
  }

  return Array.from(icons.values())
    .sort((a, b) => {
      const byCategory = a.category.localeCompare(b.category);
      return byCategory || a.baseName.localeCompare(b.baseName);
    })
    .map((icon) => ({
      baseName: icon.baseName,
      category: icon.category,
      keywords: icon.keywords,
      zhKeywords: icon.zhKeywords,
      variants: sortVariants(icon.variants),
    }));
}

function createIconSet(
  baseName: string,
  category: string,
  keywords: unknown[] | undefined,
): MutableIconSet {
  const split = splitKeywords(keywords ?? []);
  return {
    baseName,
    category,
    keywords: split.en,
    zhKeywords: split.zh,
    variants: {},
  };
}

function splitKeywords(keywords: unknown[]): { en: string[]; zh: string[] } {
  const en = new Set<string>();
  const zh = new Set<string>();

  for (const keyword of keywords) {
    if (typeof keyword !== "string") {
      continue;
    }

    const normalized = keyword.trim();
    if (!normalized) {
      continue;
    }

    if (/\p{Script=Han}/u.test(normalized)) {
      zh.add(normalized);
    } else {
      en.add(normalized.toLowerCase());
    }
  }

  return {
    en: Array.from(en).sort((a, b) => a.localeCompare(b)),
    zh: Array.from(zh).sort((a, b) => a.localeCompare(b, "zh-CN")),
  };
}

function sortVariants(
  variants: Partial<Record<MingcuteIconStyle, MingcuteIconVariant>>,
): Partial<Record<MingcuteIconStyle, MingcuteIconVariant>> {
  const sorted: Partial<Record<MingcuteIconStyle, MingcuteIconVariant>> = {};
  if (variants.line) {
    sorted.line = variants.line;
  }
  if (variants.fill) {
    sorted.fill = variants.fill;
  }
  return sorted;
}

function buildCategories(iconSets: MingcuteIconSet[]): MingcuteCategory[] {
  const categoryMap = new Map<string, { iconCount: number; variantCount: number }>();

  for (const icon of iconSets) {
    const current = categoryMap.get(icon.category) ?? { iconCount: 0, variantCount: 0 };
    current.iconCount += 1;
    current.variantCount += Object.keys(icon.variants).length;
    categoryMap.set(icon.category, current);
  }

  return Array.from(categoryMap.entries())
    .map(([name, counts]) => ({ name, ...counts }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
