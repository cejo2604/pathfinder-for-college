import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Check, ChevronDown, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";

import { AutofillField } from "@/components/fork/AutofillField";
import { ForkShell } from "@/components/fork/ForkShell";
import { SchoolField } from "@/components/fork/SchoolField";
import { TagField } from "@/components/fork/TagField";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEGREES, FIELDS_OF_STUDY, MINORS, YEARS } from "@/lib/fork/academics";
import { COURSES, courseByCode } from "@/lib/fork/data";
import { CAREER_INTEREST_OPTIONS, INTEREST_OPTIONS, SKILL_OPTIONS } from "@/lib/fork/interests";
import type { StudentCourse, StudentProfile } from "@/lib/fork/data";

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
  const { profile: loaded, setProfile, signedIn, saveProfile, profileReady } = useFork();

  const [draft, setDraft] = useState<StudentProfile>(profile);
  const [draftInitialized, setDraftInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!draftInitialized && profileReady) {
      setDraft(profile);
      setDraftInitialized(true);
    }
  }, [draftInitialized, profileReady, profile]);

  const updateDraft = (patch: Partial<StudentProfile>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    if (!signedIn) return;
    setSaveStatus("saving");
    setSaveError(null);
    try {
      await saveProfile(draft);
      setProfile({ ...draft });
      setSaveStatus("success");
    } catch (error) {
      setSaveStatus("error");
      setSaveError(error instanceof Error ? error.message : "Could not save profile");
    }
  };

  const handleContinue = async () => {
    if (signedIn) {
      try {
        await saveProfile(draft);
        setProfile({ ...draft });
      } catch (error) {
        setSaveStatus("error");
        setSaveError(error instanceof Error ? error.message : "Could not save profile");
        return;
      }
    }
    void navigate({ to: "/home" });
  };


  // A profile "exists" once the student has entered anything Fork can use.
  const hasProfile = Boolean(
    loaded &&
      (draft.name.trim() ||
        draft.school.trim() ||
        draft.major.trim() ||
        draft.degree.trim() ||
        draft.year.trim() ||
        draft.graduationTarget.trim() ||
        draft.gpa > 0 ||
        draft.courses.length > 0),
  );

  return (
    <ForkShell>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Profile</p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
          {hasProfile ? "Your academic position" : "Create your profile"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {hasProfile
            ? "Everything below is editable. Press Save profile when you're ready to update your record."
            : "Tell Fork where you stand academically. Press Save profile when you're ready to continue."}
        </p>
        <div className="mt-5 flex flex-col gap-2 items-start">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-1.5" onClick={() => void navigate({ to: "/import" })}>
              <Upload className="size-4" /> Import my academic history
            </Button>
            {!signedIn && (
              <Button variant="ghost" className="gap-1.5" onClick={() => void navigate({ to: "/auth" })}>
                Sign in to save
              </Button>
            )}
            {signedIn && (
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={handleSave}
                disabled={saveStatus === "saving"}
              >
                {saveStatus === "saving" ? "Saving..." : "Save profile"}
              </Button>
            )}
          </div>
          <Button
            className="gap-1.5"
            size="lg"
            onClick={handleContinue}
            disabled={saveStatus === "saving"}
          >
            {hasProfile ? "Go to my path" : "Save and continue"} <ArrowRight className="size-4" />
          </Button>
        </div>
        {saveStatus === "success" && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
            <Check className="size-4" />
            Profile saved successfully.
          </div>
        )}
        {saveStatus === "error" && saveError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {saveError}
          </div>
        )}
      </header>




      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Academic</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Name"
              value={draft.name}
              placeholder="Your full name"
              onChange={(name) => updateDraft({ name })}
            />
            <SchoolField value={draft.school} onChange={(school) => updateDraft({ school })} />
            <AutofillField
              label="Degree"
              value={draft.degree}
              options={DEGREES}
              placeholder="Bachelor of Science (BS)"
              onChange={(degree) => updateDraft({ degree })}
            />
            <AutofillField
              label="Major"
              value={draft.major}
              options={FIELDS_OF_STUDY}
              placeholder="Start typing a field of study"
              onChange={(major) => updateDraft({ major })}
            />
            <AutofillField
              label="Minor"
              value={draft.minor ?? ""}
              options={MINORS}
              placeholder="Optional"
              onChange={(minor) => updateDraft({ minor: minor || null })}
            />
            <AutofillField
              label="Year"
              value={draft.year}
              options={YEARS}
              showAllOnFocus
              maxSuggestions={9}
              placeholder="Sophomore"
              onChange={(year) => updateDraft({ year })}
            />

            <Field
              label="Expected graduation"
              value={draft.graduationTarget}
              placeholder="May 2028"
              onChange={(graduationTarget) => updateDraft({ graduationTarget })}
            />
            <NumberField
              label="Credits completed"
              value={draft.creditsCompleted}
              step={1}
              max={300}
              placeholder="e.g. 58"
              onCommit={(creditsCompleted) => updateDraft({ creditsCompleted })}
            />
            <NumberField
              label="GPA"
              value={draft.gpa}
              step={0.01}
              max={4.5}
              decimals={2}
              placeholder="e.g. 3.60"
              onCommit={(gpa) => updateDraft({ gpa })}
            />


          </div>
        </section>


        <section className="rounded-2xl border border-border bg-card p-2">
          <CourseworkSection draft={draft} onChange={(patch) => updateDraft(patch)} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-xl">Interests & strengths</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search a section to add what fits you — suggestions autofill, and anything you type is kept.
          </p>
          <div className="mt-4 space-y-5 text-sm">
            <TagField
              label="Interests"
              items={draft.interests}
              options={INTEREST_OPTIONS}
              onChange={(interests) => updateDraft({ interests })}
            />
            <TagField
              label="Career interests"
              items={draft.careerInterests}
              options={CAREER_INTEREST_OPTIONS}
              onChange={(careerInterests) => updateDraft({ careerInterests })}
            />
            <TagField
              label="Skills"
              items={draft.skills}
              options={SKILL_OPTIONS}
              onChange={(skills) => updateDraft({ skills })}
            />
          </div>

          <Button variant="outline" className="mt-5" onClick={() => void navigate({ to: "/goal" })}>
            Change my goal
          </Button>
        </section>

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
  placeholder,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  decimals?: number;
  placeholder?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  const [draft, setDraft] = useState<string | null>(null);

  const clamp = (n: number) => {
    const bounded = Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min, n));
    return decimals > 0 ? Number(bounded.toFixed(decimals)) : Math.round(bounded);
  };

  // A zero here means "not entered yet", so the input stays visually empty.
  const display = draft ?? (value === 0 ? "" : String(value));

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
        placeholder={placeholder}
        {...(max === undefined ? {} : { max })}
        value={display}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          const parsed = Number(raw);
          // Only commit a complete number; "3." or "" stays in the draft.
          if (raw === "") onCommit(0);
          else if (Number.isFinite(parsed)) onCommit(clamp(parsed));
        }}
        onBlur={() => setDraft(null)}
        className="mt-1.5"
      />
    </div>
  );
}

