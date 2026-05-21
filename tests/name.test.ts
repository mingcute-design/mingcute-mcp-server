import { describe, expect, it } from "vitest";
import { parseVariantName, toComponentName, toWebfontClass } from "../src/domain/name";

describe("MingCute name helpers", () => {
  it("parses line and fill variant names", () => {
    expect(parseVariantName("home_1_line")).toEqual({
      baseName: "home_1",
      style: "line",
    });
    expect(parseVariantName("home_1_fill")).toEqual({
      baseName: "home_1",
      style: "fill",
    });
  });

  it("converts icon names to component names and webfont classes", () => {
    expect(toComponentName("home_1", "line")).toBe("Home1Line");
    expect(toComponentName("home_1", "fill")).toBe("Home1Fill");
    expect(toWebfontClass("home_1_line")).toBe("mgc_home_1_line");
  });
});
