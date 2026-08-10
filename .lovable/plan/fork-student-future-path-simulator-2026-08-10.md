# Fork — Student Future Path Simulator

Build Fork as a decision simulator: a student's current academic position, a future goal, branching alternative futures, honest tradeoffs, and a semester roadmap with next actions.

Scope: all of P0 plus the P1 items that make the demo whole (career reference, saved scenarios, auth, action items, mobile). No P2 work.

**Governing priority:** the What-If experience wins every tradeoff. Whenever added functionality would compete with the depth, speed, clarity, or polish of the What-If loop (input → animated branching visualization → path cards → tradeoffs → why-this-path → plan), that loop gets the time and the extra feature gets cut or simplified. Career reference, auth/persistence, and custom-scenario breadth are all droppable in service of it.

## The 2-minute demo is the spec

The build is tuned so this runs end to end in 90–120 seconds, with no dead ends or explanation needed:

1. Landing → **Try a Demo Student** loads Maya Rodriguez instantly.
2. My Path shows her position (Biology, sophomore, 54 credits, May 2028) and goal (Healthcare Technology).
3. One click into **What If?**
4. Choose "What if I switch to Computer Science?"
5. "Analyzing your options…" → branches grow from the YOU node → numbers count up → path cards reveal.
6. Consequences: graduation date, additional semesters, additional credits, estimated cost, career fit.
7. Compare CS switch vs CS minor side by side.
8. Open **Why this path?** → reasoning + evidence + assumptions.
9. Select the preferred path → **Build My Plan**.
10. Semester roadmap, opening with **Your Next 3 Moves**.

A judge should read "this app simulates a student's major life decisions" off the landing page within 10 seconds.

## Navigation

Primary: **My Path · What If? · Compare · Plan** — What If? visually emphasized (filled electric blue, slightly larger). Career, Profile, and Settings live behind the profile menu. Fork must read as one focused product, not a toolbox.

## Screens

**Landing (`/`)** — "See where your choices lead." Animated branching-path graphic (YOU → Stay Biology / Switch CS / Combine, each with graduation date and cost). CTAs: **Try a Demo Student** (primary), Explore My Future, See an Example.

**My Path (`/home`)** — "Maya's Future / Biology → Healthcare Technology", then "You're currently on track to graduate in May 2028." Then **Your Biggest Decision**: "You have several ways to combine your interest in healthcare and technology," with three options — Stay in Biology, Switch to Computer Science, Add a Computer Science minor. Then **Quick What If?** chips: Switch my major, Add a minor, Graduate early, Minimize cost. Every one of these lands directly in the simulator with the scenario pre-filled.

**What If (`/what-if`)** — the centerpiece. Large "What if…" input plus suggested scenario buttons (switch major, add minor, graduate early, transfer, semester off, minimize tuition, maximize flexibility, specific careers). On submit: brief "Analyzing your options…" state → branches animate outward from the current node → key numbers count up → path cards slide in. All alternatives are shown first; the best-fit path is highlighted only afterward. Fork never opens with "you should do X."

**Branching visualization** — horizontal tree on desktop (YOU → three-plus branches, each node carrying label, graduation date, cost), vertical tree on mobile. Nodes clickable, selected branch highlighted, growth animation on generation. This is the most memorable surface in the app and gets disproportionate polish.

**Path cards** — graduation date, credits remaining, additional credits, estimated tuition delta, career fit, risk, advantages, tradeoffs, "Explore Path".

**Compare (`/compare`)** — 2–4 paths across graduation date, time and credits remaining, additional credits, tuition, career fit, coursework, prerequisites, risk, flexibility, opportunities. Visual bars and small charts, never a spreadsheet.

**Plan (`/plan`)** — **Your Next 3 Moves** pinned at the top (advisor meeting, prerequisite check, apply for the next relevant opportunity), then an animated vertical timeline: Fall 2026, Spring 2027, Summer 2027 internship, through graduation, each semester listing courses and actions. Actions are checkable.

**Career (secondary)** — per career: typical skills, relevant majors/minors, recommended coursework, internship and portfolio ideas, entry-level roles, adjacent careers. Framed as "paths worth exploring", never "you should become X".

**Profile / Goal (secondary)** — academic facts, interests, career interests, skills, ranked priorities; goal picker with categories, free text, and an "I'm not sure yet" 3-question discovery flow. Nothing required in demo mode.

## Trust surfaces

**Scores as comparisons, not predictions.** Every score renders as a label + `NN / 100` + "Fork estimate" — Career Fit, Cost Efficiency, Graduation Efficiency, Flexibility, Overall Fit. Tooltip: "This is a comparison score based on the student's stated goal, academic path, skills, and priorities. It is not a prediction or guarantee of career success." Risk shows its level plus an explicit list of what drives it (added prerequisites, semester delay, credits lost to electives, course-availability dependence).

