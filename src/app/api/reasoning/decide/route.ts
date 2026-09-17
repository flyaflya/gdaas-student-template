import { NextResponse } from "next/server";
import { notBuiltYet } from "@/lib/not-built-yet";
import { saveLatest, type ProblemType } from "@/lib/reasoning-store";

/**
 * ── Challenge 2, step 4: the brain ────────────────────────────────────────
 * Why this route exists: this is the decision endpoint. The grader POSTs a
 * JSON problem here (one of three types) and your code must answer it,
 * correctly, in under 10 seconds, with no human involved. Everything Lane 2
 * taught your brain, this route teaches your website.
 *
 * The three TODO blocks below map one-to-one onto stations you have already
 * passed. The build guide (course book, end of Lane 2) walks through each
 * one and shows the finished code; the wire contract with example problems
 * lives on the Challenge 2 page.
 *
 * The plumbing (parse, save, respond) is already written. Until you fill in
 * an answer, unanswered problems return 501: honestly unfinished, never
 * faked.
 */
export async function POST(req: Request) {
  const problem = await req.json().catch(() => null);
  if (!problem || typeof problem.type !== "string") {
    return NextResponse.json(
      { error: "expected a JSON problem with a `type` field" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let answer: Record<string, any> | undefined;

  if (problem.type === "syllogism") {
    // TODO(Challenge 2, step 4a): Station 2.1's truth table as a lookup.
    // problem.observation.asserts tells you which canonical form this is:
    //   "A"     -> valid   (affirming the antecedent)
    //   "not-B" -> valid   (denying the consequent)
    //   "B"     -> invalid, fallacy: "affirming the consequent"
    //   "not-A" -> invalid, fallacy: "denying the antecedent"
    // Build a four-row lookup object and set:
    // answer = { verdict: ..., fallacy: ... (only when invalid) }
  }

  if (problem.type === "plausibility") {
    // TODO(Challenge 2, step 4b): Station 2.3's counting method. Imagine
    // N = 10,000 cases (any N works, it cancels in the division; it is
    // here so the names tell the truth: these are counts of cases).
    // From problem.baseRate, problem.hitRate, problem.falseAlarmRate:
    //   trueFlags  = N * baseRate * hitRate               (have it, flagged)
    //   falseFlags = N * (1 - baseRate) * falseAlarmRate  (clean, flagged)
    // answer = { posterior: trueFlags / (trueFlags + falseFlags) }
  }

  if (problem.type === "bernoulli") {
    // TODO(Challenge 2, step 4c): Station 2.4's Bernoulli read. From
    // problem.theta, problem.payoffs, and problem.probabilityOf:
    // answer = {
    //   support: [0, 1],
    //   expectedValue: theta * onSuccess + (1 - theta) * onFailure,
    //   probabilityStatement: theta if probabilityOf is 1, else 1 - theta,
    // }
  }

  if (answer === undefined) {
    // No TODO block claimed this problem yet. 501 keeps the service honest.
    return notBuiltYet(2, "Reasoning & Uncertainty Service");
  }

  // The memory step: overwrite this type's "latest" row so your /reasoning
  // page can display the same problem and answer (see lib/reasoning-store).
  await saveLatest(problem.type as ProblemType, problem, answer);

  return NextResponse.json(answer);
}
