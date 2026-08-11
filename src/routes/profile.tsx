import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Upload } from "lucide-react";
import { useState } from "react";


import { AutofillField } from "@/components/fork/AutofillField";
import { PriorityPanel } from "@/components/fork/Decision";

import { ForkShell } from "@/components/fork/ForkShell";
import { SchoolField } from "@/components/fork/SchoolField";
import { TagField } from "@/components/fork/TagField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEGREES, FIELDS_OF_STUDY, MINORS, YEARS } from "@/lib/fork/academics";
import { courseByCode } from "@/lib/fork/data";
import { CAREER_INTEREST_OPTIONS, INTEREST_OPTIONS, SKILL_OPTIONS } from "@/lib/fork/interests";

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
  const waitlisted = profile.courses.filter((c) => c.status === "waitlisted");

  return (
    <ForkShell>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Profile</p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Your academic position</h1>
        <p className="mt-3 text-muted-foreground">
          Nothing here is required to try Fork — the demo student fills it all in. Every number in the simulator traces
          back to this page.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button className="gap-1.5" onClick={() => void navigate({ to: "/import" })}>
            <Upload className="size-4" /> Import my academic history
          </Button>
          {!loaded && (
            <Button variant="outline" className="gap-1.5" onClick={loadDemoStudent}>
              <Sparkles className="size-4" /> Load demo student
            </Button>
          )}
        </div>
      </header>


      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Academic</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={profile.name} onChange={(name) => setProfile({ name })} />
            <SchoolField value={profile.school} onChange={(school) => setProfile({ school })} />
            <AutofillField
              label="Degree"
              value={profile.degree}
              options={DEGREES}
              placeholder="Bachelor of Science (BS)"
              onChange={(degree) => setProfile({ degree })}
            />
            <AutofillField
              label="Major"
              value={profile.major}
              options={FIELDS_OF_STUDY}
              placeholder="Start typing a field of study"
              onChange={(major) => setProfile({ major })}
            />
            <AutofillField
              label="Minor"
              value={profile.minor ?? ""}
              options={MINORS}
              placeholder="Optional"
              onChange={(minor) => setProfile({ minor: minor || null })}
            />
            <AutofillField
              label="Year"
              value={profile.year}
              options={YEARS}
              showAllOnFocus
              maxSuggestions={9}
              placeholder="Sophomore"
              onChange={(year) => setProfile({ year })}
            />

            <Field
              label="Expected graduation"
              value={profile.graduationTarget}
              onChange={(graduationTarget) => setProfile({ graduationTarget })}
            />
            <NumberField
              label="Credits completed"
              value={profile.creditsCompleted}
              step={1}
              max={300}
              onCommit={(creditsCompleted) => setProfile({ creditsCompleted })}
            />
            <NumberField
              label="GPA"
              value={profile.gpa}
              step={0.01}
              max={4.5}
              decimals={2}
              onCommit={(gpa) => setProfile({ gpa })}
            />

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
            {waitlisted.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Waitlisted
                </h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {waitlisted.map((sc, i) => (
                    <li key={`${sc.code}-wl-${i}`} className="rounded-full border border-gold/50 bg-gold/10 px-3 py-1">
                      {sc.code}
                      {sc.waitlistPosition ? ` · #${sc.waitlistPosition}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Interests & strengths</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search a section to add what fits you — suggestions autofill, and anything you type is kept.
          </p>
          <div className="mt-4 space-y-5 text-sm">
            <TagField
              label="Interests"
              items={profile.interests}
              options={INTEREST_OPTIONS}
              onChange={(interests) => setProfile({ interests })}
            />
            <TagField
              label="Career interests"
              items={profile.careerInterests}
              options={CAREER_INTEREST_OPTIONS}
              onChange={(careerInterests) => setProfile({ careerInterests })}
            />
            <TagField
              label="Skills"
              items={profile.skills}
              options={SKILL_OPTIONS}
              onChange={(skills) => setProfile({ skills })}
            />
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

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <Label htmlFor={id} className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5"
      />
    </div>
  );
}


/**
 * Numeric field that keeps the student's raw keystrokes while they type, so
 * partial decimals like "3." survive long enough to become "3.65".
 */
function NumberField({
  label,
  value,
  onCommit,
  step = 1,
  min = 0,
  max,
  decimals = 0,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  decimals?: number;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  const [draft, setDraft] = useState<string | null>(null);

  const clamp = (n: number) => {
    const bounded = Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min, n));
    return decimals > 0 ? Number(bounded.toFixed(decimals)) : Math.round(bounded);
  };

  return (
    <div>
      <Label htmlFor={id} className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        {...(max === undefined ? {} : { max })}
        value={draft ?? String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          const parsed = Number(raw);
          // Only commit a complete number; "3." or "" stays in the draft.
          if (raw !== "" && Number.isFinite(parsed)) onCommit(clamp(parsed));
        }}
        onBlur={() => setDraft(null)}
        className="mt-1.5"
      />
    </div>
  );
}



