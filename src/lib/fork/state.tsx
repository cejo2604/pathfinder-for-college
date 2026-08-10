import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { DEFAULT_CAREER_ID, DEMO_STUDENT, PRIORITY_ORDER, type Priority, type StudentProfile } from "./data";

const STORAGE_KEY = "fork:state:v1";

export interface ForkState {
  profile: StudentProfile | null;
  priorities: Priority[];
  careerId: string;
  scenarioId: string | null;
  scenarioQuestion: string | null;
  comparison: string[];
  chosenPathId: string | null;
  doneActions: string[];
}

const initialState: ForkState = {
  profile: null,
  priorities: PRIORITY_ORDER,
  careerId: DEFAULT_CAREER_ID,
  scenarioId: null,
  scenarioQuestion: null,
  comparison: [],
  chosenPathId: null,
  doneActions: [],
};

interface ForkContextValue extends ForkState {
  hydrated: boolean;
  loadDemoStudent: () => void;
  setProfile: (patch: Partial<StudentProfile>) => void;
  setPriorities: (priorities: Priority[]) => void;
  setCareerId: (id: string) => void;
  runScenario: (scenarioId: string, question: string) => void;
  toggleComparison: (pathId: string) => void;
  setComparison: (ids: string[]) => void;
  choosePath: (pathId: string) => void;
  toggleAction: (key: string) => void;
  reset: () => void;
}

const ForkContext = createContext<ForkContextValue | null>(null);

export function ForkProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ForkState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as ForkState) });
    } catch {
      /* ignore unreadable storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore full storage */
    }
  }, [state, hydrated]);

  const value = useMemo<ForkContextValue>(() => {
    const patch = (p: Partial<ForkState>) => setState((s) => ({ ...s, ...p }));
    return {
      ...state,
      hydrated,
      loadDemoStudent: () =>
        patch({
          profile: DEMO_STUDENT,
          priorities: DEMO_STUDENT.priorities,
          careerId: DEFAULT_CAREER_ID,
          scenarioId: null,
          scenarioQuestion: null,
          comparison: [],
          chosenPathId: null,
          doneActions: [],
        }),
      setProfile: (p) =>
        setState((s) => ({ ...s, profile: { ...(s.profile ?? DEMO_STUDENT), ...p } })),
      setPriorities: (priorities) => patch({ priorities }),
      setCareerId: (careerId) => patch({ careerId }),
      runScenario: (scenarioId, scenarioQuestion) => patch({ scenarioId, scenarioQuestion, comparison: [] }),
      toggleComparison: (pathId) =>
        setState((s) => {
          const has = s.comparison.includes(pathId);
          if (has) return { ...s, comparison: s.comparison.filter((p) => p !== pathId) };
          if (s.comparison.length >= 4) return s;
          return { ...s, comparison: [...s.comparison, pathId] };
        }),
      setComparison: (ids) => patch({ comparison: ids.slice(0, 4) }),
      choosePath: (chosenPathId) => patch({ chosenPathId }),
      toggleAction: (key) =>
        setState((s) => ({
          ...s,
          doneActions: s.doneActions.includes(key)
            ? s.doneActions.filter((k) => k !== key)
            : [...s.doneActions, key],
        })),
      reset: () => setState(initialState),
    };
  }, [state, hydrated]);

  return <ForkContext.Provider value={value}>{children}</ForkContext.Provider>;
}

export function useFork() {
  const ctx = useContext(ForkContext);
  if (!ctx) throw new Error("useFork must be used inside ForkProvider");
  return ctx;
}

/** Profile with a safe fallback so every screen renders even before demo load. */
export function useForkProfile(): StudentProfile {
  const { profile } = useFork();
  return profile ?? DEMO_STUDENT;
}

export function useCountUp(target: number, active = true, duration = 750) {
  const [value, setValue] = useState(active ? 0 : target);

  useEffect(() => {
    if (!active) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);

  return value;
}

export const useStableCallback = <T extends (...args: never[]) => unknown>(fn: T) => useCallback(fn, [fn]);
