import {
  answerQuestion,
  describeAnswer,
  formatLongDate,
  verdictLabel,
} from "./lib/schedule.js"
import { loadSchedule } from "./lib/tvmaze.js"

const answer = document.querySelector("#answer")
const summary = document.querySelector("#summary")
let attempt = 0

function render(result, status) {
  const label = verdictLabel(result)
  document.title = label + " — is SNL new tonight?"
  answer.dataset.status = status
  answer.dataset.verdict = result.verdict
  answer.textContent = ""

  const heading = document.createElement("h2")
  heading.append(document.createTextNode(label + " "))
  const when = document.createElement("span")
  when.className = "when"
  when.textContent = "— " + formatLongDate(result.night.iso)
  heading.append(when)
  answer.append(heading)

  const lines = describeAnswer(result)
  for (let i = 0; i < lines.length; i++) {
    const paragraph = document.createElement("p")
    paragraph.textContent = lines[i]
    answer.append(paragraph)
  }

  if (status === "error") {
    const retry = document.createElement("p")
    retry.className = "retry"
    const button = document.createElement("button")
    button.type = "button"
    button.textContent = "try again"
    button.addEventListener("click", function () {
      attempt += 1
      load()
    })
    retry.append(button)
    answer.append(retry)
  }

  const text = result.summaryEpisode && result.summaryEpisode.summary
  if (text) {
    summary.hidden = false
    summary.textContent = text
  } else {
    summary.hidden = true
    summary.textContent = ""
  }
}

function load() {
  const now = new Date()
  answer.dataset.status = "loading"
  answer.dataset.verdict = ""
  answer.textContent = ""
  const heading = document.createElement("h2")
  heading.textContent = "checking the calendar…"
  answer.append(heading)
  summary.hidden = true

  loadSchedule()
    .then(function (schedule) {
      render(answerQuestion(now, schedule), "ready")
    })
    .catch(function () {
      render(answerQuestion(now, null), "error")
    })
}

load()
