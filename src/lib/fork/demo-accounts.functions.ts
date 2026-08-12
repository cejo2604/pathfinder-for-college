import { createServerFn } from "@tanstack/react-start";

import { demoStudentById } from "./data";
import { demoAccountById } from "./demo-accounts";

/**
 * Makes sure a demo student's dedicated login exists and its saved profile
 * matches that student's record. Demo logins only — never used for real users.
 */
export const ensureDemoAccount = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const account = demoAccountById(data.id);
    const student = demoStudentById(data.id);
    if (!account || !student) throw new Error("Unknown demo student");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Create on first use; an existing address just keeps its account.
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { name: student.profile.name },
    });
    let userId = created?.user?.id ?? null;
    if (createError && !/already/i.test(createError.message)) throw new Error(createError.message);

    if (!userId) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      userId = list?.users.find((u) => u.email === account.email)?.id ?? null;
      // Keep the shown password working even if the account already existed.
      if (userId) await supabaseAdmin.auth.admin.updateUserById(userId, { password: account.password });
    }
    if (!userId) throw new Error("Could not prepare the demo login");

    const p = student.profile;
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        name: p.name,
        school: p.school,
        degree: p.degree,
        major: p.major,
        minor: p.minor,
        year: p.year,
        graduation_target: p.graduationTarget,
        credits_completed: p.creditsCompleted,
        gpa: p.gpa,
        interests: p.interests,
        career_interests: p.careerInterests,
        skills: p.skills,
        priorities: p.priorities,
        goal: p.goal,
        goal_category: p.goalCategory,
        courses: p.courses as unknown as never,
      },
      { onConflict: "id" },
    );
    if (profileError) throw new Error(profileError.message);

    return { email: account.email, password: account.password };
  });
