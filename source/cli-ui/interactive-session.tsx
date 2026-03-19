import {render} from 'ink';
import App from '../app.js';
import type {CliInputFlags} from '../downloader/options.js';
import {parseDownloaderOptions} from '../downloader/options.js';
import {runDownloadPipeline} from '../downloader/pipeline.js';
import type {
	DownloadPipelineResult,
	DownloaderOptions,
} from '../downloader/types.js';
import {collectAdvancedOptions} from './advanced-config.js';
import {collectMissingInput} from './interactive-input.js';
import {
	collectRecoveryAction,
	collectReviewAction,
} from './interactive-review.js';
import {
	createInteractiveWorkflowState,
	reduceInteractiveWorkflowState,
} from './interactive-workflow.js';
import {
	createInitialUiState,
	createUiLoggerAdapter,
	reduceUiState,
} from './state.js';

export async function runInteractivePipeline(
	options: DownloaderOptions,
): Promise<DownloadPipelineResult> {
	let state = createInitialUiState('interactive');
	const ink = render(<App state={state} />, {
		patchConsole: false,
		kittyKeyboard: {
			mode: 'enabled',
			flags: ['disambiguateEscapeCodes'],
		},
	});

	const adapter = createUiLoggerAdapter(event => {
		state = reduceUiState(state, event);
		ink.rerender(<App state={state} />);
	});

	try {
		const result = await runDownloadPipeline(options, {}, adapter.logger);
		adapter.pushEvent({type: 'pipeline-result', result});
		return result;
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: 'Unknown error while downloading.';
		adapter.pushEvent({type: 'pipeline-error', message});
		throw error;
	} finally {
		ink.unmount();
	}
}

function toErrorMessage(error: unknown): string {
	return error instanceof Error
		? error.message
		: 'Unknown error while running interactive session.';
}

export async function runInteractiveSession(
	initialFlags: CliInputFlags,
): Promise<DownloadPipelineResult> {
	let workflow = createInteractiveWorkflowState(initialFlags);

	while (workflow.phase !== 'complete') {
		switch (workflow.phase) {
			case 'input': {
				const flags = await collectMissingInput(workflow.flags);
				workflow = reduceInteractiveWorkflowState(workflow, {
					type: 'input-collected',
					flags,
				});
				break;
			}

			case 'configure': {
				const flags = await collectAdvancedOptions(
					workflow.flags,
					workflow.lastError,
				);
				try {
					const options = parseDownloaderOptions(flags);
					workflow = reduceInteractiveWorkflowState(workflow, {
						type: 'configured',
						flags,
						options,
					});
				} catch (error: unknown) {
					workflow = reduceInteractiveWorkflowState(workflow, {
						type: 'configuration-invalid',
						flags,
						message: toErrorMessage(error),
					});
				}
				break;
			}

			case 'review': {
				if (!workflow.options) {
					throw new Error(
						'Interactive workflow reached review phase without resolved options.',
					);
				}

				const action = await collectReviewAction(workflow.options);
				if (action === 'run') {
					workflow = reduceInteractiveWorkflowState(workflow, {
						type: 'review-confirmed',
					});
					break;
				}

				if (action === 'edit') {
					workflow = reduceInteractiveWorkflowState(workflow, {
						type: 'review-edit',
					});
					break;
				}

				throw new Error('Interactive session exited by user at review step.');
			}

			case 'run': {
				if (!workflow.options) {
					throw new Error(
						'Interactive workflow reached run phase without resolved options.',
					);
				}

				try {
					const result = await runInteractivePipeline(workflow.options);
					workflow = reduceInteractiveWorkflowState(workflow, {
						type: 'completed',
						result,
					});
				} catch (error: unknown) {
					workflow = reduceInteractiveWorkflowState(workflow, {
						type: 'run-failed',
						message: toErrorMessage(error),
					});
				}
				break;
			}

			case 'recover': {
				const action = await collectRecoveryAction(workflow.lastError);
				if (action === 'retry') {
					workflow = reduceInteractiveWorkflowState(workflow, {
						type: 'recover-retry',
					});
					break;
				}

				if (action === 'edit') {
					workflow = reduceInteractiveWorkflowState(workflow, {
						type: 'recover-edit',
					});
					break;
				}

				throw new Error('Interactive session exited by user after a failure.');
			}

			default: {
				throw new Error(`Unsupported interactive phase: ${workflow.phase}`);
			}
		}
	}

	if (!workflow.result) {
		throw new Error(
			'Interactive session reached complete phase without result.',
		);
	}

	return workflow.result;
}
