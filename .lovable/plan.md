# Fork v2 — Determinism Hardening (final clarifications)

Amend `.lovable/plan/fork-requirements-analysis-v2-2026-08-12.md` in place and implement the corrections below. No new product features, no redesign, no behavior changes beyond what these clarifications require.

## Engine changes

1. **Explicit, immutable `BaselineFacts`.** One frozen object per profile, computed once from the baseline path spec + validated profile, holding every metric a delta is displayed for: credits, cost, academic semesters, estimated completion term and date, and career-fit score + evidence (career fit is a comparison metric). It is threaded into every path simulation; no simulation recomputes, mutates, or replaces it. Priorities, scenario order, and candidate-path order are not inputs to it. `BASELINE_PATH_ID` becomes the generic `"baseline"`; the card label is derived from the student's program ("Continue current plan — Biology, B.S.").

2. **Priorities are ranking-only.** Priorities are passed to the ranking step exclusively — never to candidate-path generation, baseline computation, or per-path metric/evidence computation. Reordering priorities may reorder the final ranking and nothing else.

3. **Order invariance.** Candidate paths, course rows, skill lists, and scenario lists are normalized (sorted by stable identity) before any aggregation, so logically identical input serializes byte-identically. Ranking order is compared separately from normalized per-path results.

4. **Completion terminology.** `graduationDate`/`graduationTerm` → `estimatedCompletionTerm` and `estimatedCompletionDate` everywhere. The existing display convention ("May 2028" — month + year, deterministic) is kept for labels and documented; the underlying exact date convention is documented and pinned in tests as Fall → December 31, Spring → May 31, Summer → August 31 of the term year. Every label reads **Estimated completion** with **Based on planned course sequence** underneath, framed as a Fork planning estimate, never an institutional guarantee.

5. **Tuition planning assumptions.** One exported config object with two distinct named rates: in-program $485/credit and out-of-institution $540/credit. No rate literals anywhere else in engine or UI. `changesInstitution` and `pricedAtOutOfInstitutionRate` are separate path attributes. Pricing: in-program priced credits × $485 + out-of-institution priced credits × $540. Lost/unapplied credits are not priced (matching current requirements). Rates are never derived from a student's history. UI shows "Estimated tuition" + "Based on Fork's $485/credit planning assumption"; evidence category Estimated.

6. **Career fit derived from coursework.** Each catalog course carries fixed per-skill contributions (0–1). Per skill: `coverage = min(1, sum of contributions from applicable in-scope courses)`. A course contributes once, in full, by course identity — repeated appearances never double count. Completed, in-progress, and planned all contribute identically; **course identity determines the numeric contribution, course status determines evidence only**. Score stays `sum(weight × coverage) × 100`, rounded as today, clamped 0–100. Hand-authored `skillCoverage` on `PathSpec` is deleted; contributions are chosen so scores stay close to today's values.

7. **Deterministic career-fit evidence.** The engine returns, per path: relevant completed courses, relevant in-progress courses, relevant planned courses, thin-coverage skills, and prerequisite-blocked skills — each list sorted deterministically and independent of source array order. Path cards and the "Why this path?" drawer render it beside the score using the existing Fork-estimate tooltip.

8. **Risk formula preserved, documented.** The existing numeric driver weights and thresholds (extra semesters ×2; extra credits ≥12 → 2 else >0 → 1; prerequisites ≥3 → 2 else >0 → 1; average load ≥19 → 2, ≥18 → 1; unapplied credits ≥12 → 2 else >0 → 1; any summer → 1; bands ≤1 Low, ≤3 Moderate, ≤6 Medium, else High) is written verbatim into the requirements as the source of truth for implementation and fixtures. No new formula. Unknown facts contribute zero points and stay explicitly Unknown — never collapsed into a known 0.

9. **Risk vs uncertainty.** Four qualitative levels only: Low → Moderate → Medium → High (the current `"Medium/High"` label is renamed `"Medium"`). Never a 0–100 score. Separately the engine returns uncertainty drivers = unknown path facts + unconfirmed imported course rows. Named constant `UNCERTAINTY_ESCALATION_THRESHOLD = 2`: 0 or 1 drivers leave risk unchanged; 2 or more raise it exactly one level (High stays High), regardless of how many.

