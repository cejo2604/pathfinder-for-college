import { useMemo, useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CAREERS, DEFAULT_CAREER_ID, courseByCode } from "@/lib/fork/data";
import type { Course, StudentProfile } from "@/lib/fork/data";

type Status = "completed" | "in_progress" | "todo";

interface RelevantCourse {
  course: Course;
  status: Status;
  recommended: boolean;
  missingPrereqs: string[];
}

const STATUS_LABEL: Record<Status, string> = {
  completed: "Completed",
  in_progress: "In progress",
  todo: "Not taken yet",
};

const STATUS_CLASS: Record<Status, string> = {
  completed: "border-mint/50 bg-mint/10 text-mint-foreground",
  in_progress: "border-gold/50 bg-gold/10 text-foreground",
  todo: "border-border bg-muted text-muted-foreground",
};

/** Recommended coursework for a career, plus the prerequisites it depends on. */
function buildRelevantCourses(careerId: string, profile: StudentProfile): RelevantCourse[] {
  const career = CAREERS.find((c) => c.id === careerId) ?? CAREERS.find((c) => c.id === DEFAULT_CAREER_ID);
  if (!career) return [];

  const statusOf = (code: string): Status => {
    const record = profile.courses.find((c) => c.code === code);
    if (!record) return "todo";
    return record.status === "completed" ? "completed" : "in_progress";
  };

  const collected = new Map<string, boolean>(); // code -> directly recommended
  const walk = (code: string, direct: boolean) => {
    if (collected.has(code)) {
      if (direct) collected.set(code, true);
      return;
    }
    collected.set(code, direct);
    for (const prereq of courseByCode(code)?.prerequisites ?? []) walk(prereq, false);
  };
  for (const code of career.coursework) walk(code, true);

  return [...collected.entries()]
    .map(([code, recommended]) => {
      const course = courseByCode(code) ?? { code, title: code, credits: 0, prerequisites: [] };
      const status = statusOf(code);
      return {
        course,
        status,
        recommended,
        missingPrereqs: course.prerequisites.filter((p) => statusOf(p) === "todo"),
      };
    })
    .sort((a, b) => {
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
      const order: Status[] = ["todo", "in_progress", "completed"];
      const diff = order.indexOf(a.status) - order.indexOf(b.status);
      return diff !== 0 ? diff : a.course.code.localeCompare(b.course.code);
    });
}

export function RelevantCourses({
  careerId,
  profile,
  defaultOpen = false,
  className,
}: {
  careerId: string;
  profile: StudentProfile;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rows = useMemo(() => buildRelevantCourses(careerId, profile), [careerId, profile]);
  const career = CAREERS.find((c) => c.id === careerId) ?? CAREERS.find((c) => c.id === DEFAULT_CAREER_ID);

  if (!career || rows.length === 0) return null;

  const remaining = rows.filter((r) => r.status === "todo");
  const remainingCredits = remaining.reduce((sum, r) => sum + r.course.credits, 0);

  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl">
            <BookOpen className="size-5 text-primary" /> Courses relevant to {career.title.toLowerCase()}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {remaining.length} of {rows.length} still to take · about {remainingCredits} credits, including
            prerequisites.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide courses" : "Show relevant courses"}
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </Button>
      </div>

      {open && (
        <ul className="mt-5 space-y-2">
          {rows.map((row) => (
            <li
              key={row.course.code}
              className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-xl border border-border/70 bg-background px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-[0.975rem]">
                  <span className="font-medium">{row.course.code}</span>
                  {row.course.title !== row.course.code && (
                    <span className="text-muted-foreground"> — {row.course.title}</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {row.course.credits > 0 ? `${row.course.credits} credits · ` : ""}
                  {row.recommended ? "Recommended for this career" : "Prerequisite"}
                  {row.status === "todo" && row.missingPrereqs.length > 0
                    ? ` · needs ${row.missingPrereqs.join(", ")} first`
                    : ""}
                </p>
              </div>
              <span className={cn("rounded-full border px-2.5 py-0.5 text-xs", STATUS_CLASS[row.status])}>
                {STATUS_LABEL[row.status]}
              </span>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          Fork estimate — drawn from the course catalog and the coursework this career direction usually asks for. Confirm
          requirements with your advisor.
        </p>
      )}
    </section>
  );
}
