# Fork — Requirements & Problem Analysis

A structured analysis document for the Fork project: the problem it solves, who it serves, what it must do, what it must never do, and how the current build measures against those requirements.

## 1. Problem analysis

**Core problem.** College students make irreversible, expensive academic decisions — switching majors, adding a minor, taking a semester off, graduating early — with almost no visibility into the consequences. The information needed to reason about a switch (remaining credits, prerequisite chains, extra semesters, added tuition, career relevance) is scattered across a degree audit, a course catalog, an advisor's calendar, and job postings.

**Consequences today.**
- Decisions get made on vibes, peer pressure, or a single 20-minute advising appointment.
- Cost and time-to-graduation impacts surface only after the switch.
- Students who feel behind default to inaction, which is itself a costly choice.

**Who it affects.**
- *Primary:* undergraduates 1–3 years in, considering a change of direction (e.g. Maya Rodriguez — Biology sophomore, 54 credits, aiming at healthcare technology).
- *Secondary:* advisors who want a shared artifact to talk through, and prospective/transfer students comparing directions.

**Why existing tools fail.**
- Degree audits report status, not alternatives — no "what if".
- Course catalogs describe requirements but never simulate a path.
- Career sites talk about jobs with zero connection to the student's actual transcript.
- General AI chat produces confident but invented numbers, which is worse than no answer for a decision this expensive.

**The gap Fork fills.** A deterministic simulator that turns one student's verified academic record into several concrete futures, each with a graduation date, credit delta, cost delta and career fit, side by side, with the reasoning shown.

## 2. Stakeholders and goals

| Stakeholder | Goal | Success looks like |
|---|---|---|
| Student | Decide with confidence | Can compare 2–4 futures in under 30 seconds and explain the tradeoff out loud |
| Advisor | Ground the conversation | Numbers are reproducible and clearly labeled estimate vs. verified |
| Evaluator/judge | Grasp the product fast | Understands "simulates major life decisions" within 10 seconds of the landing page |

## 3. Functional requirements

Priority: **M** must-have, **S** should-have, **C** could-have.

**Student data**
- FR-1 (M) Capture academic position: institution, degree, major, minor, year, GPA (decimal), completed credits.
- FR-2 (M) Capture interests, strengths and ranked priorities via searchable multi-select with autofill.
- FR-3 (M) Import academic history from a transcript or degree audit file, with AI extraction and student confirmation before use.
- FR-4 (S) Guided, school-specific instructions for obtaining that file; optional school-ID tagging.
- FR-5 (M) Blank "Start here" path with nothing prefilled.

**Simulation (the centerpiece)**
- FR-6 (M) Free-text "What if…" input plus a dropdown of quick scenarios, both located at the bottom of the simulator.
- FR-7 (M) Generate branching alternative futures from the current position; animate the branch growth.
- FR-8 (M) Per path: graduation date, credits remaining, additional credits, estimated tuition, career fit, risk, advantages, tradeoffs.
- FR-9 (M) Show all alternatives before highlighting a best fit.
- FR-10 (M) Compare 2–4 paths on a visual, non-spreadsheet surface.
- FR-11 (M) "Why this path?" reasoning plus the evidence used.
- FR-12 (M) Adjustable priority weights that re-rank paths live.
- FR-13 (M) Chosen path expands into a full breakdown and a semester roadmap with checkable actions and "Your next 3 moves".
- FR-14 (S) Career reference framed as paths worth exploring; selecting a career routes into the simulator with the scenario prefilled.
- FR-15 (S) Relevant-coursework view for the target career, marking completed and prerequisite-blocked courses.

**Accounts and persistence**
- FR-16 (M) Email/password and Google sign-in with email verification.
- FR-17 (M) Signing up clears demo data and lands the user on their own profile.
- FR-18 (M) Returning users have profile, priorities, career, saved paths and plan progress restored; pending edits flush before unload or sign-out.
- FR-19 (M) Demo/sample data is never written to an account.

