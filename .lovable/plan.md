# Fork v2 — Determinism Hardening (final corrections)

Amend `.lovable/plan/fork-requirements-analysis-v2-2026-08-12.md` in place — no new requirements document — and implement the corrections below. No new features, no redesign, no unrelated behavior changes.

## Engine architecture

**Boundary:** validated profile + catalog + immutable BaselineFacts + path spec + planning assumptions + confirmed academic records + explicit import-uncertainty metadata → pure deterministic simulation → metrics + evidence + risk + uncertainty → ranking by priorities → UI. AI, unconfirmed rows, priorities, UI state, free-text school names, randomness, and the clock never touch academic calculations.

1. **BaselineFacts.** Computed once per validated profile from the baseline spec, frozen, passed unchanged into every path simulation, never recomputed or replaced. Holds every metric a delta is shown for: credits, cost, academic semesters, estimated completion term and date, career-fit score and evidence. Acceptance is on **values**, not `===` reference identity. `BASELINE_PATH_ID` becomes the generic `"baseline"`, with the card label derived from the student's program.

2. **Priorities are ranking-only.** Priorities reach the ranking step and nothing else — not candidate-path generation, not baseline computation, not any per-path metric or evidence.

3. **Canonical determinism.** A test helper `normalizeEngineOutput()` recursively sorts semantically unordered collections by stable identity (courses, skills, candidate paths, evidence lists, uncertainty drivers) while preserving ranking order in a separate field, and comparisons are `JSON.stringify(normalizeEngineOutput(a)) === JSON.stringify(normalizeEngineOutput(b))`. Normalization never flattens meaningful differences; ranking order is asserted separately because it is allowed to change with priorities. This rule is documented in the requirements' verification section.

4. **Pure simulation invariant.** For identical validated inputs, catalog, baseline, and planning assumptions, simulation returns canonically identical output with no side effects, and depends on none of: current time, randomness, array position, priority/scenario/candidate order, UI state, free-text institution name, unvalidated AI output, unconfirmed records, or mutable globals.

5. **Completion terminology.** `graduationTerm`/`graduationDate` → `estimatedCompletionTerm`/`estimatedCompletionDate`. Labels read **Estimated completion** with **Based on planned course sequence** underneath. Display keeps today's deterministic month + year form; the documented exact convention pinned in tests is Fall → December 31, Spring → May 31, Summer → August 31 of the term year. A Fork planning estimate, never a guarantee.

6. **Tuition assumptions.** One exported config with two named rates: in-program $485/credit, out-of-institution $540/credit; no literals elsewhere. `changesInstitution` and `pricedAtOutOfInstitutionRate` stay separate attributes. Estimated tuition = in-program priced credits × 485 + out-of-institution priced credits × 540. Unapplied/lost credits are not priced. Rates are never derived from student history. UI shows "Estimated tuition" + "Based on Fork's $485/credit planning assumption"; evidence stays Estimated.

7. **Career fit — course-level authority.** Catalog course per-skill contributions (0–1) are the **sole** source of numeric coverage; hand-authored `PathSpec.skillCoverage` is deleted and path-level coverage is not permitted. Contributions represent each course's intended skill contribution and are not tuned to reproduce today's scores. Per skill: `coverage = min(1, sum(contributions of applicable in-scope courses))`. A course contributes once, in full, by identity — repeats never double count. **Course identity determines the numeric contribution; course status determines evidence only** (completed, in-progress, planned contribute identically).

8. **Career-fit rounding.** `careerFit = sum(skillWeight × coverage) × 100`, then exactly one final `Math.round(rawScore)` — the current rule — centralized in the engine and clamped to 0–100. No intermediate rounding of contributions or weighted skill values. `PathCard`, `WhyPath`, `Compare`, and every other surface consume that single engine value. Golden fixtures use this documented rule.

9. **Career-fit evidence.** Per path the engine returns relevant completed, in-progress, and planned courses plus thin-coverage and prerequisite-blocked skills, each deterministically sorted and independent of source order. Rendered beside the score with the existing Fork-estimate tooltip.

10. **Risk formula — documented verbatim.** Preserved exactly as implemented today:

| Driver | Points |
|---|---|
| Extra semesters | `additionalSemesters × 2` when positive, else 0 (confirmed: keeps existing weighting rather than a 1-point cap) |
| Extra credits | 0 when 0; 1 when >0 and <12; 2 when ≥12 |
| Prerequisites | 0 when 0; 1 when 1–2; 2 when ≥3 |
| Average load | 0 below 18; 1 when ≥18 and <19; 2 when ≥19 |
| Unapplied credits | 0 when 0; 1 when >0 and <12; 2 when ≥12 |
| Summer use | 0 with no summer; 1 with any summer |

Bands: 0–1 Low, 2–3 Moderate, 4–6 Medium, 7+ High. Unknown values contribute exactly zero points and remain explicitly Unknown — never collapsed into a known 0. Domain precision is preserved (integer credits stay integers).

11. **Risk vs uncertainty.** Four qualitative levels only — Low → Moderate → Medium → High (the current `"Medium/High"` label is renamed `"Medium"`); never a 0–100 score. Uncertainty drivers = unknown path facts + unresolved import rows. Named `UNCERTAINTY_ESCALATION_THRESHOLD = 2`: 0 or 1 drivers change nothing; 2 or more raise the level exactly one step, no matter how many; High stays High.

