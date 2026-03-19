# Troubleshooting

## `pnpm test` fails on formatting

- Run `pnpm format`.
- Re-run `pnpm test`.
- Generated reference docs under `docs/reference/` are intentionally excluded from Prettier checks.

## `pnpm test:docs` fails

- Read the failing test name first. Docs tests are split between:
  - CLI contract metadata
  - Generated markdown invariants and snapshots
  - Ink output rendering
  - Generated docs diff detection
- If snapshots or invariants failed after a real behavior change, regenerate docs with `pnpm docs:generate` and review the diff.

## `pnpm docs:generate` fails

- Confirm dependencies are installed with `pnpm install`.
- Confirm Node.js 20+ is active.
- If TypeDoc reports output-path or configuration issues, inspect `typedoc.json` first.
- If CLI reference generation fails, inspect `source/cli-metadata.ts` and `tools/docs/`.

## `pnpm docs:check` fails

- Run `pnpm docs:generate`.
- Review changes under `docs/reference/`.
- Re-run `pnpm docs:check` to confirm no drift remains.

## `pnpm build` fails

- Check TypeScript output first.
- For CLI contract issues, inspect `source/cli.tsx`, `source/cli-metadata.ts`, and `source/index.ts`.
- For docs tooling import issues, inspect `tools/docs/` and `tsconfig.tools.json`.

## Smoke output is wrong

- Rebuild with `pnpm build`.
- Run `node dist/cli.js --url "https://example.com/video/master.m3u8"`.
- If the output differs from docs or tests, update the shared CLI contract in `source/cli-metadata.ts` first.

## Interactive Terminal Compatibility

- Interactive mode requires TTY stdin/stdout; CI and piped runs intentionally use deterministic non-interactive summaries.
- If arrow/tab keys behave unexpectedly, retry in a terminal with standard keyboard escape handling (PowerShell, Windows Terminal, iTerm2, or modern bash/zsh terminals).
- If you need script-safe output, force non-interactive by piping output or setting `CI=1`.

## Output Fallback and Recovery

- If `ffmpeg` is unavailable, the CLI writes a `.ts` output and prints a deterministic fallback summary line.
- If output already exists and `--overwrite` is not enabled, the CLI now fails fast before download starts.
- Use `--keep-merged-ts` when diagnosing remux/fallback problems so intermediate `merged.ts` is preserved.
