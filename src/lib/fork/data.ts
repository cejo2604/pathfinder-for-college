/**
 * Fork demo dataset.
 *
 * Deliberately small and internally consistent: every credit total, prerequisite
 * chain, tuition figure and graduation date below is checked against the others.
 * Nothing in the UI invents numbers — the engine in ./engine.ts derives all of
 * them from this file.
 */

export type Priority =
  | "graduate_on_time"
  | "minimize_cost"
  | "career_opportunities"
  | "stay_close_to_major"
  | "minimize_coursework"
  | "flexibility";

export const PRIORITY_LABELS: Record<Priority, string> = {
  graduate_on_time: "Graduate on time",
  minimize_cost: "Minimize cost",
  career_opportunities: "Maximize career opportunities",
  stay_close_to_major: "Stay close to my current major",
  minimize_coursework: "Minimize additional coursework",
  flexibility: "Maximize flexibility",
};

export const PRIORITY_ORDER: Priority[] = [
  "graduate_on_time",
  "minimize_cost",
  "career_opportunities",
  "stay_close_to_major",
  "minimize_coursework",
  "flexibility",
];

export type SkillKey =
  | "health_domain"
  | "programming"
  | "data_analysis"
  | "statistics"
  | "informatics"
  | "research";

export const SKILL_LABELS: Record<SkillKey, string> = {
  health_domain: "Health & life-science knowledge",
  programming: "Programming",
  data_analysis: "Data analysis",
  statistics: "Statistics",
  informatics: "Health informatics & systems",
  research: "Research methods",
};

export interface Course {
  code: string;
  title: string;
  credits: number;
  prerequisites: string[];
}

