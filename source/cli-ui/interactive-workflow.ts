import type {CliInputFlags} from '../downloader/options.js';
import type {
	DownloadPipelineResult,
	DownloaderOptions,
} from '../downloader/types.js';

export type InteractiveWorkflowPhase =
	| 'input'
	| 'configure'
	| 'review'
	| 'run'
	| 'recover'
	| 'complete';

export type InteractiveWorkflowState = {
	readonly phase: InteractiveWorkflowPhase;
	readonly flags: CliInputFlags;
	readonly options: DownloaderOptions | null;
	readonly lastError: string;
	readonly attempts: number;
	readonly result: DownloadPipelineResult | null;
};

export type InteractiveWorkflowEvent =
	| {
			readonly type: 'input-collected';
			readonly flags: CliInputFlags;
	  }
	| {
			readonly type: 'configured';
			readonly flags: CliInputFlags;
			readonly options: DownloaderOptions;
	  }
	| {
			readonly type: 'configuration-invalid';
			readonly flags: CliInputFlags;
			readonly message: string;
	  }
	| {
			readonly type: 'review-confirmed';
	  }
	| {
			readonly type: 'review-edit';
	  }
	| {
			readonly type: 'run-failed';
			readonly message: string;
	  }
	| {
			readonly type: 'recover-retry';
	  }
	| {
			readonly type: 'recover-edit';
	  }
	| {
			readonly type: 'completed';
			readonly result: DownloadPipelineResult;
	  };

export function createInteractiveWorkflowState(
	flags: CliInputFlags,
): InteractiveWorkflowState {
	return {
		phase: 'input',
		flags,
		options: null,
		lastError: '',
		attempts: 0,
		result: null,
	};
}

function assertPhase(
	state: InteractiveWorkflowState,
	expected: InteractiveWorkflowPhase,
	event: InteractiveWorkflowEvent['type'],
): void {
	if (state.phase !== expected) {
		throw new Error(
			`Invalid interactive workflow transition: ${event} from ${state.phase}.`,
		);
	}
}

export function reduceInteractiveWorkflowState(
	state: InteractiveWorkflowState,
	event: InteractiveWorkflowEvent,
): InteractiveWorkflowState {
	switch (event.type) {
		case 'input-collected': {
			assertPhase(state, 'input', event.type);
			return {
				...state,
				phase: 'configure',
				flags: event.flags,
				lastError: '',
			};
		}

		case 'configured': {
			assertPhase(state, 'configure', event.type);
			return {
				...state,
				phase: 'review',
				flags: event.flags,
				options: event.options,
				lastError: '',
			};
		}

		case 'configuration-invalid': {
			assertPhase(state, 'configure', event.type);
			return {
				...state,
				flags: event.flags,
				lastError: event.message,
			};
		}

		case 'review-confirmed': {
			assertPhase(state, 'review', event.type);
			if (!state.options) {
				throw new Error(
					'Interactive workflow cannot enter run phase without resolved options.',
				);
			}
			return {
				...state,
				phase: 'run',
				attempts: state.attempts + 1,
				lastError: '',
			};
		}

		case 'review-edit': {
			assertPhase(state, 'review', event.type);
			return {
				...state,
				phase: 'configure',
			};
		}

		case 'run-failed': {
			assertPhase(state, 'run', event.type);
			return {
				...state,
				phase: 'recover',
				lastError: event.message,
			};
		}

		case 'recover-retry': {
			assertPhase(state, 'recover', event.type);
			return {
				...state,
				phase: 'run',
				lastError: '',
				attempts: state.attempts + 1,
			};
		}

		case 'recover-edit': {
			assertPhase(state, 'recover', event.type);
			return {
				...state,
				phase: 'configure',
			};
		}

		case 'completed': {
			assertPhase(state, 'run', event.type);
			return {
				...state,
				phase: 'complete',
				result: event.result,
				lastError: '',
			};
		}

		default: {
			return state;
		}
	}
}
