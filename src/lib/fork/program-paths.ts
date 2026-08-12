/**
 * Catalog-driven path generation.
 *
 * The authored fixtures in ./paths.ts cover timeline decisions (graduate early,
 * transfer, semester off). This file covers the two decisions a student should be
 * able to make against ANY program in the catalog: switching major, or adding a
 * minor. Everything here is derived deterministically from the catalog plus the
 * student's confirmed record — there is no randomness and no authored numbers
 * per program.
 */

import {
  PROGRAMS,
  type DegreeProgram,
  type StudentProfile,
  courseByCode,
  courseSkillContributions,
  programById,
  programCourses,
} from "./data";
import { BASELINE_PATH_ID, PATHS, type PathSpec, type PlannedTerm } from "./paths";

export type ProgramPathMode = "switch" | "minor";

const ELECTIVE_CREDITS = 3;
const DEGREE_CREDITS = 120;
/** Credits of a minor that Fork assumes fit inside existing free electives. */
const MINOR_CREDITS_ABSORBED_BY_ELECTIVES = 12;

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export const programPathId = (mode: ProgramPathMode, programId: string) => `program:${mode}:${programId}`;

export function parseProgramPathId(id: string): { mode: ProgramPathMode; programId: string } | null {
  const parts = id.split(":");
  if (parts.length !== 3 || parts[0] !== "program") return null;
  const mode = parts[1];
  if (mode !== "switch" && mode !== "minor") return null;
  return { mode, programId: parts[2] as string };
}

/** Programs a student can switch into / add, excluding what they already have. */
export function selectableMajors(profile: StudentProfile): DegreeProgram[] {
  return PROGRAMS.filter((p) => p.kind === "major" && !sameName(p.name, profile.major));
}

export function selectableMinors(profile: StudentProfile): DegreeProgram[] {
  return PROGRAMS.filter((p) => p.kind === "minor" && !sameName(p.name, profile.minor ?? ""));
}

function sameName(programName: string, studentField: string) {
  const a = programName.toLowerCase();
  const b = (studentField ?? "").trim().toLowerCase();
  if (!b) return false;
  return a === b || a.startsWith(`${b},`) || a.startsWith(`${b} `);
}

const confirmed = (profile: StudentProfile) =>
  profile.courses.filter((c) => (c.source !== "import" || c.verified === true) && c.status === "completed");

/** The student's current major program, when it maps to the catalog. */
function currentMajor(profile: StudentProfile): DegreeProgram | undefined {
  return PROGRAMS.find((p) => p.kind === "major" && sameName(p.name, profile.major));
}

function advanceTerm(label: string): string {
  const [season, year] = label.split(" ");
  const y = Number(year);
  return season === "Fall" ? `Spring ${y + 1}` : `Fall ${y}`;
}

function firstPlannedTerm(): string {
  const baseline = PATHS.find((p) => p.id === BASELINE_PATH_ID) as PathSpec;
  const academic = baseline.terms.filter((t) => t.kind === "academic");
  return (academic[0] as PlannedTerm).label;
}

function baselineSemesters(): number {
  const baseline = PATHS.find((p) => p.id === BASELINE_PATH_ID) as PathSpec;
  return baseline.terms.filter((t) => t.kind === "academic").length;
}

const creditsOf = (code: string) => courseByCode(code)?.credits ?? ELECTIVE_CREDITS;

/**
 * Build a path for switching into `programId` or adding it as a minor.
 * Returns undefined when the program is not in the catalog.
 */
