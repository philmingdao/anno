<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="plugins/anno/assets/logo-dark.svg">
    <img src="plugins/anno/assets/logo.svg" alt="Anno" width="240">
  </picture>
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <strong>日本語</strong> · <a href="README.ko.md">한국어</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a> · <a href="README.pt.md">Português</a> · <a href="README.th.md">ไทย</a>
</p>

# Anno

Anno は、AI コーディングエージェント向けのローカルファーストな HTML レビューワークスペースです。ローカル HTML ファイルの隔離コピーをブラウザーで開き、テキストや書式の直接編集、要素コメント、範囲注釈、スライド単位のレビューを行えます。レビュー後は永続的なハンドオフを作成し、エージェントがそれを引き継いで、検証済みの単一 HTML ファイルに仕上げます。

このリポジトリには、共有 MCP サーバーとホスト非依存の Skill、対応ホスト向けのネイティブプラグインマニフェスト、そして Cursor、Google Antigravity、Windsurf、GitHub Copilot、Meta Muse Code 用のコピー可能な MCP テンプレートが含まれます。DeepSeek Harness 対応は、DeepSeek Harness 自体を使って開発されたインプロセスのネイティブプラグイン [`philmingdao/anno-dsh-native`](https://github.com/philmingdao/anno-dsh-native) として別リポジトリで保守されています。Muse Code は引き続き実験的です。

## 主な機能

- `127.0.0.1` のみにバインドされるローカル HTTP エディター
- 元ファイルを上書きしない安全な処理
- テキスト、タイポグラフィ、色、位置、ページメモ、要素注釈、範囲注釈の編集
- 永続的で冪等なエージェントハンドオフ
- 既存の `needs_codex` セッションとの互換性
- 対応ホスト間で共有される MCP と `SKILL.md`
- 簡体字中国語と英語の UI、ライト／ダークテーマ

## 動作要件

- Node.js 22 以降
- ローカル stdio MCP サーバーとローカルファイルへアクセスできるホスト
- レビューエディターを開くブラウザー

## 対応エージェントツール

Codex、Claude Code、WorkBuddy、CodeBuddy はパッケージ済みプラグインマニフェストを使用します。Cursor、Google Antigravity、Windsurf、GitHub Copilot CLI/Chat、Muse Code は、ホスト別テンプレートを通じて同じローカル stdio MCP サーバーへ接続します。DeepSeek Harness は独立したネイティブリポジトリ [`anno-dsh-native`](https://github.com/philmingdao/anno-dsh-native) を使用し、MCP ブリッジを介さず DSH のプロファイル、ツールレジストリ、エージェントライフサイクルへ直接統合します。

設定例とホストごとの制限については、[エージェントツール統合ガイド](docs/agent-tools.md)を参照してください。

| エージェントツール | 統合方式 | 状態 |
| --- | --- | --- |
| Codex | ネイティブプラグイン + MCP | 対応 |
| Claude Code | ネイティブプラグイン + MCP | 対応 |
| WorkBuddy / CodeBuddy | ネイティブプラグイン + MCP | 対応 |
| Cursor | ローカル stdio MCP | 対応 |
| Google Antigravity | ローカル stdio MCP | 対応 |
| Windsurf | ローカル stdio MCP | 対応 |
| GitHub Copilot CLI / Chat | ローカル stdio MCP | ローカル実行に対応 |
| DeepSeek Harness | 独立した DSH ネイティブプラグイン | 0.1.0-rc.6 で検証済み |
| Meta Muse Code | ローカル stdio MCP | 実験的 |

## 1 コマンドでインストール

クローンやビルドは不要です。インストーラーは利用可能なエージェントを検出し、既存の JSON/JSONC に `anno` だけを安全にマージし、Skill と MCP を設定して接続を検証します。

```bash
npx -y @philmingdao/anno@0.4.0 setup
npx -y @philmingdao/anno@0.4.0 setup --host cursor,windsurf,copilot
npx -y @philmingdao/anno@0.4.0 doctor --host cursor
```

DeepSeek Harness 向けネイティブ実装は、独立リポジトリからインストールします。

```bash
dsh plugin --profile web add github:philmingdao/anno-dsh-native
dsh web
```

アーキテクチャ、互換性、ソースからのインストールについては [`philmingdao/anno-dsh-native`](https://github.com/philmingdao/anno-dsh-native) を参照してください。このプラグインは DeepSeek Harness を使って開発・検証されています。

Codex、Claude Code、WorkBuddy、CodeBuddy にはネイティブプラグインとして、Antigravity には完全なプラグインバンドルとして設定されます。Muse Code では確認済みの設定パスを指定してください：`npx -y @philmingdao/anno@0.4.0 setup --host muse --config /absolute/path/to/mcp.json`。

手動管理が必要な環境では、次の固定バージョンテンプレートを使用できます。

| エージェントツール | テンプレート | 設定先 |
| --- | --- | --- |
| Cursor | [`cursor/mcp.json`](plugins/anno/integrations/cursor/mcp.json) | プロジェクトの `.cursor/mcp.json` または `~/.cursor/mcp.json` |
| Google Antigravity | [`antigravity/mcp_config.json`](plugins/anno/integrations/antigravity/mcp_config.json) | プロジェクトの `.agents/mcp_config.json` または `~/.gemini/config/mcp_config.json` |
| Windsurf | [`windsurf/mcp_config.json`](plugins/anno/integrations/windsurf/mcp_config.json) | `~/.codeium/windsurf/mcp_config.json` にマージ |
| GitHub Copilot CLI | [`github-copilot/mcp-config.json`](plugins/anno/integrations/github-copilot/mcp-config.json) | `~/.copilot/mcp-config.json` にマージ |
| VS Code の GitHub Copilot Chat | [`github-copilot/vscode-mcp.json`](plugins/anno/integrations/github-copilot/vscode-mcp.json) | プロジェクトの `.vscode/mcp.json` |
| Meta Muse Code | [`muse-code/mcp.json`](plugins/anno/integrations/muse-code/mcp.json) | 現在のビルドの MCP マネージャーから読み込み（実験的） |

Copilot CLI は次のコマンドでも直接設定できます。

```bash
copilot mcp add anno --env ANNO_HOST=copilot -- npx -y @philmingdao/anno@0.4.0 mcp
```

保存後、ホストを再起動するか MCP サーバー一覧を更新してください。GitHub のクラウド Coding Agent は Anno のループバック URL をユーザーのブラウザーへ公開できないため、Copilot はローカルで使用してください。Muse Code は公開 MCP 仕様が安定していないため、引き続き実験的サポートです。

## MCP サーバーを直接使用する

任意の stdio MCP クライアントから次のように起動できます。

```bash
npx -y @philmingdao/anno@0.4.0 mcp
```

## 開発

```bash
npm install
npm test
npm run pack:check
```

MCP コアパッケージは `plugins/anno` にあり、DeepSeek Harness 実装は独立リポジトリ [`anno-dsh-native`](https://github.com/philmingdao/anno-dsh-native) で保守されています。生成された依存関係とローカルレビューセッションはコミットされません。

## データとプライバシー

Anno は HTML と注釈をローカルで処理します。エディターはループバックのみにバインドされ、Host と Origin ヘッダーを検証します。一般ホストは `~/.anno`、macOS 上の Codex は互換パス `~/Library/Application Support/Codex/anno` にセッションを保存します。保存先は `ANNO_DATA_DIR` で変更できます。

Anno 自体はレビュー対象ファイルをアップロードしません。接続先のエージェントホストは、そのホスト独自のデータポリシーに従って草稿や注釈を処理する場合があります。

## 互換性

ホストごとの挙動と制限は [互換性ドキュメント](docs/compatibility.md)を参照してください。

## ライセンス

MIT ライセンスです。同梱の WDXL Lubrifont フォントには、`plugins/anno/assets/OFL-WDXL-Lubrifont.txt` に記載された SIL Open Font License が引き続き適用されます。
