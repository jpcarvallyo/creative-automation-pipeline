# Creative Automation Pipeline

POC for the Adobe Forward Deployed Engineer take-home.

You give it a campaign brief (JSON). It produces social creatives in 1:1, 9:16, and 16:9, overlays the campaign message, runs a few brand checks, and writes the files to disk. If a product already has an input asset, that gets reused; otherwise a hero image is generated (fal.ai when you set a key, sharp placeholders when you don't).

**Demo (5 min):** [Loom walkthrough](https://www.loom.com/share/fc860a91d6c74ebfbd1c5b860dc1d0be)

## Run it

Needs Node 20+.

```bash
cp .env.example .env
npm install
npm run dev
```

- Engine: http://localhost:3001
- Web UI: http://localhost:3000

Open the UI and hit Run. There's a sample brief already filled in. Watch the log and gallery when the job finishes.

You do **not** need an API key for the happy path. Leave `GENAI_API_KEY` empty and it uses mock heroes. If you want real images, put a fal.ai key in `.env` and restart the engine.

### CLI instead of the UI

```bash
npm run dev:engine
npm run cli -- examples/brief.json
```

Outputs land under `./data/outputs/<runId>/<productId>/`.

## What's in the repo

```
engine/    Express service — jobs, pipeline, brand checks, /media
web/       Thin Next.js console (talks to the engine over HTTP only)
cli/       Same idea, from the terminal
storage/   AssetStorage — local disk by default, R2 if you flip the env
examples/  Sample brief + logo
```

Web and CLI never import engine code. They POST a brief and poll for status/outputs.

## Example brief

See [`examples/brief.json`](examples/brief.json). Short version of the shape:

- campaign name, region, audience, message
- at least two products
- optional brand bits (primary color, prohibited words, logo path)
- optional `generator`: `"mock"` or `"fal.ai"`

## Example output layout

```
data/outputs/<runId>/
  aqua-spark/
    hero.png
    1x1.png
    9x16.png
    16x9.png
  berry-burst/
    ...
```

Brand check results show up on `GET /runs/:id` and in the UI/CLI log. Failed checks are reported; they don't kill the job. I wanted operators to still see the creatives.

## How the pipeline works

1. `POST /runs` validates the brief, parks a job in memory, returns an id right away.
2. Background work: for each product, resolve a hero (reuse file or generate).
3. From that one hero, sharp crops/resizes to the three ratios, burns in the message (SVG overlay), and optionally drops the logo in the corner.
4. Run brand heuristics, write PNGs via storage, mark the job done.

Important detail: GenAI is called at most once per product. Aspect ratios are derived, not regenerated. If you ever localized this, you'd swap the message text and re-derive — not call the image model again.

## Choices I made

**Express for the engine.** I know it well and can talk through it in an interview without fighting the framework. Fastify would've been fine; I didn't need the extra schema layer for a POC.

**npm workspaces.** Reviewers get one `npm install`. Not a hill I'd die on — pnpm is great — but friction mattered more here.

**One hero → sharp for ratios.** Calling the model three times per product is slower, more expensive, and the crops won't match. Deterministic derive felt like the right production instinct even for a demo.

**Mock generator when there's no key.** The whole pipeline has to run for a reviewer with zero setup. Real GenAI is opt-in.

**Brand checks as signals, not hard fails.** They're cheap heuristics (word list, logo ROI compare, color proximity on a downscaled image). Useful as first gates. Not something I'd treat as a legal verdict.

**Thin UI.** Brief form, run button, gallery, log. No auth, no dashboards. The engine is the product.

**Storage behind an interface.** Local disk is the default so the demo is boring and reliable. There's an R2 implementation behind `STORAGE_BACKEND=r2` if you want to prove the port; I didn't make reviewers need Cloudflare credentials.

## Limits (honest)

- Jobs live in a process `Map`. Restart the engine and they're gone. Files on disk stick around.
- Brand checks are heuristics. Easy to fool; that's fine for this scope.
- "Localization" here just means changing the overlay string.
- R2 put/get works, but the web gallery still assumes local `/media` paths. Wiring signed URLs would be the next step if you actually ran on R2.
- No auth on the engine or media URLs.

## Tests

```bash
npm test
```

Covers brief validation, mock generation, sharp derive sizes, brand helpers, a full mock pipeline run, storage path-traversal guards, plus some CLI/web client/form checks.

## If this were going to production

Roughly in order: durable queue + persistent job store, auth on the API and media, object storage as the default with signed URLs, real brand/legal review plus a human approval step, retries and cost caps on GenAI, and splitting render workers off the API process.

## Env

Copy from [`.env.example`](.env.example). The ones that matter:

| Var | What it does |
|-----|----------------|
| `GENAI_API_KEY` | fal.ai key. Empty → mock. |
| `STORAGE_BACKEND` | `local` (default) or `r2` |
| `LOCAL_STORAGE_DIR` | where local files go (default `./data`) |
| `PORT` | engine port (default `3001`) |
