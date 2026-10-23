// TVmaze's public API is keyless and sends Access-Control-Allow-Origin: *.
// Show 361 is Saturday Night Live on NBC. Episode titles are "Host / Musical Guest".
// A direct lookup is tried first; singlesearch is the fallback if that request fails.

import { parseBilling } from "./schedule.js"

const SHOW_ID = 361

export function scheduleUrls() {
  const direct = new URL(`https://api.tvmaze.com/shows/${SHOW_ID}`)
  direct.searchParams.append("embed[]", "nextepisode")
  direct.searchParams.append("embed[]", "previousepisode")

  const search = new URL("https://api.tvmaze.com/singlesearch/shows")
  search.searchParams.set("q", "saturday night live")
  search.searchParams.append("embed[]", "nextepisode")
  search.searchParams.append("embed[]", "previousepisode")

  return [direct, search]
}

export function plainText(value) {
  if (!value || typeof value !== "string") return ""
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function episodeFrom(raw) {
  if (!raw || !isIsoDate(raw.airdate)) return null
  const billing = parseBilling(raw.name)
  return {
    id: raw.id ?? null,
    name: billing.title || raw.name || "",
    host: billing.host,
    musicalGuest: billing.musicalGuest,
    airdate: raw.airdate,
    airtime: raw.airtime || null,
    airstamp: raw.airstamp || null,
    season: raw.season ?? null,
    number: raw.number ?? null,
    type: raw.type || "regular",
    url: raw.url || null,
    summary: plainText(raw.summary),
  }
}

export function normalizeShow(data) {
  if (!data || data.name !== "Saturday Night Live") {
    throw new Error("Unexpected show from TVmaze")
  }
  const links = data._links || {}
  const embedded = data._embedded || {}
  if (links.nextepisode && !embedded.nextepisode) {
    throw new Error("Next episode was not included")
  }
  if (links.previousepisode && !embedded.previousepisode) {
    throw new Error("Previous episode was not included")
  }
  return {
    id: data.id ?? null,
    name: data.name,
    status: data.status || null,
    previous: episodeFrom(embedded.previousepisode),
    next: episodeFrom(embedded.nextepisode),
  }
}

export async function loadSchedule(fetchImpl = globalThis.fetch, { timeoutMs = 8000 } = {}) {
  let lastError = new Error("Schedule unavailable")
  for (const url of scheduleUrls()) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchImpl(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`TVmaze responded ${response.status}`)
      const data = await response.json()
      return normalizeShow(data)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Schedule unavailable")
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError
}
