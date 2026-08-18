import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, type SimulatedPath } from "@/lib/fork/engine";
import { useCountUp } from "@/lib/fork/state";

/** Students who ask their OS for less motion get the tree without animation. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

interface BranchTreeProps {
  paths: SimulatedPath[];
  currentLabel: string;
  currentSub: string;
  selectedId: string | null;
  bestId?: string | null | undefined;
  animate?: boolean;
  onSelect: (id: string) => void;
}

export function BranchTree({
  paths,
  currentLabel,
  currentSub,
  selectedId,
  bestId,
  animate: animateProp = true,
  onSelect,
}: BranchTreeProps) {
  const animate = animateProp && !usePrefersReducedMotion();
  const n = Math.max(paths.length, 1);


  return (
    <div className="w-full">
      {/* Root node */}
      <div className="flex justify-center">
        <div className="rounded-2xl bg-navy px-6 py-4 text-center text-navy-foreground shadow-node">
          <p className="text-[0.7rem] uppercase tracking-[0.18em] opacity-70">You are here</p>
          <p className="font-display text-xl leading-tight">{currentLabel}</p>
          <p className="text-xs opacity-80">{currentSub}</p>
        </div>
      </div>

      {/* Connectors: desktop only */}
      <svg
        className="hidden h-20 w-full md:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {paths.map((path, i) => {
          const x = ((i + 0.5) * 100) / n;
          const selected = selectedId === path.id;
          return (
            <path
              key={path.id}
              d={`M 50 0 C 50 55, ${x} 45, ${x} 100`}
              fill="none"
              vectorEffect="non-scaling-stroke"
              strokeWidth={selected ? 2.5 : 1.5}
              stroke={selected ? "var(--primary)" : "var(--border)"}
              pathLength={1}
              style={
                animate
                  ? ({
                      strokeDasharray: 1,
                      ["--fork-len" as string]: "1",
                      animation: `fork-grow .65s cubic-bezier(.22,1,.36,1) ${0.1 + i * 0.12}s both`,
                    } as React.CSSProperties)
                  : undefined
              }
            />
          );
        })}
      </svg>

      {/* Branch nodes */}
      <div
        className={cn(
          "mt-4 grid gap-4 md:mt-0",
          n === 2 && "md:grid-cols-2",
          n === 3 && "md:grid-cols-3",
          n >= 4 && "md:grid-cols-4",
        )}
      >
        {paths.map((path, i) => (
          <BranchNode
            key={path.id}
            path={path}
            index={i}
            animate={animate}
            selected={selectedId === path.id}
            best={bestId === path.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function BranchNode({
  path,
  index,
  animate,
  selected,
  best,
  onSelect,
}: {
  path: SimulatedPath;
  index: number;
  animate: boolean;
  selected: boolean;
  best: boolean;
  onSelect: (id: string) => void;
}) {
  const cost = useCountUp(path.estimatedCost, animate, 800);

  return (
    <button
      type="button"
      onClick={() => onSelect(path.id)}
      style={animate ? { animationDelay: `${0.25 + index * 0.12}s` } : undefined}
      className={cn(
        // The vertical rail on mobile replaces the SVG connectors.
        "relative w-full rounded-2xl border bg-card p-4 text-left transition-all",
        "before:absolute before:-top-4 before:left-6 before:h-4 before:w-px before:bg-border md:before:hidden",
        selected
          ? "border-primary shadow-node ring-2 ring-primary/25"
          : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift",
        animate && "animate-fork-rise",
      )}
      aria-pressed={selected}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid size-6 place-items-center rounded-md text-[0.7rem] font-semibold",
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {path.letter}
        </span>
        {best && (
          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-gold-foreground">
            Best fit for you
          </span>
        )}
      </div>

      <p className="mt-2 font-display text-lg leading-tight">{path.name}</p>
      <p className="text-xs text-muted-foreground">{path.program}</p>

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted-foreground">Est. completion</dt>
          <dd className="font-medium">{path.estimatedCompletionDate}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted-foreground">Remaining tuition</dt>
          <dd className="font-medium tabular-nums">{formatCurrency(cost)}</dd>
        </div>
      </dl>
    </button>
  );
}
