import type {
  Connection,
  ConnectionType,
  Report,
  Scan,
} from "@/lib/api";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const clientApi = {
  listConnections: () => request<Connection[]>("/v1/connections"),
  getConnection: (id: string) => request<Connection>(`/v1/connections/${id}`),
  createConnection: (body: {
    name: string;
    type: ConnectionType;
    config: Record<string, unknown>;
  }) =>
    request<Connection>("/v1/connections", {
      method: "POST",
      body: JSON.stringify(body),
    }),
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
