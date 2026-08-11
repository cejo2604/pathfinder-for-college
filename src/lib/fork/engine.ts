/**
 * Deterministic simulation engine.
 *
 * Every number rendered in Fork comes from this file. There is no randomness and
 * no language model in this path — given the same profile, scenario and priority
 * weights, the output is always identical.
 */

import {
  CAREERS,
  DEFAULT_CAREER_ID,
  PRIORITY_ORDER,
  type Career,
  type Priority,
  type SkillKey,
  type StudentProfile,
  careerById,
  courseByCode,
} from "./data";
import { BASELINE_PATH_ID, PATHS, type PathSpec, type PlannedTerm, pathSpecById } from "./paths";

export type RiskLevel = "Low" | "Moderate" | "Medium/High" | "High";

export interface ScoreBreakdown {
  careerFit: number;
  costEfficiency: number;
  graduationEfficiency: number;
  flexibility: number;
  continuity: number;
  courseworkEfficiency: number;
  overallFit: number;
}

export interface SimulatedPath {
  id: string;
  letter: string;
  name: string;
  program: string;
  headline: string;
  creditsRemaining: number;
  additionalCredits: number;
  requiredCredits: number;
  appliedCredits: number;
  unappliedCredits: number;
  semesters: number;
  additionalSemesters: number;
  summerSessions: number;
  breakTerms: number;
  averageLoad: number;
  graduationTerm: string;
  graduationDate: string;
  estimatedCost: number;
  additionalCost: number;
  tuitionPerCredit: number;
  prerequisiteCourses: string[];
  prerequisiteCount: number;
  scores: ScoreBreakdown;
  risk: RiskLevel;
  riskFactors: string[];
  advantages: string[];
  tradeoffs: string[];
  opportunities: string[];
  unknowns: string[];
  terms: PlannedTerm[];
  nextMoves: string[];
  isBaseline: boolean;
}

export const DEGREE_CREDITS = 120;

const currency = (n: number) => `$${n.toLocaleString("en-US")}`;
export const formatCurrency = currency;
export const formatDelta = (n: number) => (n === 0 ? "No change" : `${n > 0 ? "+" : "−"}${currency(Math.abs(n))}`);

const GRADUATION_MONTH: Record<string, string> = { Fall: "December", Spring: "May", Summer: "August" };

