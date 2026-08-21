import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { GitBranch } from "lucide-react";

import { ForkLogo, PlanningEstimateNote } from "@/components/fork/ForkShell";
import { Button } from "@/components/ui/button";
import { EXAMPLE_PROFILE } from "@/lib/fork/data";
import { formatCurrency, simulatePaths } from "@/lib/fork/engine";
import { useFork } from "@/lib/fork/state";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fork — See where your choices lead" },
      {
        name: "description",
        content:
          "Fork helps college students explore academic and career decisions before they make them. Compare time, cost, coursework, career alignment and tradeoffs across possible futures.",
      },
      { property: "og:title", content: "Fork — See where your choices lead" },
      {
        property: "og:description",
        content: "A decision simulator for college students. Compare your possible futures before you choose.",
      },
    ],
  }),
  component: Landing,
});

const PREVIEW = simulatePaths(["baseline", "switch_cs", "cs_minor"], { profile: EXAMPLE_PROFILE });

function Landing() {
  const { startBlank, session, signOut } = useFork();
  const navigate = useNavigate();

  const startFresh = async () => {
    // Never continue into whatever account happens to be signed in: always start at sign-in.
    if (session) await signOut();
    startBlank();
    void navigate({ to: "/auth" });
  };



  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <ForkLogo />
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <GitBranch className="size-3.5" /> Decision simulator
            </p>
            <h1 className="mt-6 font-display text-5xl leading-[1.03] tracking-tight text-balance-tight sm:text-6xl lg:text-7xl">
              See where your choices lead.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Fork helps you explore academic and career decisions before you make them. Compare time, cost,
              coursework, career alignment and tradeoffs across multiple possible futures.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button size="lg" className="rounded-full px-10 shadow-lift" onClick={startFresh}>
                Start here
              </Button>
              <Button asChild size="default" variant="ghost" className="rounded-full px-4">
                <Link to="/import">Import my academic history</Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Sign in to build your profile. Upload a transcript or degree audit when you want Fork to simulate{" "}
              <Link to="/import" className="font-medium text-foreground underline-offset-4 hover:underline">
                your own
              </Link>{" "}
              academic position — or{" "}
              <Link to="/profile" className="font-medium text-foreground underline-offset-4 hover:underline">
                enter it manually instead
              </Link>
              .
            </p>

          </div>

          {/* Branching graphic */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              One student, three futures
            </p>

            <div className="mt-6 flex justify-center">
              <div className="rounded-2xl bg-navy px-6 py-3 text-center text-navy-foreground shadow-node">
                <p className="text-[0.65rem] uppercase tracking-[0.18em] opacity-70">You</p>
                <p className="font-display text-lg leading-tight">Sophomore</p>
              </div>
            </div>

            <svg className="h-16 w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {[16.7, 50, 83.3].map((x, i) => (
                <path
                  key={x}
                  d={`M 50 0 C 50 55, ${x} 45, ${x} 100`}
                  fill="none"
                  stroke={i === 2 ? "var(--primary)" : "var(--border)"}
                  strokeWidth={i === 2 ? 2.5 : 1.5}
                  vectorEffect="non-scaling-stroke"
                  pathLength={1}
                  style={
                    {
                      strokeDasharray: 1,
                      ["--fork-len" as string]: "1",
                      animation: `fork-grow .8s cubic-bezier(.22,1,.36,1) ${0.2 + i * 0.15}s both`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </svg>

            <div className="grid grid-cols-3 gap-4">
              {PREVIEW.map((path, i) => (
                <div
                  key={path.id}
                  style={{ animationDelay: `${0.45 + i * 0.12}s` }}
                  className="animate-fork-rise rounded-2xl border border-border bg-background px-4 py-4 text-center"
                >
                  <p className="font-display text-sm leading-tight">{path.name}</p>
                  <p className="mt-3 font-display text-base font-semibold tabular-nums">{formatCurrency(path.estimatedCost)}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{path.estimatedCompletionDate}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Same student. Different graduation dates, different costs, different coursework.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-8 border-t border-border pt-10 sm:grid-cols-3">
          {[
            {
              title: "Ask a real question",
              body: "Explore different paths: switch majors, add a minor, graduate early, or minimize cost. Type your own scenario or pick a suggested one.",
            },
            {
              title: "Watch the futures branch",
              body: "Fork computes graduation dates, remaining credits, tuition and coursework for every alternative.",
            },
            {
              title: "Turn a choice into a plan",
              body: "Pick a path and Fork builds a semester-by-semester roadmap with your next three moves.",
            },
          ].map((item, i) => (
            <div key={item.title}>
              <p className="font-display text-3xl text-muted-foreground/60">0{i + 1}</p>
              <h2 className="mt-2 font-display text-xl">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>

        <PlanningEstimateNote className="mt-12 max-w-3xl" />
      </section>
    </div>
  );
}
