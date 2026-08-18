import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { ForkShell } from "@/components/fork/ForkShell";
import { RelevantCourses } from "@/components/fork/RelevantCourses";
import { SemesterCards } from "@/components/fork/SemesterCards";
import { AssumptionsPanel } from "@/components/fork/WhyPath";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatCurrency, simulatePath, waitlistedCourses } from "@/lib/fork/engine";
import { useFork, useForkProfile } from "@/lib/fork/state";


export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Your semester plan — Fork" },
      {
        name: "description",
        content: "A semester-by-semester roadmap for the path you chose, starting with your next three moves.",
      },
      { property: "og:title", content: "Your Fork — semester plan" },
      { property: "og:description", content: "Turn a decision into a term-by-term plan and three concrete next moves." },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const profile = useForkProfile();
  const navigate = useNavigate();
  const { chosenPathId, careerId, priorities, doneActions, toggleAction } = useFork();

  const path = simulatePath(chosenPathId ?? "cs_minor", { profile, careerId, priorities });
  // Waitlisted seats come from the verified academic history, never predicted.
  const waitlisted = waitlistedCourses(profile);

  return (
    <ForkShell>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your Fork</p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{path.name}</h1>
        <p className="mt-2 text-muted-foreground">{path.program}</p>
        <Button variant="outline" className="mt-4 gap-1.5" onClick={() => void navigate({ to: "/path" })}>
          See the full path breakdown <ArrowRight className="size-4" />
        </Button>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Total estimated cost" value={formatCurrency(path.estimatedCost)} />
        <Stat label="Credits remaining" value={`${path.creditsRemaining}`} />
        <Stat label="Estimated completion" value={path.estimatedCompletionDate} />
        <p className="text-xs text-muted-foreground sm:col-span-3">
          Fork estimate — {path.creditsRemaining} credits × {formatCurrency(path.tuitionPerCredit)} per credit. Confirm
          course availability and requirements with your academic advisor.
        </p>
      </section>


      {waitlisted.length > 0 && (
        <section className="mt-8 rounded-2xl border border-gold/50 bg-gold/10 p-5 sm:p-6">
          <h2 className="font-display text-2xl">One thing could change your timeline</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {waitlisted.map((sc, i) => (
              <li key={`${sc.code}-${i}`}>
                <span className="font-medium">{sc.code}</span>
                {sc.waitlistPosition ? ` · Waitlisted #${sc.waitlistPosition}` : " · Waitlisted"}
                {sc.term ? ` · ${sc.term}` : ""}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted-foreground">
            {waitlisted.length === 1 ? "This course is" : "These courses are"} important to your current plan. Fork does
            not predict whether you will get a seat — it shows what happens either way.
          </p>
          <Button
            className="mt-4 gap-1.5"
            onClick={() => void navigate({ to: "/path" })}
          >
            Review your path <ArrowRight className="size-4" />
          </Button>
        </section>
      )}





      <section className="mt-10 rounded-3xl border border-primary/30 bg-primary/5 p-6 shadow-lift sm:p-8">

        <h2 className="font-display text-2xl">Your next 3 moves</h2>
        <ol className="mt-5 space-y-3">
          {path.nextMoves.map((move, i) => {
            const key = `${path.id}:move:${i}`;
            const done = doneActions.includes(key);
            return (
              <li key={key} className="flex items-start gap-3 rounded-xl bg-card p-4">
                <Checkbox
                  id={key}
                  checked={done}
                  onCheckedChange={() => toggleAction(key)}
                  className="mt-0.5"
                  aria-label={`Mark move ${i + 1} complete`}
                />
                <label htmlFor={key} className="flex-1 cursor-pointer">
                  <span className="mr-2 font-display text-lg text-muted-foreground">{i + 1}</span>
                  <span className={cn("text-[0.975rem]", done && "text-muted-foreground line-through")}>{move}</span>
                </label>
              </li>
            );
          })}
        </ol>
      </section>

      <SemesterCards className="mt-12" path={path} doneActions={doneActions} toggleAction={toggleAction} />


      <RelevantCourses className="mt-12" careerId={careerId} profile={profile} />

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
        <AssumptionsPanel path={path} profile={profile} />
        <section className="rounded-xl border border-border bg-card p-2">
          <h3 className="font-display text-sm">Keep exploring</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Visit the Compare page to see alternatives side by side.
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void navigate({ to: "/compare" })}>
              Compare against other paths
            </Button>
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => void navigate({ to: "/career" })}>
              <Check className="size-3.5" /> Career reference
            </Button>
          </div>
        </section>
      </div>
    </ForkShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}

