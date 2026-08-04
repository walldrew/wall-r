# SKILL.md — wall-r Website

Repo: `walldrew/wall-r` · GitHub: https://github.com/walldrew/wall-r
Cloudinary: `ufn3pxdn`
Netlify: auto-deploy on push to `main`

---

## Architecture

- **Stack:** Static HTML + vanilla JS + Cloudinary CDN assets
- **Wireframe tool:** `wireframe.html` — interactive reference map with section codes (e.g. `GAL-MED`, `IDX-HERO`, `TEC-PHRO`)
- **Shared components:** `div.u-head` (utility bar), `header.m-head` (nav), `footer` — identical across all pages
- **Design system:** `assets/style.css` — design tokens in `:root`, hero/card/grid/dark-section patterns
- **Motion:** `assets/site.js` — reveal-on-scroll, print-progress bar, hero canvas animation, section dividers
- **Backup strategy:** git tag `backup-pre-changes-YYYYMMDD` + branch `backup-YYYYMMDD` before major changes

---

## Hero Layering Effect (IDX-HERO / TEC-PHRO)

### What it is
A Canvas2D bead animation layered over a fullscreen autoplay video. Simulates 3D printing: horizontal bead rows lay down bottom-up, each starting left-to-right with a slight wave wobble. Fades in on load via `.hero-canvas.on { opacity:1 }`.

### HTML structure (index.html IDX-HERO — canonical source)
```html
<section class="hero" id="top" style="position:relative;overflow:hidden">
  <!-- Video background -->
  <video autoplay muted loop playsinline aria-hidden="true"
    style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.5;z-index:0;pointer-events:none">
    <source src="https://res.cloudinary.com/ufn3pxdn/video/upload/v1783193745/02_-__Presskit_for_pitch_m2zhrc.mp4" type="video/mp4">
  </video>
  <!-- Canvas mount point -->
  <div class="hero-canvas" id="printfield" aria-hidden="true" style="z-index:1"></div>
  <!-- Content -->
  <div class="wrap hero-inner" style="position:relative;z-index:2">
    ...
  </div>
</section>
```

### CSS (assets/style.css)
```css
.hero { padding:0; min-height:88vh; display:flex; align-items:center; overflow:hidden; }
.hero-canvas { position:absolute; inset:0; z-index:0; opacity:0; transition:opacity 1.6s ease; }
.hero-canvas.on { opacity:1; }
.hero-canvas canvas { width:100%; height:100%; }
.hero-inner { position:relative; z-index:1; width:100%; padding:120px 0 90px; }
```

### JS animation logic (assets/site.js — "printfield" section)
- Host: `#printfield` div (or `#tec-printfield` on technology page)
- Creates a `<canvas>`, sizes to host via `getBoundingClientRect`
- Builds `rows[]` array: `y` positions from bottom upward, spaced 16px
- Each row animates left→right over 1.4s, offset by `i * 0.22s`
- Bead: `strokeStyle rgba(110,99,87,alpha)`, `lineWidth:7`, `lineCap:round`
- Wobble: `Math.sin(x * 0.012 + i * 0.9) * 2.2` pixels vertical
- `IntersectionObserver` starts/stops RAF; `visibilitychange` pauses when tab hidden
- Respects `prefers-reduced-motion`

### Technology page implementation (TEC-PHRO)
Inline `<script>` block at bottom of tech hero section (after the `</section>` tag).
Same logic, bound to `#tec-printfield`. Uses video `v1783193721` (close-up nozzle). Min-height: `70vh`.

---

## Change Log

### 2026-08-04 — Session 1, revision 2 (HAL)

**Backup:** `git tag backup-pre-changes-20260804` · branch `backup-20260804`
Restore: `git checkout backup-20260804` or `git checkout backup-pre-changes-20260804 -- <file>`

#### 1. Gallery — Delete video "Wall printing precision, various colors" (`GAL-MED-VID3`)
- **File:** `gallery.html`
- **Removed:** Third video block in Videos section — `<div class="reveal">...</div>` wrapping `video-item` + `video-caption`
- **Source:** `https://res.cloudinary.com/ufn3pxdn/video/upload/v1783193721/09_-_WhatsApp_Video_2026-06-14_at_14.21.57_prfhig.mp4`
- **Caption removed:** "Wall printing precision, various colors — Close-up of the nozzle..."
- **Restore:** `git checkout backup-pre-changes-20260804 -- gallery.html` (then manually re-add if other changes needed)
- **Note:** This same video src is still used as the sidebar video on `technology.html` (inline player, not deleted)

#### 2. Gallery — Delete image GAL-MED-IMG8 (Printer Characteristics)
- **File:** `gallery.html`
- **Removed:** 4th item in "Printer" gallery-section grid
- **Image URL:** `https://res.cloudinary.com/ufn3pxdn/image/upload/f_auto,q_auto/v1783194136/Screenshot_2025-08-13_145813_afpi55.png`
- **Alt/caption:** "Printer Characteristics — Technical overview of the system's print area, speed, and material throughput capabilities"
- **Restore:** Add back as `<div class="gallery-item reveal" data-src="...">` with `<img>` + `.gallery-caption` inside the Printer `.gallery-grid`

#### 3. Technology page — Layering Effect added to existing page-hero (no structural change)
- **File:** `technology.html`
- **Original hero preserved:** `section.page-hero` with all text and SVG blueprint art intact
- **Added:** `<div class="hero-canvas" id="tec-printfield">` as absolute-positioned canvas overlay (z-index:0) inside the existing section
  - Section gets `position:relative;overflow:hidden`
  - Canvas: same bead algorithm as IDX `#printfield` — rows build bottom-up, left-to-right, 16px gap, wave wobble, `rgba(110,99,87,alpha)` strokes
  - Inline `<script>` block placed after `</section>` tag
  - **No video added** — canvas only, on top of existing SVG art
  - Content `.wrap` gets `position:relative;z-index:1` so text stays above canvas

#### 4. Home page — Layering Effect removed, video kept
- **File:** `index.html`
- **Removed:** `<div class="hero-canvas" id="printfield" aria-hidden="true" style="z-index:1">` only
- **Kept:** Video background, all hero text, stat chips, buttons — untouched
- **Note:** The `printfield` JS in `assets/site.js` remains — it will find no `#printfield` element and exit cleanly (guarded by `if(host...)`)

---

## Pending / Open

- [ ] Home page video background still in use (`v1783193745`) — different clip from tech page
- [ ] Cloudinary Cloudinary account `ufn3pxdn` — all media hosted here
- [ ] Wireframe `wireframe.html` section codes reference the old page structure for TEC-PHRO — update if wireframe is regenerated
