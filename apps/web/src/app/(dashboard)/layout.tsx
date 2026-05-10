import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Database,
  GaugeCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { auth, signOut } from "@/auth";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/connections", label: "Connections", icon: Database },
  { href: "/scans", label: "Scans", icon: GaugeCircle },
  { href: "/governance", label: "Governance", icon: ShieldCheck },
  { href: "/docs", label: "Docs", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr] bg-background">
      <aside className="sticky top-0 flex h-screen flex-col border-r bg-card/40 backdrop-blur">
        <Link href="/dashboard" className="flex items-center gap-2 px-6 py-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Readiness</span>
        </Link>
        <Separator />
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <Separator />
        <div className="space-y-1 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
              {session.user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {session.user?.name ?? session.user?.email}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {session.user?.orgId ?? ""}
              </div>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button variant="ghost" size="sm" className="w-full justify-start" type="submit">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