## 4. Non-functional requirements

- NFR-1 **Determinism.** Every number in the UI comes from the typed engine. AI only parses free text into a structured scenario and narrates engine output. No AI-generated figures. Same inputs always produce the same outputs.
- NFR-2 **Trust labeling.** Scores render as `NN / 100` + "Fork estimate" with an explanatory tooltip. Facts split into Verified / Estimated / Unknown. Risk lists its drivers. Planning surfaces carry "confirm with your academic advisor".
- NFR-3 **No overreach.** No guarantees of graduation, employment, salary or admission. No sensitive personal characteristics feed recommendations. Never requests a student portal password.
- NFR-4 **Responsiveness.** Usable phone / tablet / desktop, zero horizontal overflow; branching tree horizontal on desktop, vertical on mobile.
- NFR-5 **Speed and polish.** Primary loop completes in 90–120 seconds; animation fast and purposeful.
- NFR-6 **Design integrity.** Deep navy, electric blue, mint, gold, cream; display serif headings, clean sans interface text; semantic tokens only.
- NFR-7 **Security.** Owner-scoped row-level security on student data, public read only on catalog tables, uploaded documents private to the owner.
- NFR-8 **Accessibility and SEO.** Semantic structure, labeled controls, keyboard-usable inputs, per-route metadata.

## 5. Constraints and assumptions

**Constraints**
- No U.S. student portal exposes a public API, so transcripts cannot be fetched automatically — import is file-based by necessity.
- Course availability, individual financial aid and advisor approval are unknowable to Fork and must be surfaced as Unknown.
- Catalog data stays small and internally consistent rather than exhaustive.

**Assumptions**
- Tuition is modeled from a stated per-credit assumption.
- The student's transcript is the source of truth once confirmed.
- Planning horizon starts from the next fall term.

## 6. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Numbers drift or contradict each other | Destroys credibility | Single engine as the only source of figures; consistency check on the demo dataset |
| Extraction misreads a transcript | Wrong plan | Student confirms rows; low-confidence rows flagged before use |
| Feature breadth dilutes the simulator | Weak core | Governing priority: the What-If loop wins every tradeoff |
| AI reads as an oracle | Misplaced trust | Estimate labeling, evidence lists, priority re-ranking that can flip the answer |

## 7. Acceptance criteria

1. Product understandable in 10 seconds; What-If concept obvious without explanation.
2. Two or more futures comparable in under 30 seconds.
3. Every displayed number traceable to the engine and reproducible on a rerun.
4. Consequences of switching visible before any recommendation appears.
5. Recommendation reasoning readable and grounded in listed evidence.
6. Changing priorities visibly re-ranks paths.
7. Decision convertible into a semester plan with three concrete next moves.
8. Import → confirm → simulate works end to end on a real file.
9. Signup clears demo data, lands on profile, and a returning sign-in restores everything.
10. No horizontal overflow at 390px, 820px and desktop widths.

## 8. Gap analysis of the current build

The requirements above are largely implemented. This document is analysis, not new feature work; the verification pass it implies is:

- Re-run the demo dataset consistency check: credits sum correctly, prerequisites chain, every graduation date arithmetically reachable, costs match the per-credit assumption, and the scenarios differ meaningfully.
- Walk the full flow signed out and signed in, on phone, tablet and desktop widths, against the acceptance criteria above, and record any criterion that fails.
- Confirm trust labeling is present on every score, risk and planning surface.
- Confirm no route displays a figure that does not originate in the engine.

Anything failing gets fixed before new functionality is added.

## 9. Technical notes

TanStack Start routes with TanStack Query for reads; deterministic engine in `src/lib/fork/engine.ts` with academic helpers alongside it; AI parsing and narration isolated in the Fork AI server module; catalog and student data in Lovable Cloud (PostgreSQL) with owner-scoped RLS and explicit grants; design tokens in `src/styles.css`; per-route `head()` metadata.
