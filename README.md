# MingCute Icon MCP

MCP server for searching and using MingCute icons in AI coding assistants.

MingCute icons are modeled as icon sets. Each set can contain two variants:

- `line`: outline icon, file name ending in `_line.svg`
- `fill`: filled icon, file name ending in `_fill.svg`

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

## Development

The data builder reads:

- `src/data/source/keywords.json`
- `MINGCUTE_ICONS_ROOT/svg`, or by default `/Users/a115/Documents/MyGithub/MingCute/svg`

```bash
npm install
npm run build:data
npm run typecheck
npm test
```
