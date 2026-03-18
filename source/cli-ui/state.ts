import type {DownloadPipelineResult} from '../downloader/types.js';
import type {
	CliUiEvent,
	CliUiMode,
	CliUiState,
	UiLoggerAdapter,
} from './types.js';

const maxMessages = 6;

function toMessageWindow(
	messages: readonly string[],
	nextMessage: string,
): string[] {
	const trimmed = nextMessage.trim();
	if (!trimmed) {
		return [...messages];
	}

	return [...messages, trimmed].slice(-maxMessages);
}

function parseProgressLine(
	message: string,
): {done: number; total: number} | null {
	const match = /^\[download\]\s+(\d+)\/(\d+)$/u.exec(message.trim());
	if (!match) {
		return null;
	}

	return {
		done: Number(match[1]),
		total: Number(match[2]),
	};
}

function parseFinalSegmentCount(message: string): number | null {
	const match = /^\[playlist\]\s+final segment count:\s+(\d+)$/u.exec(
		message.trim(),
	);
	if (!match) {
		return null;
	}

	return Number(match[1]);
}

function parseDoneOutputPath(message: string): string {
	const line = message.trim();
	if (line.startsWith('[done] MP4 output: ')) {
		return line.replace('[done] MP4 output: ', '').trim();
	}

	if (line.startsWith('[done] TS output: ')) {
		return line.replace('[done] TS output: ', '').trim();
	}

	return '';
}

export function createInitialUiState(mode: CliUiMode): CliUiState {
	return {
		mode,
		phase: 'preparing',
		playlistUrl: '',
		outputPath: '',
		segmentCount: 0,
		downloadedSegments: 0,
		warnings: [],
		messages: [],
		errorMessage: '',
		ffmpegUnavailable: false,
	};
}

function applyResultToState(
	state: CliUiState,
	result: DownloadPipelineResult,
): CliUiState {
	return {
		...state,
		phase: 'completed',
		playlistUrl: result.playlistUrl,
		outputPath: result.outputPath,
		segmentCount: result.segmentCount,
		downloadedSegments: result.segmentCount,
		ffmpegUnavailable: result.warnings.ffmpegUnavailable,
		messages: toMessageWindow(
			state.messages,
			`[summary] output: ${result.outputPath}`,
		),
	};
}

export function reduceUiState(
	state: CliUiState,
	event: CliUiEvent,
): CliUiState {
	if (event.type === 'pipeline-result') {
		return applyResultToState(state, event.result);
	}

	if (event.type === 'pipeline-error') {
		return {
			...state,
			phase: 'failed',
			errorMessage: event.message,
			messages: toMessageWindow(state.messages, `[error] ${event.message}`),
		};
	}

	if (event.type === 'pipeline-warn') {
		const warnings = [...state.warnings, event.message];
		const ffmpegUnavailable =
			state.ffmpegUnavailable ||
			event.message.includes('ffmpeg was not detected');

		return {
			...state,
			warnings,
			ffmpegUnavailable,
			messages: toMessageWindow(state.messages, event.message),
		};
	}

	const nextState: CliUiState = {
		...state,
		messages: toMessageWindow(state.messages, event.message),
	};

	if (event.message.startsWith('[init]')) {
		return {
			...nextState,
			phase: 'discovering',
			playlistUrl: event.message.replace('[init] target playlist: ', '').trim(),
		};
	}

	if (event.message.startsWith('[playlist]')) {
		const parsedCount = parseFinalSegmentCount(event.message);
		if (parsedCount !== null) {
			return {
				...nextState,
				phase: 'downloading',
				segmentCount: parsedCount,
			};
		}
	}

	if (event.message.startsWith('[download]')) {
		const progress = parseProgressLine(event.message);
		if (progress) {
			return {
				...nextState,
				phase: 'downloading',
				downloadedSegments: progress.done,
				segmentCount: progress.total,
			};
		}
	}

	if (event.message.startsWith('[done]')) {
		const outputPath = parseDoneOutputPath(event.message);
		return {
			...nextState,
			phase: 'merging',
			outputPath: outputPath || state.outputPath,
			ffmpegUnavailable:
				state.ffmpegUnavailable ||
				event.message.startsWith('[done] TS output:'),
		};
	}

	return nextState;
}

export function createUiLoggerAdapter(
	onEvent: (event: CliUiEvent) => void,
): UiLoggerAdapter {
	return {
		pushEvent: onEvent,
		logger: {
			info(message: string) {
				onEvent({type: 'pipeline-info', message});
			},
			warn(message: string) {
				onEvent({type: 'pipeline-warn', message});
			},
		},
	};
}
