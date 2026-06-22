# SIA Revision Coach Agent

Real draft-over-draft screenplay analysis wired into the SIA Instructor Dashboard.

## Two ways to run

### A. Pre-generated (static, no server)
Generate one analysis and bake it into `data.jsx`:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
python revision_coach.py            # analyzes screenplays/chinatown.txt -> featured_output.json
python inject_featured.py           # writes the result into ../SIA_prototype/data.jsx
```
Then open the dashboard over any static server and click Priya Sharma.

### B. Live upload demo (server) — upload a draft, auto-find its prior, compare
This is the on-stage flow: drop the **current** draft, the server finds the
**prior** draft in its library and runs the real comparison.

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...   # omit for MOCK output (rehearsal)
python server.py                      # serves http://localhost:8731/
```

Open **http://localhost:8731/**, go to the **Upload** screen, and drop a draft
(PDF / TXT / FDX). SIA detects the title, finds the matching older draft in
`screenplays/library/`, runs the diff, and drops you on the writer's revision
ledger.

Speed: defaults to `claude-sonnet-4-6` for fast turnaround. Override with
`SIA_MODEL=claude-opus-4-8` for the highest-quality output.

## The prior-draft library

`screenplays/library/` holds older drafts named `<title>-<year>.txt` (or `.fdx`),
e.g. `the-matrix-1996.txt`. On upload, the server detects the uploaded draft's
title + year and matches the newest library draft that is strictly older.

**Matrix demo:** upload the 1999 shooting script (`the-matrix-1999.pdf`); it
auto-matches `the-matrix-1996.txt` as the prior. The bundled 1996 file is a
faithful condensed draft so the demo runs out of the box — drop in your full
`the-matrix-1996.txt` to replace it for maximum fidelity.

## Files
- `server.py` — Flask: serves the dashboard + `/api/inspect`, `/api/analyze`.
- `revision_coach.py` — the agent (single-draft constructed-prior mode, or real two-draft compare).
- `draft_library.py` — title/year detection + prior-draft matching.
- `pdf_extract.py` — PDF/TXT/FDX text + page count.
- `inject_featured.py` — bake a generated result into `data.jsx` (path A).
- `screenplays/library/` — prior drafts.
