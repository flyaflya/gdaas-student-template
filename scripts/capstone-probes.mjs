/**
 * Sample Challenge 5 probes and grading, shared by try-capstone.mjs and
 * selfcheck.mjs. A small, deliberate reimplementation of the course grader
 * (course-platform/src/lib/challenges/capstone.ts): the same data, the same
 * guards that keep every winner clear, and the same grading rules. If the
 * wire contract evolves, re-sync by hand.
 */

export const DOMAINS = ["staffing", "inventory", "pricing", "channels"];

// ── A small seeded random-number generator (fresh seed every run) ──────────
let state = (Date.now() ^ 0x27d4eb2f) >>> 0;
function rand() {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (a, b) => a + Math.floor(rand() * (b - a + 1));
const uniform = (a, b, d = 2) => Math.round((a + rand() * (b - a)) * 10 ** d) / 10 ** d;
const pick = (xs) => xs[Math.floor(rand() * xs.length)];
function normal(m, sd) {
  const u1 = Math.max(rand(), 1e-12);
  return m + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rand());
}
function shuffle(xs) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
export const round2 = (v) => Math.round(v * 100) / 100;

// ── The four domains (as in the course grader) ────────────────────────────
// Each domain has two stories, and consecutive probes alternate between
// them, as in the battery. params.reader names who the report is for.
const STAFFING = [
  { reader: "Patrick", unit: "cars fixed", place: "auto repair shop",
    narrative: (price) => `Patrick runs 5 auto repair shops and can be present at exactly one shop per day. The history below records, for each shop-day, whether the boss was present and how many cars were fixed. Each fixed car is worth $${price}. Which shop should get his presence next week?` },
  { reader: "Dana", unit: "orders shipped", place: "fulfillment depot",
    narrative: (price) => `Dana supervises 5 fulfillment depots and can work from exactly one depot per day. The history below records, for each depot-day, whether she was on site and how many orders shipped. Each shipped order is worth $${price} in margin. Which depot should get her presence next week?` },
];
const INVENTORY = [
  { reader: "the bakery owner", item: "artisan loaves",
    narrative: (cost, price, salvage) => `A bakery must commit tomorrow's production of artisan loaves tonight. Each loaf costs $${cost} to make and sells for $${price}; unsold loaves are cleared for $${salvage} each. The history below is daily demand. How many loaves should be baked?` },
  { reader: "the stall manager", item: "fresh poke bowls",
    narrative: (cost, price, salvage) => `A campus food stall preps poke bowls each morning. Each bowl costs $${cost} in ingredients and sells for $${price}; unsold bowls go to the staff fridge, worth $${salvage} each. The history below is daily demand. How many bowls should be prepped?` },
];
const PRICING = [
  { reader: "the product team", item: "monthly subscription", unit: "signups",
    narrative: (cost) => `A software company A/B tested its subscription at several monthly price points, recording daily signups at each. Serving a subscriber costs $${cost}/month. The history below is (price tested, signups that day). Which price tier should become the standard?` },
  { reader: "the car wash owner", item: "car wash package", unit: "packages sold",
    narrative: (cost) => `A car wash rotated its premium package through several price points, recording daily sales at each. Each wash costs $${cost} in supplies and labor. The history below is (price tested, packages sold that day). Which price should the package settle at?` },
];
const CHANNELS = [
  { reader: "the marketing team", names: ["search", "social", "email", "events"],
    narrative: (budget) => `A marketing team tested each channel at a LOW and a HIGH weekly spend, recording weekly revenue. Next quarter there is $${budget}/week of extra budget, enough to move exactly ONE channel from low to high spend (the history shows the extra cost is exactly $${budget}). Which channel should get it?` },
  { reader: "the gym chain's owner", names: ["radio", "flyers", "sponsorship", "online"],
    narrative: (budget) => `A regional gym chain tested each advertising channel at a LOW and a HIGH weekly spend, recording weekly revenue from new signups. There is $${budget}/week of new budget, enough to move exactly ONE channel from low to high (the history shows the extra cost is exactly $${budget}). Which channel should get it?` },
];