/** Verified institutional catalog subset (demo dataset). */
export let COURSES: Course[] = [
  { code: "BIOL 101", title: "Principles of Biology I", credits: 4, prerequisites: [] },
  { code: "BIOL 102", title: "Principles of Biology II", credits: 4, prerequisites: ["BIOL 101"] },
  { code: "BIOL 201", title: "Genetics", credits: 4, prerequisites: ["BIOL 102"] },
  { code: "BIOL 301", title: "Cell & Molecular Biology", credits: 4, prerequisites: ["BIOL 201"] },
  { code: "BIOL 302", title: "Physiology", credits: 4, prerequisites: ["BIOL 301"] },
  { code: "BIOL 410", title: "Advanced Molecular Biology", credits: 4, prerequisites: ["BIOL 301"] },
  { code: "BIOL 495", title: "Biology Capstone", credits: 3, prerequisites: ["BIOL 302"] },
  { code: "CHEM 101", title: "General Chemistry I", credits: 4, prerequisites: [] },
  { code: "CHEM 102", title: "General Chemistry II", credits: 4, prerequisites: ["CHEM 101"] },
  { code: "CHEM 261", title: "Organic Chemistry I", credits: 4, prerequisites: ["CHEM 102"] },
  { code: "STAT 155", title: "Introduction to Statistics", credits: 3, prerequisites: [] },
  { code: "STAT 320", title: "Statistical Modeling", credits: 3, prerequisites: ["STAT 155"] },
  { code: "PSYC 101", title: "General Psychology", credits: 3, prerequisites: [] },
  { code: "MATH 152", title: "Calculus I", credits: 4, prerequisites: [] },
  { code: "MATH 233", title: "Discrete Structures", credits: 3, prerequisites: ["MATH 152"] },
  { code: "COMP 110", title: "Introduction to Programming", credits: 3, prerequisites: [] },
  { code: "COMP 210", title: "Data Structures", credits: 4, prerequisites: ["COMP 110"] },
  { code: "COMP 301", title: "Software Design", credits: 3, prerequisites: ["COMP 210"] },
  { code: "COMP 311", title: "Computer Organization", credits: 3, prerequisites: ["COMP 210"] },
  { code: "COMP 410", title: "Algorithms", credits: 3, prerequisites: ["COMP 210", "MATH 233"] },
  { code: "COMP 480", title: "Machine Learning", credits: 3, prerequisites: ["COMP 210", "STAT 155"] },
  { code: "COMP 495", title: "Computer Science Capstone", credits: 3, prerequisites: ["COMP 301"] },
  { code: "HINF 210", title: "Foundations of Health Informatics", credits: 3, prerequisites: [] },
  { code: "HINF 320", title: "Clinical Data Systems", credits: 3, prerequisites: ["HINF 210"] },
  { code: "HINF 410", title: "Health Data Analytics", credits: 3, prerequisites: ["HINF 320", "STAT 155"] },
  { code: "HINF 450", title: "Health Technology Ethics & Policy", credits: 3, prerequisites: ["HINF 210"] },
  // Business (B.B.A.) core.
  { code: "BUSI 101", title: "Financial Accounting", credits: 3, prerequisites: [] },
  { code: "BUSI 202", title: "Managerial Accounting", credits: 3, prerequisites: ["BUSI 101"] },
  { code: "ECON 101", title: "Principles of Microeconomics", credits: 3, prerequisites: [] },
  { code: "ECON 102", title: "Principles of Macroeconomics", credits: 3, prerequisites: ["ECON 101"] },
  { code: "BUSI 210", title: "Business Statistics", credits: 3, prerequisites: [] },
  { code: "BUSI 310", title: "Corporate Finance", credits: 3, prerequisites: ["BUSI 101", "ECON 101"] },
  { code: "BUSI 330", title: "Principles of Marketing", credits: 3, prerequisites: [] },
  { code: "BUSI 350", title: "Business Law", credits: 3, prerequisites: [] },
  { code: "BUSI 370", title: "Management & Organizations", credits: 3, prerequisites: [] },
  { code: "BUSI 410", title: "Business Analytics", credits: 3, prerequisites: ["BUSI 210"] },
  { code: "BUSI 495", title: "Business Strategy Capstone", credits: 3, prerequisites: ["BUSI 370"] },
  // Data Science.
  { code: "DATA 110", title: "Foundations of Data Science", credits: 3, prerequisites: [] },
  { code: "DATA 220", title: "Data Wrangling & Visualization", credits: 3, prerequisites: ["DATA 110"] },
  { code: "DATA 310", title: "Applied Machine Learning", credits: 3, prerequisites: ["DATA 220", "STAT 155"] },
  { code: "DATA 495", title: "Data Science Capstone", credits: 3, prerequisites: ["DATA 310"] },
  // Nursing (B.S.N.).
  { code: "NURS 101", title: "Foundations of Nursing Practice", credits: 4, prerequisites: [] },
  { code: "NURS 210", title: "Health Assessment", credits: 3, prerequisites: ["NURS 101"] },
  { code: "NURS 220", title: "Pharmacology", credits: 3, prerequisites: ["NURS 101", "CHEM 101"] },
  { code: "NURS 330", title: "Adult Health Nursing", credits: 4, prerequisites: ["NURS 210"] },
  { code: "NURS 440", title: "Community Health Nursing", credits: 3, prerequisites: ["NURS 330"] },
  { code: "NURS 495", title: "Nursing Clinical Capstone", credits: 4, prerequisites: ["NURS 440"] },
  // Public Health.
  { code: "PUBH 150", title: "Introduction to Public Health", credits: 3, prerequisites: [] },
  { code: "PUBH 250", title: "Epidemiology", credits: 3, prerequisites: ["PUBH 150", "STAT 155"] },
  { code: "PUBH 350", title: "Health Policy & Systems", credits: 3, prerequisites: ["PUBH 150"] },
  { code: "PUBH 420", title: "Global Health", credits: 3, prerequisites: ["PUBH 250"] },
  { code: "PUBH 495", title: "Public Health Capstone", credits: 3, prerequisites: ["PUBH 350"] },
  // Psychology.
  { code: "PSYC 210", title: "Research Methods in Psychology", credits: 4, prerequisites: ["PSYC 101"] },
  { code: "PSYC 250", title: "Developmental Psychology", credits: 3, prerequisites: ["PSYC 101"] },
  { code: "PSYC 330", title: "Cognitive Psychology", credits: 3, prerequisites: ["PSYC 210"] },
  { code: "PSYC 360", title: "Abnormal Psychology", credits: 3, prerequisites: ["PSYC 101"] },
  { code: "PSYC 495", title: "Psychology Capstone", credits: 3, prerequisites: ["PSYC 330"] },
  // Information Science.
  { code: "INLS 201", title: "Foundations of Information Science", credits: 3, prerequisites: [] },
  { code: "INLS 310", title: "Database Design", credits: 3, prerequisites: ["INLS 201"] },
  { code: "INLS 380", title: "Human-Computer Interaction", credits: 3, prerequisites: ["INLS 201"] },
  { code: "INLS 425", title: "Information Security & Privacy", credits: 3, prerequisites: ["INLS 310"] },
  { code: "INLS 495", title: "Information Science Capstone", credits: 3, prerequisites: ["INLS 380"] },
  // Economics.
  { code: "ECON 310", title: "Intermediate Microeconomics", credits: 3, prerequisites: ["ECON 101"] },
  { code: "ECON 320", title: "Intermediate Macroeconomics", credits: 3, prerequisites: ["ECON 102"] },
  { code: "ECON 400", title: "Econometrics", credits: 3, prerequisites: ["ECON 310", "STAT 155"] },
  { code: "ECON 495", title: "Economics Senior Seminar", credits: 3, prerequisites: ["ECON 400"] },
];


