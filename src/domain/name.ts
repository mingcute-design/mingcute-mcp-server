import type { MingcuteIconStyle } from "./icon";

export function parseVariantName(
  iconName: string,
): { baseName: string; style: MingcuteIconStyle } | undefined {
  if (iconName.endsWith("_line")) {
    return { baseName: iconName.slice(0, -"_line".length), style: "line" };
  }

  if (iconName.endsWith("_fill")) {
    return { baseName: iconName.slice(0, -"_fill".length), style: "fill" };
  }

  return undefined;
}

export function toPascalCase(name: string): string {
  return name
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function toComponentName(baseName: string, style: MingcuteIconStyle): string {
  return `${toPascalCase(baseName)}${style === "line" ? "Line" : "Fill"}`;
}

export function toWebfontClass(iconName: string): string {
  return `mgc_${iconName}`;
}
