import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { z } from "zod";
import { GetIconUseCase } from "../../application/get-icon.usecase";
import { SearchIconsUseCase } from "../../application/search-icons.usecase";
import { UsageExamples } from "../../application/usage-examples";
import type { MingcuteStyleFilter, UsageFramework } from "../../domain/icon";
import { loadCategories, loadIconSets } from "../../infrastructure/data/icon-loader";
import { IconSearchRepository } from "../../infrastructure/search/icon-search.repository";

const styleSchema = z.enum(["line", "fill", "all"]).default("all");
const frameworkSchema = z.enum(["react", "vue", "webfont", "svg"]);

export async function startMcpServer(): Promise<void> {
  const server = new McpServer({
    name: "mingcute-icon-mcp",
    version: "0.1.0",
  });

  const icons = loadIconSets();
  const categories = loadCategories();
  const repository = new IconSearchRepository(icons);
  repository.initialise();

  const searchIcons = new SearchIconsUseCase(repository);
  const getIcon = new GetIconUseCase(repository);
  const usageExamples = new UsageExamples(repository);

  server.registerTool(
    "search_icons",
    {
      title: "Search MingCute icons",
      description:
        "Search MingCute icons by English or Chinese keywords, icon name, component name, category, and style. MingCute icons have line and fill variants.",
      inputSchema: {
        query: z.string().min(1).describe("Search query, such as home, 主页, arrow, settings"),
        style: styleSchema.describe("Variant style: line, fill, or all"),
        category: z.string().optional().describe("Optional MingCute category filter"),
        limit: z.number().min(1).max(50).default(5).describe("Maximum results to return"),
        locale: z.enum(["auto", "en", "zh"]).default("auto").describe("Query language hint"),
      },
    },
    async (input) => {
      try {
        const result = searchIcons.execute({
          query: input.query,
          style: input.style as MingcuteStyleFilter,
          category: input.category,
          limit: input.limit,
          locale: input.locale,
        });

        return createJsonResponse({
          guidance: result.guidance,
          matches: result.matches,
        });
      } catch (error) {
        return createErrorResponse(error);
      }
    },
  );

  server.registerTool(
    "get_icon",
    {
      title: "Get MingCute icon details",
      description: "Get one MingCute icon set by base name or variant name, optionally including SVG.",
      inputSchema: {
        name: z.string().min(1).describe("Base name like home_1 or variant name like home_1_line"),
        style: styleSchema.describe("Variant style: line, fill, or all"),
        includeSvg: z.boolean().default(false).describe("Include SVG source in the response"),
      },
    },
    async (input) => {
      try {
        const result = await getIcon.execute({
          name: input.name,
          style: input.style as MingcuteStyleFilter,
          includeSvg: input.includeSvg,
        });
        return createJsonResponse(result);
      } catch (error) {
        return createErrorResponse(error);
      }
    },
  );

  server.registerTool(
    "get_icon_usage",
    {
      title: "Get MingCute icon usage",
      description:
        "Generate usage examples for React, Vue, webfont, or SVG workflows using the published MingCute npm packages.",
      inputSchema: {
        name: z.string().min(1).describe("Base name like home_1 or variant name like home_1_line"),
        style: styleSchema.describe("Variant style. Defaults to line when all is used."),
        framework: frameworkSchema.describe("Target usage format"),
      },
    },
    async (input) => {
      try {
        const text = usageExamples.execute({
          name: input.name,
          style: input.style as MingcuteStyleFilter,
          framework: input.framework as UsageFramework,
        });
        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (error) {
        return createErrorResponse(error);
      }
    },
  );

  server.registerTool(
    "list_categories",
    {
      title: "List MingCute categories",
      description: "List all MingCute icon categories with icon and variant counts.",
      inputSchema: {},
    },
    async () => createJsonResponse({ categories }),
  );

  server.registerTool(
    "list_icons_by_category",
    {
      title: "List MingCute icons by category",
      description: "List MingCute icon sets in a category, optionally filtered by line or fill style.",
      inputSchema: {
        category: z.string().min(1).describe("MingCute category name"),
        style: styleSchema.describe("Variant style: line, fill, or all"),
        limit: z.number().min(1).max(200).default(20).describe("Maximum results to return"),
      },
    },
    async (input) => {
      try {
        const result = repository
          .listByCategory(input.category, input.style as MingcuteStyleFilter, input.limit)
          .map((icon) => ({
            ...icon,
            variants: filterVariantsForResponse(icon.variants, input.style as MingcuteStyleFilter),
          }));
        return createJsonResponse({ icons: result, count: result.length });
      } catch (error) {
        return createErrorResponse(error);
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function createJsonResponse(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function filterVariantsForResponse<T>(
  variants: Partial<Record<"line" | "fill", T>>,
  style: MingcuteStyleFilter,
): Partial<Record<"line" | "fill", T>> {
  if (style === "all") {
    return variants;
  }
  const variant = variants[style];
  return variant ? { [style]: variant } : {};
}

function createErrorResponse(error: unknown) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: error instanceof Error ? error.message : "Unknown error",
      },
    ],
  };
}
