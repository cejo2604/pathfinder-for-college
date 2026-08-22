import { useState } from "react";
import { ChevronDown, GraduationCap } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { courseByCode } from "@/lib/fork/data";
import { simulatedElectiveByCode } from "@/lib/fork/electives";
import type { SimulatedPath } from "@/lib/fork/engine";

/**
 * One card per term. Collapsed it shows only the term and its credit load;
 * expanded it lists the courses available that semester with their credits.
 * All values come from the deterministic engine and the course catalog.
 */
export function SemesterCards({
  path,
  doneActions,
  toggleAction,
  className,
}: {
  path: SimulatedPath;
  doneActions: string[];
  toggleAction: (key: string) => void;
  className?: string | undefined;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className={cn(className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl">Semester by semester</h2>
        <p className="text-sm text-muted-foreground">Expand a semester to see its courses and credits.</p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {path.terms.map((term, i) => (
          <TermCard
            key={term.label}
            index={i}
            pathId={path.id}
            term={term}
            doneActions={doneActions}
            toggleAction={toggleAction}
            open={openIndex === i}
            onOpenChange={(nextOpen) => setOpenIndex(nextOpen ? i : null)}
          />
        ))}

        <div className="rounded-2xl border border-mint/50 bg-mint/10 p-5 sm:col-span-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-mint-foreground" />
            <h3 className="font-display text-xl">Estimated completion — {path.estimatedCompletionDate}</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {path.semesters} academic semesters at an average of {path.averageLoad} credits per term.
          </p>
        </div>
      </div>
    </section>
  );
}

function TermCard({
  term,
  index,
  pathId,
  doneActions,
  toggleAction,
  open,
  onOpenChange,
}: {
  term: SimulatedPath["terms"][number];
  index: number;
  pathId: string;
  doneActions: string[];
  toggleAction: (key: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const empty = term.courses.length === 0 && term.actions.length === 0;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="rounded-2xl border border-border bg-card">
      <CollapsibleTrigger
        disabled={empty}
        className="flex w-full items-center gap-3 rounded-2xl p-5 text-left disabled:cursor-default"
      >
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full",
            term.kind === "academic" ? "bg-primary" : term.kind === "summer" ? "bg-gold" : "bg-muted-foreground",
          )}
        />
        <span className="flex-1">
          <span className="block font-display text-xl leading-tight">{term.label}</span>
          <span className="text-sm text-muted-foreground">
            {term.kind === "break"
              ? "Break term"
              : `${term.credits} credits · ${term.courses.length} ${term.courses.length === 1 ? "course" : "courses"}${
                  term.kind === "summer" ? " · summer session" : ""
                }`}
          </span>
        </span>
        {!empty && (
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        )}
      </CollapsibleTrigger>

      <CollapsibleContent className="px-5 pb-5">
        {term.courses.length > 0 && (
          <ul className="divide-y divide-border border-y border-border">
            {term.courses.map((code, ci) => {
              const course = courseByCode(code) ?? simulatedElectiveByCode(code);
              return (
                <li key={`${term.label}-${code}-${ci}`} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  <span>
                    <span className="font-medium tabular-nums">{code}</span>
                    {course?.title && <span className="ml-2 text-muted-foreground">{course.title}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {course ? `${course.credits} cr` : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {term.actions.length > 0 && (
          <ul className="mt-3 space-y-2">
            {term.actions.map((action, ai) => {
              const key = `${pathId}:${term.label}:${ai}`;
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
      </CollapsibleContent>
    </Collapsible>
  );
}
