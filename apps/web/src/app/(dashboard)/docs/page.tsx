import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  ChevronRight,
  CircleCheck,
  Database,
  FileText,
  Layers,
  Lock,
  Network,
  Search,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/code-block";

const PILLARS = [
  {
    icon: FileText,
    name: "Metadata",
    weight: 20,
    desc: "Coverage of table & column descriptions",
    fail: "AI agents hallucinate semantics without grounding",
    color: "from-blue-500/30 to-blue-500/0",
    accent: "text-blue-300",
  },
  {
    icon: Database,
    name: "Schema quality",
    weight: 20,
    desc: "Primary keys, partitioning, optimized layouts",
    fail: "Entity resolution fails; queries scan whole tables",
    color: "from-cyan-500/30 to-cyan-500/0",
    accent: "text-cyan-300",
  },
  {
    icon: ShieldCheck,
    name: "Governance",
    weight: 20,
    desc: "PII tagging, masking, access policies",
    fail: "Regulatory exposure when LLMs touch sensitive data",
    color: "from-emerald-500/30 to-emerald-500/0",
    accent: "text-emerald-300",
  },
  {
    icon: Sparkles,
    name: "RAG readiness",
    weight: 20,
    desc: "Vector indices over high-value text columns",
    fail: "Retrieval scans documents at query time — slow & expensive",
    color: "from-fuchsia-500/30 to-fuchsia-500/0",
    accent: "text-fuchsia-300",
  },
  {
    icon: Layers,
    name: "Semantic layer",
    weight: 10,
    desc: "Business entities (Customer360, Revenue, Risk)",
    fail: "AI can't resolve 'top customers by LTV' reliably",
    color: "from-amber-500/30 to-amber-500/0",
    accent: "text-amber-300",
  },
  {
    icon: Activity,
    name: "Operational health",
    weight: 10,
    desc: "Pipeline freshness, lineage explainability",
    fail: "Stale data degrades AI silently; audits become impossible",
    color: "from-rose-500/30 to-rose-500/0",
    accent: "text-rose-300",
  },
];

const NAV = [
  { id: "quickstart", label: "Quick start" },
  { id: "connectors", label: "Connectors" },
  { id: "scoring", label: "How scoring works" },
  { id: "pillars", label: "The 6 pillars" },
  { id: "security", label: "Security" },
  { id: "faq", label: "FAQ" },
];

const FAQ = [
  {
    q: "Do you store our data?",
    a: "No. Scans are read-only on metadata only — table/column names, descriptions, sizes, lineage edges. We never read row-level data, never copy tables, and never train models on your catalog. Inventory snapshots are stored in your tenant database.",
  },
  {
    q: "How long does a scan take?",
    a: "Mock data: 1–2 seconds. Snowflake (10k tables): 30–90 seconds, gated by ACCOUNT_USAGE query latency. Databricks Unity Catalog (10k tables): 2–5 minutes, mostly waiting on the metadata API.",
  },
  {
    q: "Can we self-host?",
    a: "Yes. The product ships as a Docker Compose stack and as a Helm chart. Self-hosted deploys can pin to a specific Anthropic model or swap to your own LLM provider for the AI augmentation layer.",
  },
  {
    q: "What permissions do you need?",
    a: "Minimum-privilege everywhere. Snowflake: USAGE on a warehouse + SELECT on SNOWFLAKE.ACCOUNT_USAGE. Databricks: a personal access token with metadata read access on the catalogs you scan. Both are read-only — we cannot write.",
  },
  {
    q: "How accurate is the score?",
    a: "The score is deterministic and reproducible — same inventory snapshot, same score. Pillar weights are documented and tunable per workspace. The Claude-generated narrative augments findings; the underlying numbers are not LLM-derived.",
  },
  {
    q: "What happens to PII you detect?",
    a: "We flag column names matching PII patterns (regex + heuristic). The column name and table FQN are stored in the report. Actual data values are never read or stored. You can mask column names from reports via workspace settings.",
  },
];

