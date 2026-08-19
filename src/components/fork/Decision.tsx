import { cn } from "@/lib/utils";
import { formatCurrency, formatDelta, type SimulatedPath } from "@/lib/fork/engine";

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
    { label: "Estimated completion", value: path.estimatedCompletionDate },
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
