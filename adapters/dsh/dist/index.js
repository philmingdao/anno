import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { createRequire } from 'node:module';
export const name = 'anno';
export const inject = ['tools'];
const require = createRequire(import.meta.url);
function textFromContent(content) {
    if (!Array.isArray(content))
        return '';
    return content
        .filter((item) => Boolean(item) && typeof item === 'object' && item.type === 'text' && typeof item.text === 'string')
        .map(item => item.text)
        .join('\n');
}
export function apply(ctx) {
    let client;
    let disposed = false;
    const unregister = [];
    const ready = async () => {
        const serverPath = require.resolve('@philmingdao/anno/server');
        const transport = new StdioClientTransport({
            command: process.execPath,
            args: [serverPath],
            env: { ...process.env, ANNO_HOST: 'dsh' },
            stderr: 'pipe'
        });
        client = new Client({ name: 'anno-dsh', version: '0.3.0-experimental.1' });
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
                    render: (_args, value) => [{ type: 'text', text: value.text }]
                },
                execute: async (args) => {
                    if (!client)
                        throw new Error('Anno MCP client is not connected.');
                    const result = await client.callTool({ name: tool.name, arguments: args });
                    const text = textFromContent(result.content) || JSON.stringify(result.structuredContent ?? {});
                    return {
                        isError: result.isError === true,
                        text,
                        ...(result.structuredContent === undefined ? {} : { structuredContent: result.structuredContent })
                    };
                }
            };
            unregister.push(ctx.tools.register(definition));
        }
    };
    void ready().catch(error => {
        console.error(`Anno DSH bridge failed to start: ${error instanceof Error ? error.message : String(error)}`);
    });
    ctx.effect(() => async () => {
        disposed = true;
        while (unregister.length)
            unregister.pop()?.();
        await client?.close();
    }, 'anno.mcp-bridge');
}
//# sourceMappingURL=index.js.map