function graduationFromTerm(label: string): string {
  const [season, year] = label.split(" ");
  return `${GRADUATION_MONTH[season ?? "Spring"] ?? "May"} ${year}`;
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

function careerFitScore(spec: PathSpec, career: Career): number {
  const raw = career.skillWeights.reduce(
    (sum, { skill, weight }) => sum + weight * (spec.skillCoverage[skill as SkillKey] ?? 0),
    0,
  );
  return Math.round(raw * 100);
}

/** Priority ranking (index 0 = most important) becomes a normalized weight set. */
export function priorityWeights(priorities: Priority[]): Record<Priority, number> {
  const ordered = priorities.length === PRIORITY_ORDER.length ? priorities : PRIORITY_ORDER;
  const raw = ordered.map((_, i) => ordered.length - i);
  const total = raw.reduce((a, b) => a + b, 0);
  const out = {} as Record<Priority, number>;
  ordered.forEach((p, i) => {
    out[p] = (raw[i] as number) / total;
  });
  return out;
}

function baselineFacts() {
  const baseline = pathSpecById(BASELINE_PATH_ID) as PathSpec;
  const credits = baseline.terms.reduce((s, t) => s + t.credits, 0);
  const semesters = baseline.terms.filter((t) => t.kind === "academic").length;
  return { credits, semesters, cost: credits * baseline.tuitionPerCredit };
}

function riskFor(path: {
  additionalSemesters: number;
  additionalCredits: number;
  prerequisiteCount: number;
  averageLoad: number;
  unappliedCredits: number;
  summerSessions: number;
}): RiskLevel {
  let points = 0;
  points += path.additionalSemesters > 0 ? path.additionalSemesters * 2 : 0;
  points += path.additionalCredits >= 12 ? 2 : path.additionalCredits > 0 ? 1 : 0;
  points += path.prerequisiteCount >= 3 ? 2 : path.prerequisiteCount > 0 ? 1 : 0;
  points += path.averageLoad >= 19 ? 2 : path.averageLoad >= 18 ? 1 : 0;
  points += path.unappliedCredits >= 12 ? 2 : path.unappliedCredits > 0 ? 1 : 0;
  points += path.summerSessions > 0 ? 1 : 0;
  if (points <= 1) return "Low";
  if (points <= 3) return "Moderate";
  if (points <= 6) return "Medium/High";
  return "High";
}

export interface SimulateOptions {
  profile: StudentProfile;
  careerId?: string;
  /** Overrides the profile's ranked priorities (used by the live re-ranking panel). */
  priorities?: Priority[];
}

export function simulatePath(specId: string, opts: SimulateOptions): SimulatedPath {
  const spec = pathSpecById(specId);
  if (!spec) throw new Error(`Unknown path: ${specId}`);
  const career = careerById(opts.careerId ?? DEFAULT_CAREER_ID) ?? (CAREERS[0] as Career);
  const base = baselineFacts();

  const creditsRemaining = spec.terms.reduce((s, t) => s + t.credits, 0);
  const academicTerms = spec.terms.filter((t) => t.kind === "academic");
  const semesters = academicTerms.length;
  const summerSessions = spec.terms.filter((t) => t.kind === "summer" && t.credits > 0).length;
  const breakTerms = spec.terms.filter((t) => t.kind === "break").length;
  const averageLoad =
    Math.round((academicTerms.reduce((s, t) => s + t.credits, 0) / Math.max(semesters, 1)) * 10) / 10;
  const graduationTerm = (academicTerms[academicTerms.length - 1] as PlannedTerm).label;
  const estimatedCost = creditsRemaining * spec.tuitionPerCredit;
  const requiredCredits = DEGREE_CREDITS + spec.extraProgramCredits;
  const unappliedCredits = Math.max(0, opts.profile.creditsCompleted - spec.appliedCredits);

  const additionalCredits = creditsRemaining - base.credits;
  const additionalSemesters = semesters - base.semesters;
  const additionalCost = estimatedCost - base.cost;
  const prerequisiteCount = spec.prerequisiteCourses.length;

  const careerFit = careerFitScore(spec, career);
  const costEfficiency = clamp(Math.round((base.cost / estimatedCost) * 100));
  const loadPenalty = Math.max(0, averageLoad - 16.5) * 2 + (summerSessions > 0 ? 3 : 0);
  const graduationEfficiency = clamp(Math.round((base.semesters / semesters) * 100 - loadPenalty));
  const courseworkEfficiency = clamp(100 - Math.max(0, additionalCredits) * 2 - unappliedCredits);

  const weights = priorityWeights(opts.priorities ?? opts.profile.priorities);
  const overallFit = Math.round(
    weights.graduate_on_time * graduationEfficiency +
      weights.minimize_cost * costEfficiency +
      weights.career_opportunities * careerFit +
      weights.stay_close_to_major * spec.continuity +
      weights.minimize_coursework * courseworkEfficiency +
      weights.flexibility * spec.flexibility,
  );

  const risk = riskFor({
    additionalSemesters,
    additionalCredits,
    prerequisiteCount,
    averageLoad,
    unappliedCredits,
    summerSessions,
  });

  return {
    id: spec.id,
    letter: spec.letter,
    name: spec.name,
    program: spec.program,
    headline: spec.headline,
    creditsRemaining,
    additionalCredits,
    requiredCredits,
    appliedCredits: spec.appliedCredits,
    unappliedCredits,
    semesters,
    additionalSemesters,
    summerSessions,
    breakTerms,
    averageLoad,
    graduationTerm,
    graduationDate: graduationFromTerm(graduationTerm),
    estimatedCost,
    additionalCost,
    tuitionPerCredit: spec.tuitionPerCredit,
    prerequisiteCourses: spec.prerequisiteCourses,
    prerequisiteCount,
    scores: {
      careerFit,
      costEfficiency,
      graduationEfficiency,
      flexibility: spec.flexibility,
      continuity: spec.continuity,
      courseworkEfficiency,
      overallFit,
    },
    risk,
    riskFactors: spec.riskFactors,
    advantages: spec.advantages,
    tradeoffs: spec.tradeoffs,
    opportunities: spec.opportunities,
    unknowns: spec.unknowns,
    terms: spec.terms,
    nextMoves: spec.nextMoves,
    isBaseline: spec.id === BASELINE_PATH_ID,
  };
}

export function simulatePaths(ids: string[], opts: SimulateOptions): SimulatedPath[] {
  return ids.map((id) => simulatePath(id, opts));
}

export function rankPaths(paths: SimulatedPath[]): SimulatedPath[] {
  return [...paths].sort((a, b) => b.scores.overallFit - a.scores.overallFit);
}

/* ---------------------------------------------------------------- scenarios */

export interface Scenario {
  id: string;
  question: string;
  chip: string;
  pathIds: string[];
  keywords: string[];
  framing: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "switch_major",
    question: "What if I switch to Computer Science?",
    chip: "Switch my major",
    pathIds: ["stay_biology", "switch_cs", "cs_minor"],
    keywords: ["switch", "change major", "computer science", "cs major", "different major"],
    framing: "Three ways to get more technical, from no change to a full major switch.",
  },
  {
    id: "add_minor",
    question: "What if I add a Computer Science minor?",
    chip: "Add a minor",
    pathIds: ["stay_biology", "cs_minor", "bio_health_informatics"],
    keywords: ["minor", "add a minor", "informatics minor", "second field"],
    framing: "Two ways to add a credential without leaving Biology, next to no change at all.",
  },
  {
    id: "graduate_early",
    question: "What if I graduate one semester early?",
    chip: "Graduate early",
    pathIds: ["stay_biology", "graduate_early", "cs_minor"],
    keywords: ["early", "graduate early", "finish sooner", "accelerate", "faster"],
    framing: "What speed costs you, and what the extra semester buys.",
  },
  {
    id: "minimize_cost",
    question: "What if I want to minimize additional tuition?",
    chip: "Minimize cost",
    pathIds: ["stay_biology", "cs_minor", "switch_cs"],
    keywords: ["cost", "cheap", "tuition", "money", "afford", "minimize cost", "debt"],
    framing: "Ranked by what each additional credential actually costs.",
  },
  {
    id: "career_health_tech",
    question: "What if I want to work in healthcare technology?",
    chip: "Work in healthcare tech",
    pathIds: ["stay_biology", "cs_minor", "bio_health_informatics", "switch_cs"],
    keywords: ["healthcare technology", "health tech", "data scientist", "career", "informatics", "job"],
    framing: "Four routes to the same destination, with very different costs.",
  },
  {
    id: "maximize_flexibility",
    question: "What if I want to keep the most options open?",
    chip: "Maximize flexibility",
    pathIds: ["cs_minor", "switch_cs", "bio_health_informatics"],
    keywords: ["flexible", "flexibility", "options open", "not sure", "keep options"],
    framing: "Paths that leave the widest set of futures available.",
  },
  {
    id: "transfer",
    question: "What if I transfer to another school?",
    chip: "Transfer schools",
    pathIds: ["stay_biology", "transfer", "cs_minor"],
    keywords: ["transfer", "another school", "different university", "move"],
    framing: "What a transfer costs against staying put.",
  },
  {
    id: "semester_off",
    question: "What if I take a semester off?",
    chip: "Take a semester off",
    pathIds: ["stay_biology", "semester_off", "graduate_early"],
    keywords: ["semester off", "gap", "break", "leave of absence", "pause", "time off"],
    framing: "The delay a break creates, next to the opposite choice.",
  },
  {
    id: "missed_prerequisite",
    question: "What if I don't get a course I'm waitlisted for?",
    chip: "Miss a waitlisted course",
    pathIds: ["cs_minor", "stay_biology", "bio_health_informatics"],
    keywords: ["waitlist", "waitlisted", "don't get", "do not get", "no seat", "seat", "closed section", "miss a course"],
    framing: "What losing one seat does to the plan that depends on it.",
  },
];

