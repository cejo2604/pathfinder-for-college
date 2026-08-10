import { createFileRoute } from "@tanstack/react-router";

import { ForkShell } from "@/components/fork/ForkShell";
import { cn } from "@/lib/utils";
import { CAREERS, SKILL_LABELS, courseByCode } from "@/lib/fork/data";
import { useFork } from "@/lib/fork/state";

export const Route = createFileRoute("/career")({
  head: () => ({
    meta: [
      { title: "Career reference — Fork" },
      {
        name: "description",
        content:
          "Skills, coursework, internship and portfolio ideas behind each career direction Fork uses to score your paths.",
      },
      { property: "og:title", content: "Career reference — Fork" },
      {
        property: "og:description",
        content: "What each career direction typically asks for, and which paths may be worth exploring.",
      },
    ],
  }),
  component: CareerPage,
});

function CareerPage() {
  const { careerId, setCareerId } = useFork();

  return (
    <ForkShell>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Career reference</p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Paths worth exploring</h1>
        <p className="mt-3 text-muted-foreground">
          Fork does not tell you what to become. It shows what each direction typically asks for, and scores your
          academic paths against the one you pick.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap gap-2">
        {CAREERS.map((career) => (
          <button
            key={career.id}
            type="button"
            onClick={() => setCareerId(career.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              careerId === career.id
                ? "border-primary bg-primary/10 font-medium text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {career.title}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {CAREERS.filter((c) => c.id === careerId).map((career) => (
          <article key={career.id} className="rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{career.industry}</p>
            <h2 className="mt-1 font-display text-3xl">{career.title}</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">{career.description}</p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  What Fork weighs for this direction
                </h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {career.skillWeights.map(({ skill, weight }) => (
                    <li key={skill}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span>{SKILL_LABELS[skill]}</span>
                        <span className="tabular-nums text-muted-foreground">{Math.round(weight * 100)}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${weight * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-5">
                <Block title="Relevant majors" items={career.relevantMajors} />
                <Block title="Relevant minors" items={career.relevantMinors} />
                <Block
                  title="Recommended coursework"
                  items={career.coursework.map((code) => {
                    const course = courseByCode(code);
                    return course ? `${course.code} — ${course.title}` : code;
                  })}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Block title="Internship ideas" items={career.internshipIdeas} />
              <Block title="Portfolio ideas" items={career.portfolioIdeas} />
              <Block title="Entry-level roles" items={career.entryRoles} />
              <Block title="Adjacent careers" items={career.adjacentCareers} />
            </div>

            <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
              Based on your goals and preferences, these paths may be worth exploring. Fork does not predict employment
              outcomes or salaries.
            </p>
          </article>
        ))}
      </div>
    </ForkShell>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</h3>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-mint" />
            <span className="leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
