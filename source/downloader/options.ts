import path from 'node:path';
import {downloaderDefaults} from './defaults.js';
import {CliValidationError} from './errors.js';
import type {DownloaderOptions, RetryPolicy} from './types.js';

export type CliInputFlags = {
	readonly url?: string;
	readonly pageUrl?: string;
	readonly out?: string;
	readonly workdir?: string;
	readonly keyUrl?: string;
	readonly referer?: string;
	readonly concurrency?: number;
	readonly retries?: number;
	readonly timeout?: number;
	readonly sniff?: boolean;
	readonly maxMiss?: number;
	readonly scriptLimit?: number;
};

export function normalizeUrlInput(value: string): string {
	const firstLine = value
		.replace(/\r\n/g, '\n')
		.split('\n')
		.map(part => part.trim())
		.find(Boolean);

	return firstLine ?? '';
}

function assertNumber(
	value: number,
	flagName: string,
	predicate: (value: number) => boolean,
): void {
	if (!Number.isFinite(value) || !predicate(value)) {
		throw new CliValidationError(`Invalid ${flagName} value.`);
	}
}

export function parseDownloaderOptions(
	flags: CliInputFlags,
	cwd = process.cwd(),
): DownloaderOptions {
	const url = normalizeUrlInput(flags.url ?? '');
	const pageUrl = normalizeUrlInput(flags.pageUrl ?? '');

	if (!url && !pageUrl) {
		throw new CliValidationError('Missing input. Provide --url or --page-url.');
	}

	const concurrency = flags.concurrency ?? downloaderDefaults.concurrency;
	const retries = flags.retries ?? downloaderDefaults.retries;
	const timeoutMs = flags.timeout ?? downloaderDefaults.timeoutMs;
	const maxMisses = flags.maxMiss ?? downloaderDefaults.maxMisses;
	const scriptLimit = flags.scriptLimit ?? downloaderDefaults.scriptLimit;

	assertNumber(concurrency, '--concurrency', value => value >= 1);
	assertNumber(retries, '--retries', value => value >= 0);
	assertNumber(timeoutMs, '--timeout', value => value >= 1);
	assertNumber(maxMisses, '--max-miss', value => value >= 1);
	assertNumber(scriptLimit, '--script-limit', value => value >= 1);

	const pageReferer =
		normalizeUrlInput(flags.referer ?? '') || (pageUrl ? pageUrl : '');
	const out = path.resolve(cwd, flags.out?.trim() || downloaderDefaults.out);
	const workdir = path.resolve(
		cwd,
		flags.workdir?.trim() || downloaderDefaults.workdir,
	);

	return {
		url,
		pageUrl,
		out,
		workdir,
		keyUrl: normalizeUrlInput(flags.keyUrl ?? ''),
		referer: pageReferer,
		concurrency,
		retries,
		timeoutMs,
		sniff: flags.sniff ?? downloaderDefaults.sniff,
		maxMisses,
		scriptLimit,
	};
}

export function toRetryPolicy(options: DownloaderOptions): RetryPolicy {
	return {
		retries: options.retries,
		timeoutMs: options.timeoutMs,
		referer: options.referer,
	};
}
