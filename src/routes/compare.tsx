import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

import { ForkShell } from "@/components/fork/ForkShell";
import { RiskTag } from "@/components/fork/Scores";
import { WhyPathSheet } from "@/components/fork/WhyPath";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PATHS } from "@/lib/fork/paths";
import { formatCurrency, formatDelta, rankPaths, simulatePaths, type SimulatedPath } from "@/lib/fork/engine";
import { useFork, useForkProfile } from "@/lib/fork/state";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare paths — Fork" },
      {
        name: "description",
        content:
          "Put two to four possible futures side by side: graduation date, credits, tuition, risk and flexibility.",
      },
      { property: "og:title", content: "Compare your possible futures — Fork" },
      { property: "og:description", content: "Graduation date, cost and coursework, side by side." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const profile = useForkProfile();
  const navigate = useNavigate();
  const {
    comparison,
    toggleComparison,
    setComparison,
    careerId,
    priorities,
    choosePath,
    scenarioId,
    scenarioQuestion,
  } = useFork();
  const [whyId, setWhyId] = useState<string | null>(null);

  const selectedIds = comparison.length ? comparison : ["baseline", "switch_cs", "cs_minor"];
  const paths = useMemo(
    () => simulatePaths(selectedIds, { profile, careerId, priorities }),
    [selectedIds, profile, careerId, priorities],
  );
  const ranked = rankPaths(paths);
  const best = ranked[0] ?? null;
  const whyPath = paths.find((p) => p.id === whyId) ?? null;

  const maxCost = Math.max(...paths.map((p) => p.estimatedCost));

  return (
    <ForkShell>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Compare</p>
        <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">Your futures, side by side</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick two to four paths. Everything below is computed from your {profile.creditsCompleted} completed credits and
          the verified institutional dataset.
        </p>
      </header>

      <div className="mt-4 flex flex-wrap gap-2">
        {PATHS.map((spec) => {
          const active = selectedIds.includes(spec.id);
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => (comparison.length ? toggleComparison(spec.id) : setComparison([...selectedIds, spec.id]))}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                active
                  ? "border-primary bg-primary/10 font-medium text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {spec.name}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        {paths.map((path) => (
          <article
            key={path.id}
            className={cn(
              "flex flex-col rounded-2xl border bg-card p-3",
              best?.id === path.id ? "border-primary shadow-node" : "border-border shadow-lift",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Path {path.letter}
              </span>
              {best?.id === path.id && (
                <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wide text-gold-foreground">
                  Best fit
                </span>
              )}
            </div>
            <h2 className="mt-1 font-display text-lg leading-tight">{path.name}</h2>

            <dl className="mt-2 space-y-0.5 text-xs">
              <Row label="Completion" value={path.estimatedCompletionDate} />
              <Row label="Semesters" value={`${path.semesters}${path.summerSessions ? ` + ${path.summerSessions} summer` : ""}`} />
              <Row label="Credits" value={`${path.creditsRemaining}`} />
              <Row
                label="Additional"
                value={path.additionalCredits === 0 ? "None" : `${path.additionalCredits > 0 ? "+" : "−"}${Math.abs(path.additionalCredits)}`}
              />
              <Row label="Tuition" value={`${formatCurrency(path.estimatedCost)}`} />
              <Row label="Vs. current" value={path.isBaseline ? "Baseline" : formatDelta(path.additionalCost)} />
              <Row label="Prereqs" value={path.prerequisiteCount ? path.prerequisiteCourses.join(", ") : "None"} />
              <Row label="Avg. load" value={`${path.averageLoad} credits`} />
            </dl>

            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-navy transition-[width] duration-700"
                  style={{ width: `${(path.estimatedCost / maxCost) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between pt-1">
              <RiskTag risk={path.risk} factors={path.riskFactors} />
            </div>

            <div className="mt-2">
              <p className="text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">Opportunities</p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {path.opportunities.slice(0, 3).map((o) => (
                  <li key={o} className="flex gap-2">
                    <span className="mt-1 size-1 shrink-0 rounded-full bg-gold" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="gap-1"
                onClick={() => {
                  choosePath(path.id, {
                    scenarioId: scenarioId ?? path.id,
                    question: scenarioQuestion ?? path.name,
                    pathName: path.name,
                    program: path.program,
                    snapshot: path,
                  });
                  void navigate({ to: "/path" });
                }}
              >
                See full path <ArrowRight className="size-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setWhyId(path.id)}>
                Why this path?
              </Button>
            </div>
          </article>
        ))}
      </div>

      <WhyPathSheet path={whyPath} open={Boolean(whyId)} onOpenChange={(open) => !open && setWhyId(null)} />
    </ForkShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-0.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{value}</dd>
    </div>
  );
}


export type { SimulatedPath };
