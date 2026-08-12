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
  PLANNING_ASSUMPTIONS,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  SKILL_LABELS,
  SUPPORTED_INSTITUTION_IDS,
  type Career,
  type Priority,
  type SkillKey,
  type StudentCourse,
  type StudentProfile,
  careerById,
  courseByCode,
  courseSkillContributions,
} from "./data";
import { BASELINE_PATH_ID, PATHS, type PathSpec, type PlannedTerm, pathSpecById } from "./paths";

export type RiskLevel = "Low" | "Moderate" | "Medium" | "High";

export interface ScoreBreakdown {
  careerFit: number;
  costEfficiency: number;
  graduationEfficiency: number;
  flexibility: number;
  continuity: number;
  courseworkEfficiency: number;
  overallFit: number;
}

/** One skill's contribution to career fit, with the courses that produced it. */
export interface CareerFitSkillEvidence {
  skill: SkillKey;
  label: string;
  /** Career skill weight, 0-1. */
  weight: number;
  /** Capped coverage from courses in scope, 0-1. */
  coverage: number;
  courses: { code: string; contribution: number }[];
}

export interface CareerFitResult {
  score: number;
  evidence: CareerFitSkillEvidence[];
}

export interface RiskDriver {
  label: string;
  points: number;
}

export interface RiskAssessment {
  level: RiskLevel;
  points: number;
  drivers: RiskDriver[];
  /** Named unknowns; they never carry numeric weight. */
  uncertaintyDrivers: string[];
  /** True when unknowns pushed the qualitative level up one band. */
  escalatedForUncertainty: boolean;
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
  estimatedCompletionTerm: string;
  estimatedCompletionDate: string;
  estimatedCost: number;
  additionalCost: number;
  tuitionPerCredit: number;
  changesInstitution: boolean;
  pricedAtOutOfInstitutionRate: boolean;
  prerequisiteCourses: string[];
  prerequisiteCount: number;
  scores: ScoreBreakdown;
  careerFitEvidence: CareerFitSkillEvidence[];
  risk: RiskLevel;
  riskPoints: number;
  riskDrivers: RiskDriver[];
  uncertaintyDrivers: string[];
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

/** Every timeline label in Fork is an estimate derived from the planned sequence. */
export const COMPLETION_DISCLAIMER = "Based on planned course sequence";
export const PLANNING_ASSUMPTION_LABEL = PLANNING_ASSUMPTIONS.label;

const currency = (n: number) => `$${n.toLocaleString("en-US")}`;
export const formatCurrency = currency;
export const formatDelta = (n: number) => (n === 0 ? "No change" : `${n > 0 ? "+" : "−"}${currency(Math.abs(n))}`);

/** Terms end on a fixed calendar day: Fall Dec 31, Spring May 31, Summer Aug 31. */
const TERM_END: Record<string, { month: string; day: number }> = {
  Fall: { month: "December", day: 31 },
  Spring: { month: "May", day: 31 },
  Summer: { month: "August", day: 31 },
};

export function completionDateFromTerm(label: string): string {
  const [season, year] = label.split(" ");
  const end = TERM_END[season ?? "Spring"] ?? TERM_END["Spring"]!;
  return `${end.month} ${end.day}, ${year}`;
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/* ----------------------------------------------- institution-ID guardrail */

export type InstitutionSupport =
  | { status: "supported"; institutionId: string }
  | { status: "unsupported"; reason: "missing" | "unrecognized"; institutionId: string | null };

/** First precondition of any simulation: fail closed on unverifiable catalogs. */
export function validateInstitution(profile: StudentProfile): InstitutionSupport {
  const id = profile.institutionId?.trim();
  if (!id) return { status: "unsupported", reason: "missing", institutionId: null };
  if (!(SUPPORTED_INSTITUTION_IDS as readonly string[]).includes(id)) {
    return { status: "unsupported", reason: "unrecognized", institutionId: id };
  }
  return { status: "supported", institutionId: id };
}

export class UnsupportedInstitutionError extends Error {
  readonly support: InstitutionSupport;
  constructor(support: InstitutionSupport) {
    super("Fork cannot simulate against an unverified institution catalog.");
    this.name = "UnsupportedInstitutionError";
    this.support = support;
  }
}

export const UNSUPPORTED_INSTITUTION_MESSAGE =
  "Fork can only simulate against a verified institution catalog. Link a supported school to continue.";

/* -------------------------------------------------------------- coursework */

/** Imported rows only count once the student confirms them. */
export const isConfirmedCourse = (course: StudentCourse) =>
  course.source !== "import" || course.verified === true;

const unconfirmedCourses = (profile: StudentProfile) => profile.courses.filter((c) => !isConfirmedCourse(c));

/**
 * Courses in scope for career fit: the student's confirmed completed and
 * in-progress records first (they have authority), then the path's planned
 * catalog courses. Deduplicated by course code, first occurrence wins.
 */
function coursesInScope(profile: StudentProfile, spec: PathSpec): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (code: string) => {
    if (!courseByCode(code) || seen.has(code)) return;
    seen.add(code);
    out.push(code);
  };
  for (const c of profile.courses) {
    if (!isConfirmedCourse(c)) continue;
    if (c.status !== "completed" && c.status !== "in_progress") continue;
    add(c.code);
  }
  for (const term of spec.terms) for (const code of term.courses) add(code);
  return out;
}

/**
 * Career fit is derived only from catalog course skill contributions — never
 * from hand-authored path coverage. Coverage per skill is capped at 1 and the
 * final score is rounded exactly once.
 */
export function careerFit(profile: StudentProfile, spec: PathSpec, career: Career): CareerFitResult {
  const codes = coursesInScope(profile, spec);
  const evidence: CareerFitSkillEvidence[] = career.skillWeights.map(({ skill, weight }) => {
    const courses = codes
      .map((code) => ({ code, contribution: courseSkillContributions(code)[skill as SkillKey] ?? 0 }))
      .filter((c) => c.contribution > 0);
    const coverage = Math.min(1, courses.reduce((s, c) => s + c.contribution, 0));
    return { skill: skill as SkillKey, label: SKILL_LABELS[skill as SkillKey], weight, coverage, courses };
  });
  const raw = evidence.reduce((sum, e) => sum + e.weight * e.coverage, 0) * 100;
  return { score: clamp(Math.round(raw)), evidence };
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

/* ------------------------------------------------------------ baseline facts */

/** Immutable reference facts for one profile + career. Never recomputed per path. */
export interface BaselineFacts {
  readonly pathId: string;
  readonly programLabel: string;
  readonly credits: number;
  readonly cost: number;
  readonly semesters: number;
  readonly estimatedCompletionTerm: string;
  readonly estimatedCompletionDate: string;
  readonly careerFitScore: number;
  readonly careerFitEvidence: readonly CareerFitSkillEvidence[];
}

export function baselineProgramLabel(profile: StudentProfile): string {
  const major = profile.major?.trim();
  if (!major) return "your current program";
  const degree = profile.degree?.trim();
  return degree ? `${major} (${degree})` : major;
}

const baselineCache = new WeakMap<StudentProfile, Map<string, BaselineFacts>>();

export function baselineFacts(profile: StudentProfile, careerId?: string): BaselineFacts {
  const career = careerById(careerId ?? DEFAULT_CAREER_ID) ?? (CAREERS[0] as Career);
  const cached = baselineCache.get(profile)?.get(career.id);
  if (cached) return cached;

  const spec = pathSpecById(BASELINE_PATH_ID) as PathSpec;
  const credits = spec.terms.reduce((s, t) => s + t.credits, 0);
  const academic = spec.terms.filter((t) => t.kind === "academic");
  const term = (academic[academic.length - 1] as PlannedTerm).label;
  const fit = careerFit(profile, spec, career);
  const facts: BaselineFacts = Object.freeze({
    pathId: spec.id,
    programLabel: baselineProgramLabel(profile),
    credits,
    cost: credits * tuitionRate(spec),
    semesters: academic.length,
    estimatedCompletionTerm: term,
    estimatedCompletionDate: completionDateFromTerm(term),
    careerFitScore: fit.score,
    careerFitEvidence: Object.freeze(fit.evidence),
  });

  const byCareer = baselineCache.get(profile) ?? new Map<string, BaselineFacts>();
  byCareer.set(career.id, facts);
  baselineCache.set(profile, byCareer);
  return facts;
}

/* ------------------------------------------------------------------ pricing */

/** Cost = credits x rate; the out-of-institution rate applies only on transfer. */
function tuitionRate(spec: PathSpec): number {
  return spec.changesInstitution
    ? PLANNING_ASSUMPTIONS.outOfInstitutionTuitionPerCredit
    : PLANNING_ASSUMPTIONS.tuitionPerCredit;
}

/* --------------------------------------------------------------------- risk */

/**
 * Risk points, exactly as documented:
 *   additional semesters      x2 each
 *   additional credits        0 / 1-11 -> 1 / 12+ -> 2
 *   prerequisites             0 / 1-2 -> 1 / 3+ -> 2
 *   average load              >=19 -> 2, >=18 -> 1
 *   unapplied credits         0 / 1-11 -> 1 / 12+ -> 2
 *   summer sessions           any -> 1
 * Bands: 0-1 Low, 2-3 Moderate, 4-6 Medium, 7+ High.
 * Unknowns carry no points; two or more escalate the band by one.
 */
const UNCERTAINTY_ESCALATION_THRESHOLD = 2;
const BANDS: RiskLevel[] = ["Low", "Moderate", "Medium", "High"];

function bandFor(points: number): RiskLevel {
  if (points <= 1) return "Low";
  if (points <= 3) return "Moderate";
  if (points <= 6) return "Medium";
  return "High";
}

export function assessRisk(
  path: {
    additionalSemesters: number;
    additionalCredits: number;
    prerequisiteCount: number;
    averageLoad: number;
    unappliedCredits: number;
    summerSessions: number;
  },
  uncertaintyDrivers: string[] = [],
): RiskAssessment {
  const drivers: RiskDriver[] = [];
  const add = (label: string, points: number) => {
    if (points > 0) drivers.push({ label, points });
  };

  add(
    `${path.additionalSemesters} additional semester${path.additionalSemesters === 1 ? "" : "s"}`,
    Math.max(0, path.additionalSemesters) * 2,
  );
  add(
    `${path.additionalCredits} additional credits`,
    path.additionalCredits >= 12 ? 2 : path.additionalCredits > 0 ? 1 : 0,
  );
  add(
    `${path.prerequisiteCount} prerequisite course${path.prerequisiteCount === 1 ? "" : "s"}`,
    path.prerequisiteCount >= 3 ? 2 : path.prerequisiteCount > 0 ? 1 : 0,
  );
  add(
    `Average load ${path.averageLoad} credits per term`,
    path.averageLoad >= 19 ? 2 : path.averageLoad >= 18 ? 1 : 0,
  );
  add(
    `${path.unappliedCredits} completed credits do not apply`,
    path.unappliedCredits >= 12 ? 2 : path.unappliedCredits > 0 ? 1 : 0,
  );
  add(`${path.summerSessions} summer session${path.summerSessions === 1 ? "" : "s"}`, path.summerSessions > 0 ? 1 : 0);

  const points = drivers.reduce((s, d) => s + d.points, 0);
  const base = bandFor(points);
  const escalate = uncertaintyDrivers.length >= UNCERTAINTY_ESCALATION_THRESHOLD;
  const level = escalate ? (BANDS[Math.min(BANDS.indexOf(base) + 1, BANDS.length - 1)] as RiskLevel) : base;

  return {
    level,
    points,
    drivers,
    uncertaintyDrivers: [...uncertaintyDrivers],
    escalatedForUncertainty: escalate && level !== base,
  };
}

/* --------------------------------------------------------------- simulation */

export interface SimulateOptions {
  profile: StudentProfile;
  careerId?: string;
  /** Overrides the profile's ranked priorities (used by the live re-ranking panel). */
  priorities?: Priority[];
}

/**
 * Pure: reads the profile, catalog and baseline facts and mutates none of them.
 */
export function simulatePath(specId: string, opts: SimulateOptions): SimulatedPath {
  const support = validateInstitution(opts.profile);
  if (support.status !== "supported") throw new UnsupportedInstitutionError(support);

  const spec = pathSpecById(specId);
  if (!spec) throw new Error(`Unknown path: ${specId}`);
  const career = careerById(opts.careerId ?? DEFAULT_CAREER_ID) ?? (CAREERS[0] as Career);
  const base = baselineFacts(opts.profile, career.id);
  const isBaseline = spec.id === BASELINE_PATH_ID;

  const creditsRemaining = spec.terms.reduce((s, t) => s + t.credits, 0);
  const academicTerms = spec.terms.filter((t) => t.kind === "academic");
  const semesters = academicTerms.length;
  const summerSessions = spec.terms.filter((t) => t.kind === "summer" && t.credits > 0).length;
  const breakTerms = spec.terms.filter((t) => t.kind === "break").length;
  const averageLoad =
    Math.round((academicTerms.reduce((s, t) => s + t.credits, 0) / Math.max(semesters, 1)) * 10) / 10;
  const completionTerm = (academicTerms[academicTerms.length - 1] as PlannedTerm).label;
  const tuitionPerCredit = tuitionRate(spec);
  const estimatedCost = creditsRemaining * tuitionPerCredit;
  const requiredCredits = DEGREE_CREDITS + spec.extraProgramCredits;
  const appliedCredits = isBaseline ? opts.profile.creditsCompleted : spec.appliedCredits;
  const unappliedCredits = Math.max(0, opts.profile.creditsCompleted - appliedCredits);

  const additionalCredits = creditsRemaining - base.credits;
  const additionalSemesters = semesters - base.semesters;
  const additionalCost = estimatedCost - base.cost;
  const prerequisiteCount = spec.prerequisiteCourses.length;

  const fit = careerFit(opts.profile, spec, career);
  const costEfficiency = clamp(Math.round((base.cost / estimatedCost) * 100));
  const loadPenalty = Math.max(0, averageLoad - 16.5) * 2 + (summerSessions > 0 ? 3 : 0);
  const graduationEfficiency = clamp(Math.round((base.semesters / semesters) * 100 - loadPenalty));
  const courseworkEfficiency = clamp(100 - Math.max(0, additionalCredits) * 2 - unappliedCredits);

  const weights = priorityWeights(opts.priorities ?? opts.profile.priorities);
  const overallFit = Math.round(
    weights.graduate_on_time * graduationEfficiency +
      weights.minimize_cost * costEfficiency +
      weights.career_opportunities * fit.score +
      weights.stay_close_to_major * spec.continuity +
      weights.minimize_coursework * courseworkEfficiency +
      weights.flexibility * spec.flexibility,
  );

  const pending = unconfirmedCourses(opts.profile).length;
  const uncertaintyDrivers = [
    ...spec.unknowns,
    ...(pending > 0 ? [`${pending} imported course row${pending === 1 ? "" : "s"} not yet confirmed`] : []),
  ];

  const risk = assessRisk(
    { additionalSemesters, additionalCredits, prerequisiteCount, averageLoad, unappliedCredits, summerSessions },
    uncertaintyDrivers,
  );

  return {
    id: spec.id,
    letter: spec.letter,
    name: spec.name,
    program: spec.program || base.programLabel,
    headline: spec.headline,
    creditsRemaining,
    additionalCredits,
    requiredCredits,
    appliedCredits,
    unappliedCredits,
    semesters,
    additionalSemesters,
    summerSessions,
    breakTerms,
    averageLoad,
    estimatedCompletionTerm: completionTerm,
    estimatedCompletionDate: completionDateFromTerm(completionTerm),
    estimatedCost,
    additionalCost,
    tuitionPerCredit,
    changesInstitution: spec.changesInstitution,
    pricedAtOutOfInstitutionRate: spec.changesInstitution,
    prerequisiteCourses: [...spec.prerequisiteCourses],
    prerequisiteCount,
    scores: {
      careerFit: fit.score,
      costEfficiency,
      graduationEfficiency,
      flexibility: spec.flexibility,
      continuity: spec.continuity,
      courseworkEfficiency,
      overallFit,
    },
    careerFitEvidence: fit.evidence,
    risk: risk.level,
    riskPoints: risk.points,
    riskDrivers: risk.drivers,
    uncertaintyDrivers: risk.uncertaintyDrivers,
    riskFactors: [...spec.riskFactors],
    advantages: [...spec.advantages],
    tradeoffs: [...spec.tradeoffs],
    opportunities: [...spec.opportunities],
    unknowns: [...spec.unknowns],
    terms: spec.terms.map((t) => ({ ...t, courses: [...t.courses], actions: [...t.actions] })),
    nextMoves: [...spec.nextMoves],
    isBaseline,
  };
}

export function simulatePaths(ids: string[], opts: SimulateOptions): SimulatedPath[] {
  return ids.map((id) => simulatePath(id, opts));
}

export type SimulationResult =
  | { status: "ok"; paths: SimulatedPath[] }
  | { status: "unsupported"; support: InstitutionSupport; message: string };

/** Institution-checked entry point: validates before any path is generated. */
export function simulate(ids: string[], opts: SimulateOptions): SimulationResult {
  const support = validateInstitution(opts.profile);
  if (support.status !== "supported") {
    return { status: "unsupported", support, message: UNSUPPORTED_INSTITUTION_MESSAGE };
  }
  return { status: "ok", paths: simulatePaths(ids, opts) };
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
    pathIds: ["baseline", "switch_cs", "cs_minor"],
    keywords: ["switch", "change major", "computer science", "cs major", "different major"],
    framing: "Three ways to get more technical, from no change to a full major switch.",
  },
  {
    id: "add_minor",
    question: "What if I add a Computer Science minor?",
    chip: "Add a minor",
    pathIds: ["baseline", "cs_minor", "bio_health_informatics"],
    keywords: ["minor", "add a minor", "informatics minor", "second field"],
    framing: "Two ways to add a credential without leaving Biology, next to no change at all.",
  },
  {
    id: "graduate_early",
    question: "What if I graduate one semester early?",
    chip: "Graduate early",
    pathIds: ["baseline", "graduate_early", "cs_minor"],
    keywords: ["early", "graduate early", "finish sooner", "accelerate", "faster"],
    framing: "What speed costs you, and what the extra semester buys.",
  },
  {
    id: "minimize_cost",
    question: "What if I want to minimize additional tuition?",
    chip: "Minimize cost",
    pathIds: ["baseline", "cs_minor", "switch_cs"],
    keywords: ["cost", "cheap", "tuition", "money", "afford", "minimize cost", "debt"],
    framing: "Ranked by what each additional credential actually costs.",
  },
  {
    id: "career_health_tech",
    question: "What if I want to work in healthcare technology?",
    chip: "Work in healthcare tech",
    pathIds: ["baseline", "cs_minor", "bio_health_informatics", "switch_cs"],
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
    pathIds: ["baseline", "transfer", "cs_minor"],
    keywords: ["transfer", "another school", "different university", "move"],
    framing: "What a transfer costs against staying put.",
  },
  {
    id: "semester_off",
    question: "What if I take a semester off?",
    chip: "Take a semester off",
    pathIds: ["baseline", "semester_off", "graduate_early"],
    keywords: ["semester off", "gap", "break", "leave of absence", "pause", "time off"],
    framing: "The delay a break creates, next to the opposite choice.",
  },
  {
    id: "missed_prerequisite",
    question: "What if I don't get a course I'm waitlisted for?",
    chip: "Miss a waitlisted course",
    pathIds: ["cs_minor", "baseline", "bio_health_informatics"],
    keywords: ["waitlist", "waitlisted", "don't get", "do not get", "no seat", "seat", "closed section", "miss a course"],
    framing: "What losing one seat does to the plan that depends on it.",
  },
];

export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id);

