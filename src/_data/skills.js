// ─────────────────────────────────────────────────────────────
// SKILLS / PROGRESS BARS
// ─────────────────────────────────────────────────────────────
// Edit this file to change the skill sliders on the site.
//
// - "category"  → panel heading (e.g. "Programming")
// - "color"     → "violet" (default bar) or "coral" (warm accent bar)
// - "items"     → list of { name, level, tag }
//     - "name"  → skill label
//     - "level" → 0–100, how full the bar is
//     - "tag"   → small right-aligned label, e.g. "PRIMARY",
//                 "PROFICIENT", "WORKING", "LEARNING"
//
// To add a new skill: copy one { name, level, tag } line inside
// the right category's "items" array.
//
// To add a whole new panel/category: copy one of the two
// objects below (the { category, color, items } block) and
// change its contents. Panels render side-by-side automatically
// — a third one will wrap to its own row.
// ─────────────────────────────────────────────────────────────

module.exports = [
  {
    category: "Programming",
    color: "violet",
    items: [
      { name: "Python", level: 95, tag: "PRIMARY" },
      { name: "Java", level: 80, tag: "PROFICIENT" },
      { name: "JavaScript", level: 75, tag: "PROFICIENT" },
      { name: "C", level: 75, tag: "PROFICIENT" },
      { name: "MySQL / PL-SQL", level: 65, tag: "WORKING" },
      { name: "Arduino", level: 60, tag: "WORKING" },
    ],
  },
  {
    category: "Content Development",
    color: "coral",
    items: [
      { name: "Adobe Premiere Pro", level: 85, tag: "PROFICIENT" },
      { name: "Photoshop", level: 78, tag: "PROFICIENT" },
      { name: "After Effects", level: 65, tag: "WORKING" },
      { name: "Audition & Animate", level: 60, tag: "WORKING" },
      { name: "YouTube Channel Management", level: 80, tag: "PROFICIENT" },
      { name: "Brand Collaboration", level: 65, tag: "WORKING" },
    ],
  },
];
