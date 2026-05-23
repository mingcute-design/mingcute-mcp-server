import { describe, expect, it } from "vitest";
import type { MingcuteIconSet } from "../src/domain/icon";
import { UsageExamples } from "../src/application/usage-examples";
import { IconSearchRepository } from "../src/infrastructure/search/icon-search.repository";

const icons: MingcuteIconSet[] = [
  {
    baseName: "home_1",
    category: "building",
    keywords: ["home"],
    zhKeywords: ["主页"],
    variants: {
      line: {
        name: "home_1_line",
        style: "line",
        componentName: "Home1Line",
        webfontClass: "mgc_home_1_line",
        svgPath: "svg/building/home_1_line.svg",
      },
    },
  },
];

describe("UsageExamples", () => {
  it("generates usage examples with the published npm packages", () => {
    const repository = new IconSearchRepository(icons);
    repository.initialise();
    const usage = new UsageExamples(repository);

    const reactUsage = usage.execute({ name: "home_1", style: "line", framework: "react" });
    expect(reactUsage).toContain("npm install @mingcute/react");
    expect(reactUsage).toContain(
      "import { Home1Line } from '@mingcute/react';",
    );

    const vueUsage = usage.execute({ name: "home_1", style: "line", framework: "vue" });
    expect(vueUsage).toContain("npm install @mingcute/vue");
    expect(vueUsage).toContain(
      "import { Home1Line } from '@mingcute/vue';",
    );

    const webfontUsage = usage.execute({ name: "home_1", style: "line", framework: "webfont" });
    expect(webfontUsage).toContain("npm install mingcute_icon");
    expect(webfontUsage).toContain("import 'mingcute_icon/font/Mingcute.css';");
    expect(webfontUsage).toContain('<span class="mgc_home_1_line"></span>');

    const svgUsage = usage.execute({ name: "home_1", style: "line", framework: "svg" });
    expect(svgUsage).toContain("npm install mingcute_icon");
    expect(svgUsage).toContain("import iconUrl from 'mingcute_icon/svg/building/home_1_line.svg';");
  });
});
