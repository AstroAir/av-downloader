export function sleep(ms: number): Promise<void> {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	});
}

export async function mapLimit<TItem, TResult>(
	items: readonly TItem[],
	limit: number,
	mapper: (item: TItem, index: number) => Promise<TResult>,
): Promise<TResult[]> {
	const results = new Array<TResult>(items.length);
	if (items.length === 0) {
		return results;
	}

	let cursor = 0;
	const workerCount = Math.min(Math.max(1, limit), items.length);

	await Promise.all(
		Array.from({length: workerCount}).map(async () => {
			while (true) {
				const current = cursor;
				cursor += 1;
				if (current >= items.length) {
					break;
				}
				const item = items[current];
				if (item === undefined) {
					break;
				}
				results[current] = await mapper(item, current);
			}
		}),
	);

	return results;
}
