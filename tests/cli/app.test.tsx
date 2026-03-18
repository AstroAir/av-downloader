import {render} from 'ink-testing-library';
import {describe, expect, it} from 'vitest';
import App from '../../source/app';
import type {CliUiState} from '../../source/cli-ui/types';

function makeState(partial: Partial<CliUiState>): CliUiState {
	return {
		mode: 'interactive',
		phase: 'preparing',
		playlistUrl: '',
		outputPath: '',
		segmentCount: 0,
		downloadedSegments: 0,
		warnings: [],
		messages: [],
		errorMessage: '',
		ffmpegUnavailable: false,
		...partial,
	};
}

describe('App', () => {
	it('renders progress and mp4 completion summary', () => {
		const {lastFrame} = render(
			<App
				state={makeState({
					phase: 'completed',
					playlistUrl: 'https://cdn.example.com/master.m3u8',
					outputPath: 'D:/tmp/video.mp4',
					segmentCount: 120,
					downloadedSegments: 120,
				})}
			/>,
		);

		expect(lastFrame()).toContain('State: Completed');
		expect(lastFrame()).toContain('Progress:');
		expect(lastFrame()).toContain('Output: D:/tmp/video.mp4');
		expect(lastFrame()).toContain('Completed 120 segments.');
		expect(lastFrame()).toContain('remuxed to MP4');
	});

	it('renders ffmpeg fallback summary', () => {
		const {lastFrame} = render(
			<App
				state={makeState({
					phase: 'completed',
					outputPath: 'D:/tmp/video.ts',
					segmentCount: 8,
					downloadedSegments: 8,
					ffmpegUnavailable: true,
					warnings: ['[warn] ffmpeg was not detected; MP4 remux was skipped.'],
				})}
			/>,
		);

		expect(lastFrame()).toContain('Warnings');
		expect(lastFrame()).toContain('Completed 8 segments.');
		expect(lastFrame()).toContain('ffmpeg unavailable; emitted TS fallback');
	});
});
