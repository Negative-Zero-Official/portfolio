# Prahlad Gaitonde — Portfolio

Personal portfolio site, built with [Eleventy](https://www.11ty.dev/) and a
WebGL particle sculpture (three.js). The visual theme is based on Santiago
Ramón y Cajal's ink drawings of neurons. As you scroll, a biological neuron
turns into a cortical column, then a multilayer perceptron, then self-attention,
then an embedding space. Hovering a project morphs the sculpture into that
project's own shape.

All content is Markdown and small data files, so adding a project or job
never requires touching HTML or JavaScript.

---

## Editing content

Everything you're likely to change lives in `src/`:

| What you want to change                  | Where to edit it                                             |
|------------------------------------------|--------------------------------------------------------------|
| Add / remove / edit a **project**        | `src/projects/*.md`, one file per project (each gets its own page) |
| Small repos in the **"Other builds"** list | `src/projects/other-builds.md` → `items:`                    |
| Add / remove / edit a **job**            | `src/experience/*.md`, one file per job                      |
| **Toolkit** (skills lists)               | `src/_data/skills.js`                                        |
| **Education**                            | `src/_data/education.json`                                   |
| **Recognition** list                     | `src/_data/achievements.json`                                |
| Hero text, bio, facts, contact, links    | `src/_data/site.json`                                        |
| Figure captions for each scroll scene    | `src/_data/site.json` → `scenes`                             |
| Profile photo                            | `src/assets/img/photo.jpg` (replace the file, keep the name) |

### Adding a new project

1. Copy any file in `src/projects/`, e.g. `wave-ai.md` → `my-new-project.md`.
   The file name becomes the URL: `/projects/my-new-project/`.
2. Edit the front matter:

   ```yaml
   title: "My New Project"
   subtitle: "One-line descriptor for the project page"
   summary: "One or two sentences for the home page index."
   status: "Open source"          # any text
   year: "2026"
   shape: "graph"                 # what the sculpture morphs into (see below)
   tags: ["Python", "PyTorch"]
   links:
     - { label: "View on GitHub", url: "https://github.com/you/repo" }
   order: 11                      # position in the index, lowest first
   ```
3. Write the project write-up as normal Markdown below the second `---`.
4. Commit and push. The site rebuilds automatically.

**Shapes:** `neuron`, `column`, `mlp`, `attention`, `embedding`, `waveform`,
`galaxy`, `wavefield`, `graph`, `sentences`, `lattice`, `pages`. An unknown
or missing shape falls back to `embedding`, so a typo never breaks anything.
The full cheat sheet is in `src/projects/_HOW_TO_ADD_A_PROJECT.md`.

### Adding a new job

Same idea, in `src/experience/`. See `src/experience/_HOW_TO_ADD_A_JOB.md`.

---

## Running it locally

```bash
npm install
npm start         # builds and serves at http://localhost:8080 with live reload
npm run build     # outputs the static site to _site/
```

The JavaScript is bundled by esbuild as part of every Eleventy build (see
`.eleventy.js`), so there's no separate JS build step.

---

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` rebuilds and redeploys the site every time you
push to `main`. In the repo's **Settings → Pages**, set **Source** to
**GitHub Actions**. The workflow sets `PATH_PREFIX` automatically, so links
work under `https://<user>.github.io/<repo>/`.

---

## Project structure

```
src/
├── _data/                     ← site-wide content (JSON/JS)
├── _includes/
│   ├── layouts/base.njk        → HTML shell: canvas, loader, nav, footer
│   ├── layouts/project.njk     → project detail page
│   └── partials/               → one file per home-page section
├── projects/                   ← one markdown file per project
├── experience/                 ← one markdown file per job
├── assets/
│   ├── css/style.css
│   ├── img/                    → photo + static neuron fallback (no-WebGL)
│   └── js/
│       ├── app.js              → entry: device detection, loader, boot
│       ├── director.js         → scroll scenes, hovers, page transitions
│       ├── scene/stage.js      → three.js renderer + particle morphing
│       ├── scene/shaders.js    → particle vertex/fragment shaders
│       ├── scene/shapes/       → one generator per shape (+ registry)
│       └── ui/                 → text decode, reveal, custom cursor
└── index.njk                   ← assembles the home page from the partials

.eleventy.js                    ← Eleventy config, esbuild bundling, cache busting
```

Accessibility and fallbacks: all content is plain HTML and readable without
JavaScript. Reduced-motion users get a static sculpture with no smooth scroll.
Devices without WebGL get a static neuron illustration. Phones run a lighter
particle count with tap-to-preview on projects.