export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id);

/** Waitlisted rows in the verified academic history, ordered by term. */
export function waitlistedCourses(profile: StudentProfile) {
  return profile.courses.filter((c) => c.status === "waitlisted");
}


/** Deterministic free-text parsing: keyword match, no model, no invented scenarios. */
export function parseScenario(input: string): Scenario {
  const text = input.toLowerCase();
  let best: { scenario: Scenario; score: number } | null = null;
  for (const scenario of SCENARIOS) {
    let score = 0;
    for (const kw of scenario.keywords) if (text.includes(kw)) score += kw.split(" ").length;
    if (score > 0 && (!best || score > best.score)) best = { scenario, score };
  }
  return best?.scenario ?? (scenarioById("career_health_tech") as Scenario);
}

/* -------------------------------------------------------------- explanation */

export interface Evidence {
  label: string;
  value: string;
  kind: "verified" | "estimated" | "unknown";
}

export function evidenceFor(path: SimulatedPath, profile: StudentProfile): Evidence[] {
  const completed = profile.courses.filter((c) => c.status === "completed").length;
  return [
    { label: "Credits completed", value: `${profile.creditsCompleted}`, kind: "verified" },
    { label: "Completed course records", value: `${completed} records on file`, kind: "verified" },
    { label: "Degree credits required", value: `${path.requiredCredits}`, kind: "verified" },
    {
      label: "Completed credits applying to this path",
      value: `${path.appliedCredits}${path.unappliedCredits ? ` (${path.unappliedCredits} become electives)` : ""}`,
      kind: "verified",
    },
    {
      label: "Prerequisites required",
      value: path.prerequisiteCount
        ? `${path.prerequisiteCount} — ${path.prerequisiteCourses.join(", ")}`
        : "None beyond current progress",
      kind: "verified",
    },
    { label: "Credits remaining", value: `${path.creditsRemaining}`, kind: "estimated" },
    { label: "Tuition per credit", value: `${currency(path.tuitionPerCredit)}`, kind: "estimated" },
    { label: "Estimated remaining tuition", value: currency(path.estimatedCost), kind: "estimated" },
    {
      label: "Graduation timeline",
      value: `${path.semesters} semesters${path.summerSessions ? ` + ${path.summerSessions} summer session` : ""} → ${path.graduationDate}`,
      kind: "estimated",
    },
    { label: "Average term load", value: `${path.averageLoad} credits`, kind: "estimated" },
    { label: "Fork tradeoff scores", value: "Comparison scores, not predictions", kind: "estimated" },
    ...path.unknowns.map((u) => ({ label: u, value: "Confirm with your institution", kind: "unknown" as const })),
  ];
}

