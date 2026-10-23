import assert from "node:assert/strict"
import { describe, it } from "node:test"

function expect(actual) {
  const matcher = (expected) =>
    typeof expected === "string" ? new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) : expected
  return {
    toBe(expected) {
      assert.strictEqual(actual, expected)
    },
    toEqual(expected) {
      assert.deepStrictEqual(actual, expected)
    },
    toBeNull() {
      assert.strictEqual(actual, null)
    },
    toContain(expected) {
      assert.ok(String(actual).includes(expected), actual + " should contain " + expected)
    },
    not: {
      toContain(expected) {
        assert.ok(!String(actual).includes(expected), actual + " should not contain " + expected)
      },
    },
    toMatchObject(expected) {
      for (const key of Object.keys(expected)) {
        assert.deepStrictEqual(actual[key], expected[key], key)
      }
    },
    toThrow(expected) {
      assert.throws(actual, matcher(expected))
    },
    rejects: {
      toThrow(expected) {
        return assert.rejects(actual, matcher(expected))
      },
    },
  }
}

import {
  OFF_SEASON_GAP_DAYS,
  addDays,
  answerQuestion,
  billingLine,
  daysBetween,
  describeAnswer,
  formatLongDate,
  parseBilling,
  snlNight,
} from "./schedule.js"
import { episodeFrom, loadSchedule, normalizeShow, plainText } from "./tvmaze.js"

function episode(airdate, name, type = "regular", summary = "") {
  return {
    name,
    host: parseBilling(name).host,
    musicalGuest: parseBilling(name).musicalGuest,
    airdate,
    type,
    summary,
  }
}

const season52 = {
  previous: episode("2026-10-10", "Shane Gillis / Rosalía"),
  next: episode("2026-10-31", "Inde Navarrette / Gracie Abrams", "regular", "Back on Oct. 31."),
}

describe("Saturday detection", () => {
  it("treats Saturday evening in ET as Saturday night", () => {
    const night = snlNight(new Date("2026-10-24T20:00:00-04:00"))
    expect(night.iso).toBe("2026-10-24")
    expect(night.weekday).toBe("Saturday")
  })

  it("treats Friday evening as Friday, including 11:30 PM", () => {
    const evening = snlNight(new Date("2026-10-23T20:00:00-04:00"))
    const late = snlNight(new Date("2026-10-23T23:30:00-04:00"))
    expect(evening).toMatchObject({ iso: "2026-10-23", weekday: "Friday" })
    expect(late).toMatchObject({ iso: "2026-10-23", weekday: "Friday" })
  })

  it("keeps Sunday before 6:00 AM ET on Saturday's night", () => {
    const during = snlNight(new Date("2026-11-01T01:00:00-04:00"))
    expect(during).toMatchObject({ iso: "2026-10-31", weekday: "Saturday" })
  })

  it("rolls to the new day at 6:00 AM ET", () => {
    const stillNight = snlNight(new Date("2026-11-01T10:59:00Z"))
    const morning = snlNight(new Date("2026-11-01T11:00:00Z"))
    expect(stillNight).toMatchObject({ iso: "2026-10-31", weekday: "Saturday" })
    expect(morning).toMatchObject({ iso: "2026-11-01", weekday: "Sunday" })
  })

  it("treats early Saturday morning as Friday night and Saturday daytime as Saturday", () => {
    const before = snlNight(new Date("2026-10-24T09:00:00Z"))
    const after = snlNight(new Date("2026-10-24T12:00:00Z"))
    expect(before).toMatchObject({ iso: "2026-10-23", weekday: "Friday" })
    expect(after).toMatchObject({ iso: "2026-10-24", weekday: "Saturday" })
  })
})

