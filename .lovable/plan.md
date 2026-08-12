# Fork — Requirements Tightening (response to the review)

## My assessment of the review

The critique is good and I agree with its central point: "deterministic" needs to be a written contract, not a principle. But a lot of what it flags as missing already exists in code and is only missing from the document. Reading the engine before planning:

Already implemented today (needs documenting, not building):
- Baseline and deltas — `BASELINE_PATH_ID = "stay_biology"` in `src/lib/fork/paths.ts`; `baselineFacts()` in `engine.ts` computes baseline credits/semesters/cost, and every path's additional credits and cost delta are measured against it.
- Career fit is already deterministic (Option A) — `careerFitScore()` multiplies a path's `skillCoverage` by the selected career's `skillWeights`. No AI involvement.
- Risk is already rule-driven — `riskFor()` returns Low/Moderate/Medium-High/High from prerequisite count, added credits and extra semesters, and each path lists `riskFactors`.
- Priority weights exist — `priorityWeights()` converts the user's ranked priority list into normalized weights; `overallFit` is a weighted sum, so re-ranking is deterministic.
- Verified/Estimated/Unknown exists — `evidenceFor()` tags each fact `verified | estimated | unknown`, and each path carries an `unknowns` list.
- AI boundary is already enforced structurally — `ai.server.ts` only classifies free text into an existing scenario or narrates engine output.

Genuinely missing, and worth acting on:
1. No engine tests. The consistency check was a throwaway script, so nothing prevents a future edit from silently breaking credit/cost/date math. This is the review's strongest point.
2. Planning horizon is hardcoded (`FIRST_PLANNED_TERM = "Fall 2026"`), so graduation dates are demo-fixed rather than derived from the current term.
3. Candidate paths are hand-authored specs with hardcoded term plans in `paths.ts`. The engine computes metrics deterministically, but the paths themselves are curated for one demo catalog. The document should say so plainly instead of implying institution-wide coverage.
4. No score-direction documentation, no privacy/retention section, no out-of-scope section, no reduced-motion behavior for the branching tree.

Where I disagree with the review:
- Dropping the numeric career-fit score (its Option B) would remove the thing that makes priority re-ranking visible and comparable. Keep the number, keep the "Fork estimate" label.
- The "input at the bottom of the simulator" requirement is a deliberate design decision you asked for; it stays.
- Its list of ~18 academic edge cases is more than V1 should carry. The right move is a single rule: unsupported situations surface as Unsupported, not simulated.
- Renaming "best fit" is cosmetic and the UI already frames results by your priorities.

## Plan

### 1. Rewrite the requirements document
Restructure `.lovable/plan/fork-requirements-problem-analysis-*.md` (or a fresh analysis doc) to add three sections, per the review's structural suggestion:

- **Engine contract** — the actual pipeline as built: `StudentProfile → Scenario → PathSpec candidates → baseline → per-path metrics → weighted ranking`. For each displayed number, state its formula and its source (transcript, catalog, or Fork assumption). Explicit rule: missing input yields Unknown, never a silent estimate.
- **Data trust model** — Verified / Estimated / Unknown / Unsupported, with concrete examples for each and the rule that Fork never promotes an Unknown into an Estimate without a documented assumption. Separate the two sources of truth: the student record is authoritative for completed history, the catalog for requirements and prerequisites.
- **Scope and boundaries** — what the curated demo catalog covers and does not; the "unsupported situations surface as Unsupported" rule; a plain out-of-scope list (no registration, no admission/salary/employment prediction, no portal access, no financial-aid determination, does not replace advising).

Also add: a score table naming every score and its direction (career fit, cost efficiency, graduation efficiency, flexibility, overall — higher is better; risk is a level, not a score, so it cannot be misread as a rating), a Privacy & Data Lifecycle section (what is stored, that transcript text goes to the AI gateway for extraction only, retention and deletion), and the clarified timing split (30 seconds to compare results, 90–120 seconds for the full first-time flow).

### 2. Add an engine test suite
Add Vitest tests over the demo dataset asserting the invariants: credits never negative; additional credits equal path minus baseline; cost delta equals path cost minus baseline cost; graduation date never precedes the current term; no course scheduled before its prerequisites; identical input produces identical output; baseline deltas are zero.

### 3. Two small code fixes
- Derive the first planned term from the current term instead of the hardcoded `Fall 2026`, keeping fall as the fallback.
- Respect `prefers-reduced-motion` in the branching tree animation.

Nothing else changes: no new features, no new visualizations, no AI expansion.

## Technical notes
Doc work lands in `.lovable/plan/`. Tests go in `src/lib/fork/engine.test.ts` run via Vitest. Term derivation touches `data.ts`/`engine.ts` only; the reduced-motion change touches `BranchTree.tsx`.
