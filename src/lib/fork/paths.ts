import type { SkillKey } from "./data";
import { TRANSFER_TUITION_PER_CREDIT, TUITION_PER_CREDIT } from "./data";

export type TermKind = "academic" | "summer" | "break";

export interface PlannedTerm {
  label: string;
  kind: TermKind;
  credits: number;
  courses: string[];
  actions: string[];
}

export interface PathSpec {
  id: string;
  letter: string;
  name: string;
  program: string;
  headline: string;
  /** Completed credits that apply to this path's degree requirements. */
  appliedCredits: number;
  /** Extra required credits beyond the major (e.g. a minor). */
  extraProgramCredits: number;
  prerequisiteCourses: string[];
  tuitionPerCredit: number;
  /** 0-100, how much of the student's current academic direction is preserved. */
  continuity: number;
  /** 0-100, how many different futures stay open after this path. */
  flexibility: number;
  /** How well this path builds each skill, 0-1. Used with career skill weights. */
  skillCoverage: Record<SkillKey, number>;
  advantages: string[];
  tradeoffs: string[];
  riskFactors: string[];
  opportunities: string[];
  unknowns: string[];
  terms: PlannedTerm[];
  nextMoves: string[];
}

const cov = (
  health_domain: number,
  programming: number,
  data_analysis: number,
  statistics: number,
  informatics: number,
  research: number,
): Record<SkillKey, number> => ({
  health_domain,
  programming,
  data_analysis,
  statistics,
  informatics,
  research,
});

