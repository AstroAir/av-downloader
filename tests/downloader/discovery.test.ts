import {describe, expect, it} from 'vitest';
import {
	pickBestKeyUrl,
	scorePlaylistCandidate,
} from '../../source/downloader/discovery';
import {
	collectMediaCandidatesFromText,
	normalizeDiscoveredUrl,
} from '../../source/downloader/url';

describe('discovery helpers', () => {
	it('normalizes escaped and relative media URLs', () => {
		expect(
			normalizeDiscoveredUrl(
				'"https:\\/\\/cdn.example.com/video/master.m3u8"',
				'https://example.com/page',
			),
		).toBe('https://cdn.example.com/video/master.m3u8');
		expect(
			normalizeDiscoveredUrl(
				'/vod/index.m3u8?uid=1',
				'https://example.com/page',
			),
		).toBe('https://example.com/vod/index.m3u8?uid=1');
	});

	it('extracts media candidates from text blobs', () => {
		const text =
			'src="/video/master.m3u8" key="https://cdn.example.com/ts.key" seg="/video/0001.ts"';
		const candidates = collectMediaCandidatesFromText(
			text,
			'https://example.com/watch',
		);

		expect([...candidates.m3u8Set]).toContain(
			'https://example.com/video/master.m3u8',
		);
		expect([...candidates.keySet]).toContain('https://cdn.example.com/ts.key');
		expect([...candidates.tsSet]).toContain(
			'https://example.com/video/0001.ts',
		);
	});

	it('scores likely primary playlist URLs higher', () => {
		expect(
			scorePlaylistCandidate(
				'https://cdn.example.com/vod4/public/videos/try.m3u8?uid=2',
			),
		).toBeGreaterThan(
			scorePlaylistCandidate('https://cdn.example.com/ad/master.m3u8'),
		);
	});

	it('prefers ts.key near the playlist path', () => {
		const selected = pickBestKeyUrl(
			[
				'https://cdn.example.com/assets/alt.key',
				'https://cdn.example.com/video/ts.key',
			],
			'https://cdn.example.com/video/master.m3u8',
		);

		expect(selected).toBe('https://cdn.example.com/video/ts.key');
	});
});
