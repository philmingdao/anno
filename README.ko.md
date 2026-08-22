<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="plugins/anno/assets/logo-dark.svg">
    <img src="plugins/anno/assets/logo.svg" alt="Anno" width="240">
  </picture>
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <strong>한국어</strong> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a> · <a href="README.pt.md">Português</a> · <a href="README.th.md">ไทย</a>
</p>

# Anno

Anno는 AI 코딩 에이전트를 위한 로컬 우선 HTML 검토 작업 공간입니다. 로컬 HTML 파일의 격리된 복사본을 브라우저에서 열어 텍스트와 서식을 직접 편집하고, 요소 댓글과 영역 주석을 추가하며, 슬라이드 단위로 검토할 수 있습니다. 검토가 끝나면 에이전트가 인수하여 검증된 독립형 HTML 파일로 완성할 수 있는 영구 핸드오프를 생성합니다.

이 저장소에는 공유 MCP 서버와 호스트 중립 Skill, 지원되는 호스트용 네이티브 플러그인 매니페스트, 그리고 Cursor, Google Antigravity, Windsurf, GitHub Copilot, Meta Muse Code용 복사 가능한 MCP 템플릿이 포함되어 있습니다. DeepSeek Harness 지원은 DeepSeek Harness 자체로 개발한 인프로세스 네이티브 플러그인 [`philmingdao/anno-dsh-native`](https://github.com/philmingdao/anno-dsh-native)에서 별도로 유지됩니다. Muse Code는 계속 실험적입니다.

## 주요 기능

- `127.0.0.1`에만 바인딩되는 로컬 HTTP 편집기
- 원본 파일을 절대 덮어쓰지 않음
- 텍스트, 타이포그래피, 색상, 위치, 페이지 메모, 요소 및 영역 편집
- 영구적이고 멱등적인 에이전트 핸드오프
- 기존 `needs_codex` 세션과의 호환성
- 지원 호스트가 공유하는 MCP 및 `SKILL.md` 구현
- 중국어 간체 및 영어 UI, 라이트/다크 테마

## 스크린샷

검토 편집기는 브라우저에서 HTML의 격리된 복사본을 엽니다. 텍스트와 스타일을 직접 편집하고, 요소나 영역에 댓글을 남긴 뒤, 모아둔 변경 사항을 한 번의 클릭으로 에이전트에 넘겨줄 수 있습니다.

![Anno 검토 편집기, 라이트 테마, 주석 탭](plugins/anno/assets/screenshots/anno-editor-light.png)

![Anno 검토 편집기, 다크 테마, 서식 컨트롤](plugins/anno/assets/screenshots/anno-editor-dark.png)

![요소 댓글 팝오버](plugins/anno/assets/screenshots/anno-comment.png)

## 요구 사항

- Node.js 22 이상
- 로컬 stdio MCP 서버 및 로컬 파일에 접근할 수 있는 호스트
- 검토 편집기를 열 브라우저

## 지원되는 에이전트 도구

Codex, Claude Code, WorkBuddy, CodeBuddy는 패키지된 플러그인 매니페스트를 사용합니다. Cursor, Google Antigravity, Windsurf, GitHub Copilot CLI/Chat, Muse Code는 호스트별 템플릿을 통해 동일한 로컬 stdio MCP 서버에 연결합니다. DeepSeek Harness는 독립 네이티브 저장소 [`anno-dsh-native`](https://github.com/philmingdao/anno-dsh-native)를 사용해 MCP 브리지 없이 DSH 프로필, 도구 레지스트리, 에이전트 수명 주기에 직접 통합됩니다.

복사 가능한 설정과 호스트별 제한은 [에이전트 도구 통합 가이드](docs/agent-tools.md)를 참조하세요.

| 에이전트 도구 | 통합 방식 | 상태 |
| --- | --- | --- |
| Codex | 네이티브 플러그인 + MCP | 지원 |
| Claude Code | 네이티브 플러그인 + MCP | 지원 |
| WorkBuddy / CodeBuddy | 네이티브 플러그인 + MCP | 지원 |
| Cursor | 로컬 stdio MCP | 지원 |
| Google Antigravity | 로컬 stdio MCP | 지원 |
| Windsurf | 로컬 stdio MCP | 지원 |
| GitHub Copilot CLI / Chat | 로컬 stdio MCP | 로컬 실행 지원 |
| DeepSeek Harness | 독립 DSH 네이티브 플러그인 | 0.1.0-rc.6에서 검증 |
| Meta Muse Code | 로컬 stdio MCP | 실험적 |

## 한 번의 명령으로 설치

저장소 복제나 빌드가 필요 없습니다. 설치 프로그램은 사용 가능한 에이전트를 감지하고, 기존 JSON/JSONC에 `anno` 항목만 안전하게 병합하며, Skill과 MCP를 설치한 뒤 연결을 검증합니다.

```bash
npx -y @philmingdao/anno@0.4.0 setup
npx -y @philmingdao/anno@0.4.0 setup --host cursor,windsurf,copilot
npx -y @philmingdao/anno@0.4.0 doctor --host cursor
```

DeepSeek Harness용 네이티브 구현은 독립 저장소에서 설치합니다.

```bash
dsh plugin --profile web add github:philmingdao/anno-dsh-native
dsh web
```

아키텍처, 호환성, 소스 설치 방법은 [`philmingdao/anno-dsh-native`](https://github.com/philmingdao/anno-dsh-native)를 참조하세요. 이 플러그인은 DeepSeek Harness로 개발하고 검증했습니다.

Codex, Claude Code, WorkBuddy, CodeBuddy에는 네이티브 플러그인으로, Antigravity에는 완전한 플러그인 번들로 설치됩니다. Muse Code는 확인한 설정 경로를 지정하세요: `npx -y @philmingdao/anno@0.4.0 setup --host muse --config /absolute/path/to/mcp.json`.

수동 관리 환경에서는 아래의 버전 고정 템플릿을 사용할 수 있습니다.

| 에이전트 도구 | 템플릿 | 설정 위치 |
| --- | --- | --- |
| Cursor | [`cursor/mcp.json`](plugins/anno/integrations/cursor/mcp.json) | 프로젝트 `.cursor/mcp.json` 또는 `~/.cursor/mcp.json` |
| Google Antigravity | [`antigravity/mcp_config.json`](plugins/anno/integrations/antigravity/mcp_config.json) | 프로젝트 `.agents/mcp_config.json` 또는 `~/.gemini/config/mcp_config.json` |
| Windsurf | [`windsurf/mcp_config.json`](plugins/anno/integrations/windsurf/mcp_config.json) | `~/.codeium/windsurf/mcp_config.json`에 병합 |
| GitHub Copilot CLI | [`github-copilot/mcp-config.json`](plugins/anno/integrations/github-copilot/mcp-config.json) | `~/.copilot/mcp-config.json`에 병합 |
| VS Code의 GitHub Copilot Chat | [`github-copilot/vscode-mcp.json`](plugins/anno/integrations/github-copilot/vscode-mcp.json) | 프로젝트 `.vscode/mcp.json` |
| Meta Muse Code | [`muse-code/mcp.json`](plugins/anno/integrations/muse-code/mcp.json) | 현재 빌드의 MCP 관리자에서 가져오기(실험적) |

Copilot CLI는 다음 명령으로 직접 설정할 수도 있습니다.

```bash
copilot mcp add anno --env ANNO_HOST=copilot -- npx -y @philmingdao/anno@0.4.0 mcp
```

저장 후 호스트를 다시 시작하거나 MCP 서버 목록을 새로 고치세요. GitHub 클라우드 Coding Agent는 Anno의 루프백 검토 URL을 사용자 브라우저에 노출할 수 없으므로 Copilot은 로컬에서 사용해야 합니다. Muse Code는 공개 MCP 설정 규격이 아직 안정적이지 않아 실험적 지원으로 유지됩니다.

## MCP 서버 직접 사용

모든 stdio MCP 클라이언트에서 다음과 같이 실행할 수 있습니다.

```bash
npx -y @philmingdao/anno@0.4.0 mcp
```

## 개발

```bash
npm install
npm test
npm run pack:check
```

MCP 코어 패키지는 `plugins/anno`에 있으며 DeepSeek Harness 구현은 독립 저장소 [`anno-dsh-native`](https://github.com/philmingdao/anno-dsh-native)에서 유지됩니다. 생성된 의존성과 로컬 검토 세션은 커밋되지 않습니다.

## 데이터 및 개인정보 보호

Anno는 HTML과 주석을 로컬에서 처리합니다. 편집기는 루프백 주소에만 바인딩되고 Host 및 Origin 헤더를 검증합니다. 일반 호스트는 세션을 `~/.anno`에 저장하며, macOS의 Codex는 호환 경로인 `~/Library/Application Support/Codex/anno`를 사용합니다. `ANNO_DATA_DIR`로 다른 디렉터리를 지정할 수 있습니다.

Anno는 검토한 파일을 업로드하지 않습니다. 연결된 에이전트 호스트는 자체 데이터 정책에 따라 초안과 주석을 처리할 수 있습니다.

## 호환성

호스트별 동작 및 제한은 [호환성 문서](docs/compatibility.md)를 참조하세요.

## 라이선스

MIT 라이선스입니다. 포함된 WDXL Lubrifont 글꼴에는 `plugins/anno/assets/OFL-WDXL-Lubrifont.txt`의 별도 SIL Open Font License가 계속 적용됩니다.
