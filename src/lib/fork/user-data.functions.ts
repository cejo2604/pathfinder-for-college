import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Priority, StudentCourse, StudentProfile } from "./data";

export interface SavedPathRow {
  id: string;
  scenarioId: string;
  question: string;
  pathId: string;
  pathName: string;
  program: string;
  isChosen: boolean;
  createdAt: string;
}

export interface ForkUserData {
  profile: StudentProfile | null;
  careerId: string | null;
  doneActions: string[];
  savedPaths: SavedPathRow[];
}

interface ProfileRow {
  name: string;
  school: string;
  degree: string;
  major: string;
  minor: string | null;
  year: string;
  graduation_target: string;
  credits_completed: number;
  gpa: number | string;
  interests: string[] | null;
  career_interests: string[] | null;
  skills: string[] | null;
  priorities: string[] | null;
  goal: string;
  goal_category: string;
  career_id: string | null;
  courses: unknown;
}

const toProfile = (row: ProfileRow): StudentProfile => ({
  name: row.name,
  school: row.school,
  degree: row.degree,
  major: row.major,
  minor: row.minor,
  year: row.year,
  graduationTarget: row.graduation_target,
  creditsCompleted: row.credits_completed,
  gpa: Number(row.gpa),
  interests: row.interests ?? [],
  careerInterests: row.career_interests ?? [],
  skills: row.skills ?? [],
  priorities: (row.priorities ?? []) as Priority[],
  goal: row.goal,
  goalCategory: row.goal_category,
  courses: (Array.isArray(row.courses) ? row.courses : []) as StudentCourse[],
});

/** Everything the signed-in student has saved. */
export const loadForkData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ForkUserData> => {
    const { supabase, userId } = context;

    const [profileRes, actionsRes, pathsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("plan_actions").select("action_key").eq("user_id", userId),
      supabase
        .from("saved_paths")
        .select("id, scenario_id, question, path_id, path_name, program, is_chosen, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    const row = profileRes.data as ProfileRow | null;
    const hasProfile = Boolean(row && (row.name || row.major || row.school));

    return {
      profile: row && hasProfile ? toProfile(row) : null,
      careerId: row?.career_id ?? null,
      doneActions: (actionsRes.data ?? []).map((a) => a.action_key),
      savedPaths: (pathsRes.data ?? []).map((p) => ({
        id: p.id,
        scenarioId: p.scenario_id,
        question: p.question,
        pathId: p.path_id,
        pathName: p.path_name,
        program: p.program,
        isChosen: p.is_chosen,
        createdAt: p.created_at,
      })),
    };
  });

export const saveForkProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { profile: StudentProfile; careerId: string }) => input)
  .handler(async ({ data, context }) => {
    const { profile, careerId } = data;
    const { error } = await context.supabase.from("profiles").upsert(
      {
        id: context.userId,
        name: profile.name,
        school: profile.school,
        degree: profile.degree,
        major: profile.major,
        minor: profile.minor,
        year: profile.year,
        graduation_target: profile.graduationTarget,
        credits_completed: profile.creditsCompleted,
        gpa: profile.gpa,
        interests: profile.interests,
        career_interests: profile.careerInterests,
        skills: profile.skills,
        priorities: profile.priorities,
        goal: profile.goal,
        goal_category: profile.goalCategory,
        career_id: careerId,
        courses: profile.courses,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setPlanAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string; done: boolean }) => input)
  .handler(async ({ data, context }) => {
    if (data.done) {
      const { error } = await context.supabase
        .from("plan_actions")
        .upsert({ user_id: context.userId, action_key: data.key }, { onConflict: "user_id,action_key" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("plan_actions")
        .delete()
        .eq("user_id", context.userId)
        .eq("action_key", data.key);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const savePath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      scenarioId: string;
      question: string;
      pathId: string;
      pathName: string;
      program: string;
      snapshot: unknown;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("saved_paths").update({ is_chosen: false }).eq("user_id", userId);
    const { data: row, error } = await supabase
      .from("saved_paths")
      .insert({
        user_id: userId,
        scenario_id: data.scenarioId,
        question: data.question,
        path_id: data.pathId,
        path_name: data.pathName,
        program: data.program,
        is_chosen: true,
        snapshot: data.snapshot as never,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteSavedPath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("saved_paths")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
