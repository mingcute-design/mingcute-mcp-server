# MingCute MCP

Search and use MingCute Free icons from MCP-compatible coding assistants. The server runs locally over stdio and includes the complete Free 3.1.0 catalogue: **2,263 icons, 4,526 SVG variants**, and English/Chinese search keywords. SVG retrieval needs no source checkout, account, or network connection.

## Setup

Requires **Node.js 22.12 or newer**. Installing the npm package requires network access; subsequent server requests use bundled data.

```bash
npx -y @mingcute/mcp-server
```

Add this stdio configuration to your MCP client:

```json
{
  "mcpServers": {
    "mingcute": {
      "command": "npx",
      "args": ["-y", "@mingcute/mcp-server"]
    }
  }
}
```

For a reproducible deployment, pin the package version in `args`. Client configuration locations differ; use your client's MCP settings.

## Tools

| Tool | Purpose |
| --- | --- |
| `search_icons` | Find icons by English/Chinese keywords, filename, or component name; compact results |
| `get_icon` | Fetch metadata and optionally raw SVG with `includeSvg: true` |
| `get_icon_usage` | Generate installation commands and framework examples |
| `list_categories` | Inspect categories, counts, and source version |
| `list_icons_by_category` | Browse a category with `limit` and `offset` pagination |

All tools are read-only and return structured JSON alongside a text representation. `mingcute://catalogue` is a read-only resource exposing source provenance and category counts.

### Search and retrieve

```json
{"query":"home","style":"core-regular","limit":5,"locale":"auto"}
```

Canonical styles are `core-regular`, `core-filled`, and `all`. `regular`/`line` and `filled`/`fill` remain accepted style aliases. Canonical filenames, underscore spelling, and component names can identify an icon: `home-1`, `home_1`, `Home1Regular`, or `home-1-core-filled`.

```json
{"name":"Home1Filled","includeSvg":true}
```

A variant or component name selects its own style. An explicitly conflicting style returns an error. A base name with `all` returns both styles. Unknown icon names and categories return actionable errors.

Search `locale` controls keyword fields: `auto` searches both languages, `en` uses English keyword fields, and `zh` uses Chinese keyword fields. Names, component names, and category fields remain searchable in each mode.

### Framework usage

```json
{"name":"home-1","style":"core-regular","framework":"react"}
```

Supported frameworks/formats: `react`, `vue`, `react-native`, `svelte`, `solid`, `vanilla`, `web-components`, `webfont`, `svg`, and `data`.

Current React examples use style entry points:

```tsx
import { Home1Regular } from '@mingcute/react/core-regular';

<Home1Regular size={24} title="Home" />
```

SVG asset URL examples use Vite's `?url` convention and state that requirement. Other bundlers can configure SVG asset imports or use `get_icon` to retrieve inline SVG. Webfont examples use `@mingcute/font` and mark decorative icons as hidden from assistive technology.

### Category pagination

```json
{"category":"buildings","style":"all","limit":20,"offset":0}
```

Continue with the returned `nextOffset` until it is `null`. The response includes `total` and `count`; it never silently implies a truncated page is the whole category.

## Catalogue updates

The checked-in generated catalogue is built exclusively from the public Free source. It records the package version, Git commit, manifest SHA-256, icon counts, and styles. The generator checks each SVG against its source manifest hash and uses published package metadata for exact component names and filenames.

```bash
npm ci
npm run build:data -- --source ../mingcute-icons
npm run build:data -- --source ../mingcute-icons --check
npm run check
```

Update the pinned Free commit in both workflows when updating the catalogue. The generator parses the current Free keyword file without executing JavaScript, then merges reviewed English/Chinese keywords in `src/data/source/keywords.json`; icons without translations still remain searchable by name, component name, and category.

## Development and verification

```bash
npm ci
npm run check
npm audit --omit=dev --audit-level=high
npm run verify:published
```

`check` runs TypeScript checks, unit tests, compilation, and a fresh installation of the packed npm archive in a temporary directory. The packed-artifact check starts the actual stdio server and tests all five tools, ten framework examples, SVG delivery, pagination, validation, version reporting, and the catalogue resource. This installation check needs network access to resolve production dependencies. `verify:published` additionally checks every advertised component export, SVG path, and font class against all ten actual public npm archives.

The published package contains compiled JavaScript and generated data. It excludes TypeScript sources, tests, build scripts, keyword source files, and source maps. `tsx` is a development dependency only. CI verifies Node.js 22.12 and 24, catalogue reproducibility, package behavior, actual published Free exports, and production advisories. Version tags must match `package.json` before publishing.

## Pro icons

This public server includes Free artwork only. Licensed Pro customers can configure access and install Pro packages using:

```bash
npx @mingcute/cli@latest
```

Pro SVGs and license credentials are not bundled in this MCP package. The current tools generate Free-package examples; they do not access a customer's Pro entitlement.

## Migration from 0.1.x

Version 0.2.0 updates the catalogue and requires Node.js 22.12+. Canonical responses use current filenames, styles, components, and package entry points. Tool names remain the same, but search/category responses are compact and usage responses now include structured `framework` and `example` fields. Existing style aliases remain accepted. The undocumented `MINGCUTE_ICONS_ROOT` runtime override is removed; SVGs are bundled.

## License

Apache-2.0. Bundled Free artwork is sourced from [MingCute Icons](https://github.com/mingcute-design/mingcute-icons). Pro artwork has a separate commercial license and is not distributed here.
