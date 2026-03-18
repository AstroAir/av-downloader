import path from 'node:path';
import {HttpStatusError} from './errors.js';
import {fetchWithRetry} from './http.js';
import type {SegmentPlanItem, RetryPolicy} from './types.js';

type SniffPattern = {
	origin: string;
	directory: string;
	prefix: string;
	suffix: string;
	search: string;
	width: number;
	indices: Set<number>;
};

export function detectSniffPattern(
	segments: readonly SegmentPlanItem[],
): SniffPattern | null {
	const groups = new Map<string, SniffPattern>();

	for (const segment of segments) {
		const parsedUrl = new URL(segment.url);
		const basename = path.posix.basename(parsedUrl.pathname);
		const match = /^(.*?)(\d+)(\.[^./?#]+)$/.exec(basename);
		if (!match) {
			continue;
		}

		const prefix = match[1] ?? '';
		const digits = match[2] ?? '';
		const suffix = match[3] ?? '';
		const directory = parsedUrl.pathname.slice(
			0,
			parsedUrl.pathname.lastIndexOf('/') + 1,
		);
		const key = [
			parsedUrl.origin,
			directory,
			prefix,
			suffix,
			parsedUrl.search,
		].join('|');

		const existing = groups.get(key);
		const entry: SniffPattern = existing ?? {
			origin: parsedUrl.origin,
			directory,
			prefix,
			suffix,
			search: parsedUrl.search,
			width: digits.length,
			indices: new Set<number>(),
		};

		entry.indices.add(Number(digits));
		entry.width = Math.max(entry.width, digits.length);
		groups.set(key, entry);
	}

	const sorted = [...groups.values()].sort(
		(left, right) => right.indices.size - left.indices.size,
	);
	return sorted[0] ?? null;
}

export function buildSegmentUrlFromPattern(
	pattern: SniffPattern,
	index: number,
): string {
	const padded = String(index).padStart(pattern.width, '0');
	const fileName = `${pattern.prefix}${padded}${pattern.suffix}`;
	const url = new URL(
		`${pattern.origin}${pattern.directory}${fileName}${pattern.search}`,
	);
	return url.toString();
}

export function inferSequenceOffset(
	segments: readonly SegmentPlanItem[],
	pattern: SniffPattern,
): number {
	const counts = new Map<number, number>();

	for (const segment of segments) {
		const parsedUrl = new URL(segment.url);
		if (parsedUrl.origin !== pattern.origin) {
			continue;
		}
		if (!parsedUrl.pathname.startsWith(pattern.directory)) {
			continue;
		}

		const basename = path.posix.basename(parsedUrl.pathname);
		const match = /^(.*?)(\d+)(\.[^./?#]+)$/.exec(basename);
		if (!match) {
			continue;
		}
		if (match[1] !== pattern.prefix || match[3] !== pattern.suffix) {
			continue;
		}

		const index = Number(match[2]);
		const offset = segment.sequence - index;
		counts.set(offset, (counts.get(offset) ?? 0) + 1);
	}

	let bestOffset = 0;
	let bestCount = -1;
	for (const [offset, count] of counts.entries()) {
		if (count > bestCount) {
			bestOffset = offset;
			bestCount = count;
		}
	}

	return bestOffset;
}

async function probeSegmentExists(
	url: string,
	retryPolicy: RetryPolicy,
): Promise<boolean> {
	try {
		await fetchWithRetry(url, {method: 'HEAD'}, retryPolicy);
		return true;
	} catch (error: unknown) {
		if (error instanceof HttpStatusError && error.status === 404) {
			return false;
		}
		if (
			error instanceof HttpStatusError &&
			error.status !== 405 &&
			error.status !== 501
		) {
			throw error;
		}
	}

	try {
		const response = await fetchWithRetry(
			url,
			{
				method: 'GET',
				headers: {Range: 'bytes=0-0'},
			},
			retryPolicy,
		);
		if (response.ok) {
			return true;
		}
	} catch (error: unknown) {
		if (error instanceof HttpStatusError && error.status === 404) {
			return false;
		}
	}

	return false;
}

export async function sniffMoreSegments(
	segments: readonly SegmentPlanItem[],
	options: {readonly maxMisses: number; readonly retryPolicy: RetryPolicy},
): Promise<SegmentPlanItem[]> {
	const pattern = detectSniffPattern(segments);
	if (!pattern) {
		return [];
	}

	const sequenceOffset = inferSequenceOffset(segments, pattern);
	const existing = new Set(pattern.indices);
	const sorted = [...existing].sort((left, right) => left - right);
	const minimum = sorted[0];
	const maximum = sorted[sorted.length - 1];
	if (minimum === undefined || maximum === undefined) {
		return [];
	}

	const found: SegmentPlanItem[] = [];

	const maybeCheck = async (index: number): Promise<boolean> => {
		const candidate = buildSegmentUrlFromPattern(pattern, index);
		const isAvailable = await probeSegmentExists(
			candidate,
			options.retryPolicy,
		);
		if (isAvailable) {
			found.push({
				url: candidate,
				sequence: index + sequenceOffset,
				order: index,
				key: null,
			});
			existing.add(index);
			return true;
		}

		return false;
	};

	for (let index = minimum; index <= maximum; index += 1) {
		if (!existing.has(index)) {
			await maybeCheck(index);
		}
	}

	let missCount = 0;
	let cursor = maximum + 1;
	while (missCount < options.maxMisses) {
		const isAvailable = await maybeCheck(cursor);
		if (isAvailable) {
			missCount = 0;
		} else {
			missCount += 1;
		}
		cursor += 1;
	}

	return found;
}

export function sortAndDedupeSegments(
	segments: readonly SegmentPlanItem[],
): SegmentPlanItem[] {
	const pattern = detectSniffPattern(segments);

	const mapped = segments.map((segment, index) => {
		if (!pattern) {
			return {segment, sort: segment.order ?? index};
		}

		const parsedUrl = new URL(segment.url);
		const basename = path.posix.basename(parsedUrl.pathname);
		const match = /^(.*?)(\d+)(\.[^./?#]+)$/.exec(basename);
		if (!match) {
			return {segment, sort: segment.order ?? index};
		}

		const detected = Number(match[2]);
		return {
			segment,
			sort: Number.isFinite(detected) ? detected : segment.order ?? index,
		};
	});

	mapped.sort((left, right) => {
		if (left.sort !== right.sort) {
			return left.sort - right.sort;
		}

		return left.segment.order - right.segment.order;
	});

	const seen = new Set<string>();
	const result: SegmentPlanItem[] = [];
	for (const item of mapped) {
		if (seen.has(item.segment.url)) {
			continue;
		}
		seen.add(item.segment.url);
		result.push(item.segment);
	}

	return result;
}
