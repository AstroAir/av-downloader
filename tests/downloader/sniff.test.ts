import {describe, expect, it} from 'vitest';
import {
	detectSniffPattern,
	inferSequenceOffset,
	sortAndDedupeSegments,
} from '../../source/downloader/sniff';

describe('sniff helpers', () => {
	const segments = [
		{
			url: 'https://cdn.example.com/video/seg001.ts',
			sequence: 101,
			order: 1,
			key: null,
		},
		{
			url: 'https://cdn.example.com/video/seg003.ts',
			sequence: 103,
			order: 3,
			key: null,
		},
		{
			url: 'https://cdn.example.com/video/seg002.ts',
			sequence: 102,
			order: 2,
			key: null,
		},
		{
			url: 'https://cdn.example.com/video/seg002.ts',
			sequence: 102,
			order: 20,
			key: null,
		},
	] as const;

	it('detects sequential filename pattern and infers sequence offset', () => {
		const pattern = detectSniffPattern(segments);
		expect(pattern).not.toBeNull();
		expect(inferSequenceOffset(segments, pattern!)).toBe(100);
	});

	it('sorts deterministically and removes duplicate URLs', () => {
		const sorted = sortAndDedupeSegments(segments);
		expect(sorted.map(item => item.url)).toEqual([
			'https://cdn.example.com/video/seg001.ts',
			'https://cdn.example.com/video/seg002.ts',
			'https://cdn.example.com/video/seg003.ts',
		]);
	});
});
