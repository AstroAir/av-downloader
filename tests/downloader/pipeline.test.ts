import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
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

		const options = {
			url: 'https://cdn.example.com/master.m3u8',
			pageUrl: '',
			out: path.join(root, 'video.mp4'),
			workdir: path.join(root, 'tmp'),
			keyUrl: '',
			referer: '',
			concurrency: 2,
			retries: 0,
			timeoutMs: 1000,
			sniff: false,
			maxMisses: 2,
			scriptLimit: 2,
		} as const;

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

		const mergedOutput = await fs.readFile(result.outputPath, 'utf8');
		expect(mergedOutput).toBe('firstsecond');
	});

	it('resolves master playlist to highest-bandwidth child playlist', async () => {
		const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pipeline-master-'));
		tempDirectories.push(root);

		const options = {
			url: 'https://cdn.example.com/master.m3u8',
			pageUrl: '',
			out: path.join(root, 'video.mp4'),
			workdir: path.join(root, 'tmp'),
			keyUrl: '',
			referer: '',
			concurrency: 1,
			retries: 0,
			timeoutMs: 1000,
			sniff: false,
			maxMisses: 2,
			scriptLimit: 2,
		} as const;

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
});
