import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {
	cliExamples,
	cliFlags,
	cliName,
	defaultName,
} from '../../source/cli-metadata.js';

export function buildCliReferenceMarkdown(): string {
	return `# CLI Reference

## Usage

\`\`\`bash
$ ${cliName}
\`\`\`

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| \`--name\` | \`${cliFlags.name.type}\` | \`${defaultName}\` | ${cliFlags.name.description} |

## Examples

\`\`\`text
${cliExamples[0]}
${cliExamples[1]}
\`\`\`
`;
}

export async function writeCliReferenceFile(outputPath: string): Promise<void> {
	await mkdir(path.dirname(outputPath), {recursive: true});
	await writeFile(outputPath, buildCliReferenceMarkdown(), 'utf8');
}
