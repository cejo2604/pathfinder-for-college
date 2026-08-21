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
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    // The profile page shows the saved record, or the empty form to create one.
    void navigate({ to: "/profile" });
  }, [session, navigate]);



  const sendCode = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (resetError) throw resetError;
      setMessage("If that email is registered, a verification code is on its way.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const resetWithCode = async (event: React.FormEvent) => {
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
      // The emailed code proves ownership of the address before any password change.
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "recovery",
      });
      if (verifyError) throw verifyError;

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
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
        if (!data.session) setMessage("Check your email to confirm your account, then sign in.");
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
            ? "Enter your email and we’ll send you a link to choose a new password."
            : "Your profile, simulated paths and semester plan are saved to your account — only you can see them."}
        </p>

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
          {mode !== "forgot" && (
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
          )}
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
            {mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Send reset link"}
          </Button>

          {mode !== "forgot" && (
            <Button type="button" variant="outline" className="w-full" onClick={() => void google()}>
              Continue with Google
            </Button>
          )}
        </form>

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
