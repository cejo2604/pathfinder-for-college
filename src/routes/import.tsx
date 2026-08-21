import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  Check,
  FileSpreadsheet,
  FileText,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ForkShell } from "@/components/fork/ForkShell";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { COURSES, type StudentCourse } from "@/lib/fork/data";
import {
  BUCKET,
  addCourseRecord,
  confirmImport,
  deleteAcademicDocument,
  deleteCourseRecord,
  deleteImportedHistory,
  loadAcademicHistory,
  processDocument,
  registerDocument,
  updateCourseRecord,
  type AcademicDocument,
  type CoursePatch,
  type ExtractedProfileFields,
  type StudentCourseRow,
} from "@/lib/fork/import.functions";
import { useFork, useForkProfile } from "@/lib/fork/state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Import your academic history — Fork" },
      {
        name: "description",
        content:
          "Upload your transcript or degree audit and Fork builds your starting point: completed courses, credits and program, verified by you.",
      },
      { property: "og:title", content: "Import your academic history — Fork" },
      {
        property: "og:description",
        content: "Fork understands where you are before showing you where you could go.",
      },
    ],
  }),
  component: ImportPage,
});

const STATUS_OPTIONS: StudentCourseRow["status"][] = [
  "completed",
  "enrolled",
  "planned",
  "waitlisted",
  "withdrawn",
];

const STATUS_LABEL: Record<StudentCourseRow["status"], string> = {
  completed: "Completed",
  enrolled: "In progress",
  planned: "Planned",
  waitlisted: "Waitlisted",
  withdrawn: "Withdrawn",
};

/** Imported statuses map onto the record the deterministic engine reads. */
const toProfileStatus = (status: StudentCourseRow["status"]): StudentCourse["status"] | null => {
  if (status === "completed") return "completed";
  if (status === "enrolled" || status === "planned") return "in_progress";
  if (status === "waitlisted") return "waitlisted";
  return null; // withdrawn courses are not part of the academic position
};

