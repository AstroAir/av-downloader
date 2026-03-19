import {render} from 'ink-testing-library';
import {describe, expect, it, vi} from 'vitest';
import {parseDownloaderOptions} from '../../source/downloader/options';
import {
	RecoverPrompt,
	ReviewPrompt,
} from '../../source/cli-ui/interactive-review';

const flush = async () =>
	new Promise<void>(resolve => {
		setTimeout(resolve, 0);
	});

describe('interactive review and recovery prompts', () => {
	it('selects edit action from review step', async () => {
		const onSelect = vi.fn();
		const onCancel = vi.fn();
		const options = parseDownloaderOptions({
			url: 'https://cdn.example.com/master.m3u8',
		});
		const app = render(
			<ReviewPrompt options={options} onSelect={onSelect} onCancel={onCancel} />,
		);

		app.stdin.write('e');
		await flush();

		expect(onSelect).toHaveBeenCalledWith('edit');
		expect(onCancel).not.toHaveBeenCalled();
		app.unmount();
	});

	it('selects retry action from recovery step', async () => {
		const onSelect = vi.fn();
		const onCancel = vi.fn();
		const app = render(
			<RecoverPrompt
				errorMessage="download failed"
				onSelect={onSelect}
				onCancel={onCancel}
			/>,
		);

		app.stdin.write('r');
		await flush();

		expect(onSelect).toHaveBeenCalledWith('retry');
		expect(onCancel).not.toHaveBeenCalled();
		app.unmount();
	});
});
