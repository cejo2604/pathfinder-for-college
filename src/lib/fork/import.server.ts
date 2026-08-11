/**
 * Server-only academic-document extraction.
 *
 * Rules Fork never breaks here:
 *  - The model may only read the document. It never invents a course that is
 *    not printed there, and it never produces a degree requirement, tuition
 *    figure or graduation calculation.
 *  - Course definitions come from the institutional catalog in the database.
 *    Extracted codes are matched against it; unmatched codes stay unresolved.
 */

export type Confidence = "high" | "medium" | "low" | "unknown";
export type CourseStatus = "completed" | "enrolled" | "planned" | "withdrawn" | "waitlisted";

export interface ExtractedCourse {
  code: string;
  title: string;
  term: string;
  credits: number;
  grade: string | null;
  status: CourseStatus;
  waitlistPosition: number | null;
  confidence: Confidence;
}

export interface ExtractedRecord {
  name: string | null;
  school: string | null;
  major: string | null;
  minor: string | null;
  graduationTarget: string | null;
  creditsCompleted: number | null;
  courses: ExtractedCourse[];
}

export interface CatalogCourse {
  code: string;
  title: string;
  credits: number;
}

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DOCUMENT_MODEL = "google/gemini-3.6-flash";

const STATUSES: CourseStatus[] = ["completed", "enrolled", "planned", "withdrawn", "waitlisted"];
const CONFIDENCES: Confidence[] = ["high", "medium", "low", "unknown"];

const INSTRUCTIONS = [
  "You read a college transcript or degree audit and return only what is printed in it.",
  "Return strict JSON with this shape and nothing else (no prose, no markdown fences):",
  '{"name":string|null,"school":string|null,"major":string|null,"minor":string|null,',
  '"graduationTarget":string|null,"creditsCompleted":number|null,',
  '"courses":[{"code":string,"title":string,"term":string,"credits":number,"grade":string|null,',
  '"status":"completed"|"enrolled"|"planned"|"withdrawn"|"waitlisted","waitlistPosition":number|null,',
  '"confidence":"high"|"medium"|"low"}]}',
  "Hard rules: never invent a course, a credit value, a grade or a term.",
  "If a field is not printed in the document, use null (or 0 for credits) and lower the confidence.",
  "Do not compute graduation dates, tuition, remaining requirements or GPA.",
  "Preserve waitlist information, including a waitlist position when one is printed.",
  "Do not extract addresses, ID numbers, birthdates or any personal data beyond name, school and program.",
].join(" ");

/* ------------------------------------------------------------------ helpers */

export const normalizeCode = (raw: string) =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();