function ImportPage() {
  const navigate = useNavigate();
  const profile = useForkProfile();
  const { signedIn, authLoading, setProfile } = useFork();

  const load = useServerFn(loadAcademicHistory);
  const register = useServerFn(registerDocument);
  const process = useServerFn(processDocument);
  const patchCourse = useServerFn(updateCourseRecord);
  const addCourse = useServerFn(addCourseRecord);
  const removeCourse = useServerFn(deleteCourseRecord);
  const confirm = useServerFn(confirmImport);
  const removeDocument = useServerFn(deleteAcademicDocument);
  const wipeHistory = useServerFn(deleteImportedHistory);

  const [documents, setDocuments] = useState<AcademicDocument[]>([]);
  const [rows, setRows] = useState<StudentCourseRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "uploading" | "extracting" | "confirming">(null);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictField[] | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const pendingType = useRef<"pdf" | "csv">("pdf");

  const refresh = useCallback(async () => {
    const data = await load({});
    setDocuments(data.documents);
    setRows(data.courses);
    setActiveId((current) => current ?? data.documents[0]?.id ?? null);
    return data;
  }, [load]);

  useEffect(() => {
    if (!signedIn) return;
    void refresh().catch(() => setError("Your academic history could not be loaded."));
  }, [signedIn, refresh]);

  const activeDoc = documents.find((d) => d.id === activeId) ?? null;
  const docRows = useMemo(
    () => (activeDoc ? rows.filter((r) => r.sourceDocumentId === activeDoc.id) : rows),
    [rows, activeDoc],
  );

  const completedRows = docRows.filter((r) => r.status === "completed");
  const completedCredits = completedRows.reduce((sum, r) => sum + (r.credits || 0), 0);
  const unresolved = docRows.filter((r) => !r.courseId).length;

  /* ------------------------------------------------------------- uploading */

  const pick = (type: "pdf" | "csv") => {
    pendingType.current = type;
    if (fileInput.current) {
      fileInput.current.accept = type === "pdf" ? "application/pdf,.pdf" : "text/csv,.csv";
      fileInput.current.value = "";
      fileInput.current.click();
    }
  };

  const onFile = async (file: File) => {
    setError(null);
    const type = pendingType.current;
    if (file.size > 20 * 1024 * 1024) {
      setError("That file is larger than 20 MB.");
      return;
    }
    try {
      setBusy("uploading");
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Please sign in again.");

      // Files land in the student's own folder; storage policies enforce it too.
      const storagePath = `${uid}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const upload = await supabase.storage.from(BUCKET).upload(storagePath, file, { upsert: false });
      if (upload.error) throw new Error(upload.error.message);

      const { documentId } = await register({
        data: { fileName: file.name, fileType: type, storagePath },
      });
      setActiveId(documentId);

      setBusy("extracting");
      const result = await process({ data: { documentId } });
      const data = await refresh();
      if (!result.ok) {
        setError(result.error ?? "This document could not be read.");
        return;
      }

    } catch (e) {
      setError(e instanceof Error ? e.message : "The upload failed.");
    } finally {
      setBusy(null);
    }
  };

  /* -------------------------------------------------------------- reviewing */

  const editRow = (id: string, patch: CoursePatch) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, ...patch, confidence: "high", verifiedByStudent: true, matchedTitle: r.matchedTitle }
          : r,
      ),
    );
    void patchCourse({ data: { id, patch } }).catch(() => toast.error("That change could not be saved."));
  };

  const resolveMatch = (id: string, code: string) => {
    const course = COURSES.find((c) => c.code === code);
    editRow(id, {
      courseId: code || null,
      ...(course ? { extractedCode: course.code, extractedTitle: course.title } : {}),
    });
    if (course) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, matchedTitle: course.title } : r)));
    }
  };

  const addBlankRow = async () => {
    try {
      await addCourse({
        data: {
          documentId: activeId,
          patch: { extractedCode: "", extractedTitle: "", term: "", credits: 3, status: "completed" },
        },
      });
      await refresh();
    } catch {
      toast.error("The course could not be added.");
    }
  };

  const deleteRow = async (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    await removeCourse({ data: { id } }).catch(() => toast.error("That course could not be removed."));
  };

  /* ------------------------------------------------------------- confirming */

  const applyToProfile = (
    verified: StudentCourseRow[],
    credits: number,
    fields: ExtractedProfileFields,
    accepted: Set<keyof ExtractedProfileFields>,
  ) => {
    const toCourse = (r: StudentCourseRow, isVerified: boolean): StudentCourse | null => {
      const status = toProfileStatus(r.status);
      if (!status) return null;
      const course: StudentCourse = {
        code: r.extractedCode || r.courseId || "—",
        status,
        term: r.term || "—",
        verified: isVerified,
        source: "import",
      };
      if (r.grade) course.grade = r.grade;
      if (r.waitlistPosition) course.waitlistPosition = r.waitlistPosition;
      return course;
    };

    const verifiedIds = new Set(verified.map((r) => r.id));
    const courses: StudentCourse[] = [
      ...verified.map((r) => toCourse(r, true)),
      // Rows the student has not confirmed stay on the record as uncertainty
      // only: the engine never counts them toward credits, cost or career fit.
      ...rows.filter((r) => !verifiedIds.has(r.id)).map((r) => toCourse(r, false)),
    ].filter((c): c is StudentCourse => c !== null);

    const patch: Partial<typeof profile> = { courses, creditsCompleted: credits };

    if (accepted.has("school") && fields.school) patch.school = fields.school;
    if (accepted.has("major") && fields.major) patch.major = fields.major;
    if (accepted.has("minor") && fields.minor) patch.minor = fields.minor;
    if (accepted.has("graduationTarget") && fields.graduationTarget) {
      patch.graduationTarget = fields.graduationTarget;
    }
    if (accepted.has("name") && fields.name) patch.name = fields.name;
    setProfile(patch);
  };

  const runConfirm = async (doc: AcademicDocument, auto = false) => {
    try {
      const result = await confirm({ data: { documentId: doc.id } });
      const fields = doc.extractedProfile;
      const found = detectConflicts(fields, profile);

      if (found.length > 0) {
        // Nothing manually entered is overwritten before the student chooses.
        setConflicts(found);
        applyToProfile(result.courses, result.creditsCompleted, fields, new Set());
      } else {
        const accepted = new Set(
          (["name", "school", "major", "minor", "graduationTarget"] as const).filter((k) => fields[k]),
        );
        applyToProfile(result.courses, result.creditsCompleted, fields, accepted);
        toast.success(
          auto ? "Transcript imported and confirmed automatically." : "Your academic history is confirmed.",
        );
      }
      await refresh();
      return found.length === 0;
    } catch {
      setError("Your academic history could not be confirmed.");
      return false;
    }
  };

  const onConfirm = async () => {
    if (!activeDoc) return;
    setBusy("confirming");
    const complete = await runConfirm(activeDoc);
    setBusy(null);
    if (complete) void navigate({ to: "/goal" });
  };

  const resolveConflicts = (chosen: Set<keyof ExtractedProfileFields>) => {
    if (!activeDoc) return;
    const verified = rows.filter((r) => r.verifiedByStudent);
    const credits = verified
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + (r.credits || 0), 0);
    applyToProfile(verified, credits, activeDoc.extractedProfile, chosen);
    setConflicts(null);
    toast.success("Your profile is up to date.");
    void navigate({ to: "/goal" });
  };

  /* ------------------------------------------------------------------ views */

  if (authLoading) {
    return (
      <ForkShell>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      </ForkShell>
    );
  }

  return (
    <ForkShell>
      <input
        ref={fileInput}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFile(file);
        }}
      />

      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tell Fork where you are</p>
        <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Import my academic history</h1>
        <p className="mt-3 text-muted-foreground">
          Upload your transcript or degree audit and we'll build your starting point. You review everything before Fork
          uses it.
        </p>
      </header>

      {!signedIn ? (
        <section className="mt-8 max-w-xl rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">Sign in to upload a document</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Academic documents are private to your account, so an upload needs a signed-in student.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => void navigate({ to: "/auth" })}>Sign in</Button>
            <Button variant="outline" onClick={() => void navigate({ to: "/profile" })}>
              Enter manually instead
            </Button>
          </div>
        </section>
      ) : (
        <>

          {/* Step 1 — upload */}
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">

            <button
              type="button"
              onClick={() => pick("pdf")}
              disabled={busy !== null}
              className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/60 disabled:opacity-60"
            >
              <FileText className="mt-0.5 size-5 text-primary" />
              <span>
                <span className="block font-medium">Upload PDF</span>
                <span className="mt-1 block text-sm text-muted-foreground">Transcript or degree audit</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => pick("csv")}
              disabled={busy !== null}
              className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/60 disabled:opacity-60"
            >
              <FileSpreadsheet className="mt-0.5 size-5 text-primary" />
              <span>
                <span className="block font-medium">Upload CSV</span>
                <span className="mt-1 block text-sm text-muted-foreground">Course list exported from your portal</span>
              </span>
            </button>
          </section>

          <p className="mt-3 text-sm text-muted-foreground">
            Don't have a transcript?{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => void navigate({ to: "/profile" })}
            >
              Build your profile manually →
            </button>
          </p>

          {busy === "uploading" && <Progressing label="Uploading your document…" />}
          {busy === "extracting" && <Progressing label="Analyzing your academic history…" />}

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 2 — review */}
          {activeDoc && docRows.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl">We found your academic history.</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                From <span className="font-medium text-foreground">{activeDoc.fileName}</span> ·{" "}
                {activeDoc.processingStatus === "confirmed" ? "confirmed by you" : "not used in simulations yet"}
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Stat value={`${completedCredits}`} label="completed credits" />
                <Stat value={`${completedRows.length}`} label="completed courses" />
                {activeDoc.extractedProfile.major && <Stat value={activeDoc.extractedProfile.major} label="major" />}
                {activeDoc.extractedProfile.graduationTarget && (
                  <Stat value={activeDoc.extractedProfile.graduationTarget} label="target" />
                )}
                {unresolved > 0 && <Stat value={`${unresolved}`} label="need review" tone="warn" />}
              </div>

              <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                    <tr>
                      <th className="p-3">Course</th>
                      <th className="p-3">Term</th>
                      <th className="p-3 w-20">Credits</th>
                      <th className="p-3 w-20">Grade</th>
                      <th className="p-3 w-36">Status</th>
                      <th className="p-3 w-32">Check</th>
                      <th className="p-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {docRows.map((row) => (
                      <tr key={row.id} className="border-b border-border/60 last:border-0 align-top">
                        <td className="p-3">
                          <Input
                            value={row.extractedCode}
                            aria-label="Course code"
                            className="h-8 w-28"
                            onChange={(e) => editRow(row.id, { extractedCode: e.target.value })}
                          />
                          <div className="mt-1 text-xs text-muted-foreground">
                            {row.matchedTitle ?? row.extractedTitle ?? ""}
                          </div>
                          {!row.courseId && (
                            <div className="mt-1.5">
                              <p className="text-xs text-gold-foreground">
                                We couldn't confidently match this course.
                              </p>
                              <select
                                aria-label="Select the correct course"
                                className="mt-1 h-8 w-full max-w-[240px] rounded-md border border-input bg-background px-2 text-xs"
                                value=""
                                onChange={(e) => resolveMatch(row.id, e.target.value)}
                              >
                                <option value="">Select the correct course…</option>
                                {COURSES.map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.code} — {c.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <Input
                            value={row.term}
                            aria-label="Term"
                            className="h-8 w-32"
                            onChange={(e) => editRow(row.id, { term: e.target.value })}
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min={0}
                            max={24}
                            value={String(row.credits)}
                            aria-label="Credits"
                            className="h-8 w-16"
                            onChange={(e) => editRow(row.id, { credits: Number(e.target.value) || 0 })}
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            value={row.grade ?? ""}
                            aria-label="Grade"
                            className="h-8 w-16"
                            onChange={(e) => editRow(row.id, { grade: e.target.value })}
                          />
                        </td>
                        <td className="p-3">
                          <select
                            aria-label="Status"
                            className="h-8 w-32 rounded-md border border-input bg-background px-2 text-xs"
                            value={row.status}
                            onChange={(e) =>
                              editRow(row.id, { status: e.target.value as StudentCourseRow["status"] })
                            }
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABEL[s]}
                              </option>
                            ))}
                          </select>
                          {row.status === "waitlisted" && (
                            <Input
                              type="number"
                              min={1}
                              placeholder="Position"
                              value={row.waitlistPosition ? String(row.waitlistPosition) : ""}
                              aria-label="Waitlist position"
                              className="mt-1 h-8 w-24"
                              onChange={(e) =>
                                editRow(row.id, { waitlistPosition: Number(e.target.value) || null })
                              }
                            />
                          )}
                        </td>
                        <td className="p-3">
                          {row.verifiedByStudent ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-mint/50 bg-mint/10 px-2 py-0.5 text-xs">
                              <Check className="size-3" /> Verified by you
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-gold/50 bg-gold/10 px-2 py-0.5 text-xs">
                              Needs review
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            aria-label={`Delete ${row.extractedCode}`}
                            className="text-muted-foreground transition hover:text-destructive"
                            onClick={() => void deleteRow(row.id)}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => void addBlankRow()}>
                <Plus className="size-4" /> Add a course
              </Button>

              {/* Step 3 — confirm */}
              <div className="mt-8 rounded-2xl border border-primary/40 bg-primary/5 p-5">
                <h3 className="font-display text-xl">Check your information</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fork will use the information you confirm to calculate your academic paths.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button className="gap-1.5" disabled={busy !== null} onClick={() => void onConfirm()}>
                    {busy === "confirming" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="size-4" />
                    )}
                    Confirm My Academic History
                  </Button>
                  {activeDoc.processingStatus === "confirmed" && (
                    <Button variant="outline" className="gap-1.5" onClick={() => void navigate({ to: "/goal" })}>
                      Go to my goals <ArrowRight className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </section>
          )}

          {conflicts && (
            <ConflictPanel
              conflicts={conflicts}
              onKeepMine={() => resolveConflicts(new Set())}
              onApply={resolveConflicts}
            />
          )}

          {/* Documents + privacy */}
          {documents.length > 0 && (
            <section className="mt-10 rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display text-xl">Your uploaded documents</h2>
              <ul className="mt-3 divide-y divide-border/70 text-sm">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <button
                      type="button"
                      className={cn("text-left", doc.id === activeId && "font-medium")}
                      onClick={() => setActiveId(doc.id)}
                    >
                      {doc.fileName}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {doc.processingStatus.replace(/_/g, " ")}
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground"
                      onClick={async () => {
                        await removeDocument({ data: { documentId: doc.id, deleteHistory: false } });
                        setActiveId(null);
                        await refresh();
                        toast.success("Document deleted.");
                      }}
                    >
                      <Trash2 className="size-4" /> Delete document
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5"
                onClick={async () => {
                  await wipeHistory({});
                  await refresh();
                  setProfile({ courses: [], creditsCompleted: 0 });
                  toast.success("Imported academic history deleted.");
                }}
              >
                <Trash2 className="size-4" /> Delete imported academic history
              </Button>
            </section>
          )}

          <section className="mt-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-border bg-muted/40 p-5 text-sm">
            <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              <span className="font-medium">Your information is private.</span> Your academic documents are stored
              securely and used to build your Fork profile. You control what information is saved and can delete your
              uploaded documents at any time.
            </p>
          </section>
        </>
      )}
    </ForkShell>
  );
}

/* ------------------------------------------------------------------ pieces */

function Progressing({ label }: { label: string }) {
  return (
    <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm">
      <Loader2 className="size-4 animate-spin text-primary" />
      {label}
    </div>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone?: "warn" }) {
  return (
    <span
      className={cn(
        "rounded-full border border-border bg-card px-3 py-1",
        tone === "warn" && "border-gold/50 bg-gold/10",
      )}
    >
      <span className="font-medium">{value}</span> <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

interface ConflictField {
  key: keyof ExtractedProfileFields;
  label: string;
  mine: string;
  found: string;
}

function detectConflicts(
  fields: ExtractedProfileFields,
  profile: { name: string; school: string; major: string; minor: string | null; graduationTarget: string },
): ConflictField[] {
  const pairs: { key: keyof ExtractedProfileFields; label: string; mine: string }[] = [
    { key: "name", label: "Name", mine: profile.name },
    { key: "school", label: "School", mine: profile.school },
    { key: "major", label: "Major", mine: profile.major },
    { key: "minor", label: "Minor", mine: profile.minor ?? "" },
    { key: "graduationTarget", label: "Graduation target", mine: profile.graduationTarget },
  ];

  return pairs.flatMap(({ key, label, mine }) => {
    const found = fields[key];
    if (typeof found !== "string" || !found.trim()) return [];
    if (!mine.trim() || found.trim().toLowerCase() === mine.trim().toLowerCase()) return [];
    return [{ key, label, mine, found: found.trim() }];
  });
}

function ConflictPanel({
  conflicts,
  onApply,
  onKeepMine,
}: {
  conflicts: ConflictField[];
  onApply: (chosen: Set<keyof ExtractedProfileFields>) => void;
  onKeepMine: () => void;
}) {
  const [chosen, setChosen] = useState<Set<keyof ExtractedProfileFields>>(new Set());

  const toggle = (key: keyof ExtractedProfileFields) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <section className="mt-8 rounded-2xl border border-gold/50 bg-gold/10 p-5">
      <h3 className="font-display text-xl">We found different information in your upload.</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Nothing you typed has been changed. Tick the values from your document that are correct.
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        {conflicts.map((c) => (
          <li key={String(c.key)} className="flex items-start gap-3">
            <Checkbox
              id={`conflict-${String(c.key)}`}
              checked={chosen.has(c.key)}
              onCheckedChange={() => toggle(c.key)}
              className="mt-0.5"
            />
            <Label htmlFor={`conflict-${String(c.key)}`} className="font-normal leading-relaxed">
              <span className="font-medium">{c.label}</span> — you entered{" "}
              <span className="font-medium">{c.mine}</span>, your document says{" "}
              <span className="font-medium">{c.found}</span>
            </Label>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => onApply(chosen)} disabled={chosen.size === 0}>
          Use the ticked values
        </Button>
        <Button variant="outline" onClick={onKeepMine}>
          Keep what I entered
        </Button>
      </div>
    </section>
  );
}

