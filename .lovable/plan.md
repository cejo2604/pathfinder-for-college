# Fork v2 — Determinism Hardening (final corrections)

Amend `.lovable/plan/fork-requirements-analysis-v2-2026-08-12.md` in place — no new requirements document — and implement the corrections below. No new features, no redesign, no unrelated behavior changes.

## Engine architecture

**Boundary:** validated profile + catalog + immutable BaselineFacts + path spec + planning assumptions + confirmed academic records + explicit import-uncertainty metadata → pure deterministic simulation → metrics + evidence + risk + uncertainty → ranking by priorities → UI. AI, unconfirmed rows, priorities, UI state, free-text school names, randomness, and the clock never touch academic calculations.

1. **BaselineFacts — scope and immutability.** Computed once per validated profile from the baseline spec, frozen, passed unchanged into every path simulation, never recomputed or replaced. It contains exactly the metrics for which the UI shows a baseline delta: credits, cost, academic semesters, estimated completion term, estimated completion date, career-fit score, career-fit evidence. **Risk and uncertainty are not part of BaselineFacts** — no surface displays a baseline delta for them; they stay per-path qualitative outputs. Acceptance is on **values**, not `===` reference identity. `BASELINE_PATH_ID` becomes the generic `"baseline"`, with the card label derived from the student's program.

2. **Priorities are ranking-only.** Priorities reach the ranking step and nothing else — not candidate-path generation, not baseline computation, not any per-path metric or evidence.

3. **Canonical determinism.** The documented acceptance criterion for deterministic engine output is canonical serialized equality:

   ```
   JSON.stringify(normalizeEngineOutput(resultA)) === JSON.stringify(normalizeEngineOutput(resultB))
   ```

   `normalizeEngineOutput()` recursively normalizes semantically unordered collections: courses sorted by stable course identity, skills by stable skill identity, candidate paths by stable path identity, evidence lists by stable identity/key, uncertainty drivers deterministically — while preserving meaningful ranking order separately so it stays independently assertable. It never normalizes away meaningful differences. The phrase "byte-identical" is replaced by this rule everywhere in the plan, the requirements doc, and the tests.

4. **Stable identity.** Candidate path identity is stable and independent of array position. Every course, skill, evidence item, scenario, and uncertainty driver used in normalization has a stable identity or deterministic sort key. Array position is never identity.

5. **Pure simulation, no mutation.** For identical validated inputs, catalog, baseline, and planning assumptions, simulation returns canonically identical output with no side effects, and depends on none of: current time, randomness, array position, priority/scenario/candidate order, UI state, free-text institution name, unvalidated AI output, unconfirmed records, or mutable globals. Simulation must also **never mutate any input** — validated profile, catalog, BaselineFacts, path spec, planning assumptions, confirmed academic records, or import-uncertainty metadata.

6. **Completion terminology.** `graduationTerm`/`graduationDate` → `estimatedCompletionTerm`/`estimatedCompletionDate`. Labels read **Estimated completion** with **Based on planned course sequence** underneath. Display keeps today's deterministic month + year form; the documented exact convention pinned in tests is Fall → December 31, Spring → May 31, Summer → August 31 of the term year. A Fork planning estimate, never a guarantee.

7. **Tuition assumptions.** One exported config with two named rates: in-program $485/credit, out-of-institution $540/credit; no literals elsewhere. `changesInstitution` and `pricedAtOutOfInstitutionRate` stay separate attributes. Estimated tuition = in-program priced credits × 485 + out-of-institution priced credits × 540. Unapplied/lost credits are not priced. Rates are never derived from student history. UI shows "Estimated tuition" + "Based on Fork's $485/credit planning assumption"; evidence stays Estimated.

8. **Career fit — course-level authority.** Catalog course per-skill contributions (0–1) are the **sole** source of numeric coverage; hand-authored `PathSpec.skillCoverage` is deleted and path-level coverage is not permitted. Contributions represent each course's intended skill contribution and are never tuned to reproduce historical scores. The authoritative dependency runs one way only: catalog course contributions → documented coverage formula → documented final rounding → golden expected value. Golden fixtures never become the source from which contributions are reverse-engineered. Per skill: `coverage = min(1, sum(contributions of applicable in-scope courses))`. A course contributes once, in full, by identity — repeats never double count. **Course identity determines the numeric contribution; course status determines evidence only** (completed, in-progress, planned contribute identically).

