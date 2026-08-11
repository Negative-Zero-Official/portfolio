# Prahlad Gaitonde — Portfolio

Personal portfolio site, built with [Eleventy](https://www.11ty.dev/) so that
adding a project, editing a bio line, or nudging a skill bar never requires
touching HTML.

**Live structure:** Markdown files + small data files are the content.
Eleventy reads them and generates the static site in `_site/`, which is what
actually gets deployed.

---

## Editing content (the part you'll do most often)

Everything you're likely to change lives in `src/`, split by type:

| What you want to change                     | Where to edit it                                  |
|-----------------------------------------------|-----------------------------------------------------|
| Add / remove / edit a **project card**        | `src/projects/*.md` — one file per project           |
| Add / remove / edit a **job / experience card**| `src/experience/*.md` — one file per job              |
| **Skill sliders** (bars, %, labels)           | `src/_data/skills.js`                                 |
| **Education timeline**                        | `src/_data/education.json`                            |
| **Achievements list**                         | `src/_data/achievements.json`                          |
| Hero text, bio, contact links, email/phone     | `src/_data/site.json`                                  |
| Profile photo                                 | `src/assets/img/photo.jpg` (replace the file, keep the name) |

### Adding a new project

1. Duplicate any file in `src/projects/`, e.g. copy `dlss-analysis.md` to
   `my-new-project.md`.
2. Edit the front matter at the top (between the `---` lines):

   ```yaml
   title: "My New Project"
   statusLabel: "Open Source"      # text shown in the pill
   statusClass: "oss"              # "published" (teal) · "oss" (gold) · "analysis" (grey)
   tags: ["Python", "Computer Vision"]   # chips under the description, or [] for none
   link: "https://github.com/you/repo"   # leave "" to hide the link
   linkLabel: "View on GitHub"
   featured: false                 # true = full-width card
   order: 8                        # controls display order, lowest first
   ```
3. Write the description as normal text below the second `---`.
4. Commit and push — the site rebuilds automatically (see **Deployment** below).

A full cheat sheet also lives in `src/projects/_HOW_TO_ADD_A_PROJECT.md`
(it's excluded from the build, so it's just there for reference).

### Adding a new job

Same idea, in `src/experience/`. See `src/experience/_HOW_TO_ADD_A_JOB.md`
for the field reference.

### Editing the skill bars

Open `src/_data/skills.js` — it's a plain JavaScript file with comments
explaining each field (`name`, `level` 0–100, `tag` label). Two panels
("Programming" and "Content Development") exist by default; you can add a
third and it'll wrap onto its own row automatically.

### Editing hero text, bio, or contact links

Open `src/_data/site.json`. Notable fields:

- `heroHeadline` — the three pieces of the big hero title
- `heroLede` — the paragraph under it (`**text**` renders bold)
- `about.paragraphs` — the "About" section's body text
- `about.facts` — the key/value panel next to your photo
- `links` — LinkedIn / GitHub / old portfolio URLs
- `email`, `phone`, `location`

---

## Running it locally

You'll need [Node.js](https://nodejs.org/) 18+ installed.

```bash
npm install       # first time only
npm start         # builds the site and serves it at http://localhost:8080
                   # with live-reload — leave it running while you edit
```

To just build without serving:

```bash
npm run build     # outputs the static site to _site/
```

---

## Deployment (GitHub Pages)

This repo includes `.github/workflows/deploy.yml`, which automatically
rebuilds and redeploys the site to GitHub Pages every time you push to
`main`. One-time setup after you push this repo to GitHub:

1. Go to your repo's **Settings → Pages**.
2. Under "Build and deployment", set **Source** to **GitHub Actions**.
3. Push to `main` (or re-run the workflow from the **Actions** tab).
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`
   (or at the domain root if this repo is named `<your-username>.github.io`).

No manual build step is needed after that — every push rebuilds the live
site from whatever's in `src/`.

---

## Project structure

```
src/
├── _data/                 ← site-wide content (JSON/JS)
│   ├── site.json           → name, hero text, bio, contact links
│   ├── skills.js            → skill panels & progress bars
│   ├── education.json       → education timeline
│   └── achievements.json    → achievements grid
├── _includes/
│   ├── layouts/base.njk     → HTML shell (head, nav, footer, scripts)
│   └── partials/            → one file per page section
├── projects/               ← one markdown file per project card
├── experience/             ← one markdown file per job card
├── assets/
│   ├── css/style.css
│   ├── js/main.js           → waveform canvas, scroll reveal, mobile menu
│   └── img/photo.jpg
└── index.njk               ← assembles the page from the partials above

.eleventy.js                ← Eleventy config (collections, markdown filters)
.github/workflows/deploy.yml ← builds + deploys to GitHub Pages on push
```

You should not need to edit anything in `_includes/` or `.eleventy.js` for
routine content updates — those only need to change if you want to
restructure the page itself (add a new section, change the layout, etc.).