function staffing(i) {
  const skin = STAFFING[i % 2];
  const price = pick([40, 50, 60, 80]);
  for (;;) {
    const bases = Array.from({ length: 5 }, () => uniform(10, 45, 1));
    const ups = Array.from({ length: 5 }, () => uniform(0.5, 9, 1));
    const history = [];
    for (let shop = 1; shop <= 5; shop++) {
      const bossDays = int(8, 12);
      const total = int(26, 32);
      for (let d = 0; d < total; d++) {
        const boss = d < bossDays ? 1 : 0;
        history.push({ shop, boss, outcome: Math.max(0, Math.round(bases[shop - 1] + boss * ups[shop - 1] + normal(0, 2.2))) });
      }
    }
    const lift = (s) =>
      mean(history.filter((r) => r.shop === s && r.boss === 1).map((r) => r.outcome)) -
      mean(history.filter((r) => r.shop === s && r.boss === 0).map((r) => r.outcome));
    const values = [1, 2, 3, 4, 5].map((s) => lift(s) * price);
    const sorted = [...values].sort((a, b) => b - a);
    const best = values.indexOf(sorted[0]);
    if ((sorted[0] - sorted[1]) / price < 2.0 || best !== ups.indexOf(Math.max(...ups))) continue;
    return {
      probe: {
        probeId: `try-capstone-${i}`,
        type: "capstone-decision",
        domain: "staffing",
        scenario: {
          narrative: skin.narrative(price),
          params: { valuePerUnit: price, unit: skin.unit, reader: skin.reader },
          valueDefinition: `expectedValue = (mean ${skin.unit} on boss-present days − mean ${skin.unit} on boss-absent days, at your recommended location, computed on the history sent) × ${price}`,
        },
        history: shuffle(history),
        candidates: [1, 2, 3, 4, 5].map((s) => ({ id: `shop-${s}`, label: `${skin.place} ${s}` })),
      },
      values: values.map((v, k) => [`shop-${k + 1}`, v]),
    };
  }
}

function inventory(i) {
  const skin = INVENTORY[i % 2];
  for (;;) {
    const cost = pick([3, 4, 5]);
    const price = cost + pick([4, 5, 6]);
    const salvage = pick([0, 1]);
    const mu = int(38, 62);
    const sd = uniform(6, 12, 1);
    const days = int(110, 130);
    const history = Array.from({ length: days }, (_, d) => ({ day: d + 1, demand: Math.max(0, Math.round(normal(mu, sd))) }));
    const demands = history.map((r) => r.demand);
    const s = [...demands].sort((a, b) => a - b);
    const qLow = s[Math.floor(days * 0.25)];
    const qHigh = s[Math.floor(days * 0.95)];
    const step = Math.max(2, Math.round((qHigh - qLow) / 4));
    const qs = Array.from({ length: 5 }, (_, k) => qLow + k * step);
    const ev = (q) => mean(demands.map((d) => price * Math.min(d, q) + salvage * Math.max(0, q - d) - cost * q));
    const values = qs.map(ev);
    const sorted = [...values].sort((a, b) => b - a);
    if (sorted[0] - sorted[1] < 2.5) continue;
    return {
      probe: {
        probeId: `try-capstone-${i}`,
        type: "capstone-decision",
        domain: "inventory",
        scenario: {
          narrative: skin.narrative(cost, price, salvage),
          params: { unitCost: cost, salePrice: price, salvageValue: salvage, item: skin.item, reader: skin.reader },
          valueDefinition: "expectedValue = average daily profit at your recommended quantity q, computed over every day in the history sent: mean of (salePrice × min(demand, q) + salvageValue × max(q − demand, 0) − unitCost × q)",
        },
        history,
        candidates: qs.map((q) => ({ id: `qty-${q}`, label: `${q} ${skin.item}` })),
      },
      values: qs.map((q, k) => [`qty-${q}`, values[k]]),
    };
  }
}

