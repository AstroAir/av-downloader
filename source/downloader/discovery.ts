import {fetchText} from './http.js';
import {mapLimit} from './shared.js';
import {
	collectMediaCandidatesFromText,
	collectScriptSrcsFromHtml,
} from './url.js';
import type {DiscoveryResult, RetryPolicy} from './types.js';

export function scorePlaylistCandidate(candidateUrl: string): number {
	let score = 0;
	if (/try\.m3u8/i.test(candidateUrl)) {
		score += 100;
	}
	if (/index\.m3u8/i.test(candidateUrl)) {
		score += 70;
	}
	if (/uid=\d+/i.test(candidateUrl)) {
		score += 25;
	}
	if (/\/public\/videos\//i.test(candidateUrl)) {
		score += 20;
	}
	if (/\/vod\d*\//i.test(candidateUrl)) {
		score += 15;
	}
	if (/ad|promo/i.test(candidateUrl)) {
		score -= 40;
	}
	return score;
}

export async function pickBestPlaylist(
	candidates: readonly string[],
	retryPolicy: RetryPolicy,
): Promise<{playlistUrl: string; playlistText: string}> {
	const sorted = [...candidates].sort(
		(left, right) =>
			scorePlaylistCandidate(right) - scorePlaylistCandidate(left),
	);

	for (const candidate of sorted) {
		try {
			const playlistText = await fetchText(candidate, retryPolicy);
			if (/#EXTM3U/i.test(playlistText)) {
				return {playlistUrl: candidate, playlistText};
			}
		} catch {
			// Ignore invalid candidates.
		}
	}

	return {playlistUrl: '', playlistText: ''};
}

export function pickBestKeyUrl(
	candidates: readonly string[],
	playlistUrl: string,
): string {
	if (candidates.length === 0) {
		return '';
	}

	const scored = candidates.map(candidate => {
		let score = 0;
		if (/\/ts\.key(\?|$)/i.test(candidate)) {
			score += 100;
		}
		if (/\.key(\?|$)/i.test(candidate)) {
			score += 70;
		}
		if (playlistUrl) {
			try {
				const playlist = new URL(playlistUrl);
				const key = new URL(candidate);
				if (playlist.origin === key.origin) {
					score += 20;
				}
				const playlistDirectory = playlist.pathname.slice(
					0,
					playlist.pathname.lastIndexOf('/') + 1,
				);
				if (key.pathname.startsWith(playlistDirectory)) {
					score += 35;
				}
			} catch {
				// Ignore malformed URL candidates.
			}
		}

		return {candidate, score};
	});

	scored.sort((left, right) => right.score - left.score);
	return scored[0]?.candidate ?? '';
}

export async function discoverFromPage(
	pageUrl: string,
	options: {readonly scriptLimit: number; readonly retryPolicy: RetryPolicy},
): Promise<DiscoveryResult> {
	const html = await fetchText(pageUrl, options.retryPolicy);
	const scriptUrls = collectScriptSrcsFromHtml(html, pageUrl).slice(
		0,
		options.scriptLimit,
	);
	const m3u8Set = new Set<string>();
	const keySet = new Set<string>();
	const tsSet = new Set<string>();

	const pageCandidates = collectMediaCandidatesFromText(html, pageUrl);
	for (const item of pageCandidates.m3u8Set) {
		m3u8Set.add(item);
	}
	for (const item of pageCandidates.keySet) {
		keySet.add(item);
	}
	for (const item of pageCandidates.tsSet) {
		tsSet.add(item);
	}

	if (/\.m3u8(\?|$)/i.test(pageUrl) || /#EXTM3U/i.test(html)) {
		m3u8Set.add(pageUrl);
	}

	await mapLimit(scriptUrls, 6, async scriptUrl => {
		try {
			const scriptText = await fetchText(scriptUrl, {
				...options.retryPolicy,
				referer: pageUrl,
			});
			const scriptCandidates = collectMediaCandidatesFromText(
				scriptText,
				scriptUrl,
			);
			for (const item of scriptCandidates.m3u8Set) {
				m3u8Set.add(item);
			}
			for (const item of scriptCandidates.keySet) {
				keySet.add(item);
			}
			for (const item of scriptCandidates.tsSet) {
				tsSet.add(item);
			}
		} catch {
			// Ignore script fetch failures.
		}

		return null;
	});

	const playlistPicked = await pickBestPlaylist(
		[...m3u8Set],
		options.retryPolicy,
	);
	const keyUrl = pickBestKeyUrl([...keySet], playlistPicked.playlistUrl);

	return {
		playlistUrl: playlistPicked.playlistUrl,
		playlistText: playlistPicked.playlistText,
		keyUrl,
		m3u8Candidates: [...m3u8Set],
		keyCandidates: [...keySet],
		tsCandidates: [...tsSet],
	};
}