9. **Career-fit rounding.** `careerFit = sum(skillWeight × coverage) × 100`, then exactly one final `Math.round(rawScore)` — the current rule — centralized in the engine and clamped to 0–100. No intermediate rounding of contributions or weighted skill values. `PathCard`, `WhyPath`, `Compare`, and every other surface consume that single engine value.

10. **Career-fit evidence.** Per path the engine returns relevant completed, in-progress, and planned courses plus thin-coverage and prerequisite-blocked skills, each deterministically sorted and independent of source order. Rendered beside the score with the existing Fork-estimate tooltip.

11. **Risk formula — documented exactly, unchanged.** The table below is an exact behavioral specification of the existing implementation, not a literal copy of source wording. No risk behavior changes.

| Driver | Points |
|---|---|
| Extra semesters | `additionalSemesters × 2` when positive, else 0 |
| Extra credits | 0 when 0; 1 when 1–11; 2 when ≥12 |
| Prerequisites | 0 when 0; 1 when 1–2; 2 when ≥3 |
| Average load | 0 below 18; 1 when ≥18 and <19; 2 when ≥19 |
| Unapplied credits | 0 when 0; 1 when 1–11; 2 when ≥12 |
| Summer use | 0 with no summer; 1 with any summer |

Bands: 0–1 Low, 2–3 Moderate, 4–6 Medium, 7+ High. Credits are integer-valued in this domain, so boundaries are tested at 0, 1, 11, 12, and above — no fractional credit values are invented. Unknown values contribute exactly zero points and remain explicitly Unknown — never collapsed into a known 0.

12. **Risk vs uncertainty.** Four qualitative levels only — Low → Moderate → Medium → High (the current `"Medium/High"` label is renamed `"Medium"`); never a 0–100 score. Uncertainty drivers = unknown path facts + unresolved import rows. Named `UNCERTAINTY_ESCALATION_THRESHOLD = 2`: 0 or 1 drivers change nothing; 2 or more raise the level exactly one step, no matter how many; High stays High.

13. **Import provenance vs uncertainty.** extraction → candidate rows → student confirmation → confirmed academic records **plus** separate import-uncertainty metadata → validated profile → engine. Only confirmed rows land in `profile.academicRecords` and so only they affect credits, course scope, prerequisites, career fit, completion, or any other academic figure. Unresolved rows land only in `profile.importUncertainty`, which the engine reads **solely** to derive uncertainty drivers — never as courses. Failed extraction yields no academic record, no usable course scope, and, if it produced no unresolved-row metadata, no uncertainty driver either.

14. **Institution guardrail runs first.** The data layer owns the supported canonical `institutionId`; catalog and validated profile both carry it; free-text school names are never used for authorization. Validating that ID is the **first** simulation precondition — before candidate-path generation, baseline calculation, path simulation, and any credit, cost, career-fit, or risk calculation. Anything missing, non-string, or non-catalogued is simply **unsupported** (no separate "malformed" concept) and returns `{ status: "unsupported", reason: "unsupported-institution", institutionId? }`. Routes render an unsupported-institution state.

15. **AI boundary by schema.** Validated classifier output contains exactly two fields, `scenarioId` and `target`, constrained to catalogued scenario/program values; the validator strips everything else, so no credits, tuition, dates, scores, risk, course counts, prerequisite status, load, or institution can reach the engine. Ambiguous text returns unresolved and the UI asks for clarification; unsupported assumptions (e.g. a 21-credit load) are explained, not simulated. Narration only rephrases computed output.

16. **Transfer attributes stay separate.** Transfer schools keeps four independent facts: changes institution, partial credit loss, admission unknown, priced at the out-of-institution rate. No overloaded boolean.

## Test suite (acceptance gate)

`src/lib/fork/engine.test.ts` plus focused spec files, all determinism comparisons via `JSON.stringify(normalizeEngineOutput(...))`:

- **Baseline:** identical baseline values across every path; independent of priority, scenario, and candidate-path order; every displayed delta computed from those same values; BaselineFacts carries no risk or uncertainty field.
- **BaselineFacts mutation resistance (dedicated test):** capture the complete baseline payload (credits, cost, academic semesters, estimated completion term, estimated completion date, career-fit score, career-fit evidence) canonically, simulate one or more paths, and assert the baseline is unchanged by canonical value comparison — not `===` reference identity. Deep-freeze the baseline in the test so accidental mutation throws, and assert that an attempted mutation cannot change the values used by subsequent path simulations.

