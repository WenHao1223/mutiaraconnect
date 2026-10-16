# Contributing to MutiaraConnect

Thanks for your interest in improving MutiaraConnect. This guide covers how to set up the project,
branch, write commits, and open pull requests.

By participating, you agree to be respectful and constructive in all project spaces.

## Getting started

The app lives in `frontend/`. Full setup steps (prerequisites, install, dev server, environment
variables) are in the root [`README.md`](README.md).

Quick version:

```bash
cd frontend
npm install
cp .env.example .env   # then add VITE_GOOGLE_MAPS_API_KEY
npm run dev
```

## Before you start

1. **Search first.** Check open issues and pull requests so you don't duplicate work.
2. **Discuss big changes.** For anything non-trivial (new dependencies, data model changes, new
   pages), open an issue first and agree on the approach before writing code.
3. **Keep it focused.** One feature or fix per branch and pull request.

## Branching

Create a branch off the latest `main`:

```bash
git checkout main
git pull
git checkout -b <type>/<short-description>
```

Use a prefix that matches the kind of change, and lowercase words separated by hyphens:

| Prefix | Use for |
| --- | --- |
| `feat/` | A new feature |
| `fix/` | A bug fix |
| `refactor/` | Code change that neither fixes a bug nor adds a feature |
| `docs/` | Documentation only |
| `chore/` | Tooling, dependencies, config |
| `test/` | Adding or updating tests |

Examples: `feat/admin-closures-map`, `fix/ticket-status-persist`, `docs/setup-guide`.

## Commit messages

This project uses the [Conventional Commits](https://www.conventionalcommits.org/) style:

```text
<type>(<scope>): <short summary>
```

- **type** — one of the types below (required).
- **scope** — the area touched (optional, lowercase).
- **summary** — imperative mood, lowercase, no trailing period (e.g. "add", not "added").

Guidelines:

- Keep the subject line under ~72 characters.
- Use the body (separated by a blank line) to explain **why** when the change isn't obvious.
- Reference issues where relevant, e.g. `Closes #12`.
- Make small, logical commits that each build — not one giant catch-all commit.

### Types

| Type | Use for |
| --- | --- |
| `feat` | A new feature |
| `fix` | A bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation only |
| `style` | Formatting, no code-behavior change |
| `test` | Adding or updating tests |
| `perf` | Performance improvement |
| `chore` | Tooling, dependencies, config |
| `build` | Build system or tooling changes |

### Scopes

Use the area of the codebase you touched, for example: `admin`, `auth`, `ticket`, `tickets`,
`business`, `maps`, `dashboard`, `settings`, `ui`, `routes`.

### Examples

```text
feat(ticket): allow anonymous reporting
fix(auth): keep session after refresh
refactor(business): derive affected shops by distance
docs: add setup guide
feat(admin): dashboard data layer and audit logging
```

## Code style

- **TypeScript** everywhere; keep types explicit and reuse the shared types in `frontend/src/types/`.
- **Imports** — use the `@/` alias for anything under `frontend/src/` (e.g. `@/lib/auth/auth`).
- **Routing** — add or change URLs only in `frontend/src/routes.tsx`; consume the exported `PATHS` elsewhere.
- **Data access** — keep `localStorage` and mock data inside `frontend/src/lib/*`; components stay presentational.
- **Formatting** — match the surrounding code. Prettier config lives in `frontend/.prettierrc`.
- Avoid unrelated formatting churn in a feature or fix PR.

## Checks before you push

Run these from `frontend/` and make sure they pass:

```bash
npm run lint
npm run build
```

`npm run build` also runs the TypeScript compiler, so it catches type errors before CI.

## Pull requests

1. Push your branch and open a PR against `main`.
2. Fill in a clear title (Conventional Commit style is fine) and describe:
   - **What** changed and **why**.
   - **How to test** it (steps, accounts, routes).
   - Any **screenshots** for UI changes.
   - Linked issues, e.g. `Closes #12`.
3. Keep the PR small and scoped to one change. Large PRs are hard to review and slow to merge.
4. Make sure `npm run lint` and `npm run build` pass.
5. Respond to review comments with follow-up commits (don't force-push over a review in progress).
6. A maintainer will merge once approved. Squash-merge is preferred to keep history clean.

### PR checklist

- [ ] Branch is up to date with `main`.
- [ ] Commit messages follow Conventional Commits.
- [ ] `npm run lint` and `npm run build` pass locally.
- [ ] No secrets, API keys, or `.env` files committed.
- [ ] Docs updated (`README.md` or this file) if behavior changed.
- [ ] Screenshots attached for visual changes.

## Reporting bugs and requesting features

Open a GitHub issue and include:

- What you expected vs. what happened.
- Steps to reproduce, including the route/URL and the account role used.
- Browser and OS.
- Screenshots or console errors if available.

## License

By contributing, you agree that your contributions are licensed under the same terms as this
repository.
