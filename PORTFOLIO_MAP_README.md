# Portfolio research map

Purpose: explain the research structure behind the portfolio and provide editable, reproducible presentation files.

Open [the guide](portfolio-map.html) or [the full diagram](portfolio-research-architecture.html). The homepage retains direct access to the SW case study and workflow. This is a map of the author-stated research approach, illustrated by linked project examples; it is not a new research result or a record that every project used the same software.

## Files

- `portfolio-guide.json`: stage explanations, project examples and destinations.
- `portfolio-research-architecture.json`: editable Archify workflow specification.
- `reproduce_portfolio.py`: offline guide generation and optional diagram reproduction.
- `portfolio-map.html`: the generated guide.
- `portfolio-research-architecture.html`: standalone Archify diagram, static by default.
- `PORTFOLIO_MAP_SOURCES.md`: evidence trace and boundaries.

## Reproduction

Python 3 standard library is sufficient to check the guide. Run in your terminal from this directory:

```bash
python3 -B reproduce_portfolio.py --check
```

To rebuild both files, use Node and the Archify `archify/` directory from commit `9e35d2b0b39b155553ba9fcfe0b4f2a5198dd993` of [tt-a1i/archify](https://github.com/tt-a1i/archify/tree/9e35d2b0b39b155553ba9fcfe0b4f2a5198dd993). Run in your terminal, replacing the renderer path and choosing a new output directory outside this bundle:

```bash
python3 -B reproduce_portfolio.py --archify /path/to/archify --output-dir ../rebuilt-portfolio-map
```

The helper downloads nothing, disables the renderer's update check and refuses an existing output directory. It reports whether rebuilt bytes match the supplied files. Without `--archify`, only the guide is rebuilt and diagram reproduction is reported as not run. The rebuilt guide expects the existing homepage and SW links when placed on the portfolio site; this helper does not rebuild those pages.

The check compares presentation bytes. It does not test source truth, method effectiveness, historical compliance with the process or the underlying research. A matching file is not an authenticity guarantee. Python 3.14.7 and Node v26.7.0 were used for the local check; other runtime versions were not tested.

## Attribution

OpenAI GPT-6 assisted the map and reproduction helper. OpenAI is a subject of the wider portfolio. The author supplies research direction and substantive decisions. Project-specific model contributions and limits remain in their own records. Archify is supplied under the accompanying MIT licence. Its structural checks do not verify the research claims.
