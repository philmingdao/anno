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

이 저장소에는 공유 MCP 서버와 호스트 중립 Skill, 지원되는 호스트용 네이티브 플러그인 매니페스트, 그리고 Cursor, Google Antigravity, Windsurf, GitHub Copilot, Meta Muse Code용 복사 가능한 MCP 템플릿이 포함되어 있습니다. DeepSeek Harness와 Muse Code 지원은 실험적입니다.

## 주요 기능

- `127.0.0.1`에만 바인딩되는 로컬 HTTP 편집기
- 원본 파일을 절대 덮어쓰지 않음
- 텍스트, 타이포그래피, 색상, 위치, 페이지 메모, 요소 및 영역 편집
- 영구적이고 멱등적인 에이전트 핸드오프
- 기존 `needs_codex` 세션과의 호환성
- 지원 호스트가 공유하는 MCP 및 `SKILL.md` 구현
- 중국어 간체 및 영어 UI, 라이트/다크 테마

## 요구 사항

- Node.js 22 이상
- 로컬 stdio MCP 서버 및 로컬 파일에 접근할 수 있는 호스트
- 검토 편집기를 열 브라우저

## 지원되는 에이전트 도구

Codex, Claude Code, WorkBuddy, CodeBuddy는 패키지된 플러그인 매니페스트를 사용합니다. Cursor, Google Antigravity, Windsurf, GitHub Copilot CLI/Chat, Muse Code는 호스트별 템플릿을 통해 동일한 로컬 stdio MCP 서버에 연결합니다. DeepSeek Harness는 실험적인 네이티브 브리지를 사용합니다.

복사 가능한 설정과 호스트별 제한은 [에이전트 도구 통합 가이드](docs/agent-tools.md)를 참조하세요.

## Codex에 설치

```bash
codex plugin marketplace add philmingdao/anno --ref main
codex plugin add anno@anno
```

재현 가능한 설치를 위해 `main` 대신 `v0.3.0`과 같은 릴리스 태그를 사용하세요.

## Claude Code에 설치

```text
/plugin marketplace add philmingdao/anno
/plugin install anno@anno
```

## WorkBuddy 또는 CodeBuddy에 설치

`philmingdao/anno`를 플러그인 marketplace로 추가한 다음 `anno`를 설치하세요. 로컬 개발 중에는 호스트의 플러그인 디렉터리 옵션으로 `plugins/anno`를 로드할 수 있습니다.

## MCP 서버 직접 사용

npm 패키지가 게시된 후에는 모든 stdio MCP 클라이언트에서 다음과 같이 실행할 수 있습니다.

```bash
npx -y @philmingdao/anno
```

게시 전에는 저장소를 복제하고 의존성을 설치한 뒤 빌드하여 MCP 클라이언트가 `plugins/anno/dist/index.js`를 가리키도록 설정하세요.

## 개발

```bash
npm install
npm test
npm run pack:check
```

게시 가능한 패키지는 `plugins/anno`에 있습니다. 생성된 의존성과 로컬 검토 세션은 커밋되지 않습니다.

## 데이터 및 개인정보 보호

Anno는 HTML과 주석을 로컬에서 처리합니다. 편집기는 루프백 주소에만 바인딩되고 Host 및 Origin 헤더를 검증합니다. 일반 호스트는 세션을 `~/.anno`에 저장하며, macOS의 Codex는 호환 경로인 `~/Library/Application Support/Codex/anno`를 사용합니다. `ANNO_DATA_DIR`로 다른 디렉터리를 지정할 수 있습니다.

Anno는 검토한 파일을 업로드하지 않습니다. 연결된 에이전트 호스트는 자체 데이터 정책에 따라 초안과 주석을 처리할 수 있습니다.

## 호환성

호스트별 동작 및 제한은 [호환성 문서](docs/compatibility.md)를 참조하세요.

## 라이선스

MIT 라이선스입니다. 포함된 WDXL Lubrifont 글꼴에는 `plugins/anno/assets/OFL-WDXL-Lubrifont.txt`의 별도 SIL Open Font License가 계속 적용됩니다.
