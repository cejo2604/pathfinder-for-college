-- ============ shared updated_at trigger ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ catalog: courses ============
CREATE TABLE public.courses (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  credits INTEGER NOT NULL,
  prerequisites TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catalog courses are publicly readable" ON public.courses FOR SELECT USING (true);
CREATE TRIGGER courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ catalog: programs ============
CREATE TABLE public.programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('major', 'minor')),
  required_credits INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.programs TO anon;
GRANT SELECT ON public.programs TO authenticated;
GRANT ALL ON public.programs TO service_role;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Programs are publicly readable" ON public.programs FOR SELECT USING (true);
CREATE TRIGGER programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ catalog: careers ============
CREATE TABLE public.careers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  industry TEXT NOT NULL,
  description TEXT NOT NULL,
  skill_weights JSONB NOT NULL DEFAULT '[]'::jsonb,
  relevant_majors TEXT[] NOT NULL DEFAULT '{}',
  relevant_minors TEXT[] NOT NULL DEFAULT '{}',
  coursework TEXT[] NOT NULL DEFAULT '{}',
  internship_ideas TEXT[] NOT NULL DEFAULT '{}',
  portfolio_ideas TEXT[] NOT NULL DEFAULT '{}',
  entry_roles TEXT[] NOT NULL DEFAULT '{}',
  adjacent_careers TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.careers TO anon;
GRANT SELECT ON public.careers TO authenticated;
GRANT ALL ON public.careers TO service_role;
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Careers are publicly readable" ON public.careers FOR SELECT USING (true);
CREATE TRIGGER careers_updated_at BEFORE UPDATE ON public.careers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ student profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL DEFAULT '',
  degree TEXT NOT NULL DEFAULT '',
  major TEXT NOT NULL DEFAULT '',
  minor TEXT,
  year TEXT NOT NULL DEFAULT '',
  graduation_target TEXT NOT NULL DEFAULT '',
  credits_completed INTEGER NOT NULL DEFAULT 0,
  gpa NUMERIC(3,2) NOT NULL DEFAULT 0,
  interests TEXT[] NOT NULL DEFAULT '{}',
  career_interests TEXT[] NOT NULL DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  priorities TEXT[] NOT NULL DEFAULT '{}',
  goal TEXT NOT NULL DEFAULT '',
  goal_category TEXT NOT NULL DEFAULT '',
  career_id TEXT,
  courses JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage their own profile" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- create a profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ saved what-if paths ============
