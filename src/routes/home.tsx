import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { ForkShell } from "@/components/fork/ForkShell";
import { PathCompareDialog } from "@/components/fork/PathCompareDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDelta, simulatePaths, type SimulatedPath } from "@/lib/fork/engine";
import { programPathId, selectableMajors, selectableMinors } from "@/lib/fork/program-paths";
import { useFork, useForkProfile } from "@/lib/fork/state";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "My Path — Fork" },
      {
        name: "description",
        content: "Your current academic position, your goal, and the decision that matters most right now.",
      },
      { property: "og:title", content: "My Path — Fork" },
      { property: "og:description", content: "Where you are today and where your choices could lead." },
    ],
  }),
  component: MyPath,
});

function MyPath() {
  const profile = useForkProfile();
  const { profile: loaded, loadDemoStudent, careerId, priorities, signedIn, choosePath } = useFork();
  const navigate = useNavigate();

  // Any catalog program can be simulated from here — the student picks it.
  const majors = useMemo(() => selectableMajors(profile), [profile]);
  const minors = useMemo(() => selectableMinors(profile), [profile]);
  const NONE = "__none";
  const [majorId, setMajorId] = useState(NONE);
  const [minorId, setMinorId] = useState(NONE);
  const [compareId, setCompareId] = useState<string | null>(null);

  const pickedMajor = majorId === NONE ? "" : majorId;
  const pickedMinor = minorId === NONE ? "" : minorId;
  const ids = ["baseline"];
  if (pickedMajor) ids.push(programPathId("switch", pickedMajor));
  if (pickedMinor) ids.push(programPathId("minor", pickedMinor));
  const options = simulatePaths(ids, { profile, careerId, priorities });
  const baseline = options.find((p) => p.isBaseline);
  const switchPath = pickedMajor ? options.find((p) => p.id === programPathId("switch", pickedMajor)) : undefined;
  const minorPath = pickedMinor ? options.find((p) => p.id === programPathId("minor", pickedMinor)) : undefined;
  const comparing = options.find((p) => p.id === compareId);

  // Once a student has created their own profile, only their own entries show —
  // empty fields fall back to a neutral example hint, never to demo-student data.
  const own = Boolean(loaded);
  const show = (value: string | number | null | undefined, example: string) => {
    const text = typeof value === "number" ? (value ? String(value) : "") : (value ?? "").trim();
    if (text) return text;
    return own ? example : String(value ?? "");
  };
  const firstName = show(profile.name.split(" ")[0], "Your");

  // Baseline card mirrors the student's own program instead of a hardcoded major.
  const baselineProgram = (baseline?.program ?? profile.major ?? "").trim();
  const baselineLabel = baselineProgram ? `Stay in ${baselineProgram}` : "Stay the course";

  const accept = (option: SimulatedPath) => {
    choosePath(option.id, {
      scenarioId: option.id,
      question: `What if I move to ${option.name}?`,
      pathName: option.name,
      program: option.program,
      snapshot: option,
    });
    setCompareId(null);
    void navigate({ to: "/plan" });
  };

  return (
    <ForkShell>
      {!loaded && signedIn && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">Your profile is empty. Add your academic record so Fork can simulate your paths.</p>
          <Button size="sm" className="gap-1.5" onClick={() => void navigate({ to: "/profile" })}>
            Complete my profile
          </Button>
        </div>
      )}
      {!loaded && !signedIn && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">
            You&apos;re previewing the demo student. Load {profile.name} to save choices as you explore.
          </p>
          <Button size="sm" className="gap-1.5" onClick={() => loadDemoStudent()}>
            <Sparkles className="size-3.5" /> Load demo student
          </Button>
        </div>
      )}

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {show(profile.school, "Add your school")} · {show(profile.year, "Add your year")}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
          {firstName === "Your" ? "Your future" : `${firstName}\u2019s future`}
        </h1>
        <p className="mt-2 font-display text-2xl text-muted-foreground">
          {show(profile.major, "Add your major")} <span className="text-primary">→</span>{" "}
          {show(profile.goalCategory, "Set your goal")}
        </p>
        <p className="mt-4 max-w-2xl text-lg">
          You&apos;re currently on track to graduate in{" "}
          <span className="font-medium">{show(profile.graduationTarget, "your target term")}</span> with{" "}
          {show(profile.creditsCompleted, "0")} credits completed and a {show(profile.gpa, "—")} GPA.
        </p>
      </header>

      <section className="mt-12 rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
        <h2 className="font-display text-2xl">Your biggest decision</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Pick any program from the catalog to see it against your current path. Compare, then accept it to make it your
          plan.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <DecisionCard title={baselineLabel} path={baseline} caption="Your current path" />

          <DecisionCard
            title="Switch my major"
            path={switchPath}
            onSimulate={() => switchPath && setCompareId(switchPath.id)}
            control={
              <>
                <Select value={majorId} onValueChange={setMajorId}>
                  <SelectTrigger className="mt-3" aria-label="Choose a major to switch into">
                    <SelectValue placeholder="Choose a major" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No selection — don&apos;t simulate</SelectItem>
                    {majors.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />

          <DecisionCard
            title="Add a minor"
            path={minorPath}
            onSimulate={() => minorPath && setCompareId(minorPath.id)}
            control={
              <>
                <Select value={minorId} onValueChange={setMinorId}>
                  <SelectTrigger className="mt-3" aria-label="Choose a minor to add">
                    <SelectValue placeholder="Choose a minor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No selection — don&apos;t simulate</SelectItem>
                    {minors.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />
        </div>
      </section>


      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <Fact label="Current courses" value={profile.courses.filter((c) => c.status === "in_progress").length} sub="in progress this term" />
        <Fact label="Credits completed" value={profile.creditsCompleted} sub={`of ${120} required`} />
        <Fact label="Career interests" value={profile.careerInterests.length} sub={profile.careerInterests.join(", ")} />
      </section>

      <PathCompareDialog
        open={Boolean(comparing)}
        onOpenChange={(open) => !open && setCompareId(null)}
        baseline={baseline}
        option={comparing}
        onAccept={accept}
      />
    </ForkShell>
  );
}

function DecisionCard({
  title,
  path,
  caption,
  control,
  onSimulate,
}: {
  title: string;
  path: SimulatedPath | undefined;
  caption?: string;
  control?: React.ReactNode;
  onSimulate?: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-background p-4 text-left">
      <p className="font-display text-lg leading-tight">{title}</p>
      {control}
      {caption && <p className="mt-2 text-sm text-muted-foreground">{caption}</p>}

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Est. completion</dt>
          <dd className="font-medium">{path?.estimatedCompletionDate ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Tuition change</dt>
          <dd className="font-medium tabular-nums">
            {!path ? "—" : path.isBaseline ? "Baseline" : formatDelta(path.additionalCost)}
          </dd>
        </div>
      </dl>

      {onSimulate && (
        <Button size="sm" variant="outline" className="mt-4 w-full gap-1.5" disabled={!path} onClick={onSimulate}>
          <Sparkles className="size-3.5" /> Simulate this
        </Button>
      )}
    </div>
  );
}

function Fact({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