const clampStatus = (value: unknown): CourseStatus => {
  const v = String(value ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (v.startsWith("wait")) return "waitlisted";
  if (v.startsWith("withdraw") || v === "w") return "withdrawn";
  if (v.startsWith("plan") || v.startsWith("regist")) return "planned";
  if (v.startsWith("enroll") || v.startsWith("inprogress") || v.startsWith("current")) return "enrolled";
  if (v.startsWith("complete") || v.startsWith("pass") || v.startsWith("earn")) return "completed";
  return STATUSES.includes(v as CourseStatus) ? (v as CourseStatus) : "completed";
};

const clampConfidence = (value: unknown): Confidence => {
  const v = String(value ?? "").toLowerCase();
  return CONFIDENCES.includes(v as Confidence) ? (v as Confidence) : "unknown";
};

const toNumber = (value: unknown): number => {
  const n = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const cleanText = (value: unknown, max = 160): string | null => {
  const text = String(value ?? "").trim();
  if (!text || text.toLowerCase() === "null" || text === "—") return null;
  return text.slice(0, max);
};

/* ---------------------------------------------------------------- PDF (AI) */

export async function extractFromPdf(fileName: string, mimeType: string, base64: string): Promise<ExtractedRecord> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Document reading is not configured");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: DOCUMENT_MODEL,
      messages: [
        { role: "system", content: INSTRUCTIONS },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the academic history printed in this document." },
            {
              type: "file",
              file: { filename: fileName, file_data: `data:${mimeType || "application/pdf"};base64,${base64}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`Document extraction failed [${response.status}]: ${detail}`);
    if (response.status === 429) throw new Error("Document reading is busy right now — try again in a moment.");
    if (response.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    throw new Error(`Could not read this document (${response.status}).`);
  }

  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const text = payload.choices?.[0]?.message?.content ?? "";
  return parseExtractionJson(text);
}

export function parseExtractionJson(text: string): ExtractedRecord {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The document could not be read as an academic record.");
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new Error("The document could not be read as an academic record.");
  }

  const courses = Array.isArray(raw["courses"]) ? (raw["courses"] as Record<string, unknown>[]) : [];
  return {
    name: cleanText(raw["name"]),
    school: cleanText(raw["school"]),
    major: cleanText(raw["major"], 80),
    minor: cleanText(raw["minor"], 80),
    graduationTarget: cleanText(raw["graduationTarget"], 40),
    creditsCompleted: raw["creditsCompleted"] == null ? null : Math.round(toNumber(raw["creditsCompleted"])),
    courses: courses.slice(0, 120).map((c) => ({
      code: (cleanText(c["code"], 20) ?? "").toUpperCase(),
      title: cleanText(c["title"], 120) ?? "",
      term: cleanText(c["term"], 40) ?? "",
      credits: Math.round(toNumber(c["credits"])),
      grade: cleanText(c["grade"], 8),
      status: clampStatus(c["status"]),
      waitlistPosition: c["waitlistPosition"] == null ? null : Math.round(toNumber(c["waitlistPosition"])) || null,
      confidence: clampConfidence(c["confidence"]),
    })),
  };
}

/* ------------------------------------------------------ CSV (deterministic) */

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cell);
      cell = "";
    } else cell += ch;
  }
  out.push(cell);
  return out.map((c) => c.trim());
}

const HEADER_ALIASES: Record<string, string[]> = {
  code: ["code", "course", "course code", "course_code", "subject", "catalog"],
  title: ["title", "course title", "name", "course name", "description"],
  term: ["term", "semester", "session", "period"],
  credits: ["credits", "credit", "hours", "credit hours", "units"],
  grade: ["grade", "final grade", "mark"],
  status: ["status", "state", "enrollment status", "result"],
  waitlist: ["waitlist", "waitlist position", "waitlist_position", "position"],
};

/** CSV is parsed with no model at all — the columns are read literally. */
export function extractFromCsv(text: string): ExtractedRecord {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("This CSV has no course rows.");

  const header = splitCsvLine(lines[0] as string).map((h) => h.toLowerCase());
  const indexOf = (field: keyof typeof HEADER_ALIASES) => {
    const aliases = HEADER_ALIASES[field] as string[];
    return header.findIndex((h) => aliases.includes(h));
  };

  const idx = {
    code: indexOf("code"),
    title: indexOf("title"),
    term: indexOf("term"),
    credits: indexOf("credits"),
    grade: indexOf("grade"),
    status: indexOf("status"),
    waitlist: indexOf("waitlist"),
  };
  if (idx.code < 0) throw new Error("This CSV needs a course code column (for example \"Course\" or \"Code\").");

  const cell = (row: string[], i: number) => (i >= 0 ? (row[i] ?? "") : "");

  const courses: ExtractedCourse[] = [];
  for (const line of lines.slice(1)) {
    const row = splitCsvLine(line);
    const code = cell(row, idx.code).toUpperCase();
    if (!code) continue;
    const waitlistRaw = cell(row, idx.waitlist);
    courses.push({
      code: code.slice(0, 20),
      title: cell(row, idx.title).slice(0, 120),
      term: cell(row, idx.term).slice(0, 40),
      credits: Math.round(toNumber(cell(row, idx.credits))),
      grade: cleanText(cell(row, idx.grade), 8),
      status: idx.status >= 0 ? clampStatus(cell(row, idx.status)) : "completed",
      waitlistPosition: waitlistRaw ? Math.round(toNumber(waitlistRaw)) || null : null,
      // Every value came straight from a labelled column, so nothing is guessed.
      confidence: "high",
    });
  }

  if (!courses.length) throw new Error("No course rows were found in this CSV.");
  return { name: null, school: null, major: null, minor: null, graduationTarget: null, creditsCompleted: null, courses };
}

/* ------------------------------------------------------- catalog matching */

export interface MatchedCourse extends ExtractedCourse {
  courseId: string | null;
  matchedTitle: string | null;
}

/** Extracted codes are matched against the catalog; near-misses stay unresolved. */
export function matchAgainstCatalog(courses: ExtractedCourse[], catalog: CatalogCourse[]): MatchedCourse[] {
  const byCode = new Map(catalog.map((c) => [normalizeCode(c.code), c]));
  const byTitle = new Map(catalog.map((c) => [c.title.toLowerCase().trim(), c]));

  return courses.map((course) => {
    const exact = byCode.get(normalizeCode(course.code));
    const byName = exact ? undefined : byTitle.get(course.title.toLowerCase().trim());
    const match = exact ?? byName;

    if (!match) return { ...course, courseId: null, matchedTitle: null, confidence: "low" as Confidence };

    return {
      ...course,
      courseId: match.code,
      matchedTitle: match.title,
      credits: course.credits > 0 ? course.credits : match.credits,
      // A code match is authoritative; a title-only match still needs a look.
      confidence: exact ? course.confidence : ("medium" as Confidence),
    };
  });
}
