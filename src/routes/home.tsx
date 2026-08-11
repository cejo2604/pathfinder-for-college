import { createFileRoute } from "@tanstack/react-router";
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

const DECISION_PATHS = ["stay_biology", "switch_cs", "cs_minor"];
const QUICK = ["switch_major", "add_minor", "graduate_early", "minimize_cost"];

function MyPath() {
  const profile = useForkProfile();
  const { profile: loaded, loadDemoStudent, careerId, priorities, runScenario } = useFork();
  const navigate = useNavigate();

  const options = simulatePaths(DECISION_PATHS, { profile, careerId, priorities });

  const go = (scenarioId: string) => {
    const scenario = scenarioById(scenarioId);
    if (!scenario) return;
    runScenario(scenario.id, scenario.question);
    void navigate({ to: "/what-if" });
  };

  return (
    <ForkShell>
      {!loaded && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">
            You&apos;re previewing the demo student. Load {profile.name} to save choices as you explore.
          </p>
          <Button size="sm" className="gap-1.5" onClick={loadDemoStudent}>
            <Sparkles className="size-3.5" /> Load demo student
          </Button>
        </div>
      )}

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {profile.school} · {profile.year}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
          {profile.name.split(" ")[0]}&apos;s future
        </h1>
        <p className="mt-2 font-display text-2xl text-muted-foreground">
          {profile.major} <span className="text-primary">→</span> {profile.goalCategory}
        </p>
        <p className="mt-4 max-w-2xl text-lg">
          You&apos;re currently on track to graduate in{" "}
          <span className="font-medium">{profile.graduationTarget}</span> with {profile.creditsCompleted} credits
          completed and a {profile.gpa} GPA.
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
            <button
              key={path.id}
              type="button"
              onClick={() => go(path.id === "switch_cs" ? "switch_major" : path.id === "cs_minor" ? "add_minor" : "career_health_tech")}
              className="rounded-2xl border border-border bg-background p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
            >
              <p className="font-display text-lg leading-tight">
                {path.id === "stay_biology"
                  ? "Stay in Biology"
                  : path.id === "switch_cs"
                    ? "Switch to Computer Science"
                    : "Add a Computer Science minor"}
              </p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Graduation</dt>
                  <dd className="font-medium">{path.graduationDate}</dd>
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
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Simulate this <ArrowRight className="size-3.5" />
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Quick What If?</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK.map((id) => {
            const scenario = scenarioById(id);
            if (!scenario) return null;
            return (
              <Button key={id} variant="outline" className="rounded-full" onClick={() => go(id)}>
                {scenario.chip}
              </Button>
            );
          })}
          <Button className="gap-1.5 rounded-full" onClick={() => void navigate({ to: "/what-if" })}>
            <Sparkles className="size-4" /> Ask my own question
          </Button>
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
