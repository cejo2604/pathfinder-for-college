import { ALL_PATH_IDS, simulatePath, prerequisiteChain } from "@/lib/fork/engine";
import { DEMO_STUDENT, TUITION_PER_CREDIT, COURSES, PROGRAMS, DEFAULT_CAREER_ID } from "@/lib/fork/data";

const profile = DEMO_STUDENT;
const opts = { profile, careerId: DEFAULT_CAREER_ID, priorities: profile.priorities };
let fails = 0;
const bad = (m: string) => { fails++; console.log("FAIL:", m); };

const sumCourseCredits = profile.courses.filter(c => c.status === "completed").reduce((a, c) => a + c.credits, 0);
console.log(`credits: profile=${profile.creditsCompleted} transcriptCompleted=${sumCourseCredits}`);

const dates = new Set<string>();
for (const id of ALL_PATH_IDS) {
  const p = simulatePath(id, opts);
  const termCredits = p.terms.reduce((a, t) => a + t.credits, 0);
  const cost = Math.round(p.creditsRemaining * TUITION_PER_CREDIT);
  const line = `${id.padEnd(16)} grad=${p.graduationDate.padEnd(10)} sem=${p.semesters} rem=${String(p.creditsRemaining).padStart(3)} add=${String(p.additionalCredits).padStart(3)} cost=${p.estimatedCost} avg=${p.averageLoad} termSum=${termCredits}`;
  console.log(line);
  dates.add(`${p.graduationDate}|${p.creditsRemaining}|${p.estimatedCost}`);
  if (p.creditsRemaining < 0) bad(`${id} negative remaining credits`);
  if (p.semesters <= 0) bad(`${id} non-positive semesters`);
  if (!/^[A-Z][a-z]+ \d{4}$/.test(p.graduationDate)) bad(`${id} malformed graduation date ${p.graduationDate}`);
  if (p.averageLoad <= 0 || p.averageLoad > 21) bad(`${id} implausible average load ${p.averageLoad}`);
  if (termCredits < p.creditsRemaining) bad(`${id} terms cover ${termCredits} of ${p.creditsRemaining} remaining credits`);
  if (p.estimatedCost <= 0) bad(`${id} non-positive cost`);
  if (p.id !== id) bad(`${id} returned id ${p.id}`);
  const second = simulatePath(id, opts);
  if (JSON.stringify(second) !== JSON.stringify(p)) bad(`${id} NOT deterministic`);
  if (!p.nextMoves || p.nextMoves.length !== 3) bad(`${id} nextMoves=${p.nextMoves?.length}`);
  if (p.careerFit < 0 || p.careerFit > 100) bad(`${id} careerFit out of range`);
}
if (dates.size < ALL_PATH_IDS.length - 1) bad(`paths not meaningfully distinct: ${dates.size} unique outcome signatures for ${ALL_PATH_IDS.length} paths`);

// prerequisite integrity across catalog
const codes = new Set(COURSES.map(c => c.code));
for (const c of COURSES) for (const p of c.prerequisites) if (!codes.has(p)) bad(`course ${c.code} prereq ${p} missing from catalog`);
for (const c of COURSES) if (c.credits <= 0 || c.credits > 6) bad(`course ${c.code} implausible credits ${c.credits}`);
// cycle check
const seen = new Map<string, number>();
const visit = (code: string, stack: string[]): void => {
  if (stack.includes(code)) { bad(`prereq cycle: ${[...stack, code].join(" -> ")}`); return; }
  const c = COURSES.find(x => x.code === code);
  if (!c) return;
  for (const p of c.prerequisites) visit(p, [...stack, code]);
};
for (const c of COURSES) visit(c.code, []);
for (const pr of PROGRAMS) if (pr.requiredCredits <= 0) bad(`program ${pr.id} requiredCredits ${pr.requiredCredits}`);

console.log(`\ncourses=${COURSES.length} programs=${PROGRAMS.length} paths=${ALL_PATH_IDS.length}`);
console.log(fails === 0 ? "ALL CHECKS PASSED" : `${fails} FAILURES`);
