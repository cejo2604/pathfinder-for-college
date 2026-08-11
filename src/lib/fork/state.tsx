import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_CAREER_ID,
  DEMO_STUDENT,
  PRIORITY_ORDER,
  SAMPLE_STUDENT,
  type Priority,
  type StudentProfile,
} from "./data";
import { loadForkData, savePath, saveForkProfile, setPlanAction, type SavedPathRow } from "./user-data.functions";

const STORAGE_KEY = "fork:state:v1";

export interface ChosenPathDetails {
  scenarioId: string;
  question: string;
  pathName: string;
  program: string;
  snapshot?: unknown;
}

export interface ForkState {
  profile: StudentProfile | null;
  priorities: Priority[];
  careerId: string;
  scenarioId: string | null;
  scenarioQuestion: string | null;
  comparison: string[];
  chosenPathId: string | null;
  doneActions: string[];
  savedPaths: SavedPathRow[];
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
  savedPaths: [],
};

interface ForkContextValue extends ForkState {
  hydrated: boolean;
  session: Session | null;
  authLoading: boolean;
  signedIn: boolean;
  signOut: () => Promise<void>;
  loadDemoStudent: () => void;
  loadSampleStudent: () => void;
  startBlank: () => void;
  setProfile: (patch: Partial<StudentProfile>) => void;
  setPriorities: (priorities: Priority[]) => void;
  setCareerId: (id: string) => void;
  runScenario: (scenarioId: string, question: string) => void;
  toggleComparison: (pathId: string) => void;
  setComparison: (ids: string[]) => void;
  choosePath: (pathId: string, details?: ChosenPathDetails) => void;
  toggleAction: (key: string) => void;
  reset: () => void;
}

const ForkContext = createContext<ForkContextValue | null>(null);

