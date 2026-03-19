import type {ReactElement} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {collectAdvancedOptions} from '../../source/cli-ui/advanced-config';

const {renderMock, unmountMock} = vi.hoisted(() => ({
	renderMock: vi.fn(),
	unmountMock: vi.fn(),
}));
let capturedElement: ReactElement | null = null;

vi.mock('ink', async importOriginal => {
	const actual = await importOriginal();
	return {
		...actual,
		render: renderMock,
	};
});

describe('collectAdvancedOptions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		capturedElement = null;
		renderMock.mockImplementation((element: ReactElement) => {
			capturedElement = element;
			return {unmount: unmountMock};
		});
	});

	it('rejects cancellation with the shared interactive cancel contract', async () => {
		const pending = collectAdvancedOptions({
			url: 'https://cdn.example.com/master.m3u8',
		});

		expect(capturedElement).not.toBeNull();
		(capturedElement?.props as {onCancel: () => void}).onCancel();

		await expect(pending).rejects.toThrow('Interactive input was canceled.');
		expect(unmountMock).toHaveBeenCalledTimes(1);
	});
});