**How we calculated this** — every path carries an Assumptions & Evidence section splitting facts three ways:
- **Verified** — from the institutional dataset: completed credits, course requirements, prerequisites.
- **Estimated** — computed by Fork: tuition, graduation timeline, tradeoff scores.
- **Unknown** — must be confirmed: actual course availability, individual financial aid, advisor approval.
Shown concretely: current credits 54, graduation target May 2028, tuition per credit, additional credits required, prerequisite count, plus "some values require confirmation with your institution."

**Why this path?** — a drawer with plain-language reasoning that references only engine output and profile data (existing progress, prerequisite cost of a full switch, what a minor preserves, how it maps to the stated priorities), with the evidence used listed underneath.

**What would change my decision?** — after comparing, an interactive "What matters most to you?" panel with adjustable priorities (graduate on time, minimize cost, maximize career opportunities, stay close to current major, minimize additional coursework, maximize flexibility). Changing weights re-ranks the paths live and can flip the recommendation — this is what makes Fork a decision tool rather than an oracle.

Planning screens carry a subtle "Planning estimate — confirm with your academic advisor" note. No guarantees of graduation, employment, salary, or admission. No sensitive personal characteristics feed recommendations.

## Simulation is deterministic

A typed engine produces every number in the UI: remaining credits, additional credits, prerequisite chains, semester count, graduation timeline, estimated tuition, course requirements, and all tradeoff scores (weighted against the student's ranked priorities).

AI never produces numbers. It only parses free-text "what if" input into a structured scenario, and then interprets the engine's output: explaining reasoning, summarizing tradeoffs, and drafting action items. Lovable AI, `openai/gpt-5.6-sol`, streaming, server-side.

## Data

Small, coherent, correct — no sprawling catalog. Lovable Cloud with the spec's tables (`profiles`, `courses`, `student_courses`, `degree_programs`, `degree_requirements`, `careers`, `career_paths`, `scenarios`, `paths`, `plans`, `plan_items`), RLS scoped to the owner, grants, public read on catalog tables. The migration seeds literal rows: a UNC course subset, Biology / Computer Science / Health Informatics programs and their requirements, a handful of healthcare-technology careers, and Maya's 54 credits of history.

The Maya scenario must be internally airtight: credits add up, prerequisites chain logically, degree requirements are consistent, every graduation date is arithmetically reachable, costs match the stated per-credit assumption, and the five scenarios (stay Biology, switch CS, CS minor, Bio + Health Informatics, graduate early) differ meaningfully from each other.

## Design

Deep navy `#0E1E3A`, electric blue `#3D6DF0` for active decisions, mint `#69C9A5` for positive outcomes, warm gold `#E8B04B` for opportunities, cream `#F7F5EF` and white surfaces, text `#162033`; red only for genuine warnings. Distinctive display serif for major headings, clean sans for interface text, large confident type, generous whitespace. Premium, calm, intelligent, optimistic. No generic SaaS dashboards, card soup, stock photos, gradient excess, tiny text, or clutter. Animation fast and purposeful: branches grow, numbers count, cards fade in, timeline unrolls.

## Technical notes

TanStack Start routes as listed; TanStack Query for reads; engine + simulation server functions mirroring the spec's tool list (`get_degree_requirements`, `get_prerequisites`, `calculate_remaining_credits`, `simulate_major_change`, `simulate_minor`, `simulate_graduation_timeline`, `calculate_estimated_cost`, `generate_action_plan`); design tokens in `src/styles.css`; per-route SEO metadata. Auth is email/password + Google via Lovable Cloud; demo mode works fully unauthenticated with client-side state, and signing in persists profile, scenarios, paths, and plans.

## Build order

1. Design system + landing page with branching graphic.
2. Seeded demo dataset + deterministic engine and simulation server functions.
3. Demo student load + My Path home.
4. **What-If simulator, branching visualization, path cards** — the polish sink.
5. Compare, tradeoff scores, how-we-calculated, why-this-path, priority re-ranking.
6. Choose path → semester roadmap + Your Next 3 Moves.
7. Goal/profile screens, career reference, auth + persistence, mobile pass.

## Final check before calling it done

Understandable in 10 seconds; What-If concept obvious without explanation; multiple futures comparable in under 30 seconds; recommendation reasoning clear; consequences of switching paths visible; decision convertible into a semester plan; the whole thing reads as one cohesive product. Any "no" gets fixed before anything new is added.