export const courseByCode = (code: string) => COURSES.find((c) => c.code === code);

/**
 * Catalog course skill contributions, 0-1 per skill.
 *
 * These are the SOLE source of numeric career-fit coverage — path-level
 * hand-authored coverage is not permitted. Each value states how much of a
 * skill one course is intended to build; coverage is the capped sum of the
 * contributions of the courses in scope (see engine.ts). Contributions are
 * catalog facts and are never tuned to reproduce a historical score.
 */
export const COURSE_SKILL_CONTRIBUTIONS: Record<string, Partial<Record<SkillKey, number>>> = {
  "BIOL 101": { health_domain: 0.2, research: 0.05 },
  "BIOL 102": { health_domain: 0.2, research: 0.05 },
  "BIOL 201": { health_domain: 0.2, research: 0.1 },
  "BIOL 301": { health_domain: 0.2, research: 0.15 },
  "BIOL 302": { health_domain: 0.2, research: 0.1 },
  "BIOL 410": { health_domain: 0.2, research: 0.25 },
  "BIOL 495": { health_domain: 0.15, research: 0.3 },
  "CHEM 101": { health_domain: 0.1, research: 0.05 },
  "CHEM 102": { health_domain: 0.1, research: 0.05 },
  "CHEM 261": { health_domain: 0.15, research: 0.1 },
  "STAT 155": { statistics: 0.4, data_analysis: 0.2 },
  "STAT 320": { statistics: 0.45, data_analysis: 0.25 },
  "PSYC 101": { health_domain: 0.05, research: 0.05 },
  "MATH 152": { statistics: 0.1 },
  "MATH 233": { programming: 0.15, statistics: 0.1 },
  "COMP 110": { programming: 0.3, data_analysis: 0.1 },
  "COMP 210": { programming: 0.35, data_analysis: 0.15 },
  "COMP 301": { programming: 0.25 },
  "COMP 311": { programming: 0.15 },
  "COMP 410": { programming: 0.25, data_analysis: 0.1 },
  "COMP 480": { programming: 0.2, data_analysis: 0.35, statistics: 0.25 },
  "COMP 495": { programming: 0.25, data_analysis: 0.1 },
  "HINF 210": { informatics: 0.35, health_domain: 0.1 },
  "HINF 320": { informatics: 0.35, data_analysis: 0.15 },
  "HINF 410": { informatics: 0.3, data_analysis: 0.35, statistics: 0.2, health_domain: 0.1 },
  "HINF 450": { informatics: 0.25, health_domain: 0.1 },
  "BUSI 101": { data_analysis: 0.1 },
  "BUSI 202": { data_analysis: 0.15 },
  "ECON 101": { data_analysis: 0.1, statistics: 0.05 },
  "ECON 102": { data_analysis: 0.1, statistics: 0.05 },
  "BUSI 210": { statistics: 0.3, data_analysis: 0.2 },
  "BUSI 310": { data_analysis: 0.2, statistics: 0.1 },
  "BUSI 330": { data_analysis: 0.1 },
  "BUSI 350": { research: 0.05 },
  "BUSI 370": { informatics: 0.05 },
  "BUSI 410": { data_analysis: 0.35, statistics: 0.2, informatics: 0.1 },
  "BUSI 495": { data_analysis: 0.15, research: 0.1 },
  "DATA 110": { data_analysis: 0.3, programming: 0.15, statistics: 0.1 },
  "DATA 220": { data_analysis: 0.35, programming: 0.2 },
  "DATA 310": { data_analysis: 0.35, programming: 0.25, statistics: 0.25 },
  "DATA 495": { data_analysis: 0.25, programming: 0.15, research: 0.15 },
  "NURS 101": { health_domain: 0.3 },
  "NURS 210": { health_domain: 0.3, research: 0.05 },
  "NURS 220": { health_domain: 0.25, research: 0.05 },
  "NURS 330": { health_domain: 0.35, research: 0.05 },
  "NURS 440": { health_domain: 0.3, informatics: 0.1 },
  "NURS 495": { health_domain: 0.35, research: 0.1 },
  "PUBH 150": { health_domain: 0.25 },
  "PUBH 250": { health_domain: 0.2, statistics: 0.3, research: 0.15 },
  "PUBH 350": { health_domain: 0.2, informatics: 0.1 },
  "PUBH 420": { health_domain: 0.2, research: 0.1 },
  "PUBH 495": { health_domain: 0.2, research: 0.2, data_analysis: 0.1 },
  "PSYC 210": { research: 0.35, statistics: 0.2 },
  "PSYC 250": { health_domain: 0.1, research: 0.1 },
  "PSYC 330": { research: 0.2, health_domain: 0.1 },
  "PSYC 360": { health_domain: 0.15, research: 0.1 },
  "PSYC 495": { research: 0.25, health_domain: 0.1 },
  "INLS 201": { informatics: 0.3, data_analysis: 0.1 },
  "INLS 310": { informatics: 0.3, data_analysis: 0.2, programming: 0.1 },
  "INLS 380": { informatics: 0.25, programming: 0.1 },
  "INLS 425": { informatics: 0.3, programming: 0.1 },
  "INLS 495": { informatics: 0.25, data_analysis: 0.15 },
  "ECON 310": { data_analysis: 0.15, statistics: 0.1 },
  "ECON 320": { data_analysis: 0.15, statistics: 0.1 },
  "ECON 400": { statistics: 0.35, data_analysis: 0.3, research: 0.15 },
  "ECON 495": { research: 0.2, data_analysis: 0.15 },
};

