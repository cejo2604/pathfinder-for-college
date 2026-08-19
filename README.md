# Future Paths

FORK — Student Future Path Simulator

Product Vision

Build Fork, a polished web app that helps college students understand the consequences of major academic and career decisions before they make them.

Core promise

See where your choices lead.

Fork allows a student to enter or import their current academic situation, choose a future goal, and explore multiple possible paths.

The defining feature is an interactive "What If?" simulator.

Students should be able to ask:

What if I change my major?

What if I add a minor?

What if I graduate early?

What if I transfer?

What if I take a semester off?

What if I want to pursue a different career?

What if I want to minimize additional tuition?

What if I want to maximize career flexibility?

Fork generates realistic alternative paths and clearly compares their consequences.

The product should feel like a personal navigation system for college and life after college, not like another generic AI chatbot or task manager.

1. Product Principles

The entire product should follow these principles:

1. Decision-first

The app exists to help students make better decisions, not simply store academic information.

2. Show tradeoffs

Never present one path as magically "correct." Show the consequences, benefits, costs, and risks of different options.

3. Explain recommendations

Every AI recommendation must explain WHY it was recommended.

4. Visualize the future

The main experience should visually represent a student's current position and branching possible futures.

5. Trustworthy AI

AI should reason over structured student data and retrieved academic information rather than inventing requirements.

6. Actionable

Every chosen path should end with concrete next steps.

7. Competition-quality polish

The app should feel like a finished startup product, not a prototype assembled from generic dashboard components.

2. Target User

Primary user:

A college student who is uncertain about an academic or career decision.

Example:

Maya is a sophomore Biology major. She wants to work in healthcare technology but doesn't know whether to change majors, add a minor, or stay on her current path.

Fork helps Maya compare her options before making the decision.

3. Core User Journey

The primary demo flow should be:

LANDING PAGE
     ↓
CREATE PROFILE
     ↓
CURRENT ACADEMIC POSITION
     ↓
CHOOSE FUTURE GOAL
     ↓
GENERATE POSSIBLE PATHS
     ↓
WHAT-IF SIMULATION
     ↓
COMPARE PATHS
     ↓
UNDERSTAND TRADEOFFS
     ↓
CHOOSE A PATH
     ↓
GENERATE ACTION PLAN


The entire application should make this journey extremely easy.

4. Landing Page

Route:

/

Hero:

See where your choices lead.

Subheading:

Fork helps you explore academic and career decisions before you make them. Compare time, cost, coursework, career alignment, and tradeoffs across multiple possible futures.

Primary CTA:

Explore My Future

Secondary CTA:

See an Example

Include a visually impressive branching-path graphic.

Example:

                         YOU
                          │
              ┌───────────┼───────────┐
              ↓           ↓           ↓
           STAY        CHANGE       COMBINE
          BIOLOGY        CS        BIO + CS
              │           │           │
           May 2028    Dec 2028    May 2028


Avoid generic stock photography.

Use clean illustrations, gradients, paths, nodes, and subtle animations.

5. Demo Mode

Because this is a competition demo, include a prominent:

Try a Demo Student

button.

This loads a preconfigured fictional student:

Maya Rodriguez

School: University of North Carolina

Year: Sophomore

Major: Biology

Credits completed: 54

GPA: 3.6

Graduation target: May 2028

Interests:

Healthcare

Technology

Problem solving

Research

Current courses:

Biology 301

Organic Chemistry

Statistics

Psychology

Career interests:

Healthcare technology

Data science

Biotechnology

The demo should require no manual data entry.

6. Student Profile

Route:

/profile

Collect:

Academic

School

Degree

Major

Minor

Year

Expected graduation

Credits completed

GPA

Completed courses

Current courses

Interests

Career interests

Subjects they enjoy

Skills

Preferred work style

Industries

Priorities

Let students rank:

Graduate quickly

Minimize cost

Maximize career opportunities

Stay close to current major

Explore interests

Minimize additional coursework

Maintain flexibility

Do not require students to fill everything out manually for the demo.

7. Future Goal Screen

Route:

/goal

Heading:

Where do you want to go?

Allow students to select or type a destination.

Categories:

Technology

Healthcare

Business

Finance

Law

Education

Research

Engineering

Creative

Public service

Entrepreneurship

Other

I'm not sure

Allow free text:

"I want to become a healthcare data scientist."

Also allow:

I'm not sure yet

If selected, launch a lightweight guided discovery flow.

8. What-If Simulator

This is the PRIMARY PRODUCT FEATURE.

Route:

/what-if

Large central input:

What if...

Examples:

I switch to Computer Science?

I add a CS minor?

I graduate one semester early?

I transfer to another school?

I take a semester off?

I want to become a physician?

I want to minimize tuition?

I want to work in healthcare technology?

Provide suggested scenario buttons.

When a scenario is selected, calculate and display the consequences.

9. Future Path Visualization

Create a visual branching tree.

Example:

                    CURRENT
                 Biology Major
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
       STAY         SWITCH        COMBINE
      BIOLOGY         CS         BIO + CS
          │            │            │
       May 2028     Dec 2028     May 2028
          │            │            │
       $32,000      $41,000      $35,000


