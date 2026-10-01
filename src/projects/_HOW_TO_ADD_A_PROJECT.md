<!--
This file is ignored by the site (listed in .eleventyignore). Cheat sheet only.

HOW TO ADD A NEW PROJECT
────────────────────────
Every .md file in this folder becomes:
  • a row in the "Selected work" index on the home page, and
  • its own page at /projects/<file-name>/

1. Copy any other .md file in this folder and rename it, e.g.
   "my-new-project.md". The file name becomes the page URL.
2. Edit the front matter (between the --- lines):

   title     → project name (large serif heading)
   subtitle  → one-line descriptor shown under the title on its page
   summary   → one or two sentences shown under the title in the index
   status    → small label, e.g. "Open source", "Published · IEEE",
               "Research", "Live". Plain text, so write anything.
   year      → e.g. "2026". Leave "" to show a dash.
   shape     → what the particle sculpture morphs into when the project is
               hovered or opened. One of:
                 neuron · column · mlp · attention · embedding
                 waveform  (signals / EEG / time series)
                 galaxy    (astronomy, clusters)
                 wavefield (physics, simulation, fields)
                 graph     (graphs, recommenders, relations)
                 sentences (NLP, embeddings, retrieval)
                 lattice   (GPU, systems, hardware, grids)
                 pages     (docs, learning, writing)
               Anything else (or leaving it out) falls back to "embedding",
               so a typo never breaks the site.
   tags      → list shown as "Built with" on the project page,
               e.g. ["Python", "PyTorch"]. Use [] for none.
   links     → list of { label, url } shown on the project page, e.g.
                 links:
                   - { label: "View on GitHub", url: "https://github.com/..." }
                   - { label: "Read the paper", url: "https://doi.org/..." }
   featured  → true/false (reserved, no visual effect right now)
   order     → number controlling position in the index, lowest first

3. Everything below the second --- line is the project page's write-up.
   Write normal Markdown: paragraphs, **bold**, lists. The first paragraph
   is shown slightly larger as the lead.

4. Save, commit, and push. GitHub Actions rebuilds the site.

SMALL REPOS
───────────
Small projects that don't need their own page go in "other-builds.md":
add a line to its `items:` list with { name, note, url }.

To remove a project, delete its .md file.
-->
