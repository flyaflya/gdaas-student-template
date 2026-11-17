import { notBuiltYet } from "@/lib/not-built-yet";

/**
 * ── TODO: Lane 5, Challenge 5, "Capstone: Decision Service + Report" ──
 * You'll build this after Chapters 20 to 22. This route declares your chosen
 * decision domain (staffing | inventory | pricing | channels) and echoes
 * your token. Step 1 of the build guide ("Build Your Capstone") prints the
 * finished file.
 * Until then it returns 501 so probes honestly fail.
 */
export async function GET() {
  return notBuiltYet(5, "Capstone: Decision Service + Report");
}
