# Fork — Verify and Close the Data-Isolation Checklist

Goal: make every step of your 7-step acceptance checklist pass, including the "not even briefly while loading" requirement.

## What is already correct

- Demo/sample loading is blocked while signed in (`loadDemoStudent`, `loadSampleStudent` return early), and the demo/sample CTAs and "Clear demo data" are hidden for signed-in users.
- Signing in with state owned by another account (or demo state) resets to the empty profile before the account's data loads.
- Sign-out resets state and clears local storage.
- Profile/Plan/My Path/Compare read the shared profile with an empty-schema fallback — never demo data.

## Gaps to fix

1. **Brief flash during loading (steps 1, 5).** Local storage hydrates immediately, before the session and the account's saved profile resolve. On a refresh, or on a browser where an earlier anonymous demo session left state behind, the previous/demo values can paint for a moment before the account data replaces them.
   Fix: add a `profileReady` flag to the Fork state — false until the session check finishes and, when signed in, the account's saved data has loaded. Profile-derived pages (Profile, Plan, My Path, Compare, Path breakdown, What If) render a skeleton/loading state instead of profile values until `profileReady` is true.

2. **Local storage is shared across accounts on one browser (steps 3-5).** State is stored under one key, so a stale entry is the first thing any next visitor sees.
   Fix: scope the storage key by owner (`fork:state:v1:anon` and `fork:state:v1:<userId>`), and only hydrate from the key that matches the current session. Cross-account bleed becomes impossible even before the network load returns.

3. **Anonymous-entry adoption is too permissive (step 4).** Today any anonymous, non-demo profile left in the browser is adopted by whoever signs in next — so User B could inherit typed data that was not theirs.
   Fix: only adopt pre-sign-in entries within the same page session (an in-memory flag set when the user typed in this tab), never from a rehydrated previous visit.

## Verification (run after the changes)

Automated browser pass against the preview, driven by two fresh accounts:

1. Fresh User A: Profile/Plan/My Path/Compare empty; capture screenshots at first paint to confirm no demo values flash.
2. Enter and save A's profile; confirm all four surfaces reflect it.
3. Sign out A.
4. Sign in fresh User B: no A data, no demo data, all surfaces empty.
5. Refresh as B: B's data persists, no demo flash.
6. Sign out and explicitly enter demo mode: demo student data still present.
7. While authenticated, confirm no demo/sample CTA is reachable (home, profile, landing, header menu) and that direct demo actions are no-ops.

Plus engine/state unit checks: signing in with demo state present yields an empty profile; storage key scoping keeps two owners' entries separate.

## Technical notes

- Files touched: `src/lib/fork/state.tsx` (storage key scoping, `profileReady`, adoption rule) and the profile-consuming routes/components for the loading state.
- No schema or engine changes; deterministic simulation behaviour is untouched.
