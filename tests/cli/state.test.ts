import {describe, expect, it} from 'vitest';
import {createInitialUiState, reduceUiState} from '../../source/cli-ui/state';

describe('cli ui state reducer', () => {
	it('tracks download progress from pipeline info lines', () => {
		let state = createInitialUiState('interactive');
		state = reduceUiState(state, {
			type: 'pipeline-info',
			message: '[playlist] final segment count: 42',
		});
		state = reduceUiState(state, {
			type: 'pipeline-info',
			message: '[download] 10/42',
		});

		expect(state.phase).toBe('downloading');
		expect(state.segmentCount).toBe(42);
		expect(state.downloadedSegments).toBe(10);
	});

	it('records warning and ffmpeg fallback marker', () => {
		let state = createInitialUiState('interactive');
		state = reduceUiState(state, {
			type: 'pipeline-warn',
			message: '[warn] ffmpeg was not detected; MP4 remux was skipped.',
		});

		expect(state.warnings).toHaveLength(1);
		expect(state.ffmpegUnavailable).toBe(true);
	});
});
