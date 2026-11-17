/**
 * Course-provided helpers for Challenge 5. Complete: you do not need to
 * change this file. The build guide ("Build Your Capstone", end of Lane 5 in
 * the course book) prints it and explains each function.
 *
 * - The probe and answer types, so your editor can autocomplete fields.
 * - mean, groupMean, quantile: the averages your valuation needs.
 * - seededRandom, bootstrap: a repeatable way to put a range on any number
 *   computed from the history (for the report's "how confident?" section
 *   and its projection). Same seed, same range, so the page does not change
 *   every time someone reloads it.
 */

export type Domain = "staffing" | "inventory" | "pricing" | "channels";

/** One history row. The fields depend on the domain (see the guide). */
export type Row = Record<string, number | string>;

export interface CapstoneProbe {
  probeId: string;
  type: "capstone-decision";
  domain: Domain;
  scenario: {
    narrative: string;
    params: Record<string, number | string>;
    /** One sentence that says exactly how expectedValue is computed. */
    valueDefinition: string;
  };
  history: Row[];
  candidates: { id: string; label: string }[];
}

export interface CapstoneAnswer {
  action: string;
  expectedValue: number;
  reasoning: string;
  /** Every candidate's value, best first. The report can chart these. */
  values?: { id: string; label: string; value: number }[];
}

/** The average of a list of numbers (NaN for an empty list). */
export function mean(xs: number[]): number {
  if (xs.length === 0) return Number.NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** The average of one field over the rows that pass a test. */
export function groupMean(rows: Row[], where: (r: Row) => boolean, field: string): number {
  return mean(rows.filter(where).map((r) => Number(r[field])));
}

/** The q-th quantile (q between 0 and 1) of a list of numbers. */
export function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return Number.NaN;
  const sorted = [...xs].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/**
 * A random-number function that gives the same sequence for the same seed.
 * Seed it with the probe id so the report shows the same range on every
 * reload of the same probe.
 */
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Bootstrap: re-draw the history many times (rows picked at random, with
 * replacement), recompute your number on each re-drawn history, and report
 * the middle 90% of the results. That range shows how much the number could
 * move if the days had come out a little differently.
 *
 * `within` keeps each group's size fixed while re-drawing (for example,
 * (r) => `${r.shop}-${r.boss}` keeps every shop's boss days and other days
 * at their real counts). Leave it out to re-draw all rows together.
 */
export function bootstrap(
  rows: Row[],
  statistic: (rows: Row[]) => number,
  options: { seed: string; draws?: number; within?: (r: Row) => string }
): { low: number; median: number; high: number; draws: number[] } {
  const rand = seededRandom(options.seed);
  const n = options.draws ?? 1000;
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const key = options.within ? options.within(r) : "all";
    const list = groups.get(key);
    if (list) list.push(r);
    else groups.set(key, [r]);
  }
  const results: number[] = [];
  for (let i = 0; i < n; i++) {
    const redrawn: Row[] = [];
    for (const list of groups.values()) {
      for (let k = 0; k < list.length; k++) {
        redrawn.push(list[Math.floor(rand() * list.length)]);
      }
    }
    const v = statistic(redrawn);
    if (Number.isFinite(v)) results.push(v);
  }
  return {
    low: quantile(results, 0.05),
    median: quantile(results, 0.5),
    high: quantile(results, 0.95),
    draws: results,
  };
}
