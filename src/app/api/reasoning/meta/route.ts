import { NextResponse } from "next/server";
import { notBuiltYet } from "@/lib/not-built-yet";

/**
 * ── Challenge 2, step 1: announce the service ─────────────────────────────
 * Why this route exists: before the grader sends your site 30 problems, it
 * knocks on this door and asks "who lives here?". The route answers with
 * your course token (the same SITE_TOKEN your /api/health echoes), which
 * proves the service answering is YOURS and not a classmate's URL pasted by
 * mistake. It also names the wire-contract version it speaks, so the grader
 * knows how to talk to it.
 *
 * The finished route is written out below. When you take on Challenge 2
 * (the build guide in the course book, end of Lane 2, walks through every
 * step), delete the notBuiltYet line and un-comment the return.
 */
export async function GET() {
  // TODO(Challenge 2, step 1): delete this line and un-comment the return below.
  return notBuiltYet(2, "Reasoning & Uncertainty Service");

  // return NextResponse.json({
  //   service: "reasoning", // which decision service is answering
  //   specVersion: "1", // which version of the wire contract it speaks
  //   studentToken: process.env.SITE_TOKEN, // proves this service is yours
  // });
}
