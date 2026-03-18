# CLI Reference

## Usage

```bash
$ av-downloader --url <m3u8-url> [options]
$ av-downloader --page-url <page-url> [options]
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `--url` | `string` | `-` | Direct m3u8 playlist URL (typed, pasted, or interactive prompt input). |
| `--page-url` | `string` | `-` | Page URL used for media URL discovery (typed, pasted, or interactive prompt input). |
| `--out` | `string` | `output.mp4` | Output mp4 path. |
| `--workdir` | `string` | `tmp_download` | Temporary working directory. |
| `--concurrency` | `number` | `12` | Concurrent segment downloads (>=1). |
| `--retries` | `number` | `3` | Retries per request (>=0). |
| `--timeout` | `number` | `15000` | Request timeout in milliseconds (>=1). |
| `--referer` | `string` | `-` | Override HTTP Referer header. |
| `--script-limit` | `number` | `20` | Max script files inspected during page discovery. |
| `--sniff` | `boolean` | `true` | Enable sequential segment sniffing. Use --no-sniff to disable. Warnings are shown in both interactive and non-interactive modes. |
| `--max-miss` | `number` | `8` | Stop sniffing after this many misses. |
| `--key-url` | `string` | `-` | Override AES-128 key URL. |

## Examples

```text
$ av-downloader --url "https://example.com/video/master.m3u8" --out "./video.mp4"
$ av-downloader --page-url "https://example.com/watch/123" --key-url "https://example.com/video/ts.key"
```
