# Jesse L. portfolio site — working notes

Static site served by GitHub Pages (custom domain in `CNAME`). No build step.

## Work page (`work.html`)

- The index is a cover slider: one cover per series. Each series opens on its
  own at `work.html#<slug>` (hash routing in `site.js`).
- **Newest series first.** A newly added series always goes to the top: first
  cover in the slider and first `<article class="story">`. Everything else
  shifts down one. Angel Studio is currently the oldest, so it is last; Gabe & Jesse 2026/08 (N°06) is the newest.
- Numbers count up from the oldest: Angel Studio is `N°01`, the newest series
  (first cover) has the highest number. After adding or reordering, renumber
  the kickers on both the covers and the stories, and re-alternate
  `story--flip` (1st story normal, 2nd flipped, …).
- A cover has no image of its own: `site.js` copies the series' lead photo
  (`.story-lead img`) into it, so the lead photo *is* the cover.
- Each series is a Kinfolk-style feature: lead photo + title, then plates on a
  12-column grid (`plate-pair`, `plate-solo`, `plate-wide` for landscape).
  One feature can hold several chapters (see Angel Studio: Series I/II/III).
- KLFW × L'Oréal and ISMC stay below the slider (`.credits`).
- Titles and credits are also in `content.json` (`work.series.N`), which
  overrides the HTML text at runtime; update both.

## Photos

- Embedded as base64 JPEG in the HTML (site convention).
- Resize to 1600px tall before embedding; never crop.

## Films

- A series can open with a short film (`.story-reel`, see Restraint): muted
  loop that plays only while its series is open; clicking goes to the
  original Instagram post.
- Files live next to the pages: `<name>.mp4` (H.264, no audio, faststart)
  plus `<name>.webm` (VP9) fallback and a `<name>.jpg` poster.

## Publishing

- Build changes on a branch, send screenshots, and merge to `main` only after
  the owner says to go live (`main` is the live site).
