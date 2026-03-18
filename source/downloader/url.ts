export function normalizeDiscoveredUrl(
	rawValue: string,
	baseUrl: string,
): string {
	if (!rawValue) {
		return '';
	}

	let value = rawValue.trim();
	value = value.replace(/^["'`]+|["'`]+$/g, '');
	value = value.replace(/\\\//g, '/');
	value = value.replace(/&amp;/gi, '&');
	value = value.replace(/[),;]+$/g, '');

	if (!value) {
		return '';
	}

	try {
		if (/^https?:\/\//i.test(value)) {
			return new URL(value).toString();
		}
		if (value.startsWith('//')) {
			const base = new URL(baseUrl);
			return new URL(`${base.protocol}${value}`).toString();
		}
		if (
			value.startsWith('/') ||
			value.startsWith('./') ||
			value.startsWith('../') ||
			/[.](m3u8|ts|key)(\?|$)/i.test(value)
		) {
			return new URL(value, baseUrl).toString();
		}
	} catch {
		return '';
	}

	return '';
}

export function collectMediaCandidatesFromText(
	text: string,
	baseUrl: string,
): {m3u8Set: Set<string>; keySet: Set<string>; tsSet: Set<string>} {
	const m3u8Set = new Set<string>();
	const keySet = new Set<string>();
	const tsSet = new Set<string>();

	const add = (raw: string): void => {
		const normalized = normalizeDiscoveredUrl(raw, baseUrl);
		if (!normalized) {
			return;
		}
		if (/\.m3u8(\?|$)/i.test(normalized)) {
			m3u8Set.add(normalized);
		}
		if (
			/\.key(\?|$)/i.test(normalized) ||
			/\/ts\.key(\?|$)/i.test(normalized)
		) {
			keySet.add(normalized);
		}
		if (/\.ts(\?|$)/i.test(normalized)) {
			tsSet.add(normalized);
		}
	};

	const escapedAbsolute = text.match(/https?:\\\/\\\/[^\s"'`<>\\]+/gi) ?? [];
	for (const item of escapedAbsolute) {
		add(item);
	}

	const absolute = text.match(/https?:\/\/[^\s"'`<>\\]+/gi) ?? [];
	for (const item of absolute) {
		add(item);
	}

	const quoted =
		text.match(/["]([^"\n\r<>]*[.](m3u8|ts|key)(\?[^"\n\r<>]*)?)["]/gi) ?? [];
	for (const item of quoted) {
		add(item);
	}

	const pathLike =
		text.match(/(?:\/|\.\.?\/)[^\s"'`<>]+[.](m3u8|ts|key)(\?[^\s"'`<>]*)?/gi) ??
		[];
	for (const item of pathLike) {
		add(item);
	}

	return {m3u8Set, keySet, tsSet};
}

export function collectScriptSrcsFromHtml(
	html: string,
	pageUrl: string,
): string[] {
	const scriptUrls: string[] = [];
	const regex = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
	let match = regex.exec(html);
	while (match) {
		const rawSource = match[1];
		if (!rawSource) {
			match = regex.exec(html);
			continue;
		}
		const normalized = normalizeDiscoveredUrl(rawSource, pageUrl);
		if (normalized) {
			scriptUrls.push(normalized);
		}
		match = regex.exec(html);
	}

	return [...new Set(scriptUrls)];
}
