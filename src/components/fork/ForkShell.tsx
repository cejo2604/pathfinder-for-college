import { Link, useRouterState } from "@tanstack/react-router";
import { GitBranch, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useFork } from "@/lib/fork/state";

const PRIMARY_NAV = [
  { to: "/home", label: "Plan" },
  { to: "/plan", label: "My Path" },
  { to: "/compare", label: "Compare" },
] as const;

export function ForkLogo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-navy text-navy-foreground">
        <GitBranch className="size-4" />
      </span>
      <span className="font-display text-xl tracking-tight">Fork</span>
    </Link>
  );
}

export function ForkNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, reset, signedIn, signOut, session } = useFork();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <ForkLogo className="shrink-0" />

        <nav className="ml-auto flex min-w-0 items-center gap-1 text-sm">
          {/* Text links only from sm up; on phones they live in the menu below. */}
          <div className="hidden items-center gap-1 sm:flex">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-2.5 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3",
                  pathname === item.to && "text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Button
            asChild
            size="lg"
            className="ml-1 shrink-0 gap-1.5 rounded-full px-3 text-sm shadow-lift sm:px-5 sm:text-[0.95rem]"
          >
            <Link to="/what-if">
              <Sparkles className="size-4" />
              What If?
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ml-0.5 shrink-0 rounded-full sm:ml-1"
                aria-label="Menu, profile and settings"
              >
                <span className="grid size-8 place-items-center rounded-full bg-muted font-medium">
                  {(profile?.name ?? "?").slice(0, 1)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal text-muted-foreground">
                {profile?.name ?? "No student loaded"}
                {signedIn && (
                  <span className="mt-0.5 block truncate text-xs">{session?.user.email ?? "Signed in"}</span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="sm:hidden">
                {PRIMARY_NAV.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </div>
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/goal">Goal</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/career">Career reference</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {signedIn ? (
                <DropdownMenuItem onSelect={() => void signOut()}>Sign out</DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link to="/auth">Sign in to save your paths</Link>
                </DropdownMenuItem>
              )}
              {!signedIn && <DropdownMenuItem onSelect={() => reset()}>Clear demo data</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );

}

export function PlanningEstimateNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      <span className="font-medium text-foreground">Planning estimate.</span> Fork uses the information in your profile
      and the institutional data available to it. Requirements, costs and graduation dates should be confirmed with your
      academic advisor.
    </p>
  );
}

function ShellSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="h-10 w-2/3 rounded bg-muted" />
      <div className="h-4 w-1/2 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-36 rounded-2xl bg-muted" />
        <div className="h-36 rounded-2xl bg-muted" />
        <div className="h-36 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

export function ForkShell({ children }: { children: ReactNode }) {
  // Nothing profile-derived renders until the owner's own data is loaded, so
  // no other account's (or demo) values can flash during loading.
  const { profileReady } = useFork();
  return (
    <div className="min-h-screen bg-background">
      <ForkNav />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        {profileReady ? children : <ShellSkeleton />}
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <PlanningEstimateNote className="max-w-3xl border-t border-border pt-6" />
      </footer>
    </div>
  );
}
