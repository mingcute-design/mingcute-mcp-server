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
  it("generates React and Vue examples", () => {
    const repository = new IconSearchRepository(icons);
    repository.initialise();
    const usage = new UsageExamples(repository);

    expect(usage.execute({ name: "home_1", style: "line", framework: "react" })).toContain(
      "import { Home1Line } from '@mingcute/react';",
    );
    expect(usage.execute({ name: "home_1", style: "line", framework: "vue" })).toContain(
      "import { Home1Line } from '@mingcute/vue';",
    );
  });
});
