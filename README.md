# Creative Automation Pipeline

POC for the Adobe Forward Deployed Engineer take-home.

Operators fill out a campaign brief. The system produces social creatives in 1:1, 9:16, and 16:9, overlays the campaign message, runs a few brand checks, and writes the files to disk. If a product points at an existing local asset, that hero is reused; otherwise a new one is generated (fal.ai when you set a key, sharp placeholders when you don't).

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

Open the UI. There's a structured brief form preloaded with a sample campaign — campaign fields, products, brand options, and which hero model to use. Hit **Run**. The form compiles down to the same JSON brief the engine expects, then `POST`s it. Watch the log and gallery when the job finishes.

You do **not** need an API key for the happy path. Leave `GENAI_API_KEY` empty and it uses mock heroes. If you want real images, put a fal.ai key in `.env` and restart the engine.

### Reusing a local asset in the UI

Per product, **Hero source** can generate a new image or reuse a file under `examples/assets/` (presets in the dropdown, or a custom path). Brand **Logo** works the same way — paths on disk, not a browser upload. That matches “accept input assets from a local folder and reuse when available.”

### CLI instead of the UI

The CLI skips the form and posts a JSON file directly:

```bash
npm run dev:engine
npm run cli -- examples/brief.json
```

Same engine contract either way. Outputs land under `./data/outputs/<runId>/<productId>/`.

## What's in the repo

```
engine/    Express service — jobs, pipeline, brand checks, /media
web/       Thin Next.js console: brief form → JSON → HTTP only
cli/       Posts a JSON brief and polls (HTTP only)
storage/   AssetStorage — local disk by default, R2 if you flip the env
examples/  Sample brief.json + assets (logo, Vitality Harvest sample)
```

Web and CLI never import engine code. They POST a brief and poll for status/outputs.

## Brief shape

The engine always validates a JSON campaign brief (Zod). The web form is just a nicer way to build that payload. See [`examples/brief.json`](examples/brief.json) for a hand-written example. Fields:

- campaign name, region, audience, message
- at least two products (optional `assetPath` to reuse a local hero)
- optional brand bits (primary color, prohibited words, logo path)
- optional `generator`: `"mock"` or `"fal.ai"`

Primary color on the brief is the **target for the brand-color check**, not a paint tool for the image.

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

1. Client sends a brief (`POST /runs`) — from the form or a JSON file.
2. Engine validates, parks a job in memory, returns an id right away.
3. Background work: for each product, resolve a hero (reuse file or generate).
4. From that one hero, sharp crops/resizes to the three ratios, burns in the message (SVG overlay), and optionally drops the logo in the corner.
5. Run brand heuristics, write PNGs via storage, mark the job done.

Important detail: GenAI is called at most once per product. Aspect ratios are derived, not regenerated. If you ever localized this, you'd swap the message text and re-derive — not call the image model again.

## Choices I made

**Express for the engine.** I know it well and can talk through it in an interview without fighting the framework. Fastify would've been fine; I didn't need the extra schema layer for a POC.

**npm workspaces.** Reviewers get one `npm install`. Not a hill I'd die on — pnpm is great — but friction mattered more here.

**Form in the UI, JSON at the boundary.** Operators shouldn't hand-edit JSON for a demo. The engine still speaks one validated brief shape so the CLI and any future client stay simple.

**One hero → sharp for ratios.** Calling the model three times per product is slower, more expensive, and the crops won't match. Deterministic derive felt like the right production instinct even for a demo.

**Mock generator when there's no key.** The whole pipeline has to run for a reviewer with zero setup. Real GenAI is opt-in.

**Brand checks as signals, not hard fails.** They're cheap heuristics (word list, logo ROI compare, color proximity on a downscaled image). Useful as first gates. Not something I'd treat as a legal verdict.

**Thin UI.** Brief form, model picker, run button, gallery, log. No auth, no dashboards, no file upload widget. Local asset reuse is path-based on purpose. The engine is the product.

**Storage behind an interface.** Local disk is the default so the demo is boring and reliable. There's an R2 implementation behind `STORAGE_BACKEND=r2` if you want to prove the port; I didn't make reviewers need Cloudflare credentials.

## Limits (honest)

- Jobs live in a process `Map`. Restart the engine and they're gone. Files on disk stick around.
- Brand checks are heuristics. Easy to fool; that's fine for this scope.
- "Localization" here just means changing the overlay string.
- Input assets are paths the engine can read (e.g. under `examples/assets/`), not drag-and-drop uploads from the browser.
- R2 put/get works, but the web gallery still assumes local `/media` paths. Wiring signed URLs would be the next step if you actually ran on R2.
- No auth on the engine or media URLs.

## Tests

```bash
npm test
```

Covers brief validation, mock generation, sharp derive sizes, brand helpers, a full mock pipeline run, storage path-traversal guards, plus some CLI/web client/form checks.

## If this were going to production

Roughly in order: durable queue + persistent job store, auth on the API and media, object storage as the default with signed URLs, real brand/legal review plus a human approval step, retries and cost caps on GenAI, and splitting render workers off the API process. Browser upload into storage would sit on top of the same reuse path.

## Env

Copy from [`.env.example`](.env.example). The ones that matter:

| Var | What it does |
|-----|----------------|
| `GENAI_API_KEY` | fal.ai key. Empty → mock. |
| `STORAGE_BACKEND` | `local` (default) or `r2` |
| `LOCAL_STORAGE_DIR` | where local files go (default `./data`) |
| `PORT` | engine port (default `3001`) |
