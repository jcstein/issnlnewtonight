import React from "react"
import Contact from "./components/Contact.jsx"
import Home from "./components/Home.jsx"

function currentPage() {
  const path = window.location.pathname
    .replace(/\/index\.html$/, "/")
    .replace(/\.html$/, "")
    .replace(/\/$/, "")
  return path === "/contact" ? "contact" : "home"
}

export default function App() {
  return currentPage() === "contact" ? <Contact /> : <Home />
}
