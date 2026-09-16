# Creative Automation Pipeline

Adobe FDE take-home POC — campaign brief → social creatives (1:1, 9:16, 16:9) with brand checks.

## Status

**Stage 1 done:** engine job API (stub pipeline). Stages 2–4 next after review.

## Quick start (stage 1)

```bash
cp .env.example .env
npm install
npm run dev:engine
```

In another terminal:

```bash
curl -s -X POST http://localhost:3001/runs \
  -H 'content-type: application/json' \
  -d @examples/brief.json | jq

# poll with returned id
curl -s http://localhost:3001/runs/<id> | jq
curl -s http://localhost:3001/runs/<id>/outputs | jq
```

## Layout

| Package | Role |
|---------|------|
| `engine/` | Express HTTP service — jobs + pipeline |
| `cli/` | HTTP client CLI (stage 2) |
| `storage/` | `AssetStorage` implementations (stage 3) |
| `web/` | Thin Next.js operator console (stage 4) |

Web and CLI talk to the engine **over HTTP only**.

## Design decisions (so far)