/** Contributions for one catalog course code. Unknown codes contribute nothing. */
export const courseSkillContributions = (code: string): Partial<Record<SkillKey, number>> =>
  COURSE_SKILL_CONTRIBUTIONS[code] ?? {};


export interface DegreeProgram {
  id: string;
  name: string;
  kind: "major" | "minor";
  requiredCredits: number;
}

export let PROGRAMS: DegreeProgram[] = [
  { id: "bio_bs", name: "Biology, B.S.", kind: "major", requiredCredits: 120 },
  { id: "cs_bs", name: "Computer Science, B.S.", kind: "major", requiredCredits: 120 },
  { id: "ba_bba", name: "Business Analytics, B.B.A.", kind: "major", requiredCredits: 120 },
  { id: "ds_bs", name: "Data Science, B.S.", kind: "major", requiredCredits: 120 },
  { id: "nurs_bsn", name: "Nursing, B.S.N.", kind: "major", requiredCredits: 120 },
  { id: "pubh_bsph", name: "Public Health, B.S.P.H.", kind: "major", requiredCredits: 120 },
  { id: "psyc_ba", name: "Psychology, B.A.", kind: "major", requiredCredits: 120 },
  { id: "inls_bs", name: "Information Science, B.S.", kind: "major", requiredCredits: 120 },
  { id: "econ_ba", name: "Economics, B.A.", kind: "major", requiredCredits: 120 },
  { id: "cs_minor", name: "Computer Science minor", kind: "minor", requiredCredits: 18 },
  { id: "hinf_minor", name: "Health Informatics minor", kind: "minor", requiredCredits: 18 },
  { id: "ds_minor", name: "Data Science minor", kind: "minor", requiredCredits: 18 },
  { id: "busi_minor", name: "Business minor", kind: "minor", requiredCredits: 18 },
  { id: "stat_minor", name: "Statistics minor", kind: "minor", requiredCredits: 18 },
  { id: "pubh_minor", name: "Public Health minor", kind: "minor", requiredCredits: 18 },
  { id: "psyc_minor", name: "Psychology minor", kind: "minor", requiredCredits: 18 },
  { id: "econ_minor", name: "Economics minor", kind: "minor", requiredCredits: 18 },
];


