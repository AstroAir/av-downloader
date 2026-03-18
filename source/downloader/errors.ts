export class CliValidationError extends Error {
	readonly code = 'CLI_VALIDATION_ERROR';

	constructor(message: string) {
		super(message);
		this.name = 'CliValidationError';
	}
}

export class PlaylistParseError extends Error {
	readonly code = 'PLAYLIST_PARSE_ERROR';

	constructor(message: string) {
		super(message);
		this.name = 'PlaylistParseError';
	}
}

export class HttpStatusError extends Error {
	readonly url: string;
	readonly status: number;
	readonly body: string;

	constructor(url: string, status: number, body = '') {
		super(`HTTP ${status} for ${url}`);
		this.name = 'HttpStatusError';
		this.url = url;
		this.status = status;
		this.body = body;
	}
}

export class DownloaderRuntimeError extends Error {
	readonly code = 'DOWNLOADER_RUNTIME_ERROR';

	constructor(message: string) {
		super(message);
		this.name = 'DownloaderRuntimeError';
	}
}
