import {HttpStatusError} from './errors.js';
import {sleep} from './shared.js';
import type {RetryPolicy} from './types.js';

export async function fetchWithRetry(
	url: string,
	init: RequestInit,
	retryPolicy: RetryPolicy,
): Promise<Response> {
	let lastError: unknown;

	for (let attempt = 0; attempt <= retryPolicy.retries; attempt += 1) {
		const controller = new AbortController();
		const timer = setTimeout(() => {
			controller.abort();
		}, retryPolicy.timeoutMs);

		try {
			const headers = {
				...(retryPolicy.referer ? {Referer: retryPolicy.referer} : {}),
				...(retryPolicy.userAgent ? {'User-Agent': retryPolicy.userAgent} : {}),
				...init.headers,
			};
			const response = await fetch(url, {
				...init,
				headers,
				signal: controller.signal,
			});
			clearTimeout(timer);

			if (!response.ok) {
				const maybeRetry =
					response.status === 429 ||
					response.status === 408 ||
					response.status >= 500;
				const bodyPreview = await response.text().catch(() => '');
				const error = new HttpStatusError(
					url,
					response.status,
					bodyPreview.slice(0, 120),
				);

				if (maybeRetry && attempt < retryPolicy.retries) {
					await sleep(retryPolicy.backoffMs * (attempt + 1));
					continue;
				}

				throw error;
			}

			return response;
		} catch (error: unknown) {
			clearTimeout(timer);
			lastError = error;
			if (attempt < retryPolicy.retries) {
				await sleep(retryPolicy.backoffMs * (attempt + 1));
				continue;
			}
		}
	}

	throw lastError;
}

export async function fetchText(
	url: string,
	retryPolicy: RetryPolicy,
): Promise<string> {
	const response = await fetchWithRetry(url, {method: 'GET'}, retryPolicy);
	return response.text();
}

export async function fetchBuffer(
	url: string,
	retryPolicy: RetryPolicy,
): Promise<Buffer> {
	const response = await fetchWithRetry(url, {method: 'GET'}, retryPolicy);
	return Buffer.from(await response.arrayBuffer());
}