export const programById = (id: string) => PROGRAMS.find((p) => p.id === id);

/**
 * Catalog course sequence for each program, in prerequisite order.
 * Used to generate a path for any program the student picks (see program-paths.ts).
 */
export const PROGRAM_COURSES: Record<string, string[]> = {
  bio_bs: ["BIOL 101", "BIOL 102", "BIOL 201", "BIOL 301", "BIOL 302", "BIOL 410", "BIOL 495", "CHEM 101", "CHEM 102", "CHEM 261"],
  cs_bs: ["COMP 110", "COMP 210", "COMP 301", "COMP 311", "MATH 152", "MATH 233", "COMP 410", "COMP 480", "COMP 495"],
  ba_bba: ["BUSI 101", "BUSI 202", "ECON 101", "ECON 102", "BUSI 210", "BUSI 310", "BUSI 330", "BUSI 370", "BUSI 410", "BUSI 495"],
  ds_bs: ["DATA 110", "DATA 220", "STAT 155", "STAT 320", "COMP 110", "COMP 210", "DATA 310", "DATA 495"],
  nurs_bsn: ["NURS 101", "NURS 210", "NURS 220", "NURS 330", "NURS 440", "NURS 495", "CHEM 101", "BIOL 101", "PSYC 101"],
  pubh_bsph: ["PUBH 150", "STAT 155", "PUBH 250", "PUBH 350", "PUBH 420", "PUBH 495", "BIOL 101", "PSYC 101"],
  psyc_ba: ["PSYC 101", "PSYC 210", "PSYC 250", "PSYC 330", "PSYC 360", "PSYC 495", "STAT 155"],
  inls_bs: ["INLS 201", "COMP 110", "INLS 310", "INLS 380", "INLS 425", "INLS 495", "STAT 155"],
  econ_ba: ["ECON 101", "ECON 102", "MATH 152", "STAT 155", "ECON 310", "ECON 320", "ECON 400", "ECON 495"],
  cs_minor: ["COMP 110", "COMP 210", "COMP 301", "COMP 410", "COMP 480"],
  hinf_minor: ["HINF 210", "HINF 320", "HINF 410", "HINF 450"],
  ds_minor: ["DATA 110", "DATA 220", "STAT 155", "DATA 310"],
  busi_minor: ["BUSI 101", "ECON 101", "BUSI 210", "BUSI 330"],
  stat_minor: ["STAT 155", "STAT 320", "MATH 152", "DATA 220"],
  pubh_minor: ["PUBH 150", "PUBH 250", "PUBH 350", "PUBH 420"],
  psyc_minor: ["PSYC 101", "PSYC 210", "PSYC 250", "PSYC 360"],
  econ_minor: ["ECON 101", "ECON 102", "ECON 310", "ECON 400"],
};

