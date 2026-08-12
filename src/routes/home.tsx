import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { ForkShell } from "@/components/fork/ForkShell";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDelta, simulatePaths } from "@/lib/fork/engine";
import { useFork, useForkProfile } from "@/lib/fork/state";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "My Path — Fork" },
      {
        name: "description",
        content: "Your current academic position, your goal, and the decision that matters most right now.",
      },
      { property: "og:title", content: "My Path — Fork" },
      { property: "og:description", content: "Where you are today and where your choices could lead." },
    ],
  }),
  component: MyPath,
});

const DECISION_PATHS = ["baseline", "switch_cs", "cs_minor"];

// Each option card opens the What If? simulator with the matching question.
// The baseline label/question are derived from the student's own program record.
const SIMULATE_QUESTIONS: Record<string, string> = {
  switch_cs: "What if I switch to Computer Science?",
  cs_minor: "What if I add a Computer Science minor?",
};


function MyPath() {
  const profile = useForkProfile();
  const { profile: loaded, loadDemoStudent, careerId, priorities, signedIn } = useFork();
  const navigate = useNavigate();

  const options = simulatePaths(DECISION_PATHS, { profile, careerId, priorities });

  // Once a student has created their own profile, only their own entries show —
  // empty fields fall back to a neutral example hint, never to demo-student data.
  const own = Boolean(loaded);
  const show = (value: string | number | null | undefined, example: string) => {
    const text = typeof value === "number" ? (value ? String(value) : "") : (value ?? "").trim();
    if (text) return text;
    return own ? example : String(value ?? "");
  };
  const firstName = show(profile.name.split(" ")[0], "Your");

  return (
    <ForkShell>
      {!loaded && signedIn && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">Your profile is empty. Add your academic record so Fork can simulate your paths.</p>
          <Button size="sm" className="gap-1.5" onClick={() => void navigate({ to: "/profile" })}>
            Complete my profile
          </Button>
        </div>
      )}
      {!loaded && !signedIn && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">
            You&apos;re previewing the demo student. Load {profile.name} to save choices as you explore.
          </p>
          <Button size="sm" className="gap-1.5" onClick={() => loadDemoStudent()}>
            <Sparkles className="size-3.5" /> Load demo student
          </Button>
        </div>
      )}

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {show(profile.school, "Add your school")} · {show(profile.year, "Add your year")}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
          {firstName === "Your" ? "Your future" : `${firstName}\u2019s future`}
        </h1>
        <p className="mt-2 font-display text-2xl text-muted-foreground">
          {show(profile.major, "Add your major")} <span className="text-primary">→</span>{" "}
          {show(profile.goalCategory, "Set your goal")}
        </p>
        <p className="mt-4 max-w-2xl text-lg">
          You&apos;re currently on track to graduate in{" "}
          <span className="font-medium">{show(profile.graduationTarget, "your target term")}</span> with{" "}
          {show(profile.creditsCompleted, "0")} credits completed and a {show(profile.gpa, "—")} GPA.
        </p>
      </header>


      <section className="mt-12 rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
        <h2 className="font-display text-2xl">Your biggest decision</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          You have several ways to combine your interest in healthcare and technology. They differ by about a semester
          and {formatCurrency(Math.abs((options[1]?.additionalCost ?? 0) - (options[2]?.additionalCost ?? 0)))} in
          tuition.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {options.map((path) => (
            <div
              key={path.id}
              className="flex flex-col rounded-2xl border border-border bg-background p-4 text-left"
            >
              <p className="font-display text-lg leading-tight">
                {path.id === "baseline"
                  ? baselineLabel
                  : path.id === "switch_cs"
                    ? "Switch to Computer Science"
                    : "Add a Computer Science minor"}
              </p>

              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Est. completion</dt>
                  <dd className="font-medium">{path.estimatedCompletionDate}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Tuition change</dt>
                  <dd className="font-medium tabular-nums">
                    {path.isBaseline ? "Baseline" : formatDelta(path.additionalCost)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Career fit</dt>
                  <dd className="font-medium tabular-nums">{path.scores.careerFit} / 100</dd>
                </div>
              </dl>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full gap-1.5"
                onClick={() => navigate({ to: "/what-if", search: { q: SIMULATE_QUESTIONS[path.id] ?? "What if I change my plan?" } })}
              >
                <Sparkles className="size-3.5" /> Simulate this
              </Button>
            </div>
          ))}
        </div>

      </section>


      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <Fact label="Current courses" value={profile.courses.filter((c) => c.status === "in_progress").length} sub="in progress this term" />
        <Fact label="Credits completed" value={profile.creditsCompleted} sub={`of ${120} required`} />
        <Fact label="Career interests" value={profile.careerInterests.length} sub={profile.careerInterests.join(", ")} />
      </section>
    </ForkShell>
  );
}

function Fact({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
