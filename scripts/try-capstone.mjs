#!/usr/bin/env node
/**
 * npm run try-capstone [-- <url>] [-- --domain staffing]
 *
 * Challenge 5 practice runs, without spending a battery run:
 *
 *   1. Sends YOUR problem (my-problem.json, downloaded from the Capstone
 *      page) to your /api/capstone/decide and asks the course grader whether
 *      the answer passes. Your problem never changes, so after this your
 *      /capstone page shows it.
 *   2. Sends 5 fresh practice problems from the same story, and prints your
 *      numbers next to the grader's.
 *
 *   npm run try-capstone                                    # local dev server
 *   npm run try-capstone -- https://your-site.vercel.app    # deployed site
 *   npm run try-capstone -- --domain pricing                # before your meta route exists
 *
 * The domain comes from my-problem.json, then from your /api/capstone/meta,
 * then from --domain. Problems and grading come from the course platform
 * (see scripts/capstone-probes.mjs), so you need an internet connection.
 */

import {
  DOMAINS,
  MY_PROBLEM_FILE,
  PLATFORM,
  askSite,
  checkAnswer,
  describeOutcomes,
  fetchPractice,
  readMyProblem,
} from "./capstone-probes.mjs";

const args = process.argv.slice(2);
const domainFlag = args.indexOf("--domain");
const forcedDomain = domainFlag >= 0 ? args[domainFlag + 1] : null;
const urlArg = args.find((a, i) => !a.startsWith("--") && (domainFlag < 0 || i !== domainFlag + 1));
const siteUrl = (urlArg ?? "http://localhost:3000").replace(/\/+$/, "");
const TIMEOUT_MS = 10_000;

if (forcedDomain && !DOMAINS.includes(forcedDomain)) {
  console.log(`--domain must be one of ${DOMAINS.join(", ")} (got "${forcedDomain}")`);
  process.exit(1);
}

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

const mine = readMyProblem();
const domain = mine?.domain ?? (await declaredDomain()) ?? forcedDomain;

console.log(`\nTry-capstone against ${siteUrl} (grading by ${PLATFORM})`);
if (!domain) {
  console.log(
    `No domain yet. Download ${MY_PROBLEM_FILE} from the Capstone page on the course platform and put it in the project folder, or pass --domain.`
  );
  process.exit(1);
}
console.log(`Domain: ${domain}\n`);

let failures = 0;

async function tryOne(probe, label, correct) {
  const started = Date.now();
  const { answer, error } = await askSite(siteUrl, probe, TIMEOUT_MS);
  if (error) {
    console.log(`  \u2717 ${label}: ${error}`);
    failures++;
    return;
  }
  const seconds = (Date.now() - started) / 1000;
  let miss;
  try {
    miss = await checkAnswer(probe, answer);
  } catch (err) {
    console.log(`  \u2717 ${label}: ${err instanceof Error ? err.message : String(err)}`);
    failures++;
    return;
  }
  if (miss === null) {
    console.log(`  \u2713 ${label}: correct (answered in ${seconds.toFixed(1)}s)`);
  } else {
    console.log(`  \u2717 ${label}: ${miss}`);
    failures++;
  }
  const chosen = probe.candidates.find((c) => c.id === answer.action)?.label ?? String(answer.action);
  console.log(`      yours:   choose ${chosen}`);
  for (const line of describeOutcomes(probe, answer.outcomes)) console.log(`               ${line}`);
  if (correct) {
    const right = probe.candidates.find((c) => c.id === correct.actionId)?.label ?? correct.actionId;
    console.log(`      correct: choose ${right}`);
    for (const line of describeOutcomes(probe, correct.outcomes)) console.log(`               ${line}`);
  }
}

// 1. Your own problem.
if (mine) {
  console.log(`Your problem (${MY_PROBLEM_FILE}):`);
  await tryOne(mine, "your problem", null);
} else {
  console.log(
    `No ${MY_PROBLEM_FILE} in the project folder. Download it from the Capstone page on the course platform; until then this run sends practice problems only.`
  );
  failures++;
}

// 2. Practice problems from the same story.
let practice = [];
try {
  practice = await fetchPractice(domain, 5);
} catch (err) {
  console.log(`\nCould not get practice problems: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
console.log("\nPractice problems (fresh every run):");
for (const [i, { probe, correct }] of practice.entries()) {
  await tryOne(probe, `practice ${i + 1}`, correct);
}

console.log("");
if (failures === 0) {
  console.log("Your problem and all 5 practice problems pass. The battery sends 14 test");
  console.log("problems plus yours. Open /capstone: it shows your problem. Next: npm run selfcheck.");
  process.exit(0);
} else {
  console.log(
    `${failures} failing. Read the reason on each \u2717 line, fix simulateRun() in src/lib/capstone-simulate.ts, and run again: this script is unlimited, the battery is not.`
  );
  process.exit(1);
}
