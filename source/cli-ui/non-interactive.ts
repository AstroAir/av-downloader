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
	if (result.warnings.ffmpegUnavailable) {
		console.warn('[summary] ffmpeg was unavailable, output was kept as .ts');
	}
}