export const programCourses = (id: string): string[] => PROGRAM_COURSES[id] ?? [];


export interface StudentCourse {
  code: string;
  /** `waitlisted` rows are seats the student does not hold yet. */
  status: "completed" | "in_progress" | "waitlisted";
  term: string;
  grade?: string;
  waitlistPosition?: number;
  /**
   * True once the student confirmed this record (imported or hand-entered).
   * Unconfirmed rows never contribute credits, cost, timeline or career fit —
   * they only raise uncertainty (see engine.ts).
   */
  verified?: boolean;
  /** Where the row came from. Imported rows stay unconfirmed until reviewed. */
  source?: "manual" | "import";
}


export interface StudentProfile {
  name: string;
  school: string;
  /**
   * Canonical institution id. Simulation fails closed when this is missing or
   * not in SUPPORTED_INSTITUTION_IDS — Fork never simulates against a catalog
   * it cannot verify.
   */
  institutionId?: string;
  degree: string;
  major: string;
  minor: string | null;
  year: string;
  graduationTarget: string;
  creditsCompleted: number;
  gpa: number;
  interests: string[];
  careerInterests: string[];
  skills: string[];
  priorities: Priority[];
  goal: string;
  goalCategory: string;
  courses: StudentCourse[];
}

/**
 * Fork planning assumptions — estimated per-credit rates, not billed prices.
 * These are the only tuition rates in the product; no other file may hardcode
 * a rate. Cost = credits x rate, where the rate is the out-of-institution rate
 * only when a path changes institution.
 */
export const PLANNING_ASSUMPTIONS = {
  tuitionPerCredit: 485,
  outOfInstitutionTuitionPerCredit: 540,
  label: "Fork planning assumption",
} as const;

export const TUITION_PER_CREDIT = PLANNING_ASSUMPTIONS.tuitionPerCredit;
export const TRANSFER_TUITION_PER_CREDIT = PLANNING_ASSUMPTIONS.outOfInstitutionTuitionPerCredit;

/** Institutions whose catalog Fork can verify. Anything else fails closed. */
export const SUPPORTED_INSTITUTION_IDS = ["fork_demo_institution"] as const;
export const DEFAULT_INSTITUTION_ID = SUPPORTED_INSTITUTION_IDS[0];

export const EXAMPLE_PROFILE: StudentProfile = {
  name: "Maya Rodriguez",
  school: "University of North Carolina",
  institutionId: DEFAULT_INSTITUTION_ID,
  degree: "Bachelor of Science",
  major: "Biology",

  minor: null,
  year: "Sophomore",
  graduationTarget: "May 2028",
  creditsCompleted: 54,
  gpa: 3.6,
  interests: ["Healthcare", "Technology", "Problem solving", "Research"],
  careerInterests: ["Healthcare technology", "Data science", "Biotechnology"],
  skills: ["Lab technique", "Scientific writing", "Spreadsheet analysis"],
  priorities: [
    "graduate_on_time",
    "career_opportunities",
    "minimize_cost",
    "flexibility",
    "stay_close_to_major",
    "minimize_coursework",
  ],
  goal: "I want to work in healthcare technology.",
  goalCategory: "Healthcare technology",
  courses: [
    // 54 completed credits, verified from the institutional record.
    { code: "BIOL 101", status: "completed", term: "Fall 2024", grade: "A-" },
    { code: "BIOL 102", status: "completed", term: "Spring 2025", grade: "B+" },
    { code: "BIOL 201", status: "completed", term: "Fall 2025", grade: "A" },
    { code: "CHEM 101", status: "completed", term: "Fall 2024", grade: "B+" },
    { code: "CHEM 102", status: "completed", term: "Spring 2025", grade: "B" },
    { code: "MATH 152", status: "completed", term: "Fall 2024", grade: "B+" },
    { code: "STAT 155", status: "completed", term: "Spring 2025", grade: "A-" },
    { code: "PSYC 101", status: "completed", term: "Fall 2025", grade: "A" },
    { code: "COMP 110", status: "completed", term: "Spring 2026", grade: "A" },
    // Remaining 21 completed credits are general-education requirements.
    { code: "GEN ED", status: "completed", term: "2024 – 2026", grade: "—" },
    // Current term.
    { code: "BIOL 301", status: "in_progress", term: "Spring 2026" },
    { code: "CHEM 261", status: "in_progress", term: "Spring 2026" },
    { code: "STAT 320", status: "in_progress", term: "Spring 2026" },
    { code: "HINF 210", status: "in_progress", term: "Spring 2026" },
  ],
};



