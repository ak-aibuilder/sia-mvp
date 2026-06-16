#!/usr/bin/env python3
"""Inject featured_output.json into the SIA dashboard's data.jsx.

Replaces the hardcoded FEATURED object and syncs the featured student's row in
the COHORT array (id 1, Priya Sharma) so her summary stats match the agent
output. Nothing else in data.jsx is touched.

Usage:
    python inject_featured.py
"""

import json
import os
import re
import sys

HERE = os.path.dirname(__file__)
OUTPUT_JSON = os.path.join(HERE, "featured_output.json")
DATA_JSX = os.path.normpath(os.path.join(HERE, "..", "SIA_prototype", "data.jsx"))

# overallTrend -> instructor status (spec: up -> on-track, down -> intervene, flat -> attention)
TREND_TO_STATUS = {"up": "on-track", "down": "intervene", "flat": "attention"}


def main():
    if not os.path.exists(OUTPUT_JSON):
        sys.exit("Missing {}. Run revision_coach.py first.".format(OUTPUT_JSON))
    with open(OUTPUT_JSON, encoding="utf-8") as fh:
        featured = json.load(fh)
    with open(DATA_JSX, encoding="utf-8") as fh:
        src = fh.read()

    summary = featured["summary"]
    improved = summary["improved"]
    regressed = summary["regressed"]
    unaddressed = summary["unaddressed"]
    trend = summary["overallTrend"]
    status = TREND_TO_STATUS.get(trend, "attention")
    pages = summary["draftPage"]

    # 1) Replace the FEATURED object. The literal is valid JS, so we emit the
    #    JSON straight in. `.*?\n\};` is non-greedy and the only column-0 "};"
    #    in that region is FEATURED's own close.
    featured_js = "const FEATURED = " + json.dumps(featured, indent=2, ensure_ascii=False) + ";\n"
    # NOTE: pass a function as the replacement so re does not interpret the \n / \g
    # escapes that JSON puts inside excerpt strings.
    src, n = re.subn(r"const FEATURED = \{.*?\n\};\n", lambda m: featured_js, src, count=1, flags=re.S)
    if n != 1:
        sys.exit("Could not locate the FEATURED object in data.jsx")

    # 2) Sync the featured student's DRAFT_PROFILES entry (index 0 -> Priya).
    new_profile = (
        "{{ drafts: 3, improved: {0}, regressed: {1}, unaddressed: {2}, "
        "trend: '{3}', status: '{4}' }}"
    ).format(improved, regressed, unaddressed, trend, status)
    src, n = re.subn(
        r"(const DRAFT_PROFILES = \[\s*\n\s*)\{[^}]*\}",
        lambda m: m.group(1) + new_profile,
        src, count=1, flags=re.S,
    )
    if n != 1:
        sys.exit("Could not locate DRAFT_PROFILES[0] in data.jsx")

    # 3) Title + page count for the featured student so the header matches the
    #    real screenplay being analyzed.
    src, n = re.subn(r"'The Lightkeeper'", "'Chinatown'", src, count=1)
    if n != 1:
        print("Note: 'The Lightkeeper' title not found (already injected?).")
    src, n = re.subn(r"(const PAGE_COUNTS = \[)28,", r"\g<1>{},".format(pages), src, count=1)
    if n != 1:
        print("Note: featured page count not updated (already injected?).")

    with open(DATA_JSX, "w", encoding="utf-8") as fh:
        fh.write(src)

    print("Injected FEATURED ({} findings) into {}".format(len(featured["findings"]), DATA_JSX))
    print("Priya Sharma -> improved={} regressed={} unaddressed={} trend={} status={} pages={}".format(
        improved, regressed, unaddressed, trend, status, pages))


if __name__ == "__main__":
    main()
