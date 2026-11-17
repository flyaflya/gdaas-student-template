#!/usr/bin/env node
/**
 * npm run try-capstone [-- <url>] [-- --domain staffing]
 *
 * Challenge 5 practice runs, without spending a battery run. Generates six
 * fresh sample probes for your domain, sends them to YOUR
 * /api/capstone/decide (local dev server by default), and prints your
 * answer next to the correct one:
 *
 *   npm run try-capstone                                    # local dev server
 *   npm run try-capstone -- https://your-site.vercel.app    # deployed site
 *   npm run try-capstone -- --domain pricing                # before your meta route exists
 *
 * Your domain comes from your /api/capstone/meta. If that route isn't built
 * yet, pass --domain. With neither, the script sends two probes from each
 * of the four domains so you can see what each one looks like.
 *
 * Every probe your service answers is saved to Supabase, so after a run
 * your /capstone page shows the last one. Run it again and the page should
 * change: new data, new numbers, maybe a new recommendation.
 *
 * The sample probes and the grading rules live in scripts/capstone-probes.mjs,
 * a small reimplementation of the course grader that selfcheck also uses.
 */

import { DOMAINS, drawProbe, grade, round2 } from "./capstone-probes.mjs";

const args = process.argv.slice(2);
const domainFlag = args.indexOf("--domain");
const forcedDomain = domainFlag >= 0 ? args[domainFlag + 1] : null;
const urlArg = args.find((a, i) => !a.startsWith("--") && (domainFlag < 0 || i !== domainFlag + 1));
const siteUrl = (urlArg ?? "http://localhost:3000").replace(/\/+$/, "");
const TIMEOUT_MS = 10_000;

// ── Which domain? ──────────────────────────────────────────────────────────
async function declaredDomain() {
  try {
    const res = await fetch(`${siteUrl}/api/capstone/meta`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    const body = await res.json();
    return DOMAINS.includes(body?.domain) ? body.domain : null;
  } catch {
    return null;
  }
}

if (forcedDomain && !DOMAINS.includes(forcedDomain)) {
  console.log(`--domain must be one of ${DOMAINS.join(", ")} (got "${forcedDomain}")`);
  process.exit(1);
}
const domain = forcedDomain ?? (await declaredDomain());
const plan = domain ? Array(6).fill(domain) : DOMAINS.flatMap((d) => [d, d]);
const samples = plan.map((d, i) => drawProbe(d, i + 1));

console.log(`\nTry-capstone against ${siteUrl}`);
console.log(
  domain
    ? `Domain: ${domain}${forcedDomain ? " (from --domain)" : " (from your /api/capstone/meta)"}\n`
    : "No domain declared yet (your meta route isn't built), so this run sends two probes from each domain.\n"
);

let failures = 0;
for (const sample of samples) {
  const { probe } = sample;
  let res;
  const started = Date.now();
  try {
    res = await fetch(`${siteUrl}/api/capstone/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(probe),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    console.log(
      timedOut
        ? `  \u2717 ${probe.probeId} (${probe.domain}): no answer within 10 seconds`
        : `  \u2717 ${probe.probeId}: could not connect. Is the dev server running at ${siteUrl}?`
    );
    failures++;
    continue;
  }
  const seconds = (Date.now() - started) / 1000;
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      if (body?.error) detail = `: ${body.error}`;
    } catch {
      // not JSON; the status code is all we have
    }
    console.log(`  \u2717 ${probe.probeId} (${probe.domain}): HTTP ${res.status} from POST /api/capstone/decide${detail}`);
    failures++;
    continue;
  }
  let answer = null;
  try {
    answer = await res.json();
  } catch {
    console.log(`  \u2717 ${probe.probeId}: the response was not valid JSON`);
    failures++;
    continue;
  }
  const miss = grade(sample, answer);
  if (miss === null) {
    console.log(`  \u2713 ${probe.probeId} (${probe.domain}): correct (answered in ${seconds.toFixed(1)}s)`);
  } else {
    console.log(`  \u2717 ${probe.probeId} (${probe.domain}): ${miss}`);
    failures++;
  }
  const yours = `${answer.action} = ${answer.expectedValue}`;
  const all = [...sample.values].sort((a, b) => b[1] - a[1]).map(([id, v]) => `${id} ${round2(v)}`).join(", ");
  console.log(`      yours:   ${yours}`);
  console.log(`      correct: ${all}`);
}

console.log("");
if (failures === 0) {
  console.log(`All ${samples.length} sample probes answered correctly. Every run draws fresh data, so`);
  console.log("run it a few times. The battery sends 15. Open /capstone after each run:");
  console.log("the report should change with the data. Next: npm run selfcheck.");
  process.exit(0);
} else {
  console.log(
    `${failures} probe${failures === 1 ? "" : "s"} failing. Read the reason on each \u2717 line, fix valueOf() in the decide route, and run again: this script is unlimited, the battery is not.`
  );
  process.exit(1);
}
