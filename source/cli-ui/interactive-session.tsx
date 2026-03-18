import {render} from 'ink';
import type {
	DownloadPipelineResult,
	DownloaderOptions,
} from '../downloader/types.js';
import {runDownloadPipeline} from '../downloader/pipeline.js';
import App from '../app.js';
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
