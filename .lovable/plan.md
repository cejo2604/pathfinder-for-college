# Fork v2 — Amendments: Determinism Hardening

Amend the existing v2 requirements doc (`.lovable/plan/fork-requirements-analysis-v2-2026-08-12.md`) in place and implement the corrections below. No new product features, no redesign.

## What changes in the app

1. **Generic baseline.** `BASELINE_PATH_ID` becomes `"baseline"` (the current-plan spec keeps its content, loses the Biology-specific id). The card label is derived from the student's program ("Continue current plan — Biology, B.S."). All references in routes (`compare`, `home`, `index`, `path`) and scenario path lists switch to the generic id. Baseline facts are computed once per profile and are identical for every scenario and every priority ordering.

2. **Completion wording.** `graduationDate`/`graduationTerm` become `estimatedCompletionDate`/`estimatedCompletionTerm` in the engine and every label reads "Estimated completion" with "Based on planned course sequence" underneath. The Fall→December / Spring→May / Summer→August mapping stays, now documented as a Fork estimate.

3. **Tuition as an assumption.** Rates move into one exported planning-assumption config object (in-program $485/credit; the $540 rate is renamed to what it actually models — credits priced under the transfer-pricing assumption). UI shows "Estimated tuition" plus "Based on Fork's $485/credit planning assumption". Evidence category stays Estimated.

4. **Career fit derived from coursework.** Each catalog course gets a fixed skill-contribution map, and each path's skill coverage is computed from the student's completed + in-progress + that path's planned courses instead of the hand-authored `skillCoverage` numbers. Score stays `sum(weight × coverage) × 100`, rounded, 0–100. The engine also returns career-fit evidence: relevant completed / in-progress / planned courses, and skills with thin or prerequisite-blocked coverage. Path cards and the "Why this path?" drawer render that evidence next to the score with the existing Fork-estimate tooltip.

5. **Risk stays qualitative, unknowns stay unknown.** Risk keeps the four levels and gains an explicit list of drivers returned by the engine (extra semesters, extra credits, prerequisite count, average load, unapplied credits, summer use). Unknown facts are never scored; they are returned as separate uncertainty drivers, and one documented rule may raise the level by one step when unresolved constraints exist. Risk is never exposed as 0–100.

6. **Institution guardrail.** The demo institution is declared explicitly in the data layer. If the profile's school is not the supported institution, simulation routes show an unsupported-institution state instead of running the demo catalog.

7. **Import scope.** CSV stays supported (it is already a deterministic, model-free parse) and gets end-to-end tests alongside PDF. Review-before-confirm, ambiguous-row flagging, and fail-closed extraction behavior are asserted rather than assumed.

8. **AI boundary.** Unchanged in behavior: the classifier returns a scenario id or unresolved, narration only rephrases engine output. Added: when free text contains an unsupported assumption (for example a 21-credit load), the What-If page surfaces the limitation instead of simulating it.

## Tests (the acceptance gate)

Expand `src/lib/fork/engine.test.ts` and add two new spec files:

- **Invariants:** baseline is scenario-independent; baseline deltas are zero; candidate path sets are unchanged by priority order; priorities change ranking only; credits/cost/semester/career figures are unchanged by priorities; identical input yields byte-identical output; scores stay 0–100; risk is a level, not a number; unknowns never become numbers; unsupported situations surface as Unsupported; all deltas use the same baseline.
- **Golden fixtures:** one fixture per demo scenario (switch to CS, CS minor, graduate early, transfer, semester off, health-informatics) pinning baseline, candidate paths, credits and deltas, cost and deltas, semesters, completion term, career fit, risk level, and ranking under a fixed priority order.
- **AI boundary:** "switch to Computer Science" classifies to the switch-major scenario; vague input returns unresolved; classification output contains no figures.
- **Import:** PDF and CSV extraction produce structured rows, flag ambiguity, and fail closed.

## Requirements doc updates

Amend the v2 doc's engine-contract, trust-model, scope, and verification sections to cover: generic baseline, completion terminology, course-derived skill coverage, unknown/risk separation, tuition assumptions, institution guardrail, import support, new invariants, golden fixtures, AI-boundary tests.

## Technical notes

- Baseline facts are computed from the baseline spec + profile in one place and passed into every per-path simulation, so no scenario can mutate them.
- Renamed engine fields require touching `PathCard`, `Scores`, `WhyPath`, `BranchTree`, `compare`, `path`, `plan`, `home`, `index`, `what-if`.
- Hand-authored `skillCoverage` on `PathSpec` is deleted once course-level skill maps replace it; expect some fixture numbers to shift, which is why goldens are written after the change lands.
- Final step: full `vitest` run plus a pass over the What-If → Compare → Why → Plan flow at 390px and 1440px.
