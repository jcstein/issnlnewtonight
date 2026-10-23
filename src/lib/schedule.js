// "Tonight" is the Eastern Time broadcast night, not the visitor's raw calendar date.
// SNL airs Saturday at 11:30 PM ET and runs past midnight, so the night rolls over
// at 6:00 AM ET: Sunday at 1:00 AM still belongs to Saturday's show.

export const ET = "America/New_York"
export const ROLLOVER_HOUR = 6
// Summer hiatus is months long. In-season skips and the holiday break are weeks.
export const OFF_SEASON_GAP_DAYS = 42

const WEEKDAY_LINE = (weekday) => `it's ${weekday}`
const SATURDAY_ANYWAY = "it's not a new episode today, even though it's Saturday"
const RERUN_OR_NO_SHOW = "rerun or no show"
const OFF_SEASON = "it's the off-season"
const NEW_TONIGHT = "new episode tonight, 11:30 PM ET"

export function etParts(date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: ET,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
  const bag = {}
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") bag[part.type] = part.value
  }
  let hour = Number(bag.hour)
  if (hour === 24) hour = 0
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour,
    minute: Number(bag.minute),
    weekday: bag.weekday,
  }
}

export function isoFromParts(parts) {
  const month = String(parts.month).padStart(2, "0")
  const day = String(parts.day).padStart(2, "0")
  return `${parts.year}-${month}-${day}`
}

export function addDays(iso, days) {
  const [year, month, day] = iso.split("-").map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day + days))
  return utc.toISOString().slice(0, 10)
}

export function weekdayOf(iso) {
  const [year, month, day] = iso.split("-").map(Number)
  return etParts(new Date(Date.UTC(year, month - 1, day, 17))).weekday
}

export function daysBetween(startIso, endIso) {
  const [startYear, startMonth, startDay] = startIso.split("-").map(Number)
  const [endYear, endMonth, endDay] = endIso.split("-").map(Number)
  const ms =
    Date.UTC(endYear, endMonth - 1, endDay) -
    Date.UTC(startYear, startMonth - 1, startDay)
  return Math.round(ms / 86400000)
}

export function snlNight(now) {
  const et = etParts(now)
  let iso = isoFromParts(et)
  if (et.hour < ROLLOVER_HOUR) iso = addDays(iso, -1)
  return { iso, weekday: weekdayOf(iso), et }
}

export function formatLongDate(iso) {
  const [year, month, day] = iso.split("-").map(Number)
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ET,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 17)))
}

export function parseBilling(name) {
  if (!name || typeof name !== "string") {
    return { host: null, musicalGuest: null, title: "" }
  }
  const title = name
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const parts = title.split(/\s+\/\s+/)
  if (parts.length >= 2) {
    return {
      host: parts[0] || null,
      musicalGuest: parts.slice(1).join(" / ") || null,
      title,
    }
  }
  return { host: parts[0] || null, musicalGuest: null, title }
}

export function billingLine(episode) {
  if (!episode) return null
  if (episode.host && episode.musicalGuest) {
    return `🎤 ${episode.host}; ${episode.musicalGuest} 🎶`
  }
  if (episode.host) return `🎤 ${episode.host} 🎶`
  return episode.name || episode.title || null
}

function episodeOn(iso, episode) {
  return Boolean(episode && episode.airdate === iso)
}

function isOffSeason(nightIso, previous, next) {
  if (!previous && !next) return true
  if (previous && next) {
    const gap = daysBetween(previous.airdate, next.airdate)
    const since = daysBetween(previous.airdate, nightIso)
    const until = daysBetween(nightIso, next.airdate)
    return gap > OFF_SEASON_GAP_DAYS && since > 0 && until > 0
  }
  if (!next && previous) {
    return daysBetween(previous.airdate, nightIso) > OFF_SEASON_GAP_DAYS
  }
  return daysBetween(nightIso, next.airdate) > OFF_SEASON_GAP_DAYS
}

export function answerQuestion(now, schedule) {
  const night = snlNight(now)
  const isSaturday = night.weekday === "Saturday"

  if (!schedule) {
    return {
      verdict: isSaturday ? "unknown" : "no",
      reason: isSaturday ? "schedule-unavailable" : "not-saturday",
      night,
      isSaturday,
      offSeason: false,
      tonightEpisode: null,
      nextEpisode: null,
      previousEpisode: null,
      summaryEpisode: null,
    }
  }

  const previous = schedule.previous || null
  const next = schedule.next || null
  const airedTonight = episodeOn(night.iso, next)
    ? next
    : episodeOn(night.iso, previous)
      ? previous
      : null
  const isNew = Boolean(airedTonight && airedTonight.type !== "rerun")
  const offSeason = isNew ? false : isOffSeason(night.iso, previous, next)

  let verdict = "no"
  let reason = "not-saturday"
  if (isNew) {
    verdict = "yes"
    reason = "new"
  } else if (airedTonight && airedTonight.type === "rerun") {
    reason = "rerun-or-no-show"
  } else if (offSeason) {
    reason = "off-season"
  } else if (!isSaturday) {
    reason = "not-saturday"
  } else {
    reason = "rerun-or-no-show"
  }

  return {
    verdict,
    reason,
    night,
    isSaturday,
    offSeason,
    tonightEpisode: isNew ? airedTonight : null,
    nextEpisode: next,
    previousEpisode: previous,
    summaryEpisode: isNew ? airedTonight : next,
  }
}

function nextEpisodeLine(episode) {
  if (!episode) return null
  return `next new episode is ${formatLongDate(episode.airdate)} — ${billingLine(episode)}`
}

export function describeAnswer(result) {
  if (result.verdict === "yes" && result.tonightEpisode) {
    const lines = []
    const bill = billingLine(result.tonightEpisode)
    if (bill) lines.push(bill)
    lines.push(NEW_TONIGHT)
    return lines
  }

  if (result.reason === "schedule-unavailable") {
    return [
      "it's Saturday, but the schedule didn't load, so I won't guess",
      "a new episode would air at 11:30 PM ET. could be new, could be a rerun",
    ]
  }

  if (result.reason === "not-saturday" && !result.nextEpisode) {
    return [
      WEEKDAY_LINE(result.night.weekday),
      "the schedule didn't load, so the next host is a mystery",
    ]
  }

  const lines = []
  if (!result.isSaturday) lines.push(WEEKDAY_LINE(result.night.weekday))

  if (result.reason === "off-season") {
    lines.push(OFF_SEASON)
    if (result.previousEpisode) {
      lines.push(
        `last new episode was ${formatLongDate(result.previousEpisode.airdate)} — ${billingLine(result.previousEpisode)}`,
      )
    }
  } else if (result.reason === "rerun-or-no-show") {
    lines.push(SATURDAY_ANYWAY)
    lines.push(RERUN_OR_NO_SHOW)
  }

  const upcoming = nextEpisodeLine(result.nextEpisode)
  if (upcoming) lines.push(upcoming)
  else if (result.reason !== "not-saturday") {
    lines.push("no new episode is on the calendar yet")
  }

  return lines
}

export function verdictLabel(result) {
  if (result.verdict === "yes") return "yes"
  if (result.verdict === "no") return "no"
  return "hmm"
}
