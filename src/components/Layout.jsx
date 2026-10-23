import React from "react"

export default function Layout({ children }) {
  return (
    <div className="container">
      <div className="flexThisBox">
        <header>
          <a href="/">
            <h3 className="site-title">is SNL new tonight?</h3>
          </a>
        </header>
        <main>{children}</main>
        <footer>
          <p>
            © {new Date().getFullYear()} Copyright Josh Stein. Let's solve some problems{" "}
            <a href="/contact">together</a>.
          </p>
          <p className="note">
            Eastern Time decides the night. SNL airs Saturdays at 11:30 PM ET. Schedule from{" "}
            <a href="https://www.tvmaze.com/shows/361/saturday-night-live">TVmaze</a>.
          </p>
        </footer>
      </div>
    </div>
  )
}
