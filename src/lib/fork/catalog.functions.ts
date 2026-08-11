import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import type { Career, Course, DegreeProgram, SkillKey } from "./data";

export interface ForkCatalog {
  courses: Course[];
  programs: DegreeProgram[];
  careers: Career[];
}

/**
 * Institutional catalog, loaded from the database.
 *
 * Public read-only data: a narrow anon SELECT policy covers courses, programs
 * and careers, so a publishable-key client is enough.
 */
export const getCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<ForkCatalog> => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) return { courses: [], programs: [], careers: [] };

  const supabase = createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });

  const [courses, programs, careers] = await Promise.all([
    supabase.from("courses").select("code, title, credits, prerequisites").order("code"),
    supabase.from("programs").select("id, name, kind, required_credits").order("id"),
    supabase.from("careers").select("*").order("id"),
  ]);

  return {
    courses: (courses.data ?? []).map((row) => ({
      code: row.code,
      title: row.title,
      credits: row.credits,
      prerequisites: row.prerequisites ?? [],
    })),
    programs: (programs.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      kind: row.kind as DegreeProgram["kind"],
      requiredCredits: row.required_credits,
    })),
    careers: (careers.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      industry: row.industry,
      description: row.description,
      skillWeights: (row.skill_weights as { skill: SkillKey; weight: number }[] | null) ?? [],
      relevantMajors: row.relevant_majors ?? [],
      relevantMinors: row.relevant_minors ?? [],
      coursework: row.coursework ?? [],
      internshipIdeas: row.internship_ideas ?? [],
      portfolioIdeas: row.portfolio_ideas ?? [],
      entryRoles: row.entry_roles ?? [],
      adjacentCareers: row.adjacent_careers ?? [],
    })) as Career[],
  };
});
