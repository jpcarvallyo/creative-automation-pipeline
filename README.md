# Creative Automation Pipeline

Adobe FDE take-home POC — campaign brief → social creatives (1:1, 9:16, 16:9) with brand checks.

## Quick start (reviewer: under 5 minutes)

```bash
cp .env.example .env
npm install
npm run dev
```

- Engine: http://localhost:3001  
- Web console: http://localhost:3000  

Open the web UI, click **Run** (sample brief is preloaded). Gallery + log update when the job finishes.

No API key needed — mock heroes via sharp. Optional: set `GENAI_API_KEY` (fal.ai) in `.env` and restart.

### CLI alternative

```bash
npm run dev:engine
npm run cli -- examples/brief.json
```

Outputs: `./data/outputs/<runId>/<productId>/`

## Layout

| Package | Role |
|---------|------|
| `engine/` | Express HTTP service — jobs + pipeline + `/media` |
| `cli/` | HTTP-only CLI client |
| `storage/` | `AssetStorage` (local disk default, R2 via env) |
| `web/` | Thin Next.js operator console (HTTP only) |

## Example input

See [`examples/brief.json`](examples/brief.json).

## Example output

```
data/outputs/<runId>/
  aqua-spark/hero.png
  aqua-spark/1x1.png
  aqua-spark/9x16.png
  aqua-spark/16x9.png
  berry-burst/...
```

Brand report on `GET /runs/:id` and in the CLI/UI log.

## Key design decisions

| Choice | Why | Gave up |
|--------|-----|---------|
| Express engine | Familiar, easy to defend live | Fastify schemas |
| npm workspaces | `npm install` only for reviewers | pnpm |
| One hero → sharp ratios | Cost + determinism | Per-ratio GenAI |
| Mock without `GENAI_API_KEY` | Zero-setup demo | Always-live GenAI |
| Brand checks as signals | Heuristic gates, not verdicts | Hard-fail blocking |
| Thin Next console | Operator surface only | Auth, dashboards, CMS |

## Assumptions / limitations

- In-memory jobs — lost on process restart  
- Brand checks are cheap heuristics (word list, logo ROI MAE, color proximity)  
- Localization = message text swap only  
- R2 backend is implemented but not required for the demo  

## Tests

```bash
npm test
```

- **engine** — brief validation, generator selection, mock heroes, sharp derive sizes, brand heuristics, full mock `runPipeline`
- **storage** — path-traversal guards
- **cli** — brief path resolution, brand summary formatting, HTTP client with mocked `fetch`
- **web** — form validation/payload mapping, model catalog search, `createRun` client errors

## Production hardening (not in POC)

- Durable job queue + object storage by default  
- AuthN/Z on engine and media URLs  
- Stronger brand/legal models; human approval workflow  
- Observability, retries, cost caps on GenAI  
- Horizontal workers; separate render farm from API  
