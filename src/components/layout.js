import React from "react"
import { css } from "@emotion/react"
import { useStaticQuery, Link, graphql } from "gatsby"
import "../styles/global.css"
import Container from "../components/container"
import { Helmet } from "react-helmet"

import { rhythm } from "../utils/typography"

const ListLink = props => (
  <li style={{ display: 'inline-block', marginRight: '1rem'}}>
      <Link to={props.to}>{props.children}</Link>
  </li>
)

export default function Layout({ children }) {
  const data = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
          }
        }
      }
    `
  )
  return (
    <Container>
      <div className="flexThisBox">
      <Helmet>
          <meta charSet="utf-8" />
          <title>is SNL new tonight?</title>
          <link rel="canonical" href="http://issnlnewtonight.com" />
        </Helmet>
      <header>
        <Link to={`/`}>
        <h3
          css={css`
            margin-bottom: ${rhythm(2)};
            display: inline-block;
            font-style: normal;
          `}
        >
          {data.site.siteMetadata.title}
        </h3>
      </Link>
      </header>
      <main>
        {children}
      </main>
      <footer>
        <p></p>
      © {new Date().getFullYear()} Copyright Josh Stein. Built with
          {` `}
          <Link css={css`
                text-decoration: none;
                color: inherit;
              `}
              to={'https://www.gatsbyjs.com'}>Gatsby</Link>. Made it this far? Let's solve some problems <Link to="../contact">together</Link>.

      </footer>
      </div>
      </Container>
  )
}