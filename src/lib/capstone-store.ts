import { createClient } from "@supabase/supabase-js";
import type { CapstoneAnswer, CapstoneProbe } from "@/lib/capstone-helpers";

/**
 * The capstone's memory (Challenge 5).
 *
 * Same reason as the other stores: your API route forgets everything the
 * moment it answers, but your /capstone report must show the same answer
 * and chart the same data. So the route writes your own problem and its
 * answer to Supabase and the page reads them back.
 *
 * Two functions, two callers:
 *   - saveLatest(): called by /api/capstone/decide after it answers your
 *     own problem (probe.yours is true). Test problems are not saved.
 *   - loadLatest(): called by the /capstone page to build the report.
 *
 * Setup: run supabase/capstone.sql once in your Supabase SQL Editor.
 * No new env vars.
 */

/** Your stored problem (with every history row) and its answer. */
export interface CapstoneLatest {
  probe: CapstoneProbe;
  answer: CapstoneAnswer;
  updated_at: string;
}

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Overwrite the one stored "latest" row. */
export async function saveLatest(probe: CapstoneProbe, answer: CapstoneAnswer): Promise<void> {
  const client = supabase();
  if (!client) {
    throw new Error("Supabase env vars not set. See .env.example and the README.");
  }
  const { error } = await client.from("capstone_latest").upsert({
    key: "latest",
    probe,
    answer,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    throw new Error(`Could not save the latest decision: ${error.message}`);
  }
}

/**
 * Read the stored row back. Returns null when your problem has not been answered
 * yet, when Supabase isn't configured, or when the table doesn't exist yet.
 */
export async function loadLatest(): Promise<CapstoneLatest | null> {
  const client = supabase();
  if (!client) return null;
  const { data, error } = await client
    .from("capstone_latest")
    .select("probe, answer, updated_at")
    .eq("key", "latest")
    .maybeSingle();
  if (error || !data) return null;
  return data as CapstoneLatest;
}
