# av-downloader

A TypeScript-first **HLS/m3u8 downloader CLI** with playlist discovery, AES-128 decryption support, deterministic segment ordering, and ffmpeg fallback behavior.

[中文文档](./README_zh.md)

## What This Project Includes

- Direct playlist mode (`--url`) and page discovery mode (`--page-url`)
- Master playlist resolution to highest-bandwidth variant
- AES-128 segment decryption with key override support (`--key-url`)
- Optional segment sniffing with deterministic dedupe and ordering
- Segment merge and MP4 remux via ffmpeg with `.ts` fallback when ffmpeg is unavailable

## Breaking Change

The old greeting-style contract (`--name` outputting `Hello, <name>`) has been removed. The CLI now runs downloader workflows only.

## Prerequisites

- Node.js 20+
- pnpm 8+ (recommended 10+)

Install pnpm if needed:

```bash
npm install -g pnpm
```

## Quick Start

```bash
pnpm install
pnpm build
node dist/cli.js --name=Jane
```

Then run one of the downloader modes:

```bash
node dist/cli.js --url "https://example.com/video/master.m3u8" --out "./video.mp4"
node dist/cli.js --page-url "https://example.com/watch/123" --key-url "https://example.com/video/ts.key"
```

## CLI Usage

### Basic

```bash
node dist/cli.js --url "https://example.com/video/master.m3u8"
```

### Page Discovery

```bash
node dist/cli.js --page-url "https://example.com/watch/123"
```

### Option Reference

| Option           | Type      | Default        | Description                                       |
| ---------------- | --------- | -------------- | ------------------------------------------------- |
| `--url`          | `string`  | `-`            | Direct m3u8 playlist URL                          |
| `--page-url`     | `string`  | `-`            | Page URL used for media discovery                 |
| `--out`          | `string`  | `output.mp4`   | Output mp4 path                                   |
| `--workdir`      | `string`  | `tmp_download` | Temporary working directory                       |
| `--concurrency`  | `number`  | `12`           | Concurrent segment downloads                      |
| `--retries`      | `number`  | `3`            | Retries per request                               |
| `--timeout`      | `number`  | `15000`        | Timeout per request in milliseconds               |
| `--referer`      | `string`  | `-`            | Override HTTP Referer header                      |
| `--script-limit` | `number`  | `20`           | Max scripts fetched during page discovery         |
| `--sniff`        | `boolean` | `true`         | Enable segment sniffing (`--no-sniff` to disable) |
| `--max-miss`     | `number`  | `8`            | Stop sniffing after this many misses              |
| `--key-url`      | `string`  | `-`            | Override AES-128 key URL                          |

## Development Workflow

1. Install dependencies: `pnpm install`
2. Run watch mode while coding: `pnpm dev`
3. Validate repository quality: `pnpm test`
4. Validate docs pipeline: `pnpm test:docs && pnpm docs:check`
5. Verify compilation output: `pnpm build`
6. Smoke run built CLI: `node dist/cli.js --url "https://example.com/video/master.m3u8"`

## Script Reference

| Script                    | Purpose                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `pnpm dev`                | TypeScript watch compile                                    |
| `pnpm build`              | Compile source into `dist/`                                 |
| `pnpm docs:generate`      | Regenerate committed reference docs under `docs/reference/` |
| `pnpm docs:check`         | Fail if generated docs are stale or missing                 |
| `pnpm lint`               | Run XO lint checks                                          |
| `pnpm format`             | Format all supported files with Prettier                    |
| `pnpm format:check`       | Check formatting without modifying files                    |
| `pnpm test`               | Run formatting check + lint checks                          |
| `pnpm test:docs`          | Run docs pipeline and Ink rendering tests                   |
| `pnpm test:docs:coverage` | Run docs tests with coverage thresholds                     |

## Project Layout

```text
av-downloader/
├── source/
│   ├── cli-metadata.ts          # Shared CLI contract for runtime + docs
│   └── cli.tsx                  # CLI entrypoint + argument parsing
│   └── downloader/              # Downloader domain modules
│       ├── options.ts
│       ├── discovery.ts
│       ├── playlist.ts
│       ├── crypto.ts
│       ├── sniff.ts
│       ├── pipeline.ts
│       └── output.ts
├── tests/
│   ├── cli/
│   └── docs/
├── tools/
│   └── docs/                    # Docs generation + freshness checks
├── docs/
│   ├── README.md                # Docs navigation hub
│   ├── project-structure.md
│   ├── development-workflow.md
│   ├── cli-design.md
│   ├── quality-gates.md
│   ├── troubleshooting.md
│   └── reference/
│       ├── README.md
│       ├── cli.md
│       ├── tooling-baseline.md
│       └── api/
│   └── release-process.md
├── .github/
│   ├── workflows/ci.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
├── CONTRIBUTING.md
├── TESTING.md
├── CI_CD.md
├── CHANGELOG.md
├── package.json
└── tsconfig.json
```

## Documentation Architecture

- Docs hub: [docs/README.md](./docs/README.md)
- Project map: [docs/project-structure.md](./docs/project-structure.md)
- Development flow: [docs/development-workflow.md](./docs/development-workflow.md)
- CLI design rules: [docs/cli-design.md](./docs/cli-design.md)
- Quality gates: [docs/quality-gates.md](./docs/quality-gates.md)
- Troubleshooting: [docs/troubleshooting.md](./docs/troubleshooting.md)
- Reference docs: [docs/reference/README.md](./docs/reference/README.md)
- Release process: [docs/release-process.md](./docs/release-process.md)

## Governance Docs

- Contribution policy: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Validation strategy: [TESTING.md](./TESTING.md)
- CI/CD conventions: [CI_CD.md](./CI_CD.md)
- Release history: [CHANGELOG.md](./CHANGELOG.md)

## License

MIT. See [LICENSE](./LICENSE).
