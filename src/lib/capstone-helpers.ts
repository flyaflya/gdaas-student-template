/**
 * Course-provided helpers for Challenge 5. Complete: you do not need to
 * change this file. The build guide ("Build Your Capstone", end of Lane 5 in
 * the course book) prints it and explains each function.
 *
 * - The problem and answer types, so your editor can autocomplete fields.
 * - seededRandom: random numbers that repeat for the same seed, so the same
 *   problem gives the same answer and the same report every time.
 * - draw: one random draw for a node of the problem's recipe.
 * - summarize: the typical result, the 90% interval, and the chance of
 *   falling short, from a list of simulated results.
 */

export type Domain = "staffing" | "inventory" | "pricing" | "channels";

/** Runs per option. Every problem states it in scenario.params.runs. */
export const RUNS = 10_000;

/** One history row. The fields depend on the domain (see the guide). */
export type Row = Record<string, number | string>;

/** One node of the recipe (the problem's DAG). */
export interface DagNode {
  id: string;
  /** What the node means, in plain words. Show these on your report. */
  plain: string;
  /** "once" per run, "daily" or "weekly" (drawn every day or week of the
   *  period), or "result" (worked out from the other nodes). */
  repeat: "once" | "daily" | "weekly" | "result";
  /** For drawn nodes: `mean` is a number or the id of another node. */
  draw?: { type: "normal"; mean: number | string; sd: number };
  /** For uncertain averages: how many past days or weeks they rest on. */
  basedOn?: number;
  /** For result nodes: which option it belongs to, and how to work it out. */
  option?: string;
  compute?: string;
}

export interface CapstoneProbe {
  probeId: string;
  type: "capstone-decision";
  domain: Domain;
  /** True only for your own problem. Your report shows that one. */
  yours: boolean;
  scenario: {
    narrative: string;
    params: Record<string, number | string>;
    /** How to choose, in a few sentences. */
    decisionRule: string;
  };
  history: Row[];
  /** Always two options. */
  candidates: { id: string; label: string }[];
  limit: {
    /** A run falls short when its result is below this number. */
    atLeast: number;
    /** The largest share of runs that may fall short (0.1 = 1 in 10). */
    maxChance: number;
    /** The limit in the reader's own words. */
    plain: string;
  };
  dag: { nodes: DagNode[]; edges: [string, string][] };
}

/** What one option's 10,000 results look like. */
export interface Outcome {
  /** The middle result: half the runs come out above it, half below. */
  typical: number;
  /** 90% interval: 5 runs in 100 come out below `low`, 5 above `high`. */
  low: number;
  high: number;
  /** Share of runs below the reader's limit (0.07 = 7 runs in 100). */
  chanceShort: number;
}

export interface CapstoneAnswer {
  action: string;
  outcomes: Record<string, Outcome>;
  /** Share of runs in which the chosen option beats the other one. */
  chanceActionBeatsOther: number;
  reasoning: string;
}

/**
 * A random-number function that gives the same sequence for the same seed.
 * Seed it with the probe id so the same problem gives the same results.
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

/** One draw from a bell curve with this center and spread. */
export function normal(rand: () => number, center: number, spread: number): number {
  let u = 0;
  while (u === 0) u = rand();
  return center + spread * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/** The recipe node with this id (throws if the problem has no such node). */
export function node(probe: CapstoneProbe, id: string): DagNode {
  const n = probe.dag.nodes.find((x) => x.id === id);
  if (!n) throw new Error(`the recipe has no node "${id}"`);
  return n;
}

/**
 * One random draw for a recipe node. When the node's center is another
 * node (for example, a day's cars depend on the shop's average), pass the
 * value you drew for that node as `center`.
 */
export function draw(probe: CapstoneProbe, rand: () => number, id: string, center?: number): number {
  const n = node(probe, id);
  if (!n.draw) throw new Error(`node "${id}" is a result, not a draw`);
  const m = typeof n.draw.mean === "number" ? n.draw.mean : center;
  if (m === undefined) {
    throw new Error(`node "${id}" is centered on "${n.draw.mean}": pass the value you drew for it`);
  }
  return normal(rand, m, n.draw.sd);
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** The typical result, the 90% interval, and the chance of falling below `atLeast`. */
export function summarize(results: number[], atLeast: number): Outcome {
  const sorted = [...results].sort((a, b) => a - b);
  return {
    typical: quantile(sorted, 0.5),
    low: quantile(sorted, 0.05),
    high: quantile(sorted, 0.95),
    chanceShort: results.filter((x) => x < atLeast).length / results.length,
  };
}
