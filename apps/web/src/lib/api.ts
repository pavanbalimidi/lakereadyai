import { auth } from "@/auth";

export type ConnectionType = "databricks" | "snowflake" | "mock";

export interface Connection {
  id: string;
  name: string;
  type: ConnectionType;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Scan {
  id: string;
  connection_id: string;
  status: "pending" | "running" | "succeeded" | "failed";
  error: string | null;
  progress: number;
  summary: {
    readiness_score?: number;
    tables?: number;
    findings_count?: number;
    recommendations_count?: number;
  };
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface Pillar {
  id: string;
  name: string;
  score: number;
  weight: number;
}

export interface Finding {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  evidence: string[];
}

export interface Recommendation {
  id: string;
  priority: "low" | "medium" | "high";
  title: string;
  description: string;
  effort: "low" | "medium" | "high";
}

export interface Report {
  id: string;
  scan_id: string;
  readiness_score: number;
  rag_readiness_score: number;
  semantic_maturity_score: number;
  pillars: Pillar[];
  findings: Finding[];
  recommendations: Recommendation[];
  inventory: {
    stats: {
      schemas: number;
      tables: number;
      columns: number;
      documented_tables_pct: number;
      documented_columns_pct: number;
      pii_columns: number;
      untagged_pii_columns: number;
      pipelines: number;
      failed_pipelines: number;
      lineage_edges: number;
      delta_or_iceberg_tables: number;
      total_size_bytes: number;
    };
    narrative: string;
    source: string;
    workspace: string | null;
  };
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function authHeader(): Promise<HeadersInit> {
  const session = await auth();
  if (session?.accessToken) {
    return { Authorization: `Bearer ${session.accessToken}` };
  }
  return {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeader()),
    ...(init.headers ?? {}),
  };
  const res = await fetch(`${API}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listConnections: () => request<Connection[]>("/v1/connections"),
  getConnection: (id: string) => request<Connection>(`/v1/connections/${id}`),
  createConnection: (body: { name: string; type: ConnectionType; config: Record<string, unknown> }) =>
    request<Connection>("/v1/connections", { method: "POST", body: JSON.stringify(body) }),
  deleteConnection: (id: string) =>
    request<void>(`/v1/connections/${id}`, { method: "DELETE" }),
  testConnection: (id: string) =>
    request<{ ok: boolean; message: string }>(`/v1/connections/${id}/test`, {
      method: "POST",
    }),

  listScans: () => request<Scan[]>("/v1/scans"),
  getScan: (id: string) => request<Scan>(`/v1/scans/${id}`),
  startScan: (connectionId: string) =>
    request<Scan>("/v1/scans", {
      method: "POST",
      body: JSON.stringify({ connection_id: connectionId }),
    }),
  getReport: (scanId: string) => request<Report>(`/v1/scans/${scanId}/report`),
};
