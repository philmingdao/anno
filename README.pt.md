<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="plugins/anno/assets/logo-dark.svg">
    <img src="plugins/anno/assets/logo.svg" alt="Anno" width="240">
  </picture>
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a> · <strong>Português</strong> · <a href="README.th.md">ไทย</a>
</p>

# Anno

O Anno é um espaço de revisão HTML local para agentes de programação com IA. Ele abre no navegador uma cópia isolada de um ficheiro HTML local e permite editar diretamente texto e formatação, adicionar comentários a elementos e anotações de área e rever apresentações diapositivo a diapositivo. Quando a revisão termina, o Anno cria uma passagem persistente que um agente pode assumir e transformar num ficheiro HTML autónomo e verificado.

O repositório contém um servidor MCP partilhado e um Skill independente do host, manifestos de plug-in nativos quando o host os suporta e modelos MCP prontos a copiar para Cursor, Google Antigravity, Windsurf, GitHub Copilot e Meta Muse Code. A integração com DeepSeek Harness é mantida separadamente em [`philmingdao/anno-dsh-native`](https://github.com/philmingdao/anno-dsh-native), um plug-in nativo em processo desenvolvido com DeepSeek Harness. O Muse Code continua experimental.

## Principais funcionalidades

- Editor HTTP local associado apenas a `127.0.0.1`
- Os ficheiros de origem nunca são substituídos
- Edição de texto, tipografia, cor, posição, notas de página e anotações de elementos ou áreas
- Passagens de agente persistentes e idempotentes
- Compatibilidade com sessões `needs_codex` existentes
- Implementação MCP e `SKILL.md` partilhada entre os hosts suportados
- Interface em chinês simplificado e inglês, com temas claro e escuro

## Requisitos

- Node.js 22 ou posterior
- Um host compatível com servidores MCP stdio locais e acesso a ficheiros locais
- Um navegador para o editor de revisão

## Ferramentas de agente suportadas

Codex, Claude Code, WorkBuddy e CodeBuddy utilizam manifestos de plug-in incluídos no pacote. Cursor, Google Antigravity, Windsurf, GitHub Copilot CLI/Chat e Muse Code ligam-se ao mesmo servidor MCP stdio local através de modelos específicos para cada host. O DeepSeek Harness usa o repositório nativo independente [`anno-dsh-native`](https://github.com/philmingdao/anno-dsh-native), integrado diretamente com o perfil, o registo de ferramentas e o ciclo de vida dos agentes DSH, sem ponte MCP.

Consulte o [guia de integração de ferramentas de agente](docs/agent-tools.md) para configurações prontas a copiar e limitações específicas de cada host.

| Ferramenta de agente | Integração | Estado |
| --- | --- | --- |
| Codex | Plug-in nativo + MCP | Suportado |
| Claude Code | Plug-in nativo + MCP | Suportado |
| WorkBuddy / CodeBuddy | Plug-in nativo + MCP | Suportado |
| Cursor | MCP stdio local | Suportado |
| Google Antigravity | MCP stdio local | Suportado |
| Windsurf | MCP stdio local | Suportado |
| GitHub Copilot CLI / Chat | MCP stdio local | Suportado localmente |
| DeepSeek Harness | Plug-in DSH nativo independente | Verificado em 0.1.0-rc.6 |
| Meta Muse Code | MCP stdio local | Experimental |

## Instalação com um único comando

Não é necessário clonar nem compilar. O instalador deteta os agentes disponíveis, combina apenas a entrada `anno` no JSON/JSONC existente, instala Skill e MCP, cria uma cópia de segurança e verifica a ligação.

```bash
npx -y @philmingdao/anno@0.4.0 setup
npx -y @philmingdao/anno@0.4.0 setup --host cursor,windsurf,copilot
npx -y @philmingdao/anno@0.4.0 doctor --host cursor
```

A implementação nativa para DeepSeek Harness é instalada a partir do repositório independente:

```bash
dsh plugin --profile web add github:philmingdao/anno-dsh-native
dsh web
```

Consulte [`philmingdao/anno-dsh-native`](https://github.com/philmingdao/anno-dsh-native) para arquitetura, compatibilidade e instalação a partir do código-fonte. O plug-in foi desenvolvido e validado com DeepSeek Harness.

Codex, Claude Code, WorkBuddy e CodeBuddy usam plug-ins nativos; Antigravity recebe um pacote completo. Para Muse Code, indique o caminho de configuração confirmado: `npx -y @philmingdao/anno@0.4.0 setup --host muse --config /absolute/path/to/mcp.json`.

Ambientes geridos podem usar os modelos com versão fixa abaixo.

| Ferramenta de agente | Modelo | Destino da configuração |
| --- | --- | --- |
| Cursor | [`cursor/mcp.json`](plugins/anno/integrations/cursor/mcp.json) | `.cursor/mcp.json` do projeto ou `~/.cursor/mcp.json` |
| Google Antigravity | [`antigravity/mcp_config.json`](plugins/anno/integrations/antigravity/mcp_config.json) | `.agents/mcp_config.json` do projeto ou `~/.gemini/config/mcp_config.json` |
| Windsurf | [`windsurf/mcp_config.json`](plugins/anno/integrations/windsurf/mcp_config.json) | Combinar em `~/.codeium/windsurf/mcp_config.json` |
| GitHub Copilot CLI | [`github-copilot/mcp-config.json`](plugins/anno/integrations/github-copilot/mcp-config.json) | Combinar em `~/.copilot/mcp-config.json` |
| GitHub Copilot Chat no VS Code | [`github-copilot/vscode-mcp.json`](plugins/anno/integrations/github-copilot/vscode-mcp.json) | `.vscode/mcp.json` do projeto |
| Meta Muse Code | [`muse-code/mcp.json`](plugins/anno/integrations/muse-code/mcp.json) | Importar através do gestor MCP da versão instalada; experimental |

O Copilot CLI também pode ser configurado diretamente:

```bash
copilot mcp add anno --env ANNO_HOST=copilot -- npx -y @philmingdao/anno@0.4.0 mcp
```

Depois de guardar, reinicie a ferramenta ou atualize a lista de servidores MCP. O Coding Agent da GitHub na nuvem não consegue expor o URL de loopback do Anno ao navegador do utilizador; utilize o Copilot localmente. O Muse Code continua experimental porque o seu contrato público de configuração MCP ainda não é estável.

## Utilização direta do servidor MCP

Qualquer cliente MCP stdio pode executar:

```bash
npx -y @philmingdao/anno@0.4.0 mcp
```

## Desenvolvimento

```bash
npm install
npm test
npm run pack:check
```

O pacote MCP principal encontra-se em `plugins/anno`; a implementação DeepSeek Harness é mantida no repositório independente [`anno-dsh-native`](https://github.com/philmingdao/anno-dsh-native). As dependências geradas e as sessões de revisão locais não são incluídas nos commits.

## Dados e privacidade

O Anno processa HTML e anotações localmente. O editor escuta apenas na interface de loopback e valida os cabeçalhos Host e Origin. Hosts genéricos guardam sessões em `~/.anno`; no macOS, o Codex mantém o caminho compatível `~/Library/Application Support/Codex/anno`. Utilize `ANNO_DATA_DIR` para escolher outro diretório.

O Anno não envia os ficheiros revistos. O host do agente ligado pode processar rascunhos e anotações de acordo com a sua própria política de dados.

## Compatibilidade

Consulte a [documentação de compatibilidade](docs/compatibility.md) para o comportamento e as limitações de cada host.

## Licença

Licença MIT. A fonte WDXL Lubrifont incluída continua abrangida pela sua SIL Open Font License separada em `plugins/anno/assets/OFL-WDXL-Lubrifont.txt`.
