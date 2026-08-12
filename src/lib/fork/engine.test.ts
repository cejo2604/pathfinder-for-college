import { describe, expect, it } from "vitest";
import { DEMO_STUDENT, FIRST_PLANNED_TERM, courseByCode } from "./data";
import { ALL_PATH_IDS, DEGREE_CREDITS, simulatePath, simulatePaths } from "./engine";
import { BASELINE_PATH_ID } from "./paths";

const opts = { profile: DEMO_STUDENT };
const paths = simulatePaths(ALL_PATH_IDS, opts);
const baseline = simulatePath(BASELINE_PATH_ID, opts);

const TERM_ORDER = (label: string) => {
  const [season, year] = label.split(" ");
  const offset = season === "Spring" ? 0 : season === "Summer" ? 1 : 2;
  return Number(year) * 3 + offset;
};

describe("engine invariants", () => {
  it("simulates every catalogued path", () => {
    expect(paths).toHaveLength(ALL_PATH_IDS.length);
  });

  it("never reports negative credits or cost", () => {
    for (const path of paths) {
      expect(path.creditsRemaining).toBeGreaterThanOrEqual(0);
      expect(path.estimatedCost).toBeGreaterThanOrEqual(0);
      expect(path.requiredCredits).toBeGreaterThanOrEqual(DEGREE_CREDITS);
      expect(path.unappliedCredits).toBeGreaterThanOrEqual(0);
    }
  });

  it("measures additional credits and cost against the baseline path", () => {
    for (const path of paths) {
      expect(path.additionalCredits).toBe(path.creditsRemaining - baseline.creditsRemaining);
      expect(path.additionalCost).toBe(path.estimatedCost - baseline.estimatedCost);
      expect(path.additionalSemesters).toBe(path.semesters - baseline.semesters);
    }
  });

  it("gives the baseline zero deltas", () => {
    expect(baseline.isBaseline).toBe(true);
    expect(baseline.additionalCredits).toBe(0);
    expect(baseline.additionalCost).toBe(0);
    expect(baseline.additionalSemesters).toBe(0);
  });

  it("derives cost from credits and the stated per-credit rate", () => {
    for (const path of paths) {
      expect(path.estimatedCost).toBe(path.creditsRemaining * path.tuitionPerCredit);
    }
  });

  it("starts planning at the first term after the current one and never graduates earlier", () => {
    for (const path of paths) {
      const first = path.terms[0];
      expect(first?.label).toBe(FIRST_PLANNED_TERM);
      expect(TERM_ORDER(path.graduationTerm)).toBeGreaterThanOrEqual(TERM_ORDER(FIRST_PLANNED_TERM));
    }
  });

  it("orders planned terms forward in time", () => {
    for (const path of paths) {
      const order = path.terms.map((t) => TERM_ORDER(t.label));
      expect(order).toEqual([...order].sort((a, b) => a - b));
    }
  });

  it("never schedules a course before its prerequisites or repeats completed work", () => {
    const completed = new Set(
      DEMO_STUDENT.courses.filter((c) => c.status === "completed").map((c) => c.code),
    );
    for (const path of paths) {
      const taken = new Set(completed);
      // In-progress work finishes before the first planned term.
      for (const c of DEMO_STUDENT.courses) if (c.status === "in_progress") taken.add(c.code);
      for (const term of path.terms) {
        for (const code of term.courses) {
          const course = courseByCode(code);
          if (!course) continue;
          expect(taken.has(code), `${path.id}: ${code} scheduled twice`).toBe(false);
          for (const prereq of course.prerequisites) {
            expect(taken.has(prereq), `${path.id}: ${code} before ${prereq}`).toBe(true);
          }
        }
        for (const code of term.courses) taken.add(code);
      }
    }
  });

  it("keeps every score inside 0-100", () => {
    for (const path of paths) {
      for (const [key, value] of Object.entries(path.scores)) {
        expect(value, `${path.id}.${key}`).toBeGreaterThanOrEqual(0);
        expect(value, `${path.id}.${key}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it("is deterministic for identical input", () => {
    expect(JSON.stringify(simulatePaths(ALL_PATH_IDS, opts))).toBe(JSON.stringify(paths));
  });

  it("re-ranks deterministically when priorities change", () => {
    const costFirst = simulatePath("stay_biology", {
      profile: DEMO_STUDENT,
      priorities: [
        "minimize_cost",
        "graduate_on_time",
        "career_opportunities",
        "minimize_coursework",
        "flexibility",
        "stay_close_to_major",
      ],
    });
    expect(costFirst.creditsRemaining).toBe(baseline.creditsRemaining);
    expect(costFirst.scores.careerFit).toBe(baseline.scores.careerFit);
    expect(typeof costFirst.scores.overallFit).toBe("number");
  });
});
