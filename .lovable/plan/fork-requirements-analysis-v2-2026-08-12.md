# Fork — Requirements & Problem Analysis (v2)

Supersedes `fork-requirements-problem-analysis-2026-08-12.md`. Sections 1–5 are unchanged in intent and summarized here; the new material is sections 6 (Engine contract), 7 (Data trust model), 8 (Scope & boundaries), 9 (Privacy & data lifecycle) and 12 (Engine invariants).

## 1. Problem

College students make irreversible, expensive academic decisions — switching majors, adding a minor, taking a semester off, graduating early — with almost no visibility into the consequences. The inputs needed to reason about a switch (remaining credits, prerequisite chains, extra semesters, added tuition, career relevance) are scattered across a degree audit, a course catalog, an advisor's calendar and job postings. Degree audits report status, not alternatives; catalogs describe requirements but never simulate a path; general AI chat produces confident invented numbers, which for a decision this expensive is worse than no answer.

**The gap Fork fills.** A deterministic simulator that turns one student's verified academic record into several concrete futures — each with a graduation date, credit delta, cost delta and career fit — side by side, with the reasoning shown.

## 2. Stakeholders

| Stakeholder | Goal | Success looks like |
|---|---|---|
| Student | Decide with confidence | Compare 2–4 futures quickly and explain the tradeoff out loud |
| Advisor | Ground the conversation | Numbers reproducible, clearly labeled estimate vs. verified |
| Evaluator | Grasp the product fast | Understands "simulates major life decisions" in 10 seconds |

## 3. Functional requirements

Priority: **M** must, **S** should, **C** could.

**Student data**
- FR-1 (M) Academic position: institution, degree, major, minor, year, decimal GPA, completed credits.
- FR-2 (M) Interests, strengths and ranked priorities via searchable multi-select with autofill.
- FR-3 (M) Import academic history from a transcript or degree audit, AI extraction, student confirmation before use.
- FR-4 (S) School-specific instructions for obtaining the file; optional school-ID tagging.
- FR-5 (M) Blank "Start here" path with nothing prefilled.

**Simulation (the centerpiece)**
- FR-6 (M) Free-text "What if…" input plus a dropdown of quick scenarios, positioned at the bottom of the simulator (deliberate design decision: results occupy the top of the view, input sits under them like a console).
- FR-7 (M) Every simulation returns the baseline (current position) plus 1–3 alternative paths; branch growth is animated.
- FR-8 (M) Per path: graduation date, credits remaining, additional credits, estimated tuition, cost delta, career fit, risk level with drivers, advantages, tradeoffs.
- FR-9 (M) All alternatives shown before any recommendation is highlighted.
- FR-10 (M) Compare 2–4 paths on a visual, non-spreadsheet surface.
- FR-11 (M) "Why this path?" reasoning plus the evidence used.
- FR-12 (M) Priority ranking re-ranks paths live.
- FR-13 (M) Chosen path expands into a full breakdown, a semester roadmap with checkable actions, and "Your next 3 moves".
- FR-14 (S) Career reference framed as paths worth exploring; selecting a career routes into the simulator with the scenario prefilled.
- FR-15 (S) Relevant-coursework view for the target career, marking completed and prerequisite-blocked courses.

**Accounts and persistence**
- FR-16 (M) Email/password and Google sign-in with email verification.
- FR-17 (M) Signing up clears demo data and lands the user on their own profile.
- FR-18 (M) Returning users have profile, priorities, career, saved paths and plan progress restored. Writes are debounced and immediate; sign-out waits for pending writes.
- FR-19 (M) Demo/sample data is never written to an account, and demo state is flagged at the data layer (not inferred by the UI).

## 4. Non-functional requirements

- NFR-1 **Determinism.** Every number comes from the engine. Same inputs, same outputs, always.
- NFR-2 **Trust labeling.** Scores render as `NN / 100` + "Fork estimate" with a tooltip. Facts split Verified / Estimated / Unknown. Risk lists its drivers. Planning surfaces carry "confirm with your academic advisor".
- NFR-3 **No overreach.** No guarantees of graduation, employment, salary or admission. Never requests a student portal password.
- NFR-4 **Responsiveness.** Usable phone/tablet/desktop, zero horizontal overflow; tree horizontal on desktop, vertical on mobile.
- NFR-5 **Speed.** Two distinct targets: ≤30 seconds from results appearing to understanding and comparing alternatives; 90–120 seconds for the complete first-time flow (enter or import data → simulate → compare → recommendation → roadmap).
- NFR-6 **Design integrity.** Deep navy, electric blue, mint, gold, cream; display serif headings, clean sans interface; semantic tokens only.
- NFR-7 **Security.** Owner-scoped RLS on student data, public read only on catalog tables, uploaded documents owner-scoped in storage independently of database row permissions.
- NFR-8 **Accessibility.** Semantic structure, labeled controls, keyboard-usable inputs, visible focus, status conveyed by text as well as color, and `prefers-reduced-motion` honored by the branching tree. SEO applies to public marketing and career/catalog routes; authenticated app routes prioritize accessibility and performance instead.

