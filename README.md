# MingCute MCP

[English](README.md) | [简体中文](README.zh-CN.md)

An MCP server that helps AI coding assistants find MingCute icons and generate working code examples.

Search by icon name, component name, or English and Chinese keywords. Retrieve SVGs and get usage examples for your framework directly from your assistant.

The server includes the complete **MingCute Free 3.1.0** catalogue: **2,263 icons** in **Core Regular** and **Core Filled**, for a total of **4,526 SVG variants**. After installation, icon searches and SVG retrieval work locally without an account or network connection.

## Features

- Search by keyword, filename, component name, category, and style.
- Retrieve the original SVG for any icon in the bundled Free catalogue.
- Generate examples for React, Vue, React Native, Svelte, SolidJS, Vanilla JS, Web Components, SVG files, icon fonts, and icon data.
- Browse categories with pagination.
- Inspect the catalogue version, source commit, and icon counts.

## Requirements

- **Node.js 22.12 or newer**, with npm and npx available.
- An MCP client that supports local servers using the stdio transport.
- An internet connection for the initial package installation.

## Quick start

Configure a local stdio server with the command `npx` and the arguments `-y`, `@mingcute/mcp-server@latest`. For clients that use an `mcpServers` JSON configuration:

```json
{
  "mcpServers": {
    "mingcute": {
      "command": "npx",
      "args": ["-y", "@mingcute/mcp-server@latest"]
    }
  }
}
```

Save the configuration and connect or restart the server in your client. The configuration file location depends on the client you use.

You can then ask your assistant:

> Find a home icon from MingCute and show me how to use the regular version in React.

> Search for settings icons and return the filled SVG for the best match.

> Find an icon for 主页 and show me the Vue example.

To use a fixed release, replace `@latest` with `@0.2.0` in the configuration.

### Run from Terminal

```bash
npx -y @mingcute/mcp-server@latest
```

This starts a stdio MCP server. It waits for requests from an MCP client and does not open a browser or display an interactive menu.

## Available tools

Your assistant calls these tools through the MCP client. The JSON examples below show tool arguments, not Terminal commands.

| Tool | Description |
| --- | --- |
| `search_icons` | Search icons and return compact matches with current names and styles. |
| `get_icon` | Retrieve icon metadata and optionally raw SVG. |
| `get_icon_usage` | Generate installation commands and framework usage examples. |
| `list_categories` | List available categories, icon counts, and catalogue details. |
| `list_icons_by_category` | Browse icons in a category using pagination. |

All tools are read-only. Results include structured JSON and a text representation.

### Search for icons

Tool: `search_icons`

```json
{
  "query": "home",
  "style": "core-regular",
  "limit": 5,
  "locale": "auto"
}
```

Use `category` to narrow the search to a category returned by `list_categories`. Search returns up to 50 matches per call, with a default of 5.

The `locale` option selects keyword fields:

| Value | Keyword language |
| --- | --- |
| `auto` | English and Chinese. This is the default. |
| `en` | English. |
| `zh` | Chinese. |

Icon names, component names, and categories remain searchable in all three modes.

### Retrieve an SVG

Tool: `get_icon`

```json
{
  "name": "Home1Filled",
  "includeSvg": true
}
```

`includeSvg` defaults to `false`. Set it to `true` to receive the bundled SVG source with the icon metadata.

### Generate a usage example

Tool: `get_icon_usage`

```json
{
  "name": "home-1",
  "style": "core-regular",
  "framework": "react"
}
```

The response includes the package installation command and a code example using the current package exports. For React, the icon import is:

```tsx
import { Home1Regular } from '@mingcute/react/core-regular';

<Home1Regular size={24} title="Home" />
```

Supported formats:

| `framework` value | Package |
| --- | --- |
| `react` | `@mingcute/react` |
| `vue` | `@mingcute/vue` |
| `react-native` | `@mingcute/react-native` |
| `svelte` | `@mingcute/svelte` |
| `solid` | `@mingcute/solid` |
| `vanilla` | `@mingcute/vanilla` |
| `web-components` | `@mingcute/web-components` |
| `svg` | `@mingcute/svg` |
| `webfont` | `@mingcute/font` |
| `data` | `@mingcute/icons` |

