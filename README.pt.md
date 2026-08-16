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

O repositório contém um servidor MCP partilhado e um Skill independente do host, manifestos de plug-in nativos quando o host os suporta e modelos MCP prontos a copiar para Cursor, Google Antigravity, Windsurf, GitHub Copilot e Meta Muse Code. O suporte para DeepSeek Harness e Muse Code é experimental.

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

Codex, Claude Code, WorkBuddy e CodeBuddy utilizam manifestos de plug-in incluídos no pacote. Cursor, Google Antigravity, Windsurf, GitHub Copilot CLI/Chat e Muse Code ligam-se ao mesmo servidor MCP stdio local através de modelos específicos para cada host. O DeepSeek Harness utiliza uma ponte nativa experimental.

Consulte o [guia de integração de ferramentas de agente](docs/agent-tools.md) para configurações prontas a copiar e limitações específicas de cada host.

## Instalação no Codex

```bash
codex plugin marketplace add philmingdao/anno --ref main
codex plugin add anno@anno
```

Para uma instalação reproduzível, substitua `main` por uma etiqueta de versão como `v0.3.0`.

## Instalação no Claude Code

```text
/plugin marketplace add philmingdao/anno
/plugin install anno@anno
```

## Instalação no WorkBuddy ou CodeBuddy

Adicione `philmingdao/anno` como marketplace de plug-ins e instale `anno`. Durante o desenvolvimento local, carregue `plugins/anno` através da opção de diretório de plug-ins do host.

## Utilização direta do servidor MCP

Depois da publicação do pacote npm, qualquer cliente MCP stdio poderá executar:

```bash
npx -y @philmingdao/anno
```

Até lá, clone o repositório, instale as dependências, faça a compilação e configure o cliente MCP para usar `plugins/anno/dist/index.js`.

## Desenvolvimento

```bash
npm install
npm test
npm run pack:check
```

O pacote publicável encontra-se em `plugins/anno`. As dependências geradas e as sessões de revisão locais não são incluídas nos commits.

## Dados e privacidade

O Anno processa HTML e anotações localmente. O editor escuta apenas na interface de loopback e valida os cabeçalhos Host e Origin. Hosts genéricos guardam sessões em `~/.anno`; no macOS, o Codex mantém o caminho compatível `~/Library/Application Support/Codex/anno`. Utilize `ANNO_DATA_DIR` para escolher outro diretório.

O Anno não envia os ficheiros revistos. O host do agente ligado pode processar rascunhos e anotações de acordo com a sua própria política de dados.

## Compatibilidade

Consulte a [documentação de compatibilidade](docs/compatibility.md) para o comportamento e as limitações de cada host.

## Licença

Licença MIT. A fonte WDXL Lubrifont incluída continua abrangida pela sua SIL Open Font License separada em `plugins/anno/assets/OFL-WDXL-Lubrifont.txt`.
