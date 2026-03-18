export type RetryPolicy = {
	readonly retries: number;
	readonly timeoutMs: number;
	readonly referer: string;
};

export type DownloaderOptions = {
	readonly url: string;
	readonly pageUrl: string;
	readonly out: string;
	readonly workdir: string;
	readonly keyUrl: string;
	readonly referer: string;
	readonly concurrency: number;
	readonly retries: number;
	readonly timeoutMs: number;
	readonly sniff: boolean;
	readonly maxMisses: number;
	readonly scriptLimit: number;
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
};

export type PipelineLogger = {
	readonly info: (message: string) => void;
	readonly warn: (message: string) => void;
};
