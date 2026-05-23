import type {
  MingcuteIconSet,
  MingcuteIconStyle,
  MingcuteStyleFilter,
  UsageFramework,
} from "../domain/icon";
import { IconSearchRepository } from "../infrastructure/search/icon-search.repository";
import { normaliseStyle } from "./search-icons.usecase";

export interface GetUsageInput {
  readonly name: string;
  readonly style?: MingcuteStyleFilter;
  readonly framework: UsageFramework;
}

export class UsageExamples {
  constructor(private readonly repository: IconSearchRepository) {}

  execute(input: GetUsageInput): string {
    const icon = this.repository.getByName(input.name);
    if (!icon) {
      throw new Error(`MingCute icon "${input.name}" was not found.`);
    }

    const style = pickStyle(icon, normaliseStyle(input.style));
    const variant = icon.variants[style];
    if (!variant) {
      throw new Error(`MingCute icon "${icon.baseName}" does not have a ${style} variant.`);
    }

    switch (input.framework) {
      case "react":
        return `npm install @mingcute/react\n\nimport { ${variant.componentName} } from '@mingcute/react';\n\n<${variant.componentName} size={24} color="currentColor" />`;
      case "vue":
        return `npm install @mingcute/vue\n\n<script setup>\nimport { ${variant.componentName} } from '@mingcute/vue';\n</script>\n\n<template>\n  <${variant.componentName} :size="24" color="currentColor" />\n</template>`;
      case "webfont":
        return `npm install mingcute_icon\n\nimport 'mingcute_icon/font/Mingcute.css';\n\n<span class="${variant.webfontClass}"></span>`;
      case "svg":
        return `npm install mingcute_icon\n\nimport iconUrl from 'mingcute_icon/${variant.svgPath}';\n\n<img src={iconUrl} alt="" width={24} height={24} />\n\nOr call get_icon with includeSvg=true to get the raw SVG source.`;
      default:
        throw new Error("Framework must be one of: react, vue, webfont, svg.");
    }
  }
}

function pickStyle(icon: MingcuteIconSet, style: MingcuteStyleFilter): MingcuteIconStyle {
  if (style === "line" || style === "fill") {
    return style;
  }
  if (icon.variants.line) {
    return "line";
  }
  if (icon.variants.fill) {
    return "fill";
  }
  throw new Error(`MingCute icon "${icon.baseName}" has no usable variants.`);
}
