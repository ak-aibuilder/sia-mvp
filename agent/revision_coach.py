#!/usr/bin/env python3
"""SIA Revision Coach Agent.

Reads a screenplay, sends it to the Anthropic API with the Week 4 rubric, and
writes a JSON object that matches the FEATURED schema consumed by the SIA
instructor dashboard (see data.jsx / screen_student.jsx).

Usage:
    export ANTHROPIC_API_KEY=sk-ant-...
    python revision_coach.py                      # analyzes screenplays/chinatown.txt
    python revision_coach.py --screenplay path.txt --model claude-sonnet-4-6

Output: featured_output.json (next to this script).
"""

import argparse
import json
import os
import sys

# The Week 4 rubric. These six criterion ids are the contract: every finding's
# `criterion` MUST be one of these ids, and the dashboard renders one grid cell
# per id.
WEEK4_CRITERIA = [
    {"id": "inciting",    "label": "Inciting incident lands by p.10"},
    {"id": "protagonist", "label": "Protagonist has active want + need"},
    {"id": "scene-econ",  "label": "Scene economy (no scene > 3 pages)"},
    {"id": "subtext",     "label": "Dialogue carries subtext, not info"},
    {"id": "midpoint",    "label": "Midpoint reversal present"},
    {"id": "visual",      "label": "Visual storytelling over exposition"},
]

DEFAULT_MODEL = "claude-opus-4-8"   # spec: sonnet for dev, opus for final output
DEFAULT_SCREENPLAY = os.path.join(os.path.dirname(__file__), "screenplays", "chinatown.txt")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "featured_output.json")

SYSTEM_PROMPT = """You are the SIA Revision Coach, a screenwriting pedagogy expert who reads student \
screenplays for a graduate-level workshop and writes craft notes for the instructor.

You evaluate CRAFT, never creativity. You never say a story "should have gone differently." You say \
"the structural choice on page X achieves (or fails to achieve) Y." You are specific, generous, and \
exacting, the way a good thesis advisor is.

THE RUBRIC (Week 4). Evaluate the screenplay against exactly these six criteria:
{rubric}

THE DRAFT-OVER-DRAFT CONCEIT. You are reading what the workshop treats as "Draft 3," compared against \
an earlier "Draft 2." You only physically have one screenplay, so you must construct plausible, \
specific prior-draft observations that set up the current-draft analysis. The comparison should feel \
like a real revision history: a note from Draft 2 that the writer addressed, softened, or ignored.

EACH FINDING is an object with:
  - type: one of "improved" | "regressed" | "unaddressed"
      improved    = the current draft is measurably better on this criterion than the prior draft
      regressed   = the current draft is worse on this criterion than the prior draft
      unaddressed = a note flagged in prior drafts that this draft did not fix
  - criterion: one of the six rubric ids above (use the id, not the label)
  - headline: one specific line, referencing the actual screenplay (a page, a scene, a character)
  - priorDraft: what the prior draft did on this criterion (you may construct this plausibly)
  - currentDraft: what the current draft does on this criterion, with specifics
  - evidence: either null, or {{ "page": <int>, "excerpt": <string> }}. Include evidence when you can \
cite a specific moment. Format the excerpt like screenplay text: CHARACTER NAMES IN ALL CAPS, \
parentheticals in (parens), action lines in present tense. Use \\n for line breaks.

HARD CONSTRAINTS:
  - Produce one finding per criterion that has something worth saying. Cover the full range of types. \
Do not make everything "improved"; a real analysis has at least one regression and at least one \
unaddressed item.
  - Every finding must reference a specific moment in the screenplay, with a page number where possible.
  - The summary.note reads like advice to the INSTRUCTOR ("steer their notes toward..."), not to the student.
  - NO EM DASHES anywhere in your output. Use commas, colons, hyphens, or parentheses instead.

OUTPUT FORMAT. Return ONLY a single JSON object, no prose, no code fences, matching exactly:
{{
  "id": 1,
  "findings": [ {{ "type": ..., "criterion": ..., "headline": ..., "priorDraft": ..., "currentDraft": ..., "evidence": ... }} ],
  "summary": {{
    "improved": <int>, "regressed": <int>, "unaddressed": <int>,
    "draftPage": <int>, "priorPage": <int>,
    "overallTrend": "up" | "down" | "flat",
    "note": <2-3 sentence instructor-facing string>
  }}
}}
The summary counts MUST equal the actual number of findings of each type."""


