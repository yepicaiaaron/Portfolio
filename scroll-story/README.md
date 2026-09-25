# The Making Of - scroll story

A re-imagining of the portfolio as a layered paper cut-out scroll story.

- `index.html` - the whole page (HTML, CSS and JS inline; GSAP 3 and ScrollTrigger from cdnjs).
- `a/` - web assets: skies, chapter scene layers (keyed on magenta), sprites, props, the intro camera move as a JPEG frame sequence (`a/turn/`), and copies of real site images and client logos (`a/site/`).
- `src/` - full-size generated sources, the style bible and concept frames. Not loaded by the page.

## How it flows
1. The existing intro: a dense digit portrait dissolves into the photoreal cinema shot, then the camera turns to the screen (frames drawn to a canvas by scroll).
2. The screen develops: digits, then a pencil sketch, then paper, then detailed paper.
3. The camera pushes through the screen and the paper story takes over: ten chapters, one interaction and at most one number each.

## Run locally
Serve the folder with any static server, for example `python3 -m http.server` inside `scroll-story/`, then open http://localhost:8000.

All figures come from the existing site copy and its sources (OVHcloud case study, Yepic, Product Hunt, University of Essex). Paper illustrations are AI-generated artwork, not photographs of events.
