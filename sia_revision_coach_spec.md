# SIA Revision Coach Agent - Integration Spec

## Goal

Wire a live Revision Coach Agent into the existing SIA Instructor Dashboard prototype. The agent calls the Anthropic API, analyzes a real screenplay against rubric criteria, and produces output that renders inside the existing UI with zero visual changes.

The demo should show ONE cohesive product where the Revision Coach Agent is already functioning. Not two separate artifacts.

## What already exists

The SIA Instructor Dashboard is a working React prototype (React 18 via CDN + Babel standalone). It has these source files:

```
SIA Instructor Dashboard.html   <- entry point, loads all JSX via Babel
app.jsx                          <- routing shell (cohort | student | upload | projects | account)
components.jsx                   <- NavRail, DeltaViz, StatusPill, TrendGlyph, Icons
data.jsx                         <- mock data: COHORT, FEATURED, WEEK4_CRITERIA, PROJECTS, ACCOUNT
screen_cohort.jsx                <- cohort overview table with sorting/filtering
screen_student.jsx               <- individual student detail with Revision Coach output
screen_upload.jsx                <- batch upload flow (simulated)
screen_account.jsx               <- account settings
styles.css                       <- full styling (42KB, do NOT modify)
```

All data lives on `window.SIA_DATA`. The app uses `localStorage` for route persistence. No build tools, no bundler, no npm.

## The data contract (CRITICAL)

The Revision Coach output schema is already defined in `data.jsx` as the `FEATURED` object. The student detail screen (`screen_student.jsx`) renders this object directly. The agent MUST produce output that matches this exact shape.

### WEEK4_CRITERIA (the rubric)

```js
const WEEK4_CRITERIA = [
  { id: 'inciting',     label: 'Inciting incident lands by p.10',       short: 'Inciting' },
  { id: 'protagonist',  label: 'Protagonist has active want + need',    short: 'Protagonist' },
  { id: 'scene-econ',   label: 'Scene economy (no scene > 3 pages)',    short: 'Scene Econ.' },
  { id: 'subtext',      label: 'Dialogue carries subtext, not info',    short: 'Subtext' },
  { id: 'midpoint',     label: 'Midpoint reversal present',             short: 'Midpoint' },
  { id: 'visual',       label: 'Visual storytelling over exposition',   short: 'Visual' },
];
```

### FEATURED output schema (what the agent must produce)

```js
{
  id: 1,  // student ID
  findings: [
    {
      type: 'improved' | 'regressed' | 'unaddressed',
      criterion: string,       // must match a WEEK4_CRITERIA.id
      headline: string,        // one-line summary, specific to the screenplay
      priorDraft: string,      // what the prior draft looked like on this criterion
      currentDraft: string,    // what the current draft does on this criterion
      evidence: {              // nullable - include when there's a specific page/excerpt to cite
        page: number,
        excerpt: string        // formatted like screenplay text (character names in caps, etc.)
      } | null,
    },
    // ... one finding per criterion that has something to say
  ],
  summary: {
    improved: number,          // count of 'improved' findings
    regressed: number,         // count of 'regressed' findings
    unaddressed: number,       // count of 'unaddressed' findings
    draftPage: number,         // page count of current draft
    priorPage: number,         // page count of prior draft
    overallTrend: 'up' | 'down' | 'flat',
    note: string,              // 2-3 sentence coach note for the instructor
  },
}
```

### How screen_student.jsx uses FEATURED

Line 12: `const findings = isFeatured ? FEATURED.findings : buildSyntheticFindings(student);`

If `student.id === 1` (Priya Sharma), it uses `FEATURED.findings`. For all other students, it generates lightweight synthetic findings from the student's summary stats. The agent integration should replace the hardcoded `FEATURED` object with real Claude-generated analysis.

## What to build

### Step 1: revision_coach.py (the agent)

A Python script that:

1. Reads a screenplay text file
2. Sends it to the Anthropic API with the WEEK4_CRITERIA rubric
3. Returns a JSON object matching the FEATURED schema

**System prompt guidance for Claude:**

The system prompt should frame Claude as a screenwriting pedagogy expert. Key constraints:

- Evaluate CRAFT, not creativity. Never say "this story should have gone differently." Say "the structural choice on page X achieves/doesn't achieve Y."
- Every finding must reference specific moments in the screenplay with page numbers where possible.
- Evidence excerpts should be formatted like screenplay text (character names in ALL CAPS, parentheticals in parens, action lines in present tense).
- The agent evaluates the screenplay as if it were "Draft 3" being compared against a hypothetical "Draft 2." Since we only have one screenplay for the demo, the agent should construct plausible prior-draft observations that set up the current-draft analysis. This makes the draft-over-draft comparison feel real.
- Findings should use the full range of types. Not everything should be "improved." A realistic analysis has some regressions and unaddressed items.
- The `summary.note` should read like advice to an instructor, not to a student.
- No em dashes anywhere in the output. Use commas, colons, hyphens, or parentheses instead.

