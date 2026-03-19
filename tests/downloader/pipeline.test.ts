import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {DownloaderRuntimeError} from '../../source/downloader/errors';
import {parseDownloaderOptions} from '../../source/downloader/options';
import {runDownloadPipeline} from '../../source/downloader/pipeline';

const tempDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		tempDirectories
			.splice(0)
			.map(async directory => fs.rm(directory, {recursive: true, force: true})),
	);
});

describe('download pipeline', () => {
	it('downloads, merges, and falls back to ts when ffmpeg is unavailable', async () => {
		const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-test-'));
		tempDirectories.push(root);

		const options = parseDownloaderOptions(
			{
				url: 'https://cdn.example.com/master.m3u8',
				out: './video.mp4',
				workdir: './tmp',
				concurrency: 2,
				retries: 0,
				timeout: 1000,
				sniff: false,
				maxMiss: 2,
				scriptLimit: 2,
			},
			root,
		);

		const playlistMap = new Map<string, string>([
			[
				'https://cdn.example.com/master.m3u8',
				'#EXTM3U\n#EXTINF:1,\nseg001.ts\n#EXTINF:1,\nseg002.ts',
			],
		]);
		const segmentMap = new Map<string, Buffer>([
			['https://cdn.example.com/seg001.ts', Buffer.from('first')],
			['https://cdn.example.com/seg002.ts', Buffer.from('second')],
		]);

		const result = await runDownloadPipeline(options, {
			fetchText: async url => {
				const value = playlistMap.get(url);
				if (!value) {
					throw new Error(`Unexpected playlist URL: ${url}`);
				}
				return value;
			},
			fetchBuffer: async url => {
				const value = segmentMap.get(url);
				if (!value) {
					throw new Error(`Unexpected segment URL: ${url}`);
				}
				return value;
			},
			hasFfmpeg: () => false,
			remuxTsToMp4: async () => {},
		});

		expect(result.outputPath.endsWith('.ts')).toBe(true);
		expect(result.segmentCount).toBe(2);
		expect(result.warnings.ffmpegUnavailable).toBe(true);
		expect(result.executionSummary.output.finalPath).toBe(result.outputPath);
		expect(result.executionSummary.output.overwrite).toBe(false);

		const mergedOutput = await fs.readFile(result.outputPath, 'utf8');
		expect(mergedOutput).toBe('firstsecond');
	});

	it('resolves master playlist to highest-bandwidth child playlist', async () => {
		const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-master-'));
		tempDirectories.push(root);

		const options = parseDownloaderOptions(
			{
				url: 'https://cdn.example.com/master.m3u8',
				out: './video.mp4',
				workdir: './tmp',
				concurrency: 1,
				retries: 0,
				timeout: 1000,
				sniff: false,
				maxMiss: 2,
				scriptLimit: 2,
			},
			root,
		);

		const playlistMap = new Map<string, string>([
			[
				'https://cdn.example.com/master.m3u8',
				'#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=100\nlow.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=200\nhigh.m3u8',
			],
			['https://cdn.example.com/high.m3u8', '#EXTM3U\n#EXTINF:1,\nseg001.ts'],
		]);
		const seenPlaylistRequests: string[] = [];

		await runDownloadPipeline(options, {
			fetchText: async url => {
				seenPlaylistRequests.push(url);
				const value = playlistMap.get(url);
				if (!value) {
					throw new Error(`Unexpected playlist URL: ${url}`);
				}
				return value;
			},
			fetchBuffer: async () => Buffer.from('payload'),
			hasFfmpeg: () => false,
			remuxTsToMp4: async () => {},
		});

		expect(seenPlaylistRequests).toContain('https://cdn.example.com/high.m3u8');
	});

	it('applies sequence window filtering before download', async () => {
		const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-sequence-'));
		tempDirectories.push(root);

		const options = parseDownloaderOptions(
			{
				url: 'https://cdn.example.com/master.m3u8',
				out: './video.mp4',
				workdir: './tmp',
				startSequence: 11,
				endSequence: 12,
				sniff: false,
			},
			root,
		);

		const requested: string[] = [];
		const result = await runDownloadPipeline(options, {
			fetchText: async () =>
				'#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:10\n#EXTINF:1,\nseg010.ts\n#EXTINF:1,\nseg011.ts\n#EXTINF:1,\nseg012.ts',
			fetchBuffer: async url => {
				requested.push(url);
				return Buffer.from(url.endsWith('seg011.ts') ? '11' : '12');
			},
			hasFfmpeg: () => false,
			remuxTsToMp4: async () => {},
		});

		expect(result.segmentCount).toBe(2);
		expect(requested).toEqual([
			'https://cdn.example.com/seg011.ts',
			'https://cdn.example.com/seg012.ts',
		]);
	});

	it('fails fast when output exists and overwrite is disabled', async () => {
		const root = await fs.mkdtemp(
			path.join(os.tmpdir(), 'pipeline-overwrite-'),
		);
		tempDirectories.push(root);

		const outputPath = path.join(root, 'video.mp4');
		await fs.writeFile(outputPath, 'existing');

		const options = parseDownloaderOptions(
			{
				url: 'https://cdn.example.com/master.m3u8',
				out: './video.mp4',
				workdir: './tmp',
				overwrite: false,
			},
			root,
		);

		await expect(
			runDownloadPipeline(options, {
				fetchText: async () => '#EXTM3U\n#EXTINF:1,\nseg001.ts',
				fetchBuffer: async () => Buffer.from('x'),
				hasFfmpeg: () => true,
				remuxTsToMp4: async () => {},
			}),
		).rejects.toThrowError(DownloaderRuntimeError);
	});

	it('removes merged.ts when keepMergedTs is disabled', async () => {
		const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-merged-'));
		tempDirectories.push(root);

		const options = parseDownloaderOptions(
			{
				url: 'https://cdn.example.com/master.m3u8',
				out: './video.mp4',
				workdir: './tmp',
				keepMergedTs: false,
				sniff: false,
			},
			root,
		);

		const result = await runDownloadPipeline(options, {
			fetchText: async () => '#EXTM3U\n#EXTINF:1,\nseg001.ts',
			fetchBuffer: async () => Buffer.from('x'),
			hasFfmpeg: () => false,
			remuxTsToMp4: async () => {},
		});

		await expect(fs.access(result.mergedTsPath)).rejects.toBeTruthy();
		expect(result.executionSummary.output.keepMergedTs).toBe(false);
	});

	it('ignores existing fallback ts when ffmpeg remux is available', async () => {
		const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-remux-'));
		tempDirectories.push(root);

		const fallbackTsPath = path.join(root, 'video.ts');
		await fs.writeFile(fallbackTsPath, 'stale ts output');

		const options = parseDownloaderOptions(
			{
				url: 'https://cdn.example.com/master.m3u8',
				out: './video.mp4',
				workdir: './tmp',
				overwrite: false,
				sniff: false,
			},
			root,
		);

		const remuxTsToMp4 = vi.fn(async () => {});

		const result = await runDownloadPipeline(options, {
			fetchText: async () => '#EXTM3U\n#EXTINF:1,\nseg001.ts',
			fetchBuffer: async () => Buffer.from('x'),
			hasFfmpeg: () => true,
			remuxTsToMp4,
		});

		expect(result.outputPath).toBe(options.out);
		expect(remuxTsToMp4).toHaveBeenCalledTimes(1);
		await expect(fs.readFile(fallbackTsPath, 'utf8')).resolves.toBe(
			'stale ts output',
		);
	});
});
