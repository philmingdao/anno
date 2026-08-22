# Anno for DeepSeek Harness

[English](README.md) | 简体中文

`@philmingdao/anno-dsh` 是 [Anno](https://github.com/philmingdao/anno) 面向 DeepSeek Harness 的原生插件包。Anno 是一套本地优先的 HTML 评审、编辑与批注工具，供编码 Agent 使用。

它会协调安装两部分：

- 基于官方 `@deepseek-ai/dsh-mcp-client` 的 DSH profile bundle；
- 安装到 `$DSH_HOME/skills` 的 `review-html-artifacts` skill，让 Agent 知道如何开始、继续并完成一次 Anno 评审。

## 兼容范围

- DeepSeek Harness：`>=0.1.0-rc.6 <0.2.0`
- Node.js：22 或更高版本
- Anno MCP 服务：`@philmingdao/anno@0.4.0`

DeepSeek Harness 仍处于开发者预览阶段，官方明确提示可能出现破坏性兼容变更。因此，本插件只声明经过验证的版本范围，不对未测试的新版本做笼统兼容承诺。

## 安装

推荐使用一条命令安装到默认的 `web` profile：

```sh
npx -y @philmingdao/anno-dsh@0.1.0 install
```

安装器会优先使用系统中的 `dsh`；如果没有，则通过 `npx` 运行经过测试的 `@deepseek-ai/dsh@0.1.0-rc.6`。它会调用 DSH 原生 profile 管理器加入 bundle、安装 skill、检查 profile 合成结果，并执行一次真实的 MCP `initialize` 与 `tools/list` 验证。

之后按正常方式启动 Harness：

```sh
npx -y @deepseek-ai/dsh@0.1.0-rc.6 web
```

安装到其他 profile 或 DSH 主目录：

```sh
npx -y @philmingdao/anno-dsh@0.1.0 install --profile my-profile
npx -y @philmingdao/anno-dsh@0.1.0 install --dsh-home /absolute/path/to/.dsh
```

## 使用

直接让 Harness 打开或评审某个 HTML 文件即可。DSH 中呈现给模型的工具会采用其标准 MCP 命名空间：

- `mcp__anno__html_review_start_session`
- `mcp__anno__html_review_get_session`
- `mcp__anno__html_review_claim_handoff`
- `mcp__anno__html_review_register_final`

Anno 会返回本地评审地址，保持原始文件不被覆盖，持久化编辑与批注，并把最终文件生成工作交还给当前 Agent。

## 验证、更新与卸载

```sh
npx -y @philmingdao/anno-dsh@0.1.0 doctor
npx -y @philmingdao/anno-dsh@0.1.0 update
npx -y @philmingdao/anno-dsh@0.1.0 uninstall
```

卸载会调用 DSH 原生的 `plugin remove`。已安装的 skill 会被移动到带时间戳的备份位置，而不是直接删除；如果用户修改过 skill，默认会保留，只有显式传入 `--force` 才会移除。

## DSH 原生命令安装

熟悉 DSH 的用户也可以只安装 profile bundle：

```sh
dsh plugin --profile web add @philmingdao/anno-dsh@0.1.0
```

该命令会启用 MCP 工具桥接，但不会复制配套 skill。因此仍推荐使用 `anno-dsh install`，一次完成两部分安装和验证。

## 从源码测试

```sh
npm install
npm run build:dsh
node adapters/dsh/dist/cli.js install --package-spec ./adapters/dsh
```

测试时可以传入 `--dsh-home` 指向临时目录，从而不修改日常使用的 Harness profile。

## 架构

```text
DSH profile
  -> @philmingdao/anno-dsh bundle
    -> @deepseek-ai/dsh-mcp-client
      -> npx --package=@philmingdao/anno@0.4.0 anno mcp
        -> 本地 Anno 评审服务与持久化会话状态
```

本插件不重复实现 MCP 发现、工具命名、取消、热更新或重连机制，这些职责全部交给 DSH 官方 MCP Client。

## 许可证

MIT
