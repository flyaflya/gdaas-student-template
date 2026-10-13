import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Decision Simulator — coming soon" };

/**
 * ── TODO: Lane 3 — your /simulator page ──────────────────────────────────
 * Challenge 3's page check expects this page to DISPLAY the same answers
 * your /api/simulator/decide just gave, bound via data-simulator="..."
 * attributes, plus an <img data-simulator="dag"> showing your DAG. Step 6
 * of the build guide ("Build Your Decision Simulator", end of Lane 3)
 * gives you the complete page; the chart it uses already ships in
 * src/components/simulator/CandidateOutcomes.tsx.
 */
export default function SimulatorPage() {
  return (
    <ComingSoon
      lane={3}
      title="Decision Simulator"
      description="A service that simulates investment games and recommends the growth-optimal stake. Built after Lane 3."
    />
  );
}
