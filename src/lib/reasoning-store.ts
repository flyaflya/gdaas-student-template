import { createClient } from "@supabase/supabase-js";

/**
 * The reasoning service's memory (Challenge 2).
 *
 * Why this file exists: on Vercel, your API route runs as a short-lived
 * function that forgets everything the moment it finishes answering. But the
 * challenge requires your /reasoning page to display the same answers your
 * API just gave. The only way a forgetful function and a separate page can
 * agree is to write the answer down somewhere both can read: your Supabase
 * database, the same one the guestbook uses.
 *
 * Two functions, two callers:
 *   - saveLatest(): called by /api/reasoning/decide after every answer.
 *   - loadLatest(): called by the /reasoning page to display them.
 *
 * Setup: run supabase/reasoning.sql once in your Supabase SQL Editor.
 * No new env vars: this reads the same NEXT_PUBLIC_SUPABASE_* values you
 * set in Chapter 3 for the guestbook.
 */

export type ProblemType = "syllogism" | "plausibility" | "bernoulli";

/** A stored problem/answer pair. Both are JSON objects from the wire. */
export interface LatestEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  problem: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answer: Record<string, any>;
}

export type Latest = Record<ProblemType, LatestEntry | null>;

// Same client helper as the guestbook route, accepting the same env-var
// name variants so a paste from Supabase's Connect dialog just works.
function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Overwrite the stored "latest" for one problem type. upsert means
 * "insert the row, or update it if a row with this primary key already
 * exists". One row per type, always the newest, never a growing pile.
 */
export async function saveLatest(
  type: ProblemType,
  problem: LatestEntry["problem"],
  answer: LatestEntry["answer"]
): Promise<void> {
  const client = supabase();
  if (!client) {
    throw new Error("Supabase env vars not set. See .env.example and the README.");
  }
  const { error } = await client
    .from("reasoning_latest")
    .upsert({ type, problem, answer, updated_at: new Date().toISOString() });
  if (error) {
    throw new Error(`Could not save the latest ${type}: ${error.message}`);
  }
}

/**
 * Read all three "latest" rows back. Any type that has never been answered
 * comes back null, and your page should say "no probe yet" for it instead
 * of crashing. If Supabase isn't configured (or the table doesn't exist
 * yet), everything comes back null: the page stays up either way.
 */
export async function loadLatest(): Promise<Latest> {
  const empty: Latest = { syllogism: null, plausibility: null, bernoulli: null };
  const client = supabase();
  if (!client) return empty;
  const { data, error } = await client
    .from("reasoning_latest")
    .select("type, problem, answer");
  if (error || !data) return empty;
  for (const row of data) {
    if (row.type === "syllogism" || row.type === "plausibility" || row.type === "bernoulli") {
      empty[row.type as ProblemType] = { problem: row.problem, answer: row.answer };
    }
  }
  return empty;
}