/**
 * Composed strictly from engine output and profile data — no generated numbers,
 * no claims the dataset does not support.
 */
export function whyThisPath(path: SimulatedPath, profile: StudentProfile, priorities: Priority[]): string[] {
  const top = priorities.slice(0, 3).map((p) => p.replace(/_/g, " "));
  const lines: string[] = [];

  lines.push(
    `You have completed ${profile.creditsCompleted} credits toward ${profile.major} and are currently tracking a ${profile.graduationTarget} graduation.`,
  );

  if (path.unappliedCredits > 0) {
    lines.push(
      `On this path, ${path.appliedCredits} of those credits count toward the degree and ${path.unappliedCredits} become electives, which is why ${path.creditsRemaining} credits remain.`,
    );
  } else {
    lines.push(
      `On this path every completed credit still counts, leaving ${path.creditsRemaining} credits across ${path.semesters} semesters.`,
    );
  }

  if (path.additionalSemesters > 0) {
    lines.push(
      `It adds ${path.additionalSemesters} semester${path.additionalSemesters > 1 ? "s" : ""}, moving graduation to ${path.graduationDate}, and ${formatDelta(path.additionalCost)} in estimated tuition.`,
    );
  } else if (path.additionalSemesters < 0) {
    lines.push(
      `It removes ${Math.abs(path.additionalSemesters)} semester, moving graduation to ${path.graduationDate}, at the cost of ${path.averageLoad}-credit terms.`,
    );
  } else {
    lines.push(
      `It holds the ${path.graduationDate} graduation date, ${path.additionalCost === 0 ? "with no change in estimated tuition" : `for ${formatDelta(path.additionalCost)} in estimated tuition`}, and ${path.additionalCredits > 0 ? `${path.additionalCredits} additional credits` : "no additional credits"}.`,
    );
  }

  if (path.prerequisiteCount > 0) {
    lines.push(
      `${path.prerequisiteCount} prerequisite course${path.prerequisiteCount > 1 ? "s" : ""} (${path.prerequisiteCourses.join(", ")}) must be sequenced first, which drives the ${path.risk.toLowerCase()} risk rating.`,
    );
  }

  lines.push(
    `Measured against your stated goal (${profile.goalCategory}) it scores ${path.scores.careerFit}/100 on career fit, and against your top priorities — ${top.join(", ")} — it scores ${path.scores.overallFit}/100 overall.`,
  );

  return lines;
}

