import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, GraduationCap, ListChecks, Lightbulb, TriangleAlert } from "lucide-react";

import { ForkShell, PlanningEstimateNote } from "@/components/fork/ForkShell";
import { PriorityPlan } from "@/components/fork/PriorityPlan";
import { RelevantCourses } from "@/components/fork/RelevantCourses";
import { RiskTag, ScorePanel, EstimateBadge } from "@/components/fork/Scores";
import { AssumptionsPanel } from "@/components/fork/WhyPath";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { careerById, PRIORITY_LABELS } from "@/lib/fork/data";
import {
  formatCurrency,
  formatDelta,
  priorityCareerPlan,
  simulatePath,
  whyThisPath,
} from "@/lib/fork/engine";
import { BASELINE_PATH_ID } from "@/lib/fork/paths";
import { useFork, useForkProfile } from "@/lib/fork/state";

export const Route = createFileRoute("/path")({
  head: () => ({
    meta: [
      { title: "Your chosen path — full breakdown | Fork" },
      {
        name: "description",
        content:
          "The complete breakdown of the path you chose: graduation date, cost, coursework, tradeoffs and the steps needed to succeed.",
      },
      { property: "og:title", content: "Your chosen path — full breakdown" },
      {
        property: "og:description",
        content: "Everything Fork calculated for your path, plus the concrete steps to make it work.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PathBreakdownPage,
});

function PathBreakdownPage() {
  const profile = useForkProfile();
  const navigate = useNavigate();
  const { chosenPathId, careerId, priorities, doneActions, toggleAction } = useFork();

  const pathId = chosenPathId ?? "cs_minor";
  const path = simulatePath(pathId, { profile, careerId, priorities });
  const baseline = simulatePath(BASELINE_PATH_ID, { profile, careerId, priorities });
  const plan = priorityCareerPlan({ profile, careerId, priorities, pathId });
  const career = careerById(careerId);
  const reasons = whyThisPath(path, profile, priorities);

  const facts = [
    { label: "Graduation", value: path.graduationDate, note: `${path.graduationTerm} · ${path.semesters} semesters` },
    {
      label: "Remaining tuition",
      value: formatCurrency(path.estimatedCost),
      note: `${formatDelta(path.additionalCost)} vs staying put`,
    },
    {
      label: "Credits remaining",
      value: `${path.creditsRemaining}`,
      note: `${path.appliedCredits} of your credits apply · ${path.unappliedCredits} do not`,
    },
    {
      label: "Average load",
      value: `${path.averageLoad} cr/term`,
      note: path.summerSessions > 0 ? `${path.summerSessions} summer session(s)` : "No summer terms needed",
    },
  ];

  return (
    <ForkShell>
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Path {path.letter} · full breakdown
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{path.name}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{path.headline}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {path.program} · aiming at {career?.title ?? "your career goal"}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <RiskTag risk={path.risk} factors={path.riskFactors} />
          <EstimateBadge />
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((f, i) => (
          <div
            key={f.label}
            style={{ animationDelay: `${i * 0.07}s` }}
            className="animate-fork-rise rounded-2xl border border-border bg-card p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{f.label}</p>
            <p className="mt-2 font-display text-2xl">{f.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{f.note}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 shadow-lift sm:p-8">
          <h2 className="font-display text-2xl">Why this path fits you</h2>
          <ul className="mt-4 space-y-3 text-[0.975rem]">
            {reasons.map((r, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-muted-foreground">
            Ranked against staying put: {formatDelta(path.additionalCost)} tuition,{" "}
            {path.additionalSemesters === 0
              ? "same number of semesters"
              : `${path.additionalSemesters > 0 ? "+" : "−"}${Math.abs(path.additionalSemesters)} semester(s)`}
            , career fit {path.scores.careerFit} vs {baseline.scores.careerFit}.
          </p>
        </div>
        <ScorePanel scores={path.scores} />
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-mint/50 bg-mint/10 p-5">
          <h3 className="flex items-center gap-2 font-display text-xl">
            <Lightbulb className="size-5 text-mint-foreground" /> What you gain
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {path.advantages.map((a, i) => (
              <li key={i}>· {a}</li>
            ))}
          </ul>
          {path.opportunities.length > 0 && (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Opportunities this opens
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                {path.opportunities.map((o, i) => (
                  <li key={i}>· {o}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="rounded-2xl border border-gold/50 bg-gold/10 p-5">
          <h3 className="flex items-center gap-2 font-display text-xl">
            <TriangleAlert className="size-5 text-gold-foreground" /> What it costs you
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {path.tradeoffs.map((t, i) => (
              <li key={i}>· {t}</li>
            ))}
          </ul>
          {path.unknowns.length > 0 && (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Still unknown — confirm with your advisor
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                {path.unknowns.map((u, i) => (
                  <li key={i}>· {u}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
        <h2 className="flex items-center gap-2 font-display text-2xl">
          <ListChecks className="size-5 text-primary" /> Steps to succeed on this path
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start here. These come straight from the engine&apos;s numbers for {path.name}.
        </p>
        <ol className="mt-5 space-y-3">
          {path.nextMoves.map((move, i) => {
            const key = `${path.id}:move:${i}`;
            const done = doneActions.includes(key);
            return (
              <li key={key} className="flex items-start gap-3 rounded-xl bg-muted/60 p-4">
                <Checkbox
                  id={`bd-${key}`}
                  checked={done}
                  onCheckedChange={() => toggleAction(key)}
                  className="mt-0.5"
                  aria-label={`Mark step ${i + 1} complete`}
                />
                <label htmlFor={`bd-${key}`} className="flex-1 cursor-pointer">
                  <span className="mr-2 font-display text-lg text-muted-foreground">{i + 1}</span>
                  <span className={cn("text-[0.975rem]", done && "text-muted-foreground line-through")}>{move}</span>
                </label>
              </li>
            );
          })}
        </ol>

        {path.prerequisiteCourses.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border p-4">
            <p className="text-sm font-medium">
              Prerequisites you still need ({path.prerequisiteCount})
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {path.prerequisiteCourses.map((c) => (
                <li key={c} className="rounded-full bg-muted px-3 py-1 text-sm">
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Sequence matters — these gate the later courses in the roadmap.
            </p>
          </div>
        )}
      </section>

      <PriorityPlan
        className="mt-10"
        plan={plan}
        doneActions={doneActions}
        toggleAction={toggleAction}
        onReorder={() => void navigate({ to: "/plan" })}
      />

      <section className="mt-12">
        <h2 className="font-display text-2xl">Your term-by-term shape</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A summary of each term on this path. The full checklist roadmap lives on the Plan page.
        </p>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {path.terms.map((term) => (
            <li key={term.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-lg">{term.label}</h3>
                <span className="text-xs text-muted-foreground">
                  {term.kind === "break" ? "Break" : `${term.credits} cr`}
                </span>
              </div>
              {term.courses.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">{term.courses.join(" · ")}</p>
              )}
            </li>
          ))}
          <li className="rounded-2xl border border-mint/50 bg-mint/10 p-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-5 text-mint-foreground" />
              <h3 className="font-display text-lg">Graduation</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{path.graduationDate}</p>
          </li>
        </ol>
      </section>

      <RelevantCourses className="mt-12" careerId={careerId} profile={profile} />

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <AssumptionsPanel path={path} profile={profile} />
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-xl">Where to next</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your priorities right now: {priorities.map((p) => PRIORITY_LABELS[p]).join(" → ")}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button className="gap-1.5" onClick={() => void navigate({ to: "/plan" })}>
              Open the semester roadmap <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" onClick={() => void navigate({ to: "/compare" })}>
              Compare against other paths
            </Button>
          </div>
          <PlanningEstimateNote className="mt-4" />
        </section>
      </div>
    </ForkShell>
  );
}
