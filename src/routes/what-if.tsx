import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { classifyScenario } from "@/lib/fork/ai.functions";


import { BranchTree } from "@/components/fork/BranchTree";
import { CostOfDecision, PriorityPanel } from "@/components/fork/Decision";
import { ForkShell } from "@/components/fork/ForkShell";
import { PathCard } from "@/components/fork/PathCard";
import { AssumptionsPanel, WhyPathSheet } from "@/components/fork/WhyPath";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SCENARIOS, matchScenario, parseScenario, rankPaths, scenarioById, simulatePaths, type SimulatedPath } from "@/lib/fork/engine";
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

function WhatIfPage() {
  const profile = useForkProfile();
  const navigate = useNavigate();
  const { q: prefilled } = Route.useSearch();

  const {
    careerId,
    priorities,
    setPriorities,
    scenarioId,
    scenarioQuestion,
    runScenario,
    comparison,
    toggleComparison,
    setComparison,
    choosePath,
    hydrated,
  } = useFork();

  const classify = useServerFn(classifyScenario);
  const [input, setInput] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealBest, setRevealBest] = useState(false);
  const [whyId, setWhyId] = useState<string | null>(null);
  const [unresolved, setUnresolved] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const start = (id: string, question: string) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setUnresolved(false);
    setActiveScenarioId(id);
    setInput(question);
    setPhase("analyzing");
    setSelectedId(null);
    setRevealBest(false);
    runScenario(id, question);
    timers.current.push(setTimeout(() => setPhase("results"), 950));
    // Alternatives are shown before Fork highlights a best fit.
    timers.current.push(setTimeout(() => setRevealBest(true), 2400));
  };

  // A pre-filled question (e.g. a waitlist warning on the Plan screen) runs first.
  useEffect(() => {
    if (!hydrated || activeScenarioId || phase !== "idle" || !prefilled) return;
    start(parseScenario(prefilled).id, prefilled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, prefilled]);

  // A scenario chosen elsewhere (My Path quick chips) runs on arrival.
  useEffect(() => {
    if (!hydrated || activeScenarioId || phase !== "idle" || !scenarioId || prefilled) return;

    const scenario = scenarioById(scenarioId);
    if (scenario) start(scenario.id, scenarioQuestion ?? scenario.question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, scenarioId, scenarioQuestion]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const scenario = activeScenarioId ? scenarioById(activeScenarioId) : null;

  const paths = useMemo<SimulatedPath[]>(
    () => (scenario ? simulatePaths(scenario.pathIds, { profile, careerId, priorities }) : []),
    [scenario, profile, careerId, priorities],
  );

  const ranked = useMemo(() => rankPaths(paths), [paths]);
  const best = ranked[0] ?? null;
  const selected = paths.find((p) => p.id === selectedId) ?? null;
  const whyPath = paths.find((p) => p.id === whyId) ?? null;

  const cheapest = useMemo(
    () => [...paths].sort((a, b) => a.estimatedCost - b.estimatedCost)[0] ?? null,
    [paths],
  );
  const alternative = selected && cheapest && selected.id !== cheapest.id ? cheapest : (ranked[1] ?? null);

  // AI only routes the sentence to a scenario; the engine owns every number.
  // Unrecognized input is never guessed at — Fork asks for clarification.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const fallback = matchScenario(text);
    setUnresolved(false);
    if (fallback) start(fallback.id, text);
    void classify({ data: { text } })
      .then((result) => {
        if (!result.resolved || !result.scenarioId) {
          if (!fallback) setUnresolved(true);
          return;
        }
        if (result.scenarioId !== fallback?.id) start(result.scenarioId, text);
      })
      .catch(() => undefined);
  };



  return (
    <ForkShell>
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">The simulator</p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">What if…</h1>
        <p className="mt-3 text-muted-foreground">
          Ask about a decision you are actually weighing. Fork branches your future and computes what each option costs.
        </p>
      </div>

      {phase === "idle" && (
        <p className="mx-auto mt-16 max-w-md text-center text-sm text-muted-foreground">
          Pick a scenario below to branch {profile.name.split(" ")[0]}&apos;s future.
        </p>
      )}

      {phase === "analyzing" && (
        <div className="mt-20 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm">Analyzing your options…</p>
        </div>
      )}

      {phase === "results" && scenario && (
        <div className="mt-14 space-y-12">
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
                onClick={() => {
                  setComparison(paths.map((p) => p.id).slice(0, 4));
                  void navigate({ to: "/compare" });
                }}
              >
                Compare these paths <ArrowRight className="size-4" />
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
                  <PriorityPanel priorities={priorities} onChange={setPriorities} topPathName={best?.name} />
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

      {phase === "results" && (
        <p className="mb-2 text-center text-sm text-muted-foreground">
          Ask another question below or pick a quick scenario to keep exploring.
        </p>
      )}

      <div className="mx-auto max-w-3xl">
        <div className="border-t border-border pt-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">What if</p>

          {unresolved && (
            <div
              role="status"
              className="mx-auto mt-4 max-w-md rounded-2xl border border-border bg-card p-4 text-left text-sm"
            >
              <p className="font-medium">Fork could not match that question to a scenario it can simulate.</p>
              <p className="mt-1 text-muted-foreground">
                Rather than guess, pick the closest scenario below — or rephrase your question.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SCENARIOS.map((s) => (
                  <Button key={s.id} variant="outline" size="sm" onClick={() => start(s.id, s.question)}>
                    {s.chip}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What if I switch to Computer Science?"
              aria-label="Describe your what-if scenario"
              className="h-14 rounded-full border-border bg-card px-6 text-base shadow-lift"
            />
            <Button type="submit" size="lg" className="h-14 gap-2 rounded-full px-7">
              <Sparkles className="size-4" /> Simulate
            </Button>
          </form>

          <div className="mt-4 flex flex-col items-center gap-2">
            <Select
              value={activeScenarioId ?? ""}
              onValueChange={(value) => {
                const s = SCENARIOS.find((x) => x.id === value);
                if (s) start(s.id, s.question);
              }}
            >
              <SelectTrigger className="w-full max-w-sm rounded-full border-border bg-card px-4 text-sm shadow-sm">
                <SelectValue placeholder="Choose a quick scenario" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-card">
                {SCENARIOS.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="rounded-lg text-sm">
                    {s.chip}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Or type your own question above and press Simulate.</p>
          </div>
        </div>
      </div>

      <WhyPathSheet path={whyPath} open={Boolean(whyId)} onOpenChange={(open) => !open && setWhyId(null)} />
    </ForkShell>
  );
}
