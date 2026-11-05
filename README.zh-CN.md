# MingCute MCP

通过兼容 MCP 的 AI 编程工具搜索和使用 MingCute 免费图标。本地 stdio 服务内置 Free 3.1.0 的完整目录：**2,263 个图标、4,526 个 SVG 变体**，并支持中英文关键词。运行时无需图标源代码目录、账号或网络连接。

## 安装

需要 **Node.js 22.12 或更高版本**。首次下载安装包需要网络。

```bash
npx -y @mingcute/mcp-server
```

在客户端的 MCP 配置中添加：

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

需要可重复部署时，请固定 npm 包版本。具体配置文件位置请参考客户端设置。

## 工具

| 工具 | 用途 |
| --- | --- |
| `search_icons` | 按中英文关键词、文件名或组件名搜索，返回简洁结果 |
| `get_icon` | 获取元数据；设置 `includeSvg: true` 返回内置 SVG |
| `get_icon_usage` | 生成安装命令和框架用法 |
| `list_categories` | 查看分类、数量和源版本 |
| `list_icons_by_category` | 使用 `limit` 和 `offset` 分页浏览分类 |

所有工具均为只读，返回结构化 JSON 和文本。资源 `mingcute://catalogue` 提供源版本、提交和分类数量。

```json
{"query":"主页","style":"core-regular","limit":5,"locale":"zh"}
```

标准样式为 `core-regular`、`core-filled` 和 `all`。仍兼容 `regular`/`line` 与 `filled`/`fill` 别名。支持 `home-1`、`home_1`、`Home1Regular` 和 `home-1-core-filled` 等名称。

```json
{"name":"Home1Filled","includeSvg":true}
```

变体名或组件名会选择对应样式；显式指定冲突样式会返回错误。基础名称加 `all` 返回两种样式。`locale: auto` 搜索两种语言关键词；`en` 和 `zh` 分别选择英文和中文关键词字段，名称和分类始终可搜索。

支持的框架/格式：`react`、`vue`、`react-native`、`svelte`、`solid`、`vanilla`、`web-components`、`webfont`、`svg`、`data`。

```json
{"name":"home-1","style":"core-regular","framework":"react"}
```

当前导入示例：

```tsx
import { Home1Regular } from '@mingcute/react/core-regular';

<Home1Regular size={24} title="主页" />
```

SVG URL 示例使用 Vite 的 `?url` 约定，其他构建工具需要配置资源导入，或通过 `get_icon` 获取内联 SVG。字体示例使用 `@mingcute/font`。

分类分页返回 `total`、`count` 和 `nextOffset`；继续请求直到 `nextOffset` 为 `null`。

## 更新目录与开发

```bash
npm ci
npm run build:data -- --source ../mingcute-icons
npm run build:data -- --source ../mingcute-icons --check
npm run check
npm audit --omit=dev --audit-level=high
npm run verify:published
```

生成器验证源清单中每个 SVG 的 SHA-256，使用包元数据中的准确组件名和文件名，并记录 Free 版本、Git 提交和数量。生成器以静态解析方式读取免费版关键词文件，不执行其中的 JavaScript，并合并已审核的译词。`verify:published` 会检查全部十个公开 npm 包中实际存在的导出、SVG 路径和字体类。更新目录时，同步更新两个工作流中固定的 Free 提交。保留已审核的中英文关键词；没有译词的图标仍可按名称和分类搜索。

检查涵盖类型、单元测试、编译，以及临时目录中的 npm 压缩包安装和真实 stdio 调用。安装测试需要网络以解析依赖。发布包仅包含编译后的 JavaScript 和生成数据，不包含 TypeScript 源码、测试、构建脚本、关键词源文件或 source maps。`tsx` 仅用于开发。CI 验证 Node.js 22.12 和 24、目录一致性和生产依赖安全公告。

## Pro 图标

公共服务器仅包含免费图标。Pro 用户可以通过以下命令配置授权并安装商业包：

```bash
npx @mingcute/cli@latest
```

此 MCP 包不包含 Pro SVG 或许可证凭据，当前工具也不读取 Pro 授权。

## 从 0.1.x 升级

0.2.0 要求 Node.js 22.12+，使用当前标准名称和导入路径。工具名不变，搜索和分类结果更精简，用法响应新增结构化 `framework` 和 `example` 字段。旧样式别名继续有效。运行时不再使用 `MINGCUTE_ICONS_ROOT`；SVG 已内置。

## 许可

Apache-2.0。免费图标来自 [MingCute Icons](https://github.com/mingcute-design/mingcute-icons)。Pro 图标使用独立商业许可，不在此分发。
