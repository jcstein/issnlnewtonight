// Copies the static site into both directories Pages might publish.
// Gatsby projects publish "public". A Vite-style setting publishes "dist".
// CommonJS on purpose, so this still runs on the older Node that Pages build image v1/v2 use.
const fs = require("fs")
const path = require("path")

const root = path.join(__dirname, "..")

function rimraf(dir) {
  if (!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) rimraf(target)
    else fs.unlinkSync(target)
  }
  fs.rmdirSync(dir)
}

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
}

function fill(outDir) {
  const dest = path.join(root, outDir)
  rimraf(dest)
  fs.mkdirSync(dest, { recursive: true })
  copyFile(path.join(root, "index.html"), path.join(dest, "index.html"))
  copyFile(path.join(root, "contact.html"), path.join(dest, "contact.html"))
  copyFile(path.join(root, "src/styles.css"), path.join(dest, "styles.css"))
  copyFile(path.join(root, "src/app.js"), path.join(dest, "app.js"))
  copyFile(path.join(root, "src/lib/schedule.js"), path.join(dest, "lib/schedule.js"))
  copyFile(path.join(root, "src/lib/tvmaze.js"), path.join(dest, "lib/tvmaze.js"))
  copyFile(path.join(root, "src/images/image.jpg"), path.join(dest, "images/image.jpg"))
  copyFile(path.join(root, "static/favicon.ico"), path.join(dest, "favicon.ico"))
  copyFile(path.join(root, "static/icon.png"), path.join(dest, "icon.png"))
}

console.log("Building is SNL new tonight on Node " + process.version)
fill("dist")
fill("public")
console.log("Wrote dist/ and public/")