/** Waitlisted rows in the verified academic history, ordered by term. */
export function waitlistedCourses(profile: StudentProfile) {
  return profile.courses.filter((c) => c.status === "waitlisted");
}


/**
 * Deterministic free-text parsing: keyword match, no model, no invented
 * scenarios. Returns null when nothing matches, so ambiguous input can be
 * clarified instead of guessed.
 */
export function matchScenario(input: string): Scenario | null {
  const text = input.toLowerCase();
  let best: { scenario: Scenario; score: number } | null = null;
  for (const scenario of SCENARIOS) {
    let score = 0;
    for (const kw of scenario.keywords) if (text.includes(kw)) score += kw.split(" ").length;
    if (score > 0 && (!best || score > best.score)) best = { scenario, score };
  }
  return best?.scenario ?? null;
}

/** Same match, with Fork's default scenario when the text is unrecognized. */
export function parseScenario(input: string): Scenario {
  return matchScenario(input) ?? (scenarioById("career_health_tech") as Scenario);
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
      value: `${path.semesters} semesters${path.summerSessions ? ` + ${path.summerSessions} summer session` : ""} → ${path.estimatedCompletionDate}`,
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
      `It adds ${path.additionalSemesters} semester${path.additionalSemesters > 1 ? "s" : ""}, moving graduation to ${path.estimatedCompletionDate}, and ${formatDelta(path.additionalCost)} in estimated tuition.`,
    );
  } else if (path.additionalSemesters < 0) {
    lines.push(
      `It removes ${Math.abs(path.additionalSemesters)} semester, moving graduation to ${path.estimatedCompletionDate}, at the cost of ${path.averageLoad}-credit terms.`,
    );
  } else {
    lines.push(
      `It holds the ${path.estimatedCompletionDate} graduation date, ${path.additionalCost === 0 ? "with no change in estimated tuition" : `for ${formatDelta(path.additionalCost)} in estimated tuition`}, and ${path.additionalCredits > 0 ? `${path.additionalCredits} additional credits` : "no additional credits"}.`,
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
    `Graduation date: ${path.estimatedCompletionDate}. Semesters remaining: ${path.semesters}. Average load: ${path.averageLoad} credits.`,
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

/* ------------------------------------------------- priority-ordered planning */

export interface PriorityStep {
  priority: Priority;
  /** 1 = the student's top-ranked priority. */
  rank: number;
  label: string;
  /** Weight this priority carried in the overall fit score, as a percentage. */
  weightPct: number;
  /** The engine number this priority is measured against on the recommended path. */
  metric: string;
  /** Deterministic, actionable moves derived from engine output for this priority. */
  moves: string[];
}

export interface PriorityCareerPlan {
  /** Highest overall fit under the student's current priority order. */
  recommended: SimulatedPath;
  runnerUp: SimulatedPath | undefined;
  /** Every path in the dataset, ranked by overall fit under this priority order. */
  ranked: SimulatedPath[];
  /** Steps in the exact order the student ranked their priorities. */
  steps: PriorityStep[];
  summary: string;
}

function movesForPriority(priority: Priority, path: SimulatedPath, career: Career): string[] {
  switch (priority) {
    case "graduate_on_time":
      return [
        path.additionalSemesters > 0
          ? `Plan for ${path.semesters} academic semesters — ${path.additionalSemesters} more than staying put — and confirm the ${path.estimatedCompletionDate} date with your advisor.`
          : `Hold ${path.semesters} academic semesters at ~${path.averageLoad} credits to keep ${path.estimatedCompletionDate} intact.`,
        path.summerSessions > 0
          ? `Register for ${path.summerSessions} summer session${path.summerSessions > 1 ? "s" : ""} — the timeline above depends on ${path.summerSessions > 1 ? "them" : "it"}.`
          : `Register on your first enrollment day each term; a missed seat is what usually adds a semester.`,
      ];
    case "minimize_cost":
      return [
        `Budget ${formatCurrency(path.estimatedCost)} in remaining tuition (${path.creditsRemaining} credits × ${formatCurrency(path.tuitionPerCredit)}) — ${formatDelta(path.additionalCost)} against staying put.`,
        path.unappliedCredits > 0
          ? `Ask whether any of the ${path.unappliedCredits} credits that become electives here can be re-applied — each one you recover is ${formatCurrency(path.tuitionPerCredit)}.`
          : `Every completed credit applies on this path, so there is no re-take cost to recover.`,
      ];
    case "career_opportunities":
      return [
        `Target ${career.title}: this path scores ${path.scores.careerFit}/100 on career fit.`,
        career.coursework.length
          ? `Get ${career.coursework.slice(0, 3).join(", ")} onto your plan — they carry the most weight for this direction.`
          : `Confirm which courses this direction expects with your department.`,
        career.internshipIdeas[0]
          ? `Line up an internship: ${career.internshipIdeas[0]}.`
          : `Line up one internship in this field before your final year.`,
      ];
    case "stay_close_to_major":
      return [
        `${path.program} keeps ${path.scores.continuity}/100 continuity with ${path.isBaseline ? "your current major" : "the major you started"}.`,
        path.prerequisiteCount > 0
          ? `Clear ${path.prerequisiteCount} prerequisite${path.prerequisiteCount > 1 ? "s" : ""} first: ${path.prerequisiteCourses.join(", ")}.`
          : `No new prerequisites are needed — you can start with degree requirements straight away.`,
      ];
    case "minimize_coursework":
      return [
        path.additionalCredits > 0
          ? `This path adds ${path.additionalCredits} credits beyond the baseline — ask about credit-by-exam or substitutions before you register.`
          : `This path adds no extra credits beyond the baseline (${path.creditsRemaining} remaining).`,
        `Verify that ${path.appliedCredits} of your completed credits apply here; that number drives everything above.`,
      ];
    case "flexibility":
      return [
        `Flexibility scores ${path.scores.flexibility}/100 here, with ${path.risk.toLowerCase()} risk.`,
        career.adjacentCareers?.length
          ? `Keep ${career.adjacentCareers.slice(0, 2).join(" and ")} reachable by choosing electives that serve both.`
          : `Choose electives that serve more than one destination so a change of mind stays cheap.`,
      ];
  }
}

const METRIC_FOR: Record<Priority, (p: SimulatedPath) => string> = {
  graduate_on_time: (p) => `${p.estimatedCompletionDate} · ${p.semesters} semesters`,
  minimize_cost: (p) => `${formatCurrency(p.estimatedCost)} remaining tuition`,
  career_opportunities: (p) => `${p.scores.careerFit}/100 career fit`,
  stay_close_to_major: (p) => `${p.scores.continuity}/100 continuity`,
  minimize_coursework: (p) => `${p.creditsRemaining} credits remaining`,
  flexibility: (p) => `${p.scores.flexibility}/100 flexibility`,
};

/**
 * Builds a plan ordered by the student's own priority ranking. The recommended
 * path is whichever path scores highest under those weights, and each step is
 * emitted in priority order — reorder the priorities and the plan reorders.
 */
export function priorityCareerPlan(
  opts: SimulateOptions & { pathId?: string | undefined },
): PriorityCareerPlan {
  const priorities = opts.priorities?.length === PRIORITY_ORDER.length ? opts.priorities : PRIORITY_ORDER;
  const weights = priorityWeights(priorities);
  const career = careerById(opts.careerId ?? DEFAULT_CAREER_ID) ?? (CAREERS[0] as Career);

  const ranked = rankPaths(simulatePaths(PATHS.map((p) => p.id), opts));
  const recommended =
    (opts.pathId ? ranked.find((p) => p.id === opts.pathId) : undefined) ?? (ranked[0] as SimulatedPath);
  const runnerUp = ranked.find((p) => p.id !== recommended.id);

  const steps: PriorityStep[] = priorities.map((priority, i) => ({
    priority,
    rank: i + 1,
    label: PRIORITY_LABELS[priority],
    weightPct: Math.round(weights[priority] * 100),
    metric: METRIC_FOR[priority](recommended),
    moves: movesForPriority(priority, recommended, career),
  }));

  const top = priorities.slice(0, 2).map((p) => PRIORITY_LABELS[p].toLowerCase());
  const comparison = !runnerUp
    ? ""
    : runnerUp.scores.overallFit === recommended.scores.overallFit
      ? `, tied with ${runnerUp.name}`
      : runnerUp.scores.overallFit > recommended.scores.overallFit
        ? `, while ${runnerUp.name} scores ${runnerUp.scores.overallFit}/100 under the same order`
        : `, ahead of ${runnerUp.name} at ${runnerUp.scores.overallFit}/100`;
  const summary = `Because you ranked ${top.join(" above ")}, Fork builds this plan around ${recommended.name} — ${recommended.scores.overallFit}/100 overall fit${comparison}.`;

  return { recommended, runnerUp, ranked, steps, summary };
}
