# MingCute Icon MCP

MingCute Icon MCP 是一个面向 AI 编程助手的 [Model Context Protocol](https://modelcontextprotocol.io/) 服务器，用于在 Claude、Codex、Cursor、Windsurf、Cline 等支持 MCP 的工具中搜索和使用 MingCute 图标。

## 特性

- 支持按中英文关键词、图标名称、组件名、分类和样式搜索 MingCute 图标。
- 支持 `line`、`fill` 或全部样式过滤，便于 AI 根据界面语境选择合适变体。
- 支持生成 React、Vue、Webfont 和 SVG 使用示例，并指向对应的官方 npm 图标包。
- 支持获取图标详情、分类列表、分类下图标列表，以及按需返回 SVG 源码。
- 基于本地图标索引运行，搜索过程不依赖远程 API。

## 安装与使用

发布到 npm 后可以直接运行：

```bash
npx -y @mingcute/mcp-server
```

## MCP 客户端配置

### Codex

发布到 npm 后：

```bash
codex mcp add mingcute -- npx -y @mingcute/mcp-server
```

### Claude Desktop

在 Claude Desktop 配置文件中加入：

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

配置完成后重启 Claude Desktop。

## 可用工具

### `search_icons`

按中英文关键词、图标名、组件名、分类和样式搜索 MingCute 图标。

参数：

```ts
{
  query: string;
  style?: "line" | "fill" | "all";
  category?: string;
  limit?: number;
  locale?: "auto" | "en" | "zh";
}
```

示例：

```json
{
  "query": "主页",
  "style": "line",
  "limit": 5
}
```

### `get_icon`

按 base name 或完整变体名获取图标详情，可选返回 SVG 源码。

示例：

```json
{
  "name": "home_1",
  "style": "all",
  "includeSvg": false
}
```

### `get_icon_usage`

生成 React、Vue、Webfont 或 SVG 使用示例。

示例：

```json
{
  "name": "home_1",
  "style": "fill",
  "framework": "react"
}
```

返回示例：

```bash
npm install @mingcute/react
```

```tsx
import { Home1Fill } from '@mingcute/react';

<Home1Fill size={24} color="currentColor" />
```

Webfont 与 SVG 示例会使用 `mingcute_icon` 包，React 示例使用 `@mingcute/react`，Vue 示例使用 `@mingcute/vue`。

### `list_categories`

列出所有 MingCute 图标分类及数量。

### `list_icons_by_category`

按分类列出图标，可按 `line` / `fill` 过滤。

示例：

```json
{
  "category": "building",
  "style": "fill",
  "limit": 20
}
```

## License

Apache-2.0
