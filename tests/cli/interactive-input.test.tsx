import {render} from 'ink-testing-library';
import {describe, expect, it, vi} from 'vitest';
import {
	InteractiveInputPrompt,
	collectMissingInput,
} from '../../source/cli-ui/interactive-input';

const flush = async () =>
	new Promise<void>(resolve => {
		setTimeout(resolve, 0);
	});

describe('InteractiveInputPrompt', () => {
	it('returns existing flags without rendering prompt when input already exists', async () => {
		await expect(
			collectMissingInput({url: 'https://example.com/master.m3u8'}),
		).resolves.toEqual({url: 'https://example.com/master.m3u8'});
	});

	it('supports cancel flow from keyboard', async () => {
		const onSubmit = vi.fn();
		const onCancel = vi.fn();
		const app = render(
			<InteractiveInputPrompt onSubmit={onSubmit} onCancel={onCancel} />,
		);

		app.stdin.write('\u001B');
		await flush();

		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onSubmit).not.toHaveBeenCalled();
		app.unmount();
	});

	it('switches input mode with keyboard shortcuts', async () => {
		const onSubmit = vi.fn();
		const onCancel = vi.fn();
		const app = render(
			<InteractiveInputPrompt onSubmit={onSubmit} onCancel={onCancel} />,
		);

		app.stdin.write('p');
		await flush();
		expect(app.lastFrame()).toContain('Mode: --page-url');

		app.stdin.write('u');
		await flush();
		expect(app.lastFrame()).toContain('Mode: --url');

		expect(onCancel).not.toHaveBeenCalled();
		expect(onSubmit).not.toHaveBeenCalled();
		app.unmount();
	});
});
