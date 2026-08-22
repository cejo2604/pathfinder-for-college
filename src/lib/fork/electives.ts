/**
 * Simulated elective courses.
 *
 * Plans reserve generic "Elective" slots. Those slots carry no catalog course,
 * so they are filled — for display only — with a deterministic, repeatable set
 * of simulated 3-credit elective courses. Nothing here feeds the simulation
 * engine's numbers: credits per elective slot stay 3, exactly as planned.
 */

import type { Course } from "./data";
import type { PlannedTerm } from "./paths";

export const ELECTIVE_PLACEHOLDER = "Elective";

/** Simulated (non-catalog) elective offerings, all 3 credits. */
export const SIMULATED_ELECTIVES: Course[] = [
  { code: "ELEC 210", title: "Data Ethics in Practice", credits: 3, prerequisites: [] },
  { code: "ELEC 215", title: "Public Health Communication", credits: 3, prerequisites: [] },
  { code: "ELEC 220", title: "Technical Writing for Science", credits: 3, prerequisites: [] },
  { code: "ELEC 235", title: "Introduction to Global Health", credits: 3, prerequisites: [] },
  { code: "ELEC 240", title: "Statistics in the Media", credits: 3, prerequisites: [] },
  { code: "ELEC 255", title: "Human-Centered Design", credits: 3, prerequisites: [] },
  { code: "ELEC 260", title: "Behavioral Science Foundations", credits: 3, prerequisites: [] },
  { code: "ELEC 275", title: "Project Management Essentials", credits: 3, prerequisites: [] },
  { code: "ELEC 305", title: "Health Policy & Economics", credits: 3, prerequisites: [] },
  { code: "ELEC 320", title: "Data Visualization Studio", credits: 3, prerequisites: [] },
  { code: "ELEC 335", title: "Research Methods Seminar", credits: 3, prerequisites: [] },
  { code: "ELEC 350", title: "Science, Technology & Society", credits: 3, prerequisites: [] },
];

const BY_CODE = new Map(SIMULATED_ELECTIVES.map((c) => [c.code, c]));

export const simulatedElectiveByCode = (code: string) => BY_CODE.get(code);

export const isElectiveSlot = (code: string) => code === ELECTIVE_PLACEHOLDER || BY_CODE.has(code);

/**
 * Replace every generic elective slot in a plan with a simulated elective
 * course, walking the list in order so each plan reads consistently.
 */
export function fillSimulatedElectives(terms: PlannedTerm[]): PlannedTerm[] {
  let index = 0;
  return terms.map((term) => ({
    ...term,
    courses: term.courses.map((code) => {
      if (code !== ELECTIVE_PLACEHOLDER) return code;
      const elective = SIMULATED_ELECTIVES[index % SIMULATED_ELECTIVES.length]!;
      index += 1;
      return elective.code;
    }),
  }));
}