function CourseworkSection({
  draft,
  onChange,
}: {
  draft: StudentProfile;
  onChange: (patch: Partial<StudentProfile>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const [newCourse, setNewCourse] = useState<StudentCourse>({
    code: "",
    status: "completed",
    term: "",
    grade: "",
    verified: true,
    source: "manual",
  });

  const completed = draft.courses
    .map((c, i) => ({ course: c, index: i }))
    .filter((c) => c.course.status === "completed");
  const current = draft.courses
    .map((c, i) => ({ course: c, index: i }))
    .filter((c) => c.course.status === "in_progress");
  const waitlisted = draft.courses
    .map((c, i) => ({ course: c, index: i }))
    .filter((c) => c.course.status === "waitlisted");

  const courseOptions = COURSES.map((c) => c.code);

  const updateNewCourse = (patch: Partial<StudentCourse>) => {
    setNewCourse((prev) => ({ ...prev, ...patch }));
  };

  const handleAdd = () => {
    const code = newCourse.code.trim();
    const term = newCourse.term.trim();
    if (!code || !term) return;
    onChange({ courses: [...draft.courses, { ...newCourse, code, term }] });
    setNewCourse({
      code: "",
      status: "completed",
      term: "",
      grade: "",
      verified: true,
      source: "manual",
    });
    setAddOpen(false);
  };

  const handleDelete = () => {
    if (deleteIndex === null) return;
    onChange({ courses: draft.courses.filter((_, i) => i !== deleteIndex) });
    setDeleteIndex(null);
  };

  const deleteLabel = (i: number | null) => {
    if (i === null) return "this course";
    const c = draft.courses[i];
    if (!c) return "this course";
    const course = courseByCode(c.code);
    return `${c.code}${course ? ` — ${course.title}` : ""}`;
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button type="button" className="flex w-full items-center justify-between text-left">
          <h2 className="font-display text-xl">Coursework</h2>
          <ChevronDown
            className={`size-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-4 space-y-5 text-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Completed ({draft.creditsCompleted} credits)
            </h3>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="size-4" /> Add Coursework
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add coursework</DialogTitle>
                  <DialogDescription>
                    Enter a course you have completed, are taking, or are waitlisted for.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <AutofillField
                    label="Course code"
                    value={newCourse.code}
                    options={courseOptions}
                    placeholder="e.g. BIOL 101"
                    onChange={(code) => updateNewCourse({ code })}
                  />
                  <div>
                    <Label className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Status</Label>
                    <Select
                      value={newCourse.status}
                      onValueChange={(status) => updateNewCourse({ status: status as StudentCourse["status"] })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="in_progress">In progress</SelectItem>
                        <SelectItem value="waitlisted">Waitlisted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Field
                    label="Term"
                    value={newCourse.term}
                    placeholder="e.g. Fall 2025"
                    onChange={(term) => updateNewCourse({ term })}
                  />
                  <Field
                    label="Grade"
                    value={newCourse.grade ?? ""}
                    placeholder="Optional"
                    onChange={(grade) => updateNewCourse({ ...(grade ? { grade } : {}) })}
                  />
                  {newCourse.status === "waitlisted" && (
                    <NumberField
                      label="Waitlist position"
                      value={newCourse.waitlistPosition ?? 0}
                      placeholder="Optional"
                      onCommit={(waitlistPosition) =>
                        updateNewCourse({ ...(waitlistPosition ? { waitlistPosition } : {}) })
                      }
                    />
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAdd} disabled={!newCourse.code.trim() || !newCourse.term.trim()}>
                    Add course
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <ul className="mt-2 divide-y divide-border/70">
            {completed.map(({ course: sc, index }) => {
              const course = courseByCode(sc.code);
              return (
                <li key={`${sc.code}-${sc.term}`} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="flex items-baseline gap-2">
                    <span className="font-medium">{sc.code}</span>
                    {course ? ` — ${course.title}` : " — General education requirements"}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="shrink-0 text-muted-foreground">
                      {sc.term}
                      {sc.grade ? ` · ${sc.grade}` : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${sc.code}`}
                      onClick={() => setDeleteIndex(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">In progress</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {current.map(({ course: sc, index }) => (
                <li key={`${sc.code}-${index}`} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                  {sc.code}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${sc.code}`}
                    onClick={() => setDeleteIndex(index)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {waitlisted.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Waitlisted</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {waitlisted.map(({ course: sc, index }) => (
                  <li
                    key={`${sc.code}-wl-${index}`}
                    className="flex items-center gap-1 rounded-full border border-gold/50 bg-gold/10 px-3 py-1"
                  >
                    {sc.code}
                    {sc.waitlistPosition ? ` · #${sc.waitlistPosition}` : ""}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${sc.code}`}
                      onClick={() => setDeleteIndex(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CollapsibleContent>

      <Dialog open={deleteIndex !== null} onOpenChange={(isOpen) => !isOpen && setDeleteIndex(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete course?</DialogTitle>
            <DialogDescription>
              This will remove {deleteIndex !== null ? deleteLabel(deleteIndex) : "this course"} from your coursework.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteIndex(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
}





