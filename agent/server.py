#!/usr/bin/env python3
"""SIA Revision Coach demo server.

Serves the SIA Instructor Dashboard and exposes two endpoints used by the live
upload flow:

  POST /api/inspect  -> fast: extract title + page count, find the prior draft
  POST /api/analyze  -> full: run the real draft-over-draft comparison via Claude

Run:
    export ANTHROPIC_API_KEY=sk-ant-...        # omit to use mock output for rehearsal
    python agent/server.py                      # serves http://localhost:8731

Without a key the /api/analyze endpoint returns clearly-labeled sample output so
the UI flow can be rehearsed offline.
"""

import os
import tempfile

from flask import Flask, jsonify, request, send_from_directory

import draft_library
import pdf_extract
import revision_coach

HERE = os.path.dirname(os.path.abspath(__file__))
PROTO_DIR = os.path.normpath(os.path.join(HERE, "..", "SIA_prototype"))
INDEX_HTML = "SIA Instructor Dashboard.html"


def _load_env_local():
    """Load KEY=VALUE pairs from agent/.env.local into the environment.
    Real exported env vars take precedence; this file is gitignored."""
    path = os.path.join(HERE, ".env.local")
    if not os.path.isfile(path):
        return
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key, val = key.strip(), val.strip().strip('"').strip("'")
            os.environ.setdefault(key, val)


_load_env_local()

MODEL = os.environ.get("SIA_MODEL", "claude-sonnet-4-6")  # sonnet = fast for a live demo
HAS_KEY = bool(os.environ.get("ANTHROPIC_API_KEY"))

app = Flask(__name__, static_folder=None)


# ---- static prototype ----
@app.route("/")
def index():
    return send_from_directory(PROTO_DIR, INDEX_HTML)


@app.route("/<path:fname>")
def static_proxy(fname):
    if fname.startswith("api/"):
        return jsonify(error="not found"), 404
    if os.path.isfile(os.path.join(PROTO_DIR, fname)):
        return send_from_directory(PROTO_DIR, fname)
    return jsonify(error="not found"), 404


# ---- api ----
@app.route("/api/health")
def health():
    return jsonify(ok=True, model=MODEL, hasKey=HAS_KEY,
                   library=os.path.basename(draft_library.LIBRARY_DIR))


def _save_upload():
    f = request.files.get("file")
    if not f or not f.filename:
        return None, (jsonify(error="No file uploaded") and 400)
    suffix = os.path.splitext(f.filename)[1] or ".txt"
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    f.save(path)
    return (path, f.filename), None


@app.route("/api/inspect", methods=["POST"])
def inspect():
    saved, err = _save_upload()
    if err:
        return jsonify(error="No file uploaded"), 400
    path, orig = saved
    try:
        text, pages = pdf_extract.extract(path)
        title = draft_library.detect_title(text) or os.path.splitext(orig)[0]
        prior = draft_library.find_prior(text)
        return jsonify(
            title=title,
            pages=pages,
            filename=orig,
            priorFound=bool(prior),
            priorName=prior["filename"] if prior else None,
        )
    finally:
        os.remove(path)


@app.route("/api/analyze", methods=["POST"])
def analyze():
    saved, err = _save_upload()
    if err:
        return jsonify(error="No file uploaded"), 400
    path, orig = saved
    try:
        text, pages = pdf_extract.extract(path)
        prior = draft_library.find_prior(text)
        if not prior:
            title = draft_library.detect_title(text) or orig
            return jsonify(error="No prior draft found in the library for '%s'." % title), 422
        prior_pages = pdf_extract.extract(prior["path"])[1]
        title = prior.get("title") or draft_library.detect_title(text) or orig

        if HAS_KEY:
            featured = revision_coach.analyze_screenplay(
                text, MODEL, prior_text=prior["text"], title=title)
            mock = False
        else:
            featured = _mock_featured()
            mock = True

        featured = _finalize(featured, pages, prior_pages)
        return jsonify(featured=featured, title=title, draftPage=pages,
                       priorPage=prior_pages, priorName=prior["filename"], mock=mock)
    finally:
        os.remove(path)


def _finalize(featured, draft_page, prior_page):
    """Force the data contract: id 1, real page counts, and summary counts that
    match the actual findings (the dashboard banner reads these directly)."""
    featured = dict(featured)
    featured["id"] = 1
    findings = featured.get("findings", [])
    counts = {"improved": 0, "regressed": 0, "unaddressed": 0}
    for f in findings:
        if f.get("type") in counts:
            counts[f["type"]] += 1
    summary = dict(featured.get("summary", {}))
    summary.update(counts)
    summary["draftPage"] = draft_page
    summary["priorPage"] = prior_page
    net = counts["improved"] - counts["regressed"]
    summary["overallTrend"] = "up" if net > 0 else "down" if net < 0 else "flat"
    featured["summary"] = summary
    return featured


def _mock_featured():
    """Schema-valid sample so the UI can be rehearsed without an API key.
    Grounded in real 1996 -> 1999 Matrix changes; the note flags it as a sample."""
    return {
        "id": 1,
        "findings": [
            {"type": "improved", "criterion": "inciting",
             "headline": "The hook now lands on the screen itself (Wake up, Neo)",
             "priorDraft": "Draft 2 opened the Neo thread on a noisy hacker chat room, then an Anthony-and-the-boot scene, so the pull toward the white rabbit was diffuse.",
             "currentDraft": "Draft 3 puts the summons directly on Neo's monitor: 'Wake up, Neo. The Matrix has you. Follow the white rabbit.' The inciting pull is now immediate and personal.",
             "evidence": {"page": 9, "excerpt": "He stops and stares at the four words on the screen:\n\"The Matrix has you.\""}},
            {"type": "improved", "criterion": "subtext",
             "headline": "The club scene trades exposition for the question",
             "priorDraft": "Draft 2 had Trinity explain the danger outright.",
             "currentDraft": "Draft 3 lets her circle the unspoken question ('You know the question just as I did') so the scene runs on what Neo already feels.",
             "evidence": None},
            {"type": "regressed", "criterion": "scene-econ",
             "headline": "Agent interrogation runs longer with the third Agent",
             "priorDraft": "Draft 2 staged the interrogation with two Agents.",
             "currentDraft": "Draft 3 adds Agent Jones and more back-and-forth, which deepens menace but lets the scene cross 3 pages.",
             "evidence": None},
            {"type": "unaddressed", "criterion": "midpoint",
             "headline": "Cypher's turn still arrives without a clean midpoint beat",
             "priorDraft": "Draft 2's reversal sits inside the betrayal sequence late in the second act.",
             "currentDraft": "Draft 3 expands Cypher's motive but the structural midpoint still reads soft.",
             "evidence": None},
        ],
        "summary": {
            "improved": 2, "regressed": 1, "unaddressed": 1,
            "draftPage": 0, "priorPage": 0, "overallTrend": "up",
            "note": "Sample output (no ANTHROPIC_API_KEY set). Set the key and re-run for a real comparison. The open and the dialogue subtext are the clearest gains from Draft 2 to Draft 3.",
        },
    }


if __name__ == "__main__":
    print("SIA demo server  ·  model=%s  ·  key=%s" % (MODEL, "set" if HAS_KEY else "MOCK MODE"))
    print("Open  http://localhost:8731/")
    app.run(host="127.0.0.1", port=8731, debug=False)