/**
 * The one empty-profile schema. Authenticated students with no saved profile
 * always start from this — never from demo or sample data.
 */
export function createEmptyProfile(): StudentProfile {
  return {
    name: "",
    school: "",
    institutionId: DEFAULT_INSTITUTION_ID,
    degree: "",
    major: "",
    minor: null,
    year: "",
    graduationTarget: "",
    creditsCompleted: 0,
    gpa: 0,
    interests: [],
    careerInterests: [],
    skills: [],
    priorities: [...PRIORITY_ORDER],
    goal: "",
    goalCategory: "",
    courses: [],
  };
}

export const CURRENT_TERM = "Spring 2026";

/**
 * The next academic term after `term`. Fall → Spring of the next year,
 * Spring/Summer → Fall of the same year. Unrecognized input falls back to Fall.
 */
export function nextAcademicTerm(term: string): string {
  const [season, yearText] = term.split(" ");
  const year = Number(yearText);
  if (!Number.isFinite(year)) return "Fall";
  if (season === "Fall") return `Spring ${year + 1}`;
  return `Fall ${year}`;
}

/** Planning always starts at the first academic term after the student's current term. */
export const FIRST_PLANNED_TERM = nextAcademicTerm(CURRENT_TERM);


export interface CareerSkillWeight {
  skill: SkillKey;
  weight: number;
}

export interface Career {
  id: string;
  title: string;
  industry: string;
  description: string;
  skillWeights: CareerSkillWeight[];
  relevantMajors: string[];
  relevantMinors: string[];
  coursework: string[];
  internshipIdeas: string[];
  portfolioIdeas: string[];
  entryRoles: string[];
  adjacentCareers: string[];
}

