import { Building2, Check, Link2, Loader2, Unlink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { SchoolField } from "@/components/fork/SchoolField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "fork.schoolLink";

const linkSchema = z.object({
  school: z.string().trim().min(2, { message: "Pick your school first" }).max(120),
  studentId: z
    .string()
    .trim()
    .min(4, { message: "School IDs are at least 4 characters" })
    .max(32, { message: "That looks too long for a school ID" })
    .regex(/^[A-Za-z0-9-]+$/, { message: "Use letters, numbers and dashes only" }),
});

export type SchoolLinkRecord = { school: string; studentId: string; linkedAt: string };

/** Masked so the full ID is never displayed back on screen. */
const maskId = (id: string) => (id.length <= 4 ? "••••" : `${"•".repeat(id.length - 4)}${id.slice(-4)}`);

/**
 * Links a student ID to a school so uploads are tagged to the right institution and
 * the school field is filled in automatically. Fork never fetches from a portal on its
 * own — the student still uploads the document, this just removes the setup steps.
 */
export function SchoolLink({
  school,
  onSchoolChange,
  onLinked,
}: {
  school: string;
  onSchoolChange: (school: string) => void;
  onLinked?: (record: SchoolLinkRecord) => void;
}) {
  const [record, setRecord] = useState<SchoolLinkRecord | null>(null);
  const [schoolDraft, setSchoolDraft] = useState(school);
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setRecord(JSON.parse(raw) as SchoolLinkRecord);
    } catch {
      /* ignore malformed local state */
    }
  }, []);

  useEffect(() => {
    if (school) setSchoolDraft(school);
  }, [school]);

  const link = async () => {
    const parsed = linkSchema.safeParse({ school: schoolDraft, studentId });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setError(null);
    setBusy(true);
    const next: SchoolLinkRecord = { ...parsed.data, linkedAt: new Date().toISOString() };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode — keep the in-memory link */
    }
    setRecord(next);
    setStudentId("");
    if (parsed.data.school !== school) onSchoolChange(parsed.data.school);
    onLinked?.(next);
    setBusy(false);
    toast.success("School ID linked", { description: `Uploads are now tagged to ${parsed.data.school}.` });
  };

  const unlink = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setRecord(null);
    toast.success("School ID unlinked");
  };

  if (record) {
    return (
      <section className="mt-8 rounded-2xl border border-mint/50 bg-mint/10 p-5 lg:max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Check className="mt-0.5 size-5 text-primary" />
            <div>
              <h2 className="font-medium">School ID linked</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{record.school}</span> · ID {maskId(record.studentId)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Your uploads are matched to this school's course catalog, so extracted courses line up with real course
                codes.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={unlink}>
            <Unlink className="size-4" /> Unlink
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5 lg:max-w-3xl">
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 size-5 text-primary" />
        <div className="flex-1">
          <h2 className="font-medium">Link your school ID first (optional)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Linking your school and student ID fills in your school, matches extracted courses to that school's catalog,
            and keeps every upload tagged to the right institution.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SchoolField value={schoolDraft} onChange={setSchoolDraft} />
            <div>
              <Label htmlFor="school-id" className="text-sm">
                Student ID
              </Label>
              <Input
                id="school-id"
                value={studentId}
                maxLength={32}
                autoComplete="off"
                placeholder="e.g. 730123456"
                onChange={(e) => setStudentId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void link();
                }}
                className="mt-1.5"
              />
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={() => void link()} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />} Link school ID
            </Button>
            <span className="text-xs text-muted-foreground">
              Stored on this device only. Fork never asks for your portal password.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
