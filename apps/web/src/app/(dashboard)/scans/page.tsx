"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Progress } from "@/components/ui/progress";
import { clientApi } from "@/lib/client-api";
import { formatDate, scoreColor } from "@/lib/utils";

export default function ScansListPage() {
  const { data: scans, isLoading } = useQuery({
    queryKey: ["scans"],
    queryFn: clientApi.listScans,
    refetchInterval: 4000,
  });

  return (
    <div>
      <PageHeader
        title="Scans"
        description="Each scan walks your catalog, scores readiness, and generates findings."
      />
      <div className="space-y-3 p-8">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {scans?.map((s) => (
          <Link key={s.id} href={`/scans/${s.id}`}>
            <Card className="transition hover:border-primary/50">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="font-medium">Scan {s.id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(s.created_at)} · connection {s.connection_id.slice(0, 8)}
                  </div>
                </div>
                <div className="hidden flex-1 sm:block">
                  {s.status === "running" || s.status === "pending" ? (
                    <Progress value={s.progress} />
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  {s.summary?.readiness_score !== undefined && (
                    <span
                      className={`text-2xl font-semibold tabular-nums ${scoreColor(
                        s.summary.readiness_score,
                      )}`}
                    >
                      {s.summary.readiness_score}
                    </span>
                  )}
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
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!isLoading && !scans?.length && (
          <Card>
            <CardContent className="p-8 text-sm text-muted-foreground">
              No scans yet.{" "}
              <Link href="/connections" className="text-primary underline">
                Run one from a connection
              </Link>
              .
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
