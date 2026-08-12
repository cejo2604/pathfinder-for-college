# Fork v2 — Amendments: Determinism Hardening

Amend the existing v2 requirements doc (`.lovable/plan/fork-requirements-analysis-v2-2026-08-12.md`) in place and implement the corrections below. No new product features, no redesign.

## What changes in the app

1. **Generic baseline.** `BASELINE_PATH_ID` becomes `"baseline"` (the current-plan spec keeps its content, loses the Biology-specific id). The card label is derived from the student's program ("Continue current plan — Biology, B.S."). All references in routes (`compare`, `home`, `index`, `path`) and scenario path lists switch to the generic id. Baseline facts are computed once per profile and are identical for every scenario and every priority ordering.

2. **Completion wording.** `graduationDate`/`graduationTerm` become `estimatedCompletionDate`/`estimatedCompletionTerm` in the engine and every label reads "Estimated completion" with "Based on planned course sequence" underneath. The Fall→December / Spring→May / Summer→August mapping stays, now documented as a Fork estimate.

3. **Tuition as an assumption.** Rates move into one exported planning-assumption config object. Two separate concepts, kept separate in the data model: the in-program planning rate ($485/credit) and the out-of-institution planning rate ($540/credit) used when a path is priced at another institution. UI shows "Estimated tuition" plus "Based on Fork's $485/credit planning assumption". Evidence category stays Estimated.

4. **Career fit derived from coursework, with one aggregation rule.** Each catalog course gets a fixed per-skill contribution (0–1). A path's coverage for a skill is `min(1, sum of contributions from that skill's courses in scope)` — additive, then hard-capped at 1.0, so coverage can never exceed 100%. Contribution weight is identical for completed, in-progress, and planned courses (a course counts once, in full, when it appears anywhere in scope); status only affects the evidence labels, never the number. Score stays `sum(weight × coverage) × 100`, rounded, 0–100. The engine also returns career-fit evidence: relevant completed / in-progress / planned courses, and skills with thin or prerequisite-blocked coverage. Path cards and the "Why this path?" drawer render that evidence next to the score with the existing Fork-estimate tooltip.

5. **Risk stays qualitative, unknowns stay unknown.** Risk keeps the four levels, computed from the existing numeric drivers (extra semesters, extra credits, prerequisite count, average load, unapplied credits, summer use) and returned with its driver list. Unknown facts contribute zero points, ever. Separately, the engine returns uncertainty drivers — the path's unknown facts plus any unconfirmed imported course rows. Exact rule: if a path has **two or more** uncertainty drivers, the qualitative level is raised exactly one step (Low → Moderate → Medium/High → High, High stays High); one or zero drivers changes nothing. That threshold is a named constant and is documented in the requirements. Risk is never exposed as 0–100.

6. **Institution guardrail by canonical ID.** The supported demo institution gets a canonical `institutionId` declared in the data layer; the catalog and the profile both carry it, and the engine checks the ID (never the free-text school name). `simulatePath`/`simulatePaths` fail closed — throwing a typed unsupported-institution result before any calculation — when the profile's institution ID is missing or unrecognized. Simulation routes render an unsupported-institution state instead of results.

7. **Import scope.** CSV stays supported (already a deterministic, model-free parse) and is tested end to end alongside PDF. Ambiguous or unconfirmed rows are never handed to the engine: only rows the student confirmed enter the profile, and a failed extraction produces no academic record.

8. **AI boundary by schema.** The classifier's validated output is restricted to `{ scenarioId, target }` drawn from the catalogued scenario/program lists — there is no field through which credit load, tuition, dates, scores, risk, course counts, or prerequisite status can reach the engine; anything extra is dropped at the validator. Ambiguous input returns unresolved and the UI asks for clarification. When free text carries an unsupported assumption (for example a 21-credit load), the What-If page surfaces the limitation instead of simulating it. Narration only rephrases engine output.

## Tests (the acceptance gate)

Expand `src/lib/fork/engine.test.ts` and add new spec files:

- **Invariants:** baseline is scenario-independent; baseline deltas are zero; candidate path sets are unchanged by priority order; priorities change ranking only; credits/cost/semester/career figures are unchanged by priorities; identical input yields byte-identical output; scores stay 0–100; risk is a level, not a number; unknowns never become numeric points; unsupported situations surface as Unsupported; all deltas use the same baseline.
- **Career-fit invariants:** every skill coverage value is within 0–1 (including a synthetic case where many courses target one skill, proving the 1.0 cap); the same profile + path yields identical scores across repeated runs; reordering priorities leaves every career-fit score and its evidence unchanged.
- **Golden fixtures:** one fixture per demo scenario (switch to CS, CS minor, graduate early, transfer-priced path, semester off, health-informatics) with expected credits, deltas, cost, cost deltas, semesters, completion term, career fit, risk level, and ranking written as hand-computed literal constants in the fixture file — derived by hand from the catalog and the documented formulas, never captured from engine output. Each fixture states the arithmetic in a comment so a wrong implementation fails rather than re-baselines.
- **AI boundary:** "switch to Computer Science" classifies to the switch-major scenario with the CS target; vague input returns unresolved; a classifier payload carrying extra academic fields (credits, tuition, dates, scores) is stripped by the validator and cannot influence a simulation.
- **Import states:** for both PDF and CSV — a valid file produces structured confirmed-able rows; an ambiguous file flags the ambiguous rows and yields nothing usable until confirmed; a failed extraction creates no academic record. Plus a test that unconfirmed rows never reach the engine.

Also verify the "Transfer schools" scenario: it currently models an actual institution change (partial credit loss, admission unknown) priced at the out-of-institution rate. The requirements and data model will keep "changes institution" and "priced at the out-of-institution rate" as separate attributes rather than conflating them under "transfer".


## Requirements doc updates

Amend the v2 doc's engine-contract, trust-model, scope, and verification sections to cover: generic baseline, completion terminology, course-derived skill coverage, unknown/risk separation, tuition assumptions, institution guardrail, import support, new invariants, golden fixtures, AI-boundary tests.

## Technical notes

- Baseline facts are computed from the baseline spec + profile in one place and passed into every per-path simulation, so no scenario can mutate them.
- Renamed engine fields require touching `PathCard`, `Scores`, `WhyPath`, `BranchTree`, `compare`, `path`, `plan`, `home`, `index`, `what-if`.
- Hand-authored `skillCoverage` on `PathSpec` is deleted once course-level skill maps replace it; expect some fixture numbers to shift, which is why goldens are written after the change lands.
- Final step: full `vitest` run plus a pass over the What-If → Compare → Why → Plan flow at 390px and 1440px.
