import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ForkShell } from "@/components/fork/ForkShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CAREERS } from "@/lib/fork/data";
import { selectableMajors, selectableMinors } from "@/lib/fork/program-paths";
import { useFork, useForkProfile } from "@/lib/fork/state";

const NONE = "__none";

export const Route = createFileRoute("/goal")({
  head: () => ({
    meta: [
      { title: "Where do you want to go? — Fork" },
      {
        name: "description",
        content: "Pick a destination or describe it in your own words, and Fork scores every academic path against it.",
      },
      { property: "og:title", content: "Where do you want to go? — Fork" },
      { property: "og:description", content: "Set the destination Fork measures your possible futures against." },
    ],
  }),
  component: GoalPage,
});

const CATEGORIES = [
  "Technology",
  "Healthcare",
  "Healthcare technology",
  "Business",
  "Finance",
  "Law",
  "Education",
  "Research",
  "Engineering",
  "Creative",
  "Public service",
  "Entrepreneurship",
];

const DISCOVERY = [
  {
    question: "Which of these would you rather spend a week doing?",
    options: ["Analyzing a messy dataset", "Working directly with patients", "Running lab experiments"],
  },
  {
    question: "What kind of problem keeps your attention?",
    options: ["Making a system work better", "Understanding how something biological works", "Explaining findings to people"],
  },
  {
    question: "How technical do you want your day to be?",
    options: ["Writing code most days", "A mix of data and people", "Mostly hands-on or in-person"],
  },
] as const;

const DISCOVERY_RESULT = [
  "Healthcare data scientist",
  "Health informatics analyst",
  "Biotechnology research associate",
] as const;

function GoalPage() {
  const profile = useForkProfile();
  const navigate = useNavigate();
  const { setProfile, setCareerId, setTargetPrograms, targetMajorId, targetMinorId } = useFork();
  const majors = useMemo(() => selectableMajors(profile), [profile]);
  const minors = useMemo(() => selectableMinors(profile), [profile]);
  const [majorId, setMajorId] = useState(targetMajorId ?? NONE);
  const [minorId, setMinorId] = useState(targetMinorId ?? NONE);

  useEffect(() => {
    setMajorId(targetMajorId ?? NONE);
    setMinorId(targetMinorId ?? NONE);
  }, [targetMajorId, targetMinorId]);
  const [freeText, setFreeText] = useState(profile.goal);
  const [discovering, setDiscovering] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  const pick = (category: string) => {
    setProfile({ goalCategory: category, goal: `I want to work in ${category.toLowerCase()}.` });
    void navigate({ to: "/home" });
  };

  const suggestion = answers.length === DISCOVERY.length ? DISCOVERY_RESULT[answers[0] ?? 0] : null;

  return (
    <ForkShell>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Goal</p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Where do you want to go?</h1>
        <p className="mt-3 text-muted-foreground">
          Fork scores every path against this destination. You can change it any time — the whole simulation re-runs.
        </p>
        <p className="mt-3 text-sm">
          Current goal: <span className="font-medium">{profile.goalCategory}</span>
        </p>
      </header>

      <section className="mt-8">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => pick(category)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                profile.goalCategory === category
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {category}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDiscovering((v) => !v)}
            className="rounded-full border border-dashed border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            I&apos;m not sure yet
          </button>
        </div>
      </section>

      <section className="mt-8 max-w-2xl rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">Or say it in your own words</h2>
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!freeText.trim()) return;
            setProfile({ goal: freeText.trim(), goalCategory: freeText.trim().replace(/^i want to\s*/i, "") });
            void navigate({ to: "/home" });
          }}
        >
          <Input
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="I want to become a healthcare data scientist."
            aria-label="Describe your goal"
            className="h-12"
          />
          <Button type="submit" size="lg" className="gap-1.5">
            Set goal <ArrowRight className="size-4" />
          </Button>
        </form>
      </section>

      <section className="mt-8 max-w-2xl rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl">Which major or minor are you considering?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm a selection and Fork pre-loads it into the simulation cards on your Plan page.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Major</label>
            <Select
              value={majorId}
              onValueChange={(v) => {
                setMajorId(v);
              }}
            >
              <SelectTrigger className="mt-2" aria-label="Choose a major you are considering">
                <SelectValue placeholder="Choose a major" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No selection</SelectItem>
                {majors.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Minor</label>
            <Select
              value={minorId}
              onValueChange={(v) => {
                setMinorId(v);
              }}
            >
              <SelectTrigger className="mt-2" aria-label="Choose a minor you are considering">
                <SelectValue placeholder="Choose a minor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No selection</SelectItem>
                {minors.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            className="gap-1.5"
            disabled={majorId === NONE && minorId === NONE}
            onClick={() => {
              setTargetPrograms({
                majorId: majorId === NONE ? null : majorId,
                minorId: minorId === NONE ? null : minorId,
              });
              void navigate({ to: "/home" });
            }}
          >
            Confirm selection <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {discovering && (
        <section className="mt-8 max-w-2xl rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Three quick questions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This narrows the field. It is a starting point for exploration, not an assessment of you.
          </p>
          <ol className="mt-5 space-y-5">
            {DISCOVERY.map((q, qi) => (
              <li key={q.question}>
                <p className="text-sm font-medium">
                  {qi + 1}. {q.question}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.options.map((option, oi) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => {
                          const next = [...prev];
                          next[qi] = oi;
                          return next;
                        })
                      }
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                        answers[qi] === oi
                          ? "border-primary bg-primary/10 font-medium"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          {suggestion && (
            <div className="mt-6 rounded-xl bg-muted p-4">
              <p className="text-sm">
                Based on your answers, these directions may be worth exploring — starting with{" "}
                <span className="font-medium">{suggestion}</span>.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {CAREERS.map((career) => (
                  <Button
                    key={career.id}
                    variant={career.title === suggestion ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCareerId(career.id);
                      setProfile({ goal: `I want to work as a ${career.title.toLowerCase()}.`, goalCategory: career.industry });
                      void navigate({ to: "/home" });
                    }}
                  >
                    {career.title}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </ForkShell>
  );
}
