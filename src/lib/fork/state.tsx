import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_CAREER_ID,
  DEFAULT_INSTITUTION_ID,
  DEMO_STUDENT,
  PRIORITY_ORDER,
  createEmptyProfile,
  SAMPLE_STUDENT,
  type Priority,
  type StudentProfile,
} from "./data";
import { loadForkData, savePath, saveForkProfile, setPlanAction, type SavedPathRow } from "./user-data.functions";

/** Storage is scoped per owner so one browser never shows another account's work. */
const storageKeyFor = (userId: string | null) => `fork:state:v1:${userId ?? "anon"}`;

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
  /** True while the loaded profile is demo/sample data — never persisted to an account. */
  isDemoProfile: boolean;
  /** Authenticated user id that owns this state, or null for anonymous/demo work. */
  ownerId: string | null;
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
  isDemoProfile: false,
  ownerId: null,
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
    const userId = session.user.id;
    // Another account's (or an anonymous visitor's demo) local state never
    // becomes this user's profile.
    const local = stateRef.current;
    const localBelongsToUser = local.ownerId === userId;
    const localIsAdoptable = local.ownerId === null && !local.isDemoProfile && Boolean(local.profile);
    if (!localBelongsToUser && !localIsAdoptable) {
      setState({ ...initialState, ownerId: userId });
    }

    let cancelled = false;
    void loadForkData()
      .then((remote) => {
        if (cancelled) return;
        const savedProfile = remote.profile;
        if (savedProfile) {
          // Returning student: the account is the only source of truth.
          setState((s) => ({
            ...s,
            ownerId: userId,
            profile: savedProfile,
            isDemoProfile: false,
            priorities: savedProfile.priorities.length ? savedProfile.priorities : PRIORITY_ORDER,
            careerId: remote.careerId ?? DEFAULT_CAREER_ID,
            doneActions: remote.doneActions,
            savedPaths: remote.savedPaths,
            chosenPathId: remote.savedPaths.find((p) => p.isChosen)?.pathId ?? null,
          }));
          return;
        }

        // No saved profile: start from the empty schema, unless this same
        // browser session had the user's own pre-sign-in entries.
        setState((s) => {
          const adopt = localIsAdoptable && s.profile && !s.isDemoProfile;
          return {
            ...(adopt ? s : initialState),
            ownerId: userId,
            profile: adopt ? s.profile : createEmptyProfile(),
            isDemoProfile: false,
            doneActions: remote.doneActions,
            savedPaths: remote.savedPaths,
          };
        });
        if (localIsAdoptable && local.profile) {
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
    const { profile, priorities, careerId, isDemoProfile } = stateRef.current;
    if (!profile || isDemoProfile) return;
    void saveForkProfile({ data: { profile: { ...profile, priorities }, careerId } }).catch((error) =>
      console.error("Could not save profile", error),
    );
  }, []);
  const queueProfileSave = useCallback(() => {
    if (!stateRef.current.profile || stateRef.current.isDemoProfile) return;
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
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      },
      loadSampleStudent: () => {
        // Demo data is for the unauthenticated demo mode only.
        if (signedIn) return;
        patch({
          profile: SAMPLE_STUDENT,
          isDemoProfile: true,
          priorities: SAMPLE_STUDENT.priorities,
          careerId: DEFAULT_CAREER_ID,
          scenarioId: null,
          scenarioQuestion: null,
          comparison: [],
          chosenPathId: null,
          doneActions: [],
        });
      },
      startBlank: () => {
        patch({
          profile: createEmptyProfile(),
          isDemoProfile: false,
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
        // Demo data is for the unauthenticated demo mode only.
        if (signedIn) return;
        patch({
          profile: DEMO_STUDENT,
          isDemoProfile: true,
          priorities: DEMO_STUDENT.priorities,
          careerId: DEFAULT_CAREER_ID,
          scenarioId: null,
          scenarioQuestion: null,
          comparison: [],
          chosenPathId: null,
          doneActions: [],
        });
      },
      setProfile: (p) => {
        setState((s) => ({
          ...s,
          profile: { ...(s.profile ?? createEmptyProfile()), ...p },
          // Editing demo data makes it the student's own profile.
          isDemoProfile: false,
        }));
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
        if (!signedIn || !details || state.isDemoProfile) return;
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
        if (signedIn && !stateRef.current.isDemoProfile) {
          void setPlanAction({ data: { key, done } }).catch((error) =>
            console.error("Could not save plan progress", error),
          );
        }
      },

      reset: () => setState(initialState),
    };
  }, [state, hydrated, session, authLoading, signedIn, queueProfileSave, flushProfileSave]);

  return <ForkContext.Provider value={value}>{children}</ForkContext.Provider>;
}

export function useFork() {
  const ctx = useContext(ForkContext);
  if (!ctx) throw new Error("useFork must be used inside ForkProvider");
  return ctx;
}

/** Profile with an empty-schema fallback — never demo data. */
export function useForkProfile(): StudentProfile {
  const { profile } = useFork();
  const resolved = profile ?? createEmptyProfile();
  // Legacy stored profiles predate the institution id; default them to the
  // catalog Fork can verify rather than leaving simulation blocked.
  return resolved.institutionId ? resolved : { ...resolved, institutionId: DEFAULT_INSTITUTION_ID };
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