/** Engine-computed figures, flattened for the AI interpretation layer. */
export function pathFactSheet(path: SimulatedPath, profile: StudentProfile, priorities: Priority[]): string {
  return [
    `Student: ${profile.year}, current major ${profile.major}, ${profile.creditsCompleted} credits completed, graduation target ${profile.graduationTarget}, stated goal ${profile.goalCategory}.`,
    `Ranked priorities: ${priorities.map((p) => p.replace(/_/g, " ")).join(" > ")}.`,
    `Path: ${path.name} (${path.program}).`,
    `Graduation date: ${path.graduationDate}. Semesters remaining: ${path.semesters}. Average load: ${path.averageLoad} credits.`,
    `Credits remaining: ${path.creditsRemaining}. Additional credits vs current plan: ${path.additionalCredits}.`,
    `Completed credits applied: ${path.appliedCredits}. Credits becoming electives: ${path.unappliedCredits}.`,
    `Estimated remaining tuition: ${currency(path.estimatedCost)}. Change vs current plan: ${formatDelta(path.additionalCost)}. Semester change: ${path.additionalSemesters}.`,
    `Prerequisites to sequence: ${path.prerequisiteCount}${path.prerequisiteCourses.length ? ` (${path.prerequisiteCourses.join(", ")})` : ""}.`,
    `Risk: ${path.risk} — ${path.riskFactors.join("; ")}.`,
    `Scores out of 100 — career fit ${path.scores.careerFit}, cost efficiency ${path.scores.costEfficiency}, graduation efficiency ${path.scores.graduationEfficiency}, flexibility ${path.scores.flexibility}, overall fit ${path.scores.overallFit}.`,
    `Advantages: ${path.advantages.join("; ")}.`,
    `Tradeoffs: ${path.tradeoffs.join("; ")}.`,
  ].join("\n");
}

export const prerequisiteChain = (code: string): string[] => {
  const course = courseByCode(code);
  if (!course) return [];
  return course.prerequisites.flatMap((p) => [...prerequisiteChain(p), p]);
};

export const ALL_PATH_IDS = PATHS.map((p) => p.id);