function pricing(i) {
  const skin = PRICING[i % 2];
  for (;;) {
    const cost = pick([4, 6, 8]);
    const base = int(15, 25);
    const tiers = Array.from({ length: 4 }, (_, k) => base + k * pick([3, 4]));
    const b = uniform(1.2, 2.4, 2);
    const a = uniform(b * tiers[3] + 12, b * tiers[3] + 30, 1);
    const daysPer = int(22, 30);
    const history = [];
    for (const p of tiers) for (let d = 0; d < daysPer; d++) history.push({ price: p, unitsSold: Math.max(0, Math.round(a - b * p + normal(0, 2.5))) });
    const values = tiers.map((p) => (p - cost) * mean(history.filter((r) => r.price === p).map((r) => r.unitsSold)));
    const sorted = [...values].sort((x, y) => y - x);
    const trueP = tiers.map((p) => (p - cost) * (a - b * p));
    if (sorted[0] - sorted[1] < 6 || values.indexOf(sorted[0]) !== trueP.indexOf(Math.max(...trueP))) continue;
    return {
      probe: {
        probeId: `try-capstone-${i}`,
        type: "capstone-decision",
        domain: "pricing",
        scenario: {
          narrative: skin.narrative(cost),
          params: { unitCost: cost, item: skin.item, unit: skin.unit, reader: skin.reader },
          valueDefinition: "expectedValue = daily profit at your recommended price p, computed on the history sent: (p − unitCost) × (mean unitsSold across the history days tested at price p)",
        },
        history: shuffle(history),
        candidates: tiers.map((p) => ({ id: `price-${p}`, label: `$${p} ${skin.item}` })),
      },
      values: tiers.map((p, k) => [`price-${p}`, values[k]]),
    };
  }
}

function channels(i) {
  const skin = CHANNELS[i % 2];
  const names = skin.names;
  for (;;) {
    const budget = pick([500, 750, 1000]);
    const history = [];
    const lifts = [];
    for (const ch of names) {
      const low = int(4, 8) * 100;
      const baseRev = uniform(2000, 5000, 0);
      const lift = uniform(0.3, 2.2, 2) * budget;
      lifts.push(lift);
      const weeks = int(10, 14);
      for (const level of ["low", "high"]) {
        for (let w = 0; w < weeks; w++) {
          history.push({
            channel: ch,
            spendLevel: level,
            weeklySpend: level === "low" ? low : low + budget,
            revenue: Math.round(baseRev + (level === "high" ? lift : 0) + normal(0, 120)),
          });
        }
      }
    }
    const at = (ch, level) => mean(history.filter((r) => r.channel === ch && r.spendLevel === level).map((r) => r.revenue));
    const values = names.map((ch) => at(ch, "high") - at(ch, "low") - budget);
    const sorted = [...values].sort((x, y) => y - x);
    if (sorted[0] - sorted[1] < 100 || values.indexOf(sorted[0]) !== lifts.indexOf(Math.max(...lifts))) continue;
    return {
      probe: {
        probeId: `try-capstone-${i}`,
        type: "capstone-decision",
        domain: "channels",
        scenario: {
          narrative: skin.narrative(budget),
          params: { extraBudget: budget, unit: "weekly revenue", reader: skin.reader },
          valueDefinition: "expectedValue = net weekly gain at your recommended channel, computed on the history sent: (mean revenue at HIGH spend − mean revenue at LOW spend) − extraBudget",
        },
        history: shuffle(history),
        candidates: names.map((c) => ({ id: `channel-${c}`, label: c })),
      },
      values: names.map((c, k) => [`channel-${c}`, values[k]]),
    };
  }
}

const DRAW = { staffing, inventory, pricing, channels };

/** One fresh sample probe for a domain, with every candidate's correct value. */
export function drawProbe(domain, i, prefix = "try-capstone") {
  const sample = DRAW[domain](i);
  sample.probe.probeId = `${prefix}-${i}`;
  return sample;
}

// ── Grading (mirrors the platform's rules) ─────────────────────────────────
export function grade(sample, ans) {
  const ids = sample.probe.candidates.map((c) => c.id);
  if (typeof ans?.action !== "string" || !ids.includes(ans.action)) return `\`action\` must be one of ${JSON.stringify(ids)}`;
  const ev = typeof ans.expectedValue === "number" ? ans.expectedValue : Number(ans.expectedValue);
  if (!Number.isFinite(ev)) return "`expectedValue` must be a number";
  if (typeof ans.reasoning !== "string" || ans.reasoning.trim().length < 10) return "`reasoning` must be a short plain-language sentence";
  const [bestId, bestValue] = [...sample.values].sort((a, b) => b[1] - a[1])[0];
  if (ans.action !== bestId) return `action is "${ans.action}", correct is "${bestId}"`;
  const tol = Math.max(0.75, Math.abs(bestValue) * 0.01);
  if (Math.abs(ev - bestValue) > tol) return `expectedValue is ${ev}, correct is ${round2(bestValue)} (tolerance ±${round2(tol)})`;
  return null;
}