## 5. Constraints and assumptions

- No U.S. student portal exposes a public API, so import is file-based by necessity.
- Course availability, individual financial aid and advisor approval are unknowable to Fork and surface as Unknown.
- Tuition is modeled from a stated per-credit assumption ($485 in-program, $540 transfer).
- Planning starts at the first academic term after the student's current term, derived rather than hardcoded (fall is the fallback when a term label cannot be parsed).

## 6. Engine contract

Pipeline, all typed, all in `src/lib/fork/engine.ts`:

```text
StudentProfile ──► Scenario ──► candidate PathSpecs ──► baseline facts
                                        │
                                        ▼
                          per-path metrics ──► weighted ranking ──► evidence + narration
```

- **StudentProfile** — the normalized student snapshot: credits completed, GPA, program, ranked priorities, course rows with status `completed | in_progress | waitlisted`.
- **Scenario** — a typed member of `SCENARIOS`. Free text is classified into one of these; it never creates new scenario semantics.
- **Candidate paths** — every simulation includes the baseline path (`BASELINE_PATH_ID = "stay_biology"`, "Stay the course") plus the alternatives the scenario selects.
- **Baseline** — `baselineFacts()` sums the baseline plan's credits, academic semesters and cost. **All deltas are measured against it.**

Formula for every displayed number:

| Output | Calculation | Source |
|---|---|---|
| Credits remaining | Σ planned term credits | Catalog + path plan |
| Additional credits | path credits − baseline credits | Engine |
| Estimated tuition | credits remaining × per-credit rate | Engine × stated assumption |
| Cost delta | path cost − baseline cost | Engine |
| Semesters / additional semesters | count of academic terms; minus baseline | Path plan |
| Graduation term | label of the last academic term | Path plan |
| Graduation date | Fall→December, Spring→May, Summer→August of that term | Engine mapping |
| Average load | academic credits ÷ academic semesters | Engine |
| Career fit | Σ (career skill weight × path skill coverage) × 100 | Curated career dataset × path spec |
| Cost efficiency | baseline cost ÷ path cost, clamped 0–100 | Engine |
| Graduation efficiency | baseline semesters ÷ path semesters × 100, minus load/summer penalty | Engine |
| Coursework efficiency | 100 − 2×additional credits − unapplied credits | Engine |
| Continuity, flexibility | authored 0–100 attributes of the path | Path spec |
| Overall fit | Σ (metric × normalized priority weight) | Engine |
| Risk level | points from added semesters, added credits, prerequisite count, average load, unapplied credits, summer use → Low / Moderate / Medium-High / High | Engine, drivers listed |

**Priority weights.** The student's six priorities are a ranking, not sliders. Rank position converts to weights via `n, n−1, … 1` normalized to sum to 1 (`priorityWeights()`), so re-ranking is deterministic and explainable.

**Score directions.** Career fit, cost efficiency, graduation efficiency, coursework efficiency, continuity, flexibility and overall fit are all *higher is better*, rendered `NN / 100` with the "Fork estimate" label. Risk is deliberately **not** a 0–100 score — it is a named level with listed drivers, so it cannot be misread as a rating.

**Rules the engine obeys.**
1. It never invents an academic fact. Missing input yields Unknown, never a silent estimate.
2. Unknowns raise the risk drivers list; they are not converted into numbers.
3. Each output carries its evidence category (`evidenceFor()` returns `verified | estimated | unknown` per fact), so "Why this path?" is a rendering of structured evidence rather than AI prose.
4. AI may not modify any engine output — no score, date, cost, credit count, prerequisite status or evidence item. It classifies free text into an existing scenario and narrates results. Ambiguous input produces an unresolved scenario and a clarifying prompt, not a guess.

## 7. Data trust model

- **Verified** — student-confirmed transcript rows, confirmed course completions, catalog requirement and prerequisite data.
- **Estimated** — tuition from the per-credit assumption, graduation date from the planned course load, career alignment from Fork's skill-weight rules.
- **Unknown** — future course availability and seat access, financial-aid changes, advisor approval, admission into a restricted major, future tuition changes.
- **Unsupported** — an academic situation Fork does not model (see §8). Surfaced as unsupported, never simulated as if supported.

Rule: **Fork never promotes an Unknown into an Estimated or Verified fact without an explicitly documented assumption.**

Two sources of truth, not one:
- The **student record** is authoritative for completed and in-progress academic history.
- The **institutional catalog** is authoritative for requirements, prerequisites and course relationships.

