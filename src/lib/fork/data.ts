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
  { id: "cs_minor", name: "Computer Science minor", kind: "minor", requiredCredits: 18 },
  { id: "hinf_minor", name: "Health Informatics minor", kind: "minor", requiredCredits: 18 },
];

export const programById = (id: string) => PROGRAMS.find((p) => p.id === id);

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

export const DEMO_STUDENT: StudentProfile = {
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
    // 54 completed credits, verified from the demo institutional record.
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
 * Second demo record with coursework: a CS-leaning sophomore.
 */
export const DEMO_STUDENT_CS: StudentProfile = {
  name: "Devon Carter",
  school: "University of North Carolina",
  institutionId: DEFAULT_INSTITUTION_ID,
  degree: "Bachelor of Science",
  major: "Computer Science",
  minor: null,
  year: "Sophomore",
  graduationTarget: "May 2028",
  creditsCompleted: 45,
  gpa: 3.4,
  interests: ["Technology", "Problem solving", "Design"],
  careerInterests: ["Software engineering", "Data science"],
  skills: ["Python", "Debugging", "Version control"],
  priorities: [
    "career_opportunities",
    "graduate_on_time",
    "flexibility",
    "minimize_cost",
    "stay_close_to_major",
    "minimize_coursework",
  ],
  goal: "I want to become a software engineer.",
  goalCategory: "Software engineering",
  courses: [
    { code: "COMP 110", status: "completed", term: "Fall 2024", grade: "A" },
    { code: "COMP 210", status: "completed", term: "Spring 2025", grade: "B+" },
    { code: "MATH 152", status: "completed", term: "Fall 2024", grade: "B" },
    { code: "MATH 233", status: "completed", term: "Fall 2025", grade: "A-" },
    { code: "STAT 155", status: "completed", term: "Spring 2025", grade: "B+" },
    // Remaining 28 completed credits are general-education requirements.
    { code: "GEN ED", status: "completed", term: "2024 – 2026", grade: "—" },
    { code: "COMP 301", status: "in_progress", term: "Spring 2026" },
    { code: "COMP 311", status: "in_progress", term: "Spring 2026" },
  ],
};

/**
 * Third demo record with coursework: a health-informatics-leaning junior.
 */
export const DEMO_STUDENT_HINF: StudentProfile = {
  name: "Priya Raman",
  school: "University of North Carolina",
  institutionId: DEFAULT_INSTITUTION_ID,
  degree: "Bachelor of Science",
  major: "Biology",
  minor: "Health Informatics minor",
  year: "Junior",
  graduationTarget: "December 2027",
  creditsCompleted: 30,
  gpa: 3.8,
  interests: ["Healthcare", "Data", "Public health"],
  careerInterests: ["Healthcare technology", "Health analytics"],
  skills: ["Spreadsheet analysis", "Scientific writing"],
  priorities: [
    "minimize_cost",
    "career_opportunities",
    "graduate_on_time",
    "stay_close_to_major",
    "flexibility",
    "minimize_coursework",
  ],
  goal: "I want to work with clinical data.",
  goalCategory: "Healthcare technology",
  courses: [
    { code: "BIOL 101", status: "completed", term: "Fall 2024", grade: "A" },
    { code: "CHEM 101", status: "completed", term: "Fall 2024", grade: "B+" },
    { code: "STAT 155", status: "completed", term: "Spring 2025", grade: "A" },
    { code: "PSYC 101", status: "completed", term: "Spring 2025", grade: "A-" },
    { code: "HINF 210", status: "completed", term: "Fall 2025", grade: "A" },
    // Remaining 13 completed credits are general-education requirements.
    { code: "GEN ED", status: "completed", term: "2024 – 2026", grade: "—" },
    { code: "HINF 320", status: "in_progress", term: "Spring 2026" },
    { code: "STAT 320", status: "in_progress", term: "Spring 2026" },
  ],
};

/**
 * Demo record with no degree plan yet: undecided first-year, no coursework on file.
 */
export const DEMO_STUDENT_UNDECIDED: StudentProfile = {
  ...createEmptyProfile(),
  name: "Jordan Blake",
  school: "University of North Carolina",
  degree: "Bachelor of Science",
  year: "Freshman",
  gpa: 3.2,
  interests: ["Technology", "Healthcare"],
  careerInterests: ["Still exploring"],
  goal: "I don't know what to major in yet.",
};

/**
 * Second demo record with no degree plan: transfer student still deciding.
 */
export const DEMO_STUDENT_EXPLORING: StudentProfile = {
  ...createEmptyProfile(),
  name: "Alex Nguyen",
  school: "University of North Carolina",
  degree: "Bachelor of Arts",
  year: "Sophomore",
  gpa: 3.0,
  interests: ["Business", "Design"],
  careerInterests: ["Still exploring"],
  goal: "I want to see which path costs the least.",
};

export interface DemoStudentOption {
  id: string;
  label: string;
  description: string;
  profile: StudentProfile;
}

/** The demo students offered in demo mode: three with coursework, two without a degree plan. */
export const DEMO_STUDENTS: DemoStudentOption[] = [
  {
    id: "maya",
    label: "Maya Rodriguez — Biology sophomore",
    description: "54 credits of coursework on file, exploring healthcare technology.",
    profile: DEMO_STUDENT,
  },
  {
    id: "devon",
    label: "Devon Carter — CS sophomore",
    description: "45 credits of coursework on file, aiming at software engineering.",
    profile: DEMO_STUDENT_CS,
  },
  {
    id: "priya",
    label: "Priya Raman — Biology junior",
    description: "30 credits of coursework on file, health informatics minor.",
    profile: DEMO_STUDENT_HINF,
  },
  {
    id: "jordan",
    label: "Jordan Blake — undecided freshman",
    description: "No degree plan and no coursework on file yet.",
    profile: DEMO_STUDENT_UNDECIDED,
  },
  {
    id: "alex",
    label: "Alex Nguyen — exploring sophomore",
    description: "No degree plan on file, comparing cost-first options.",
    profile: DEMO_STUDENT_EXPLORING,
  },
];

export const demoStudentById = (id: string) => DEMO_STUDENTS.find((s) => s.id === id);

/**
 * Anonymized sample profile for demos where the named demo student should not appear.
 * Same shape and credit math as the demo record so the deterministic engine behaves identically.
 */
export const SAMPLE_STUDENT: StudentProfile = {
  ...DEMO_STUDENT,
  name: "Sample Student",
  school: "Sample State University",
  goal: "I want to work in healthcare technology.",
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

/** Catalog loaded from the database replaces the bundled defaults in place. */
export function applyCatalog(catalog: {
  courses?: Course[];
  programs?: DegreeProgram[];
  careers?: Career[];
}) {
  if (catalog.courses?.length) COURSES = catalog.courses;
  if (catalog.programs?.length) PROGRAMS = catalog.programs;
  if (catalog.careers?.length) CAREERS = catalog.careers;
}
