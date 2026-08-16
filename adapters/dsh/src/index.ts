import type { Context } from '@deepseek-ai/cordis';
import type { ToolDefinition } from '@deepseek-ai/dsh-tools';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { createRequire } from 'node:module';

export const name = 'anno';
export const inject = ['tools'];

const require = createRequire(import.meta.url);

function textFromContent(content: unknown): string {
  if (!Array.isArray(content)) return '';
  return content
    .filter((item): item is { type: 'text'; text: string } => Boolean(item) && typeof item === 'object' && (item as { type?: unknown }).type === 'text' && typeof (item as { text?: unknown }).text === 'string')
    .map(item => item.text)
    .join('\n');
}

export function apply(ctx: Context): void {
  let client: Client | undefined;
  let disposed = false;
  const unregister: Array<() => void> = [];

  const ready = async (): Promise<void> => {
    const serverPath = require.resolve('@philmingdao/anno/server');
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [serverPath],
      env: { ...process.env, ANNO_HOST: 'dsh' },
      stderr: 'pipe'
    });
    client = new Client({ name: 'anno-dsh', version: '0.2.1-experimental.1' });
    await client.connect(transport);
    if (disposed) {
      await client.close();
      return;
    }
    const listed = await client.listTools();
    for (const tool of listed.tools) {
      const definition = {
        name: tool.name,
        description: tool.description ?? `Anno MCP tool ${tool.name}`,
        parameters: tool.inputSchema,
        output: {
          schema: {
            type: 'object',
            additionalProperties: true,
            properties: {
              isError: { type: 'boolean' },
              text: { type: 'string', required: true },
              structuredContent: { type: 'json' }
            }
          },
          render: (_args: unknown, value: { text: string }) => [{ type: 'text' as const, text: value.text }]
        },
        execute: async (args: unknown) => {
          if (!client) throw new Error('Anno MCP client is not connected.');
          const result = await client.callTool({ name: tool.name, arguments: args as Record<string, unknown> });
          const text = textFromContent(result.content) || JSON.stringify(result.structuredContent ?? {});
          return {
            isError: result.isError === true,
            text,
            ...(result.structuredContent === undefined ? {} : { structuredContent: result.structuredContent })
          };
        }
      } as unknown as ToolDefinition;
      unregister.push(ctx.tools.register(definition));
    }
  };

  void ready().catch(error => {
    console.error(`Anno DSH bridge failed to start: ${error instanceof Error ? error.message : String(error)}`);
  });

  ctx.effect(() => async () => {
    disposed = true;
    while (unregister.length) unregister.pop()?.();
    await client?.close();
  }, 'anno.mcp-bridge');
}
