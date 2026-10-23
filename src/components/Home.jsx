import React, { useEffect, useState } from "react"
import lorne from "../images/image.jpg"
import { answerQuestion, describeAnswer, formatLongDate, verdictLabel } from "../lib/schedule.js"
import { loadSchedule } from "../lib/tvmaze.js"
import Layout from "./Layout.jsx"

export default function Home() {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState("loading")
  const [result, setResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    const now = new Date()
    setStatus("loading")
    loadSchedule()
      .then((schedule) => {
        if (cancelled) return
        setResult(answerQuestion(now, schedule))
        setStatus("ready")
      })
      .catch(() => {
        if (cancelled) return
        setResult(answerQuestion(now, null))
        setStatus("error")
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  useEffect(() => {
    if (!result) {
      document.title = "is SNL new tonight?"
      return
    }
    document.title = `${verdictLabel(result)} — is SNL new tonight?`
  }, [result])

  const lines = result ? describeAnswer(result) : []
  const summary = result?.summaryEpisode?.summary

  return (
    <Layout>
      <h1 className="question">
        <span role="img" aria-label="wave">
          👋
        </span>{" "}
        is{" "}
        <a className="plain" href="https://www.nbc.com/saturday-night-live">
          Saturday Night Live
        </a>{" "}
        new tonight?
      </h1>
      <div aria-live="polite" data-status={status} data-verdict={result ? result.verdict : ""}>
        {status === "loading" || !result ? (
          <h2>checking the calendar…</h2>
        ) : (
          <>
            <h2>
              {verdictLabel(result)}{" "}
              <span className="when">— {formatLongDate(result.night.iso)}</span>
            </h2>
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {status === "error" ? (
              <p className="retry">
                <button type="button" onClick={() => setAttempt((value) => value + 1)}>
                  try again
                </button>
              </p>
            ) : null}
          </>
        )}
      </div>
      <img
        className="featured"
        src={lorne}
        width="2000"
        height="1000"
        alt="Lorne Michaels in a dark baseball cap."
      />
      {status !== "loading" && summary ? <blockquote>{summary}</blockquote> : null}
    </Layout>
  )
}
