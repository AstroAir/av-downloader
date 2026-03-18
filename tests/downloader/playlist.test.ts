import {describe, expect, it} from 'vitest';
import {PlaylistParseError} from '../../source/downloader/errors';
import {
	parseMasterPlaylist,
	parseMediaPlaylist,
} from '../../source/downloader/playlist';

describe('playlist parsing', () => {
	it('selects the highest bandwidth variant from a master playlist', () => {
		const master = `#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000\nlow.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=5000\nhigh.m3u8`;

		expect(
			parseMasterPlaylist(master, 'https://cdn.example.com/master.m3u8'),
		).toEqual({
			url: 'https://cdn.example.com/high.m3u8',
			bandwidth: 5000,
			resolution: '',
		});
	});

	it('parses media segments with sequence offsets', () => {
		const media = `#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:10\n#EXTINF:1,\nseg001.ts\n#EXTINF:1,\nseg002.ts`;
		const parsed = parseMediaPlaylist(
			media,
			'https://cdn.example.com/video.m3u8',
		);

		expect(parsed.mediaSequence).toBe(10);
		expect(parsed.segments.map(item => item.sequence)).toEqual([10, 11]);
		expect(parsed.segments[0]?.url).toBe('https://cdn.example.com/seg001.ts');
	});

	it('throws for an invalid media playlist with no segments', () => {
		expect(() =>
			parseMediaPlaylist(
				'#EXTM3U\n#EXT-X-ENDLIST',
				'https://cdn.example.com/v.m3u8',
			),
		).toThrow(PlaylistParseError);
	});
});
