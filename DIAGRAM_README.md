# Sovereign Watch workflow diagram

Purpose: explain how Sovereign Watch automates source intake and assessment, preserves evidence, and publishes candidates for human inspection.

Open `sovereign-watch-workflow-v4.html` in a browser. Select a node for its details, or choose the source-to-candidate and recovery views. The supplied page needs no external scripts, model or server. Public links in the source trace need an internet connection.

`SOURCE_TRACE.md` links the diagram to a frozen code revision and records the machine-assessment and human-review boundary.

## Rebuild

Use Node.js and Python 3 with Archify revision `9e35d2b0b39b155553ba9fcfe0b4f2a5198dd993` from https://github.com/tt-a1i/archify. Pass the checkout's `archify` subdirectory to the command below. The renderer is MIT-licensed; retain `ARCHIFY_LICENSE.txt` with the HTML. The helper downloads nothing and disables Archify's optional update check.

Run in your terminal:

```bash
python3 reproduce_diagram.py --archify /path/to/archify/archify --output /tmp/sw-workflow-rebuilt.html
```

Choose a new output filename if it already exists. A zero exit confirms that the generated HTML matches the supplied HTML. This rebuilds the diagram from the editable JSON. It does not run Sovereign Watch, audit alerts, reproduce the original research or certify the correctness of the depicted implementation.
