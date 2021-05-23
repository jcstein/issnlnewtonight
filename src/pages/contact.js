
import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"

export default function About({ data }) {
  return (
  <Layout>
      <h1>Contact Me</h1>
      <form method="post" action="https://getform.io/f/74f2c1f5-b61e-4085-b274-ff32bb4ab989" enctype="multipart/form-data">
    <label>
      Name<p></p>
      <input type="text" name="name" id="name"/>
    </label>
    <p></p>
    <label>
      Email   <p></p>
      <input type="email" name="email" id="email" />
    </label>
    <p></p>
    <label>
      Subject   <p></p>
      <input type="text" name="subject" id="subject" />
    </label>
    <p></p>
    <label>
      Message   <p></p>
      <textarea name="message" id="message" rows="3"/>
    </label>
    <p></p>
    <input type="file" name="file"/>
    <p></p>
    <p>
    <button type="submit">Send</button> <input type="reset" value="Clear" /></p>
    </form>
  </Layout>
  )
}

export const query = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`