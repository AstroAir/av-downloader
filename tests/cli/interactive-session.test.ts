import {beforeEach, describe, expect, it, vi} from 'vitest';
import {runInteractiveSession} from '../../source/cli-ui/interactive-session';
import type {CliInputFlags} from '../../source/downloader/options';

const {collectAdvancedOptionsMock, collectMissingInputMock} = vi.hoisted(
	() => ({
		collectAdvancedOptionsMock: vi.fn(),
		collectMissingInputMock: vi.fn(),
	}),
);

vi.mock('../../source/cli-ui/advanced-config', () => ({
	collectAdvancedOptions: collectAdvancedOptionsMock,
}));

vi.mock('../../source/cli-ui/interactive-input', () => ({
	collectMissingInput: collectMissingInputMock,
}));

vi.mock('../../source/cli-ui/interactive-review', () => ({
	collectRecoveryAction: vi.fn(),
	collectReviewAction: vi.fn(),
}));

describe('runInteractiveSession', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		collectMissingInputMock.mockImplementation(
			async (flags: CliInputFlags) => flags,
		);
	});

	it('reuses the submitted draft after advanced validation errors', async () => {
		const initialFlags: CliInputFlags = {
			url: 'https://cdn.example.com/master.m3u8',
		};
		const invalidDraft: CliInputFlags = {
			...initialFlags,
			out: './draft-output.mp4',
			startSequence: 8,
			endSequence: 4,
		};

		collectAdvancedOptionsMock.mockResolvedValueOnce(invalidDraft);
		collectAdvancedOptionsMock.mockImplementationOnce(
			async (flags: CliInputFlags, validationError = '') => {
				expect(flags).toEqual(invalidDraft);
				expect(validationError).toContain('Invalid sequence window');
				throw new Error('Interactive input was canceled.');
			},
		);

		await expect(runInteractiveSession(initialFlags)).rejects.toThrow(
			'Interactive input was canceled.',
		);
		expect(collectAdvancedOptionsMock).toHaveBeenCalledTimes(2);
	});
});