export const PATHS: PathSpec[] = [
  {
    id: "stay_biology",
    letter: "A",
    name: "Stay the course",
    program: "Biology, B.S.",
    headline: "Finish Biology exactly as planned.",
    appliedCredits: 54,
    extraProgramCredits: 0,
    prerequisiteCourses: [],
    tuitionPerCredit: TUITION_PER_CREDIT,
    continuity: 100,
    flexibility: 62,
    skillCoverage: cov(0.95, 0.35, 0.55, 0.7, 0.3, 0.8),
    advantages: [
      "Graduates on the original May 2028 target",
      "No credits lost, no new prerequisites",
      "Lowest cost of any path",
    ],
    tradeoffs: [
      "Fewest technical credentials for healthcare technology roles",
      "Programming and data skills would need to come from outside the degree",
    ],
    riskFactors: ["No added prerequisites", "No schedule change", "Career fit depends on skills built outside class"],
    opportunities: ["Research lab positions", "Clinical or lab internships", "Graduate school in life sciences"],
    unknowns: ["Seat availability in BIOL 410", "Whether target employers expect a technical credential"],
    terms: [
      {
        label: "Fall 2026",
        kind: "academic",
        credits: 17,
        courses: ["Elective", "BIOL 302", "Elective", "Elective"],
        actions: ["Meet your academic advisor to confirm the Biology audit"],
      },
      {
        label: "Spring 2027",
        kind: "academic",
        credits: 17,
        courses: ["BIOL 410", "Elective", "Elective", "Elective"],
        actions: ["Apply to summer research programs"],
      },
      {
        label: "Fall 2027",
        kind: "academic",
        credits: 16,
        courses: ["BIOL 495", "Elective", "Elective", "Elective"],
        actions: ["Build one data-analysis project outside coursework"],
      },
      {
        label: "Spring 2028",
        kind: "academic",
        credits: 16,
        courses: ["Capstone completion", "Elective", "Elective", "Elective"],
        actions: ["Graduation application", "Apply to entry-level analyst roles"],
      },
    ],
    nextMoves: [
      "Schedule an academic advisor meeting to confirm your Biology audit.",
      "Check that BIOL 410 and BIOL 495 are offered in the terms you need.",
      "Apply to three healthcare-adjacent internships for summer 2027.",
    ],
  },
  {
    id: "switch_cs",
    letter: "B",
    name: "Switch to Computer Science",
    program: "Computer Science, B.S.",
    headline: "Move fully into a technical degree.",
    appliedCredits: 36,
    extraProgramCredits: 0,
    prerequisiteCourses: ["COMP 210", "MATH 233", "COMP 301"],
    tuitionPerCredit: TUITION_PER_CREDIT,
    continuity: 40,
    flexibility: 84,
    skillCoverage: cov(0.55, 0.95, 0.85, 0.8, 0.6, 0.5),
    advantages: [
      "Strongest technical preparation of any path",
      "Widest set of software and data roles after graduation",
      "Machine learning and algorithms coursework included",
    ],
    tradeoffs: [
      "18 completed Biology and Chemistry credits become electives",
      "Adds one semester and the largest additional cost",
      "Three prerequisite courses must be sequenced before upper-level work",
    ],
    riskFactors: [
      "Adds one semester (December 2028 graduation)",
      "18 credits no longer count toward the degree",
      "Three prerequisites must be taken in order",
    ],
    opportunities: ["Software engineering internships", "Data science internships", "Health-tech product engineering"],
    unknowns: ["Major-change approval", "COMP 210 seat availability as a non-major", "Financial aid impact of a fifth year term"],
    terms: [
      {
        label: "Fall 2026",
        kind: "academic",
        credits: 17,
        courses: ["COMP 210", "MATH 233", "Elective", "Elective"],
        actions: ["Submit the change-of-major request"],
      },
      {
        label: "Spring 2027",
        kind: "academic",
        credits: 17,
        courses: ["COMP 301", "COMP 311", "Elective", "Elective"],
        actions: ["Apply to software internships"],
      },
      {
        label: "Summer 2027",
        kind: "summer",
        credits: 0,
        courses: [],
        actions: ["Software or data internship"],
      },
      {
        label: "Fall 2027",
        kind: "academic",
        credits: 17,
        courses: ["COMP 410", "COMP 480", "Elective", "Elective"],
        actions: ["Start a health-data portfolio project"],
      },
      {
        label: "Spring 2028",
        kind: "academic",
        credits: 17,
        courses: ["COMP 495", "Elective", "Elective", "Elective"],
        actions: ["Interview for new-grad technical roles"],
      },
      {
        label: "Fall 2028",
        kind: "academic",
        credits: 16,
        courses: ["Capstone completion", "Elective", "Elective", "Elective"],
        actions: ["Graduation application (December 2028)"],
      },
    ],
    nextMoves: [
      "Meet the Computer Science advising office about the change of major.",
      "Confirm COMP 210 and MATH 233 seats for Fall 2026.",
      "Ask financial aid what an additional fall term would cost you.",
    ],
  },
  {
    id: "cs_minor",
    letter: "C",
    name: "Biology + Computer Science minor",
    program: "Biology, B.S. with CS minor",
    headline: "Keep the degree, add the technical credential.",
    appliedCredits: 54,
    extraProgramCredits: 6,
    prerequisiteCourses: ["COMP 210"],
    tuitionPerCredit: TUITION_PER_CREDIT,
    continuity: 88,
    flexibility: 88,
    skillCoverage: cov(0.95, 0.75, 0.8, 0.85, 0.7, 0.8),
    advantages: [
      "Keeps the May 2028 graduation date",
      "Preserves every completed Biology credit",
      "Adds programming and data coursework recognized on the transcript",
    ],
    tradeoffs: [
      "Heavier 18-credit terms",
      "Less depth than a full Computer Science degree",
    ],
    riskFactors: ["Six additional credits", "18-credit terms leave little slack", "One prerequisite (COMP 210)"],
    opportunities: ["Health-data internships", "Bioinformatics roles", "Analyst roles at health systems"],
    unknowns: ["Minor declaration deadline", "COMP 210 seat availability"],
    terms: [
      {
        label: "Fall 2026",
        kind: "academic",
        credits: 18,
        courses: ["Elective", "BIOL 302", "COMP 210", "Elective"],
        actions: ["Declare the Computer Science minor"],
      },
      {
        label: "Spring 2027",
        kind: "academic",
        credits: 18,
        courses: ["BIOL 410", "Elective", "COMP 301", "Elective"],
        actions: ["Apply to health-technology internships"],
      },
      {
        label: "Summer 2027",
        kind: "summer",
        credits: 0,
        courses: [],
        actions: ["Healthcare technology internship"],
      },
      {
        label: "Fall 2027",
        kind: "academic",
        credits: 18,
        courses: ["BIOL 495", "COMP 480", "Elective", "Elective"],
        actions: ["Build a clinical-data portfolio project"],
      },
      {
        label: "Spring 2028",
        kind: "academic",
        credits: 18,
        courses: ["Capstone completion", "Elective", "Elective", "Elective"],
        actions: ["Graduation application", "Interview for analyst roles"],
      },
    ],
    nextMoves: [
      "Schedule an academic advisor meeting to declare the CS minor.",
      "Confirm COMP 210 prerequisite clearance and Fall 2026 seat availability.",
      "Apply to three healthcare technology internships for summer 2027.",
    ],
  },
  {
    id: "bio_health_informatics",
    letter: "D",
    name: "Biology + Health Informatics",
    program: "Biology, B.S. with Health Informatics minor",
    headline: "Specialize directly into clinical systems.",
    appliedCredits: 54,
    extraProgramCredits: 12,
    prerequisiteCourses: ["HINF 210", "HINF 320"],
    tuitionPerCredit: TUITION_PER_CREDIT,
    continuity: 76,
    flexibility: 80,
    skillCoverage: cov(0.95, 0.6, 0.8, 0.8, 0.95, 0.8),
    advantages: [
      "Most directly aligned with health-system employers",
      "Still graduates May 2028",
      "Clinical data, analytics and policy coursework",
    ],
    tradeoffs: [
      "Twelve additional credits including a summer session",
      "Less general software depth than a CS path",
    ],
    riskFactors: ["Twelve additional credits", "Requires one summer session", "Two-course prerequisite chain"],
    opportunities: ["Health system informatics internships", "EHR vendor roles", "Quality-improvement analytics"],
    unknowns: ["Summer session cost and aid coverage", "HINF 410 offering cadence"],
    terms: [
      {
        label: "Fall 2026",
        kind: "academic",
        credits: 18,
        courses: ["Elective", "BIOL 302", "Elective", "Elective"],
        actions: ["Declare the Health Informatics minor"],
      },
      {
        label: "Spring 2027",
        kind: "academic",
        credits: 18,
        courses: ["BIOL 410", "Elective", "HINF 320", "Elective"],
        actions: ["Apply to health system internships"],
      },
      {
        label: "Summer 2027",
        kind: "summer",
        credits: 6,
        courses: ["HINF 450", "Elective"],
        actions: ["Summer session, part-time internship"],
      },
      {
        label: "Fall 2027",
        kind: "academic",
        credits: 18,
        courses: ["BIOL 495", "HINF 410", "Elective", "Elective"],
        actions: ["Clinical workflow case study for your portfolio"],
      },
      {
        label: "Spring 2028",
        kind: "academic",
        credits: 18,
        courses: ["Capstone completion", "COMP 110", "Elective", "Elective"],
        actions: ["Graduation application", "Interview for informatics analyst roles"],
      },
    ],
    nextMoves: [
      "Meet an advisor about the Health Informatics minor requirements.",
      "Confirm HINF 410 is offered in Fall 2027.",
      "Ask financial aid whether summer 2027 credits are covered.",
    ],
  },
  {
    id: "graduate_early",
    letter: "E",
    name: "Graduate early",
    program: "Biology, B.S. (accelerated)",
    headline: "Finish Biology one semester ahead.",
    appliedCredits: 54,
    extraProgramCredits: 0,
    prerequisiteCourses: [],
    tuitionPerCredit: TUITION_PER_CREDIT,
    continuity: 96,
    flexibility: 55,
    skillCoverage: cov(0.9, 0.3, 0.45, 0.65, 0.25, 0.6),
    advantages: [
      "December 2027 graduation, one semester early",
      "Same total tuition, one less semester of living costs",
      "Enter the job market ahead of your cohort",
    ],
    tradeoffs: [
      "19-credit terms plus a summer session",
      "Little room for internships or electives",
      "Least technical preparation of any path",
    ],
    riskFactors: ["19-credit terms", "Requires a summer session", "Course-availability dependent", "Low schedule slack"],
    opportunities: ["Earlier full-time start", "Earlier graduate school entry"],
    unknowns: ["Whether all required courses run in the needed terms", "Summer aid eligibility"],
    terms: [
      {
        label: "Fall 2026",
        kind: "academic",
        credits: 19,
        courses: ["Elective", "BIOL 302", "Elective", "Elective"],
        actions: ["Confirm the accelerated plan with an advisor"],
      },
      {
        label: "Spring 2027",
        kind: "academic",
        credits: 19,
        courses: ["BIOL 410", "Elective", "Elective", "Elective"],
        actions: ["Register for summer session early"],
      },
      {
        label: "Summer 2027",
        kind: "summer",
        credits: 9,
        courses: ["Elective", "Elective", "Elective"],
        actions: ["Summer coursework"],
      },
      {
        label: "Fall 2027",
        kind: "academic",
        credits: 19,
        courses: ["BIOL 495", "Elective", "Elective", "Elective"],
        actions: ["Graduation application (December 2027)", "Start full-time applications"],
      },
    ],
    nextMoves: [
      "Confirm the accelerated sequence is approved by your advisor.",
      "Verify every required course is offered in the term you need it.",
      "Start full-time applications a year earlier than planned.",
    ],
  },
  {
    id: "transfer",
    letter: "F",
    name: "Transfer schools",
    program: "Biology, B.S. at a new institution",
    headline: "Restart the degree elsewhere.",
    appliedCredits: 42,
    extraProgramCredits: 0,
    prerequisiteCourses: ["Institution-specific core"],
    tuitionPerCredit: TRANSFER_TUITION_PER_CREDIT,
    continuity: 45,
    flexibility: 78,
    skillCoverage: cov(0.85, 0.8, 0.8, 0.75, 0.6, 0.5),
    advantages: ["Access to a different program mix", "A fresh set of local employers and labs"],
    tradeoffs: [
      "12 credits are assumed not to transfer",
      "Higher per-credit tuition",
      "One additional semester",
    ],
    riskFactors: ["Credit transfer is not guaranteed", "Adds one semester", "Higher tuition rate", "New advising relationships"],
    opportunities: ["Different research programs", "New internship market"],
    unknowns: ["Actual transfer credit evaluation", "Admission decision", "Aid package at the new school"],
    terms: [
      {
        label: "Fall 2026",
        kind: "academic",
        credits: 16,
        courses: ["Transfer core", "Elective", "Elective", "Elective"],
        actions: ["Submit transfer applications"],
      },
      {
        label: "Spring 2027",
        kind: "academic",
        credits: 16,
        courses: ["BIOL 302", "Elective", "Elective", "Elective"],
        actions: ["Request an official credit evaluation"],
      },
      {
        label: "Fall 2027",
        kind: "academic",
        credits: 16,
        courses: ["BIOL 410", "Elective", "Elective", "Elective"],
        actions: ["Rebuild advising and research contacts"],
      },
      {
        label: "Spring 2028",
        kind: "academic",
        credits: 16,
        courses: ["BIOL 495", "Elective", "Elective", "Elective"],
        actions: ["Apply to internships at the new institution"],
      },
      {
        label: "Fall 2028",
        kind: "academic",
        credits: 14,
        courses: ["Capstone completion", "Elective", "Elective"],
        actions: ["Graduation application (December 2028)"],
      },
    ],
    nextMoves: [
      "Request a preliminary credit evaluation from each target school.",
      "Compare aid packages before committing.",
      "Confirm which Biology courses transfer as major credit.",
    ],
  },
  {
    id: "semester_off",
    letter: "G",
    name: "Take a semester off",
    program: "Biology, B.S. with a break term",
    headline: "Pause for a term, then finish Biology.",
    appliedCredits: 54,
    extraProgramCredits: 0,
    prerequisiteCourses: [],
    tuitionPerCredit: TUITION_PER_CREDIT,
    continuity: 90,
    flexibility: 60,
    skillCoverage: cov(0.95, 0.35, 0.55, 0.7, 0.3, 0.8),
    advantages: [
      "Same total tuition — no extra credits",
      "A full term for work, health, or an internship",
      "All Biology progress is preserved",
    ],
    tradeoffs: [
      "Graduation moves to December 2028",
      "Course sequences may need to be re-timed",
      "Aid and enrollment status need review",
    ],
    riskFactors: ["One semester delay", "Re-entry and aid paperwork", "Sequence timing risk"],
    opportunities: ["Full-time internship during the break", "Time to test a career direction"],
    unknowns: ["Leave-of-absence policy details", "Scholarship continuation rules"],
    terms: [
      {
        label: "Fall 2026",
        kind: "academic",
        credits: 17,
        courses: ["Elective", "BIOL 302", "Elective", "Elective"],
        actions: ["File the leave-of-absence request"],
      },
      {
        label: "Spring 2027",
        kind: "break",
        credits: 0,
        courses: [],
        actions: ["Break term — work, internship or reset"],
      },
      {
        label: "Fall 2027",
        kind: "academic",
        credits: 17,
        courses: ["BIOL 410", "Elective", "Elective", "Elective"],
        actions: ["Re-enrollment and advising check-in"],
      },
      {
        label: "Spring 2028",
        kind: "academic",
        credits: 16,
        courses: ["BIOL 495", "Elective", "Elective", "Elective"],
        actions: ["Apply to summer internships"],
      },
      {
        label: "Fall 2028",
        kind: "academic",
        credits: 16,
        courses: ["Capstone completion", "Elective", "Elective", "Elective"],
        actions: ["Graduation application (December 2028)"],
      },
    ],
    nextMoves: [
      "Read your institution's leave-of-absence policy with an advisor.",
      "Confirm scholarship and aid continuation rules before filing.",
      "Line up what the break term is actually for.",
    ],
  },
];

export const pathSpecById = (id: string) => PATHS.find((p) => p.id === id);

export const BASELINE_PATH_ID = "stay_biology";
