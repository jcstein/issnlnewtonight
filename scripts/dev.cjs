const http = require("http")
const fs = require("fs")
const path = require("path")

const root = path.join(__dirname, "..", "public")
const port = Number(process.env.PORT || 4173)
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
}

const server = http.createServer(function (req, res) {
  const url = new URL(req.url, "http://127.0.0.1")
  let pathname = decodeURIComponent(url.pathname)
  if (pathname === "/contact") pathname = "/contact.html"
  if (pathname.endsWith("/")) pathname += "index.html"
  const file = path.normalize(path.join(root, pathname))
  if (!file.startsWith(root)) {
    res.writeHead(403)
    res.end("no")
    return
  }
  fs.readFile(file, function (error, data) {
    if (error) {
      res.writeHead(404)
      res.end("not found")
      return
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" })
    res.end(data)
  })
})

server.listen(port, "0.0.0.0", function () {
  console.log("http://127.0.0.1:" + port)
})
