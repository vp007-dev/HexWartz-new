# Performance investigation

## Video picture fidelity

The supplied file, public copy and production copy have matching SHA-256 hashes, confirming that the site does not recompress the video. A page-level vignette nevertheless darkened the picture (up to 78% at the corners), and the exit fade added a 1.08 CSS scale. Those effects and permanent transform promotion were removed. Native full-screen cover fitting and natural clip completion remain.

`tests/video-quality.cjs` compares a paused on-page frame with the same decoded frame drawn directly to a reference canvas at 1920×1080. In a 1200×650 region clear of controls, mean absolute color-channel difference fell from 7.0056/255 before the fix to 0.2116/255 after it. The residual difference is consistent with rendering/resampling rounding; the test allows a difference below 2/255 and checks that no filter or parent transform is applied. This is a picture-fidelity check, not an FPS improvement or an increase in source resolution. The source remains 1280×720.

## Enter button and responsive fixes

The old low-resolution Enter artwork and multiple animated glow/shadow layers are replaced by one verified transparent 720×240 lossless WebP (125248 bytes). No CSS filter or floating animation is applied to the control. Simplified intro spacing prevents clipping on short landscape screens; Enter and skip targets are at least 44px high. The header menu now collapses by 1200px, the tournament telemetry changes to two columns by 1100px, and the tablet candle placement clears the hero actions.

`tests/responsive.cjs` verifies intro control bounds, no image/button filters, menu fit, content clipping, and horizontal overflow at 320×568, 360×740, 390×844, 768×1024, 900×700, 960×768, 1024×768, 1280×720, 1920×1080, and 844×390. These viewport checks and the existing production interaction/performance tests pass. The earlier desktop/mobile information-section geometry also remains intact. No physical-device or Safari testing was performed.

## Replacement intro video and screen fill

The user-provided G:/watermark-removed-gemini_generated_video_f933aace.mp4 is copied unchanged to public/video/hexwartz-intro.mp4 and is now the active source. SHA-256 hashes match. The user requested edge-to-edge playback, so object-fit: cover now fills desktop as well as mobile viewports; this intentionally supersedes the earlier contain framing and may crop edges on nonmatching screen shapes. The clip still plays until its natural ended event.

## Intro video playback fix

The 10.005-second, 1280×720 source played successfully in desktop Chrome during inspection, but the application began fading it out at 5.8 seconds. The time-polling animation loop has been removed: the site now reveals on the video ended event or explicit skip, with media errors falling back to the site. Desktop framing uses an explicit viewport-sized box with object-fit: contain, avoiding cropping on 4:3 and ultrawide windows; mobile retains cover framing. The playing skip-button wrapper no longer applies a second top/right offset. `tests/intro-video.cjs` verifies real playback beyond 6.4 seconds, natural completion, framing and control placement at 1920×1080, 1366×768, 1024×768, and 390×844.

## Transparent section illustrations

The house, codex, and prize headings now use three coordinated transparent illustrations totaling 230,774 bytes. They are static, lazy-loaded, lossless WebP cutouts at up to 384px resolution, with alpha verified from 0 to 255. Explicit image boxes reserve 160px including margin on desktop and 128px on phones, preventing layout shift as images load. Browser geometry checks account only for this deliberate extra space and verify that the art does not overlap headings or produce horizontal scrolling. No dependencies or animation loops were added.

## Cinematic scroll sequence

The venue now contains a three-chapter sticky sequence with scroll-linked image zooms and crossfades. Chapter navigation and a house-section shortcut preserve direct navigation. Scrolling remains native; the component runs no idle animation loop. Geometry is cached with ResizeObserver, and scroll updates are coalesced with requestAnimationFrame only while the scene is near the viewport.

The new castle (210,112 bytes), Great Hall (167,298 bytes), and resized campus-night (134,960 bytes) assets total 512,370 bytes. The night scene replaces the previous 3,946,834-byte image request. The castle file is reused by the hero background. The information sections retain their dimensions; the venue intentionally has more scroll space. Reduced motion removes image zooms and uses direct scene changes.

Browser regression checks now cover all three chapters, image loading, scroll-dependent zoom, chapter buttons, the house shortcut, no horizontal overflow, and reduced motion, alongside the existing navigation, audio, FAQ and performance checks.

## Wizarding atmosphere refinement

The later visual refinement replaces `LumosCanvas.jsx` entirely with `EnchantedAtmosphere.jsx`: 14 sparse gold motes use only CSS transform/opacity animation. There is no particle JavaScript animation loop or full-screen canvas. The owl guide retains its separate animation and scroll caching.

The 2.89 MB background image is no longer requested. Midnight CSS backgrounds replace it, and a 41.6 KB transparent candle asset adds a Great Hall detail. Existing transparent crest and character artwork are retained. Crest rings are now static, button glows are softer, keyboard focus is visible on the intro and music controls, and the registration link retains readable contrast on hover. Reduced motion disables the new dust and candle movement.

The initial measurements and canvas microbenchmark below describe the first performance pass. The browser checks have been updated for the CSS atmosphere, no background-image request, mobile decoration clearance, hover contrast, and reduced motion. The exact section geometry remains a regression check.

## Initial performance pass

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

No deployment, physical-phone profiling, or Safari testing was performed. The original cinematic video, music, fonts, shadows, and visual effects are retained; low-end hardware can still affect rendering. Browser CPU timing varied between runs, so no overall speedup percentage is claimed.

## Intro playback buffering fix

At approximately 1.5 Mbps, immediate playback reproduced four buffering waits; after 16 seconds the video had reached only 1.63 seconds. Native `preload="auto"` also stopped early in a separate Chrome run, buffering only 7.411 seconds of the 10.005-second clip. Waiting for a full native buffered range alone therefore could leave the Enter control waiting indefinitely.

Download the original clip once into a Blob before playback. The existing Enter button shows a preparation message if clicked before download and decoding are ready; Skip remains available. A lossless WebP of the exact first frame serves as the loading poster. Mount the underlying page at the reveal, so hidden artwork and animations do not compete with the intro. Abort pending downloads and revoke the local video URL when the intro is removed. This deliberately buffers the short 4.7 MB clip; longer videos would need a different loading strategy.

The supplied file, public copy, production copy, and actual browser playback bytes have SHA-256 `4F25DA8021A1CF3E9E9267A1CE44C4496BD87BF66826AC8BF2323A423B28B0F6`. No resolution, bitrate, codec, frame-rate, or image-filter changes were made. Source resolution remains 1280×720.

`tests/intro-buffering.cjs` checks a 190,000-byte/sec connection with four-times CPU throttling, download reuse, Skip during buffering, download failure, and URL cleanup. Its video-focused run excludes the independent soundtrack and external fonts: all 240 frames played, with zero dropped frames and zero buffering waits after starting. `tests/intro-video.cjs` verifies exact playback byte identity, full-screen framing, and natural completion across five desktop/mobile viewports. `tests/video-quality.cjs` compares the displayed frame with the decoded frame; average channel difference was 0.205/255. Production interaction/performance checks and responsive layout checks also pass. These are Chrome automation results, not measurements on physical phones or Safari.
