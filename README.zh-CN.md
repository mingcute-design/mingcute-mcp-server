# MingCute Icon MCP

MingCute Icon MCP 是一个面向 AI 编程助手的 [Model Context Protocol](https://modelcontextprotocol.io/) 服务器，用于在 Claude、Codex、Cursor、Windsurf、Cline 等支持 MCP 的工具中搜索和使用 MingCute 图标。

它基于本地图标索引工作，运行时不依赖远程 API。AI 可以通过 MCP 工具按中英文关键词、图标名称、分类和样式搜索图标，并生成 React、Vue、Webfont 或 SVG 使用方式。

## 图标模型

MingCute 每个图标按 base icon 建模，并包含两种变体：

- `line`：描边版，文件名以 `_line.svg` 结尾，例如 `home_1_line.svg`
- `fill`：填充版，文件名以 `_fill.svg` 结尾，例如 `home_1_fill.svg`

搜索结果会优先返回同一个 base icon，再由调用方选择 `line` 或 `fill` 变体。

## 安装与使用

发布到 npm 后可以直接运行：

```bash
npx -y @mingcute/mcp-server
```

本地开发时可以运行：

```bash
node bin/run.cjs
```

## MCP 客户端配置

### Codex

发布到 npm 后：

```bash
codex mcp add mingcute -- npx -y @mingcute/mcp-server
```

本地调试：

```bash
codex mcp add mingcute -- node /absolute/path/to/mingcute-icon-mcp/bin/run.cjs
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

```tsx
import { Home1Fill } from '@mingcute/react';

<Home1Fill size={24} color="currentColor" />
```

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

## 数据构建

当前索引由以下资源生成：

- `src/data/source/keywords.json`：图标中英文关键词
- MingCute 图标仓库中的 `svg/` 目录

默认读取路径：

```text
/Users/a115/Documents/MyGithub/MingCute/svg
```

也可以通过环境变量指定 MingCute 图标仓库根目录：

```bash
MINGCUTE_ICONS_ROOT=/path/to/MingCute npm run build:data
```

生成数据：

```bash
npm run build:data
```

生成结果：

- `src/data/icons.generated.json`
- `src/data/categories.generated.json`

## 开发

```bash
npm install
npm run build:data
npm run typecheck
npm test
```

## 发布流程建议

建议先将本仓库发布到 GitHub，再通过 GitHub Actions 自动发布 npm。

推荐发布前检查：

```bash
npm run build:data
npm run typecheck
npm test
npm pack --dry-run
```

GitHub Actions 中需要配置 npm token：

```text
NPM_TOKEN
```

如果使用 scoped package `@mingcute/mcp-server`，首次发布通常需要公开访问权限：

```bash
npm publish --access public
```

## License

Apache-2.0
