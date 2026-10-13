import { notBuiltYet } from "@/lib/not-built-yet";

/**
 * ── TODO: Lane 3 — Challenge 3, "Decision Simulator" ─────────────────────
 * You'll build this after Chapters 10–14. This route proves the service is
 * yours by echoing your token. Step 1 of the build guide ("Build Your
 * Decision Simulator", end of Lane 3 in the course book) gives you the
 * complete file to paste over this one.
 * Until then it returns 501 so probes honestly fail.
 */
export async function GET() {
  return notBuiltYet(3, "Decision Simulator");
}
