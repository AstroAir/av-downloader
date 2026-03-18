import {downloaderDefaults} from './downloader/defaults.js';

export const cliName = 'av-downloader';

export type CliFlagDefinition = {
	readonly type: 'string' | 'number' | 'boolean';
	readonly description: string;
	readonly default?: string | number | boolean;
	readonly shortFlag?: string;
};

export const cliFlags = {
	url: {
		type: 'string',
		shortFlag: 'u',
		description:
			'Direct m3u8 playlist URL (typed, pasted, or interactive prompt input).',
	},
	pageUrl: {
		type: 'string',
		shortFlag: 'p',
		description:
			'Page URL used for media URL discovery (typed, pasted, or interactive prompt input).',
	},
	out: {
		type: 'string',
		shortFlag: 'o',
		description: 'Output mp4 path.',
		default: downloaderDefaults.out,
	},
	workdir: {
		type: 'string',
		description: 'Temporary working directory.',
		default: downloaderDefaults.workdir,
	},
	concurrency: {
		type: 'number',
		shortFlag: 'c',
		description: 'Concurrent segment downloads (>=1).',
		default: downloaderDefaults.concurrency,
	},
	retries: {
		type: 'number',
		description: 'Retries per request (>=0).',
		default: downloaderDefaults.retries,
	},
	timeout: {
		type: 'number',
		description: 'Request timeout in milliseconds (>=1).',
		default: downloaderDefaults.timeoutMs,
	},
	referer: {
		type: 'string',
		description: 'Override HTTP Referer header.',
	},
	scriptLimit: {
		type: 'number',
		description: 'Max script files inspected during page discovery.',
		default: downloaderDefaults.scriptLimit,
	},
	sniff: {
		type: 'boolean',
		description:
			'Enable sequential segment sniffing. Use --no-sniff to disable. Warnings are shown in both interactive and non-interactive modes.',
		default: downloaderDefaults.sniff,
	},
	maxMiss: {
		type: 'number',
		description: 'Stop sniffing after this many misses.',
		default: downloaderDefaults.maxMisses,
	},
	keyUrl: {
		type: 'string',
		description: 'Override AES-128 key URL.',
	},
} as const satisfies Record<string, CliFlagDefinition>;

export type CliFlagName = keyof typeof cliFlags;

export const cliExamples = [
	`$ ${cliName} --url "https://example.com/video/master.m3u8" --out "./video.mp4"`,
	`$ ${cliName} --page-url "https://example.com/watch/123" --key-url "https://example.com/video/ts.key"`,
] as const;

export function toCliFlagName(name: string): string {
	return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function formatOptionLine(name: CliFlagName): string {
	const definition: CliFlagDefinition = cliFlags[name];
	const short = definition.shortFlag ? `-${definition.shortFlag}, ` : '';
	const long = toCliFlagName(name);
	const defaultText =
		definition.default === undefined
			? ''
			: ` (default: ${String(definition.default)})`;
	return `  ${short}--${long}  ${definition.description}${defaultText}`;
}

export function buildCliHelpText(): string {
	const optionLines = (Object.keys(cliFlags) as CliFlagName[])
		.map(name => formatOptionLine(name))
		.join('\n');

	return `
Usage
  $ ${cliName} --url <m3u8-url> [options]
  $ ${cliName} --page-url <page-url> [options]

Inputs
	At least one of --url or --page-url is required.
	In interactive terminals, missing input can be entered with a keyboard/paste prompt.

Output Modes
	Interactive TTY: live progress and status UI.
	Non-interactive/CI: deterministic summary lines for logs and automation.

Options
${optionLines}

Examples
  ${cliExamples[0]}
  ${cliExamples[1]}
`;
}
