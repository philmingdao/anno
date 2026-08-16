<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="plugins/anno/assets/logo-dark.svg">
    <img src="plugins/anno/assets/logo.svg" alt="Anno" width="240">
  </picture>
</p>

<p align="center">
  <a href="README.md">English</a> · <strong>简体中文</strong>
</p>

# Anno

Anno 是一个面向 AI 编程 Agent 的、本地优先的 HTML 审阅工作台。它会在浏览器中打开本地 HTML 文件的隔离副本，支持直接编辑文本和格式、添加元素评注与区域评注，并能感知幻灯片页面。审阅完成后，Anno 会生成一份持久化的交接任务，由 Agent 接管并处理为经过验证的独立 HTML 文件。

本仓库包含一套共享的 MCP 服务和与宿主无关的 Skill，同时为 Codex、Claude Code、WorkBuddy 和 CodeBuddy 提供轻量级插件清单。由于 DeepSeek Harness 的插件 API 仍处于开发者预览阶段，目前对它的支持属于实验性质。

## 主要特性

- 仅在 `127.0.0.1` 上运行的本地 HTTP 编辑器
- 永远不会覆盖源文件
- 支持文本、字体排印、颜色、位置、页面备注、元素评注和区域评注
- 持久且幂等的 Agent 交接机制
- 兼容已有的 `needs_codex` 会话
- 在支持的平台间共享同一套 MCP 和 `SKILL.md` 实现
- 简体中文与英文界面，并支持浅色和深色主题

## 运行要求

- Node.js 22 或更高版本
- 支持本地 stdio MCP 服务并能访问本地文件的宿主
- 用于打开审阅编辑器的浏览器

## 在 Codex 中安装

```bash
codex plugin marketplace add philmingdao/anno --ref main
codex plugin add anno@anno
```

如需可复现的安装，请将 `main` 替换为发布标签，例如 `v0.2.1`。

## 在 Claude Code 中安装

```text
/plugin marketplace add philmingdao/anno
/plugin install anno@anno
```

## 在 WorkBuddy 或 CodeBuddy 中安装

将 `philmingdao/anno` 添加为插件 marketplace，然后安装 `anno`。本地开发时，可以通过宿主的插件目录参数加载 `plugins/anno`。

## 直接使用 MCP 服务

npm 包发布后，任何 stdio MCP 客户端都可以通过以下命令启动 Anno：

```bash
npx -y @philmingdao/anno
```

在 npm 包正式发布前，可以克隆本仓库、安装依赖并完成构建，然后让 MCP 客户端指向 `plugins/anno/dist/index.js`。

## 开发

```bash
npm install
npm test
npm run pack:check
```

可发布的软件包位于 `plugins/anno`。生成的依赖文件和本地审阅会话不会提交到仓库。

## 数据与隐私

Anno 在本地处理 HTML 和评注。编辑器只监听回环地址，并会验证 Host 和 Origin 请求头。通用宿主默认将会话存储在 `~/.anno`；在 macOS 上，Codex 会沿用兼容路径 `~/Library/Application Support/Codex/anno`。可通过 `ANNO_DATA_DIR` 指定其他目录。

Anno 不会上传被审阅的文件。与其连接的 Agent 宿主可能会依据自身的数据政策处理草稿和评注。

## 兼容性

不同宿主的具体行为和限制，请参阅[兼容性说明](docs/compatibility.md)。

## 许可证

本项目采用 MIT 许可证。内置的 WDXL Lubrifont 字体继续采用其单独的 SIL Open Font License，许可证文件位于 `plugins/anno/assets/OFL-WDXL-Lubrifont.txt`。