describe("ET conversion", () => {
  it("maps a Sunday UTC instant in winter back to Saturday evening EST", () => {
    const night = snlNight(new Date("2026-01-11T04:30:00Z"))
    expect(night).toMatchObject({ iso: "2026-01-10", weekday: "Saturday" })
  })

  it("maps 11:30 PM EDT to that Saturday even though UTC has turned Sunday", () => {
    const night = snlNight(new Date("2026-11-01T03:30:00Z"))
    expect(night).toMatchObject({ iso: "2026-10-31", weekday: "Saturday" })
  })

  it("counts Saturday night on the west coast, after ET has turned Sunday, as the ET air date", () => {
    const night = snlNight(new Date("2026-11-01T04:00:00Z"))
    expect(night).toMatchObject({ iso: "2026-10-31", weekday: "Saturday" })
  })

  it("counts London early Sunday, while the ET broadcast is on, as Saturday", () => {
    const night = snlNight(new Date("2026-11-01T04:30:00Z"))
    expect(night).toMatchObject({ iso: "2026-10-31", weekday: "Saturday" })
  })

  it("counts a later London Sunday as Sunday", () => {
    const night = snlNight(new Date("2026-11-01T12:00:00Z"))
    expect(night).toMatchObject({ iso: "2026-11-01", weekday: "Sunday" })
  })

  it("counts Tokyo Sunday afternoon during the ET broadcast as Saturday", () => {
    const night = snlNight(new Date("2026-11-01T13:30:00+09:00"))
    expect(night).toMatchObject({ iso: "2026-10-31", weekday: "Saturday" })
  })

  it("formats an air date on the ET calendar", () => {
    expect(formatLongDate("2026-10-31")).toBe("31 October 2026")
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09")
    expect(daysBetween("2026-10-10", "2026-10-31")).toBe(21)
  })
})

describe("answering the question", () => {
  it("says yes when the episode air date is this ET Saturday", () => {
    const result = answerQuestion(new Date("2026-10-31T23:00:00-04:00"), season52)
    expect(result.verdict).toBe("yes")
    expect(result.reason).toBe("new")
    expect(result.tonightEpisode.host).toBe("Inde Navarrette")
    expect(result.tonightEpisode.musicalGuest).toBe("Gracie Abrams")
    expect(describeAnswer(result)).toEqual([
      "🎤 Inde Navarrette; Gracie Abrams 🎶",
      "new episode tonight, 11:30 PM ET",
    ])
  })

  it("still says yes after midnight ET while that episode is the previous one", () => {
    const schedule = {
      previous: episode("2026-10-31", "Inde Navarrette / Gracie Abrams"),
      next: episode("2026-11-07", "Someone / Band"),
    }
    const result = answerQuestion(new Date("2026-11-01T01:15:00-04:00"), schedule)
    expect(result.verdict).toBe("yes")
    expect(result.night.iso).toBe("2026-10-31")
  })

  it("says yes for a visitor whose local clock is already Sunday", () => {
    const result = answerQuestion(new Date("2026-11-01T04:00:00Z"), season52)
    expect(result.verdict).toBe("yes")
    expect(result.night.iso).toBe("2026-10-31")
  })

  it("says yes when a new episode airs on a non-Saturday ET night", () => {
    const schedule = {
      previous: episode("2026-10-10", "Shane Gillis / Rosalía"),
      next: episode("2026-10-22", "Special Host / Special Guest"),
    }
    const result = answerQuestion(new Date("2026-10-22T21:00:00-04:00"), schedule)
    expect(result.night.weekday).toBe("Thursday")
    expect(result.verdict).toBe("yes")
  })

  it("says no on a normal Friday and names the next host", () => {
    const result = answerQuestion(new Date("2026-10-23T20:00:00-04:00"), season52)
    expect(result.verdict).toBe("no")
    expect(result.reason).toBe("not-saturday")
    expect(result.offSeason).toBe(false)
    expect(describeAnswer(result)).toEqual([
      "it's Friday",
      "next new episode is 31 October 2026 — 🎤 Inde Navarrette; Gracie Abrams 🎶",
    ])
  })

  it("does not call a rerun a new episode", () => {
    const schedule = {
      previous: episode("2026-10-17", "Classic Host / Classic Guest", "rerun"),
      next: episode("2026-10-31", "Inde Navarrette / Gracie Abrams"),
    }
    const result = answerQuestion(new Date("2026-10-17T23:00:00-04:00"), schedule)
    expect(result.verdict).toBe("no")
    expect(result.reason).toBe("rerun-or-no-show")
    expect(result.tonightEpisode).toBeNull()
  })
})

