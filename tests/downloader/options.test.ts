import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {CliValidationError} from '../../source/downloader/errors';
import {
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
	});

	it('inherits referer from page url when omitted', () => {
		const options = parseDownloaderOptions({
			pageUrl: 'https://example.com/watch/1',
		});

		expect(options.referer).toBe('https://example.com/watch/1');
		expect(toRetryPolicy(options).referer).toBe('https://example.com/watch/1');
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
});
