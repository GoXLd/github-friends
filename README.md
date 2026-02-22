# GitHub Friends Tracker

A React + GitHub Actions service that tracks your GitHub `followers` / `following`, stores history in JSON, and highlights cleanup candidates.

- Demo: https://github-friends.nlo.ovh/
- Russian docs: `README_RU.md`

![GitHub Friends Tracker Demo](github-friends.gif)

## What It Does

- Collects `followers` and `following` snapshots on a schedule (every 6 hours by default).
- Stores historical JSON snapshots in the repository (`public/data/`).
- Builds event history:
  - `follower_gained`
  - `follower_lost`
  - `you_followed`
  - `you_unfollowed`
- Builds practical cleanup reports:
  - `Not Followback` (you follow them, they do not follow back)
  - `Followers` (they follow you, you do not follow them)
  - `Friends` (mutual follows + last contribution activity)
  - `Unfollow candidates`:
    - Not Followback for 7+ days
    - Friends inactive for 60+ days
    - Accounts that unfollowed you and are marked as deleted

## Current UI/Workflow

- Tabs: `Unfollow candidates`, `Not Followback`, `Followers`, `Friends`, `Recent events`.
- Sorting for key columns (waiting time, followed-since, days since last contribution).
- Per-tab display limits (`10/25/50/100/500`).
- Page settings (gear icon):
  - default records count
  - language switch (`English` default, `Russian` optional)
  - local exclusions list
- No database required: JSON files are committed by workflow and served via GitHub Pages.

## Data Files

- `public/data/latest.json` - latest raw snapshot
- `public/data/events.json` - event history
- `public/data/follow-tracker.json` - per-user follow state tracking
- `public/data/reports.json` - precomputed UI report
- `public/data/ignore.json` - ignore list source for snapshot logic
- `public/data/activity-cache.json` - cached mutual activity
- `public/data/snapshots/*.json` - historical snapshots

## Local Development

```bash
npm install
npm run dev
```

## Run Snapshot Locally

```bash
GH_USERNAME=<your_login> \
GITHUB_TOKEN=<github_pat> \
FOLLOW_BACK_WINDOW_DAYS=7 \
FRIEND_INACTIVE_DAYS=60 \
ACTIVITY_REFRESH_HOURS=24 \
DATA_RETENTION_DAYS=90 \
npm run snapshot
```

## GitHub Actions

### `update-follow-data.yml`

- Trigger:
  - schedule: `17 */6 * * *`
  - manual (`workflow_dispatch`)
- Runs `npm run snapshot`
- Commits updated JSON under `public/data`
- Builds and deploys GitHub Pages in the same workflow run
- Auto-cleans old data:
  - removes snapshot files older than `DATA_RETENTION_DAYS` (default: 90)
  - trims event history and activity cache entries older than `DATA_RETENTION_DAYS`

### `deploy-pages.yml`

- Trigger: push to `main` + manual run
- Builds Vite app and deploys to GitHub Pages
- Resolves `VITE_BASE_PATH` automatically for custom domain vs repo pages

## Repository Settings

In `Settings -> Secrets and variables -> Actions`:

- Variable: `GH_USERNAME` (optional; fallback is `github.repository_owner`)
- Secret: `GH_PAT` (optional; fallback is `github.token`)

## GitHub Pages

1. Enable Pages in `Settings -> Pages`
2. Set source to `GitHub Actions`
3. Keep `public/CNAME` for custom domain deployments

If deploy returns `Failed to create deployment (404)`, Pages is usually not enabled yet.

## Favicons

Project icons are stored in `public/favicons/` and wired in `index.html`.

## Risk Notice

Use at your own risk. There is no guarantee that automation patterns or API usage will not trigger GitHub limits/restrictions.

## Security

If you discover a vulnerability, see `SECURITY.md`.

## License

MIT License. See `LICENSE`.
