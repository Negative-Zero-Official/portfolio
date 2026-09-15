const markdownIt = require("markdown-it");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const md = markdownIt({ html: true });
const PATH_PREFIX = process.env.PATH_PREFIX || "/";

module.exports = function (eleventyConfig) {
  // Copy static assets (css/js/images) straight through to the output folder
  eleventyConfig.addPassthroughCopy("src/assets");

  // Rebuild automatically when CSS/JS changes during local dev (`npx eleventy --serve`)
  eleventyConfig.addWatchTarget("src/assets");

  // Projects collection — every .md file in src/projects, sorted by "order" front matter
  eleventyConfig.addCollection("projects", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/projects/*.md")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  });

  // Experience collection — every .md file in src/experience, sorted by "order" front matter
  eleventyConfig.addCollection("experience", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/experience/*.md")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  });

  // Cache busting for static assets.
  //
  // GitHub Pages serves every file with a fixed `Cache-Control: max-age=600`
  // and gives us no way to change that. So a browser that has already loaded
  // /assets/css/style.css will keep using its copy for 10 minutes without
  // asking the server, which is how a fresh deploy can render with a stale
  // stylesheet. Appending a hash of the file's own contents means that any
  // time the file actually changes, its URL changes too — and a URL nobody
  // has seen before cannot be served from anyone's cache.
  //
  // The hash is content-based, not time-based, so rebuilding without editing
  // an asset leaves its URL alone and returning visitors keep their cache.
  const hashCache = new Map();
  eleventyConfig.on("eleventy.before", () => hashCache.clear());

  eleventyConfig.addFilter("cachebust", (urlPath) => {
    if (!urlPath) return urlPath;

    // Undo the pathPrefix the `url` filter added, to get back to a path
    // relative to src/ (e.g. "/portfolio/assets/..." -> "assets/...").
    let rel = urlPath;
    if (PATH_PREFIX !== "/" && rel.startsWith(PATH_PREFIX)) {
      rel = rel.slice(PATH_PREFIX.length);
    }
    rel = rel.replace(/^\/+/, "");

    const file = path.join(__dirname, "src", rel);
    if (!hashCache.has(file)) {
      try {
        const hash = crypto
          .createHash("sha256")
          .update(fs.readFileSync(file))
          .digest("hex")
          .slice(0, 8);
        hashCache.set(file, hash);
      } catch (err) {
        // Missing or unreadable asset: fall back to the plain URL rather than
        // breaking the build, but say so, since it means no cache busting.
        console.warn(`[cachebust] could not read ${file} — serving unversioned`);
        hashCache.set(file, null);
      }
    }

    const hash = hashCache.get(file);
    return hash ? `${urlPath}?v=${hash}` : urlPath;
  });

  // Renders **bold**/*italic* markdown inline, without wrapping in a <p> tag —
  // used for short bios/headlines in src/_data/site.json
  eleventyConfig.addFilter("mdInline", (value) => {
    if (!value) return "";
    return md.renderInline(value);
  });

  // Renders full markdown (paragraphs etc.) — used for project/job body content
  eleventyConfig.addFilter("mdFull", (value) => {
    if (!value) return "";
    return md.render(value);
  });

  return {
    pathPrefix: process.env.PATH_PREFIX || "/",
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
  };
};
