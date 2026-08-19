import { Info } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/fork/engine";

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


const RISK_STYLES: Record<RiskLevel, string> = {
  Low: "bg-mint/20 text-mint-foreground",
  Moderate: "bg-gold/20 text-gold-foreground",
  Medium: "bg-gold/30 text-gold-foreground",
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
