import { Check, ChevronRight, Plus } from "lucide-react";

import { RiskTag, EstimateBadge } from "@/components/fork/Scores";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COMPLETION_DISCLAIMER, formatCurrency, formatDelta, type SimulatedPath } from "@/lib/fork/engine";
import { useCountUp } from "@/lib/fork/state";

interface PathCardProps {
  path: SimulatedPath;
  index?: number;
  animate?: boolean;
  selected?: boolean;
  best?: boolean;
  inComparison?: boolean;
  onSelect?: (id: string) => void;
  onToggleComparison?: (id: string) => void;
  onWhy?: (id: string) => void;
}

export function PathCard({
  path,
  index = 0,
  animate = false,
  selected = false,
  best = false,
  inComparison = false,
  onSelect,
  onToggleComparison,
  onWhy,
}: PathCardProps) {
  const credits = useCountUp(path.creditsRemaining, animate);
  const cost = useCountUp(path.estimatedCost, animate);

  return (
    <article
      style={animate ? { animationDelay: `${0.15 + index * 0.1}s` } : undefined}
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-5 transition-shadow sm:p-6",
        selected ? "border-primary shadow-node ring-2 ring-primary/20" : "border-border shadow-lift",
        animate && "animate-fork-rise",
      )}
    >
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Path {path.letter}
          </span>
          {best && (
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-gold-foreground">
              Best fit for your priorities
            </span>
          )}
          {path.isBaseline && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
              Current plan
            </span>
          )}
        </div>
        <h3 className="mt-1.5 font-display text-2xl leading-tight">{path.name}</h3>
        <p className="text-sm text-muted-foreground">{path.program}</p>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-4">
        <Metric label="Estimated completion" value={path.estimatedCompletionDate} note={COMPLETION_DISCLAIMER} />
        <Metric label="Credits remaining" value={`${credits}`} />
        <Metric label="Estimated remaining tuition" value={formatCurrency(cost)} />
        <Metric
          label="Vs. your current plan"
          value={path.isBaseline ? "Baseline" : formatDelta(path.additionalCost)}
          tone={path.additionalCost > 0 ? "warn" : path.additionalCost < 0 ? "good" : "flat"}
        />
      </dl>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <RiskTag risk={path.risk} factors={path.riskFactors} />
          <EstimateBadge />
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <List title="Advantages" items={path.advantages} tone="good" />
        <List title="Tradeoffs" items={path.tradeoffs} tone="warn" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {onSelect && (
          <Button onClick={() => onSelect(path.id)} variant={selected ? "secondary" : "default"} className="gap-1">
            {selected ? (
              <>
                <Check className="size-4" /> Selected
              </>
            ) : (
              <>
                Explore path <ChevronRight className="size-4" />
              </>
            )}
          </Button>
        )}
        {onWhy && (
          <Button variant="outline" onClick={() => onWhy(path.id)}>
            Why this path?
          </Button>
        )}
        {onToggleComparison && (
          <Button variant="ghost" className="gap-1" onClick={() => onToggleComparison(path.id)}>
            {inComparison ? <Check className="size-4" /> : <Plus className="size-4" />}
            {inComparison ? "In comparison" : "Compare"}
          </Button>
        )}
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  note,
  tone = "flat",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "good" | "warn" | "flat";
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.1em] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 font-display text-xl tabular-nums",
          tone === "good" && "text-mint-foreground",
          tone === "warn" && "text-gold-foreground",
        )}
      >
        {value}
      </dd>
      {note && <p className="mt-0.5 text-[0.65rem] text-muted-foreground">{note}</p>}
    </div>
  );

}

function List({ title, items, tone }: { title: string; items: string[]; tone: "good" | "warn" }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{title}</h4>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span
              className={cn(
                "mt-1.5 size-1.5 shrink-0 rounded-full",
                tone === "good" ? "bg-mint" : "bg-gold",
              )}
            />
            <span className="leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
