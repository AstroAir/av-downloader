import type {DownloadPipelineResult} from '../downloader/types.js';

export function isInteractiveTerminal(
	stdout: NodeJS.WriteStream = process.stdout,
	stdin: NodeJS.ReadStream = process.stdin,
): boolean {
	return Boolean(stdout.isTTY && stdin.isTTY && !process.env['CI']);
}

export const silentPipelineLogger = {
	info() {},
	warn() {},
};

export function printNonInteractiveSummary(
	result: DownloadPipelineResult,
): void {
	console.log(`[summary] playlist: ${result.playlistUrl}`);
	console.log(`[summary] segments: ${String(result.segmentCount)}`);
	console.log(`[summary] output: ${result.outputPath}`);
	console.log(
		`[summary] overwrite: ${String(result.executionSummary.output.overwrite)}`,
	);
	console.log(
		`[summary] keep-merged-ts: ${String(
			result.executionSummary.output.keepMergedTs,
		)}`,
	);
	console.log(
		`[summary] sequence-window: ${String(
			result.executionSummary.segment.startSequence,
		)}-${String(result.executionSummary.segment.endSequence)}`,
	);
	if (result.warnings.ffmpegUnavailable) {
		console.warn('[summary] ffmpeg was unavailable, output was kept as .ts');
	}
}
