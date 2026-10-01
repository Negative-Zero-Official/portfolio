const markdownIt = require("markdown-it");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const esbuild = require("esbuild");

const md = markdownIt({ html: true });
const PATH_PREFIX = process.env.PATH_PREFIX || "/";
const IS_SERVE = process.argv.includes("--serve") || process.argv.includes("--watch");

module.exports = function (eleventyConfig) {
  // Copy static assets (css/images) straight through to the output folder.
  // JavaScript is NOT copied raw — it's bundled by esbuild below.
  eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("src/assets/img");

  // Rebuild automatically when CSS/JS changes during local dev (`npm start`)
  eleventyConfig.addWatchTarget("src/assets");

  // Bundle src/assets/js/app.js (and everything it imports: three.js, gsap,
  // lenis, the particle scene…) into a single file at <output>/assets/js/app.js.
  // Runs before every build, so it also re-bundles on save during `npm start`.
  let outputDir = "_site";
  eleventyConfig.on("eleventy.before", async ({ directories }) => {
    outputDir = directories?.output || outputDir;
    await esbuild.build({
      entryPoints: ["src/assets/js/app.js"],
      outfile: path.join(outputDir, "assets/js/app.js"),
      bundle: true,
      format: "esm",
      target: "es2020",
      minify: !IS_SERVE,
      sourcemap: IS_SERVE,
      logLevel: "warning",
    });
  });

  // Projects collection — every .md file in src/projects, sorted by "order" front matter
  eleventyConfig.addCollection("projects", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/projects/*.md")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
  });

  // Projects that get a row in the index + their own detail page
  // (everything except "compact" entries like Other Builds)
  eleventyConfig.addCollection("projectPages", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/projects/*.md")
      .filter((p) => p.data.index !== "compact")
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

    // Hash the file that's actually served: the esbuild bundle in the output
    // folder for JS (src/assets/js/app.js is only its entry point, so hashing
    // it would miss changes in imported modules), the source file otherwise.
    const file = rel.startsWith("assets/js/")
      ? path.resolve(outputDir, rel)
      : path.join(__dirname, "src", rel);
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

  // 3 -> "03" — index numbers in the project list
  eleventyConfig.addFilter("pad2", (n) => String(n).padStart(2, "0"));

  // 3 -> "III" — figure numbers in the plate captions
  eleventyConfig.addFilter("roman", (n) => {
    const map = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let out = "";
    for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
    return out;
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
