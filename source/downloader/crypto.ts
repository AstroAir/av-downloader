import {createDecipheriv} from 'node:crypto';
import {DownloaderRuntimeError} from './errors.js';
import type {SegmentKeyInfo, SegmentPlanItem} from './types.js';

export function normalizeKeyBuffer(keyData: Buffer): Buffer {
	if (keyData.length === 16) {
		return keyData;
	}

	const maybeHex = keyData.toString('utf8').trim();
	if (/^[0-9a-fA-F]{32}$/.test(maybeHex)) {
		return Buffer.from(maybeHex, 'hex');
	}

	throw new DownloaderRuntimeError(
		`Unexpected key length ${keyData.length}; expected 16 bytes or a 32 char hex string.`,
	);
}

export function parseIv(ivText: string): Buffer | null {
	let hex = ivText.trim().replace(/^0x/i, '');
	if (!hex) {
		return null;
	}

	if (hex.length % 2 === 1) {
		hex = `0${hex}`;
	}

	const raw = Buffer.from(hex, 'hex');
	if (raw.length === 16) {
		return raw;
	}
	if (raw.length > 16) {
		return raw.subarray(raw.length - 16);
	}

	return Buffer.concat([Buffer.alloc(16 - raw.length), raw]);
}

export function sequenceToIv(sequence: number): Buffer {
	let value = BigInt(sequence);
	const iv = Buffer.alloc(16, 0);
	for (let index = 15; index >= 0; index -= 1) {
		iv[index] = Number(value & 0xffn);
		value >>= 8n;
	}

	return iv;
}

export function decryptAes128Cbc(
	payload: Buffer,
	key: Buffer,
	iv: Buffer,
): Buffer {
	const decipher = createDecipheriv('aes-128-cbc', key, iv);
	return Buffer.concat([decipher.update(payload), decipher.final()]);
}

export function resolveSegmentKey(
	segment: SegmentPlanItem,
	keyUrlOverride: string,
): SegmentKeyInfo | null {
	if (keyUrlOverride) {
		return {
			method: 'AES-128',
			uri: keyUrlOverride,
			iv: segment.key?.iv ?? '',
		};
	}

	return segment.key;
}
