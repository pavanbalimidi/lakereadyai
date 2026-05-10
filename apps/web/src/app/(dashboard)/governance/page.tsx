"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { clientApi } from "@/lib/client-api";

export default function GovernancePage() {
  const scans = useQuery({ queryKey: ["scans"], queryFn: clientApi.listScans });
  const latest = scans.data?.find((s) => s.status === "succeeded");
  const report = useQuery({
    queryKey: ["report", latest?.id],
    queryFn: () => clientApi.getReport(latest!.id),
    enabled: !!latest,
  });

  const piiFindings =
    report.data?.findings.filter((f) => f.id.startsWith("gov-")) ?? [];

  return (
    <div>
      <PageHeader
        title="Governance"
        description="PII coverage, access risk, and lineage explainability — drawn from your latest scan."
      />
      <div className="grid gap-6 p-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" /> PII exposure
            </CardTitle>
            <CardDescription>
              Columns matching PII patterns that lack governance tags.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="text-3xl font-semibold tabular-nums">
              {report.data?.inventory.stats.untagged_pii_columns ?? 0}
            </div>
            <p className="mt-1 text-muted-foreground">
              of {report.data?.inventory.stats.pii_columns ?? 0} detected PII columns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" /> Lineage explainability
            </CardTitle>
            <CardDescription>
              Lineage edges captured from the source platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="text-3xl font-semibold tabular-nums">
              {report.data?.inventory.stats.lineage_edges ?? 0}
            </div>
            <p className="mt-1 text-muted-foreground">
              edges across {report.data?.inventory.stats.tables ?? 0} tables
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3 px-8 pb-12">
        {piiFindings.map((f) => (
          <Card key={f.id}>
            <CardContent className="p-5">
              <div className="font-medium">{f.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
            </CardContent>
          </Card>
        ))}
        {!piiFindings.length && (
          <p className="text-sm text-muted-foreground">
            No governance findings. Run a scan to populate this view.
          </p>
        )}
      </div>
    </div>
  );
}
