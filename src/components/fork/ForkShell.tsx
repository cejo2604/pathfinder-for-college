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
  { to: "/home", label: "My Path" },
  { to: "/compare", label: "Compare" },
  { to: "/plan", label: "Plan" },
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
  const { profile, reset } = useFork();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <ForkLogo />

        <nav className="ml-auto flex items-center gap-1 text-sm">
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

          <Button asChild size="lg" className="ml-1 gap-1.5 rounded-full px-4 text-[0.95rem] shadow-lift sm:px-5">
            <Link to="/what-if">
              <Sparkles className="size-4" />
              What If?
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-1 rounded-full" aria-label="Profile and settings">
                <span className="grid size-8 place-items-center rounded-full bg-muted font-medium">
                  {(profile?.name ?? "?").slice(0, 1)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal text-muted-foreground">
                {profile?.name ?? "No student loaded"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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
              <DropdownMenuItem onSelect={() => reset()}>Clear demo data</DropdownMenuItem>
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

export function ForkShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <ForkNav />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <PlanningEstimateNote className="max-w-3xl border-t border-border pt-6" />
      </footer>
    </div>
  );
}
