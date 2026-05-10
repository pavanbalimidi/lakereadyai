"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart } from "@tremor/react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { ScoreRing } from "@/components/score-ring";
import { clientApi } from "@/lib/client-api";
import { formatBytes, formatDate, formatNumber, severityVariant } from "@/lib/utils";

export default function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const scan = useQuery({
    queryKey: ["scan", id],
    queryFn: () => clientApi.getScan(id),
    refetchInterval: (q) =>
      q.state.data?.status === "succeeded" || q.state.data?.status === "failed"
        ? false
        : 2000,
  });

  const ready = scan.data?.status === "succeeded";
  const report = useQuery({
    queryKey: ["report", id],
    queryFn: () => clientApi.getReport(id),
    enabled: ready,
  });

  if (scan.isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!scan.data) return null;

  if (!ready) {
    return (
      <div>
        <PageHeader title={`Scan ${id.slice(0, 8)}`} description="Working…" />
        <div className="p-8">
          <Card>
            <CardContent className="space-y-4 p-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  Status: <strong>{scan.data.status}</strong>
                </span>
              </div>
              <Progress value={scan.data.progress} />
              {scan.data.error && (
                <p className="text-sm text-destructive">Error: {scan.data.error}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const r = report.data;
  if (!r) {
    return (
      <div className="p-8 text-muted-foreground">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading report…
      </div>
    );
  }

  const pillarBars = r.pillars.map((p) => ({
    pillar: p.name,
    score: p.score,
  }));
  const inv = r.inventory.stats;

  return (
    <div>
      <PageHeader
        title={`AI Readiness Report`}
        description={`${r.inventory.workspace ?? r.inventory.source} · scanned ${formatDate(r.created_at)}`}
        actions={<Badge variant="outline">{r.inventory.source}</Badge>}
      />

      <div className="grid gap-6 p-8 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overall</CardTitle>
            <CardDescription>Weighted across 6 pillars</CardDescription>
          </CardHeader>
          <CardContent className="grid place-items-center pt-0">
            <ScoreRing score={r.readiness_score} label="readiness" />
            {r.inventory.narrative && (
              <p className="mt-4 max-w-xs text-center text-sm text-muted-foreground">
                {r.inventory.narrative}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pillar breakdown</CardTitle>
            <CardDescription>0-100, deterministic + AI-augmented</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={pillarBars}
              index="pillar"
              categories={["score"]}
              colors={["blue"]}
              yAxisWidth={40}
              showLegend={false}
              valueFormatter={(v) => `${v}`}
              className="h-64"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 px-8 lg:grid-cols-3">
        <KpiCard
          label="Tables"
          value={formatNumber(inv.tables)}
          sub={`${inv.documented_tables_pct}% documented`}
          icon={Sparkles}
        />
        <KpiCard
          label="PII columns"
          value={formatNumber(inv.pii_columns)}
          sub={`${inv.untagged_pii_columns} untagged`}
          icon={ShieldAlert}
          warn={inv.untagged_pii_columns > 0}
        />
        <KpiCard
          label="Storage"
          value={formatBytes(inv.total_size_bytes)}
          sub={`${inv.delta_or_iceberg_tables} optimized tables`}
          icon={CheckCircle2}
        />
      </div>

      <div className="p-8">
        <Tabs defaultValue="findings">
          <TabsList>
            <TabsTrigger value="findings">
              Findings ({r.findings.length})
            </TabsTrigger>
            <TabsTrigger value="recs">
              Recommendations ({r.recommendations.length})
            </TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="findings" className="space-y-3">
            {r.findings.map((f) => (
              <Card key={f.id}>
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                      <div>
                        <div className="font-medium">{f.title}</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {f.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant={severityVariant(f.severity)}>{f.severity}</Badge>
                  </div>
                  {f.evidence?.length > 0 && (
                    <details className="rounded-md bg-muted/50 p-3 text-xs">
                      <summary className="cursor-pointer text-muted-foreground">
                        Evidence ({f.evidence.length})
                      </summary>
                      <ul className="mt-2 space-y-1 font-mono">
                        {f.evidence.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
            {!r.findings.length && (
              <Card>
                <CardContent className="p-8 text-sm text-muted-foreground">
                  Nothing flagged. Either things are pristine, or rerun with deeper
                  analysis.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recs" className="space-y-3">
            {r.recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <div className="font-medium">{rec.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {rec.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 whitespace-nowrap">
                    <Badge variant={severityVariant(rec.priority)}>
                      {rec.priority} priority
                    </Badge>
                    <Badge variant="outline">{rec.effort} effort</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardContent className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Schemas" value={inv.schemas} />
                <Stat label="Tables" value={inv.tables} />
                <Stat label="Columns" value={inv.columns} />
                <Stat label="Pipelines" value={inv.pipelines} />
                <Stat label="Failed pipelines" value={inv.failed_pipelines} />
                <Stat label="Lineage edges" value={inv.lineage_edges} />
                <Stat label="Δ/Iceberg tables" value={inv.delta_or_iceberg_tables} />
                <Stat label="Doc'd columns %" value={inv.documented_columns_pct} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  warn?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
          {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        </div>
        <Icon className={`h-5 w-5 ${warn ? "text-destructive" : "text-primary"}`} />
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">
        {formatNumber(value)}
      </div>
    </div>
  );
}