**API call structure:**

```python
import anthropic
import json

client = anthropic.Anthropic()

def analyze_screenplay(screenplay_text, criteria):
    response = client.messages.create(
        model="claude-sonnet-4-6",  # use sonnet for dev, opus for final output
        max_tokens=4096,
        system="[system prompt with rubric criteria and output schema]",
        messages=[
            {"role": "user", "content": f"Analyze this screenplay:\n\n{screenplay_text}"}
        ]
    )
    # Parse the JSON from Claude's response
    return json.loads(response.content[0].text)
```

**Output:** Write the result to `featured_output.json`.

### Step 2: Inject the output into data.jsx

Replace the hardcoded `FEATURED` object in `data.jsx` (lines 65-126) with the contents of `featured_output.json`. The rest of data.jsx stays exactly as-is.

Also update the student in the COHORT array (id: 1, Priya Sharma) so her summary stats match the FEATURED output:
- `improved` count
- `regressed` count  
- `unaddressed` count
- `trend` should match `summary.overallTrend`
- `status` should be derived from the trend (up -> on-track, down -> intervene, flat -> attention)

### Step 3: Verify the UI renders correctly

Open `SIA Instructor Dashboard.html` in a browser. Navigate to Priya Sharma (student id 1). Confirm:

- The Revision Coach banner shows correct improved/regressed/unaddressed counts
- The Coach note displays the generated summary
- The syllabus alignment grid shows correct indicators per criterion
- The revision ledger lists all findings with correct types
- Clicking a finding shows the detail panel with priorDraft, currentDraft, and evidence
- Evidence excerpts render in the `<pre>` block formatted like screenplay text
- Filter buttons (All/Improved/Regressed/Unaddressed) work correctly

## Screenplay for the demo

Use the Chinatown screenplay by Robert Towne. Source it from Internet Archive or save the text manually to `screenplays/chinatown.txt`. 

If obtaining Chinatown is difficult, any well-known short film or feature screenplay will work. The point is to show real structural analysis on a real screenplay, not the specific title.

## Important constraints

- Do NOT modify styles.css
- Do NOT modify the UI components or screen layouts
- Do NOT add new screens or navigation items
- Do NOT change the WEEK4_CRITERIA (the 6 criteria are the rubric for this demo)
- Do NOT add npm, webpack, vite, or any build tooling. The app runs via CDN React + Babel standalone.
- The ONLY files that should change are `data.jsx` (to inject real FEATURED output) and optionally `screen_student.jsx` (only if needed for minor data binding adjustments)
- All new code (the Python agent) lives in a separate directory (e.g., `agent/`)

## Directory structure after integration

```
sia-prototype/
  SIA Instructor Dashboard.html    <- unchanged
  app.jsx                           <- unchanged
  components.jsx                    <- unchanged
  data.jsx                          <- FEATURED object replaced with real output
  screen_cohort.jsx                 <- unchanged
  screen_student.jsx                <- unchanged (or minimal binding adjustments)
  screen_upload.jsx                 <- unchanged
  screen_account.jsx                <- unchanged
  styles.css                        <- unchanged
  agent/
    revision_coach.py               <- the agent script
    featured_output.json            <- generated output (committed for demo)
    inject_featured.py              <- script to replace FEATURED in data.jsx
    screenplays/
      chinatown.txt                 <- test screenplay
```

## What success looks like

1. Run `python agent/revision_coach.py` and it produces `featured_output.json`
2. Run `python agent/inject_featured.py` and it updates `data.jsx`
3. Open the dashboard in a browser
4. Click on Priya Sharma
5. The Revision Coach output shows real, differentiated analysis of Chinatown
6. Every finding references specific moments from the screenplay
7. The analysis feels like something a screenwriting instructor would find genuinely useful
8. No other part of the UI is broken or changed

## Stretch goal (only if time permits)

Add a client-side "Analyze" button to `screen_student.jsx` that calls the Anthropic API directly from the browser (using the `fetch` API to `https://api.anthropic.com/v1/messages`). This would let the demo show the agent running live. But this is a stretch goal. The pre-generated approach is the primary path.

If implementing the stretch goal, the API key should be entered in a simple prompt dialog or config field, never hardcoded.

## What to skip

- No database or persistence layer
- No real file upload processing
- No multi-screenplay batch processing
- No real draft-over-draft comparison (the agent constructs plausible prior-draft context)
- No user authentication beyond the existing mock login
- No deployment or hosting
