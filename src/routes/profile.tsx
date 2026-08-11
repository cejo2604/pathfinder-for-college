import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { PriorityPanel } from "@/components/fork/Decision";
import { ForkShell } from "@/components/fork/ForkShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { courseByCode } from "@/lib/fork/data";
import { useFork, useForkProfile } from "@/lib/fork/state";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Student profile — Fork" },
      {
        name: "description",
        content: "The academic record, interests and ranked priorities Fork uses to simulate your possible futures.",
      },
      { property: "og:title", content: "Student profile — Fork" },
      { property: "og:description", content: "Academic position, interests and priorities behind every Fork estimate." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const profile = useForkProfile();
  const navigate = useNavigate();
  const { profile: loaded, loadDemoStudent, setProfile, priorities, setPriorities } = useFork();

  const completed = profile.courses.filter((c) => c.status === "completed");
  const current = profile.courses.filter((c) => c.status === "in_progress");

  return (
    <ForkShell>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Profile</p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Your academic position</h1>
        <p className="mt-3 text-muted-foreground">
          Nothing here is required to try Fork — the demo student fills it all in. Every number in the simulator traces
          back to this page.
        </p>
        {!loaded && (
          <Button className="mt-5 gap-1.5" onClick={loadDemoStudent}>
            <Sparkles className="size-4" /> Load demo student
          </Button>
        )}
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Academic</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={profile.name} onChange={(name) => setProfile({ name })} />
            <SchoolField value={profile.school} onChange={(school) => setProfile({ school })} />
            <Field label="Degree" value={profile.degree} onChange={(degree) => setProfile({ degree })} />
            <Field label="Major" value={profile.major} onChange={(major) => setProfile({ major })} />
            <Field label="Minor" value={profile.minor ?? ""} onChange={(minor) => setProfile({ minor: minor || null })} />
            <Field label="Year" value={profile.year} onChange={(year) => setProfile({ year })} />
            <Field
              label="Expected graduation"
              value={profile.graduationTarget}
              onChange={(graduationTarget) => setProfile({ graduationTarget })}
            />
            <Field
              label="Credits completed"
              value={String(profile.creditsCompleted)}
              onChange={(v) => setProfile({ creditsCompleted: Number(v) || 0 })}
            />
            <Field label="GPA" value={String(profile.gpa)} onChange={(v) => setProfile({ gpa: Number(v) || 0 })} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Coursework</h2>
          <div className="mt-4 space-y-5 text-sm">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Completed ({profile.creditsCompleted} credits)
              </h3>
              <ul className="mt-2 divide-y divide-border/70">
                {completed.map((sc) => {
                  const course = courseByCode(sc.code);
                  return (
                    <li key={`${sc.code}-${sc.term}`} className="flex items-baseline justify-between gap-2 py-1.5">
                      <span>
                        <span className="font-medium">{sc.code}</span>
                        {course ? ` — ${course.title}` : " — General education requirements"}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {sc.term}
                        {sc.grade ? ` · ${sc.grade}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                In progress
              </h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {current.map((sc, i) => (
                  <li key={`${sc.code}-${i}`} className="rounded-full bg-muted px-3 py-1">
                    {sc.code}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Interests & strengths</h2>
          <div className="mt-4 space-y-4 text-sm">
            <TagList title="Interests" items={profile.interests} />
            <TagList title="Career interests" items={profile.careerInterests} />
            <TagList title="Skills" items={profile.skills} />
          </div>
          <Button variant="outline" className="mt-5" onClick={() => void navigate({ to: "/goal" })}>
            Change my goal
          </Button>
        </section>

        <PriorityPanel priorities={priorities} onChange={setPriorities} />
      </div>
    </ForkShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <Label htmlFor={id} className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5" />
    </div>
  );
}

function TagList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="rounded-full bg-muted px-3 py-1">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