export let CAREERS: Career[] = [
  {
    id: "healthcare_data_scientist",
    title: "Healthcare data scientist",
    industry: "Healthcare technology",
    description:
      "Works with clinical, claims and device data to build models and analyses that support care decisions and health products.",
    skillWeights: [
      { skill: "programming", weight: 0.25 },
      { skill: "data_analysis", weight: 0.25 },
      { skill: "statistics", weight: 0.2 },
      { skill: "health_domain", weight: 0.15 },
      { skill: "informatics", weight: 0.1 },
      { skill: "research", weight: 0.05 },
    ],
    relevantMajors: ["Computer Science", "Biology", "Statistics", "Health Informatics"],
    relevantMinors: ["Computer Science", "Health Informatics", "Statistics"],
    coursework: ["COMP 210", "COMP 480", "STAT 320", "HINF 410"],
    internshipIdeas: [
      "Analytics team at a hospital system",
      "Clinical data internship at a health-tech startup",
      "Public health data internship",
    ],
    portfolioIdeas: [
      "Open clinical dataset analysis with a written interpretation",
      "Readmission-risk model notebook with documented assumptions",
      "Dashboard summarizing a public health indicator",
    ],
    entryRoles: ["Data analyst", "Clinical data analyst", "Junior data scientist"],
    adjacentCareers: ["Health informatics analyst", "Biostatistician", "Clinical software engineer"],
  },
  {
    id: "health_informatics_analyst",
    title: "Health informatics analyst",
    industry: "Healthcare technology",
    description:
      "Bridges clinical teams and software systems: data standards, electronic records, workflow and reporting.",
    skillWeights: [
      { skill: "informatics", weight: 0.3 },
      { skill: "health_domain", weight: 0.25 },
      { skill: "data_analysis", weight: 0.2 },
      { skill: "programming", weight: 0.15 },
      { skill: "statistics", weight: 0.05 },
      { skill: "research", weight: 0.05 },
    ],
    relevantMajors: ["Biology", "Health Informatics", "Computer Science"],
    relevantMinors: ["Health Informatics", "Computer Science"],
    coursework: ["HINF 210", "HINF 320", "HINF 410", "COMP 110"],
    internshipIdeas: [
      "Health system informatics office",
      "EHR vendor implementation team",
      "Quality-improvement analytics group",
    ],
    portfolioIdeas: [
      "Workflow map of a clinical process with proposed data fixes",
      "Interoperability case study using an open standard",
    ],
    entryRoles: ["Informatics analyst", "Clinical systems analyst", "Reporting analyst"],
    adjacentCareers: ["Healthcare data scientist", "Clinical product analyst", "Health policy analyst"],
  },
  {
    id: "biotech_research",
    title: "Biotechnology research associate",
    industry: "Biotechnology",
    description: "Runs experiments and analysis in a lab or R&D setting, increasingly with computational tooling.",
    skillWeights: [
      { skill: "health_domain", weight: 0.35 },
      { skill: "research", weight: 0.25 },
      { skill: "data_analysis", weight: 0.15 },
      { skill: "statistics", weight: 0.15 },
      { skill: "programming", weight: 0.05 },
      { skill: "informatics", weight: 0.05 },
    ],
    relevantMajors: ["Biology", "Biochemistry"],
    relevantMinors: ["Computer Science", "Statistics"],
    coursework: ["BIOL 301", "BIOL 410", "CHEM 261", "STAT 320"],
    internshipIdeas: ["Academic research lab", "Biotech company R&D internship"],
    portfolioIdeas: ["Research poster", "Reproducible analysis of experimental data"],
    entryRoles: ["Research associate", "Lab technician", "QC analyst"],
    adjacentCareers: ["Bioinformatics analyst", "Clinical research coordinator"],
  },
];

export const careerById = (id: string) => CAREERS.find((c) => c.id === id);
export const DEFAULT_CAREER_ID = "healthcare_data_scientist";

/** Catalog loaded from the database augments bundled defaults in place. */
export function applyCatalog(catalog: {
  courses?: Course[];
  programs?: DegreeProgram[];
  careers?: Career[];
}) {
  if (catalog.courses?.length) {
    const remoteByCode = new Map(catalog.courses.map((course) => [course.code, course]));
    COURSES = [
      ...COURSES.map((course) => remoteByCode.get(course.code) ?? course),
      ...catalog.courses.filter((course) => !COURSES.some((bundled) => bundled.code === course.code)),
    ];
  }
  if (catalog.programs?.length) {
    const remoteById = new Map(catalog.programs.map((program) => [program.id, program]));
    PROGRAMS = [
      ...PROGRAMS.map((program) => remoteById.get(program.id) ?? program),
      ...catalog.programs.filter((program) => !PROGRAMS.some((bundled) => bundled.id === program.id)),
    ];
  }
  if (catalog.careers?.length) {
    const remoteById = new Map(catalog.careers.map((career) => [career.id, career]));
    CAREERS = [
      ...CAREERS.map((career) => remoteById.get(career.id) ?? career),
      ...catalog.careers.filter((career) => !CAREERS.some((bundled) => bundled.id === career.id)),
    ];
  }
}
