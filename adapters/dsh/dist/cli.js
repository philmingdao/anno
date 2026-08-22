#!/usr/bin/env node
import { ANNO_DSH_VERSION, doctor, install, uninstall, update, } from './index.js';
function valueAfter(args, flag) {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
}
function optionsFrom(args) {
    const profile = valueAfter(args, '--profile');
    const dshHome = valueAfter(args, '--dsh-home');
    const packageSpec = valueAfter(args, '--package-spec');
    return {
        ...(profile ? { profile } : {}),
        ...(dshHome ? { dshHome } : {}),
        ...(packageSpec ? { packageSpec } : {}),
        dryRun: args.includes('--dry-run'),
        force: args.includes('--force'),
        skipDoctor: args.includes('--skip-doctor'),
    };
}
function printChanges(changes) {
    for (const change of changes) {
        const backup = change.backup ? ` (backup: ${change.backup})` : '';
        console.log(`${change.action}: ${change.target}${backup}`);
    }
}
function usage() {
    console.log(`Anno for DeepSeek Harness ${ANNO_DSH_VERSION}\n\nUsage:\n  anno-dsh install [--profile web]\n  anno-dsh update [--profile web]\n  anno-dsh doctor [--profile web]\n  anno-dsh uninstall [--profile web]\n\nOptions:\n  --profile NAME       DSH profile to configure (default: web)\n  --dsh-home PATH      Override DSH_HOME (default: $DSH_HOME or ~/.dsh)\n  --package-spec SPEC  Package/path to add; useful for source and tarball testing\n  --dry-run            Show intended changes without writing\n  --skip-doctor        Skip post-install profile and MCP verification\n  --force              Remove a locally modified installed skill during uninstall\n`);
}
const args = process.argv.slice(2);
const command = args[0] ?? 'install';
try {
    switch (command) {
        case 'install':
            printChanges(await install(optionsFrom(args.slice(1))));
            break;
        case 'update':
            printChanges(await update(optionsFrom(args.slice(1))));
            break;
        case 'doctor':
            printChanges(await doctor(optionsFrom(args.slice(1))));
            break;
        case 'uninstall':
        case 'remove':
            printChanges(await uninstall(optionsFrom(args.slice(1))));
            break;
        case '--version':
        case '-v':
        case 'version':
            console.log(ANNO_DSH_VERSION);
            break;
        case '--help':
        case '-h':
        case 'help':
            usage();
            break;
        default:
            throw new Error(`Unknown command: ${command}. Run anno-dsh --help.`);
    }
}
catch (error) {
    console.error(`Anno DSH error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
}
//# sourceMappingURL=cli.js.map