import { NextResponse } from "next/server";
import { saveLatest } from "@/lib/capstone-store";
import { groupMean, mean, type CapstoneAnswer, type CapstoneProbe } from "@/lib/capstone-helpers";

/**
 * Challenge 5: the capstone's decision service. Step 4 of the build guide
 * ("Build Your Capstone", end of Lane 5 in the course book) explains every
 * line. Everything here is complete EXCEPT valueOf(), which is yours to
 * write for the domain you chose (Step 4b).
 */

// TODO(yours): Step 4b of the build guide. Return the expected value of one
// candidate, computed on probe.history exactly as probe.scenario.valueDefinition
// says. The candidate id tells you which shop, quantity, price, or channel
// it is (for example "shop-4", "qty-52", "price-23", "channel-email").
// groupMean and mean are imported above for you.
function valueOf(probe: CapstoneProbe, candidateId: string): number | null {
  return null;
}

export async function POST(req: Request) {
  const probe = (await req.json().catch(() => null)) as CapstoneProbe | null;
  if (!probe || !Array.isArray(probe.history) || !Array.isArray(probe.candidates)) {
    return NextResponse.json(
      { error: "expected a JSON probe with a `history` list and a `candidates` list" },
      { status: 400 }
    );
  }

  const values: { id: string; label: string; value: number }[] = [];
  for (const c of probe.candidates) {
    const value = valueOf(probe, c.id);
    if (value === null || !Number.isFinite(value)) {
      return NextResponse.json(
        { error: `valueOf() returned no number for ${c.id} (Step 4b of the build guide)` },
        { status: 501 }
      );
    }
    values.push({ id: c.id, label: c.label, value });
  }
  values.sort((a, b) => b.value - a.value);
  const [best, next] = values;

  const answer: CapstoneAnswer = {
    action: best.id,
    expectedValue: Number(best.value.toFixed(2)),
    reasoning:
      `${best.label} has the highest expected value on the ${probe.history.length} rows sent: ` +
      `${best.value.toFixed(2)}, against ${next ? next.value.toFixed(2) : "nothing"} for the next best (${next?.label ?? "none"}).`,
    values,
  };

  // Save the whole probe (every history row) so the report can chart it.
  await saveLatest(probe, answer);

  return NextResponse.json(answer);
}