export function ForkProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ForkState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const signedIn = Boolean(session);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Local hydration keeps the demo instant for visitors who never sign in.
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

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthLoading(false);
    });
    void supabase.auth.getSession().then(({ data: s }) => {
      setSession(s.session);
      setAuthLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Pull saved work for the signed-in student.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    void loadForkData()
      .then((remote) => {
        if (cancelled) return;
        // Returning student: the account is the source of truth.
        const savedProfile = remote.profile;
        if (savedProfile) {
          setState((s) => ({
            ...s,
            profile: savedProfile,
            priorities: savedProfile.priorities.length ? savedProfile.priorities : s.priorities,
            careerId: remote.careerId ?? s.careerId,
            doneActions: remote.doneActions,
            savedPaths: remote.savedPaths,
            chosenPathId: remote.savedPaths.find((p) => p.isChosen)?.pathId ?? s.chosenPathId,
          }));
          return;
        }

        // First sign-in: keep whatever they already filled in locally and store it.
        setState((s) => ({
          ...s,
          doneActions: remote.doneActions.length ? remote.doneActions : s.doneActions,
          savedPaths: remote.savedPaths,
        }));
        const local = stateRef.current;
        if (local.profile) {
          void saveForkProfile({
            data: { profile: { ...local.profile, priorities: local.priorities }, careerId: local.careerId },
          }).catch((error) => console.error("Could not save profile", error));
        }
      })
      .catch((error) => console.error("Could not load saved plan", error));
    return () => {
      cancelled = true;
    };
  }, [session]);


  // Debounced profile persistence.
  const profileTimer = useRef<number | undefined>(undefined);
  const writeProfile = useCallback(() => {
    const { profile, priorities, careerId } = stateRef.current;
    if (!profile) return;
    void saveForkProfile({ data: { profile: { ...profile, priorities }, careerId } }).catch((error) =>
      console.error("Could not save profile", error),
    );
  }, []);
  const queueProfileSave = useCallback(() => {
    if (!stateRef.current.profile) return;
    window.clearTimeout(profileTimer.current);
    profileTimer.current = window.setTimeout(writeProfile, 600);
  }, [writeProfile]);
  const flushProfileSave = useCallback(() => {
    if (profileTimer.current === undefined) return;
    window.clearTimeout(profileTimer.current);
    profileTimer.current = undefined;
    writeProfile();
  }, [writeProfile]);

  // Don't lose the last edits when a student closes the tab or switches away.
  useEffect(() => {
    if (!signedIn) return;
    const onHide = () => flushProfileSave();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [signedIn, flushProfileSave]);


  const value = useMemo<ForkContextValue>(() => {
    const patch = (p: Partial<ForkState>) => setState((s) => ({ ...s, ...p }));
    const persistProfile = () => {
      if (signedIn) queueProfileSave();
    };
    return {
      ...state,
      hydrated,
      session,
      authLoading,
      signedIn,
      signOut: async () => {
        if (signedIn) flushProfileSave();
        await supabase.auth.signOut();
        setState(initialState);
      },
      loadSampleStudent: () => {
        patch({
          profile: SAMPLE_STUDENT,
          priorities: SAMPLE_STUDENT.priorities,
          careerId: DEFAULT_CAREER_ID,
          scenarioId: null,
          scenarioQuestion: null,
          comparison: [],
          chosenPathId: null,
          doneActions: [],
        });
        persistProfile();
      },
      startBlank: () => {
        patch({
          profile: {
            name: "",
            school: "",
            degree: "",
            major: "",
            minor: null,
            year: "",
            graduationTarget: "",
            creditsCompleted: 0,
            gpa: 0,
            interests: [],
            careerInterests: [],
            skills: [],
            priorities: PRIORITY_ORDER,
            goal: "",
            goalCategory: "",
            courses: [],
          },
          priorities: PRIORITY_ORDER,
          careerId: DEFAULT_CAREER_ID,
          scenarioId: null,
          scenarioQuestion: null,
          comparison: [],
          chosenPathId: null,
          doneActions: [],
        });
        persistProfile();
      },
      loadDemoStudent: () => {
        patch({
          profile: DEMO_STUDENT,
          priorities: DEMO_STUDENT.priorities,
          careerId: DEFAULT_CAREER_ID,
          scenarioId: null,
          scenarioQuestion: null,
          comparison: [],
          chosenPathId: null,
          doneActions: [],
        });
        persistProfile();
      },
      setProfile: (p) => {
        setState((s) => ({ ...s, profile: { ...(s.profile ?? DEMO_STUDENT), ...p } }));
        persistProfile();
      },
      setPriorities: (priorities) => {
        patch({ priorities });
        persistProfile();
      },
      setCareerId: (careerId) => {
        patch({ careerId });
        persistProfile();
      },
      runScenario: (scenarioId, scenarioQuestion) => patch({ scenarioId, scenarioQuestion, comparison: [] }),
      toggleComparison: (pathId) =>
        setState((s) => {
          const has = s.comparison.includes(pathId);
          if (has) return { ...s, comparison: s.comparison.filter((p) => p !== pathId) };
          if (s.comparison.length >= 4) return s;
          return { ...s, comparison: [...s.comparison, pathId] };
        }),
      setComparison: (ids) => patch({ comparison: ids.slice(0, 4) }),
      choosePath: (chosenPathId, details) => {
        patch({ chosenPathId });
        if (!signedIn || !details) return;
        void savePath({
          data: {
            scenarioId: details.scenarioId,
            question: details.question,
            pathId: chosenPathId,
            pathName: details.pathName,
            program: details.program,
            snapshot: details.snapshot ?? {},
          },
        })
          .then(() => loadForkData())
          .then((remote) => setState((s) => ({ ...s, savedPaths: remote.savedPaths })))
          .catch((error) => console.error("Could not save this path", error));
      },
      toggleAction: (key) => {
        const done = !stateRef.current.doneActions.includes(key);
        setState((s) => ({
          ...s,
          doneActions: done ? [...s.doneActions, key] : s.doneActions.filter((k) => k !== key),
        }));
        if (signedIn) {
          void setPlanAction({ data: { key, done } }).catch((error) =>
            console.error("Could not save plan progress", error),
          );
        }
      },
      reset: () => setState(initialState),
    };
  }, [state, hydrated, session, authLoading, signedIn, queueProfileSave]);

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
