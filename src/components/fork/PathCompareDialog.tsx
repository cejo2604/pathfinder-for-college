import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDelta, type SimulatedPath } from "@/lib/fork/engine";

/**
 * Head-to-head frame: the student's current path next to the one option they
 * clicked — nothing else. Every number comes from the deterministic engine.
 */
export function PathCompareDialog({
  open,
  onOpenChange,
  baseline,
  option,
  onAccept,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseline: SimulatedPath | undefined;
  option: SimulatedPath | undefined;
  onAccept: (option: SimulatedPath) => void;
}) {
  if (!baseline || !option) return null;

  const rows: { label: string; a: string; b: string }[] = [
    { label: "Program", a: baseline.program, b: option.program },
    { label: "Credits remaining", a: `${baseline.creditsRemaining}`, b: `${option.creditsRemaining}` },
    { label: "Estimated completion", a: baseline.estimatedCompletionDate, b: option.estimatedCompletionDate },
    { label: "Semesters", a: `${baseline.semesters}`, b: `${option.semesters}` },
    { label: "Estimated tuition", a: formatCurrency(baseline.estimatedCost), b: formatCurrency(option.estimatedCost) },
    { label: "Tuition change", a: "Baseline", b: formatDelta(option.additionalCost) },
    
    { label: "Risk", a: baseline.risk, b: option.risk },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{option.name}</DialogTitle>
          <DialogDescription>
            Compared against your current path only. Fork estimate — accepting makes this your plan.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-3 gap-2 bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <span />
            <span>Current</span>
            <span className="text-primary">This option</span>
          </div>
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-3 items-baseline gap-2 border-t border-border px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="tabular-nums">{row.a}</span>
              <span className={cn("font-medium tabular-nums", row.a !== row.b && "text-primary")}>{row.b}</span>
            </div>
          ))}
        </div>

        {(() => {
          const baselineCourses = new Set(baseline.terms.flatMap((t) => t.courses ?? []));
          const added = Array.from(
            new Set(option.terms.flatMap((t) => t.courses ?? []).filter((c) => c !== "Elective")),
          ).filter((c) => !baselineCourses.has(c));
          if (added.length === 0) return null;
          return (
            <div className="rounded-2xl border border-border px-4 py-3 text-sm">
              <p className="font-medium">Courses this adds ({added.length})</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                These are the catalog courses driving the credits, tuition and career fit above.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {added.map((code) => (
                  <span key={code} className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {option.tradeoffs.length > 0 && (
          <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
            <p className="font-medium">Tradeoffs</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
              {option.tradeoffs.slice(0, 3).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" className="gap-1.5" onClick={() => onOpenChange(false)}>
            <X className="size-4" /> Cancel
          </Button>
          <Button className="gap-1.5" onClick={() => onAccept(option)}>
            <Check className="size-4" /> Accept this path
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