Each path should be clickable.

Use animated transitions when creating a branch.

The visualization should be one of the most memorable parts of the application.

10. Path Cards

Each generated path should have a card.

Example:

Path A — Stay the Course

Biology

🎓 Graduation
May 2028

📚 Credits remaining
58

💰 Estimated remaining tuition
$32,000

🎯 Career alignment
61%

⚠️ Risk
Low

Advantages

Graduate on time

Lowest disruption

Keeps current academic progress

Tradeoffs

Fewer technical credentials

May require additional skills outside degree

Button:

Explore Path

Path B — Switch to Computer Science

🎓 Graduation
December 2028

💰 Estimated additional cost
+$9,200

🎯 Career alignment
89%

⚠️ Risk
Medium/High

Advantages:

Strong technical preparation

More software career opportunities

Tradeoffs:

Additional semester

Some completed credits may become electives

Path C — Biology + CS Minor

🎓 Graduation
May 2028

💰 Additional cost
+$3,000

🎯 Career alignment
84%

⚠️ Risk
Low

Advantages:

Preserves current progress

Adds technical skills

Strong interdisciplinary positioning

11. Path Comparison

Route:

/compare

Allow students to select 2–4 paths.

Comparison dimensions:

Graduation date

Time remaining

Credits remaining

Additional credits

Estimated tuition

Career alignment

Coursework

Prerequisites

Difficulty/risk

Flexibility

Opportunities

Major changes

Internship opportunities

Use visual comparison bars and simple charts.

Avoid overwhelming spreadsheets.

12. "Why This Path?" Explanation

Every recommendation needs an explanation.

Example:

Why Fork recommends Path C

You have already completed 54 credits toward Biology and are on track to graduate in May 2028.

Switching completely to Computer Science would require additional prerequisites and likely delay graduation.

A Computer Science minor preserves most of your existing progress while adding technical preparation relevant to your stated interest in healthcare technology.

This path balances your priorities of graduating on time, controlling cost, and improving career flexibility.

Show:

Evidence used

Current credits

Completed courses

Graduation target

Career goal

Student priorities

Never make the AI appear to have unexplained certainty.

13. Tradeoff Score

Each path should receive transparent scores.

Example:

Path C

Career fit
████████░░ 84

Cost efficiency
█████████░ 91

Graduation efficiency
█████████░ 94

Flexibility
████████░░ 82

Overall fit
████████░░ 88

Do not present these as scientifically validated predictions.

Label them:

Fork estimate

and provide a tooltip:

Estimates are based on the information currently available and are intended for comparison, not guaranteed outcomes.

14. Cost of Decision

Every major scenario should show the financial/time consequences.

Example:

Switching majors would mean:

+1 semester

+$9,200 estimated tuition

+18 credits

May delay graduation

Then:

Alternative

CS Minor

0 additional semesters

+$3,000 estimated tuition

+6 credits

This "cost of decision" visualization should be prominent.

15. Choose a Path

When the student selects a path:

Button:

Build My Plan

Fork converts the chosen scenario into a semester-by-semester plan.

16. Semester Roadmap

Route:

/plan

Example:

Your Fork

Fall 2026

Biology 301

Computer Science 101

Statistics

Career exploration

Research internship applications

Spring 2027

Biology 302

Data Structures

Healthcare Technology project

Summer 2027

Internship

Fall 2027

Advanced Biology

Algorithms

Portfolio project

Spring 2028

Capstone

Graduation preparation

Use a beautiful vertical timeline.

17. Next Actions

At the top of the plan:

Your next 3 moves

1

Schedule an academic advisor meeting.

2

Check Computer Science prerequisite availability.

3

Apply to three healthcare technology internships.

Allow users to mark actions complete.

18. Career Connection

Add a lightweight career section.

Route:

/career

For each selected career:

Typical skills

Relevant majors

Relevant minors

Recommended coursework

Internship ideas

Portfolio ideas

Entry-level roles

Alternative careers

The important distinction:

Do not tell students:

"You should become X."

Instead:

"Based on your goals and preferences, these paths may be worth exploring."

19. AI Architecture

The AI must not invent academic requirements.

Use a tool-oriented architecture.

AI should have access to structured functions such as:

get_student_profile()
get_completed_courses()
get_current_courses()
get_degree_requirements()
get_prerequisites()
get_career_requirements()
calculate_remaining_credits()
simulate_major_change()
simulate_minor()
simulate_graduation_timeline()
calculate_estimated_cost()
generate_action_plan()


The AI should reason over these results.

For academic requirements, clearly distinguish:

Verified

Information retrieved from provided institutional data.

Estimated

Calculated from assumptions.

Unknown

Information that requires confirmation from the student's institution.

20. Demo Data

Because the competition judges need to understand the product immediately, seed the application with realistic fictional data.

Create:

Demo Student

Maya Rodriguez

Current path

Biology

Goal

Healthcare Technology

Available scenarios

Stay in Biology

Switch to Computer Science

Add Computer Science minor

