
// prefer default export if available
const preferDefault = m => (m && m.default) || m


exports.components = {
  "component---cache-dev-404-page-js": preferDefault(require("/Users/joshuastein/Documents/GitHub/issnlnewtonight/.cache/dev-404-page.js")),
  "component---src-pages-contact-js": preferDefault(require("/Users/joshuastein/Documents/GitHub/issnlnewtonight/src/pages/contact.js")),
  "component---src-pages-index-js": preferDefault(require("/Users/joshuastein/Documents/GitHub/issnlnewtonight/src/pages/index.js")),
  "component---src-templates-blog-post-js": preferDefault(require("/Users/joshuastein/Documents/GitHub/issnlnewtonight/src/templates/blog-post.js"))
}

