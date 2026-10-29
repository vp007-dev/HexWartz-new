# HexWartz visual direction

Preserve the existing two-column hero, house colors, typography, content, and interactions. Refine its wizarding identity with midnight ink, antique gold, and restrained enchanted details.

Use existing React components and CSS. The 21st catalog search for subtle celestial backgrounds informed the sparse star/dust direction; no catalog component was installed because the existing page needs only a small CSS effect. The CLI initialization was unavailable in this environment, so this context records the inspected project facts directly.

The ambient layer contains 14 decorative motes animated only through transform and opacity. Keep it out of the accessibility tree and disable motion for reduced-motion preferences. Retain offscreen animation suspension.

The original hero artwork already has an alpha channel. Use normal compositing to retain its dark details. Add a single optimized, transparent floating-candle image near the crest. Keep decorative images out of reading and focus order. Maintain the information sections' layout dimensions on desktop and mobile.

## Cinematic scrolling

The user's later direction expands the venue into a three-scene scroll journey: an imagined moonlit castle, the real Sharda campus in daylight, and the existing artistic campus night view. The 21st Zoom Parallax and Immersive Scroll Gallery catalog references informed this direction. The implementation reuses the project's React/CSS approach without adding a motion dependency.

Use a sticky stage below the navigation with native page scrolling, 390svh of scroll space on desktop and 340svh on phones. Images zoom from 1.02 to at most 1.24 and crossfade through scroll progress. Chapter buttons and a direct house link let visitors skip the sequence. Reduced motion removes zooming and replaces crossfades with direct scene changes. Update styles once per scroll frame only while near the viewport; cache document bounds and invalidate them on resize.

The castle also provides a quiet hero background. A separate Great Hall environment sits behind the house section with enough shading to preserve text contrast. The music controller moves clear of the chapter controls while the stage is pinned. Keep decorative imagery noninteractive, and mark inactive scenes hidden from assistive technology.

## Transparent section artwork

Use one matching realistic cutout above each major section heading: a weathered sorting hat for the houses, an open spellbook with a quill for the tournament codex, and an antique tournament goblet for prizes. Keep them static and free of enclosing cards or frames. The image area reserves 160px including spacing on desktop and 128px on phones; the remaining content layout stays unchanged. All three are decorative, lazy-loaded WebP images with real transparency, explicit dimensions, no pointer interaction, and no new animation.

User preference: preserve the original flying owl-post letter and its visible label throughout scrolling, including the cinematic sequence. Do not dock, hide, or replace it during future visual refinements. It follows the owl in the hero and flies between sections using the existing scroll path. Preserve its performance optimizations and reduced-motion behavior.

User correction: remove the moonlit castle image and its opening invitation scene, including its reuse behind the hero. Keep the remaining campus day/night scenes, transparent artwork, and flying letter. The campus sequence now uses 290svh on desktop and 260svh on phones. Do not reintroduce the castle artwork.

Intro playback: play the full source video through its natural ended event; do not cut it off at 5.8 seconds. Use the supplied replacement video at /video/hexwartz-intro.mp4 and fill desktop and mobile screens with object-fit: cover. The user prefers edge-to-edge filling over letterboxing; aspect-ratio differences may crop the image edges. Initial and playing skip controls share the same viewport offset. A media error should reveal the site instead of trapping the visitor in the intro.

## Enter button and responsive behavior

The Enter control uses the clean transparent parchment image at public/assets/intro/enter-button-transparent.webp (720×240, lossless WebP, 125248 bytes). Remove the previous dark background, CSS glow, filter shadows, sparkles and floating animation. Keep a semantic keyboard-accessible button and visible focus outline. The intro slot stays inside the viewport with simple bottom padding, including short landscape screens.

Show the menu toggle at widths up to 1200px so navigation labels do not crowd the header. Keep the open menu scrollable within the screen height. At widths up to 1100px, tournament telemetry uses two columns, then the existing phone breakpoint reduces it to one. Use minmax(0, 1fr) tracks and min-width: 0 to prevent clipped content. In the stacked hero at widths up to 960px, keep candle artwork within the crest area, clear of action buttons. Preserve the flying letter.

Video fidelity: preserve the supplied file bytes and decoded picture. Do not add a vignette, full-frame dimming layer, color filters, permanent transform promotion, or CSS scale during the intro fade. The video itself contains its cinematic lighting and zoom. Keep edge-to-edge object-fit: cover as requested. The current source is 1280×720, so larger displays necessarily enlarge it; do not claim recovered 1080p/4K detail without a higher-resolution source.

Intro buffering: download the unchanged short clip once before playback, using a local Blob URL. Preserve its first frame as the loading poster and show preparation text in the existing subtitle if Enter is pressed early. Keep Skip available. Defer the hidden main page until the reveal, then release the video download and local URL after the intro is removed. Do not trade away source quality to reduce loading time.