COMPARE_PROMPT = """You are the SIA Revision Coach, a screenwriting pedagogy expert who reads student \
screenplays for a graduate-level workshop and writes craft notes for the instructor.

You evaluate CRAFT, never creativity. You never say a story "should have gone differently." You say \
"the structural choice on page X achieves (or fails to achieve) Y." You are specific, generous, and \
exacting, the way a good thesis advisor is.

THE RUBRIC (Week 4). Evaluate the screenplay against exactly these six criteria:
{rubric}

YOU ARE GIVEN TWO REAL DRAFTS of the same screenplay: the PRIOR draft (call it Draft 2) and the \
CURRENT draft (call it Draft 3). Compare them. This is a genuine draft-over-draft diff, so ground \
every observation in what actually changed between the two texts. Do not invent changes.

EACH FINDING is an object with:
  - type: one of "improved" | "regressed" | "unaddressed"
      improved    = the current draft is measurably better on this criterion than the prior draft
      regressed   = the current draft is worse on this criterion than the prior draft
      unaddressed = a weakness present in the prior draft that this draft did not fix
  - criterion: one of the six rubric ids above (use the id, not the label)
  - headline: one specific line, referencing the actual screenplay (a page, a scene, a character)
  - priorDraft: what the PRIOR draft did on this criterion, with specifics from that text
  - currentDraft: what the CURRENT draft does on this criterion, with specifics from that text
  - evidence: either null, or {{ "page": <int>, "excerpt": <string> }}. Cite a page number from the \
CURRENT draft when you can. Format the excerpt like screenplay text: CHARACTER NAMES IN ALL CAPS, \
parentheticals in (parens), action in present tense. Use \\n for line breaks.

HARD CONSTRAINTS:
  - Produce one finding per criterion that has something worth saying. Cover the full range of types. \
A real revision has at least one regression or unaddressed item, not only improvements.
  - Every finding must reference a specific, real difference between the two drafts.
  - The summary.note reads like advice to the INSTRUCTOR ("steer their notes toward..."), not the student.
  - NO EM DASHES anywhere in your output. Use commas, colons, hyphens, or parentheses instead.

OUTPUT FORMAT. Return ONLY a single JSON object, no prose, no code fences, matching exactly:
{{
  "id": 1,
  "findings": [ {{ "type": ..., "criterion": ..., "headline": ..., "priorDraft": ..., "currentDraft": ..., "evidence": ... }} ],
  "summary": {{
    "improved": <int>, "regressed": <int>, "unaddressed": <int>,
    "draftPage": <int>, "priorPage": <int>,
    "overallTrend": "up" | "down" | "flat",
    "note": <2-3 sentence instructor-facing string>
  }}
}}
The summary counts MUST equal the actual number of findings of each type."""


def build_system_prompt(compare=False):
    rubric = "\n".join("  - {id}: {label}".format(**c) for c in WEEK4_CRITERIA)
    template = COMPARE_PROMPT if compare else SYSTEM_PROMPT
    return template.format(rubric=rubric)


def extract_json(text):
    """Claude is asked for raw JSON, but tolerate code fences or leading prose."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object found in model response")
    return json.loads(text[start:end + 1])


def analyze_screenplay(screenplay_text, model, prior_text=None, title=None):
    """Analyze one screenplay. If prior_text is given, do a real draft-over-draft
    comparison (prior = Draft 2, screenplay_text = Draft 3) instead of constructing
    a hypothetical prior draft."""
    import anthropic  # imported lazily so the file is readable without the SDK installed
    client = anthropic.Anthropic()
    if prior_text:
        label = title or "this screenplay"
        user = (
            "Compare these two drafts of {0}.\n\n"
            "===== PRIOR DRAFT (Draft 2) =====\n\n{1}\n\n"
            "===== CURRENT DRAFT (Draft 3) =====\n\n{2}"
        ).format(label, prior_text, screenplay_text)
    else:
        user = "Analyze this screenplay:\n\n" + screenplay_text
    response = client.messages.create(
        model=model,
        max_tokens=4096,
        system=build_system_prompt(compare=bool(prior_text)),
        messages=[{"role": "user", "content": user}],
    )
    return extract_json(response.content[0].text)


def main():
    parser = argparse.ArgumentParser(description="SIA Revision Coach Agent")
    parser.add_argument("--screenplay", default=DEFAULT_SCREENPLAY, help="path to screenplay .txt")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Anthropic model id")
    parser.add_argument("--out", default=OUTPUT_PATH, help="output JSON path")
    args = parser.parse_args()

    if not os.path.exists(args.screenplay):
        sys.exit("Screenplay not found: {}".format(args.screenplay))
    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("ANTHROPIC_API_KEY is not set. Export it and re-run.")

    with open(args.screenplay, encoding="utf-8", errors="replace") as fh:
        screenplay_text = fh.read()

    print("Analyzing {} ({} chars) with {}...".format(args.screenplay, len(screenplay_text), args.model))
    result = analyze_screenplay(screenplay_text, args.model)

    # Light validation against the contract before we commit it.
    valid_ids = {c["id"] for c in WEEK4_CRITERIA}
    for f in result.get("findings", []):
        if f.get("criterion") not in valid_ids:
            print("WARNING: finding references unknown criterion: {}".format(f.get("criterion")))

    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(result, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print("Wrote {} ({} findings).".format(args.out, len(result.get("findings", []))))


if __name__ == "__main__":
    main()
