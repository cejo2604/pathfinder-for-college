# Fork — Student Future Path Simulator

Build Fork as a decision simulator: a student's current academic position, a future goal, branching alternative paths, side-by-side tradeoffs, and a semester roadmap with next actions.

Scope for this build: all of P0 plus the P1 items that make the demo whole (career page, saved scenarios, auth, action items, mobile). No P2 work.

**Governing priority:** the What-If experience wins every tradeoff. Whenever added functionality would compete with the depth, speed, clarity, or polish of the What-If input → branching visualization → path cards → tradeoffs → why-this-path loop, that loop gets the time and the extra feature gets cut or simplified. Career page, auth/persistence, and custom-scenario breadth are all droppable in service of it.

## Experience

**Landing (`/`)** — "See where your choices lead." Animated branching-path graphic (YOU → Stay / Change / Combine, with graduation dates and costs), primary CTA "Explore My Future", secondary "See an Example", and a prominent **Try a Demo Student** button that loads Maya Rodriguez with zero data entry.

**Profile (`/profile`)** — academic facts (school, degree, major/minor, year, graduation target, credits, GPA, completed + current courses), interests, career interests, skills, and a drag-to-rank priorities list (graduate quickly, minimize cost, career opportunities, stay close to major, explore interests, minimize coursework, flexibility). Nothing is required in demo mode.

**Goal (`/goal`)** — "Where do you want to go?" Category tiles plus free text ("I want to become a healthcare data scientist"). "I'm not sure yet" launches a short 3-question guided discovery that proposes 2–3 candidate destinations.

**Home / My Path (`/home`)** — "Maya's Future — Biology → Healthcare Technology", current path summary, "Your biggest decision" framing, three explore buttons, and Quick What If chips.

**What If (`/what-if`)** — the centerpiece. Large "What if..." input, suggested scenario buttons (switch major, add minor, graduate early, transfer, semester off, minimize tuition, maximize flexibility, specific careers). Submitting runs the simulation engine, animates 2–4 branches growing out of the current node, counts up the result numbers, and slides in path cards.

**Path visualization** — horizontal branching tree on desktop, vertical tree on mobile. Each node clickable, selected branch highlighted, animated growth on generation. Nodes show label, graduation date, estimated cost.

**Path cards** — graduation date, credits remaining, additional credits, estimated tuition delta, career alignment %, risk level, advantages, tradeoffs, and "Explore Path".

**Compare (`/compare`)** — select 2–4 paths; comparison bars and small charts across graduation date, time/credits remaining, additional credits, tuition, career alignment, coursework, prerequisites, risk, flexibility, opportunities. No dense spreadsheet.

**Why this path** — a drawer on every path with the AI's reasoning plus an explicit "Evidence used" list (credits, completed courses, graduation target, goal, priorities). Each requirement is tagged **Verified** (from institutional data), **Estimated** (calculated), or **Unknown** (confirm with your institution).

**Tradeoff scores** — career fit, cost efficiency, graduation efficiency, flexibility, overall fit, each rendered as a bar and labeled "Fork estimate" with a tooltip that they are for comparison, not guaranteed outcomes.

**Cost of decision** — prominent before/after block: "+1 semester, +$9,200, +18 credits" against the cheaper alternative.

**Plan (`/plan`)** — "Build My Plan" turns the chosen path into a semester-by-semester vertical timeline that animates in, with "Your next 3 moves" pinned at the top and checkable action items.

**Career (`/career`)** — per career: typical skills, relevant majors/minors, recommended coursework, internship and portfolio ideas, entry-level roles, adjacent careers. Framed as "paths worth exploring", never "you should become X".

Every planning screen carries the subtle "Planning estimate — confirm with your academic advisor" note. No guarantees of graduation, employment, salary, or admission anywhere in copy; no sensitive personal characteristics feed recommendations.

## Design

Deep navy `#0E1E3A`, electric blue `#3D6DF0` for active decisions, mint `#69C9A5` for positive outcomes, warm gold `#E8B04B` for opportunities, cream `#F7F5EF`/white surfaces, text `#162033`; red reserved for real warnings. Distinctive display serif for headings, clean sans for UI, large type, generous whitespace. Premium, calm, optimistic — no stock photos, no generic dashboard card soup.

Navigation: Home, My Path, What If? (visually emphasized), Compare, Plan, Career, Profile.

## Technical approach

- **Backend:** enable Lovable Cloud. Tables per the spec: `profiles`, `courses`, `student_courses`, `degree_programs`, `degree_requirements`, `careers`, `career_paths`, `scenarios`, `paths`, `plans`, `plan_items` — each with RLS scoped to the owner, grants, and public read on the catalog tables (courses, degree programs/requirements, careers, career paths). Migration seeds literal rows: UNC catalog subset, Biology / CS / Health Informatics programs with requirements, careers (healthcare data scientist, biotech, health informatics analyst, etc.), and Maya's demo student with 54 credits of history.
- **Simulation is deterministic, not hallucinated.** A typed engine (remaining credits, prerequisite chains, semester packing, tuition per credit, career-fit weighting against ranked priorities) produces every number. Server functions mirror the spec's tool list: `get_degree_requirements`, `get_prerequisites`, `calculate_remaining_credits`, `simulate_major_change`, `simulate_minor`, `simulate_graduation_timeline`, `calculate_estimated_cost`, `generate_action_plan`.
- **AI's job is interpretation, not arithmetic.** A server function parses free-text "what if" input into a structured scenario, and a second one writes the "Why this path?" narrative and action plan strictly from the engine's computed output, via Lovable AI (`openai/gpt-5.6-sol`, streaming). Numbers shown in the UI always come from the engine.
- **Auth:** email/password + Google sign-in via Lovable Cloud. Demo mode works fully unauthenticated with state held client-side; signing in persists profile, scenarios, paths, and plans. Authenticated pages live under the protected route subtree; the landing page stays public.
- **Stack:** TanStack Start routes as listed, TanStack Query for reads, design tokens in `src/styles.css`, motion kept fast and purposeful, per-route SEO metadata.

## Build order

1. Design system + landing page with branching graphic.
2. Cloud schema + seeded demo data, engine and simulation server functions.
3. Demo student load, home, profile, goal.
4. What-If simulator, tree visualization, path cards.
5. Compare, why-this-path, tradeoff scores, cost of decision.
6. Choose path → plan roadmap + next 3 actions.
7. Career page, auth + persistence, mobile pass, polish.
