import {describe, expect, it} from 'vitest';
import {parseDownloaderOptions} from '../../source/downloader/options';
import {
	createInteractiveWorkflowState,
	reduceInteractiveWorkflowState,
} from '../../source/cli-ui/interactive-workflow';

describe('interactive workflow state machine', () => {
	it('transitions through input -> configure -> review -> run -> complete', () => {
		const options = parseDownloaderOptions({
			url: 'https://cdn.example.com/master.m3u8',
		});
		let state = createInteractiveWorkflowState({});

		state = reduceInteractiveWorkflowState(state, {
			type: 'input-collected',
			flags: {url: 'https://cdn.example.com/master.m3u8'},
		});
		expect(state.phase).toBe('configure');

		state = reduceInteractiveWorkflowState(state, {
			type: 'configured',
			flags: {url: 'https://cdn.example.com/master.m3u8'},
			options,
		});
		expect(state.phase).toBe('review');

		state = reduceInteractiveWorkflowState(state, {type: 'review-confirmed'});
		expect(state.phase).toBe('run');
		expect(state.attempts).toBe(1);

		state = reduceInteractiveWorkflowState(state, {
			type: 'completed',
			result: {
				playlistUrl: 'https://cdn.example.com/master.m3u8',
				mergedTsPath: 'D:/tmp/merged.ts',
				outputPath: 'D:/tmp/video.mp4',
				segmentCount: 1,
				warnings: {ffmpegUnavailable: false},
				executionSummary: {
					network: options.advanced.network,
					segment: options.advanced.segment,
					output: {
						overwrite: options.advanced.output.overwrite,
						keepMergedTs: options.advanced.output.keepMergedTs,
						requestedPath: options.out,
						finalPath: options.out,
					},
					resilience: options.advanced.resilience,
				},
			},
		});
		expect(state.phase).toBe('complete');
		expect(state.result?.outputPath).toContain('video.mp4');
	});

	it('supports failure recovery retry/edit branches', () => {
		const options = parseDownloaderOptions({
			url: 'https://cdn.example.com/master.m3u8',
		});
		let state = createInteractiveWorkflowState({
			url: 'https://cdn.example.com/master.m3u8',
		});
		state = reduceInteractiveWorkflowState(state, {
			type: 'input-collected',
			flags: state.flags,
		});
		state = reduceInteractiveWorkflowState(state, {
			type: 'configured',
			flags: state.flags,
			options,
		});
		state = reduceInteractiveWorkflowState(state, {type: 'review-confirmed'});
		state = reduceInteractiveWorkflowState(state, {
			type: 'run-failed',
			message: 'network failed',
		});
		expect(state.phase).toBe('recover');
		expect(state.lastError).toBe('network failed');

		state = reduceInteractiveWorkflowState(state, {type: 'recover-retry'});
		expect(state.phase).toBe('run');

		state = reduceInteractiveWorkflowState(state, {
			type: 'run-failed',
			message: 'again',
		});
		state = reduceInteractiveWorkflowState(state, {type: 'recover-edit'});
		expect(state.phase).toBe('configure');
	});
});
