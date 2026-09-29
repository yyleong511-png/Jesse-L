# Jesse L. portfolio site — working notes

Static site served by GitHub Pages (custom domain in `CNAME`). No build step.

## Work page (`work.html`)

- The index is a cover slider: one cover per series. Each series opens on its
  own at `work.html#<slug>` (hash routing in `site.js`).
- **Newest series first.** A newly added series always goes to the top: first
  cover in the slider and first `<article class="story">`. Everything else
  shifts down one. Angel Studio is currently the oldest, so it is last; USCI Designer Student Piece (N°09) is the newest.
- Numbers count up from the oldest: Angel Studio is `N°01`, the newest series
  (first cover) has the highest number. After adding or reordering, renumber
  the kickers on both the covers and the stories, and re-alternate
  `story--flip` (1st story normal, 2nd flipped, …).
- A cover has no image of its own: `site.js` copies the series' lead photo
  (`.story-lead img`) into it, so the lead photo *is* the cover.
- Inside a series the header is text only (kicker, title, credits); photos
  follow in their own order, first row a size up (`.plate-row.plate-cover`,
  `plate-cover--land` for landscape). The slider cover is whichever figure
  carries `story-lead` — usually photo 01, but not always (Inti-messy: the
  landscape shot is 01, the cover is 02).
- Each series is a Kinfolk-style feature: lead photo + title, then plates on a
  12-column grid (`plate-pair`, `plate-solo`, `plate-wide` for landscape).
  One feature can hold several chapters (see Angel Studio: Series I/II/III).
- The index has three titled groups, each its own cover slider: **Print**
  (photo series), **Runway**, **Competition** (`.group-head` + `.covers`). A new
  runway show or competition goes first in its own slider, same as a photo
  series. Their stories are `.story--extra` (kicker shows the year, not N°),
  placed after the photo series; N° numbering applies to photo series only.
  Update the count in each `.group-head` label.
- Every series page ends with a WhatsApp CTA (`.series-contact`); `site.js`
  fills in the message with the open series' title. `@handles` inside
  `.series-credit` / `.story-note` are linked to Instagram by `site.js`, so
  write them as plain text.
- Titles and credits are also in `content.json` (`work.series.N`), which
  overrides the HTML text at runtime; update both.

## Photos

- Work photos are files in `images/work/<slug>-NN.jpg`, referenced with
  `loading="lazy"` so only what's on screen downloads (the page used to embed
  them as base64 and weighed 21MB). Add new photos the same way; never inline.
  About/More/Home still embed a few images inline.
- Resize to 1600px tall before embedding; never crop.
- **No duplicates.** The owner may resend a photo already on the site. Before
  adding, compare new photos against every photo on the page (downscaled
  pixel similarity, then check by eye). A match replaces the existing copy in
  place, keeping the higher-resolution file; never show the same shot twice.

## Films

- A series can open with a short film (`.story-reel`, see Restraint): muted
  loop that plays only while its series is open; clicking goes to the
  original Instagram post.
- Files live next to the pages: `<name>.mp4` (H.264, no audio, faststart)
  plus `<name>.webm` (VP9) fallback and a `<name>.jpg` poster.

- Home film: `hero.mp4` / `hero-wide.mp4`. Where video can't autoplay
  (Instagram/Facebook/TikTok in-app browsers, Low Power Mode, errors), `site.js`
  plays `hero-frames/{tall,wide}/NNN.jpg` (10 fps) on a canvas instead, like a
  GIF. A real HD GIF would be ~40MB, so don't use GIFs.

## Sharing

- Every page has Open Graph tags pointing at `og-image.jpg` (a frame of the
  home film, 1200×630). New pages need the same block.

## Publishing

- Build changes on a branch, send screenshots, and merge to `main` only after
  the owner says to go live (`main` is the live site).