describe("rerun and season break", () => {
  it("calls an in-season Saturday without a new episode a rerun or no show", () => {
    const result = answerQuestion(new Date("2026-10-24T20:00:00-04:00"), season52)
    expect(result.isSaturday).toBe(true)
    expect(result.verdict).toBe("no")
    expect(result.reason).toBe("rerun-or-no-show")
    expect(result.offSeason).toBe(false)
    expect(describeAnswer(result)).toEqual([
      "it's not a new episode today, even though it's Saturday",
      "rerun or no show",
      "next new episode is 31 October 2026 — 🎤 Inde Navarrette; Gracie Abrams 🎶",
    ])
  })

  it("keeps a holiday-length gap in season instead of calling it the off-season", () => {
    const schedule = {
      previous: episode("2025-12-21", "Martin Short / Hozier"),
      next: episode("2026-01-18", "Dave Chappelle / GloRilla"),
    }
    expect(daysBetween("2025-12-21", "2026-01-18")).toBe(28)
    const result = answerQuestion(new Date("2026-01-03T20:00:00-05:00"), schedule)
    expect(result.night).toMatchObject({ iso: "2026-01-03", weekday: "Saturday" })
    expect(result.reason).toBe("rerun-or-no-show")
    expect(result.offSeason).toBe(false)
  })

  it(`treats a gap of ${OFF_SEASON_GAP_DAYS} days as in-season and one day more as off-season`, () => {
    const edge = {
      previous: episode("2026-10-10", "Host / Guest"),
      next: episode(addDays("2026-10-10", OFF_SEASON_GAP_DAYS), "Host / Guest"),
    }
    const beyond = {
      previous: episode("2026-10-10", "Host / Guest"),
      next: episode(addDays("2026-10-10", OFF_SEASON_GAP_DAYS + 1), "Host / Guest"),
    }
    const saturday = new Date("2026-10-17T20:00:00-04:00")
    expect(answerQuestion(saturday, edge).reason).toBe("rerun-or-no-show")
    expect(answerQuestion(saturday, beyond).reason).toBe("off-season")
  })
})

describe("off-season", () => {
  const hiatus = {
    previous: episode("2026-05-16", "Finale Host / Finale Guest"),
    next: episode("2026-09-26", "Premiere Host / Premiere Guest"),
  }

  it("says the summer hiatus is the off-season on a Saturday", () => {
    const result = answerQuestion(new Date("2026-07-04T20:00:00-04:00"), hiatus)
    expect(result.night.weekday).toBe("Saturday")
    expect(result.verdict).toBe("no")
    expect(result.reason).toBe("off-season")
    expect(result.offSeason).toBe(true)
    expect(describeAnswer(result)[0]).toBe("it's the off-season")
    expect(describeAnswer(result).join(" ")).toContain("26 September 2026")
    expect(describeAnswer(result).join(" ")).not.toContain("rerun or no show")
  })

  it("mentions the weekday and the off-season when it is not Saturday", () => {
    const result = answerQuestion(new Date("2026-07-08T15:00:00-04:00"), hiatus)
    expect(result.night.weekday).toBe("Wednesday")
    expect(result.reason).toBe("off-season")
    expect(describeAnswer(result).slice(0, 2)).toEqual(["it's Wednesday", "it's the off-season"])
  })

  it("is the off-season when nothing new is announced and the last episode is old", () => {
    const schedule = {
      previous: episode("2026-05-16", "Finale Host / Finale Guest"),
      next: null,
    }
    const result = answerQuestion(new Date("2026-07-04T20:00:00-04:00"), schedule)
    expect(result.reason).toBe("off-season")
    expect(describeAnswer(result)).toContain("no new episode is on the calendar yet")
  })
})