12. **Import provenance vs uncertainty.** extraction → candidate rows → student confirmation → confirmed academic records **plus** separate import-uncertainty metadata → validated profile → engine. Only confirmed rows land in `profile.academicRecords` and so only they affect credits, course scope, prerequisites, career fit, completion, or any other academic figure. Unresolved rows land only in `profile.importUncertainty`, which the engine reads **solely** to derive uncertainty drivers — never as courses. Failed extraction yields no academic record, no usable course scope, and, if it produced no unresolved-row metadata, no uncertainty driver either.

13. **Institution guardrail.** The data layer owns the supported canonical `institutionId`; catalog and validated profile both carry it; free-text school names are never used for authorization. Before any calculation the engine validates the ID is present and catalogued; anything missing, non-string, or non-catalogued is simply **unsupported** (no separate "malformed" concept) and returns `{ status: "unsupported", reason: "unsupported-institution", institutionId? }` before any path/credit/cost/career/risk work. Routes render an unsupported-institution state.

14. **AI boundary by schema.** Validated classifier output contains only `{ scenarioId, target }`, constrained to catalogued scenario/program values; the validator strips everything else, so no credits, tuition, dates, scores, risk, course counts, prerequisite status, load, or institution can reach the engine. Ambiguous text returns unresolved and the UI asks for clarification; unsupported assumptions (e.g. a 21-credit load) are explained, not simulated. Narration only rephrases computed output.

15. **Transfer attributes stay separate.** Transfer schools keeps four independent facts: changes institution, partial credit loss, admission unknown, priced at the out-of-institution rate. No overloaded boolean.

## Test suite (acceptance gate)

`src/lib/fork/engine.test.ts` plus focused spec files, all comparisons via `normalizeEngineOutput`:

- **Baseline:** identical baseline values across every path; independent of priority, scenario, and candidate-path order; no path can mutate it; every displayed delta computed from those same values.
- **Priorities:** two materially different orderings leave candidate set, credits, cost and cost delta, semesters, completion term/date, career-fit score and evidence, risk level, risk drivers, and uncertainty drivers identical — only ranking order differs.
- **Ordering invariance:** reordered courses, skills, candidate paths, and scenario lists produce canonically identical output.
- **Pure determinism:** repeated calls with identical input are canonically byte-identical; no clock/random dependence.
- **Career fit:** coverage always within 0–1; a synthetic over-contribution case proves the 1.0 cap; duplicate course rows don't double count; completed/in-progress/planned give identical contributions; single final `Math.round`; score clamped 0–100; priorities change neither score nor evidence.
- **Risk boundaries:** extra credits 0 / 1 / just below 12 / 12+; prerequisites 0 / 1–2 / 3+; average load below 18 / exactly 18 / between / exactly 19 / above; unapplied credits 0 / below 12 / exactly 12 / above; summer none vs any; extra semesters 0 vs positive; unknown driver contributes zero. Plus band boundaries 1→2, 3→4, 6→7.
- **Uncertainty escalation:** 0, 1, 2, and many drivers; High stays High; risk never numeric.
- **Import provenance:** confirmed row enters academic records; unconfirmed row does not, and cannot affect credits, career fit, prerequisites, or completion; unconfirmed row may create an uncertainty driver; failed extraction produces no academic record and no usable course data; same confirmed records + same uncertainty metadata → deterministic result. Covered for both PDF and CSV.
- **Institution:** missing ID → Unsupported; non-string/invalid → Unsupported; unknown → Unsupported; valid canonical ID → normal simulation; changing only the free-text school name does not change authorization.
- **AI boundary:** "switch to Computer Science" → switch-major scenario with CS target; vague input → unresolved; a payload with `credits: 999`, `tuition: 1`, `graduationDate: "1900-01-01"`, `score: 100`, `risk: "Low"`, `prerequisiteCount: 0` validates to the same object as the clean payload and simulates canonically identically.
- **Golden fixtures:** one independent fixture per demo scenario (switch to CS, CS minor, graduate early, transfer-priced path, semester off, health informatics) with literal hand-computed credits, credit delta, cost, cost delta, semesters, completion term/date, career fit, risk level, and ranking. Fixtures import no production calculation helpers and are never captured from engine output; each shows its arithmetic in comments.
- **Transfer separation:** the four attributes assert independently.

## Requirements doc updates

Amend the v2 doc in place so the engine-contract, trust-model, import, risk, scope, and verification sections state: value-based immutable BaselineFacts, ranking-only priorities, canonical normalization/serialization rule, pure-simulation invariant, completion terminology and exact date convention, two-rate pricing formula, course-level career-fit authority with explicit final rounding, the verbatim risk driver table and bands, the four risk levels with `UNCERTAINTY_ESCALATION_THRESHOLD = 2`, confirmed-records vs `importUncertainty` separation, the typed unsupported-institution contract, the `{ scenarioId, target }` AI schema, transfer attribute separation, and the expanded invariant + golden-fixture suite.

## Verification

Full Vitest run covering baseline invariants, ranking-only priorities, canonical determinism, ordering invariance, career-fit contribution/cap/rounding, risk boundaries, uncertainty escalation, import provenance and unconfirmed-row uncertainty, unsupported institution, AI schema stripping, golden fixtures, and transfer separation. Then a manual What-If → Compare → Why → Plan walk at 390px and 1440px confirming "Estimated completion", "Based on planned course sequence", "Estimated tuition", and "Based on Fork's $485/credit planning assumption" read consistently across `PathCard`, `Scores`, `WhyPath`, `BranchTree`, `compare`, `path`, `plan`, `home`, `index`, and `what-if`.
