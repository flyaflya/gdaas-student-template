import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Capstone: coming soon" };

/**
 * ── TODO: Lane 5 — your /capstone report ─────────────────────────────────
 * This page is yours to design. Step 5 of the build guide ("Build Your
 * Capstone") gives the brief, the eight data-capstone elements the grader
 * reads, and a sequence for building the report with your AI agent. The
 * problem and answer come from loadLatest() in src/lib/capstone-store.ts;
 * the 10,000 results for each option come from simulateAll() in
 * src/lib/capstone-simulate.ts.
 */
export default function CapstonePage() {
  return (
    <ComingSoon
      lane={5}
      title="Capstone: Decision Service + Report"
      description="A report that compares two options for one reader, using 10,000 simulated outcomes for each. Built after Lane 5."
    />
  );
}
