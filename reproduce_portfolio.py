#!/usr/bin/env python3
"""Rebuild the portfolio research guide and optional Archify diagram offline."""
import argparse
import hashlib
from html import escape
import json
import os
from pathlib import Path
import subprocess
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent


def link(url, label):
    """Render an escaped HTTPS or local HTML link; reject other schemes."""
    parsed = urlsplit(url)
    if parsed.scheme:
        valid = parsed.scheme == 'https' and bool(parsed.netloc)
    else:
        valid = not parsed.netloc and parsed.path in {
            'index.html', 'portfolio-research-architecture.html',
            'sovereign-watch-case-study.html', 'sovereign-watch-workflow-v4.html'}
    if not valid:
        raise ValueError(f'Unsupported destination: {url!r}')
    return f'<a href="{escape(url, quote=True)}">{escape(label)}</a>'


def render_guide(data):
    """Render the declared project examples without fetching their sources."""
    if data['schema_version'] != 1:
        raise ValueError('Unsupported guide schema')
    operation_ids = [item['id'] for item in data['operations']]
    if len(set(operation_ids)) != len(operation_ids):
        raise ValueError('Duplicate operation IDs')
    project_names = {item['name'] for item in data['projects']}
    sections = []
    for item in data['operations']:
        examples = []
        for ex in item['examples']:
            if ex['project'] not in project_names:
                raise ValueError('Unknown example project')
            examples.append(f'<div class="example"><h3>{escape(ex["project"])}</h3>'
                f'<p>{escape(ex["text"])}</p><p>{link(ex["url"], ex["label"])}</p>'
                f'<p class="limit">{escape(ex["limit"])}</p></div>')
        sections.append(f'<section id="{escape(item["id"], quote=True)}"><h2>{escape(item["title"])}</h2>'
            f'<p class="summary">{escape(item["summary"])}</p>{"".join(examples)}</section>')
    # Validate the iframe destination with the same allowlist as visible links.
    link(data['diagram'], 'Diagram')
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Shared research architecture with linked examples from the NM AI Research portfolio.">
<title>{escape(data['title'])} | NM AI Research</title>
<style>
:root{{color-scheme:light dark;--bg:#f5f6f8;--fg:#172b42;--muted:#526174;--line:#c9d2dc;--panel:#fff;--link:#075da8}}
@media(prefers-color-scheme:dark){{:root{{--bg:#101923;--fg:#e4eaf1;--muted:#b4c2d1;--line:#384958;--panel:#172330;--link:#96c9ff}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--fg);font:17px/1.65 system-ui,sans-serif}}
main{{max-width:1180px;margin:auto;padding:28px clamp(20px,4vw,48px)}}a{{color:var(--link);text-underline-offset:.2em}}
nav{{display:flex;flex-wrap:wrap;gap:12px 24px;font-size:.9rem}}h1{{font-size:clamp(2rem,5vw,3rem);line-height:1.15;margin:36px 0 18px}}
h2{{font-size:1.35rem;line-height:1.3;margin:0 0 12px}}h3{{font-size:1rem;line-height:1.4;margin:0 0 8px}}p{{margin:0 0 14px}}
.intro{{max-width:820px}}.eyebrow{{font-size:.75rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}}
.projects{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin:28px 0 34px}}
.projects article{{border-top:2px solid var(--fg);padding-top:16px}}.projects p{{font-size:.92rem}}
.map{{margin:24px 0 40px}}iframe{{width:100%;height:750px;border:1px solid var(--line);background:var(--panel)}}
.operations{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:30px 42px}}section{{border-top:1px solid var(--line);padding-top:22px;scroll-margin-top:20px}}
.summary{{color:var(--muted)}}.example{{margin-top:22px}}.limit{{font-size:.86rem;color:var(--muted)}}
footer{{margin-top:46px;border-top:1px solid var(--line);padding-top:24px;font-size:.85rem;color:var(--muted)}}
:focus-visible{{outline:3px solid var(--link);outline-offset:4px}}@media(max-width:720px){{.projects,.operations{{grid-template-columns:1fr}}iframe{{height:620px}}}}
</style></head><body><main>
<nav aria-label="Portfolio navigation">{link('index.html','NM AI Research')}{link('sovereign-watch-case-study.html','SW case study')}{link('sovereign-watch-workflow-v4.html','SW workflow')}</nav>
<h1>{escape(data['title'])}</h1><p class="intro">{escape(data['introduction'])}</p>

<div class="map"><p>{link(data['diagram'],'Open the full research map')}</p><iframe src="{escape(data['diagram'],quote=True)}" title="Research architecture: question, scope, novelty, evidence, analysis, challenge and publication" loading="lazy"></iframe></div>
<div class="operations">{''.join(sections)}</div>
<footer><p><strong>Verification.</strong> {escape(data['verification'])}</p><p><strong>AI assistance.</strong> {escape(data['disclosure'])}</p>
<p><a href="PORTFOLIO_MAP_README.md">Editable source and reproduction</a> · <a href="PORTFOLIO_MAP_SOURCES.md">Source trace</a> · <a href="ARCHIFY_LICENSE.txt">Archify licence</a></p></footer>
</main></body></html>
'''.encode()


def sha(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true', help='Compare the guide in memory; no writes')
    mode.add_argument('--output-dir', type=Path, help='New output directory, outside this bundle')
    parser.add_argument('--archify', type=Path, help='Pinned Archify directory containing bin/archify.mjs')
    args = parser.parse_args()
    if args.check and args.archify:
        parser.error('--archify requires --output-dir')
    try:
        data = json.loads((ROOT / 'portfolio-guide.json').read_text())
        guide = render_guide(data)
        report = {'purpose':'Reproduce this explanatory guide and diagram, not the research or source truth',
                  'guide_sha256':sha(guide),'guide_matches':guide == (ROOT / 'portfolio-map.html').read_bytes(),
                  'diagram':'not_run'}
        if args.output_dir:
            dest = args.output_dir.resolve()
            if args.output_dir.is_symlink() or dest.exists() or dest.is_relative_to(ROOT):
                raise ValueError('Choose a new output directory outside the bundle')
            renderer = args.archify.resolve() / 'bin/archify.mjs' if args.archify else None
            if renderer and not renderer.is_file():
                raise ValueError('Archify renderer not found')
            dest.mkdir()
            (dest / 'portfolio-map.html').write_bytes(guide)
            if renderer:
                output = dest / 'portfolio-research-architecture.html'
                result = subprocess.run(['node',str(renderer),'deliver','workflow',
                    str(ROOT / 'portfolio-research-architecture.json'),str(output),'--quality','showcase','--json'],
                    env=dict(os.environ,ARCHIFY_UPDATE_CHECK_DISABLED='1'),
                    text=True,capture_output=True,timeout=60)
                if result.returncode:
                    raise RuntimeError(result.stderr or result.stdout)
                receipt = json.loads(result.stdout)
                if not receipt.get('ok') or not output.is_file():
                    raise RuntimeError('Renderer did not confirm delivery')
                report['diagram'] = {'sha256':sha(output.read_bytes()),
                    'matches':output.read_bytes() == (ROOT / 'portfolio-research-architecture.html').read_bytes()}
        print(json.dumps(report,indent=2))
        return 0 if report['guide_matches'] and (report['diagram']=='not_run' or report['diagram']['matches']) else 1
    except (ValueError, OSError, RuntimeError, KeyError, TypeError, subprocess.TimeoutExpired) as error:
        print(json.dumps({'status':'failed','error':str(error)}),file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
