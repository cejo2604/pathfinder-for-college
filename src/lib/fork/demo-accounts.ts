import { DEMO_STUDENTS } from "./data";

/**
 * Dedicated demo logins — one account per demo student.
 *
 * These are throwaway showcase accounts whose credentials are meant to be
 * shown on screen, never real student accounts.
 */
export interface DemoAccount {
  id: string;
  label: string;
  description: string;
  email: string;
  password: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = DEMO_STUDENTS.map((student) => ({
  id: student.id,
  label: student.label,
  description: student.description,
  email: `${student.id}@forkdemo.app`,
  password: `Fork-Demo-${student.id}-2026`,
}));

export const demoAccountById = (id: string) => DEMO_ACCOUNTS.find((a) => a.id === id);