export default function DocsPage() {
  return (
    <div className="relative">
      {/* Subtle gradient backdrop */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 gradient-mesh opacity-60" />

      {/* === Hero === */}
      <section className="border-b border-white/5">
        <div className="px-8 py-16">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-blue-400">
              <BookOpen className="h-3.5 w-3.5" /> Documentation
            </div>
            <h1 className="mt-4 text-balance text-5xl font-semibold tracking-tight">
              Connect a warehouse, get a readiness score in minutes.
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-white/60">
              Everything you need to wire connections, understand the score, and ship
              fixes — read the right section based on where you are in your scan.
            </p>

            {/* Search-looking input (visual only for now) */}
            <div className="mt-8 flex max-w-xl items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 backdrop-blur transition-colors focus-within:border-white/20">
              <Search className="h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Search docs… (try: 'PII tagging', 'unity catalog token')"
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
              />
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/40">
                ⌘K
              </kbd>
            </div>

            {/* Quick nav chips */}
            <nav className="mt-8 flex flex-wrap gap-2">
              {NAV.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-white/60 backdrop-blur transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
                >
                  {n.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* === Quick start === */}
      <section id="quickstart" className="border-b border-white/5">
        <div className="px-8 py-20">
          <div className="mx-auto max-w-5xl">
            <SectionHeader
              eyebrow="Quick start"
              title="Three steps to your first report"
              sub="Most users go from signup to a real readiness score in under 10 minutes."
            />
            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  n: "01",
                  title: "Connect a source",
                  body: "Add a Databricks workspace, a Snowflake account, or use the Mock connector to evaluate without credentials.",
                  cta: { href: "/connections", label: "Add connection" },
                },
                {
                  n: "02",
                  title: "Run a scan",
                  body: "We walk your catalog read-only. 12k tables in ~3 minutes. Live progress, no babysitting.",
                  cta: { href: "/scans", label: "View scans" },
                },
                {
                  n: "03",
                  title: "Read the report",
                  body: "0–100 readiness score, 6 pillars, prioritized findings. Export the roadmap to Jira in one click.",
                  cta: { href: "/dashboard", label: "Open dashboard" },
                },
              ].map((s) => (
                <div
                  key={s.n}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur transition-colors hover:border-white/20"
                >
                  <div className="text-xs font-mono text-white/30">{s.n}</div>
                  <h3 className="mt-2 text-lg font-medium">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {s.body}
                  </p>
                  <Link
                    href={s.cta.href}
                    className="mt-4 inline-flex items-center gap-1 text-sm text-blue-400 transition-colors hover:text-blue-300"
                  >
                    {s.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === Connectors === */}
      <section id="connectors" className="border-b border-white/5">
        <div className="px-8 py-20">
          <div className="mx-auto max-w-5xl">
            <SectionHeader
              eyebrow="Connectors"
              title="Wire your warehouse"
              sub="All connectors are read-only. Credentials are encrypted at rest with envelope encryption (KEK in your KMS, DEK per connection)."
            />

            <div className="mt-12 space-y-6">
              {/* Databricks */}
              <ConnectorCard
                accent="from-orange-500/20 to-red-500/10"
                iconBg="from-orange-500 to-red-500"
                Icon={Zap}
                name="Databricks"
                tagline="Unity Catalog · Workspaces"
                permissions={[
                  "Personal access token with workspace access",
                  "USE CATALOG on the catalogs you want to scan",
                  "SELECT on system.access.* for lineage (optional but recommended)",
                ]}
                code={`# Required env vars
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=dapi***********************
DATABRICKS_WAREHOUSE_ID=abc123  # optional`}
              />

              {/* Snowflake */}
              <ConnectorCard
                accent="from-cyan-500/20 to-blue-500/10"
                iconBg="from-cyan-500 to-blue-500"
                Icon={Snowflake}
                name="Snowflake"
                tagline="ACCOUNT_USAGE · INFORMATION_SCHEMA"
                permissions={[
                  "Service account with USAGE on a warehouse",
                  "SELECT on SNOWFLAKE.ACCOUNT_USAGE.{TABLES,COLUMNS,SCHEMATA,TASK_HISTORY}",
                  "Optional: ACCESS_HISTORY for column-level lineage",
                ]}
                code={`# Required env vars
SNOWFLAKE_ACCOUNT=ab12345.us-east-1
SNOWFLAKE_USER=READINESS_SVC
SNOWFLAKE_PASSWORD=********
SNOWFLAKE_WAREHOUSE=READINESS_WH
SNOWFLAKE_ROLE=READINESS_READER`}
              />

              {/* Mock */}
              <ConnectorCard
                accent="from-fuchsia-500/20 to-purple-500/10"
                iconBg="from-fuchsia-500 to-purple-500"
                Icon={Sparkles}
                name="Mock"
                tagline="No credentials required · For evaluation"
                permissions={[
                  "Generates a realistic synthetic catalog (12 tables, 4 pipelines)",
                  "Includes documented + undocumented tables, untagged PII, failed jobs",
                  "Useful for demos, onboarding, and writing tests",
                ]}
                code={`# Just create the connection — no config needed
type: mock
config: {}  # empty`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* === How scoring works === */}
      <section id="scoring" className="border-b border-white/5">
        <div className="px-8 py-20">
          <div className="mx-auto max-w-5xl">
            <SectionHeader
              eyebrow="How it works"
              title="Deterministic scoring, AI-augmented narrative"
              sub="Numbers are reproducible — Claude only writes the executive summary and ranks recommendations."
            />

            {/* Pipeline diagram */}
            <div className="mt-12 grid grid-cols-1 items-stretch gap-3 md:grid-cols-7">
              <PipelineStep n="1" title="Connector" sub="Walks the catalog" Icon={Database} />
              <PipelineArrow />
              <PipelineStep n="2" title="Inventory" sub="Snapshot in tenant DB" Icon={FileText} />
              <PipelineArrow />
              <PipelineStep n="3" title="Scoring" sub="6 pillars, weighted" Icon={Workflow} />
              <PipelineArrow />
              <PipelineStep n="4" title="Claude" sub="Narrative + ranking" Icon={Sparkles} />
            </div>

            <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur">
              <div className="text-xs uppercase tracking-widest text-white/40">
                The formula
              </div>
              <CodeBlock language="python" className="mt-3">
{`readiness_score = sum(pillar.weight * pillar.score for pillar in pillars)

# pillars = [Metadata, Schema, Governance, RAG, Semantic, Operational]
# weights  = [0.20,    0.20,   0.20,       0.20, 0.10,    0.10]
# scores   = 0..100 each, computed deterministically from the inventory`}
              </CodeBlock>
            </div>
          </div>
        </div>
      </section>

      {/* === Pillars grid === */}
      <section id="pillars" className="border-b border-white/5">
        <div className="px-8 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="The 6 pillars"
              title="What we measure, and why it matters"
              sub="Each pillar maps to specific checks against your inventory snapshot. Click through any pillar in the report to see the underlying tables and columns."
            />
            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {PILLARS.map((p) => (
                <div
                  key={p.name}
                  className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur transition-all hover:border-white/20`}
                >
                  <div
                    className={`absolute -inset-px -z-10 rounded-2xl bg-gradient-to-br ${p.color} opacity-0 transition-opacity group-hover:opacity-100`}
                  />
                  <div className="flex items-start justify-between">
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${p.color} ${p.accent}`}
                    >
                      <p.icon className="h-5 w-5" />
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-2xl font-semibold tabular-nums text-white">
                        {p.weight}
                        <span className="text-base text-white/40">%</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-white/30">
                        weight
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-5 text-lg font-medium">{p.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {p.desc}
                  </p>
                  <div className="mt-4 rounded-lg border border-white/5 bg-black/30 p-3">
                    <div className="text-[10px] uppercase tracking-widest text-rose-400/80">
                      What fails when this is low
                    </div>
                    <div className="mt-1 text-sm text-white/70">{p.fail}</div>
                  </div>

                  {/* Weight bar */}
                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full bg-gradient-to-r ${p.color.replace("/0", "/80")}`}
                      style={{ width: `${p.weight * 5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === Security panel === */}
      <section id="security" className="border-b border-white/5">
        <div className="px-8 py-20">
          <div className="mx-auto max-w-5xl">
            <SectionHeader
              eyebrow="Security"
              title="Read-only by design"
              sub="What we do, what we never do, and how the data flows."
            />

            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6 backdrop-blur">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CircleCheck className="h-5 w-5" />
                  <h3 className="font-medium">What we do</h3>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-white/70">
                  {[
                    "Read metadata: table/column names, descriptions, sizes, types",
                    "Read pipeline status (success/fail/schedule)",
                    "Read lineage edges (upstream → downstream FQNs)",
                    "Store inventory snapshots in your tenant database",
                    "Encrypt connection credentials with envelope encryption",
                  ].map((x) => (
                    <li key={x} className="flex gap-2">
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-6 backdrop-blur">
                <div className="flex items-center gap-2 text-rose-400">
                  <Lock className="h-5 w-5" />
                  <h3 className="font-medium">What we never do</h3>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-white/70">
                  {[
                    "Read row-level data from any table",
                    "Copy or replicate your data",
                    "Train models on your catalog",
                    "Share inventory snapshots across tenants",
                    "Require write permissions of any kind",
                  ].map((x) => (
                    <li key={x} className="flex gap-2">
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur">
              <ShieldCheck className="h-5 w-5 text-blue-400" />
              <div className="text-sm text-white/70">
                <span className="font-medium text-white">Self-hosted available.</span>{" "}
                For regulated workloads, deploy the API + worker into your VPC. Data
                never leaves your network — Anthropic API calls are optional and can
                be swapped for an in-VPC LLM endpoint.
              </div>
              <Network className="ml-auto h-5 w-5 text-white/30" />
            </div>
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <section id="faq" className="border-b border-white/5">
        <div className="px-8 py-20">
          <div className="mx-auto max-w-3xl">
            <SectionHeader
              eyebrow="FAQ"
              title="Common questions"
              sub="Don't see yours? Email us — every question becomes a doc."
            />
            <div className="mt-12 space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-white/10 bg-white/[0.02] backdrop-blur transition-colors open:border-white/20"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-white">
                    {item.q}
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/40 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-5 pb-5 text-sm leading-relaxed text-white/60">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === CTA strip === */}
      <section>
        <div className="px-8 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-cyan-500/20 p-10 text-center backdrop-blur-xl md:p-14">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
              <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                Ready to score your platform?
              </h2>
              <p className="mt-3 text-white/60">
                Connect a source and run your first scan in under 10 minutes.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
                  <Link href="/connections">
                    Add connection <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href="/scans">View scans</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-xs uppercase tracking-[0.25em] text-blue-400">{eyebrow}</div>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-white/60">{sub}</p>
    </div>
  );
}

function ConnectorCard({
  accent,
  iconBg,
  Icon,
  name,
  tagline,
  permissions,
  code,
}: {
  accent: string;
  iconBg: string;
  Icon: React.ComponentType<{ className?: string }>;
  name: string;
  tagline: string;
  permissions: string[];
  code: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur md:p-8">
      <div
        className={`absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br ${accent} blur-3xl`}
      />
      <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-3">
            <div
              className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${iconBg} text-white shadow-lg`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-medium">{name}</div>
              <div className="text-xs text-white/40">{tagline}</div>
            </div>
          </div>
          <h4 className="mt-6 text-xs uppercase tracking-widest text-white/40">
            Required permissions
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {permissions.map((p) => (
              <li key={p} className="flex gap-2">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/80" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-white/40">
            Configuration
          </h4>
          <CodeBlock language="env" className="mt-3">
            {code}
          </CodeBlock>
        </div>
      </div>
    </div>
  );
}

function PipelineStep({
  n,
  title,
  sub,
  Icon,
}: {
  n: string;
  title: string;
  sub: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center backdrop-blur md:col-span-1">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/20 text-blue-300">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 font-mono text-[10px] text-white/30">STEP {n}</div>
      <div className="mt-1 text-sm font-medium">{title}</div>
      <div className="text-xs text-white/40">{sub}</div>
    </div>
  );
}

function PipelineArrow() {
  return (
    <div className="hidden items-center justify-center md:col-span-1 md:flex">
      <ArrowRight className="h-5 w-5 text-white/20" />
    </div>
  );
}