describe("schedule fallback", () => {
  it("can still say no on a weekday when the schedule is missing", () => {
    const result = answerQuestion(new Date("2026-10-23T20:00:00-04:00"), null)
    expect(result.verdict).toBe("no")
    expect(result.reason).toBe("not-saturday")
    expect(describeAnswer(result)).toEqual([
      "it's Friday",
      "the schedule didn't load, so the next host is a mystery",
    ])
  })

  it("refuses to guess yes or no on Saturday when the schedule is missing", () => {
    const result = answerQuestion(new Date("2026-10-24T20:00:00-04:00"), null)
    expect(result.verdict).toBe("unknown")
    expect(result.reason).toBe("schedule-unavailable")
    expect(describeAnswer(result)[0]).toContain("won't guess")
  })
})

describe("billing and TVmaze normalization", () => {
  it("splits host and musical guest, including a host with no guest", () => {
    expect(parseBilling("Shane Gillis / Rosalía")).toEqual({
      host: "Shane Gillis",
      musicalGuest: "Rosalía",
      title: "Shane Gillis / Rosalía",
    })
    expect(parseBilling("Charli XCX")).toMatchObject({
      host: "Charli XCX",
      musicalGuest: null,
    })
    expect(billingLine(episode("2026-11-16", "Charli XCX"))).toBe("🎤 Charli XCX 🎶")
  })

  it("normalizes a non-breaking space in the host name", () => {
    const parsed = parseBilling("Inde\u00A0Navarrette / Gracie Abrams")
    expect(parsed.host).toBe("Inde Navarrette")
    expect(parsed.musicalGuest).toBe("Gracie Abrams")
  })

  it("reads embedded episodes and strips summary html", () => {
    const show = normalizeShow({
      id: 361,
      name: "Saturday Night Live",
      status: "Running",
      _links: {
        nextepisode: { href: "https://api.tvmaze.com/episodes/2" },
        previousepisode: { href: "https://api.tvmaze.com/episodes/1" },
      },
      _embedded: {
        nextepisode: {
          id: 2,
          name: "Inde\u00A0Navarrette / Gracie Abrams",
          airdate: "2026-10-31",
          airtime: "23:29",
          type: "regular",
          summary: " <p>Following a two-week break.</p> ",
        },
        previousepisode: {
          id: 1,
          name: "Shane Gillis / Rosalía",
          airdate: "2026-10-10",
          type: "regular",
        },
      },
    })
    expect(show.next.host).toBe("Inde Navarrette")
    expect(show.next.musicalGuest).toBe("Gracie Abrams")
    expect(show.previous.host).toBe("Shane Gillis")
    expect(show.next.summary).toBe("Following a two-week break.")
    expect(plainText("&amp;")).toBe("&")
  })

  it("rejects a payload that advertises an episode and does not include it", () => {
    expect(() =>
      normalizeShow({
        id: 361,
        name: "Saturday Night Live",
        _links: { nextepisode: { href: "https://api.tvmaze.com/episodes/2" } },
        _embedded: {},
      }),
    ).toThrow(/Next episode/)
  })

  it("falls back to show search when the direct lookup fails", async () => {
    const calls = []
    const payload = {
      id: 361,
      name: "Saturday Night Live",
      _links: { nextepisode: { href: "x" } },
      _embedded: {
        nextepisode: {
          name: "Inde Navarrette / Gracie Abrams",
          airdate: "2026-10-31",
          type: "regular",
        },
      },
    }
    const fetchImpl = async (url) => {
      calls.push(String(url))
      if (calls.length === 1) return { ok: false, status: 503, json: async () => ({}) }
      return { ok: true, status: 200, json: async () => payload }
    }
    const schedule = await loadSchedule(fetchImpl)
    expect(calls[0]).toContain("/shows/361")
    expect(calls[1]).toContain("singlesearch")
    expect(schedule.next.airdate).toBe("2026-10-31")
    expect(episodeFrom({ name: "Nope" })).toBeNull()
  })

  it("throws when every schedule request fails", async () => {
    const fetchImpl = async () => {
      throw new Error("offline")
    }
    await expect(loadSchedule(fetchImpl)).rejects.toThrow("offline")
  })
})
