# Creative Automation Pipeline

Adobe FDE take-home POC — campaign brief → social creatives (1:1, 9:16, 16:9) with brand checks.

## Quick start (mock — no API key)

```bash
cp .env.example .env
npm install
npm run build:engine
npm run dev:engine
```

In another terminal:

```bash
npm run cli -- examples/brief.json
```

Outputs land under `./data/outputs/<runId>/<productId>/` (see `LOCAL_STORAGE_DIR`).

Optional real GenAI: set `GENAI_API_KEY` to your fal.ai key in `.env`, restart the engine.

## Status

- **Stage 1:** job API  
- **Stage 2:** image pipeline (fal/mock + sharp) + CLI + local/R2 storage interface  
- **Stage 3 next:** brand heuristic checks  
- **Stage 4:** thin Next.js UI  

## Layout

| Package | Role |
|---------|------|
| `engine/` | Express HTTP service — jobs + pipeline |
| `cli/` | HTTP-only CLI client |
| `storage/` | `AssetStorage` (local disk default, R2 via env) |
| `web/` | Thin Next.js console (stage 4) |

## Design decisions