SVG URL examples use Vite's `?url` import convention. With other bundlers, configure SVG asset imports or retrieve inline SVG with `get_icon`.

### Browse a category

Call `list_categories` with no arguments to see the current category names. Then call `list_icons_by_category`:

```json
{
  "category": "buildings",
  "style": "all",
  "limit": 20,
  "offset": 0
}
```

The response includes `total`, `count`, and `nextOffset`. Use `nextOffset` as the next request's `offset` until it is `null`. The default page size is 20, with a maximum of 100.

## Icon names and styles

Use `core-regular`, `core-filled`, or `all` for `style`. The default is `all`.

The server also accepts `regular` and `line` for Core Regular, and `filled` and `fill` for Core Filled.

Examples of supported icon identifiers:

| Identifier | Selection |
| --- | --- |
| `home-1` or `home_1` | Icon identity; use `style` to select a variant. |
| `home-1.svg` | Icon filename; use `style` to select a variant. |
| `Home1Regular` | Core Regular component. |
| `Home1Filled` | Core Filled component. |
| `home-1-core-filled` | Core Filled variant. |
| `core-filled/home-1.svg` | Core Filled SVG path. |

For details and usage requests, a component or variant name selects its own style. A conflicting `style` returns an error. A base name with `all` returns both variants in `get_icon`; usage examples default to Core Regular.

## Catalogue resource

MCP clients that support resources can read:

```text
mingcute://catalogue
```

This resource contains the Free source version, commit, verification hashes, category counts, and available styles.

## MingCute Pro

This server searches the Free catalogue and generates Free package examples. For licensed Pro packages, use the MingCute CLI:

```bash
npx @mingcute/cli@latest
```

The MCP server does not validate Pro licenses or search installed Pro packages.

## Development

Clone the repository and install its dependencies:

```bash
git clone https://github.com/mingcute-design/mingcute-mcp-server.git mingcute-mcp
cd mingcute-mcp
npm ci
```

| Command | Purpose |
| --- | --- |
| `npm run build` | Compile the server to `dist/`. |
| `npm test` | Run the test suite once. |
| `npm run test:watch` | Run tests in watch mode. |
| `npm run check` | Run type checks, tests, a build, and packed-server integration checks. |
| `npm run verify:published` | Verify generated examples and paths against the ten published Free packages. |
| `npm audit --omit=dev --audit-level=high` | Check production dependency advisories. |

The packed-server check installs the npm archive into a temporary project and calls the actual stdio server. It covers all five tools, ten usage formats, SVG retrieval, pagination, input validation, version reporting, and the catalogue resource. Installation and published-package checks require network access.

### Update the icon catalogue

Place a checkout of [MingCute Icons](https://github.com/mingcute-design/mingcute-icons) beside this repository, then run:

```bash
npm run build:data -- --source ../mingcute-icons
npm run build:data -- --source ../mingcute-icons --check
npm run check
npm run verify:published
```

The generator verifies SVGs against the Free source manifest and reads exact names from its package metadata. It parses the current Free keyword file without executing JavaScript and merges the reviewed keywords in `src/data/source/keywords.json`.

When updating the source version, update the pinned Free commit in both GitHub workflows. Commit the generated data and update the documented version and counts together.

## Upgrading from 0.1.x

- Upgrade Node.js to 22.12 or newer.
- Use current icon names, style names, and package imports in generated examples.
- Read usage responses through the `framework` and `example` fields.
- Use pagination for category browsing.
- Remove `MINGCUTE_ICONS_ROOT` from your configuration. SVGs are now bundled.

Existing tool names and legacy style aliases remain supported. See the [changelog](https://github.com/mingcute-design/mingcute-mcp-server/blob/main/CHANGELOG.md) for release changes.

## Support

Report bugs and request features through [GitHub Issues](https://github.com/mingcute-design/mingcute-mcp-server/issues). Include your Node.js version, MCP client, server version, and steps to reproduce the issue.

Visit [MingCute](https://www.mingcute.com/) for the icon library and design resources.

## License

The MCP server and bundled MingCute Free artwork are licensed under [Apache-2.0](LICENSE). The artwork comes from [MingCute Icons](https://github.com/mingcute-design/mingcute-icons).

MingCute Pro artwork is distributed separately under its commercial license.