CREATE TABLE public.saved_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scenario_id TEXT NOT NULL,
  question TEXT NOT NULL DEFAULT '',
  path_id TEXT NOT NULL,
  path_name TEXT NOT NULL,
  program TEXT NOT NULL DEFAULT '',
  is_chosen BOOLEAN NOT NULL DEFAULT false,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX saved_paths_user_idx ON public.saved_paths (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_paths TO authenticated;
GRANT ALL ON public.saved_paths TO service_role;
ALTER TABLE public.saved_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage their own saved paths" ON public.saved_paths FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER saved_paths_updated_at BEFORE UPDATE ON public.saved_paths FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ plan progress ============
CREATE TABLE public.plan_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, action_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_actions TO authenticated;
GRANT ALL ON public.plan_actions TO service_role;
ALTER TABLE public.plan_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage their own plan progress" ON public.plan_actions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER plan_actions_updated_at BEFORE UPDATE ON public.plan_actions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ seed catalog ============
INSERT INTO public.courses (code, title, credits, prerequisites) VALUES
  ('BIOL 101', 'Principles of Biology I', 4, '{}'),
  ('BIOL 102', 'Principles of Biology II', 4, '{"BIOL 101"}'),
  ('BIOL 201', 'Genetics', 4, '{"BIOL 102"}'),
  ('BIOL 301', 'Cell & Molecular Biology', 4, '{"BIOL 201"}'),
  ('BIOL 302', 'Physiology', 4, '{"BIOL 301"}'),
  ('BIOL 410', 'Advanced Molecular Biology', 4, '{"BIOL 301"}'),
  ('BIOL 495', 'Biology Capstone', 3, '{"BIOL 302"}'),
  ('CHEM 101', 'General Chemistry I', 4, '{}'),
  ('CHEM 102', 'General Chemistry II', 4, '{"CHEM 101"}'),
  ('CHEM 261', 'Organic Chemistry I', 4, '{"CHEM 102"}'),
  ('STAT 155', 'Introduction to Statistics', 3, '{}'),
  ('STAT 320', 'Statistical Modeling', 3, '{"STAT 155"}'),
  ('PSYC 101', 'General Psychology', 3, '{}'),
  ('MATH 152', 'Calculus I', 4, '{}'),
  ('MATH 233', 'Discrete Structures', 3, '{"MATH 152"}'),
  ('COMP 110', 'Introduction to Programming', 3, '{}'),
  ('COMP 210', 'Data Structures', 4, '{"COMP 110"}'),
  ('COMP 301', 'Software Design', 3, '{"COMP 210"}'),
  ('COMP 311', 'Computer Organization', 3, '{"COMP 210"}'),
  ('COMP 410', 'Algorithms', 3, '{"COMP 210","MATH 233"}'),
  ('COMP 480', 'Machine Learning', 3, '{"COMP 210","STAT 155"}'),
  ('COMP 495', 'Computer Science Capstone', 3, '{"COMP 301"}'),
  ('HINF 210', 'Foundations of Health Informatics', 3, '{}'),
  ('HINF 320', 'Clinical Data Systems', 3, '{"HINF 210"}'),
  ('HINF 410', 'Health Data Analytics', 3, '{"HINF 320","STAT 155"}'),
  ('HINF 450', 'Health Technology Ethics & Policy', 3, '{"HINF 210"}');

INSERT INTO public.programs (id, name, kind, required_credits) VALUES
  ('bio_bs', 'Biology, B.S.', 'major', 120),
  ('cs_bs', 'Computer Science, B.S.', 'major', 120),
  ('cs_minor', 'Computer Science minor', 'minor', 18),
  ('hinf_minor', 'Health Informatics minor', 'minor', 18);

INSERT INTO public.careers (id, title, industry, description, skill_weights, relevant_majors, relevant_minors, coursework, internship_ideas, portfolio_ideas, entry_roles, adjacent_careers) VALUES
  ('healthcare_data_scientist', 'Healthcare data scientist', 'Healthcare technology',
   'Works with clinical, claims and device data to build models and analyses that support care decisions and health products.',
   '[{"skill":"programming","weight":0.25},{"skill":"data_analysis","weight":0.25},{"skill":"statistics","weight":0.2},{"skill":"health_domain","weight":0.15},{"skill":"informatics","weight":0.1},{"skill":"research","weight":0.05}]'::jsonb,
   '{"Computer Science","Biology","Statistics","Health Informatics"}',
   '{"Computer Science","Health Informatics","Statistics"}',
   '{"COMP 210","COMP 480","STAT 320","HINF 410"}',
   '{"Analytics team at a hospital system","Clinical data internship at a health-tech startup","Public health data internship"}',
   '{"Open clinical dataset analysis with a written interpretation","Readmission-risk model notebook with documented assumptions","Dashboard summarizing a public health indicator"}',
   '{"Data analyst","Clinical data analyst","Junior data scientist"}',
   '{"Health informatics analyst","Biostatistician","Clinical software engineer"}'),
  ('health_informatics_analyst', 'Health informatics analyst', 'Healthcare technology',
   'Bridges clinical teams and software systems: data standards, electronic records, workflow and reporting.',
   '[{"skill":"informatics","weight":0.3},{"skill":"health_domain","weight":0.25},{"skill":"data_analysis","weight":0.2},{"skill":"programming","weight":0.15},{"skill":"statistics","weight":0.05},{"skill":"research","weight":0.05}]'::jsonb,
   '{"Biology","Health Informatics","Computer Science"}',
   '{"Health Informatics","Computer Science"}',
   '{"HINF 210","HINF 320","HINF 410","COMP 110"}',
   '{"Health system informatics office","EHR vendor implementation team","Quality-improvement analytics group"}',
   '{"Workflow map of a clinical process with proposed data fixes","Interoperability case study using an open standard"}',
   '{"Informatics analyst","Clinical systems analyst","Reporting analyst"}',
   '{"Healthcare data scientist","Clinical product analyst","Health policy analyst"}'),
  ('biotech_research', 'Biotechnology research associate', 'Biotechnology',
   'Runs experiments and analysis in a lab or R&D setting, increasingly with computational tooling.',
   '[{"skill":"health_domain","weight":0.35},{"skill":"research","weight":0.25},{"skill":"data_analysis","weight":0.15},{"skill":"statistics","weight":0.15},{"skill":"programming","weight":0.05},{"skill":"informatics","weight":0.05}]'::jsonb,
   '{"Biology","Biochemistry"}',
   '{"Computer Science","Statistics"}',
   '{"BIOL 301","BIOL 410","CHEM 261","STAT 320"}',
   '{"Academic research lab","Biotech company R&D internship"}',
   '{"Research poster","Reproducible analysis of experimental data"}',
   '{"Research associate","Lab technician","QC analyst"}',
   '{"Bioinformatics analyst","Clinical research coordinator"}');