A transcript alone cannot determine whether a future path is valid; the catalog supplies that half.

## 8. Scope & boundaries

**Catalog scope.** V1 runs on a curated catalog (about 26 courses, 4 programs, 3 careers) for one demonstration institution. Fork does not claim institution-wide or multi-institution catalog coverage, and the UI must not imply it.

**Supported academic situations.** Completed, in-progress and waitlisted course rows; single major with optional minor; linear prerequisite chains; fall/spring terms with optional summer sessions and break terms; transfer at a different per-credit rate.

**Explicitly unsupported in V1** (surface as Unsupported): AP/IB and transfer credit mapping, repeated or withdrawn courses, courses satisfying multiple requirements, elective buckets, once-a-year or alternate-year offerings, catalog-year changes, double majors, major/minor requirement overlap, credit-load caps, ambiguous transcript rows that extraction cannot resolve.

**Out of scope entirely.** Fork does not register students for classes, guarantee degree completion, submit major-change applications, predict admission decisions, predict employment or salary, access student portals, determine financial-aid eligibility, guarantee course availability, or replace academic advising.

**Import scope.** V1 accepts PDF and CSV transcripts or degree audits. Every extracted row shows its extracted value and status before confirmation. Extraction failure never silently produces a usable academic record — the student either corrects the rows or the import is discarded.

## 9. Privacy & data lifecycle

- Stored per account: profile fields (school, degree, major, minor, year, GPA, credits), interests, strengths, ranked priorities, selected career, confirmed course rows, saved paths and plan progress.
- Uploaded transcript files live in a private storage bucket scoped to the owner; database RLS and storage policies are enforced separately.
- Transcript text is sent to the AI gateway for extraction only. It is not used for model training, and the model never receives or produces simulation figures.
- The student can edit or clear their profile data; deleting an account removes their rows and uploaded documents.
- Demo and sample data is flagged at the data layer and never written to an account.

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Numbers drift or contradict each other | Destroys credibility | Single engine as the only source of figures; automated invariant tests (§12) |
| Extraction misreads a transcript | Wrong plan | Student confirms rows; low-confidence rows flagged before use |
| Feature breadth dilutes the simulator | Weak core | Governing priority: the What-If loop wins every tradeoff |
| AI reads as an oracle | Misplaced trust | Estimate labeling, evidence lists, re-ranking that can flip the answer |
| Curated catalog read as full coverage | Overclaiming | Scope stated in §8 and reflected in UI copy |

## 11. Acceptance criteria

1. Product understandable in 10 seconds; What-If concept obvious without explanation.
2. Two or more futures comparable within 30 seconds of results appearing.
3. Every displayed number traceable to an engine output and reproducible on a rerun.
4. Consequences of switching visible before any recommendation appears.
5. Recommendation reasoning readable and grounded in listed evidence, framed as "based on your priorities" rather than an objective best.
6. Changing priority order visibly re-ranks paths.
7. Decision convertible into a semester plan with three concrete next moves; checked actions persist across sessions.
8. Import → confirm → simulate works end to end on a real PDF.
9. Demo isolation: open demo → modify it → sign up → verify email → sign out → sign back in shows none of the demo state and all of the user's own state.
10. No horizontal overflow at 390px, 820px and desktop widths.

## 12. Engine invariants (automated)

`src/lib/fork/engine.test.ts`, run with `bun run test`. Every simulation must satisfy:

1. Credits, cost, required credits and unapplied credits are never negative.
2. Additional credits = path credits − baseline credits; cost delta = path cost − baseline cost; additional semesters = path − baseline.
3. The baseline path has zero deltas.
4. Estimated cost = credits remaining × per-credit rate.
5. Every plan starts at the first planned term and no graduation term precedes it.
6. Planned terms are ordered forward in time.
7. No course is scheduled before its prerequisites, and no completed or in-progress course is scheduled again.
8. Every score sits within 0–100.
9. Identical input produces byte-identical output.
10. Changing priority order changes only ranking inputs, never the underlying credit/cost/career figures.

Invariant 7 caught a real defect on first run: several path plans re-scheduled courses Maya is already taking (BIOL 301, CHEM 261, STAT 320, HINF 210) and one completed course (COMP 110). Those slots are now electives.

## 13. Technical notes

TanStack Start routes with TanStack Query for reads; deterministic engine in `src/lib/fork/engine.ts` over path specs in `paths.ts` and the catalog in `data.ts`; AI parsing and narration isolated in `ai.server.ts`; catalog and student data in Lovable Cloud (PostgreSQL) with owner-scoped RLS and explicit grants; design tokens in `src/styles.css`; per-route `head()` metadata; Vitest for engine invariants.
