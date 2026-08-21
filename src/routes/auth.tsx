import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GitBranch, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useFork } from "@/lib/fork/state";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Fork" },
      {
        name: "description",
        content: "Sign in to Fork to save your student profile, your simulated paths and your semester plan.",
      },
      { property: "og:title", content: "Sign in — Fork" },
      { property: "og:description", content: "Save your paths and semester plan to your Fork account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useFork();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [resetDone, setResetDone] = useState(false);
  // True once the emailed link/code has been verified: only the new password is left.
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    // Verifying a recovery code creates a session mid-flow; stay put until the
    // new password has actually been written.
    if (mode === "forgot" && !resetDone) return;
    // The profile page shows the saved record, or the empty form to create one.
    void navigate({ to: "/profile" });
  }, [session, navigate, mode, resetDone]);

  // Arriving from the emailed reset link: land straight on the new-password form.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const search = new URLSearchParams(window.location.search);
    const tokenHash = search.get("token_hash");
    const pkce = search.get("code");
    const isRecovery =
      hash.get("type") === "recovery" ||
      search.get("type") === "recovery" ||
      Boolean(tokenHash) ||
      Boolean(pkce) ||
      Boolean(hash.get("access_token"));
    if (!isRecovery) return;

    setMode("forgot");
    setBusy(true);
    void (async () => {
      try {
        if (tokenHash) {
          const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
          if (verifyError) throw verifyError;
        } else if (pkce) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(pkce);
          if (exchangeError) throw exchangeError;
        } else {
          // Hash tokens are consumed by the Supabase client on load.
          const { data } = await supabase.auth.getSession();
          if (!data.session) throw new Error("This reset link has expired. Request a new one.");
        }
        setRecoveryReady(true);
        setMessage("Link verified — choose your new password.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "This reset link is invalid or expired. Request a new one.");
      } finally {
        setBusy(false);
        window.history.replaceState({}, "", "/auth");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (resetError) throw resetError;
      setMessage("If that email is registered, a reset email is on its way. Open it on this device to choose a new password here.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code. Try again.");
    } finally {
      setBusy(false);
    }
  };


  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {


      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setResetDone(true);
      setMessage("Password updated. Signing you in…");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/profile` },
        });
        if (signUpError) throw signUpError;
        // Supabase returns a user with no identities when the email is already
        // registered — no confirmation email is sent in that case.
        if (!data.session && (data.user?.identities?.length ?? 0) === 0) {
          setMode("signin");
          setMessage("That email already has an account — sign in instead, or use “Forgot password?”.");
        } else if (!data.session) {
          setMessage("Check your email to confirm your account, then sign in.");
        }

      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setError("Google sign-in did not complete. Try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/profile" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-navy text-navy-foreground">
            <GitBranch className="size-4" />
          </span>
          <span className="font-display text-xl tracking-tight">Fork</span>
        </div>

        <h1 className="mt-6 font-display text-3xl leading-tight">
          {mode === "signin"
            ? "Welcome back"
            : mode === "signup"
              ? "Create your account"
              : "Reset your password"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "forgot"
            ? recoveryReady
              ? "Choose a new password below."
              : "Enter your email and we’ll send a one-click reset email. Open it on this device to set your new password right here."
            : "Your profile, simulated paths and semester plan are saved to your account — only you can see them."}
        </p>

        {mode === "forgot" ? (
          <form onSubmit={resetPassword} className="mt-7 space-y-4 rounded-2xl border border-border bg-card p-5">
            {!recoveryReady ? (
              <>
                <div>
                  <Label htmlFor="resetEmail">Email</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
                {message && <p className="text-sm text-muted-foreground">{message}</p>}

                <Button
                  type="button"
                  className="w-full gap-1.5"
                  disabled={busy || !email}
                  onClick={() => void sendCode()}
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Send reset email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMode("signin");
                    setPassword("");
                    setConfirmPassword("");
                    setError(null);
                    setMessage(null);
                  }}
                >
                  Back to Sign In
                </Button>
              </>
            ) : (
              <>
            <div>
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">Confirm new password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}

            <Button type="submit" className="w-full gap-1.5" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Reset Password
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setMode("signin");
                setPassword("");
                setConfirmPassword("");
                setError(null);
                setMessage(null);
              }}
            >
              Back to Sign In
            </Button>
              </>
            )}
          </form>
        ) : (
        <form onSubmit={submit} className="mt-7 space-y-4 rounded-2xl border border-border bg-card p-5">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5"
            />
          </div>
          {mode === "signup" && (
            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>
          )}

          {mode === "signin" && (
            <div className="text-right">
              <button
                type="button"
                className="text-sm font-medium text-foreground underline underline-offset-4"
                onClick={() => setMode("forgot")}
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-muted-foreground">{message}</p>}

          <Button type="submit" className="w-full gap-1.5" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>

          <Button type="button" variant="outline" className="w-full" onClick={() => void google()}>
            Continue with Google
          </Button>
        </form>
        )}

        <p className="mt-4 text-sm text-muted-foreground">
          {mode === "signin" && (
            <>
              New to Fork?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-4"
                onClick={() => setMode("signup")}
              >
                Create an account
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-4"
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
            </>
          )}
          {mode === "forgot" && (
            <>
              Remember your password?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-4"
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
