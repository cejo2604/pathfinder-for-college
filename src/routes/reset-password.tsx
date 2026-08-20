import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Fork" },
      {
        name: "description",
        content: "Choose a new password for your Fork account.",
      },
      { property: "og:title", content: "Reset password — Fork" },
      { property: "og:description", content: "Choose a new password for your Fork account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [validLink, setValidLink] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Recovery links arrive in several shapes: a hash with access/refresh tokens,
    // a PKCE `?code=`, or an already-established recovery session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setValidLink(true);
        setChecking(false);
      }
    });

    const resolve = async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const queryParams = new URLSearchParams(window.location.search);
      const code = queryParams.get("code");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      try {
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
      } catch {
        // fall through to the session check below
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setValidLink(
        Boolean(data.session) ||
          hashParams.get("type") === "recovery" ||
          queryParams.get("type") === "recovery",
      );
      setChecking(false);
    };

    void resolve();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
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
      setMessage("Password updated. Signing you in...");
      setTimeout(() => {
        void navigate({ to: "/home" });
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl leading-tight">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {checking
            ? "Checking your reset link…"
            : validLink
              ? "Choose a new password for your Fork account."
              : "This reset link is invalid or expired. Enter your email to get a new one."}
        </p>

        {checking ? (
          <div className="mt-7 grid place-items-center rounded-2xl border border-border bg-card p-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : validLink ? (
          <form onSubmit={submit} className="mt-7 space-y-4 rounded-2xl border border-border bg-card p-5">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
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
              <Label htmlFor="confirmPassword">Confirm new password</Label>
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

            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}

            <Button type="submit" className="w-full gap-1.5" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Update password
            </Button>
          </form>
        ) : (
          <div className="mt-7 rounded-2xl border border-border bg-card p-5">
            <Button className="w-full" onClick={() => void navigate({ to: "/auth" })}>
              Back to sign in
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
