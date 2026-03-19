import fs from 'node:fs/promises';
import path from 'node:path';
import {
	decryptAes128Cbc,
	normalizeKeyBuffer,
	parseIv,
	resolveSegmentKey,
	sequenceToIv,
} from './crypto.js';
import {discoverFromPage} from './discovery.js';
import {DownloaderRuntimeError, PlaylistParseError} from './errors.js';
import {fetchBuffer, fetchText} from './http.js';
import {parseMasterPlaylist, parseMediaPlaylist} from './playlist.js';
import {hasFfmpeg, mergeFilesSequentially, remuxTsToMp4} from './output.js';
import {toRetryPolicy} from './options.js';
import {mapLimit} from './shared.js';
import {sniffMoreSegments, sortAndDedupeSegments} from './sniff.js';
import type {
	DownloadPipelineResult,
	DownloaderOptions,
	ExecutionSummary,
	PipelineLogger,
	SegmentPlanItem,
} from './types.js';

export type PipelineDependencies = {
	readonly fetchText: typeof fetchText;
	readonly fetchBuffer: typeof fetchBuffer;
	readonly hasFfmpeg: typeof hasFfmpeg;
	readonly remuxTsToMp4: typeof remuxTsToMp4;
};

const defaultDependencies: PipelineDependencies = {
	fetchText,
	fetchBuffer,
	hasFfmpeg,
	remuxTsToMp4,
};

const defaultLogger: PipelineLogger = {
	info: message => {
		console.log(message);
	},
	warn: message => {
		console.warn(message);
	},
};

function toFallbackTsPath(outputPath: string): string {
	return outputPath.replace(/\.mp4$/i, '') + '.ts';
}

async function assertWritableOutputs(
	targets: readonly string[],
	overwrite: boolean,
): Promise<void> {
	if (overwrite) {
		return;
	}

	for (const target of new Set(targets)) {
		try {
			await fs.access(target);
			throw new DownloaderRuntimeError(
				`Refusing to overwrite existing output: ${target}. Re-run with --overwrite to replace it.`,
			);
		} catch (error: unknown) {
			if (
				error instanceof DownloaderRuntimeError ||
				(error as NodeJS.ErrnoException)?.code === 'ENOENT'
			) {
				if (error instanceof DownloaderRuntimeError) {
					throw error;
				}
				continue;
			}

			throw error;
		}
	}
}

function applySequenceWindow(
	segments: readonly SegmentPlanItem[],
	startSequence: number,
	endSequence: number,
): SegmentPlanItem[] {
	if (startSequence === 0 && endSequence === 0) {
		return [...segments];
	}

	const filtered = segments.filter(segment => {
		if (segment.sequence < startSequence) {
			return false;
		}

		if (endSequence > 0 && segment.sequence > endSequence) {
			return false;
		}

		return true;
	});

	if (filtered.length === 0) {
		const upper = endSequence > 0 ? String(endSequence) : 'infinity';
		throw new DownloaderRuntimeError(
			`No segments matched sequence window ${String(startSequence)}..${upper}.`,
		);
	}

	return filtered;
}

function toExecutionSummary(
	options: DownloaderOptions,
	finalPath: string,
): ExecutionSummary {
	return {
		network: options.advanced.network,
		segment: options.advanced.segment,
		resilience: options.advanced.resilience,
		output: {
			overwrite: options.advanced.output.overwrite,
			keepMergedTs: options.advanced.output.keepMergedTs,
			requestedPath: options.advanced.output.out,
			finalPath,
		},
	};
}