export function buildProgramPath(
  mode: ProgramPathMode,
  programId: string,
  profile: StudentProfile,
): PathSpec | undefined {
  const program = programById(programId);
  if (!program) return undefined;

  const target = programCourses(programId);
  const completedCodes = new Set(confirmed(profile).map((c) => c.code));
  const remainingCourses = target.filter((code) => !completedCodes.has(code));

  // Credits that no longer apply: courses required by the student's current major
  // that the target program does not require. General courses always still apply.
  const current = currentMajor(profile);
  const currentOnly = current
    ? programCourses(current.id).filter((code) => !target.includes(code))
    : [];
  const lostCredits =
    mode === "switch"
      ? currentOnly.filter((code) => completedCodes.has(code)).reduce((s, code) => s + creditsOf(code), 0)
      : 0;

  const appliedCredits = Math.max(0, profile.creditsCompleted - lostCredits);
  const extraProgramCredits =
    mode === "minor"
      ? Math.max(
          0,
          remainingCourses.reduce((s, code) => s + creditsOf(code), 0) - MINOR_CREDITS_ABSORBED_BY_ELECTIVES,
        )
      : 0;

  const creditsNeeded = Math.max(0, DEGREE_CREDITS + extraProgramCredits - appliedCredits);
  const semesters = Math.max(1, Math.max(Math.ceil(creditsNeeded / 18), mode === "minor" ? baselineSemesters() : 1));
  const targetLoad = Math.ceil(creditsNeeded / semesters);

  // Fill terms with the remaining program courses first, then electives.
  const queue = [...remainingCourses];
  const terms: PlannedTerm[] = [];
  let label = firstPlannedTerm();
  let placed = 0;
  for (let i = 0; i < semesters; i += 1) {
    const isLast = i === semesters - 1;
    const capacity = isLast ? creditsNeeded - placed : targetLoad;
    const courses: string[] = [];
    let credits = 0;
    while (credits < capacity) {
      const next = queue[0];
      if (next && credits + creditsOf(next) <= capacity) {
        queue.shift();
        courses.push(next);
        credits += creditsOf(next);
      } else if (!next || credits + ELECTIVE_CREDITS <= capacity) {
        courses.push("Elective");
        credits += ELECTIVE_CREDITS;
      } else {
        break;
      }
    }
    placed += credits;
    terms.push({
      label,
      kind: "academic",
      credits,
      courses,
      actions:
        i === 0
          ? [mode === "switch" ? `Declare ${program.name} with your advisor` : `Declare the ${program.name}`]
          : isLast
            ? ["Graduation application"]
            : ["Confirm next-term seats with your advisor"],
    });
    label = advanceTerm(label);
  }

  // Prerequisites the student still needs that the plan does not itself cover.
  const planned = new Set(remainingCourses);
  const prerequisiteCourses = Array.from(
    new Set(
      remainingCourses.flatMap((code) =>
        (courseByCode(code)?.prerequisites ?? []).filter((p) => !completedCodes.has(p) && !planned.has(p)),
      ),
    ),
  );

  const skills = new Set<string>();
  for (const code of target) for (const key of Object.keys(courseSkillContributions(code))) skills.add(key);

  const continuity =
    profile.creditsCompleted > 0
      ? clamp(Math.round((appliedCredits / profile.creditsCompleted) * 100))
      : 100;

  const majorLabel = profile.major?.trim() || "your current program";

  return {
    id: programPathId(mode, programId),
    letter: mode === "switch" ? "S" : "M",
    name: mode === "switch" ? `Switch to ${program.name}` : `${majorLabel} + ${program.name}`,
    program: mode === "switch" ? program.name : `${majorLabel} with ${program.name}`,
    headline:
      mode === "switch"
        ? `Move fully into ${program.name}.`
        : `Keep ${majorLabel} and add ${program.name}.`,
    appliedCredits,
    extraProgramCredits,
    prerequisiteCourses,
    changesInstitution: false,
    continuity,
    flexibility: clamp(60 + skills.size * 6),
    advantages:
      mode === "switch"
        ? [
            `Full ${program.name} coursework on the transcript`,
            `${appliedCredits} of your ${profile.creditsCompleted} completed credits still apply`,
          ]
        : [
            `Keeps ${majorLabel} intact — every completed credit still applies`,
            `Adds ${program.name} coursework recognized on the transcript`,
          ],
    tradeoffs:
      mode === "switch"
        ? [
            lostCredits > 0
              ? `${lostCredits} completed credits no longer count toward the degree`
              : "Leaves your current major behind",
            `${prerequisiteCourses.length} prerequisite course${prerequisiteCourses.length === 1 ? "" : "s"} to clear first`,
          ]
        : [`Heavier terms (about ${targetLoad} credits)`, `Less depth than a full ${program.name.replace(" minor", "")} degree`],
    riskFactors: [
      `${creditsNeeded} credits remaining across ${semesters} term${semesters === 1 ? "" : "s"}`,
      `Average load about ${targetLoad} credits`,
      prerequisiteCourses.length > 0
        ? `Prerequisites: ${prerequisiteCourses.join(", ")}`
        : "No outstanding prerequisites",
    ],
    opportunities: [
      `Internships aligned with ${program.name}`,
      `Portfolio projects using ${program.name} coursework`,
    ],
    unknowns: [
      `Seat availability for ${program.name} courses in the terms shown`,
      mode === "switch" ? "Departmental approval for the major change" : "Minor declaration deadline",
    ],
    terms,
    nextMoves: [
      mode === "switch"
        ? `Meet your advisor to start the change of major into ${program.name}.`
        : `Meet your advisor to declare the ${program.name}.`,
      prerequisiteCourses.length > 0
        ? `Confirm clearance for ${prerequisiteCourses.join(", ")}.`
        : "Confirm the first-term course sequence is offered.",
      "Re-check the plan after each term so the estimate stays current.",
    ],
  };
}

/** Resolves a generated path id, or undefined when the id is not one of ours. */
export function generatedPathSpec(id: string, profile: StudentProfile): PathSpec | undefined {
  const parsed = parseProgramPathId(id);
  if (!parsed) return undefined;
  return buildProgramPath(parsed.mode, parsed.programId, profile);
}
