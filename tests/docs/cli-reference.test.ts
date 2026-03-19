import {describe, expect, it} from 'vitest';
import {buildCliReferenceMarkdown} from '../../tools/docs/cli-reference';
import {cliFlags, toCliFlagName} from '../../source/cli-metadata';

describe('cli reference generation', () => {
	it('renders usage, examples, and option defaults into markdown', () => {
		const markdown = buildCliReferenceMarkdown();

		expect(markdown).toContain('# CLI Reference');
		expect(markdown).toContain('## Usage');
		expect(markdown).toContain('| `--url` | `string` | `-` |');
		expect(markdown).toContain('| `--concurrency` | `number` | `12` |');
		expect(markdown).toContain('| `--retry-backoff` | `number` | `250` |');
		expect(markdown).toContain('| `--keep-merged-ts` | `boolean` | `false` |');
		expect(markdown).toContain('--page-url');
	});

	it('matches the committed CLI reference snapshot', () => {
		expect(buildCliReferenceMarkdown()).toMatchInlineSnapshot(`
			"# CLI Reference

			## Usage

			\`\`\`bash
			$ av-downloader --url <m3u8-url> [options]
			$ av-downloader --page-url <page-url> [options]
			\`\`\`

			## Options

			| Option | Type | Default | Description |
			| --- | --- | --- | --- |
			| \`--url\` | \`string\` | \`-\` | Direct m3u8 playlist URL (typed, pasted, or interactive prompt input). |
			| \`--page-url\` | \`string\` | \`-\` | Page URL used for media URL discovery (typed, pasted, or interactive prompt input). |
			| \`--out\` | \`string\` | \`output.mp4\` | Output mp4 path. |
			| \`--workdir\` | \`string\` | \`tmp_download\` | Temporary working directory. |
			| \`--concurrency\` | \`number\` | \`12\` | Concurrent segment downloads (>=1). |
			| \`--retries\` | \`number\` | \`3\` | Retries per request (>=0). |
			| \`--timeout\` | \`number\` | \`15000\` | Request timeout in milliseconds (>=1). |
			| \`--referer\` | \`string\` | \`-\` | Override HTTP Referer header. |
			| \`--user-agent\` | \`string\` | \`av-downloader/0.0\` | Override HTTP User-Agent header. |
			| \`--script-limit\` | \`number\` | \`20\` | Max script files inspected during page discovery. |
			| \`--sniff\` | \`boolean\` | \`true\` | Enable sequential segment sniffing. Use --no-sniff to disable. Warnings are shown in both interactive and non-interactive modes. |
			| \`--max-miss\` | \`number\` | \`8\` | Stop sniffing after this many misses. |
			| \`--retry-backoff\` | \`number\` | \`250\` | Base backoff delay in milliseconds for retries (>=0). |
			| \`--start-sequence\` | \`number\` | \`0\` | Optional starting segment sequence filter (>=0). |
			| \`--end-sequence\` | \`number\` | \`0\` | Optional ending segment sequence filter (>=0). |
			| \`--overwrite\` | \`boolean\` | \`false\` | Allow replacing an existing output file. Use --no-overwrite to enforce safe writes. |
			| \`--keep-merged-ts\` | \`boolean\` | \`false\` | Keep merged.ts in workdir after completion for debugging or remux replay. |
			| \`--key-url\` | \`string\` | \`-\` | Override AES-128 key URL. |

			## Examples

			\`\`\`text
			$ av-downloader --url "https://example.com/video/master.m3u8" --out "./video.mp4"
			$ av-downloader --page-url "https://example.com/watch/123" --key-url "https://example.com/video/ts.key"
			\`\`\`
			"
		`);
	});

	it('includes every runtime metadata flag in generated reference output', () => {
		const markdown = buildCliReferenceMarkdown();
		for (const flagName of Object.keys(cliFlags)) {
			expect(markdown).toContain(`--${toCliFlagName(flagName)}`);
		}
	});
});
