/**
 * Challenge 5 practice problems and grading, shared by try-capstone.mjs and
 * selfcheck.mjs. Both come from the course platform, so they always match
 * the real grader:
 *
 *   GET  /api/challenge/capstone/practice?domain=...&count=...
 *        fresh test problems for one domain, with the grader's numbers
 *   POST /api/challenge/capstone/check  { probe, answer }
 *        whether an answer to any problem passes (your own problem too);
 *        it never returns the correct numbers
 *
 * Your own problem is my-problem.json in the project folder. Download it
 * from the Capstone page on the course platform.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const DOMAINS = ["staffing", "inventory", "pricing", "channels"];
export const PLATFORM = (process.env.COURSE_PLATFORM_URL ?? "https://henscale.app").replace(/\/+$/, "");
export const MY_PROBLEM_FILE = "my-problem.json";
const TIMEOUT_MS = 30_000;

/** Your own problem from my-problem.json, or null if the file isn't there. */
export function readMyProblem() {
  const path = resolve(process.cwd(), MY_PROBLEM_FILE);
  if (!existsSync(path)) return null;
  try {
    const probe = JSON.parse(readFileSync(path, "utf8"));
    return probe?.type === "capstone-decision" && probe.yours === true ? probe : null;
  } catch {
    return null;
  }
}

/** `count` fresh test problems for one domain: [{ probe, correct }]. */
export async function fetchPractice(domain, count) {
  const res = await fetch(`${PLATFORM}/api/challenge/capstone/practice?domain=${domain}&count=${count}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`the course platform answered HTTP ${res.status} for practice problems`);
  const body = await res.json();
  return body.problems;
}

/** Asks the grader whether `answer` passes. Returns null when it does, else the reason. */
export async function checkAnswer(probe, answer) {
  const res = await fetch(`${PLATFORM}/api/challenge/capstone/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ probe, answer }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`the course platform answered HTTP ${res.status} when checking an answer`);
  const body = await res.json();
  return body.ok ? null : `${body.aspect}: ${body.reason}`;
}

const fmt = (v) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v).toLocaleString("en-US") : String(v));
const pct = (v) => (typeof v === "number" && Number.isFinite(v) ? `${Math.round(v * 100)} in 100` : String(v));

/** One line per option: typical result, 90% interval, chance of falling short. */
export function describeOutcomes(probe, outcomes) {
  return probe.candidates.map((c) => {
    const o = outcomes?.[c.id];
    if (!o) return `${c.label}: (missing)`;
    return `${c.label}: typical ${fmt(o.typical)}, 90% interval ${fmt(o.low)} to ${fmt(o.high)}, short ${pct(o.chanceShort)}`;
  });
}

/** Sends one problem to the student's decide route. Returns { answer } or { error }. */
export async function askSite(siteUrl, probe, timeoutMs = 10_000) {
  let res;
  try {
    res = await fetch(`${siteUrl}/api/capstone/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(probe),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return {
      error: timedOut
        ? `no answer within ${timeoutMs / 1000} seconds`
        : `could not connect. Is the dev server running at ${siteUrl}?`,
    };
  }
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      if (body?.error) detail = `: ${body.error}`;
    } catch {
      // not JSON; the status code is all we have
    }
    return { error: `HTTP ${res.status} from POST /api/capstone/decide${detail}` };
  }
  try {
    return { answer: await res.json() };
  } catch {
    return { error: "the response was not valid JSON" };
  }
}
