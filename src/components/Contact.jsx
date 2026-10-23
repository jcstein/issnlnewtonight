import React from "react"
import Layout from "./Layout.jsx"

export default function Contact() {
  return (
    <Layout>
      <h1>Contact Me</h1>
      <form
        method="post"
        action="https://getform.io/f/74f2c1f5-b61e-4085-b274-ff32bb4ab989"
        encType="multipart/form-data"
      >
        <label htmlFor="name">
          Name
          <input type="text" name="name" id="name" />
        </label>
        <label htmlFor="email">
          Email
          <input type="email" name="email" id="email" />
        </label>
        <label htmlFor="subject">
          Subject
          <input type="text" name="subject" id="subject" />
        </label>
        <label htmlFor="message">
          Message
          <textarea name="message" id="message" rows="3" />
        </label>
        <p>
          <input type="file" name="file" aria-label="Attachment" />
        </p>
        <p>
          <button type="submit">Send</button> <input type="reset" value="Clear" />
        </p>
      </form>
    </Layout>
  )
}
