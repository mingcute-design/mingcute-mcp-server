# MingCute Icon MCP

MingCute Icon MCP is a [Model Context Protocol](https://modelcontextprotocol.io/) server for AI coding assistants to search and use MingCute icons in MCP-compatible tools such as Claude, Codex, Cursor, Windsurf, and Cline.

## Features

- Search MingCute icons by English or Chinese keyword, icon name, component name, category, and style.
- Filter by `line`, `fill`, or all styles so AI assistants can pick the right variant for the UI context.
- Generate React, Vue, webfont, and SVG usage examples with the matching published npm package.
- Fetch icon details, categories, icons by category, and raw SVG source when needed.
- Runs from a local icon index and does not depend on a remote API at runtime.

## Usage

```bash
npx -y @mingcute/mcp-server
```

### Codex

```bash
codex mcp add mingcute -- npx -y @mingcute/mcp-server
```

### Claude Desktop

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

## Tools

### `search_icons`

Search by English or Chinese keyword, icon name, component name, category, and style.

```json
{
  "query": "home",
  "style": "line",
  "limit": 5
}
```

### `get_icon`

Get one icon set by base name or variant name.

```json
{
  "name": "home_1",
  "style": "all",
  "includeSvg": false
}
```

### `get_icon_usage`

Generate usage examples for React, Vue, webfont, or SVG.

```json
{
  "name": "home_1",
  "style": "line",
  "framework": "react"
}
```

React examples use `@mingcute/react`, Vue examples use `@mingcute/vue`, and SVG/webfont examples use `mingcute_icon`.

### `list_categories`

List MingCute categories.

### `list_icons_by_category`

List icons in one category.

```json
{
  "category": "building",
  "style": "fill",
  "limit": 20
}
```
