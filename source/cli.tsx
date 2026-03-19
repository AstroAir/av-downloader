#!/usr/bin/env node
import meow from 'meow';
import {buildCliHelpText, cliFlags} from './cli-metadata.js';
import {runInteractiveSession} from './cli-ui/interactive-session.js';
import {
	isInteractiveTerminal,
	printNonInteractiveSummary,
	silentPipelineLogger,
} from './cli-ui/non-interactive.js';
import {CliValidationError} from './downloader/errors.js';
import {parseDownloaderOptions} from './downloader/options.js';
import {runDownloadPipeline} from './downloader/pipeline.js';

const cli = meow(buildCliHelpText(), {
	importMeta: import.meta,
	autoHelp: true,
	flags: {
		url: {
			type: cliFlags.url.type,
			shortFlag: cliFlags.url.shortFlag,
		},
		pageUrl: {
			type: cliFlags.pageUrl.type,
			shortFlag: cliFlags.pageUrl.shortFlag,
		},
		out: {
			type: cliFlags.out.type,
			shortFlag: cliFlags.out.shortFlag,
			default: cliFlags.out.default,
		},
		workdir: {
			type: cliFlags.workdir.type,
			default: cliFlags.workdir.default,
		},
		concurrency: {
			type: cliFlags.concurrency.type,
			shortFlag: cliFlags.concurrency.shortFlag,
			default: cliFlags.concurrency.default,
		},
		retries: {
			type: cliFlags.retries.type,
			default: cliFlags.retries.default,
		},
		timeout: {
			type: cliFlags.timeout.type,
			default: cliFlags.timeout.default,
		},
		referer: {
			type: cliFlags.referer.type,
		},
		userAgent: {
			type: cliFlags.userAgent.type,
			default: cliFlags.userAgent.default,
		},
		scriptLimit: {
			type: cliFlags.scriptLimit.type,
			default: cliFlags.scriptLimit.default,
		},
		sniff: {
			type: cliFlags.sniff.type,
			default: cliFlags.sniff.default,
		},
		maxMiss: {
			type: cliFlags.maxMiss.type,
			default: cliFlags.maxMiss.default,
		},
		retryBackoff: {
			type: cliFlags.retryBackoff.type,
			default: cliFlags.retryBackoff.default,
		},
		startSequence: {
			type: cliFlags.startSequence.type,
			default: cliFlags.startSequence.default,
		},
		endSequence: {
			type: cliFlags.endSequence.type,
			default: cliFlags.endSequence.default,
		},
		overwrite: {
			type: cliFlags.overwrite.type,
			default: cliFlags.overwrite.default,
		},
		keepMergedTs: {
			type: cliFlags.keepMergedTs.type,
			default: cliFlags.keepMergedTs.default,
		},
		keyUrl: {
			type: cliFlags.keyUrl.type,
		},
	},
});

try {
	const interactive = isInteractiveTerminal();

	if (interactive) {
		await runInteractiveSession(cli.flags);
	} else {
		const options = parseDownloaderOptions(cli.flags);
		const result = await runDownloadPipeline(options, {}, silentPipelineLogger);
		printNonInteractiveSummary(result);
	}
} catch (error: unknown) {
	if (error instanceof CliValidationError) {
		console.error(`[error] ${error.message}`);
		console.error('Run with --help to see valid downloader flags.');
		process.exitCode = 1;
	} else if (
		error instanceof Error &&
		error.message === 'Interactive input was canceled.'
	) {
		console.error('[error] Interactive input was canceled by the user.');
		process.exitCode = 1;
	} else {
		const message =
			error instanceof Error ? error.stack ?? error.message : String(error);
		console.error('[error]', message);
		process.exitCode = 1;
	}
}
