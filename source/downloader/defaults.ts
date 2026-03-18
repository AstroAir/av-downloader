export const downloaderDefaults = {
	concurrency: 12,
	retries: 3,
	timeoutMs: 15_000,
	sniff: true,
	maxMisses: 8,
	scriptLimit: 20,
	out: 'output.mp4',
	workdir: 'tmp_download',
} as const;
