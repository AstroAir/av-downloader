import {describe, expect, it} from 'vitest';
import {
	normalizeKeyBuffer,
	parseIv,
	resolveSegmentKey,
	sequenceToIv,
} from '../../source/downloader/crypto';

describe('crypto helpers', () => {
	it('normalizes 32-char hex key payloads', () => {
		const key = normalizeKeyBuffer(
			Buffer.from('00112233445566778899aabbccddeeff', 'utf8'),
		);
		expect(key.toString('hex')).toBe('00112233445566778899aabbccddeeff');
	});

	it('pads short IV values to 16 bytes', () => {
		const iv = parseIv('0x01');
		expect(iv?.length).toBe(16);
		expect(iv?.toString('hex')).toBe('00000000000000000000000000000001');
	});

	it('derives sequence IV bytes deterministically', () => {
		expect(sequenceToIv(258).toString('hex')).toBe(
			'00000000000000000000000000000102',
		);
	});

	it('prefers key override when present', () => {
		const result = resolveSegmentKey(
			{
				url: 'https://cdn.example.com/seg.ts',
				sequence: 1,
				order: 0,
				key: null,
			},
			'https://cdn.example.com/ts.key',
		);

		expect(result?.uri).toBe('https://cdn.example.com/ts.key');
		expect(result?.method).toBe('AES-128');
	});
});
