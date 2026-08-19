import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { BranchTree } from "@/components/fork/BranchTree";
import { CostOfDecision } from "@/components/fork/Decision";
import { ForkShell } from "@/components/fork/ForkShell";
import { PathCard } from "@/components/fork/PathCard";
import { AssumptionsPanel, WhyPathSheet } from "@/components/fork/WhyPath";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SCENARIOS,
  UNSUPPORTED_INSTITUTION_MESSAGE,
  rankPaths,
  scenarioById,
  simulate,
  validateInstitution,
  type Scenario,
  type SimulatedPath,
} from "@/lib/fork/engine";
import { programById } from "@/lib/fork/data";
import { programPathId, selectableMajors, selectableMinors } from "@/lib/fork/program-paths";
import { useFork, useForkProfile } from "@/lib/fork/state";

export const Route = createFileRoute("/what-if")({
  // `?q=` lets other screens (like a waitlist warning) pre-fill the question.
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" ? { q: search["q"] as string } : {},
  head: () => ({
    meta: [
      { title: "What If? — Fork" },
      {
        name: "description",
        content:
          "Ask what happens if you switch majors, add a minor, graduate early or change careers. Fork branches your future and compares every consequence.",
      },
      { property: "og:title", content: "What If? — the Fork simulator" },
      {
        property: "og:description",
        content: "Simulate an academic decision and see graduation date, cost, credits and career fit change.",
      },
    ],
  }),
  component: WhatIfPage,
});

type Phase = "idle" | "analyzing" | "results";

type ScenarioOption = {
  id: string;
  label: string;
  question: string;
  run: () => void;
};

