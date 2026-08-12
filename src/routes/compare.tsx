import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

import { PriorityPanel } from "@/components/fork/Decision";
import { ForkShell } from "@/components/fork/ForkShell";
import { EstimateBadge, RiskTag, ScoreBar } from "@/components/fork/Scores";
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
          "Put two to four possible futures side by side: graduation date, credits, tuition, career fit, risk and flexibility.",
      },
      { property: "og:title", content: "Compare your possible futures — Fork" },
      { property: "og:description", content: "Graduation date, cost, coursework and career fit, side by side." },
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
    setPriorities,
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
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Your futures, side by side</h1>
        <p className="mt-3 text-muted-foreground">
          Pick two to four paths. Everything below is computed from your {profile.creditsCompleted} completed credits and
          the demo institutional dataset.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        {PATHS.map((spec) => {
          const active = selectedIds.includes(spec.id);
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => (comparison.length ? toggleComparison(spec.id) : setComparison([...selectedIds, spec.id]))}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
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

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {paths.map((path) => (
          <article
            key={path.id}
            className={cn(
              "rounded-2xl border bg-card p-5",
              best?.id === path.id ? "border-primary shadow-node" : "border-border shadow-lift",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Path {path.letter}
              </span>
              {best?.id === path.id && (
                <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-gold-foreground">
                  Best fit
                </span>
              )}
            </div>
            <h2 className="mt-1.5 font-display text-xl leading-tight">{path.name}</h2>

            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Estimated completion" value={path.estimatedCompletionDate} />
              <Row label="Semesters remaining" value={`${path.semesters}${path.summerSessions ? ` + ${path.summerSessions} summer` : ""}`} />
              <Row label="Credits remaining" value={`${path.creditsRemaining}`} />
              <Row
                label="Additional credits"
                value={path.additionalCredits === 0 ? "None" : `${path.additionalCredits > 0 ? "+" : "−"}${Math.abs(path.additionalCredits)}`}
              />
              <Row
                label="Estimated tuition"
                value={`${formatCurrency(path.estimatedCost)} (${formatCurrency(path.tuitionPerCredit)}/credit${path.pricedAtOutOfInstitutionRate ? ", out-of-institution" : ""})`}
              />
              <Row label="Vs. current plan" value={path.isBaseline ? "Baseline" : formatDelta(path.additionalCost)} />
              <Row label="Prerequisites" value={path.prerequisiteCount ? path.prerequisiteCourses.join(", ") : "None"} />
              <Row label="Avg. term load" value={`${path.averageLoad} credits`} />
            </dl>

            <div className="mt-4">
              <p className="mb-1 text-xs uppercase tracking-[0.1em] text-muted-foreground">Estimated tuition</p>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-navy transition-[width] duration-700"
                  style={{ width: `${(path.estimatedCost / maxCost) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <ScoreBar label="Career fit" value={path.scores.careerFit} />
              <ScoreBar label="Cost efficiency" value={path.scores.costEfficiency} tone="mint" />
              <ScoreBar label="Graduation efficiency" value={path.scores.graduationEfficiency} tone="mint" />
              <ScoreBar label="Flexibility" value={path.scores.flexibility} tone="gold" />
              <ScoreBar label="Overall fit" value={path.scores.overallFit} tone="navy" />
              <div className="flex items-center justify-between">
                <RiskTag risk={path.risk} factors={path.riskFactors} />
                <EstimateBadge />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Opportunities this opens</p>
              <ul className="mt-1.5 space-y-1 text-sm">
                {path.opportunities.map((o) => (
                  <li key={o} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                className="gap-1.5"
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
                See my full path <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" onClick={() => setWhyId(path.id)}>
                Why this path?
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <PriorityPanel priorities={priorities} onChange={setPriorities} topPathName={best?.name} />
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-xl">What would change your decision?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Current ranking by overall fit, recomputed live from the priorities on the left.
          </p>
          <ol className="mt-4 space-y-2">
            {ranked.map((path, i) => (
              <li key={path.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm">
                <span className="grid size-6 place-items-center rounded-md bg-muted text-xs font-semibold">{i + 1}</span>
                <span className="flex-1">{path.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  <span className="font-semibold text-foreground">{path.scores.overallFit}</span> / 100
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <WhyPathSheet path={whyPath} open={Boolean(whyId)} onOpenChange={(open) => !open && setWhyId(null)} />
    </ForkShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-1.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{value}</dd>
    </div>
  );
}

export type { SimulatedPath };
