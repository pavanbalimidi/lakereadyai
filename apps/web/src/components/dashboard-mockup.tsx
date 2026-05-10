"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";

export function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 12 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformPerspective: 1400 }}
      className="relative mx-auto w-full max-w-5xl"
    >
      {/* outer glow */}
      <div className="absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-cyan-400/30 blur-3xl" />
      {/* window chrome */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a14]/95 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.02] px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/70" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <div className="h-3 w-3 rounded-full bg-green-500/70" />
          </div>
          <div className="ml-2 text-xs text-white/40">readiness · prod-databricks</div>
        </div>

        <div className="grid grid-cols-12 gap-4 p-6">
          {/* score ring */}
          <div className="col-span-12 md:col-span-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-xs uppercase tracking-wider text-white/50">
                Readiness
              </div>
              <div className="mt-4 grid place-items-center">
                <svg width="160" height="160" className="-rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    strokeWidth="12"
                    className="fill-none stroke-white/5"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="68"
                    strokeWidth="12"
                    strokeLinecap="round"
                    className="fill-none stroke-amber-400"
                    initial={{ strokeDasharray: 427, strokeDashoffset: 427 }}
                    whileInView={{ strokeDashoffset: 162 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                  />
                </svg>
                <div className="-mt-[110px] text-center">
                  <div className="text-4xl font-semibold text-amber-400">62</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40">
                    overall
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* stats */}
          <div className="col-span-12 grid gap-3 md:col-span-8 md:grid-cols-2">
            {[
              {
                icon: Database,
                label: "Tables scanned",
                value: "12,418",
                sub: "78% documented",
              },
              {
                icon: ShieldAlert,
                label: "Untagged PII",
                value: "237",
                sub: "of 412 detected",
                warn: true,
              },
              {
                icon: Sparkles,
                label: "RAG readiness",
                value: "60",
                sub: "vector index missing",
              },
              {
                icon: Zap,
                label: "Pipelines",
                value: "184",
                sub: "3 failed last run",
              },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-wider text-white/50">
                    {s.label}
                  </div>
                  <s.icon
                    className={`h-4 w-4 ${
                      s.warn ? "text-red-400" : "text-blue-400"
                    }`}
                  />
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-white">
                  {s.value}
                </div>
                <div className="text-xs text-white/40">{s.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* findings strip */}
          <div className="col-span-12 mt-2 space-y-2">
            {[
              {
                icon: AlertTriangle,
                color: "text-amber-400",
                title: "237 likely-PII columns without governance tags",
                tag: "high",
                tagColor: "bg-red-500/15 text-red-400",
              },
              {
                icon: AlertTriangle,
                color: "text-amber-400",
                title: "No vector index detected — RAG retrieval will scan at query time",
                tag: "high",
                tagColor: "bg-red-500/15 text-red-400",
              },
              {
                icon: CheckCircle2,
                color: "text-emerald-400",
                title: "Lineage edges captured across silver and gold layers",
                tag: "ok",
                tagColor: "bg-emerald-500/15 text-emerald-400",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.015] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <f.icon className={`h-4 w-4 ${f.color}`} />
                  <span className="text-sm text-white/80">{f.title}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${f.tagColor}`}
                >
                  {f.tag}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
