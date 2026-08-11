import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Confidence, CourseStatus } from "./import.server";

export const BUCKET = "academic-documents";

export interface AcademicDocument {
  id: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  uploadedAt: string;
  processingStatus: "uploaded" | "processing" | "ready_for_review" | "confirmed" | "failed";
  extractionError: string | null;
  extractedProfile: ExtractedProfileFields;
}

export interface ExtractedProfileFields {
  name?: string | null;
  school?: string | null;
  major?: string | null;
  minor?: string | null;
  graduationTarget?: string | null;
  creditsCompleted?: number | null;
}

export interface StudentCourseRow {
  id: string;
  courseId: string | null;
  extractedCode: string;
  extractedTitle: string;
  matchedTitle: string | null;
  term: string;
  grade: string | null;
  credits: number;
  status: CourseStatus;
  waitlistPosition: number | null;
  confidence: Confidence;
  verifiedByStudent: boolean;
  verifiedAt: string | null;
  sourceDocumentId: string | null;
}

interface CourseDbRow {
  id: string;
  course_id: string | null;
  extracted_code: string;
  extracted_title: string;
  term: string;
  grade: string | null;
  credits: number;
  status: string;
  waitlist_position: number | null;
  confidence: string;
  verified_by_student: boolean;
  verified_at: string | null;
  source_document_id: string | null;
  courses?: { title: string } | null;
}

const COURSE_SELECT =
  "id, course_id, extracted_code, extracted_title, term, grade, credits, status, waitlist_position, confidence, verified_by_student, verified_at, source_document_id, courses(title)";

const toCourse = (row: CourseDbRow): StudentCourseRow => ({
  id: row.id,
  courseId: row.course_id,
  extractedCode: row.extracted_code,
  extractedTitle: row.extracted_title,
  matchedTitle: row.courses?.title ?? null,
  term: row.term,
  grade: row.grade,
  credits: row.credits,
  status: row.status as CourseStatus,
  waitlistPosition: row.waitlist_position,
  confidence: row.confidence as Confidence,
  verifiedByStudent: row.verified_by_student,
  verifiedAt: row.verified_at,
  sourceDocumentId: row.source_document_id,
});

interface DocumentDbRow {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  uploaded_at: string;
  processing_status: string;
  extraction_error: string | null;
  extracted_profile: unknown;
}

const toDocument = (row: DocumentDbRow): AcademicDocument => ({
  id: row.id,
  fileName: row.file_name,
  fileType: row.file_type,
  storagePath: row.storage_path,
  uploadedAt: row.uploaded_at,
  processingStatus: row.processing_status as AcademicDocument["processingStatus"],
  extractionError: row.extraction_error,
  extractedProfile: (row.extracted_profile ?? {}) as ExtractedProfileFields,
});

const DOC_SELECT =
  "id, file_name, file_type, storage_path, uploaded_at, processing_status, extraction_error, extracted_profile";

/** Documents and structured academic history for the signed-in student. */
export const loadAcademicHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [docs, courses] = await Promise.all([
      supabase
        .from("academic_documents")
        .select(DOC_SELECT)
        .eq("student_id", userId)
        .order("uploaded_at", { ascending: false }),
      supabase.from("student_courses").select(COURSE_SELECT).eq("student_id", userId).order("term"),
    ]);
    if (docs.error) throw new Error(docs.error.message);
    if (courses.error) throw new Error(courses.error.message);
    return {
      documents: (docs.data as DocumentDbRow[]).map(toDocument),
      courses: (courses.data as unknown as CourseDbRow[]).map(toCourse),
    };
  });

