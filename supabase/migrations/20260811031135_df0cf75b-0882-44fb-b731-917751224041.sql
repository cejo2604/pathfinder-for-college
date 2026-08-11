-- Academic documents ---------------------------------------------------------
CREATE TABLE public.academic_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  processing_status text NOT NULL DEFAULT 'uploaded',
  extraction_error text,
  extracted_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academic_documents_status_check
    CHECK (processing_status IN ('uploaded','processing','ready_for_review','confirmed','failed'))
);

CREATE INDEX academic_documents_student_idx ON public.academic_documents (student_id, uploaded_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_documents TO authenticated;
GRANT ALL ON public.academic_documents TO service_role;

ALTER TABLE public.academic_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage their own academic documents"
  ON public.academic_documents FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE TRIGGER academic_documents_updated_at
  BEFORE UPDATE ON public.academic_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Structured academic history ------------------------------------------------
CREATE TABLE public.student_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  course_id text REFERENCES public.courses(code) ON DELETE SET NULL,
  extracted_code text NOT NULL DEFAULT '',
  extracted_title text NOT NULL DEFAULT '',
  term text NOT NULL DEFAULT '',
  grade text,
  credits integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  waitlist_position integer,
  source_document_id uuid REFERENCES public.academic_documents(id) ON DELETE CASCADE,
  confidence text NOT NULL DEFAULT 'unknown',
  verified_by_student boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_courses_status_check
    CHECK (status IN ('completed','enrolled','planned','withdrawn','waitlisted')),
  CONSTRAINT student_courses_confidence_check
    CHECK (confidence IN ('high','medium','low','unknown'))
);

CREATE INDEX student_courses_student_idx ON public.student_courses (student_id);
CREATE INDEX student_courses_document_idx ON public.student_courses (source_document_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_courses TO authenticated;
GRANT ALL ON public.student_courses TO service_role;

ALTER TABLE public.student_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage their own course records"
  ON public.student_courses FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE TRIGGER student_courses_updated_at
  BEFORE UPDATE ON public.student_courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Private storage: each student only touches their own folder -----------------
CREATE POLICY "Students read their own academic documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'academic-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students upload their own academic documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'academic-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students delete their own academic documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'academic-documents' AND auth.uid()::text = (storage.foldername(name))[1]);