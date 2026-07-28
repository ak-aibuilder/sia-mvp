# SIA — Script Intelligence Agent

An instructor dashboard for screenwriting workshops, with a Revision Coach
Agent that reads a student's screenplay draft, compares it against the prior
draft, and produces real, evidence-cited craft feedback mapped to a syllabus
rubric.

The dashboard is a static React prototype (no build step). The agent is a
Python service that calls the Anthropic API to do the actual screenplay
analysis and hands the result back to the dashboard.

## What's here

```
SIA_prototype/     the dashboard (React 18 via CDN + Babel standalone, no npm/build tools)
agent/             the Revision Coach Agent (Python + Anthropic API)
sia_revision_coach_spec.md   the integration spec this was built against
```

### `SIA_prototype/`

- `SIA Instructor Dashboard.html` — entry point, loads all JSX via Babel
- `app.jsx` — routing shell (cohort | student | upload | account), login state, localStorage-persisted route
- `components.jsx` — NavRail, DeltaViz, StatusPill, TrendGlyph, Icons
- `data.jsx` — cohort data, the Week 4 rubric (`WEEK4_CRITERIA`), and `FEATURED` (the baked-in Revision Coach output for the demo student)
- `screen_cohort.jsx` — cohort overview table (sort/filter)
- `screen_student.jsx` — student detail screen: Revision Coach banner, syllabus alignment grid, revision ledger, finding detail panel
- `screen_upload.jsx` — live upload flow: drop a draft, the server finds its prior draft and runs the real comparison
- `screen_account.jsx` — account settings
- `styles.css` — all styling

No React build tooling — everything runs by opening the HTML file or serving
the directory statically.

### `agent/`

- `revision_coach.py` — calls the Anthropic API against the Week 4 rubric. Supports two modes: a real two-draft comparison (given a prior + current screenplay) and a single-draft mode that constructs a plausible prior-draft context when only one draft is available.
- `server.py` — Flask server that serves the dashboard and exposes `/api/inspect` and `/api/analyze` for the live upload flow
- `draft_library.py` — detects a screenplay's title/year and matches it to the newest older draft in `screenplays/library/`
- `pdf_extract.py` — extracts text + page count from PDF/TXT/FDX uploads
- `inject_featured.py` — bakes a generated `featured_output.json` into `data.jsx`'s `FEATURED` object (static/no-server path)
- `featured_output.json` — a generated Revision Coach analysis, committed for the demo
- `screenplays/` — sample screenplays used for analysis, including a prior-draft library for the live comparison flow

## Running it

### Option A — Live server (recommended)

Runs the real upload → analyze flow: drop a draft, SIA finds its prior draft
and runs a genuine draft-over-draft comparison via Claude.

```bash
cd agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...   # omit for mock output (offline rehearsal)
python server.py                      # serves http://localhost:8731
```

Open `http://localhost:8731`, go to **Batch Upload**, and drop a screenplay
draft (PDF/TXT/FDX). The server detects its title, finds the matching older
draft in `agent/screenplays/library/`, runs the comparison, and drops you on
the writer's revision ledger.

Model defaults to `claude-sonnet-4-6` for fast turnaround; override with
`SIA_MODEL=claude-opus-4-8` for higher-quality output.

### Option B — Static, pre-generated

Generate one analysis and bake it directly into the dashboard's data, no
server required:

```bash
cd agent
export ANTHROPIC_API_KEY=sk-ant-...
python revision_coach.py     # analyzes a screenplay -> featured_output.json
python inject_featured.py    # writes the result into SIA_prototype/data.jsx
```

Then open `SIA_prototype/SIA Instructor Dashboard.html` over any static
server.

## The data contract

The Revision Coach output is a fixed schema (`FEATURED` in `data.jsx`) that
`screen_student.jsx` renders directly:

```js
{
  id: <student id>,
  findings: [
    {
      type: 'improved' | 'regressed' | 'unaddressed',
      criterion: <one of WEEK4_CRITERIA ids>,
      headline: string,
      priorDraft: string,
      currentDraft: string,
      evidence: { page: number, excerpt: string } | null,
    },
    // one per criterion with something to say
  ],
  summary: {
    improved: number, regressed: number, unaddressed: number,
    draftPage: number, priorPage: number,
    overallTrend: 'up' | 'down' | 'flat',
    note: string,   // instructor-facing coach note
  },
}
```

The rubric (`WEEK4_CRITERIA`) is six fixed criteria for Week 4 of an 8-week
short-film screenwriting cohort: inciting incident, protagonist want/need,
scene economy, subtext, midpoint reversal, and visual storytelling.

## Status

The full integration spec (`sia_revision_coach_spec.md`) has been built and
verified end to end: the agent produces schema-valid output, `data.jsx` is
wired to a real generated analysis, and the dashboard (banner counts, syllabus
grid, revision ledger, finding detail panel, and All/Improved/Regressed/
Unaddressed filters) has been manually verified in-browser against that
output. The live server path (Option A) goes beyond the original spec's
stretch goal by running real two-draft comparisons instead of a single
constructed-prior analysis.
