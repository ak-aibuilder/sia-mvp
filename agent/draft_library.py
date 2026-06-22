"""Find the prior draft of an uploaded screenplay from a local library.

The library lives in screenplays/library/ and holds older drafts named like
`the-matrix-1996.txt`. Given the text of an uploaded (current) draft, we detect
its title and year, then return the matching older draft to compare against.
"""

import os
import re

LIBRARY_DIR = os.path.join(os.path.dirname(__file__), "screenplays", "library")

# Lines that look like titles but are not (headers, sluglines, boilerplate).
_STOP_TITLES = {
    "fade in", "fade out", "the end", "written by", "by", "continued",
    "numbered shooting script", "shooting script", "final draft", "revised",
    "on computer screen", "int", "ext", "cut to", "dissolve to",
}
_TITLE_STRIP = re.compile(r"[^a-z0-9 ]+")
_STOPWORDS = {"the", "a", "an"}


def _slug_tokens(title):
    """Normalize a title into a set of comparison tokens (drops articles, year)."""
    title = _TITLE_STRIP.sub(" ", title.lower())
    return {t for t in title.split() if t and t not in _STOPWORDS and not t.isdigit()}


def detect_title(text):
    """Best-effort screenplay title from the draft text.

    Priority: (1) a repeating running header like "THE MATRIX - Rev. 3/9/98",
    (2) the line just above a "Written by" / "by" credit, (3) the most common
    short ALL-CAPS line near the top.
    """
    head = text[:8000]

    # (1) Running header "TITLE - Rev ..." (most reliable for shooting scripts).
    headers = re.findall(r"^\s*([A-Z][A-Z0-9 '.]{1,40}?)\s*[-–]\s*Rev", head, re.M)
    if headers:
        return _most_common(headers).strip()

    lines = [ln.strip() for ln in head.splitlines()]
    # (2) Line above the credit.
    for i, ln in enumerate(lines):
        if re.fullmatch(r"(written by|by)", ln.strip().lower()) and i > 0:
            for j in range(i - 1, -1, -1):
                cand = lines[j].strip()
                if cand and cand.lower() not in _STOP_TITLES:
                    return cand

    # (3) Most common qualifying ALL-CAPS line.
    caps = [ln for ln in lines
            if ln and ln == ln.upper() and 2 <= len(ln) <= 40
            and re.search(r"[A-Z]", ln) and ln.lower() not in _STOP_TITLES
            and not ln.startswith(("INT", "EXT"))]
    if caps:
        return _most_common(caps).strip()
    return ""


def detect_year(text):
    years = [int(y) for y in re.findall(r"\b(19\d\d|20\d\d)\b", text[:8000])]
    return min(years) if years else None  # earliest dated stamp = the draft's date


def _most_common(items):
    counts = {}
    for it in items:
        counts[it] = counts.get(it, 0) + 1
    return max(counts, key=counts.get)


def _library_entries():
    if not os.path.isdir(LIBRARY_DIR):
        return []
    out = []
    for fn in sorted(os.listdir(LIBRARY_DIR)):
        if not fn.lower().endswith((".txt", ".fdx")):
            continue
        path = os.path.join(LIBRARY_DIR, fn)
        stem = os.path.splitext(fn)[0]
        years = [int(y) for y in re.findall(r"(19\d\d|20\d\d)", stem)]
        out.append({
            "filename": fn,
            "path": path,
            "tokens": _slug_tokens(stem),
            "year": years[0] if years else None,
        })
    return out


def find_prior(current_text):
    """Return the best matching prior draft, or None.

    Match library entries whose title tokens are all present in the uploaded
    draft's title; among those, prefer the newest draft strictly older than the
    uploaded one (falling back to any match).
    """
    title = detect_title(current_text)
    cur_tokens = _slug_tokens(title)
    cur_year = detect_year(current_text)
    if not cur_tokens:
        return None

    matches = [e for e in _library_entries() if e["tokens"] and e["tokens"] <= cur_tokens]
    if not matches:
        return None

    def sort_key(e):
        ey = e["year"] or 0
        is_prior = cur_year is not None and ey and ey < cur_year
        return (1 if is_prior else 0, ey)

    best = sorted(matches, key=sort_key, reverse=True)[0]
    with open(best["path"], encoding="utf-8", errors="replace") as fh:
        best = {**best, "text": fh.read(), "title": title, "current_year": cur_year}
    return best
