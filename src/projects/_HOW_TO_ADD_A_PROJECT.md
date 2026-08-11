<!--
This file is ignored by the site (filenames starting with _ are not
built as pages by Eleventy). It's just a cheat sheet.

HOW TO ADD A NEW PROJECT CARD
──────────────────────────────
1. Copy any other .md file in this folder.
2. Rename it — the filename doesn't matter, but keep it short and
   dash-separated, e.g. "my-new-project.md".
3. Edit the front matter (the part between the --- lines):

   title        → card heading
   statusLabel  → small pill text, e.g. "Published · IEEE", "Open Source",
                  "Research", "Archive", or anything you want
   statusClass  → controls the pill's color:
                    "published" = violet
                    "oss"       = coral
                    "analysis"  = grey  (used for Research / Archive / etc.)
   tags         → list of short chips shown under the description,
                  e.g. ["Python", "Computer Vision"] — use [] for none
   link         → URL for the card's link (GitHub repo, DOI, live demo…)
                  leave as "" to hide the link entirely
   linkLabel    → text for that link, e.g. "View on GitHub", "View DOI"
   featured     → true = card spans the full row width (use for big/
                  standout entries); false = normal half-width card
   order        → number controlling display order, lowest first

4. Everything below the second --- line is the card's description —
   write it as normal prose/Markdown.

5. Save, commit, and push. GitHub Actions rebuilds the site
   automatically — no HTML editing required.

To remove a project, delete its .md file.
-->
