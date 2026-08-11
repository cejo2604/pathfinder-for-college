import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import { ArrowRight, CalendarCheck, Check, GraduationCap } from "lucide-react";

import { ForkShell } from "@/components/fork/ForkShell";
import { PriorityPanel } from "@/components/fork/Decision";
import { PriorityPlan } from "@/components/fork/PriorityPlan";
import { RelevantCourses } from "@/components/fork/RelevantCourses";
import { AssumptionsPanel } from "@/components/fork/WhyPath";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatCurrency, priorityCareerPlan, simulatePath, waitlistedCourses } from "@/lib/fork/engine";
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
  const { chosenPathId, careerId, priorities, doneActions, toggleAction, setPriorities } = useFork();
  const prioritiesRef = useRef<HTMLDivElement>(null);

  const path = simulatePath(chosenPathId ?? "cs_minor", { profile, careerId, priorities });
  // Waitlisted seats come from the verified academic history, never predicted.
  const waitlisted = waitlistedCourses(profile);
  // The plan itself is ordered by the student's ranked priorities.
  const plan = priorityCareerPlan({ profile, careerId, priorities, pathId: chosenPathId ?? "cs_minor" });




  return (
    <ForkShell>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your Fork</p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{path.name}</h1>
        <p className="mt-3 text-muted-foreground">
          {path.program} · {path.creditsRemaining} credits remaining ·{" "}
          {formatCurrency(path.estimatedCost)} estimated tuition · graduating {path.graduationDate}
        </p>
        <Button variant="outline" className="mt-4 gap-1.5" onClick={() => void navigate({ to: "/path" })}>
          See the full path breakdown <ArrowRight className="size-4" />
        </Button>

      </header>

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

      <PriorityPlan
        className="mt-10"
        plan={plan}
        doneActions={doneActions}
        toggleAction={toggleAction}
        onReorder={() => prioritiesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
      />

      <div ref={prioritiesRef} className="mt-8">
        <PriorityPanel priorities={priorities} onChange={setPriorities} topPathName={plan.ranked[0]?.name} />
      </div>


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

      <section className="mt-12">
        <h2 className="font-display text-2xl">Semester by semester</h2>
        <ol className="relative mt-6 space-y-6 border-l border-border pl-6 sm:pl-8">
          {path.terms.map((term, i) => (
            <li
              key={term.label}
              style={{ animationDelay: `${i * 0.09}s` }}
              className="animate-fork-rise relative rounded-2xl border border-border bg-card p-5"
            >
              <span
                className={cn(
                  "absolute -left-[2.05rem] top-6 grid size-4 place-items-center rounded-full border-2 border-background sm:-left-[2.55rem]",
                  term.kind === "academic" ? "bg-primary" : term.kind === "summer" ? "bg-gold" : "bg-muted-foreground",
                )}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-xl">{term.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {term.kind === "break"
                    ? "Break term"
                    : `${term.credits} credits${term.kind === "summer" ? " · summer session" : ""}`}
                </p>
              </div>

              {term.courses.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {term.courses.map((course, ci) => (
                    <li
                      key={`${term.label}-${course}-${ci}`}
                      className="rounded-full bg-muted px-3 py-1 text-sm"
                    >
                      {course}
                    </li>
                  ))}
                </ul>
              )}

              {term.actions.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {term.actions.map((action, ai) => {
                    const key = `${path.id}:${term.label}:${ai}`;
                    const done = doneActions.includes(key);
                    return (
                      <li key={key} className="flex items-start gap-2 text-sm">
                        <Checkbox
                          id={key}
                          checked={done}
                          onCheckedChange={() => toggleAction(key)}
                          aria-label={`Mark "${action}" complete`}
                          className="mt-0.5"
                        />
                        <label htmlFor={key} className={cn("cursor-pointer", done && "text-muted-foreground line-through")}>
                          {action}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}

          <li className="relative rounded-2xl border border-mint/50 bg-mint/10 p-5">
            <span className="absolute -left-[2.05rem] top-6 grid size-4 place-items-center rounded-full border-2 border-background bg-mint sm:-left-[2.55rem]" />
            <div className="flex items-center gap-2">
              <GraduationCap className="size-5 text-mint-foreground" />
              <h3 className="font-display text-xl">Graduation — {path.graduationDate}</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {path.semesters} academic semesters from Fall 2026, at an average of {path.averageLoad} credits per term.
            </p>
          </li>
        </ol>
      </section>

      <RelevantCourses className="mt-12" careerId={careerId} profile={profile} />

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <AssumptionsPanel path={path} profile={profile} />
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-xl">Keep exploring</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Nothing here is locked in. Visit the Compare page to see alternatives side by side.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void navigate({ to: "/compare" })}>
              Compare against other paths
            </Button>
            <Button variant="ghost" className="gap-1.5" onClick={() => void navigate({ to: "/career" })}>
              <Check className="size-4" /> Career reference
            </Button>
          </div>
        </section>
      </div>
    </ForkShell>
  );
}
