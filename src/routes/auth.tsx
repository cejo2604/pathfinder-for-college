import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GitBranch, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_ACCOUNTS } from "@/lib/fork/demo-accounts";
import { ensureDemoAccount } from "@/lib/fork/demo-accounts.functions";
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
  const { session, profile, isDemoProfile } = useFork();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    // New accounts (or leftover demo data) have no saved profile — go set one up.
    void navigate({ to: profile && !isDemoProfile ? "/home" : "/profile" });
  }, [session, profile, isDemoProfile, navigate]);



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
      } else if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setMessage("If that email is registered, you’ll receive a reset link shortly.");
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

  const signInAsDemo = async (id: string) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const { email: demoEmail, password: demoPassword } = await ensureDemoAccount({ data: { id } });
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });
      if (signInError) throw signInError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in to that demo account.");
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
    void navigate({ to: "/home" });
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

        <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Demo logins</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Each demo student has their own account. Signing in loads only that student&apos;s saved record.
          </p>
          <div className="mt-4 space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.id}
                type="button"
                disabled={busy}
                onClick={() => void signInAsDemo(account.id)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/50 disabled:opacity-60"
              >
                <span className="block text-sm font-medium">{account.label}</span>
                <span className="block text-xs text-muted-foreground">{account.description}</span>
                <span className="mt-1 block text-xs tabular-nums text-muted-foreground">
                  {account.email} · {account.password}
                </span>
              </button>
            ))}
          </div>
        </div>


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
        <p className="mt-2 text-sm text-muted-foreground">
          Or{" "}
          <button
            type="button"
            className="font-medium text-foreground underline underline-offset-4"
            onClick={() => void navigate({ to: "/home" })}
          >
            keep exploring the demo student
          </button>
          .
        </p>
      </div>
    </div>
  );
}