function WhatIfPage() {
  const profile = useForkProfile();
  const navigate = useNavigate();
  const { q: prefilled } = Route.useSearch();

  const {
    careerId,
    priorities,
    scenarioId,
    scenarioQuestion,
    runScenario,
    comparison,
    toggleComparison,
    setComparison,
    choosePath,
    hydrated,
  } = useFork();

  const [phase, setPhase] = useState<Phase>("idle");
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealBest, setRevealBest] = useState(false);
  const [whyId, setWhyId] = useState<string | null>(null);
  // One selection per dropdown — students can combine a scenario, a major
  // switch and a minor, then simulate every branch side by side.
  const [pickedScenarioId, setPickedScenarioId] = useState<string>("");
  const [pickedMajorId, setPickedMajorId] = useState<string>("");
  const [pickedMinorId, setPickedMinorId] = useState<string>("");
  const [customScenario, setCustomScenario] = useState<Scenario | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const start = (id: string, question: string, custom?: Scenario | null) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setCustomScenario(custom ?? null);
    setActiveScenarioId(id);
    setPhase("analyzing");
    setSelectedId(null);
    setRevealBest(false);
    runScenario(id, question);
    timers.current.push(setTimeout(() => setPhase("results"), 950));
    timers.current.push(setTimeout(() => setRevealBest(true), 2400));
  };

  const hasSelection = Boolean(pickedScenarioId || pickedMajorId || pickedMinorId);

  const simulateSelected = () => {
    const pathIds: string[] = ["baseline"];
    const labels: string[] = [];

    const scenario = pickedScenarioId ? scenarioById(pickedScenarioId) : null;
    if (scenario) {
      scenario.pathIds.forEach((id) => {
        if (!pathIds.includes(id)) pathIds.push(id);
      });
      labels.push(scenario.chip);
    }

    if (pickedMajorId) {
      const program = programById(pickedMajorId);
      if (program) {
        const pathId = programPathId("switch", pickedMajorId);
        if (!pathIds.includes(pathId)) pathIds.push(pathId);
        labels.push(`switch to ${program.name}`);
      }
    }

    if (pickedMinorId) {
      const program = programById(pickedMinorId);
      if (program) {
        const pathId = programPathId("minor", pickedMinorId);
        if (!pathIds.includes(pathId)) pathIds.push(pathId);
        labels.push(`add the ${program.name}`);
      }
    }

    if (pathIds.length < 2) return;

    // A single scenario keeps its own framing; combinations get a merged one.
    if (labels.length === 1 && scenario) {
      start(scenario.id, scenario.question);
      return;
    }

    const question = `What if I ${labels.join(" or ")}?`;
    const id = `combo:${pathIds.slice(1).join("+")}`;
    start(id, question, {
      id,
      question,
      chip: labels.join(" · "),
      pathIds,
      keywords: [],
      framing: "Your current program next to every option you selected, priced from your own record.",
    });
  };

  // A scenario chosen elsewhere (My Path quick chips) runs on arrival.
  useEffect(() => {
    if (!hydrated || activeScenarioId || phase !== "idle" || !scenarioId || prefilled) return;

    const scenario = scenarioById(scenarioId);
    if (scenario) start(scenario.id, scenarioQuestion ?? scenario.question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, scenarioId, scenarioQuestion]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const scenario = customScenario ?? (activeScenarioId ? scenarioById(activeScenarioId) : null);

  const institution = useMemo(() => validateInstitution(profile), [profile]);

  const paths = useMemo<SimulatedPath[]>(() => {
    if (!scenario) return [];
    const result = simulate(scenario.pathIds, { profile, careerId, priorities });
    return result.status === "ok" ? result.paths : [];
  }, [scenario, profile, careerId, priorities]);

  const ranked = useMemo(() => rankPaths(paths), [paths]);
  const best = ranked[0] ?? null;
  const selected = paths.find((p) => p.id === selectedId) ?? null;
  const whyPath = paths.find((p) => p.id === whyId) ?? null;

  const cheapest = useMemo(
    () => [...paths].sort((a, b) => a.estimatedCost - b.estimatedCost)[0] ?? null,
    [paths],
  );
  const alternative = selected && cheapest && selected.id !== cheapest.id ? cheapest : (ranked[1] ?? null);

  return (
    <ForkShell>
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">The simulator</p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">What if…</h1>
        <p className="mt-3 text-muted-foreground">
          Pick a supported scenario. Fork branches your future and computes what each option costs.
        </p>
      </div>

      {institution.status === "unsupported" && (
        <div className="mx-auto mt-8 max-w-xl rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center text-sm">
          <p className="font-medium text-destructive">Simulation unavailable</p>
          <p className="mt-2 text-muted-foreground">{UNSUPPORTED_INSTITUTION_MESSAGE}</p>
        </div>
      )}

      {institution.status === "supported" && phase === "idle" && (
        <p className="mx-auto mt-8 max-w-md text-center text-sm text-muted-foreground">
          Pick a scenario below to branch {profile.name.split(" ")[0]}&apos;s future.
        </p>
      )}

      {phase === "analyzing" && (
        <div className="mt-12 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm">Analyzing your options…</p>
        </div>
      )}

      {phase === "results" && scenario && (
        <div className="mt-10 space-y-10">
          <section>
            <div className="mb-6 text-center">
              <h2 className="font-display text-2xl">{scenario.question}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{scenario.framing}</p>
            </div>

            <BranchTree
              paths={paths}
              currentLabel={`${profile.major} · ${profile.year}`}
              currentSub={`${profile.creditsCompleted} credits · ${profile.graduationTarget} target`}
              selectedId={selectedId}
              bestId={revealBest ? best?.id : null}
              onSelect={setSelectedId}
              animate
            />
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">Your possible futures</h2>
                <p className="text-sm text-muted-foreground">
                  Fork shows every alternative first{revealBest ? ", then highlights the best fit for your priorities." : "…"}
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-1"
                disabled={comparison.filter((id) => paths.some((p) => p.id === id)).length === 0}
                onClick={() => {
                  const selectedIds = comparison.filter((id) => paths.some((p) => p.id === id));
                  if (selectedIds.length === 0) return;
                  setComparison(selectedIds);
                  void navigate({ to: "/compare" });
                }}
              >
                Compare selected paths <ArrowRight className="size-4" />
              </Button>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {paths.map((path, i) => (
                <PathCard
                  key={path.id}
                  path={path}
                  index={i}
                  animate
                  selected={selectedId === path.id}
                  best={revealBest && best?.id === path.id}
                  inComparison={comparison.includes(path.id)}
                  onSelect={setSelectedId}
                  onToggleComparison={toggleComparison}
                  onWhy={setWhyId}
                />
              ))}
            </div>
          </section>

          {selected && alternative && (
            <section className="space-y-6">
              <CostOfDecision chosen={selected} alternative={alternative} />
              <div className="grid gap-6 lg:grid-cols-2">
                <AssumptionsPanel path={selected} profile={profile} />
                <div className="space-y-6">
                  
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="font-display text-xl">Ready to commit to {selected.name}?</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Fork turns this path into a semester-by-semester plan with your next three moves.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        className="gap-2"
                        onClick={() => {
                          choosePath(selected.id, {
                            scenarioId: scenarioId ?? selected.id,
                            question: scenarioQuestion ?? selected.name,
                            pathName: selected.name,
                            program: selected.program,
                            snapshot: selected,
                          });
                          void navigate({ to: "/path" });
                        }}
                      >
                        See my full path <ArrowRight className="size-4" />
                      </Button>
                      <Button variant="outline" onClick={() => setWhyId(selected.id)}>
                        Why this path?
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {!selected && (
            <p className="text-center text-sm text-muted-foreground">
              Select a branch or a card above to see the cost of that decision.
            </p>
          )}
        </div>
      )}

      <div className="mx-auto mt-8 max-w-3xl">
        <div className="border-t border-border pt-6">
          <div className="mx-auto flex max-w-xl flex-col gap-3">
            <Select value={pickedScenarioId} onValueChange={setPickedScenarioId}>
              <SelectTrigger className="h-12 rounded-full border-border bg-card px-4 text-sm shadow-sm">
                <SelectValue placeholder="Choose a scenario" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-card">
                {SCENARIOS.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="rounded-lg text-sm">
                    {s.chip}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={pickedMajorId} onValueChange={setPickedMajorId}>
              <SelectTrigger className="h-12 rounded-full border-border bg-card px-4 text-sm shadow-sm">
                <SelectValue placeholder="Switch my major" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-card">
                {selectableMajors(profile).map((p) => (
                  <SelectItem key={p.id} value={p.id} className="rounded-lg text-sm">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={pickedMinorId} onValueChange={setPickedMinorId}>
              <SelectTrigger className="h-12 rounded-full border-border bg-card px-4 text-sm shadow-sm">
                <SelectValue placeholder="Add a minor" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-card">
                {selectableMinors(profile).map((p) => (
                  <SelectItem key={p.id} value={p.id} className="rounded-lg text-sm">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-full px-7"
                onClick={simulateSelected}
                disabled={!hasSelection}
              >
                Simulate
              </Button>
              {hasSelection && (
                <Button
                  variant="ghost"
                  size="lg"
                  className="h-12 rounded-full px-5 text-sm"
                  onClick={() => {
                    setPickedScenarioId("");
                    setPickedMajorId("");
                    setPickedMinorId("");
                  }}
                >
                  Clear selections
                </Button>
              )}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Combine any of the three — Fork simulates every option you pick against your current path.
          </p>
        </div>
      </div>

      <WhyPathSheet path={whyPath} open={Boolean(whyId)} onOpenChange={(open) => !open && setWhyId(null)} />
    </ForkShell>
  );
}
