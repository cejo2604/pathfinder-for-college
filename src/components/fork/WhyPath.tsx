import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";

import { PlanningEstimateNote } from "@/components/fork/ForkShell";
import { ScorePanel } from "@/components/fork/Scores";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Priority, StudentProfile } from "@/lib/fork/data";
import { interpretPath } from "@/lib/fork/ai.functions";
import { evidenceFor, pathFactSheet, whyThisPath, type SimulatedPath } from "@/lib/fork/engine";
import { useFork, useForkProfile } from "@/lib/fork/state";


const KIND_META = {
  verified: {
    title: "Verified",
    blurb: "Directly available from the institutional dataset.",
    className: "bg-mint/15 text-mint-foreground",
  },
  estimated: {
    title: "Estimated",
    blurb: "Calculated by Fork from the assumptions below.",
    className: "bg-gold/20 text-gold-foreground",
  },
  unknown: {
    title: "Unknown",
    blurb: "Requires confirmation from your institution.",
    className: "bg-muted text-muted-foreground",
  },
} as const;

export function AssumptionsPanel({
  path,
  profile,
  compact = false,
}: {
  path: SimulatedPath;
  profile: StudentProfile;
  compact?: boolean;
}) {
  const evidence = evidenceFor(path, profile);

  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5", compact && "p-4")}>
      <h4 className="font-display text-lg">How we calculated this path</h4>
      <p className="mt-1 text-sm text-muted-foreground">
        Every figure below is either read from the dataset or computed by Fork&apos;s simulation engine. Nothing here is
        generated text.
      </p>

      <div className="mt-4 space-y-4">
        {(["verified", "estimated", "unknown"] as const).map((kind) => {
          const rows = evidence.filter((e) => e.kind === kind);
          if (!rows.length) return null;
          const meta = KIND_META[kind];
          return (
            <div key={kind}>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                    meta.className,
                  )}
                >
                  {meta.title}
                </span>
                <span className="text-xs text-muted-foreground">{meta.blurb}</span>
              </div>
              <dl className="mt-2 divide-y divide-border/70 text-sm">
                {rows.map((row) => (
                  <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-2 py-1.5">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="font-medium tabular-nums">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      <PlanningEstimateNote className="mt-4 border-t border-border pt-3" />
    </section>
  );
}

export function WhyPathSheet({
  path,
  open,
  onOpenChange,
}: {
  path: SimulatedPath | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { priorities } = useFork();
  const profile = useForkProfile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {!path && <p data-debug="nopath">DEBUG no path</p>}
        {path && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="font-display text-2xl">Why Fork surfaces {path.name}</SheetTitle>
              <SheetDescription>
                Reasoning built only from your profile and the simulation engine&apos;s output.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 px-4 pb-8">
              <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed">
                {whyThisPath(path, profile, priorities).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              <AiReading path={path} profile={profile} priorities={priorities} open={open} />

              <ScorePanel scores={path.scores} />
              <AssumptionsPanel path={path} profile={profile} compact />
            </div>

          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * The only AI surface in the reasoning drawer: it interprets figures the
 * deterministic engine already produced. Failures degrade silently — the
 * engine's own explanation above is always present.
 */
function AiReading({
  path,
  profile,
  priorities,
  open,
}: {
  path: SimulatedPath;
  profile: StudentProfile;
  priorities: Priority[];
  open: boolean;
}) {
  const interpret = useServerFn(interpretPath);
  const facts = pathFactSheet(path, profile, priorities);

  const { data, isPending, isError } = useQuery({
    queryKey: ["interpret-path", path.id, facts],
    enabled: open,
    staleTime: Infinity,
    retry: false,
    queryFn: () =>
      interpret({ data: { facts, question: `Should I consider ${path.name}?` } }),
  });

  const paragraphs = data?.paragraphs ?? [];
  const failed = isError || Boolean(data?.error) || (!isPending && paragraphs.length === 0);

  return (
    <section className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h4 className="font-display text-lg">In plain language</h4>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Fork&apos;s AI reads the numbers above — it never calculates them.
      </p>

      {isPending && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" /> Interpreting the tradeoffs…
        </p>
      )}

      {failed && !isPending && (
        <p className="mt-3 text-sm text-muted-foreground">
          The written summary is unavailable right now. Every figure and the reasoning above still comes straight from
          the simulation engine.
        </p>
      )}

      {!isPending && paragraphs.length > 0 && (
        <div className="mt-3 space-y-2.5 text-sm leading-relaxed">
          {paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      )}
    </section>
  );
}
