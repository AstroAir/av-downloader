import {PlaylistParseError} from './errors.js';
import type {
	MasterPlaylistVariant,
	MediaPlaylistParseResult,
	SegmentKeyInfo,
	SegmentPlanItem,
} from './types.js';

export function parseAttributeList(input: string): Record<string, string> {
	const attributes: Record<string, string> = {};
	const regex = /([A-Z0-9-]+)=((?:"(?:[^"\\]|\\.)*")|[^,]*)/gi;
	let match = regex.exec(input);
	while (match) {
		const key = match[1];
		if (!key) {
			match = regex.exec(input);
			continue;
		}
		const rawValue = match[2] ?? '';
		attributes[key] =
			rawValue.startsWith('"') && rawValue.endsWith('"')
				? rawValue.slice(1, -1)
				: rawValue;
		match = regex.exec(input);
	}

	return attributes;
}

export function parseMasterPlaylist(
	playlistText: string,
	playlistUrl: string,
): MasterPlaylistVariant | null {
	const lines = playlistText.split(/\r?\n/);
	const variants: MasterPlaylistVariant[] = [];
	let currentStreamInf: Record<string, string> | null = null;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) {
			continue;
		}
		if (line.startsWith('#EXT-X-STREAM-INF:')) {
			currentStreamInf = parseAttributeList(
				line.slice('#EXT-X-STREAM-INF:'.length),
			);
			continue;
		}
		if (line.startsWith('#')) {
			continue;
		}
		if (currentStreamInf) {
			variants.push({
				url: new URL(line, playlistUrl).toString(),
				bandwidth: Number(currentStreamInf['BANDWIDTH'] ?? 0),
				resolution: currentStreamInf['RESOLUTION'] ?? '',
			});
			currentStreamInf = null;
		}
	}

	if (variants.length === 0) {
		return null;
	}

	variants.sort((left, right) => right.bandwidth - left.bandwidth);
	return variants[0] ?? null;
}

export function parseMediaPlaylist(
	playlistText: string,
	playlistUrl: string,
): MediaPlaylistParseResult {
	const lines = playlistText.split(/\r?\n/);
	const segments: SegmentPlanItem[] = [];
	let mediaSequence = 0;
	let order = 0;
	let currentKey: SegmentKeyInfo | null = null;

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) {
			continue;
		}

		if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
			mediaSequence =
				Number(line.slice('#EXT-X-MEDIA-SEQUENCE:'.length).trim()) || 0;
			continue;
		}

		if (line.startsWith('#EXT-X-KEY:')) {
			const attributes = parseAttributeList(line.slice('#EXT-X-KEY:'.length));
			const method = attributes['METHOD'] ?? 'NONE';
			if (method === 'NONE') {
				currentKey = null;
			} else {
				currentKey = {
					method,
					uri: attributes['URI']
						? new URL(attributes['URI'], playlistUrl).toString()
						: '',
					iv: attributes['IV'] ?? '',
				};
			}
			continue;
		}

		if (line.startsWith('#')) {
			continue;
		}

		segments.push({
			url: new URL(line, playlistUrl).toString(),
			sequence: mediaSequence + order,
			order,
			key: currentKey ? {...currentKey} : null,
		});
		order += 1;
	}

	if (segments.length === 0) {
		throw new PlaylistParseError(
			'No downloadable media segments were found in the playlist.',
		);
	}

	return {segments, mediaSequence};
}
