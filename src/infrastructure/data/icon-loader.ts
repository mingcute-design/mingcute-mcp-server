import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import icons from "../../data/icons.generated.json";
import categories from "../../data/categories.generated.json";
import type { MingcuteCategory, MingcuteIconSet } from "../../domain/icon";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const DEFAULT_ICON_ROOT = path.resolve(PROJECT_ROOT, "../../MyGithub/MingCute");

export function loadIconSets(): MingcuteIconSet[] {
  return icons as MingcuteIconSet[];
}

export function loadCategories(): MingcuteCategory[] {
  return categories as MingcuteCategory[];
}

export async function readSvg(svgPath: string): Promise<string> {
  const iconRoot = process.env.MINGCUTE_ICONS_ROOT
    ? path.resolve(process.env.MINGCUTE_ICONS_ROOT)
    : DEFAULT_ICON_ROOT;
  const absolutePath = path.resolve(iconRoot, svgPath);
  return fs.readFile(absolutePath, "utf8");
}