- **Priorities:** two materially different orderings leave candidate set, credits, cost and cost delta, semesters, completion term/date, career-fit score and evidence, risk level, risk drivers, and uncertainty drivers identical — only ranking order differs.
- **Stable identity / ordering invariance:** reordered courses, skills, candidate paths, and scenario lists leave per-path metrics, evidence, and canonical normalized output unchanged; path identity is asserted to be position-independent.
- **Purity:** repeated calls with identical inputs give canonically identical output; deep-frozen inputs (profile, catalog, BaselineFacts, path spec, planning assumptions, confirmed records, uncertainty metadata) simulate successfully, proving no mutation; no clock or random dependence.
- **Career fit:** coverage always within 0–1; a synthetic over-contribution case proves the 1.0 cap; duplicate course rows don't double count; completed/in-progress/planned give identical contributions; single final `Math.round`; score clamped 0–100; priorities change neither score nor evidence.
- **Risk boundaries:** extra credits 0 / 1 / 11 / 12 / above → 0 / 1 / 1 / 2 / 2 points; unapplied credits the same; prerequisites 0 / 1–2 / 3+; average load below 18 / exactly 18 / between / exactly 19 / above; summer none vs any; unknown driver contributes zero. Extra-semester regression: 0 → 0, 1 → 2, 2 → 4, 3 → 6 points. Plus band boundaries 1→2, 3→4, 6→7.
- **Uncertainty escalation:** 0, 1, 2, and many drivers; High stays High; risk never numeric.
- **Import provenance:** confirmed row enters academic records; unconfirmed row does not, and cannot affect credits, career fit, prerequisites, or completion; unconfirmed row may create an uncertainty driver; failed extraction produces no academic record and no usable course data; same confirmed records + same uncertainty metadata → deterministic result. Covered for both PDF and CSV.
- **Institution:** missing ID → Unsupported; non-string/invalid → Unsupported; unknown → Unsupported; valid canonical ID → normal simulation; changing only the free-text school name does not change authorization; an unsupported institution cannot trigger candidate-path generation (asserted via an instrumented/spied path-generation boundary).
- **AI boundary:** "switch to Computer Science" → switch-major scenario with CS target; vague input → unresolved; `expect(Object.keys(validated).sort()).toEqual(["scenarioId", "target"])` — order-independent, proving exactly those two keys survive and no others; a payload adding `credits`, `tuition`, `graduationDate`, `score`, `risk`, `prerequisiteCount`, `load`, and `institution` validates to an equivalent `{ scenarioId, target }` object and simulates canonically identically to the clean payload. The schema itself is unchanged.
- **Golden fixtures:** one independent fixture per demo scenario (switch to CS, CS minor, graduate early, transfer-priced path, semester off, health informatics) with literal hand-computed credits, credit delta, cost, cost delta, semesters, completion term/date, career fit, risk level, and ranking, derived from catalog contributions and the documented formulas. Fixtures import no production calculation helpers and are never captured from engine output; each shows its arithmetic in comments.
- **Transfer separation:** the four attributes assert independently.

## Requirements doc updates

Amend the v2 doc in place so it explicitly records: the canonical normalized serialization rule, stable identity independent of array position, the exact BaselineFacts scope (and that risk/uncertainty are excluded), integer credit boundaries, `additionalSemesters × 2` with the two-semester = 4-point regression, the exact `{ scenarioId, target }` AI schema, institution validation before candidate generation, the no-input-mutation rule, course-level career-fit authority with explicit final rounding, ranking-only priorities, completion terminology and date convention, the two-rate pricing formula, the verbatim risk table and bands, `UNCERTAINTY_ESCALATION_THRESHOLD = 2`, confirmed-records vs `importUncertainty` separation, the typed unsupported-institution contract, transfer attribute separation, and the expanded invariant + golden-fixture suite.

## Verification

Full Vitest run covering determinism, career fit, risk, uncertainty, import, institution, AI boundary, transfer, and golden fixtures. Then a manual What-If → Compare → Why → Plan walk at 390px and 1440px confirming "Estimated completion", "Based on planned course sequence", "Estimated tuition", and "Based on Fork's $485/credit planning assumption" read consistently across `PathCard`, `Scores`, `WhyPath`, `BranchTree`, `compare`, `path`, `plan`, `home`, `index`, and `what-if`. No new functionality, no redesign.
