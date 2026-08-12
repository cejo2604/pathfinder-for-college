import { DEMO_STUDENT, SAMPLE_STUDENT, courseByCode, TUITION_PER_CREDIT } from "@/lib/fork/data";
for (const s of [DEMO_STUDENT, SAMPLE_STUDENT]) {
  const rows = s.courses.map(c => ({ ...c, credits: courseByCode(c.code)?.credits }));
  const missing = rows.filter(r => r.credits === undefined).map(r => r.code);
  const completed = rows.filter(r => r.status === "completed").reduce((a, r) => a + (r.credits ?? 0), 0);
  const inprog = rows.filter(r => r.status === "in_progress").reduce((a, r) => a + (r.credits ?? 0), 0);
  console.log(`${s.name}: stated=${s.creditsCompleted} transcriptCompleted=${completed} inProgress=${inprog} missingFromCatalog=[${missing.join(",")}] gpa=${s.gpa} target=${s.graduationTarget}`);
}
console.log("tuition/credit", TUITION_PER_CREDIT);
