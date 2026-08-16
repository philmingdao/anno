<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="plugins/anno/assets/logo-dark.svg">
    <img src="plugins/anno/assets/logo.svg" alt="Anno" width="240">
  </picture>
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.fr.md">Français</a> · <strong>Español</strong> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a> · <a href="README.pt.md">Português</a> · <a href="README.th.md">ไทย</a>
</p>

# Anno

Anno es un espacio de revisión HTML local para agentes de programación con IA. Abre en el navegador una copia aislada de un archivo HTML local y permite editar directamente el texto y el formato, añadir comentarios sobre elementos y anotaciones de área, y revisar presentaciones diapositiva por diapositiva. Al finalizar, crea una entrega persistente que un agente puede reclamar y convertir en un archivo HTML independiente y verificado.

El repositorio incluye un servidor MCP compartido y un Skill independiente del anfitrión, manifiestos de complementos nativos cuando la plataforma los admite y plantillas MCP listas para copiar para Cursor, Google Antigravity, Windsurf, GitHub Copilot y Meta Muse Code. La compatibilidad con DeepSeek Harness y Muse Code es experimental.

## Funciones destacadas

- Editor HTTP local enlazado únicamente a `127.0.0.1`
- Los archivos de origen nunca se sobrescriben
- Edición de texto, tipografía, color, posición, notas de página y anotaciones de elementos o áreas
- Entregas de agente persistentes e idempotentes
- Compatibilidad con sesiones `needs_codex` existentes
- Implementación compartida de MCP y `SKILL.md` entre plataformas compatibles
- Interfaz en chino simplificado e inglés, con temas claro y oscuro

## Requisitos

- Node.js 22 o posterior
- Una plataforma compatible con servidores MCP stdio locales y acceso a archivos locales
- Un navegador para el editor de revisión

## Herramientas de agente compatibles

Codex, Claude Code, WorkBuddy y CodeBuddy usan manifiestos de complementos empaquetados. Cursor, Google Antigravity, Windsurf, GitHub Copilot CLI/Chat y Muse Code se conectan al mismo servidor MCP stdio local mediante plantillas específicas. DeepSeek Harness utiliza un puente nativo experimental.

Consulta la [guía de integración con herramientas de agentes](docs/agent-tools.md) para obtener configuraciones listas para copiar y conocer las limitaciones de cada plataforma.

| Herramienta de agente | Integración | Estado |
| --- | --- | --- |
| Codex | Complemento nativo + MCP | Compatible |
| Claude Code | Complemento nativo + MCP | Compatible |
| WorkBuddy / CodeBuddy | Complemento nativo + MCP | Compatible |
| Cursor | MCP stdio local | Compatible |
| Google Antigravity | MCP stdio local | Compatible |
| Windsurf | MCP stdio local | Compatible |
| GitHub Copilot CLI / Chat | MCP stdio local | Compatible en local |
| DeepSeek Harness | Puente Cordis-to-MCP | Experimental |
| Meta Muse Code | MCP stdio local | Experimental |

## Instalación en Codex

```bash
codex plugin marketplace add philmingdao/anno --ref main
codex plugin add anno@anno
```

Para una instalación reproducible, sustituye `main` por una etiqueta de versión como `v0.3.1`.

## Instalación en Claude Code

```text
/plugin marketplace add philmingdao/anno
/plugin install anno@anno
```

## Instalación en WorkBuddy o CodeBuddy

Añade `philmingdao/anno` como marketplace de complementos e instala `anno`. Durante el desarrollo local, carga `plugins/anno` con la opción de directorio de complementos de la plataforma.

## Instalación en Cursor, Antigravity, Windsurf, Copilot o Muse Code

Estas herramientas utilizan el mismo servidor MCP local. Hasta que se publique el paquete npm, prepáralo una sola vez:

```bash
git clone https://github.com/philmingdao/anno.git
cd anno
npm install
npm run build
```

En la plantilla elegida, sustituye `/absolute/path/to/anno` por la ruta absoluta del repositorio clonado y copia o combina el archivo en el destino indicado:

| Herramienta de agente | Plantilla | Destino de configuración |
| --- | --- | --- |
| Cursor | [`cursor/mcp.json`](plugins/anno/integrations/cursor/mcp.json) | `.cursor/mcp.json` del proyecto o `~/.cursor/mcp.json` |
| Google Antigravity | [`antigravity/mcp_config.json`](plugins/anno/integrations/antigravity/mcp_config.json) | `.agents/mcp_config.json` del proyecto o `~/.gemini/config/mcp_config.json` |
| Windsurf | [`windsurf/mcp_config.json`](plugins/anno/integrations/windsurf/mcp_config.json) | Combinar en `~/.codeium/windsurf/mcp_config.json` |
| GitHub Copilot CLI | [`github-copilot/mcp-config.json`](plugins/anno/integrations/github-copilot/mcp-config.json) | Combinar en `~/.copilot/mcp-config.json` |
| GitHub Copilot Chat en VS Code | [`github-copilot/vscode-mcp.json`](plugins/anno/integrations/github-copilot/vscode-mcp.json) | `.vscode/mcp.json` del proyecto |
| Meta Muse Code | [`muse-code/mcp.json`](plugins/anno/integrations/muse-code/mcp.json) | Importar con el gestor MCP de la versión instalada; experimental |

Copilot CLI también puede configurarse directamente:

```bash
copilot mcp add anno --env ANNO_HOST=copilot -- node /absolute/path/to/anno/plugins/anno/dist/index.js
```

Después de guardar, reinicia la herramienta o actualiza su lista de servidores MCP. El Coding Agent en la nube de GitHub no puede exponer la URL de bucle local de Anno; usa Copilot localmente. Muse Code sigue siendo experimental porque su contrato público de configuración MCP aún no es estable.

## Uso directo del servidor MCP

Cuando se publique el paquete npm, cualquier cliente MCP stdio podrá ejecutar:

```bash
npx -y @philmingdao/anno
```

Hasta entonces, clona el repositorio, instala las dependencias, compila el proyecto y configura el cliente MCP para usar `plugins/anno/dist/index.js`.

## Desarrollo

```bash
npm install
npm test
npm run pack:check
```

El paquete publicable se encuentra en `plugins/anno`. Las dependencias generadas y las sesiones locales de revisión no se incluyen en los commits.

## Datos y privacidad

Anno procesa el HTML y las anotaciones localmente. El editor solo escucha en la interfaz de bucle local y valida los encabezados Host y Origin. Las plataformas genéricas guardan las sesiones en `~/.anno`; Codex mantiene en macOS la ruta compatible `~/Library/Application Support/Codex/anno`. Usa `ANNO_DATA_DIR` para elegir otro directorio.

Anno no sube los archivos revisados. La plataforma del agente conectado puede procesar los borradores y las anotaciones de acuerdo con su propia política de datos.

## Compatibilidad

Consulta la [documentación de compatibilidad](docs/compatibility.md) para conocer el comportamiento y las limitaciones de cada plataforma.

## Licencia

Licencia MIT. La fuente WDXL Lubrifont incluida sigue cubierta por su licencia SIL Open Font License independiente en `plugins/anno/assets/OFL-WDXL-Lubrifont.txt`.