Biology + Health Informatics

Graduate early

The demo should produce meaningful differences between these options.

21. Important Trust & Safety Language

On academic planning screens, display subtle language:

Planning estimate
Fork uses the information available in your profile and institutional data. Requirements, costs, and graduation dates should be confirmed with your academic advisor.

Never claim:

Guaranteed graduation

Guaranteed employment

Guaranteed salary

Guaranteed admission

Guaranteed career success

Do not make sensitive personal characteristics part of career recommendations.

22. Authentication

Support:

Email/password

Google sign-in

Allow demo mode without authentication.

After authentication, save:

Profile

Academic data

Scenarios

Saved paths

Plans

Preferences

23. Data Model

Create these core tables:

profiles

id

name

school

major

minor

year

graduation_target

credits_completed

gpa

interests

priorities

courses

id

school

code

title

credits

prerequisites

student_courses

student_id

course_id

status

semester

grade

degree_programs

id

school

name

required_credits

degree_requirements

degree_id

course_id

requirement_type

careers

id

title

industry

description

skills

career_paths

career_id

recommended_major

recommended_minor

recommended_skills

scenarios

id

student_id

scenario_type

scenario_input

created_at

paths

id

scenario_id

name

graduation_date

credits_remaining

additional_credits

estimated_cost

career_fit

risk

advantages

tradeoffs

plans

id

student_id

path_id

plan_items

id

plan_id

semester

title

type

completed

24. Visual Design

The visual identity should communicate:

navigation + possibility + clarity

Primary colors:

Deep navy: #0E1E3A

Electric blue: #3D6DF0

Mint/green: #69C9A5

Warm gold: #E8B04B

Cream: #F7F5EF

White: #FFFFFF

Text: #162033

Use blue for active decisions.

Use green for positive outcomes.

Use gold for opportunities/highlights.

Use red only for genuine warnings.

Typography:

Elegant serif or distinctive display font for major headings

Clean sans-serif for UI/body

Large, confident typography

Generous whitespace

Design should feel:

premium, calm, intelligent, optimistic

Avoid:

Generic SaaS dashboards

Excessive cards

Stock photos

Excessive gradients

Clutter

Tiny text

Overuse of AI visual effects

25. Navigation

Use a simple navigation:

Home

My Path

What If?

Compare

Plan

Career

Profile/settings

The "What If?" button should be visually emphasized.

26. Home Screen

After profile setup, the home screen should immediately show:

Maya's Future

Biology → Healthcare Technology

Then:

Your current path

May 2028 graduation

Your biggest decision

How technical do you want your path to be?

Buttons:

Explore Computer Science

Explore Health Informatics

Stay with Biology

Then:

Quick What If?

[What if I change my major?]

[What if I add a minor?]

[What if I graduate early?]

This makes the product immediately understandable.

27. Responsive Design

The application must work on:

Desktop

Tablet

Mobile

The primary competition demo can be optimized for desktop, but mobile layouts must remain usable.

The path visualization should become a vertical tree on smaller screens.

28. Animation

Use subtle animations:

Branches grow outward when paths are generated

Numbers count up when scenario results appear

Path cards slide/fade in

Selected path becomes visually highlighted

Timeline animates when the plan is generated

Keep animation fast and purposeful.

29. Competition Demo Optimization

The first 30 seconds must communicate the product.

A judge should understand:

"This app lets students simulate major life/academic decisions."

within 10 seconds.

The ideal demo:

Open Fork

Load Maya

Click What If?

Select Switch to Computer Science

Show consequences

Compare with CS Minor

Click Why?

Select CS Minor

Click Build My Plan

Show semester roadmap

Show next three actions

The entire experience should take approximately 90–120 seconds.

30. Critical Product Constraint

Do NOT build a generic college management app.

Do NOT prioritize:

Social feed

Marketplace

Chat

Campus map

Dining

Generic task management

Generic AI chatbot

These features distract from the core innovation.

Every feature should reinforce:

Understand your choices. Compare your futures. Choose your path.

31. MVP Priority

Build in this order:

P0 — Absolutely required

Landing page

Demo student

Student profile

Future goal

What-If simulator

Branching path visualization

Path comparison

Tradeoff calculations

AI explanation

Choose path

Semester roadmap

P1 — Important

Career exploration

Saved scenarios

Authentication

Custom scenarios

Action items

Mobile responsiveness

P2 — Only if time remains

Real school data

Transfer scenarios

Advisor handoff

More careers

More institutions

Advanced financial modeling

Do not build P2 until P0 is extremely polished.

32. Final Product Definition

Fork is not a degree audit.

Fork is not a calendar.

Fork is not an AI chatbot.

Fork is not a career quiz.

Fork is a decision simulator for college students.

Its core interaction is:

What if I choose differently?

And its core output is:

Here is where each choice could lead, what it will cost, how long it could take, what opportunities it creates, and what you can do next.

Build the entire product around making that experience feel magical, understandable, trustworthy, and immediately useful.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pathfinder-for-college.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c5ffbca0-b893-4d85-8da5-df199327ba25).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
