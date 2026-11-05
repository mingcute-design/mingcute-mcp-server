import { readFileSync } from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { GetIconUseCase } from '../../application/get-icon.usecase.js';
import { SearchIconsUseCase, normaliseStyle } from '../../application/search-icons.usecase.js';
import { UsageExamples } from '../../application/usage-examples.js';
import { frameworks } from '../../domain/icon.js';
import { loadCategories, loadIconSets, loadCatalogue } from '../../infrastructure/data/icon-loader.js';
import { IconSearchRepository } from '../../infrastructure/search/icon-search.repository.js';

const styles = z
  .enum(['core-regular', 'core-filled', 'regular', 'filled', 'line', 'fill', 'all'])
  .default('all');
const name = z.string().trim().min(1).max(160);
const category = z.string().trim().min(1).max(80);
const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};
function response(data: Record<string, unknown>) {
  return { structuredContent: data, content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
function protect<T>(
  handler: (input: T) => Promise<ReturnType<typeof response>> | ReturnType<typeof response>,
) {
  return async (input: T) => {
    try {
      return await handler(input);
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: error instanceof Error ? error.message : 'Unable to complete the icon request.',
          },
        ],
      };
    }
  };
}
export function createMcpServer() {
  const { version } = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'));
  const server = new McpServer(
    { name: 'mingcute-mcp', version },
    {
      instructions:
        'Search the bundled MingCute Free catalogue first. Use returned canonical names and style-specific imports. Fetch details or usage only for chosen icons. All tools are read-only. Pro icons are not included; customers can install licensed Pro packages through @mingcute/cli.',
    },
  );
  const repository = new IconSearchRepository(loadIconSets());
  repository.initialise();
  const search = new SearchIconsUseCase(repository);
  const get = new GetIconUseCase(repository);
  const usage = new UsageExamples(repository);
  const categories = loadCategories();
  server.registerTool(
    'search_icons',
    {
      title: 'Search MingCute Free icons',
      description:
        'Find current icons by English or Chinese keyword, canonical filename, or component name. Returns compact results; use get_icon for full metadata.',
      annotations,
      inputSchema: {
        query: z.string().trim().min(1).max(200),
        style: styles,
        category: category.optional(),
        limit: z.number().int().min(1).max(50).default(5),
        locale: z.enum(['auto', 'en', 'zh']).default('auto'),
      },
    },
    protect(async (input) => {
      const result = search.execute(input);
      return response({
        catalogue: loadCatalogue(),
        guidance: result.guidance,
        matches: result.matches.map(({ icon, score }) => ({
          name: icon.baseName,
          category: icon.category,
          score,
          variants: Object.values(icon.variants).map((v) => ({
            name: v.name,
            style: v.style,
            componentName: v.componentName,
          })),
        })),
      });
    }),
  );
  server.registerTool(
    'get_icon',
    {
      title: 'Get MingCute icon',
      description:
        'Get current metadata and optionally bundled SVG. A variant or component name implies its style; conflicting styles are rejected.',
      annotations,
      inputSchema: { name, style: styles, includeSvg: z.boolean().default(false) },
    },
    protect(async (input) => response({ ...(await get.execute(input)) })),
  );
  server.registerTool(
    'get_icon_usage',
    {
      title: 'Get MingCute usage',
      description:
        'Generate current Free package installation and usage examples for the requested framework. SVG URL examples identify their bundler requirement.',
      annotations,
      inputSchema: { name, style: styles, framework: z.enum(frameworks) },
    },
    protect((input) => response({ framework: input.framework, example: usage.execute(input) })),
  );
  server.registerTool(
    'list_categories',
    {
      title: 'List MingCute categories',
      description: 'List available Free categories, counts, and source catalogue version.',
      annotations,
      inputSchema: {},
    },
    async () => response({ catalogue: loadCatalogue(), categories }),
  );
  server.registerTool(
    'list_icons_by_category',
    {
      title: 'List icons by category',
      description: 'Browse a category with offset pagination. Use nextOffset until it is null.',
      annotations,
      inputSchema: {
        category,
        style: styles,
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).max(10000).default(0),
      },
    },
    protect((input) => {
      if (!categories.some((c) => c.name === input.category.toLowerCase()))
        throw new Error('Unknown category. Use list_categories.');
      const all = repository.listByCategory(
        input.category,
        normaliseStyle(input.style),
        Number.MAX_SAFE_INTEGER,
      );
      const icons = all.slice(input.offset, input.offset + input.limit).map((icon) => ({
        name: icon.baseName,
        variants: Object.values(icon.variants)
          .filter((v) => normaliseStyle(input.style) === 'all' || v.style === normaliseStyle(input.style))
          .map((v) => ({ name: v.name, style: v.style, componentName: v.componentName })),
      }));
      return response({
        icons,
        total: all.length,
        count: icons.length,
        offset: input.offset,
        nextOffset: input.offset + icons.length < all.length ? input.offset + icons.length : null,
      });
    }),
  );
  server.registerResource(
    'catalogue',
    'mingcute://catalogue',
    {
      mimeType: 'application/json',
      description: 'Bundled Free icon catalogue provenance and category counts',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ catalogue: loadCatalogue(), categories }),
        },
      ],
    }),
  );
  return server;
}
export async function startMcpServer(): Promise<void> {
  await createMcpServer().connect(new StdioServerTransport());
}
