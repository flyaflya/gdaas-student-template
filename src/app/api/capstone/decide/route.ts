import { NextResponse } from "next/server";
import { saveLatest } from "@/lib/capstone-store";
import { summarize, type CapstoneAnswer, type CapstoneProbe, type Outcome } from "@/lib/capstone-helpers";
import { simulateAll } from "@/lib/capstone-simulate";

/**
 * Challenge 5: the capstone's decision service. Step 4 of the build guide
 * ("Build Your Capstone", end of Lane 5 in the course book) explains every
 * line. This file is complete: the part you write is simulateRun() in
 * src/lib/capstone-simulate.ts.
 */
export async function POST(req: Request) {
  const probe = (await req.json().catch(() => null)) as CapstoneProbe | null;
  if (!probe || !Array.isArray(probe.candidates) || !Array.isArray(probe.dag?.nodes) || !probe.limit) {
    return NextResponse.json(
      { error: "expected a JSON problem with `candidates`, `dag`, and `limit`" },
      { status: 400 }
    );
  }

  const results = simulateAll(probe);
  if (results === null) {
    return NextResponse.json(
      { error: "simulateRun() is not written yet (Step 4b of the build guide)" },
      { status: 501 }
    );
  }

  // What each option's results look like.
  const outcomes: Record<string, Outcome> = {};
  for (const c of probe.candidates) outcomes[c.id] = summarize(results[c.id], probe.limit.atLeast);

  // The rule: among the options that fall short no more often than the
  // reader allows, take the one with the higher typical result. If neither
  // (or both) meet the limit, take the higher typical result.
  const [a, b] = probe.candidates;
  const higher = outcomes[a.id].typical >= outcomes[b.id].typical ? a : b;
  const safe = probe.candidates.filter((c) => outcomes[c.id].chanceShort <= probe.limit.maxChance);
  const choice = safe.length === 1 ? safe[0] : higher;
  const other = choice.id === a.id ? b : a;

  // How often the choice comes out ahead, run by run.
  const mine = results[choice.id];
  const theirs = results[other.id];
  const wins = mine.filter((x, i) => x > theirs[i]).length;

  const answer: CapstoneAnswer = {
    action: choice.id,
    outcomes,
    chanceActionBeatsOther: wins / mine.length,
    reasoning:
      `${choice.label} falls short of ${probe.limit.atLeast} in ` +
      `${Math.round(outcomes[choice.id].chanceShort * 100)} of 100 runs; ` +
      `${other.label} falls short in ${Math.round(outcomes[other.id].chanceShort * 100)} of 100.`,
  };

  // Only your own problem is saved, so your report always shows it.
  if (probe.yours === true) {
    try {
      await saveLatest(probe, answer);
    } catch (err) {
      return NextResponse.json(
        { error: `could not save your problem: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(answer);
}
