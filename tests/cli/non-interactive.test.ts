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
		});

		expect(info).toHaveBeenCalledWith(
			'[summary] playlist: https://cdn.example.com/master.m3u8',
		);
		expect(info).toHaveBeenCalledWith('[summary] segments: 8');
		expect(info).toHaveBeenCalledWith('[summary] output: D:/tmp/video.ts');
		expect(warn).toHaveBeenCalledWith(
			'[summary] ffmpeg was unavailable, output was kept as .ts',
		);
	});
});