/** Called after the browser uploads the file into the student's own folder. */
export const registerDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fileName: string; fileType: string; storagePath: string }) => ({
    fileName: String(input.fileName).slice(0, 200),
    fileType: input.fileType === "csv" ? "csv" : "pdf",
    storagePath: String(input.storagePath).slice(0, 400),
  }))
  .handler(async ({ data, context }) => {
    if (!data.storagePath.startsWith(`${context.userId}/`)) throw new Error("Invalid upload path");
    const { data: row, error } = await context.supabase
      .from("academic_documents")
      .insert({
        student_id: context.userId,
        file_name: data.fileName,
        file_type: data.fileType,
        storage_path: data.storagePath,
        processing_status: "uploaded",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { documentId: row.id };
  });

/**
 * Reads the stored file, extracts what is printed in it, matches every course
 * against the institutional catalog and saves the result as unverified history.
 */
export const processDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { documentId: string }) => ({ documentId: String(input.documentId) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { extractFromCsv, extractFromPdf, matchAgainstCatalog } = await import("./import.server");

    const { data: docRow, error: docError } = await supabase
      .from("academic_documents")
      .select(DOC_SELECT)
      .eq("id", data.documentId)
      .eq("student_id", userId)
      .maybeSingle();
    if (docError) throw new Error(docError.message);
    if (!docRow) throw new Error("Document not found");
    const doc = toDocument(docRow as DocumentDbRow);

    await supabase
      .from("academic_documents")
      .update({ processing_status: "processing", extraction_error: null })
      .eq("id", doc.id);

    const fail = async (message: string) => {
      await supabase
        .from("academic_documents")
        .update({ processing_status: "failed", extraction_error: message.slice(0, 500) })
        .eq("id", doc.id);
      return { ok: false as const, error: message };
    };

    try {
      const file = await supabase.storage.from(BUCKET).download(doc.storagePath);
      if (file.error || !file.data) return await fail("The uploaded file could not be read.");
      const bytes = Buffer.from(await file.data.arrayBuffer());
      if (!bytes.length) return await fail("The uploaded file is empty.");

      const record =
        doc.fileType === "csv"
          ? extractFromCsv(bytes.toString("utf8"))
          : await extractFromPdf(doc.fileName, "application/pdf", bytes.toString("base64"));

      // Course definitions always come from the catalog, never from the model.
      const catalog = await supabase.from("courses").select("code, title, credits");
      if (catalog.error) throw new Error(catalog.error.message);
      const matched = matchAgainstCatalog(record.courses, catalog.data ?? []);

      // Re-importing the same document replaces its previous extraction.
      await supabase.from("student_courses").delete().eq("student_id", userId).eq("source_document_id", doc.id);

      if (matched.length) {
        const { error: insertError } = await supabase.from("student_courses").insert(
          matched.map((c) => ({
            student_id: userId,
            course_id: c.courseId,
            extracted_code: c.code,
            extracted_title: c.matchedTitle ?? c.title,
            term: c.term,
            grade: c.grade,
            credits: c.credits,
            status: c.status,
            waitlist_position: c.waitlistPosition,
            confidence: c.confidence,
            source_document_id: doc.id,
            verified_by_student: false,
          })),
        );
        if (insertError) throw new Error(insertError.message);
      }

      const extractedProfile: ExtractedProfileFields = {
        name: record.name,
        school: record.school,
        major: record.major,
        minor: record.minor,
        graduationTarget: record.graduationTarget,
        creditsCompleted: record.creditsCompleted,
      };

      await supabase
        .from("academic_documents")
        .update({
          processing_status: "ready_for_review",
          extraction_error: null,
          extracted_profile: extractedProfile as never,
        })
        .eq("id", doc.id);

      return { ok: true as const, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "This document could not be read.";
      console.error("Academic import failed", message);
      return await fail(message);
    }
  });

export interface CoursePatch {
  courseId?: string | null;
  extractedCode?: string;
  extractedTitle?: string;
  term?: string;
  grade?: string | null;
  credits?: number;
  status?: CourseStatus;
  waitlistPosition?: number | null;
}

const toDbPatch = (patch: CoursePatch) => {
  const out: Record<string, unknown> = {};
  if ("courseId" in patch) out["course_id"] = patch.courseId ?? null;
  if (patch.extractedCode !== undefined) out["extracted_code"] = patch.extractedCode.slice(0, 20).toUpperCase();
  if (patch.extractedTitle !== undefined) out["extracted_title"] = patch.extractedTitle.slice(0, 120);
  if (patch.term !== undefined) out["term"] = patch.term.slice(0, 40);
  if ("grade" in patch) out["grade"] = patch.grade || null;
  if (patch.credits !== undefined) out["credits"] = Math.max(0, Math.min(24, Math.round(patch.credits)));
  if (patch.status !== undefined) out["status"] = patch.status;
  if ("waitlistPosition" in patch) out["waitlist_position"] = patch.waitlistPosition ?? null;
  return out;
};

/** A student edit is itself a verification of that row. */
export const updateCourseRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; patch: CoursePatch }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("student_courses")
      .update({
        ...toDbPatch(data.patch),
        confidence: "high",
        verified_by_student: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("student_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addCourseRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { documentId: string | null; patch: CoursePatch }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("student_courses")
      .insert({
        student_id: context.userId,
        source_document_id: data.documentId,
        status: "completed",
        ...toDbPatch(data.patch),
        confidence: "high",
        verified_by_student: true,
        verified_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteCourseRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("student_courses")
      .delete()
      .eq("id", data.id)
      .eq("student_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * The student confirms the record. Only after this is the history treated as
 * authoritative simulation input, and the credit total is summed here from the
 * confirmed rows rather than taken from the document.
 */
export const confirmImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { documentId: string }) => ({ documentId: String(input.documentId) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const now = new Date().toISOString();

    const { error: verifyError } = await supabase
      .from("student_courses")
      .update({ verified_by_student: true, verified_at: now })
      .eq("student_id", userId)
      .eq("source_document_id", data.documentId);
    if (verifyError) throw new Error(verifyError.message);

    const { error: docError } = await supabase
      .from("academic_documents")
      .update({ processing_status: "confirmed", confirmed_at: now })
      .eq("id", data.documentId)
      .eq("student_id", userId);
    if (docError) throw new Error(docError.message);

    const { data: rows, error } = await supabase
      .from("student_courses")
      .select(COURSE_SELECT)
      .eq("student_id", userId)
      .eq("verified_by_student", true);
    if (error) throw new Error(error.message);

    const courses = (rows as unknown as CourseDbRow[]).map(toCourse);
    const creditsCompleted = courses
      .filter((c) => c.status === "completed")
      .reduce((sum, c) => sum + (c.credits || 0), 0);

    return { courses, creditsCompleted };
  });

export const deleteAcademicDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { documentId: string; deleteHistory: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: doc } = await supabase
      .from("academic_documents")
      .select("storage_path")
      .eq("id", data.documentId)
      .eq("student_id", userId)
      .maybeSingle();
    if (!doc) return { ok: true };

    if (!data.deleteHistory) {
      // Keep the verified history but detach it from the deleted file.
      await supabase
        .from("student_courses")
        .update({ source_document_id: null })
        .eq("student_id", userId)
        .eq("source_document_id", data.documentId);
    }

    await supabase.storage.from(BUCKET).remove([doc.storage_path]);
    const { error } = await supabase
      .from("academic_documents")
      .delete()
      .eq("id", data.documentId)
      .eq("student_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Removes every imported course record, leaving uploaded files untouched. */
export const deleteImportedHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("student_courses")
      .delete()
      .eq("student_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
