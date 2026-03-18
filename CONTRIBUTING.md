# Contributing Guide

Thanks for contributing to this template. This guide focuses on keeping the template stable, reusable, and easy to evolve.

## Contribution Principles

- Prefer small, focused pull requests.
- Keep behavior changes explicit and documented.
- Avoid adding framework-specific complexity unless it benefits most template users.
- Update docs together with code changes.

## Local Setup

```bash
pnpm install
```

## Recommended Development Loop

1. Create a branch:

```bash
git checkout -b feat/<short-scope>
```

2. Implement your change under `source/` and/or docs.
3. Validate locally:

```bash
pnpm test
pnpm build
```

4. Smoke test CLI:

```bash
node dist/cli.js --name=Jane
```

5. Commit with clear scope and rationale.

## Branch Naming Convention

Use descriptive prefixes:

- `feat/<name>`
- `fix/<name>`
- `docs/<name>`
- `refactor/<name>`
- `chore/<name>`

## Commit Message Convention

Recommended prefixes:

- `feat:` new capability
- `fix:` bug fix
- `docs:` documentation only
- `refactor:` internal restructuring without behavior change
- `test:` test/validation updates
- `chore:` tooling/maintenance

Example:

```text
feat: add --uppercase option to greeting output
```

## Pull Request Requirements

A PR should include:

- Problem statement
- Scope of change
- Validation evidence (`pnpm test`, `pnpm build`, smoke output)
- Docs updates (if behavior or workflow changed)

Use `.github/PULL_REQUEST_TEMPLATE.md` as the baseline.

## Review Checklist

Before requesting review, confirm:

- [ ] `pnpm test` passed
- [ ] `pnpm build` passed
- [ ] CLI still runs from `dist/cli.js`
- [ ] README/docs reflect the current behavior
- [ ] No unrelated file churn

## What Requires Maintainer Alignment

Open a discussion first when changing:

- Core CLI architecture (`source/cli.tsx` flow)
- Script/quality policy in `package.json`
- CI behavior in `.github/workflows/ci.yml`
- Versioning/release policy
