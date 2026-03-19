export type RetryPolicy = {
	readonly retries: number;
	readonly timeoutMs: number;
	readonly referer: string;
	readonly userAgent: string;
	readonly backoffMs: number;
};

export type NetworkOptions = {
	readonly concurrency: number;
	readonly timeoutMs: number;
	readonly referer: string;
	readonly userAgent: string;
};

export type SegmentOptions = {
	readonly sniff: boolean;
	readonly maxMisses: number;
	readonly scriptLimit: number;
	readonly startSequence: number;
	readonly endSequence: number;
};

export type OutputOptions = {
	readonly out: string;
	readonly workdir: string;
	readonly overwrite: boolean;
	readonly keepMergedTs: boolean;
};

export type ResilienceOptions = {
	readonly retries: number;
	readonly retryBackoffMs: number;
};

export type AdvancedOptions = {
	readonly network: NetworkOptions;
	readonly segment: SegmentOptions;
	readonly output: OutputOptions;
	readonly resilience: ResilienceOptions;
};

export type DownloaderOptions = {
	readonly url: string;
	readonly pageUrl: string;
	readonly keyUrl: string;
	readonly advanced: AdvancedOptions;
	readonly out: string;
	readonly workdir: string;
	readonly referer: string;
	readonly concurrency: number;
	readonly retries: number;
	readonly timeoutMs: number;
	readonly retryBackoffMs: number;
	readonly userAgent: string;
	readonly sniff: boolean;
	readonly maxMisses: number;
	readonly scriptLimit: number;
	readonly startSequence: number;
	readonly endSequence: number;
	readonly overwrite: boolean;
	readonly keepMergedTs: boolean;
};

export type ExecutionSummary = {
	readonly network: NetworkOptions;
	readonly segment: SegmentOptions;
	readonly output: {
		readonly overwrite: boolean;
		readonly keepMergedTs: boolean;
		readonly requestedPath: string;
		readonly finalPath: string;
	};
	readonly resilience: ResilienceOptions;
};

export type SegmentKeyInfo = {
	readonly method: string;
	readonly uri: string;
	readonly iv: string;
};

export type SegmentPlanItem = {
	readonly url: string;
	readonly sequence: number;
	readonly order: number;
	readonly key: SegmentKeyInfo | null;
};

export type MasterPlaylistVariant = {
	readonly url: string;
	readonly bandwidth: number;
	readonly resolution: string;
};

export type MediaPlaylistParseResult = {
	readonly segments: SegmentPlanItem[];
	readonly mediaSequence: number;
};

export type DiscoveryResult = {
	readonly playlistUrl: string;
	readonly playlistText: string;
	readonly keyUrl: string;
	readonly m3u8Candidates: string[];
	readonly keyCandidates: string[];
	readonly tsCandidates: string[];
};

export type PipelineWarnings = {
	readonly ffmpegUnavailable: boolean;
};

export type DownloadPipelineResult = {
	readonly playlistUrl: string;
	readonly mergedTsPath: string;
	readonly outputPath: string;
	readonly segmentCount: number;
	readonly warnings: PipelineWarnings;
	readonly executionSummary: ExecutionSummary;
};

export type PipelineLogger = {
	readonly info: (message: string) => void;
	readonly warn: (message: string) => void;
};
