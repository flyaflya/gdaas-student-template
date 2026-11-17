import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Capstone — coming soon" };

/**
 * ── TODO: Lane 5 — your /capstone report ─────────────────────────────────
 * This page is yours to design. Step 5 of the build guide ("Build Your
 * Capstone") gives the brief, the six data-capstone elements the grader
 * reads, and a sequence for building the report with your AI agent. The
 * data comes from loadLatest() in src/lib/capstone-store.ts.
 */
export default function CapstonePage() {
  return (
    <ComingSoon
      lane={5}
      title="Capstone: Advocacy Report + Decision Tool"
      description="An advocacy report on a decision domain I choose (staffing, inventory, pricing, or channels). Built after Lane 5."
    />
  );
}
