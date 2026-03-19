import path from 'node:path';
import {downloaderDefaults} from './defaults.js';
import {CliValidationError} from './errors.js';
import type {AdvancedOptions, DownloaderOptions, RetryPolicy} from './types.js';

export type CliInputFlags = {
	readonly url?: string;
	readonly pageUrl?: string;
	readonly out?: string;
	readonly workdir?: string;
	readonly keyUrl?: string;
	readonly referer?: string;
	readonly userAgent?: string;
	readonly concurrency?: number;
	readonly retries?: number;
	readonly timeout?: number;
	readonly retryBackoff?: number;
	readonly sniff?: boolean;
	readonly maxMiss?: number;
	readonly scriptLimit?: number;
	readonly startSequence?: number;
	readonly endSequence?: number;
	readonly overwrite?: boolean;
	readonly keepMergedTs?: boolean;
};

export function mergeDownloaderFlags(
	baseFlags: CliInputFlags,
	interactiveFlags: Partial<CliInputFlags> = {},
): CliInputFlags {
	const merged: Record<string, boolean | number | string | undefined> = {
		...baseFlags,
	};

	for (const [key, value] of Object.entries(interactiveFlags)) {
		if (value !== undefined) {
			merged[key] = value;
		}
	}

	return merged as CliInputFlags;
}

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
	expected: string,
	predicate: (value: number) => boolean,
): void {
	if (!Number.isFinite(value) || !predicate(value)) {
		throw new CliValidationError(
			`Invalid ${flagName} value: ${String(value)} (expected ${expected}).`,
		);
	}
}

function toAdvancedOptions(
	flags: CliInputFlags,
	cwd: string,
): {
	readonly advanced: AdvancedOptions;
	readonly referer: string;
	readonly keyUrl: string;
	readonly url: string;
	readonly pageUrl: string;
} {
	const url = normalizeUrlInput(flags.url ?? '');
	const pageUrl = normalizeUrlInput(flags.pageUrl ?? '');

	if (!url && !pageUrl) {
		throw new CliValidationError('Missing input. Provide --url or --page-url.');
	}

	const concurrency = flags.concurrency ?? downloaderDefaults.concurrency;
	const retries = flags.retries ?? downloaderDefaults.retries;
	const timeoutMs = flags.timeout ?? downloaderDefaults.timeoutMs;
	const retryBackoffMs = flags.retryBackoff ?? downloaderDefaults.retryBackoffMs;
	const maxMisses = flags.maxMiss ?? downloaderDefaults.maxMisses;
	const scriptLimit = flags.scriptLimit ?? downloaderDefaults.scriptLimit;
	const startSequence =
		flags.startSequence ?? downloaderDefaults.startSequence;
	const endSequence = flags.endSequence ?? downloaderDefaults.endSequence;

	assertNumber(concurrency, '--concurrency', 'integer >= 1', value =>
		Number.isInteger(value) && value >= 1,
	);
	assertNumber(retries, '--retries', 'integer >= 0', value =>
		Number.isInteger(value) && value >= 0,
	);
	assertNumber(timeoutMs, '--timeout', 'integer >= 1', value =>
		Number.isInteger(value) && value >= 1,
	);
	assertNumber(retryBackoffMs, '--retry-backoff', 'integer >= 0', value =>
		Number.isInteger(value) && value >= 0,
	);
	assertNumber(maxMisses, '--max-miss', 'integer >= 1', value =>
		Number.isInteger(value) && value >= 1,
	);
	assertNumber(scriptLimit, '--script-limit', 'integer >= 1', value =>
		Number.isInteger(value) && value >= 1,
	);
	assertNumber(startSequence, '--start-sequence', 'integer >= 0', value =>
		Number.isInteger(value) && value >= 0,
	);
	assertNumber(endSequence, '--end-sequence', 'integer >= 0', value =>
		Number.isInteger(value) && value >= 0,
	);

	if (startSequence > 0 && endSequence > 0 && endSequence < startSequence) {
		throw new CliValidationError(
			'Invalid sequence window: --end-sequence must be >= --start-sequence.',
		);
	}

	const referer =
		normalizeUrlInput(flags.referer ?? '') || (pageUrl ? pageUrl : '');
	const userAgent =
		normalizeUrlInput(flags.userAgent ?? '') || downloaderDefaults.userAgent;
	const out = path.resolve(cwd, flags.out?.trim() || downloaderDefaults.out);
	const workdir = path.resolve(
		cwd,
		flags.workdir?.trim() || downloaderDefaults.workdir,
	);

	return {
		url,
		pageUrl,
		referer,
		keyUrl: normalizeUrlInput(flags.keyUrl ?? ''),
		advanced: {
			network: {
				concurrency,
				timeoutMs,
				referer,
				userAgent,
			},
			segment: {
				sniff: flags.sniff ?? downloaderDefaults.sniff,
				maxMisses,
				scriptLimit,
				startSequence,
				endSequence,
			},
			output: {
				out,
				workdir,
				overwrite: flags.overwrite ?? downloaderDefaults.overwrite,
				keepMergedTs: flags.keepMergedTs ?? downloaderDefaults.keepMergedTs,
			},
			resilience: {
				retries,
				retryBackoffMs,
			},
		},
	};
}

export function parseDownloaderOptions(
	flags: CliInputFlags,
	cwd = process.cwd(),
	interactiveFlags: Partial<CliInputFlags> = {},
): DownloaderOptions {
	const merged = mergeDownloaderFlags(flags, interactiveFlags);
	const normalized = toAdvancedOptions(merged, cwd);

	return {
		url: normalized.url,
		pageUrl: normalized.pageUrl,
		keyUrl: normalized.keyUrl,
		advanced: normalized.advanced,
		out: normalized.advanced.output.out,
		workdir: normalized.advanced.output.workdir,
		referer: normalized.referer,
		concurrency: normalized.advanced.network.concurrency,
		retries: normalized.advanced.resilience.retries,
		timeoutMs: normalized.advanced.network.timeoutMs,
		retryBackoffMs: normalized.advanced.resilience.retryBackoffMs,
		userAgent: normalized.advanced.network.userAgent,
		sniff: normalized.advanced.segment.sniff,
		maxMisses: normalized.advanced.segment.maxMisses,
		scriptLimit: normalized.advanced.segment.scriptLimit,
		startSequence: normalized.advanced.segment.startSequence,
		endSequence: normalized.advanced.segment.endSequence,
		overwrite: normalized.advanced.output.overwrite,
		keepMergedTs: normalized.advanced.output.keepMergedTs,
	};
}

export function toRetryPolicy(options: DownloaderOptions): RetryPolicy {
	return {
		retries: options.retries,
		timeoutMs: options.timeoutMs,
		referer: options.referer,
		userAgent: options.userAgent,
		backoffMs: options.retryBackoffMs,
	};
}
