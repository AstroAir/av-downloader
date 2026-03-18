import type {
	DownloadPipelineResult,
	PipelineLogger,
} from '../downloader/types.js';

export type CliUiMode = 'interactive' | 'non-interactive';

export type CliUiPhase =
	| 'preparing'
	| 'discovering'
	| 'downloading'
	| 'merging'
	| 'completed'
	| 'failed';

export type CliUiState = {
	readonly mode: CliUiMode;
	readonly phase: CliUiPhase;
	readonly playlistUrl: string;
	readonly outputPath: string;
	readonly segmentCount: number;
	readonly downloadedSegments: number;
	readonly warnings: readonly string[];
	readonly messages: readonly string[];
	readonly errorMessage: string;
	readonly ffmpegUnavailable: boolean;
};

export type CliUiEvent =
	| {
			readonly type: 'pipeline-info';
			readonly message: string;
	  }
	| {
			readonly type: 'pipeline-warn';
			readonly message: string;
	  }
	| {
			readonly type: 'pipeline-result';
			readonly result: DownloadPipelineResult;
	  }
	| {
			readonly type: 'pipeline-error';
			readonly message: string;
	  };

export type UiLoggerAdapter = {
	readonly logger: PipelineLogger;
	readonly pushEvent: (event: CliUiEvent) => void;
};
