import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRIORITY_LABELS, type Priority } from "@/lib/fork/data";
import { formatCurrency, formatDelta, type SimulatedPath } from "@/lib/fork/engine";

export function PriorityPanel({
  priorities,
  onChange,
  topPathName,
}: {
  priorities: Priority[];
  onChange: (next: Priority[]) => void;
  topPathName?: string | undefined;
}) {
  const move = (index: number, dir: -1 | 1) => {
    const next = [...priorities];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const a = next[index] as Priority;
    next[index] = next[target] as Priority;
    next[target] = a;
    onChange(next);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-display text-xl">What matters most to you?</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Reorder your priorities and every path is re-scored immediately. The ranking can change — that is the point.
      </p>

      <ol className="mt-4 space-y-2">
        {priorities.map((priority, i) => (
          <li
            key={priority}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm",
              i === 0 ? "border-primary/40 bg-primary/5" : "border-border",
            )}
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold tabular-nums">
              {i + 1}
            </span>
            <span className="flex-1">{PRIORITY_LABELS[priority]}</span>
            <span className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={`Move ${PRIORITY_LABELS[priority]} up`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={`Move ${PRIORITY_LABELS[priority]} down`}
                disabled={i === priorities.length - 1}
                onClick={() => move(i, 1)}
              >
                <ArrowDown className="size-3.5" />
              </Button>
            </span>
          </li>
        ))}
      </ol>

      {topPathName && (
        <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm">
          With these priorities, <span className="font-medium">{topPathName}</span> ranks highest on overall fit.
        </p>
      )}
    </section>
  );
}

export function CostOfDecision({ chosen, alternative }: { chosen: SimulatedPath; alternative: SimulatedPath }) {
  const rows = (path: SimulatedPath) => [
    {
      label: "Semesters",
      value:
        path.additionalSemesters === 0
          ? "No change"
          : `${path.additionalSemesters > 0 ? "+" : "−"}${Math.abs(path.additionalSemesters)} semester${Math.abs(path.additionalSemesters) > 1 ? "s" : ""}`,
    },
    { label: "Estimated tuition", value: formatDelta(path.additionalCost) },
    {
      label: "Credits",
      value: path.additionalCredits === 0 ? "No change" : `${path.additionalCredits > 0 ? "+" : "−"}${Math.abs(path.additionalCredits)} credits`,
    },
    { label: "Graduation", value: path.graduationDate },
    { label: "Total remaining tuition", value: formatCurrency(path.estimatedCost) },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 className="font-display text-xl">The cost of this decision</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Measured against your current plan, side by side with the cheaper alternative.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[
          { path: chosen, tone: "warn" as const, caption: "If you choose this" },
          { path: alternative, tone: "good" as const, caption: "Alternative" },
        ].map(({ path, tone, caption }) => (
          <div
            key={path.id}
            className={cn(
              "rounded-xl border p-4",
              tone === "warn" ? "border-gold/50 bg-gold/5" : "border-mint/50 bg-mint/5",
            )}
          >
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{caption}</p>
            <p className="font-display text-lg leading-tight">{path.name}</p>
            <dl className="mt-3 space-y-1.5 text-sm">
              {rows(path).map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="font-medium tabular-nums">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
