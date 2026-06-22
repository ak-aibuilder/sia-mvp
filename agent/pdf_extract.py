"""Extract screenplay text and a page count from an uploaded file.

Supports .pdf (via pypdf), and .txt / .fdx as plain text. Returns (text, pages).
For text files with no real page breaks, page count is estimated at ~55 lines
per screenplay page.
"""

import os

LINES_PER_PAGE = 55


def extract(path):
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        return _extract_pdf(path)
    return _extract_text(path)


def _extract_pdf(path):
    from pypdf import PdfReader
    reader = PdfReader(path)
    pages = [(p.extract_text() or "") for p in reader.pages]
    text = "\n".join(pages)
    return text, len(reader.pages)


def _extract_text(path):
    with open(path, encoding="utf-8", errors="replace") as fh:
        text = fh.read()
    if "\f" in text:  # form feeds = real page breaks
        pages = text.count("\f") + 1
    else:
        pages = max(1, round(text.count("\n") / LINES_PER_PAGE))
    return text, pages
