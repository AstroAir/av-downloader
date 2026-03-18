import {describe, expect, it} from 'vitest';
import {buildCliHelpText, cliFlags, cliName} from '../../source/cli-metadata';

describe('cli metadata', () => {
	it('builds help text from the shared CLI contract', () => {
		const helpText = buildCliHelpText();

		expect(helpText).toContain(`$ ${cliName} --url <m3u8-url>`);
		expect(helpText).toContain(
			'At least one of --url or --page-url is required.',
		);
		expect(helpText).toContain('--key-url  Override AES-128 key URL.');
	});

	it('exposes downloader flag defaults and types for docs and runtime usage', () => {
		expect(cliFlags.url.type).toBe('string');
		expect(cliFlags.pageUrl.type).toBe('string');
		expect(cliFlags.concurrency.type).toBe('number');
		expect(cliFlags.concurrency.default).toBe(12);
		expect(cliFlags.sniff.default).toBe(true);
	});
});
