import {render} from 'ink-testing-library';
import {describe, expect, it, vi} from 'vitest';
import {AdvancedConfigPrompt} from '../../source/cli-ui/advanced-config';

const flush = async () =>
	new Promise<void>(resolve => {
		setTimeout(resolve, 0);
	});

describe('AdvancedConfigPrompt', () => {
	it('enters numeric edit mode and reflects typed values', async () => {
		const onSubmit = vi.fn();
		const onCancel = vi.fn();
		const app = render(
			<AdvancedConfigPrompt
				initialFlags={{url: 'https://cdn.example.com/master.m3u8', concurrency: 2}}
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>,
		);

		app.stdin.write('\r');
		await flush();
		expect(app.lastFrame()).toContain('Editing Concurrency: 2');
		app.stdin.write('\u001B');
		await flush();
		expect(onCancel).not.toHaveBeenCalled();
		expect(onSubmit).not.toHaveBeenCalled();
		app.unmount();
	});

	it('supports focus navigation before submit', async () => {
		const onSubmit = vi.fn();
		const onCancel = vi.fn();
		const app = render(
			<AdvancedConfigPrompt
				initialFlags={{url: 'https://cdn.example.com/master.m3u8'}}
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>,
		);

		const initialFrame = app.lastFrame();
		app.stdin.write('\t');
		await flush();
		const movedFrame = app.lastFrame();

		app.stdin.write('c');
		await flush();

		expect(movedFrame).not.toBe(initialFrame);
		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(onCancel).not.toHaveBeenCalled();
		app.unmount();
	});
});
