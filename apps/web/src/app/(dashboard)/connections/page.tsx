"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { clientApi } from "@/lib/client-api";
import type { ConnectionType } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ConnectionsPage() {
  const qc = useQueryClient();
  const { data: connections, isLoading } = useQuery({
    queryKey: ["connections"],
    queryFn: clientApi.listConnections,
  });

  const startScan = useMutation({
    mutationFn: clientApi.startScan,
    onSuccess: () => {
      toast.success("Scan started");
      qc.invalidateQueries({ queryKey: ["scans"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const test = useMutation({
    mutationFn: clientApi.testConnection,
    onSuccess: (r) =>
      r.ok ? toast.success(r.message) : toast.error(r.message),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: clientApi.deleteConnection,
    onSuccess: () => {
      toast.success("Connection deleted");
      qc.invalidateQueries({ queryKey: ["connections"] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Connections"
        description="Connect Databricks, Snowflake, or use the demo source to evaluate your AI readiness."
        actions={<NewConnectionDialog />}
      />

      <div className="space-y-3 p-8">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {connections?.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  {c.type[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.type} · updated {formatDate(c.updated_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{c.type}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => test.mutate(c.id)}
                  disabled={test.isPending}
                >
                  Test
                </Button>
                <Button
                  size="sm"
                  onClick={() => startScan.mutate(c.id)}
                  disabled={startScan.isPending}
                >
                  <Zap className="h-4 w-4" /> Run scan
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove.mutate(c.id)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && !connections?.length && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <Plus className="h-5 w-5" />
              </div>
              <div className="text-lg font-medium">No connections yet</div>
              <p className="max-w-sm text-sm text-muted-foreground">
                Add a Databricks or Snowflake workspace, or use the built-in mock
                source to see the product end-to-end without credentials.
              </p>
              <NewConnectionDialog />
            </CardContent>
          </Card>
        )}
        <p className="px-1 text-xs text-muted-foreground">
          Need help wiring credentials?{" "}
          <Link href="/docs" className="underline">
            Read the connection guide
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function NewConnectionDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ConnectionType>("mock");
  const [config, setConfig] = useState<Record<string, string>>({});

  const create = useMutation({
    mutationFn: clientApi.createConnection,
    onSuccess: () => {
      toast.success("Connection created");
      qc.invalidateQueries({ queryKey: ["connections"] });
      setOpen(false);
      setName("");
      setConfig({});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function field(key: string, label: string, secret = false) {
    return (
      <div className="space-y-1.5" key={key}>
        <Label htmlFor={key}>{label}</Label>
        <Input
          id={key}
          type={secret ? "password" : "text"}
          value={config[key] ?? ""}
          onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
        />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New connection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New connection</DialogTitle>
          <DialogDescription>
            Choose a source type. Credentials are stored encrypted at rest and
            scoped to your workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="conn-name">Display name</Label>
            <Input
              id="conn-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production · Databricks"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Source type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ConnectionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="databricks">Databricks · Unity Catalog</SelectItem>
                <SelectItem value="snowflake">Snowflake</SelectItem>
                <SelectItem value="mock">Mock (demo data)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "databricks" && (
            <>
              {field("host", "Workspace URL (https://...)")}
              {field("token", "Personal access token", true)}
              {field("warehouse_id", "SQL warehouse ID (optional)")}
            </>
          )}
          {type === "snowflake" && (
            <>
              {field("account", "Account identifier")}
              {field("user", "User")}
              {field("password", "Password", true)}
              {field("warehouse", "Warehouse (optional)")}
              {field("role", "Role (optional)")}
            </>
          )}
          {type === "mock" && (
            <p className="text-sm text-muted-foreground">
              The mock source generates a realistic synthetic catalog so you can
              evaluate scoring and reports without real credentials.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name || create.isPending}
            onClick={() => create.mutate({ name, type, config })}
          >
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
