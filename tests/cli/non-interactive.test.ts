import {describe, expect, it, vi} from 'vitest';
import {
	isInteractiveTerminal,
	printNonInteractiveSummary,
} from '../../source/cli-ui/non-interactive';

describe('non-interactive helpers', () => {
	it('detects interactive terminal only when stdin and stdout are TTY', () => {
		const interactive = isInteractiveTerminal(
			{isTTY: true} as NodeJS.WriteStream,
			{isTTY: true} as NodeJS.ReadStream,
		);
		const nonInteractive = isInteractiveTerminal(
			{isTTY: false} as NodeJS.WriteStream,
			{isTTY: true} as NodeJS.ReadStream,
		);

		expect(interactive).toBe(true);
		expect(nonInteractive).toBe(false);
	});

	it('prints deterministic summary lines', () => {
		const info = vi.spyOn(console, 'log').mockImplementation(() => {});
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		printNonInteractiveSummary({
			playlistUrl: 'https://cdn.example.com/master.m3u8',
			mergedTsPath: 'D:/tmp/merged.ts',
			outputPath: 'D:/tmp/video.ts',
			segmentCount: 8,
			warnings: {
				ffmpegUnavailable: true,
			},
			executionSummary: {
				network: {
					concurrency: 12,
					timeoutMs: 15_000,
					referer: '',
					userAgent: 'av-downloader/0.0',
				},
				segment: {
					sniff: true,
					maxMisses: 8,
					scriptLimit: 20,
					startSequence: 0,
					endSequence: 0,
				},
				output: {
					overwrite: false,
					keepMergedTs: false,
					requestedPath: 'D:/tmp/video.mp4',
					finalPath: 'D:/tmp/video.ts',
				},
				resilience: {
					retries: 3,
					retryBackoffMs: 250,
				},
			},
		});

		expect(info).toHaveBeenCalledWith(
			'[summary] playlist: https://cdn.example.com/master.m3u8',
		);
		expect(info).toHaveBeenCalledWith('[summary] segments: 8');
		expect(info).toHaveBeenCalledWith('[summary] output: D:/tmp/video.ts');
		expect(info).toHaveBeenCalledWith('[summary] overwrite: false');
		expect(info).toHaveBeenCalledWith('[summary] keep-merged-ts: false');
		expect(info).toHaveBeenCalledWith('[summary] sequence-window: 0-0');
		expect(warn).toHaveBeenCalledWith(
			'[summary] ffmpeg was unavailable, output was kept as .ts',
		);
	});
});
