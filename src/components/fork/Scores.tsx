import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RiskLevel, ScoreBreakdown } from "@/lib/fork/engine";

export const SCORE_TOOLTIP =
  "This is a comparison score based on the student's stated goal, academic path, skills and priorities. It is not a prediction or guarantee of career success.";

export function EstimateBadge({ label = "Fork estimate" }: { label?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center gap-1 text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
          {label}
          <Info className="size-3" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">{SCORE_TOOLTIP}</TooltipContent>
    </Tooltip>
  );
}

export function ScoreBar({
  label,
  value,
  tone = "primary",
  animate = true,
}: {
  label: string;
  value: number;
  tone?: "primary" | "mint" | "gold" | "navy";
  animate?: boolean;
}) {
  const toneClass = {
    primary: "bg-primary",
    mint: "bg-mint",
    gold: "bg-gold",
    navy: "bg-navy",
  }[tone];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">{value}</span> / 100
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", toneClass)}
          style={{ width: animate ? `${value}%` : `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ScorePanel({ scores }: { scores: ScoreBreakdown }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Tradeoff scores</h4>
        <EstimateBadge />
      </div>
      <ScoreBar label="Career fit" value={scores.careerFit} />
      <ScoreBar label="Cost efficiency" value={scores.costEfficiency} tone="mint" />
      <ScoreBar label="Graduation efficiency" value={scores.graduationEfficiency} tone="mint" />
      <ScoreBar label="Flexibility" value={scores.flexibility} tone="gold" />
      <ScoreBar label="Overall fit" value={scores.overallFit} tone="navy" />
    </div>
  );
}

const RISK_STYLES: Record<RiskLevel, string> = {
  Low: "bg-mint/20 text-mint-foreground",
  Moderate: "bg-gold/20 text-gold-foreground",
  "Medium/High": "bg-gold/30 text-gold-foreground",
  High: "bg-destructive/15 text-destructive",
};

export function RiskTag({ risk, factors }: { risk: RiskLevel; factors: string[] }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex cursor-help items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            RISK_STYLES[risk],
          )}
        >
          {risk} risk
          <Info className="size-3 opacity-70" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">
        <p className="mb-1 font-medium">What drives this rating</p>
        <ul className="list-disc space-y-0.5 pl-4">
          {factors.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
