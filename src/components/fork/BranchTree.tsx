import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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

type Geometry = {
  width: number;
  height: number;
  start: { x: number; y: number };
  ends: { id: string; x: number; y: number }[];
};

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

  const wrapRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const [geo, setGeo] = useState<Geometry | null>(null);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const root = rootRef.current;
    if (!wrap || !root) return;
    const wrapBox = wrap.getBoundingClientRect();
    // Below md the cards stack, so the SVG connectors are hidden entirely.
    const stacked = window.matchMedia("(max-width: 767px)").matches;
    if (stacked) {
      setGeo(null);
      return;
    }
    const rootBox = root.getBoundingClientRect();
    const ends: Geometry["ends"] = [];
    for (const path of paths) {
      const el = cardRefs.current[path.id];
      if (!el) continue;
      const box = el.getBoundingClientRect();
      ends.push({
        id: path.id,
        x: box.left - wrapBox.left + box.width / 2,
        y: box.top - wrapBox.top,
      });
    }
    setGeo({
      width: wrapBox.width,
      height: wrapBox.height,
      start: {
        x: rootBox.left - wrapBox.left + rootBox.width / 2,
        y: rootBox.bottom - wrapBox.top,
      },
      ends,
    });
  }, [paths]);

  useLayoutEffect(() => {
    measure();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(() => measure());
    observer.observe(wrap);
    if (rootRef.current) observer.observe(rootRef.current);
    for (const el of Object.values(cardRefs.current)) if (el) observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Connectors: desktop only, measured from the real node positions */}
      {geo && geo.ends.length > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full md:block"
          width={geo.width}
          height={geo.height}
          viewBox={`0 0 ${geo.width} ${geo.height}`}
          aria-hidden="true"
        >
          {geo.ends.map((end, i) => {
            const selected = selectedId === end.id;
            const midY = geo.start.y + (end.y - geo.start.y) * 0.55;
            return (
              <path
                key={end.id}
                d={`M ${geo.start.x} ${geo.start.y} C ${geo.start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`}
                fill="none"
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
      )}

      {/* Root node */}
      <div className="relative z-10 flex justify-center">
        <div
          ref={rootRef}
          className="rounded-2xl bg-navy px-6 py-4 text-center text-navy-foreground shadow-node"
        >
          <p className="text-[0.7rem] uppercase tracking-[0.18em] opacity-70">You are here</p>
          <p className="font-display text-xl leading-tight">{currentLabel}</p>
          <p className="text-xs opacity-80">{currentSub}</p>
        </div>
      </div>

      {/* Branch nodes */}
      <div
        className={cn(
          "relative z-10 mt-4 grid gap-4 md:mt-20",
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
            nodeRef={(el) => {
              cardRefs.current[path.id] = el;
            }}
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
