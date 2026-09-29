# OpenShell landing page

A self-contained marketing / project page for OpenShell, including an interactive
recreation of the system architecture diagram.

## Run it

No build step and no dependencies. Open `index.html` directly, or serve the folder:

```shell
cd website
python -m http.server 8777
# then open http://localhost:8777
```

Serving over `http://localhost` is recommended so the clipboard "Copy" button on the
install command works (it requires a secure context).

## Files

| Path | Purpose |
|---|---|
| `index.html` | Page structure: hero, pillars, architecture, components, SDKs, footer |
| `styles.css` | NVIDIA-flavoured dark theme, diagram styling, responsive layout |
| `js/data.js` | Single source of truth: diagram nodes, the eight components, SDKs, pillars |
| `js/architecture.js` | Builds the interactive SVG diagram (component) |
| `js/main.js` | Renders cards, wires the detail panel, nav, reveal animations |
| `assets/nvidia-logo.png` | NVIDIA logo (trademark of NVIDIA Corporation) |
| `assets/favicon.svg` | OpenShell mark used as the favicon |
| `tools/render-frame.html` | Headless render target used to rasterize the diagram |
| `tools/make-gif.py` | Generates the README's animated architecture GIF |

## Editing content

- **Copy for the eight components, diagram nodes, SDKs, and pillars** lives in
  `js/data.js`. Nothing else needs to change to update the text.
- **The auto-play tour order** is the `tour` array in `js/data.js` — a list of node ids.
  Edit it to change the narrative; the step duration is `STEP_MS` in `js/main.js`.
- Every clickable piece of the diagram is a `<g class="arch-node" data-node="<id>">`
  whose `data-node` matches a key in `OS_DATA.nodes`. Component cards reference
  diagram nodes through their `nodes` array, which drives the highlight behaviour.
- The diagram is a faithful, code-driven redraw of `../openshell-system-architecture.svg`.
  Coordinates live in `js/architecture.js`.

## Auto-play tour

The diagram can step through the architecture on its own:

- It starts automatically the first time the architecture section scrolls into view,
  then advances one node every `STEP_MS`, highlighting the node and updating the panel.
- The **Auto-play / Pause** button toggles it; a step counter and a thin progress bar
  show where the tour is.
- The tour **pauses permanently** when the visitor takes over: clicking a node, a
  component card, a related chip, `Reset`, or pressing `Escape`.
- It pauses and resumes automatically when the section leaves or re-enters the viewport,
  and when the browser tab is hidden.
- It never auto-starts for visitors with `prefers-reduced-motion: reduce` (they can still
  start it manually).

## Architecture GIF

The animation embedded in the repository README is generated from this same diagram, so the
two never drift apart:

```shell
python website/tools/make-gif.py
# -> docs/images/openshell-system-architecture.gif
```

The script renders one frame per auto-play step with headless Chrome, then encodes the frames
with Pillow using delta (transparent) frames — roughly 250 KB instead of 1.5 MB, with no
visible difference. It finishes by decoding the GIF and asserting every frame matches what was
encoded. Requires Pillow and Chrome or Edge; no other dependencies.

Flags: `--width`, `--colors`, `--step-ms`, `--neutral-ms`, `--scale`, `--no-delta`, and
`--keep-frames` to keep the intermediate PNGs for inspection.

## Notes

- Classic scripts (no ES modules) so the page also works when opened from `file://`.
- Respects `prefers-reduced-motion` and is keyboard accessible: diagram nodes are
  focusable and respond to `Enter` / `Space`.
- Update the architecture diagram here when the upstream SVG changes.
