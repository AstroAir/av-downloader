import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {
	cliExamples,
	cliFlags,
	cliName,
	toCliFlagName,
} from '../../source/cli-metadata.js';

function toOptionRows(): string {
	return Object.entries(cliFlags)
		.map(([name, definition]) => {
			const defaultValue =
				definition.default === undefined ? '-' : String(definition.default);
			return `| \`--${toCliFlagName(name)}\` | \`${
				definition.type
			}\` | \`${defaultValue}\` | ${definition.description} |`;
		})
		.join('\n');
}

export function buildCliReferenceMarkdown(): string {
	return `# CLI Reference

## Usage

\`\`\`bash
$ ${cliName} --url <m3u8-url> [options]
$ ${cliName} --page-url <page-url> [options]
\`\`\`

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
${toOptionRows()}

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
