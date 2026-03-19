import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {CliValidationError} from '../../source/downloader/errors';
import {
	mergeDownloaderFlags,
	normalizeUrlInput,
	parseDownloaderOptions,
	toRetryPolicy,
} from '../../source/downloader/options';

describe('downloader options', () => {
	it('requires either --url or --page-url', () => {
		expect(() => parseDownloaderOptions({})).toThrow(CliValidationError);
	});

	it('applies defaults and resolves paths', () => {
		const options = parseDownloaderOptions(
			{
				url: 'https://cdn.example.com/video.m3u8',
			},
			'D:/workspace',
		);

		expect(options.out).toBe(path.resolve('D:/workspace', 'output.mp4'));
		expect(options.workdir).toBe(path.resolve('D:/workspace', 'tmp_download'));
		expect(options.concurrency).toBe(12);
		expect(options.sniff).toBe(true);
		expect(options.advanced.output.overwrite).toBe(false);
		expect(options.advanced.resilience.retryBackoffMs).toBe(250);
	});

	it('inherits referer from page url when omitted', () => {
		const options = parseDownloaderOptions({
			pageUrl: 'https://example.com/watch/1',
		});

		expect(options.referer).toBe('https://example.com/watch/1');
		expect(toRetryPolicy(options).referer).toBe('https://example.com/watch/1');
		expect(toRetryPolicy(options).userAgent).toBe('av-downloader/0.0');
		expect(toRetryPolicy(options).backoffMs).toBe(250);
	});

	it('normalizes pasted multiline url payloads', () => {
		expect(
			normalizeUrlInput(
				'  https://example.com/a.m3u8\nhttps://example.com/b.m3u8',
			),
		).toBe('https://example.com/a.m3u8');

		const options = parseDownloaderOptions({
			url: 'https://example.com/master.m3u8\nhttps://example.com/ignored',
		});

		expect(options.url).toBe('https://example.com/master.m3u8');
	});

	it('merges cli and interactive values into one runtime configuration', () => {
		const merged = mergeDownloaderFlags(
			{
				url: 'https://example.com/master.m3u8',
				concurrency: 2,
				overwrite: false,
			},
			{
				concurrency: 6,
				overwrite: true,
				keepMergedTs: true,
				startSequence: 10,
				endSequence: 40,
			},
		);

		const options = parseDownloaderOptions(merged, 'D:/workspace');

		expect(options.concurrency).toBe(6);
		expect(options.overwrite).toBe(true);
		expect(options.keepMergedTs).toBe(true);
		expect(options.startSequence).toBe(10);
		expect(options.endSequence).toBe(40);
		expect(options.advanced.network.concurrency).toBe(6);
		expect(options.advanced.segment.endSequence).toBe(40);
	});

	it('rejects invalid advanced values with actionable error messages', () => {
		expect(() =>
			parseDownloaderOptions({
				url: 'https://example.com/master.m3u8',
				retryBackoff: -1,
			}),
		).toThrowError(
			new CliValidationError(
				'Invalid --retry-backoff value: -1 (expected integer >= 0).',
			),
		);

		expect(() =>
			parseDownloaderOptions({
				url: 'https://example.com/master.m3u8',
				startSequence: 30,
				endSequence: 10,
			}),
		).toThrowError(
			new CliValidationError(
				'Invalid sequence window: --end-sequence must be >= --start-sequence.',
			),
		);
	});
});
