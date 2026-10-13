import { notBuiltYet } from "@/lib/not-built-yet";

/**
 * ── TODO: Lane 3 — Challenge 3, "Decision Simulator" ─────────────────────
 * The platform will POST seeded investment games here; your service
 * simulates the paths and returns the growth-optimal stake fraction with
 * its statistics. Step 4 of the build guide ("Build Your Decision
 * Simulator", end of Lane 3 in the course book) gives you the complete file
 * to paste over this one and explains every line.
 * Until then it returns 501 so probes honestly fail.
 */
export async function POST() {
  return notBuiltYet(3, "Decision Simulator");
}
