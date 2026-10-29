# Performance investigation

Reviewed the application entry point, both canvas/scene components, sound code, the complete stylesheet, package configuration, HTML, and public media references. The active page is `src/main.jsx`; `ArcaneScene.jsx` and `sound.js` are not imported. Three.js, Lenis, and Framer Motion are therefore not responsible for this page's runtime lag.

## Causes and changes

- **Large image downloads:** the PNGs referenced by the page and its background totaled 23.72 MB. Lossless WebP equivalents total 12.02 MB, saving 11.69 MB (49%). Conversion checks verify identical dimensions, alpha, and every visible pixel. Original PNGs remain available.
- **Layout during every idle frame:** offscreen SVG stroke-width and glow animations kept the browser busy even while the hero or intro was visible. Sections now pause their animations when offscreen and resume within 200 px of the viewport. The animations themselves and all styling remain intact.
- **Repeated scroll measurements:** the envelope guide queried and measured many sections on every scroll event. It now batches updates into animation frames and caches document positions. ResizeObserver invalidates those positions when images, fonts, FAQ content, or section sizes change. The owl still follows the animated crest using its live position.
- **Work behind the intro:** the particle canvas and envelope loop ran underneath the opaque cinematic overlay. They now start when the crossfade starts. Both loops stop while the document is hidden.
- **Repeated particle blurs:** each particle used a fresh shadow blur every frame. Glows are now drawn once into a shared sprite atlas and reused. Particle counts, colors, motion, and mouse interaction remain.
- **Audio resource accumulation:** each FAQ, vault, and invitation click created a new AudioContext that was never closed. Effects now share one context and disconnect completed nodes. Timers and the intro's frame callback are cleaned up. Music downloads on interaction, and campus photos load lazily with lower priority so they do not compete with the hero and intro.

## Verification

Chrome, 1440×900 desktop and 390×844 mobile viewports. Values below compare the original application with the optimized application in the same local browser setup; these are work counts, not an FPS or Lighthouse score.

| Check | Original | Optimized |
| --- | ---: | ---: |
| Desktop scroll layout reads, 60 scroll steps | 1,125 | 63 |
| Mobile scroll layout reads, 60 scroll steps | 1,124 | 62 |
| Idle hero layout passes, two seconds | about 240 | 0 |
| Hidden envelope layout reads during intro | over 220 | 0 |

All section widths and heights match the original at both viewports. Frozen hero screenshot comparisons differ by at most 1/255 in a small number of color channels after browser image decoding. Particle randomness and animation timing are excluded from the screenshot comparison.

A separate synthetic canvas check, drawing 300 frames at 1440×900 with the original and optimized particle loops, took 193.6 ms and 47.7 ms respectively. This isolates the blur optimization; it is not the frame rate of the complete page.

Browser checks cover intro skip and cinematic entry, mobile navigation, FAQ opening/closing, vault feedback, invitation audio, one shared audio context, music play/pause, and particle suspension when hidden. The production build passes.

`tests/performance.cjs` requires Playwright and Chrome. Run `npm run build`, then `node tests/performance.cjs --production`. Set `NODE_PATH` to an existing Playwright installation if it is not installed locally. Optional `--baseline` saves comparison measurements and screenshots in the system temporary directory. Tests compare section geometry when that baseline exists.

`scripts/optimize-images.cjs` requires Sharp and regenerates and verifies the lossless assets without removing originals. These tools were available from the workspace runtime; no application dependencies were added.

## Limits

No deployment, physical-phone profiling, Safari testing, or slow-network testing was performed. The original cinematic video, music, fonts, shadows, and visual effects are retained; low-end hardware and slow connections can still affect loading and rendering. Browser CPU timing varied between runs, so no overall speedup percentage is claimed.
