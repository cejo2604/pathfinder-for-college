import { ExternalLink, FileSpreadsheet, FileText, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Guided download steps for the linked school. Fork never signs into a student
 * portal — these are the exact steps for getting the file, followed by a
 * one-click hand-off into extraction.
 */

type Steps = { portal: string; steps: string[] };

const PORTAL_RULES: { match: RegExp; portal: string; steps: string[] }[] = [
  {
    match: /(university of north carolina|unc|state university|university of|college of)/i,
    portal: "ConnectCarolina / Student Center (PeopleSoft)",
    steps: [
      "Sign in to your student portal and open Student Center.",
      "Under Academics, choose “Unofficial Transcript” or “View Unofficial Transcript”.",
      "Pick the report type for your career and submit.",
      "Save the generated PDF to this device.",
    ],
  },
  {
    match: /.*/,
    portal: "your student portal",
    steps: [
      "Sign in to your student portal (Banner, PeopleSoft or Workday).",
      "Open Academics → Student Records → Unofficial Transcript or Degree Audit.",
      "Generate the report and save it as a PDF.",
      "If your portal offers an export, a course-list CSV works too.",
    ],
  },
];

const stepsFor = (school: string): Steps => {
  const rule = PORTAL_RULES.find((r) => r.match.test(school)) ?? PORTAL_RULES[PORTAL_RULES.length - 1]!;
  return { portal: rule.portal, steps: rule.steps };
};

export function TranscriptGuide({
  school,
  disabled,
  onPick,
}: {
  school: string;
  disabled?: boolean;
  onPick: (type: "pdf" | "csv") => void;
}) {
  const { portal, steps } = stepsFor(school);

  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-5 lg:max-w-3xl">
      <div className="flex items-start gap-3">
        <ListChecks className="mt-0.5 size-5 text-primary" />
        <div className="flex-1">
          <h2 className="font-medium">Get your transcript from {school}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fork can't sign into {portal} for you — it never asks for your portal password. These are the fastest steps,
            and the file is read and confirmed automatically once you choose it.
          </p>

          <ol className="mt-4 space-y-2 text-sm">
            {steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button className="gap-1.5" disabled={disabled} onClick={() => onPick("pdf")}>
              <FileText className="size-4" /> Choose transcript PDF
            </Button>
            <Button variant="outline" className="gap-1.5" disabled={disabled} onClick={() => onPick("csv")}>
              <FileSpreadsheet className="size-4" /> Choose course CSV
            </Button>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${school} unofficial transcript student portal`)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Find my portal <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
