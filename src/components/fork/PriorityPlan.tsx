import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { PriorityCareerPlan } from "@/lib/fork/engine";

/**
 * Renders the plan in the exact order the student ranked their priorities.
 * Every line comes from the deterministic engine — nothing is generated here.
 */
export function PriorityPlan({
  plan,
  doneActions,
  toggleAction,
  onReorder,
  className,
}: {
  plan: PriorityCareerPlan;
  doneActions: string[];
  toggleAction: (key: string) => void;
  onReorder?: (() => void) | undefined;
  className?: string | undefined;
}) {
  return (
    <section className={cn("rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Built from your priorities
          </p>
          <h2 className="mt-2 font-display text-2xl">Your career plan, in your order</h2>
        </div>
        {onReorder && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onReorder}>
            Reorder priorities <ArrowRight className="size-3.5" />
          </Button>
        )}
      </div>

      <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm">{plan.summary}</p>

      <ol className="mt-6 space-y-4">
        {plan.steps.map((step) => (
          <li
            key={step.priority}
            style={{ animationDelay: `${(step.rank - 1) * 0.07}s` }}
            className={cn(
              "animate-fork-rise rounded-2xl border p-5",
              step.rank === 1 ? "border-primary/40 bg-primary/5" : "border-border",
            )}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-semibold tabular-nums text-primary">
                {step.rank}
              </span>
              <h3 className="font-display text-xl">{step.label}</h3>
              <span className="text-sm text-muted-foreground">
                {step.metric} · weighted {step.weightPct}%
              </span>
            </div>

            <ul className="mt-3 space-y-2">
              {step.moves.map((move, mi) => {
                const key = `${plan.recommended.id}:priority:${step.priority}:${mi}`;
                const done = doneActions.includes(key);
                return (
                  <li key={key} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      id={key}
                      checked={done}
                      onCheckedChange={() => toggleAction(key)}
                      aria-label={`Mark "${move}" complete`}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={key}
                      className={cn("cursor-pointer", done && "text-muted-foreground line-through")}
                    >
                      {move}
                    </label>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>

      <p className="mt-5 text-xs text-muted-foreground">
        Fork estimate — the ordering, weights and every number above are derived from your ranked priorities and your
        verified academic record. Change the order and this plan changes with it.
      </p>
    </section>
  );
}