10. **Unsupported institution fails closed.** One canonical `institutionId` for the supported demo institution, carried by both profile and catalog. The engine checks the ID, never the free-text school name. Missing, malformed, or unrecognized → a typed discriminated result (`{ status: "unsupported"; reason: "unsupported-institution"; institutionId? }`) returned before any academic calculation; the ok branch carries the simulation. Simulation routes render an unsupported-institution state instead of results.

11. **AI boundary enforced by schema.** The validated classifier output contains only `{ scenarioId, target }`, both constrained to catalogued scenario/program values. The validator strips everything else, so no credits, tuition, dates, scores, risk, course counts, prerequisite status, semester load, or institution can reach the engine. Ambiguous text returns unresolved and the UI asks for clarification. Free text carrying an unsupported assumption (e.g. a 21-credit load) gets an explanation on the What-If page instead of a simulation. Narration only rephrases computed output.

12. **Import provenance.** extraction → candidate rows → student confirmation → profile → engine, unchanged and enforced for both PDF and CSV. Ambiguous rows are flagged; unconfirmed rows enter neither the profile nor the engine; failed or partial extraction leaves no usable academic record. Every record reaching the engine has confirmed provenance.

## Test suite (the acceptance gate)

`src/lib/fork/engine.test.ts` plus focused new spec files:

- **Determinism:** baseline is scenario-independent; baseline deltas are zero; every path uses the identical baseline object/values; candidate path set, credits, cost and cost delta, semesters, completion term/date, career-fit score, career-fit evidence, risk level, risk drivers, and uncertainty drivers are all unchanged across two materially different priority orderings; every delta is measured against the same baseline; unsupported institutions produce Unsupported; identical logical input yields byte-identical output.
- **Ordering invariance:** reordered courses, skills, candidate paths, and scenario lists produce equivalent output, with ranking order compared separately from normalized per-path results.
- **Career fit:** all coverage values within 0–1; a synthetic many-course case proves the hard cap at 1; a duplicated course does not double count; completed/in-progress/planned versions of the same course give identical contributions; repeated runs give identical score and evidence; priority order changes neither.
- **Risk:** documented numeric driver formula holds; unknown drivers add zero points; 0 and 1 uncertainty drivers leave the level unchanged; exactly 2 raises one level; many still raise only one level; High stays High; risk is never numeric.
- **AI boundary:** "switch to Computer Science" resolves to the switch-major scenario with the CS target; vague input returns unresolved; a payload with `credits: 999`, `tuition: 1`, `graduationDate: "1900-01-01"`, `score: 100`, `risk: "Low"`, `prerequisiteCount: 0` validates to the same object as the clean payload and simulates to byte-identical output.
- **Import states:** for PDF and CSV each — valid extraction yields confirmable rows; ambiguous extraction flags rows; confirmation is required; failed extraction produces no academic record; unconfirmed rows cannot reach the engine.
- **Transfer separation:** the Transfer schools scenario keeps `changesInstitution`, partial credit loss, admission-unknown, and out-of-institution pricing as four independent facts, with tests proving they are not conflated into one boolean.
- **Golden fixtures:** one independent fixture per demo scenario — switch to CS, CS minor, graduate early, transfer-priced path, semester off, health informatics — with literal hand-computed expected credits, credit delta, cost, cost delta, semesters, completion term/date, career fit, risk level, and ranking. Fixtures import no production calculation helpers and are never captured from engine output; each states its arithmetic in comments so an incorrect behavior change fails rather than re-baselines.

## Requirements doc updates

Amend the v2 doc's engine-contract, trust-model, scope, risk, privacy, and verification sections to state: immutable BaselineFacts, ranking-only priorities, order invariance, completion terminology and exact date convention, the two-rate planning-assumption config and pricing formula, course-derived career fit with the identity/status invariant, the verbatim risk formula, the four risk levels plus `UNCERTAINTY_ESCALATION_THRESHOLD`, the typed unsupported-institution contract, the `{ scenarioId, target }` AI schema, the import provenance chain, transfer's separated attributes, and the expanded invariant + golden-fixture suite.

## Verification

Full Vitest run (invariants, ordering, career fit, risk, AI boundary, import, golden fixtures, unsupported institution), then a manual What-If → Compare → Why → Plan walk at 390px and 1440px, confirming the renamed completion fields and labels read consistently across `PathCard`, `Scores`, `WhyPath`, `BranchTree`, `compare`, `path`, `plan`, `home`, `index`, and `what-if`.
