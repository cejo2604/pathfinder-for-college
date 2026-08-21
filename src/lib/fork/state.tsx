import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_CAREER_ID,
  DEFAULT_INSTITUTION_ID,
  PRIORITY_ORDER,
  createEmptyProfile,
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
  /** Program ids the student confirmed on the goal page, pre-filled on My Path. */
  targetMajorId: string | null;
  targetMinorId: string | null;
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
  targetMajorId: null,
  targetMinorId: null,
  ownerId: null,
};


interface ForkContextValue extends ForkState {
  hydrated: boolean;
  /** True once the owner's own data is loaded — nothing profile-derived renders before this. */
  profileReady: boolean;
  session: Session | null;
  authLoading: boolean;
  signedIn: boolean;
  signOut: () => Promise<void>;
  startBlank: () => void;
  setProfile: (patch: Partial<StudentProfile>) => void;
  setPriorities: (priorities: Priority[]) => void;
  setCareerId: (id: string) => void;
  setTargetPrograms: (targets: { majorId?: string | null; minorId?: string | null }) => void;
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
  const [remoteReady, setRemoteReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const signedIn = Boolean(session);
  const stateRef = useRef(state);
  stateRef.current = state;
  /** Set when the student typed profile entries in this tab. */
  const typedThisSession = useRef(false);

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

  // Hydration waits for the session so no other owner's (or demo) data can
  // paint, even for a frame.
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (authLoading) return;
    setHydrated(false);
    setRemoteReady(false);

    // Entries typed in this tab before signing in belong to this person, so
    // they can follow them into their new account. A rehydrated older visit
    // never can.
    const local = stateRef.current;
    const carry =
      userId && typedThisSession.current && local.ownerId === null && local.profile
        ? local
        : null;

    let restored: ForkState = { ...initialState, ownerId: userId };
    if (carry) {
      restored = { ...carry, ownerId: userId };
    } else if (userId) {
      // Only an authenticated owner has stored state; anonymous work is
      // memory-only so nothing can pose as a signed-in profile on next visit.
      try {
        const raw = window.localStorage.getItem(storageKeyFor(userId));
        if (raw) {
          const stored = { ...initialState, ...(JSON.parse(raw) as ForkState) };
          // Only trust storage that belongs to this owner.
          if (stored.ownerId === userId) restored = stored;
        }
      } catch {
        /* ignore unreadable storage */
      }
    } else {
      // Signed out: drop any leftover anonymous entries from earlier visits.
      try {
        window.localStorage.removeItem(storageKeyFor(null));
      } catch {
        /* ignore */
      }
    }
    setState(restored);
    setHydrated(true);


    if (!userId) {
      setRemoteReady(true);
      return;
    }

    const adopted = Boolean(carry);
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
            priorities: savedProfile.priorities.length ? savedProfile.priorities : PRIORITY_ORDER,
            careerId: remote.careerId ?? DEFAULT_CAREER_ID,
            doneActions: remote.doneActions,
            savedPaths: remote.savedPaths,
            chosenPathId: remote.savedPaths.find((p) => p.isChosen)?.pathId ?? null,
          }));
          return;
        }

        // No saved profile: start from the empty schema, unless this same tab
        // held the user's own pre-sign-in entries.
        setState((s) => ({
          ...(adopted ? s : initialState),
          ownerId: userId,
          profile: adopted ? (s.profile ?? createEmptyProfile()) : createEmptyProfile(),
          doneActions: remote.doneActions,
          savedPaths: remote.savedPaths,
        }));
        if (adopted && carry?.profile) {
          void saveForkProfile({
            data: { profile: { ...carry.profile, priorities: carry.priorities }, careerId: carry.careerId },
          }).catch((error) => console.error("Could not save profile", error));
        }
      })
      .catch((error) => console.error("Could not load saved plan", error))
      .finally(() => {
        if (!cancelled) setRemoteReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  useEffect(() => {
    // Anonymous/demo work never touches storage — only a real signed-in owner's.
    if (!hydrated || !state.ownerId) return;
    try {
      window.localStorage.setItem(storageKeyFor(state.ownerId), JSON.stringify(state));
    } catch {
      /* ignore full storage */
    }
  }, [state, hydrated]);


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
      profileReady: hydrated && !authLoading && (!signedIn || remoteReady),
      session,
      authLoading,
      signedIn,
      signOut: async () => {
        if (signedIn) flushProfileSave();
        const ownerKey = storageKeyFor(stateRef.current.ownerId);
        typedThisSession.current = false;
        await supabase.auth.signOut();
        setState(initialState);
        try {
          window.localStorage.removeItem(ownerKey);
          window.localStorage.removeItem(storageKeyFor(null));
        } catch {
          /* ignore */
        }
      },
      startBlank: () => {
        patch({
          profile: createEmptyProfile(),
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
      setProfile: (p) => {
        typedThisSession.current = true;
        setState((s) => ({
          ...s,
          profile: { ...(s.profile ?? createEmptyProfile()), ...p },
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
      setTargetPrograms: ({ majorId, minorId }) =>
        setState((s) => ({
          ...s,
          targetMajorId: majorId === undefined ? s.targetMajorId : majorId,
          targetMinorId: minorId === undefined ? s.targetMinorId : minorId,
        })),
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
  }, [state, hydrated, remoteReady, session, authLoading, signedIn, queueProfileSave, flushProfileSave]);

  return <ForkContext.Provider value={value}>{children}</ForkContext.Provider>;
}

export function useFork() {
  const ctx = useContext(ForkContext);
  if (!ctx) throw new Error("useFork must be used inside ForkProvider");
  return ctx;
}

/** Profile with an empty-schema fallback. */
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
