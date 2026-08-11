const markdownIt = require("markdown-it");
const md = markdownIt({ html: true });

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
