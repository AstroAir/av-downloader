import {Box, Text} from 'ink';
import type {CliUiPhase, CliUiState} from './types.js';

const phaseLabels: Record<CliUiPhase, string> = {
	preparing: 'Preparing',
	discovering: 'Discovering',
	downloading: 'Downloading',
	merging: 'Merging',
	completed: 'Completed',
	failed: 'Failed',
};

function phaseColor(phase: CliUiPhase): string {
	switch (phase) {
		case 'completed': {
			return 'green';
		}

		case 'failed': {
			return 'red';
		}

		case 'downloading': {
			return 'cyan';
		}

		case 'merging': {
			return 'yellow';
		}

		default: {
			return 'blue';
		}
	}
}

export function StatusRow({state}: {readonly state: CliUiState}) {
	const label = phaseLabels[state.phase];
	return (
		<Box flexDirection="column">
			<Text bold color="blue">
				AV Downloader
			</Text>
			<Text color={phaseColor(state.phase)}>State: {label}</Text>
			{state.playlistUrl ? (
				<Text dimColor>Playlist: {state.playlistUrl}</Text>
			) : null}
		</Box>
	);
}

export function ProgressRow({state}: {readonly state: CliUiState}) {
	const total = state.segmentCount;
	const done = state.downloadedSegments;
	const ratio = total > 0 ? Math.min(done / total, 1) : 0;
	const width = 24;
	const filled = Math.round(ratio * width);
	const bar = `${'='.repeat(filled)}${'-'.repeat(width - filled)}`;
	return (
		<Box flexDirection="column" marginTop={1}>
			<Text>
				Progress: [{bar}] {String(done)}/{String(total || '?')}
			</Text>
		</Box>
	);
}

export function WarningList({
	warnings,
}: {
	readonly warnings: readonly string[];
}) {
	if (warnings.length === 0) {
		return null;
	}

	const uniqueWarnings = [...new Set(warnings)];

	return (
		<Box flexDirection="column" marginTop={1}>
			<Text bold color="yellow">
				Warnings
			</Text>
			{uniqueWarnings.map(warning => (
				<Text key={warning} color="yellow">
					- {warning}
				</Text>
			))}
		</Box>
	);
}

export function ResultSummary({state}: {readonly state: CliUiState}) {
	if (state.phase !== 'completed' && state.phase !== 'failed') {
		return null;
	}

	return (
		<Box flexDirection="column" marginTop={1}>
			{state.phase === 'failed' ? (
				<Text color="red">Error: {state.errorMessage || 'unknown error'}</Text>
			) : (
				<>
					<Text color="green">Output: {state.outputPath}</Text>
					<Text>
						Completed {String(state.segmentCount)} segments.
						{state.ffmpegUnavailable
							? ' ffmpeg unavailable; emitted TS fallback.'
							: ' remuxed to MP4.'}
					</Text>
				</>
			)}
		</Box>
	);
}

export function MessageFeed({
	messages,
}: {
	readonly messages: readonly string[];
}) {
	if (messages.length === 0) {
		return null;
	}

	const uniqueMessages = [...new Set(messages)];

	return (
		<Box flexDirection="column" marginTop={1}>
			<Text bold dimColor>
				Recent events
			</Text>
			{uniqueMessages.map(message => (
				<Text key={message} dimColor>
					{message}
				</Text>
			))}
		</Box>
	);
}
