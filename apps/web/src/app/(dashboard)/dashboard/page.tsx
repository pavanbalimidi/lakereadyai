"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Database, GaugeCircle, ShieldAlert, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { ScoreRing } from "@/components/score-ring";
import { clientApi } from "@/lib/client-api";
import { formatDate, formatNumber } from "@/lib/utils";

export default function DashboardOverview() {
  const connections = useQuery({
    queryKey: ["connections"],
    queryFn: clientApi.listConnections,
  });
  const scans = useQuery({ queryKey: ["scans"], queryFn: clientApi.listScans });

  const latestScan = scans.data?.find((s) => s.status === "succeeded");
  const latestReport = useQuery({
    queryKey: ["report", latestScan?.id],
    queryFn: () => clientApi.getReport(latestScan!.id),
    enabled: !!latestScan,
  });

  const score = latestReport.data?.readiness_score ?? 0;

  return (
    <div>
      <PageHeader
        title="AI Readiness Overview"
        description="Latest signal from your data platform — refreshed continuously."
        actions={
          <Button asChild>
            <Link href="/scans">
              New scan <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI Readiness Score</CardTitle>
                <CardDescription>
                  {latestReport.data?.inventory.workspace ?? "No scan yet"}
                </CardDescription>
              </div>
              <Badge variant="outline">
                {latestReport.data?.inventory.source ?? "—"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-8 sm:flex-row">
            <ScoreRing score={score} label="overall" />
            <div className="flex-1 space-y-3">
              {latestReport.data?.inventory.narrative ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {latestReport.data.inventory.narrative}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Connect a workspace and run your first scan to populate this dashboard.
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Stat
                  label="RAG"
                  value={latestReport.data?.rag_readiness_score ?? 0}
                />
                <Stat
                  label="Semantic"
                  value={latestReport.data?.semantic_maturity_score ?? 0}
                />
                <Stat
                  label="Findings"
                  value={latestReport.data?.findings.length ?? 0}
                  raw
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>What we last saw</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Database} label="Tables">
              {formatNumber(latestReport.data?.inventory.stats.tables ?? 0)}
            </Row>
            <Row icon={GaugeCircle} label="Pipelines">
              {formatNumber(latestReport.data?.inventory.stats.pipelines ?? 0)}
            </Row>
            <Row icon={ShieldAlert} label="Untagged PII">
              {formatNumber(
                latestReport.data?.inventory.stats.untagged_pii_columns ?? 0,
              )}
            </Row>
            <Row icon={Sparkles} label="Documented tables">
              {latestReport.data?.inventory.stats.documented_tables_pct ?? 0}%
            </Row>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 px-8 pb-12 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Connections</CardTitle>
            <CardDescription>
              {connections.data?.length ?? 0} configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {connections.data?.slice(0, 5).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.type}</div>
                </div>
                <Badge variant="outline">{formatDate(c.updated_at)}</Badge>
              </div>
            ))}
            {!connections.data?.length && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/connections">+ Add your first connection</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent scans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {scans.data?.slice(0, 5).map((s) => (
              <Link
                key={s.id}
                href={`/scans/${s.id}`}
                className="flex items-center justify-between rounded-lg border p-3 transition hover:bg-accent"
              >
                <div>
                  <div className="text-sm font-medium">
                    Scan {s.id.slice(0, 8)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(s.created_at)}
                  </div>
                </div>
                <Badge
                  variant={
                    s.status === "succeeded"
                      ? "success"
                      : s.status === "failed"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {s.status}
                </Badge>
              </Link>
            ))}
            {!scans.data?.length && (
              <p className="text-sm text-muted-foreground">No scans yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  raw,
}: {
  label: string;
  value: number;
  raw?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">
        {raw ? value : `${value}`}
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="font-medium tabular-nums">{children}</div>
    </div>
  );
}
