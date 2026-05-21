import { describe, expect, it } from "vitest";
import type { MingcuteIconSet } from "../src/domain/icon";
import { IconSearchRepository } from "../src/infrastructure/search/icon-search.repository";
import { SearchIconsUseCase } from "../src/application/search-icons.usecase";

const icons: MingcuteIconSet[] = [
  {
    baseName: "home_1",
    category: "building",
    keywords: ["dashboard", "home", "house"],
    zhKeywords: ["主页", "房子", "家"],
    variants: {
      line: {
        name: "home_1_line",
        style: "line",
        componentName: "Home1Line",
        webfontClass: "mgc_home_1_line",
        svgPath: "svg/building/home_1_line.svg",
      },
      fill: {
        name: "home_1_fill",
        style: "fill",
        componentName: "Home1Fill",
        webfontClass: "mgc_home_1_fill",
        svgPath: "svg/building/home_1_fill.svg",
      },
    },
  },
  {
    baseName: "search",
    category: "system",
    keywords: ["find", "search"],
    zhKeywords: ["搜索", "查找"],
    variants: {
      line: {
        name: "search_line",
        style: "line",
        componentName: "SearchLine",
        webfontClass: "mgc_search_line",
        svgPath: "svg/system/search_line.svg",
      },
    },
  },
];

describe("SearchIconsUseCase", () => {
  it("searches English and Chinese keywords", () => {
    const repository = new IconSearchRepository(icons);
    repository.initialise();
    const useCase = new SearchIconsUseCase(repository);

    expect(useCase.execute({ query: "home" }).matches[0]?.icon.baseName).toBe("home_1");
    expect(useCase.execute({ query: "搜索" }).matches[0]?.icon.baseName).toBe("search");
  });

  it("filters variants by style", () => {
    const repository = new IconSearchRepository(icons);
    repository.initialise();
    const useCase = new SearchIconsUseCase(repository);

    const result = useCase.execute({ query: "home", style: "fill" });
    expect(result.matches[0]?.icon.variants.line).toBeUndefined();
    expect(result.matches[0]?.icon.variants.fill?.componentName).toBe("Home1Fill");
  });
});
