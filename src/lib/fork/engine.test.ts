import { describe, expect, it } from "vitest";
import { COURSES, EXAMPLE_PROFILE, FIRST_PLANNED_TERM, PLANNING_ASSUMPTIONS, courseByCode } from "./data";
import {
  ALL_PATH_IDS,
  DEGREE_CREDITS,
  UnsupportedInstitutionError,
  assessRisk,
  baselineFacts,
  completionDateFromTerm,
  matchScenario,
  simulate,
  simulatePath,
  simulatePaths,
  validateAiScenarioSelection,
} from "./engine";
import { BASELINE_PATH_ID, PATHS } from "./paths";

const opts = { profile: EXAMPLE_PROFILE };
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
      expect(TERM_ORDER(path.estimatedCompletionTerm)).toBeGreaterThanOrEqual(TERM_ORDER(FIRST_PLANNED_TERM));
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
      EXAMPLE_PROFILE.courses.filter((c) => c.status === "completed").map((c) => c.code),
    );
    for (const path of paths) {
      const taken = new Set(completed);
      // In-progress work finishes before the first planned term.
      for (const c of EXAMPLE_PROFILE.courses) if (c.status === "in_progress") taken.add(c.code);
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
    const costFirst = simulatePath("baseline", {
      profile: EXAMPLE_PROFILE,
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

describe("scenario matching", () => {
  it("returns null for input it cannot recognize instead of guessing", () => {
    expect(matchScenario("what if I adopt a dog next semester")).toBeNull();
  });

  it("matches a recognizable question to a real scenario", () => {
    expect(matchScenario("what if I switch to computer science")?.id).toBe("switch_major");
  });
});

/* ------------------------------------------------------------- determinism */

/**
 * Canonical serialization for determinism comparisons: key order is normalized
 * so two runs are compared by value, never by object identity or key order.
 */
function normalizeEngineOutput(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeEngineOutput);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, normalizeEngineOutput((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

const canonical = (v: unknown) => JSON.stringify(normalizeEngineOutput(v));

describe("determinism", () => {
  it("produces canonically identical output for identical input", () => {
    expect(canonical(simulatePaths(ALL_PATH_IDS, opts))).toBe(canonical(paths));
  });

  it("is invariant to the order paths are requested in", () => {
    const forward = simulatePaths(ALL_PATH_IDS, opts);
    const reversed = simulatePaths([...ALL_PATH_IDS].reverse(), opts);
    for (const path of forward) {
      const other = reversed.find((p) => p.id === path.id);
      expect(canonical(other)).toBe(canonical(path));
    }
  });

  it("does not mutate any input", () => {
    const profile = structuredClone(EXAMPLE_PROFILE);
    const before = canonical(profile);
    const catalogBefore = canonical(COURSES);
    const specsBefore = canonical(PATHS);
    simulatePaths(ALL_PATH_IDS, { profile });
    expect(canonical(profile)).toBe(before);
    expect(canonical(COURSES)).toBe(catalogBefore);
    expect(canonical(PATHS)).toBe(specsBefore);
  });
});

describe("baseline facts", () => {
  const facts = baselineFacts(EXAMPLE_PROFILE);

  it("matches the simulated baseline path by value", () => {
    expect(facts.credits).toBe(baseline.creditsRemaining);
    expect(facts.cost).toBe(baseline.estimatedCost);
    expect(facts.semesters).toBe(baseline.semesters);
    expect(facts.estimatedCompletionTerm).toBe(baseline.estimatedCompletionTerm);
    expect(facts.estimatedCompletionDate).toBe(baseline.estimatedCompletionDate);
    expect(facts.careerFitScore).toBe(baseline.scores.careerFit);
  });

  it("excludes risk and uncertainty", () => {
    expect(Object.keys(facts).sort()).toEqual(
      [
        "careerFitEvidence",
        "careerFitScore",
        "cost",
        "credits",
        "estimatedCompletionDate",
        "estimatedCompletionTerm",
        "pathId",
        "programLabel",
        "semesters",
      ].sort(),
    );
  });

  it("resists mutation", () => {
    const before = canonical(facts);
    expect(() => {
      (facts as unknown as Record<string, unknown>)["credits"] = 999;
    }).toThrow();
    expect(canonical(baselineFacts(EXAMPLE_PROFILE))).toBe(before);
  });

  it("uses the student's own program, not a hardcoded major", () => {
    expect(facts.programLabel).toContain(EXAMPLE_PROFILE.major);
    const other = baselineFacts({ ...structuredClone(EXAMPLE_PROFILE), major: "Sociology" });
    expect(other.programLabel).toContain("Sociology");
  });
});

describe("priorities are ranking-only", () => {
  it("changes overall fit ranking but no academic fact", () => {
    const reversed = [...EXAMPLE_PROFILE.priorities].reverse();
    for (const path of paths) {
      const other = simulatePath(path.id, { profile: EXAMPLE_PROFILE, priorities: reversed });
      expect(other.creditsRemaining).toBe(path.creditsRemaining);
      expect(other.estimatedCost).toBe(path.estimatedCost);
      expect(other.estimatedCompletionDate).toBe(path.estimatedCompletionDate);
      expect(other.scores.careerFit).toBe(path.scores.careerFit);
      expect(other.risk).toBe(path.risk);
    }
  });
});

describe("completion dates", () => {
  it("uses end-of-term calendar days", () => {
    expect(completionDateFromTerm("Fall 2028")).toBe("December 31, 2028");
    expect(completionDateFromTerm("Spring 2028")).toBe("May 31, 2028");
    expect(completionDateFromTerm("Summer 2027")).toBe("August 31, 2027");
  });
});

describe("pricing", () => {
  it("prices at the out-of-institution rate only when the path changes institution", () => {
    for (const path of paths) {
      expect(path.pricedAtOutOfInstitutionRate).toBe(path.changesInstitution);
      expect(path.tuitionPerCredit).toBe(
        path.changesInstitution
          ? PLANNING_ASSUMPTIONS.outOfInstitutionTuitionPerCredit
          : PLANNING_ASSUMPTIONS.tuitionPerCredit,
      );
      expect(path.estimatedCost).toBe(path.creditsRemaining * path.tuitionPerCredit);
    }
  });
});

describe("career fit", () => {
  it("derives coverage from catalog courses, capped and deduplicated", () => {
    for (const path of paths) {
      for (const e of path.careerFitEvidence) {
        expect(e.coverage).toBeGreaterThanOrEqual(0);
        expect(e.coverage).toBeLessThanOrEqual(1);
        const codes = e.courses.map((c) => c.code);
        expect(new Set(codes).size).toBe(codes.length);
        for (const code of codes) expect(courseByCode(code)).toBeTruthy();
      }
    }
  });

  it("rounds the final score exactly once inside 0-100", () => {
    for (const path of paths) {
      expect(Number.isInteger(path.scores.careerFit)).toBe(true);
      expect(path.scores.careerFit).toBeGreaterThanOrEqual(0);
      expect(path.scores.careerFit).toBeLessThanOrEqual(100);
    }
  });

  it("ignores unconfirmed imported rows", () => {
    const withPending = structuredClone(EXAMPLE_PROFILE);
    withPending.courses = [
      ...withPending.courses,
      { code: "COMP 480", status: "completed", term: "Fall 2025", source: "import", verified: false },
    ];
    const pending = simulatePath(BASELINE_PATH_ID, { profile: withPending });
    expect(pending.scores.careerFit).toBe(baseline.scores.careerFit);
    expect(pending.creditsRemaining).toBe(baseline.creditsRemaining);
    expect(pending.estimatedCost).toBe(baseline.estimatedCost);
    expect(pending.uncertaintyDrivers.some((d) => d.includes("not yet confirmed"))).toBe(true);
  });
});

describe("risk formula", () => {
  const empty = {
    additionalSemesters: 0,
    additionalCredits: 0,
    prerequisiteCount: 0,
    averageLoad: 15,
    unappliedCredits: 0,
    summerSessions: 0,
  };

  it("scores integer credit boundaries at 0, 1, 11 and 12", () => {
    expect(assessRisk({ ...empty, additionalCredits: 0 }).points).toBe(0);
    expect(assessRisk({ ...empty, additionalCredits: 1 }).points).toBe(1);
    expect(assessRisk({ ...empty, additionalCredits: 11 }).points).toBe(1);
    expect(assessRisk({ ...empty, additionalCredits: 12 }).points).toBe(2);
    expect(assessRisk({ ...empty, unappliedCredits: 0 }).points).toBe(0);
    expect(assessRisk({ ...empty, unappliedCredits: 1 }).points).toBe(1);
    expect(assessRisk({ ...empty, unappliedCredits: 11 }).points).toBe(1);
    expect(assessRisk({ ...empty, unappliedCredits: 12 }).points).toBe(2);
  });

  it("scores prerequisite boundaries at 0, 1, 2 and 3", () => {
    expect(assessRisk({ ...empty, prerequisiteCount: 0 }).points).toBe(0);
    expect(assessRisk({ ...empty, prerequisiteCount: 1 }).points).toBe(1);
    expect(assessRisk({ ...empty, prerequisiteCount: 2 }).points).toBe(1);
    expect(assessRisk({ ...empty, prerequisiteCount: 3 }).points).toBe(2);
  });

  it("charges two points per additional semester", () => {
    expect(assessRisk({ ...empty, additionalSemesters: 1 }).points).toBe(2);
    expect(assessRisk({ ...empty, additionalSemesters: 2 }).points).toBe(4);
  });

  it("bands points 0-1 Low, 2-3 Moderate, 4-6 Medium, 7+ High", () => {
    expect(assessRisk({ ...empty }).level).toBe("Low");
    expect(assessRisk({ ...empty, additionalSemesters: 1 }).level).toBe("Moderate");
    expect(assessRisk({ ...empty, additionalSemesters: 2 }).level).toBe("Medium");
    expect(assessRisk({ ...empty, additionalSemesters: 4 }).level).toBe("High");
  });

  it("escalates one band on two or more unknowns without adding points", () => {
    const plain = assessRisk({ ...empty });
    const uncertain = assessRisk({ ...empty }, ["seat availability", "advisor approval"]);
    expect(uncertain.points).toBe(plain.points);
    expect(uncertain.level).toBe("Moderate");
    expect(uncertain.escalatedForUncertainty).toBe(true);
    expect(assessRisk({ ...empty }, ["one unknown"]).level).toBe("Low");
  });
});

describe("institution guardrail", () => {
  it("fails closed when the institution id is missing", () => {
    const { institutionId: _omit, ...rest } = structuredClone(EXAMPLE_PROFILE);
    const result = simulate(ALL_PATH_IDS, { profile: rest as typeof EXAMPLE_PROFILE });
    expect(result.status).toBe("unsupported");
    if (result.status === "unsupported") expect(result.support.reason).toBe("missing");
  });

  it("fails closed when the institution id is unrecognized", () => {
    const profile = { ...structuredClone(EXAMPLE_PROFILE), institutionId: "some_other_school" };
    const result = simulate(ALL_PATH_IDS, { profile });
    expect(result.status).toBe("unsupported");
    if (result.status === "unsupported") expect(result.support.reason).toBe("unrecognized");
    expect(() => simulatePath(BASELINE_PATH_ID, { profile })).toThrow(UnsupportedInstitutionError);
  });

  it("validates the institution before generating any path", () => {
    const profile = { ...structuredClone(EXAMPLE_PROFILE), institutionId: "nope" };
    expect(() => simulatePath("not_a_real_path", { profile })).toThrow(UnsupportedInstitutionError);
  });

  it("simulates a supported institution", () => {
    const result = simulate(ALL_PATH_IDS, opts);
    expect(result.status).toBe("ok");
  });
});

describe("AI boundary", () => {
  it("keeps only scenarioId and target regardless of key order", () => {
    const validated = validateAiScenarioSelection({
      creditsRemaining: 12,
      target: "Computer Science",
      estimatedCost: 1,
      scenarioId: "switch_major",
      careerFit: 99,
    });
    expect(Object.keys(validated).sort()).toEqual(["scenarioId", "target"]);
    expect(validated.scenarioId).toBe("switch_major");
    expect(validated.target).toBe("Computer Science");
  });

  it("rejects a scenario id the engine does not own", () => {
    expect(validateAiScenarioSelection({ scenarioId: "become_an_astronaut" }).scenarioId).toBeNull();
  });
});

/* ---------------------------------------------------------- golden fixtures */

describe("golden fixtures", () => {
  const fixture = (id: string) => paths.find((p) => p.id === id)!;

  it("pins the baseline path", () => {
    const p = fixture("baseline");
    expect(p.creditsRemaining).toBe(66);
    expect(p.tuitionPerCredit).toBe(485);
    expect(p.estimatedCost).toBe(32010); // 66 x 485
    expect(p.semesters).toBe(4);
    expect(p.estimatedCompletionDate).toBe("May 31, 2028");
    expect(p.scores.careerFit).toBe(64);
    expect(p.riskPoints).toBe(0);
    expect(p.risk).toBe("Moderate"); // 0 points, escalated by 2 unknowns
  });

  it("pins the switch-to-CS path", () => {
    const p = fixture("switch_cs");
    expect(p.creditsRemaining).toBe(84);
    expect(p.estimatedCost).toBe(40740); // 84 x 485
    expect(p.additionalCost).toBe(8730);
    expect(p.additionalSemesters).toBe(1);
    expect(p.unappliedCredits).toBe(18);
    expect(p.estimatedCompletionDate).toBe("December 31, 2028");
    expect(p.scores.careerFit).toBe(92);
    expect(p.riskPoints).toBe(8);
    expect(p.risk).toBe("High");
  });

  it("pins the CS-minor path", () => {
    const p = fixture("cs_minor");
    expect(p.creditsRemaining).toBe(72);
    expect(p.estimatedCost).toBe(34920); // 72 x 485
    expect(p.estimatedCompletionDate).toBe("May 31, 2028");
    expect(p.scores.careerFit).toBe(94);
    expect(p.riskPoints).toBe(3);
    expect(p.risk).toBe("Medium"); // 3 points, escalated by 2 unknowns
  });

  it("pins the transfer path at the out-of-institution rate", () => {
    const p = fixture("transfer");
    expect(p.tuitionPerCredit).toBe(540);
    expect(p.creditsRemaining).toBe(78);
    expect(p.estimatedCost).toBe(42120); // 78 x 540
    expect(p.pricedAtOutOfInstitutionRate).toBe(true);
    expect(p.estimatedCompletionDate).toBe("December 31, 2028");
  });
});
