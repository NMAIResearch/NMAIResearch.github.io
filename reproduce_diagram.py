#!/usr/bin/env python3
"""Rebuild the SW explanatory diagram with the recorded Archify renderer."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archify', type=Path, required=True,
                        help='Archify skill directory containing bin/archify.mjs')
    parser.add_argument('--output', type=Path, required=True,
                        help='New output HTML file; existing files are refused')
    args = parser.parse_args()
    output = args.output.resolve()
    if output.exists() or args.output.is_symlink():
        parser.error('Output already exists; choose a new file.')
    if output.suffix != '.html' or not output.parent.is_dir():
        parser.error('Output needs an existing parent and an .html suffix.')
    root = Path(__file__).resolve().parent
    renderer = args.archify.resolve() / 'bin' / 'archify.mjs'
    spec = root / 'sovereign-watch-workflow-v4.json'
    if not renderer.is_file():
        parser.error('Archify renderer not found.')
    env = dict(os.environ, ARCHIFY_UPDATE_CHECK_DISABLED='1')
    result = subprocess.run(['node', str(renderer), 'deliver', 'workflow',
                             str(spec), str(output), '--quality', 'showcase', '--json'],
                            env=env, text=True, capture_output=True, timeout=60)
    if result.returncode:
        sys.stderr.write(result.stderr or result.stdout)
        return result.returncode
    receipt = json.loads(result.stdout)
    if not receipt.get('ok') or not output.is_file():
        raise RuntimeError('Renderer did not confirm delivery.')
    css = (root / 'house-diagram-palette.css').read_text(encoding='utf-8')
    rendered = output.read_text(encoding='utf-8')
    if rendered.count('</head>') != 1:
        raise RuntimeError('Expected one HTML head for the house palette')
    output.write_text(rendered.replace('</head>',
        '<style id="nmai-house-palette">\n' + css + '</style>\n</head>'), encoding='utf-8')
    expected = root / 'sovereign-watch-workflow-v4.html'
    match = hashlib.sha256(output.read_bytes()).digest() == hashlib.sha256(expected.read_bytes()).digest()
    print(json.dumps({'purpose':'Check rebuilt diagram bytes, not SW operation or alert correctness',
                      'output_sha256':hashlib.sha256(output.read_bytes()).hexdigest(),
                      'matches_supplied_html':match}, indent=2))
    return 0 if match else 1


if __name__ == '__main__':
    raise SystemExit(main())
