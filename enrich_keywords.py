#!/usr/bin/env python3
"""enrich_keywords.py - bake each work's Zenodo keywords into index.html as data-kw.

    python3 enrich_keywords.py           # rewrite index.html in place
    python3 enrich_keywords.py --dry-run # report only, change nothing

WHY. The hub carries each work's title, description and DOI, so the search box can filter the
page itself with no runtime call to Zenodo. What the page does NOT carry is the keyword list on
each record: "XBRL", "HBM", "Colorado River", "Compensation Actually Paid" and so on. Those are
the terms a reader who knows what they want will actually type. This fetches them ONCE and
writes them into the markup, after which the page is static again and search needs no network.

Re-run it after publishing a new work, or after editing keywords on a record. Nothing else in
the file is touched: it only adds or replaces a data-kw attribute on each entry's opening div.

Stdlib only, matching the house no-dependency style.
"""
import argparse
import html
import json
import re
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
PAGE = HERE / "index.html"
API = "https://zenodo.org/api/records"
OPEN = re.compile(r'<div class="(paper|tool)"(?:\s+data-kw="[^"]*")?>')
# An entry's body ends at the next entry, the next section heading, or the footer. Without all
# three the last card in a group swallows the following section and inherits its DOI.
STOP = re.compile(r'<div class="(?:paper|tool|grp)"|<h2|<footer')


def fetch_keywords(recid, cache):
    """Keywords for a concept recid, via its latest version. Concept ids need the versions hop."""
    if recid in cache:
        return cache[recid]
    for url in (f"{API}/{recid}/versions/latest", f"{API}/{recid}"):
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                meta = json.load(r).get("metadata", {})
            cache[recid] = meta.get("keywords") or []
            return cache[recid]
        except Exception:
            continue
    cache[recid] = []
    return []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    page = PAGE.read_text()
    cache, out, last, total, missing = {}, [], 0, 0, []
    opens = list(OPEN.finditer(page))

    for m in opens:
        kind = m.group(1)
        nxt = STOP.search(page, m.end())
        body = page[m.end():nxt.start() if nxt else len(page)]
        title = re.search(r"<h3>(.*?)</h3>", body, re.S)
        title = re.sub(r"<.*?>", "", title.group(1)).strip() if title else "?"
        # The first DOI in an entry is the paper's; a tool card's own DOI comes second.
        doi = re.search(r"doi\.org/10\.5281/zenodo\.(\d+)", body)
        kws = fetch_keywords(doi.group(1), cache) if doi else []
        if not kws:
            missing.append(title)
        total += len(kws)

        attr = f' data-kw="{html.escape(" | ".join(kws), quote=True)}"' if kws else ""
        out.append(page[last:m.start()])
        out.append(f'<div class="{kind}"{attr}>')
        last = m.end()
        print(f"  {len(kws):2d} kw  {title[:62]}")

    out.append(page[last:])
    new = "".join(out)

    print(f"\n{len(cache)} records fetched, {total} keyword strings written across "
          f"{len(opens)} entries")
    if missing:
        print(f"no keywords ({len(missing)}): {', '.join(t[:38] for t in missing)}")
    if args.dry_run:
        print("dry run, index.html unchanged")
        return 0
    if new == page:
        print("index.html already current")
        return 0
    PAGE.write_text(new)
    print("index.html updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