export async function runDownloadPipeline(
	options: DownloaderOptions,
	dependencies: Partial<PipelineDependencies> = {},
	logger: PipelineLogger = defaultLogger,
): Promise<DownloadPipelineResult> {
	const deps = {...defaultDependencies, ...dependencies};
	const retryPolicy = toRetryPolicy(options);
	const fallbackTsPath = toFallbackTsPath(options.out);

	let playlistUrl = options.url;
	let playlistText = '';
	let effectiveKeyUrl = options.keyUrl;

	if (options.pageUrl) {
		const discovered = await discoverFromPage(options.pageUrl, {
			scriptLimit: options.scriptLimit,
			retryPolicy,
		});
		if (!playlistUrl) {
			playlistUrl = discovered.playlistUrl;
		}
		if (!effectiveKeyUrl && discovered.keyUrl) {
			effectiveKeyUrl = discovered.keyUrl;
		}
		if (
			discovered.playlistUrl &&
			discovered.playlistUrl === playlistUrl &&
			discovered.playlistText
		) {
			playlistText = discovered.playlistText;
		}
		if (!playlistUrl) {
			throw new DownloaderRuntimeError(
				'No playable m3u8 URL was discovered from --page-url.',
			);
		}
	}

	if (!playlistUrl) {
		throw new DownloaderRuntimeError('Missing playable m3u8 URL.');
	}

	logger.info(`[init] target playlist: ${playlistUrl}`);
	const ffmpegAvailable = deps.hasFfmpeg();
	await assertWritableOutputs(
		ffmpegAvailable ? [options.out] : [options.out, fallbackTsPath],
		options.overwrite,
	);
	await fs.mkdir(options.workdir, {recursive: true});
	const partsDirectory = path.join(options.workdir, 'parts');
	await fs.rm(partsDirectory, {recursive: true, force: true});
	await fs.mkdir(partsDirectory, {recursive: true});

	if (!playlistText) {
		playlistText = await deps.fetchText(playlistUrl, retryPolicy);
	}

	if (playlistText.includes('#EXT-X-STREAM-INF')) {
		const selected = parseMasterPlaylist(playlistText, playlistUrl);
		if (selected) {
			logger.info(
				`[playlist] selected highest bandwidth child playlist: ${selected.url}`,
			);
			playlistUrl = selected.url;
			playlistText = await deps.fetchText(playlistUrl, retryPolicy);
		}
	}

	const parsedPlaylist = parseMediaPlaylist(playlistText, playlistUrl);
	if (parsedPlaylist.segments.length === 0) {
		throw new PlaylistParseError('No media segments parsed from playlist.');
	}

	let segments: SegmentPlanItem[] = parsedPlaylist.segments;
	if (options.sniff) {
		const sniffed = await sniffMoreSegments(parsedPlaylist.segments, {
			maxMisses: options.maxMisses,
			retryPolicy,
		});
		if (sniffed.length > 0) {
			const keySeed =
				parsedPlaylist.segments.find(item => item.key !== null)?.key ?? null;
			segments = [
				...segments,
				...sniffed.map(segment => ({
					...segment,
					key: keySeed,
				})),
			];
		}
	}

	segments = sortAndDedupeSegments(segments);
	segments = applySequenceWindow(
		segments,
		options.startSequence,
		options.endSequence,
	);
	logger.info(`[playlist] final segment count: ${String(segments.length)}`);

	const keyCache = new Map<string, Buffer>();
	const partFiles: string[] = [];
	let completed = 0;

	await mapLimit(segments, options.concurrency, async (segment, index) => {
		const payload = await deps.fetchBuffer(segment.url, retryPolicy);
		const keyInfo = resolveSegmentKey(segment, effectiveKeyUrl);
		let data = payload;

		if (keyInfo && keyInfo.method !== 'NONE') {
			if (keyInfo.method !== 'AES-128') {
				throw new DownloaderRuntimeError(
					`Unsupported encryption method: ${keyInfo.method}`,
				);
			}

			if (!keyInfo.uri) {
				throw new DownloaderRuntimeError(
					`Encrypted segment is missing key URI: ${segment.url}`,
				);
			}

			let keyBytes = keyCache.get(keyInfo.uri);
			if (!keyBytes) {
				keyBytes = normalizeKeyBuffer(
					await deps.fetchBuffer(keyInfo.uri, retryPolicy),
				);
				keyCache.set(keyInfo.uri, keyBytes);
			}

			const iv = keyInfo.iv
				? parseIv(keyInfo.iv)
				: sequenceToIv(segment.sequence ?? index);
			data = decryptAes128Cbc(
				payload,
				keyBytes,
				iv ?? sequenceToIv(segment.sequence ?? index),
			);
		}

		const filePath = path.join(
			partsDirectory,
			`part-${String(index).padStart(6, '0')}.ts`,
		);
		await fs.writeFile(filePath, data);
		partFiles[index] = filePath;

		completed += 1;
		if (completed % 20 === 0 || completed === segments.length) {
			logger.info(`[download] ${String(completed)}/${String(segments.length)}`);
		}

		return filePath;
	});

	const mergedTsPath = path.join(options.workdir, 'merged.ts');
	await mergeFilesSequentially(partFiles, mergedTsPath);

	await fs.mkdir(path.dirname(options.out), {recursive: true});
	if (ffmpegAvailable) {
		await deps.remuxTsToMp4(mergedTsPath, options.out, options.overwrite);
		if (!options.keepMergedTs) {
			await fs.rm(mergedTsPath, {force: true});
		}
		logger.info(`[done] MP4 output: ${options.out}`);
		return {
			playlistUrl,
			mergedTsPath,
			outputPath: options.out,
			segmentCount: segments.length,
			warnings: {
				ffmpegUnavailable: false,
			},
			executionSummary: toExecutionSummary(options, options.out),
		};
	}

	if (fallbackTsPath !== mergedTsPath) {
		await fs.copyFile(mergedTsPath, fallbackTsPath);
	}
	if (!options.keepMergedTs && fallbackTsPath !== mergedTsPath) {
		await fs.rm(mergedTsPath, {force: true});
	}
	logger.warn('[warn] ffmpeg was not detected; MP4 remux was skipped.');
	logger.info(`[done] TS output: ${fallbackTsPath}`);

	return {
		playlistUrl,
		mergedTsPath,
		outputPath: fallbackTsPath,
		segmentCount: segments.length,
		warnings: {
			ffmpegUnavailable: true,
		},
		executionSummary: toExecutionSummary(options, fallbackTsPath),
	};
}
