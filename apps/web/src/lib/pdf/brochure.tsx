/* @react-pdf/renderer document — runs server-side only.
   Don't import this file from a client component.
   eslint-disable react/no-unescaped-entities — these aren't DOM nodes;
   HTML entity escaping would render literally in the PDF. */
/* eslint-disable react/no-unescaped-entities */

import {
  Document,
  Page,
  StyleSheet,
  Svg,
  Text,
  View,
  Circle,
} from "@react-pdf/renderer";

// === Design tokens ============================================================
const C = {
  bg: "#0a0a14",
  surface: "#11111c",
  surfaceAlt: "#161624",
  border: "#22222e",
  text: "#ffffff",
  textDim: "rgba(255,255,255,0.65)",
  textFaint: "rgba(255,255,255,0.45)",
  blue: "#5b6bff",
  blueLight: "#7c8aff",
  fuchsia: "#c026d3",
  cyan: "#22d3ee",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    color: C.text,
    fontFamily: "Helvetica",
    padding: 56,
  },

  // Headers / typography
  eyebrow: {
    fontSize: 9,
    color: C.blueLight,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  h1: { fontSize: 36, fontWeight: 700, lineHeight: 1.05 },
  h2: { fontSize: 22, fontWeight: 700, lineHeight: 1.15, marginBottom: 6 },
  h3: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  body: {
    fontSize: 10.5,
    color: C.textDim,
    lineHeight: 1.55,
  },
  small: { fontSize: 9, color: C.textFaint },
  mono: { fontFamily: "Courier", fontSize: 9, color: C.textDim },

  // Layout helpers
  row: { flexDirection: "row" },
  col: { flexDirection: "column" },
  card: {
    backgroundColor: C.surface,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 18 },

  // Header / footer
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandMark: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: C.blue,
  },
  brandText: { fontSize: 11, fontWeight: 700, color: C.text },
  pageNo: { fontSize: 9, color: C.textFaint },
  footer: {
    position: "absolute",
    left: 56,
    right: 56,
    bottom: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: C.textFaint,
  },
});

// === Reusable components ======================================================
const PageChrome = ({ pageNo, children }: { pageNo: number; children: React.ReactNode }) => (
  <Page size="A4" style={s.page}>
    <View style={s.pageHeader}>
      <View style={s.brandRow}>
        <View style={s.brandMark} />
        <Text style={s.brandText}>Readiness</Text>
      </View>
      <Text style={s.pageNo}>{pageNo} / 8</Text>
    </View>
    {children}
    <View style={s.footer} fixed>
      <Text>AI Readiness Scanner · Enterprise Overview</Text>
      <Text>readiness.ai</Text>
    </View>
  </Page>
);

const Eyebrow = ({ children }: { children: string }) => (
  <Text style={s.eyebrow}>{children}</Text>
);

const Bullet = ({ children }: { children: string }) => (
  <View style={{ flexDirection: "row", marginBottom: 6, alignItems: "flex-start" }}>
    <View
      style={{
        width: 5,
        height: 5,
        borderRadius: 5,
        backgroundColor: C.blueLight,
        marginTop: 5,
        marginRight: 8,
      }}
    />
    <Text style={[s.body, { flex: 1 }]}>{children}</Text>
  </View>
);

// Score ring rendered as SVG
const ScoreRing = ({ score, size = 110 }: { score: number; size?: number }) => {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={C.amber}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c - offset} ${c}`}
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 26, fontWeight: 700, color: C.amber }}>{score}</Text>
        <Text style={{ fontSize: 7, color: C.textFaint, letterSpacing: 1.5 }}>READINESS</Text>
      </View>
    </View>
  );
};

// === The Document =============================================================
export function BrochureDocument() {
  return (
    <Document
      title="AI Readiness Scanner — Enterprise Overview"
      author="Readiness"
      subject="Enterprise AI Readiness for Databricks, Snowflake, Unity Catalog"
    >
      {/* === Cover ============================================================ */}
      <Page size="A4" style={[s.page, { padding: 0 }]}>
        <View
          style={{
            flex: 1,
            padding: 56,
            backgroundColor: C.bg,
            justifyContent: "space-between",
          }}
        >
          {/* Decorative gradient mesh (approximated with blocks) */}
          <View
            style={{
              position: "absolute",
              top: -60,
              right: -80,
              width: 320,
              height: 320,
              borderRadius: 320,
              backgroundColor: C.blue,
              opacity: 0.18,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 80,
              right: 30,
              width: 220,
              height: 220,
              borderRadius: 220,
              backgroundColor: C.fuchsia,
              opacity: 0.12,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: -100,
              left: -60,
              width: 300,
              height: 300,
              borderRadius: 300,
              backgroundColor: C.cyan,
              opacity: 0.1,
            }}
          />

          <View style={s.brandRow}>
            <View style={s.brandMark} />
            <Text style={s.brandText}>Readiness</Text>
          </View>

          <View>
            <Text style={[s.eyebrow, { fontSize: 10 }]}>Enterprise Overview</Text>
            <Text style={[s.h1, { fontSize: 42, marginTop: 12 }]}>
              Know if your data is{"\n"}actually ready for AI.
            </Text>
            <Text style={[s.body, { marginTop: 18, fontSize: 13, color: C.textDim, maxWidth: 460 }]}>
              Score your data platform 0–100 across six pillars. Ship the prioritized
              roadmap to AI in weeks, not quarters. Built for Databricks, Snowflake,
              and Unity Catalog.
            </Text>
          </View>

          <View>
            <View
              style={{
                flexDirection: "row",
                gap: 24,
                paddingTop: 18,
                borderTopWidth: 1,
                borderTopColor: C.border,
              }}
            >
              {[
                { v: "12k+", k: "tables / scan" },
                { v: "10×", k: "faster than manual" },
                { v: "<10 min", k: "to first report" },
                { v: "0", k: "row data read" },
              ].map((m) => (
                <View key={m.k}>
                  <Text style={{ fontSize: 18, fontWeight: 700 }}>{m.v}</Text>
                  <Text style={s.small}>{m.k}</Text>
                </View>
              ))}
            </View>
            <Text style={[s.small, { marginTop: 24 }]}>
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })}
              {"   ·   "}readiness.ai
            </Text>
          </View>
        </View>
      </Page>

      {/* === Page 2: Executive summary / What we do ============================ */}
      <PageChrome pageNo={2}>
        <Eyebrow>What we do</Eyebrow>
        <Text style={s.h2}>The first AI Readiness Score for the enterprise data stack.</Text>
        <Text style={[s.body, { marginTop: 6 }]}>
          Most enterprises know they want AI. Almost none know whether their data
          platform can support it. We connect to your warehouse read-only, walk the
          catalog, and produce a quantitative readiness score with a prioritized
          roadmap — grounded in your actual tables, columns, pipelines, and lineage.
        </Text>

        <View style={s.divider} />

        <View style={[s.row, { gap: 12 }]}>
          {[
            {
              t: "The problem",
              b: "AI initiatives stall on data quality, missing metadata, untagged PII, and absent semantic layers — issues most data teams know exist but can't quantify or prioritize.",
              c: C.rose,
            },
            {
              t: "The solution",
              b: "A deterministic 6-pillar scoring engine over your live catalog metadata, augmented by Claude to write executive-ready findings and rank fixes by ROI.",
              c: C.blue,
            },
            {
              t: "The outcome",
              b: "A defensible 0–100 readiness score. A ranked list of fixes with effort estimates. AI projects unblocked in weeks instead of stalled in committee for quarters.",
              c: C.emerald,
            },
          ].map((b) => (
            <View key={b.t} style={[s.card, { flex: 1 }]}>
              <View style={{ width: 18, height: 3, backgroundColor: b.c, marginBottom: 10 }} />
              <Text style={s.h3}>{b.t}</Text>
              <Text style={s.body}>{b.b}</Text>
            </View>
          ))}
        </View>

        <View style={s.divider} />

        <Eyebrow>Who it's for</Eyebrow>
        <Text style={s.h2}>Best fit scenarios</Text>
        <View style={{ marginTop: 6 }}>
          <Bullet>
            Data leaders being asked "are we ready for AI?" by the CEO/board and lacking a defensible answer.
          </Bullet>
          <Bullet>
            Platform teams about to launch RAG, agents, or Customer360 — and needing to de-risk the data layer first.
          </Bullet>
          <Bullet>
            Governance and compliance owners ahead of audits, model risk reviews, or regulator inquiries about AI usage.
          </Bullet>
          <Bullet>
            Data consultancies and SIs running maturity assessments for clients who want quantitative output, not slideware.
          </Bullet>
        </View>
      </PageChrome>

      {/* === Page 3: How it works ============================================== */}
      <PageChrome pageNo={3}>
        <Eyebrow>How it works</Eyebrow>
        <Text style={s.h2}>Connect → Scan → Score → Roadmap.</Text>
        <Text style={s.body}>
          Most users go from signup to a real readiness report in under 10 minutes.
          Read-only credentials, no agent install, no row-level data access.
        </Text>

        <View style={[s.row, { marginTop: 20, gap: 10 }]}>
          {[
            {
              n: "01",
              t: "Connect a source",
              b: "Add a Databricks workspace, Snowflake account, or use the Mock connector. Credentials encrypted with envelope encryption.",
            },
            {
              n: "02",
              t: "Run a scan",
              b: "We walk Unity Catalog / ACCOUNT_USAGE read-only. 12k tables in ~3 minutes. Live progress.",
            },
            {
              n: "03",
              t: "Read the report",
              b: "0–100 score, 6 pillars, prioritized findings tied to actual tables. Export the roadmap to Jira.",
            },
            {
              n: "04",
              t: "Ship fixes",
              b: "Each recommendation includes effort estimate and owner suggestion. Re-scan to track score over time.",
            },
          ].map((step) => (
            <View key={step.n} style={[s.card, { flex: 1 }]}>
              <Text style={[s.mono, { color: C.blueLight, fontSize: 10 }]}>{step.n}</Text>
              <Text style={[s.h3, { marginTop: 6 }]}>{step.t}</Text>
              <Text style={s.body}>{step.b}</Text>
            </View>
          ))}
        </View>

        <View style={s.divider} />

        <Eyebrow>The pipeline</Eyebrow>
        <View
          style={[
            s.card,
            {
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
              padding: 18,
              marginTop: 6,
            },
          ]}
        >
          {["Connector", "Inventory", "Scoring", "Claude", "Report"].map((step, i) => (
            <View key={step} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 6,
                  padding: 10,
                  alignItems: "center",
                  backgroundColor: C.surfaceAlt,
                }}
              >
                <Text style={{ fontSize: 9, color: C.textFaint }}>STEP {i + 1}</Text>
                <Text style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{step}</Text>
              </View>
              {i < 4 && (
                <Text style={{ color: C.textFaint, marginHorizontal: 4, fontSize: 14 }}>›</Text>
              )}
            </View>
          ))}
        </View>

        <Text style={[s.small, { marginTop: 10 }]}>
          Scores are deterministic and reproducible. Claude only writes the executive
          narrative and re-ranks recommendations — never the underlying numbers.
        </Text>
      </PageChrome>

      {/* === Page 4: 6 pillars ================================================ */}
      <PageChrome pageNo={4}>
        <Eyebrow>What we measure</Eyebrow>
        <Text style={s.h2}>Six pillars, weighted into a single score.</Text>
        <Text style={s.body}>
          Each pillar maps to specific automated checks. Click any pillar in the
          report to drill into the underlying tables and columns.
        </Text>

        <View style={[s.row, { gap: 10, marginTop: 20, flexWrap: "wrap" }]}>
          {[
            {
              n: "Metadata",
              w: 20,
              d: "Coverage of table & column descriptions",
              c: C.blue,
            },
            {
              n: "Schema quality",
              w: 20,
              d: "Primary keys, partitioning, optimized layouts",
              c: C.cyan,
            },
            {
              n: "Governance",
              w: 20,
              d: "PII tagging, masking, access policies",
              c: C.emerald,
            },
            {
              n: "RAG readiness",
              w: 20,
              d: "Vector indices over high-value text columns",
              c: C.fuchsia,
            },
            {
              n: "Semantic layer",
              w: 10,
              d: "Business entities (Customer360, Revenue, Risk)",
              c: C.amber,
            },
            {
              n: "Operational health",
              w: 10,
              d: "Pipeline freshness, lineage explainability",
              c: C.rose,
            },
          ].map((p) => (
            <View
              key={p.n}
              style={[s.card, { width: "31.5%", padding: 14 }]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ width: 22, height: 3, backgroundColor: p.c }} />
                <Text style={{ fontSize: 16, fontWeight: 700 }}>
                  {p.w}
                  <Text style={{ fontSize: 9, color: C.textFaint }}>%</Text>
                </Text>
              </View>
              <Text style={[s.h3, { marginTop: 10 }]}>{p.n}</Text>
              <Text style={s.body}>{p.d}</Text>
              {/* Weight bar */}
              <View
                style={{
                  marginTop: 10,
                  height: 3,
                  backgroundColor: C.border,
                  borderRadius: 3,
                }}
              >
                <View
                  style={{
                    width: `${p.w * 5}%`,
                    height: 3,
                    backgroundColor: p.c,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={s.divider} />

        <View style={[s.card, { backgroundColor: C.surfaceAlt }]}>
          <Eyebrow>The formula</Eyebrow>
          <Text style={[s.mono, { marginTop: 4 }]}>
            readiness_score = sum(pillar.weight × pillar.score for pillar in pillars)
          </Text>
        </View>
      </PageChrome>

      {/* === Page 5: What you offer (features) ================================ */}
      <PageChrome pageNo={5}>
        <Eyebrow>What you get</Eyebrow>
        <Text style={s.h2}>Catalog-aware. Governance-first. Roadmap-ready.</Text>

        <View style={[s.row, { gap: 10, marginTop: 18, flexWrap: "wrap" }]}>
          {[
            {
              t: "Catalog-aware scanning",
              b: "Walks Unity Catalog, ACCOUNT_USAGE, dbt manifest, and Delta storage to understand what you actually have — not what was last documented.",
            },
            {
              t: "Claude-generated narrative",
              b: "Executive-ready summaries written by Claude over your inventory snapshot. No prompt engineering required.",
            },
            {
              t: "Governance, not theatre",
              b: "Detects untagged PII, masking gaps, and lineage holes that block AI features in regulated industries.",
            },
            {
              t: "Prioritized roadmap",
              b: "Ranked recommendations with effort estimates and one-click export to Jira or Linear.",
            },
            {
              t: "RAG readiness score",
              b: "Identifies missing vector indices and chunking gaps that quietly tank retrieval quality.",
            },
            {
              t: "Pluggable connectors",
              b: "Databricks, Snowflake, mock data — same API. New sources monthly. Self-host for regulated workloads.",
            },
          ].map((f) => (
            <View key={f.t} style={[s.card, { width: "48%" }]}>
              <Text style={s.h3}>{f.t}</Text>
              <Text style={s.body}>{f.b}</Text>
            </View>
          ))}
        </View>
      </PageChrome>

      {/* === Page 6: Sample report ============================================ */}
      <PageChrome pageNo={6}>
        <Eyebrow>Sample report</Eyebrow>
        <Text style={s.h2}>What a scan actually looks like.</Text>
        <Text style={s.body}>
          Excerpt from a typical mid-size Snowflake + Databricks deployment.
        </Text>

        <View style={[s.row, { gap: 12, marginTop: 16 }]}>
          {/* Score panel */}
          <View style={[s.card, { width: 180, alignItems: "center" }]}>
            <ScoreRing score={62} />
            <Text style={[s.small, { marginTop: 10 }]}>prod-databricks · scanned today</Text>
          </View>

          {/* KPI grid */}
          <View style={{ flex: 1, gap: 8 }}>
            {[
              { k: "Tables scanned", v: "12,418", s: "78% documented" },
              { k: "Untagged PII", v: "237", s: "of 412 detected", warn: true },
              { k: "RAG readiness", v: "60", s: "vector index missing" },
              { k: "Pipelines", v: "184", s: "3 failed last run" },
            ].map((kpi) => (
              <View
                key={kpi.k}
                style={[s.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12 }]}
              >
                <View>
                  <Text style={s.small}>{kpi.k}</Text>
                  <Text style={{ fontSize: 18, fontWeight: 700, color: kpi.warn ? C.rose : C.text }}>
                    {kpi.v}
                  </Text>
                </View>
                <Text style={s.small}>{kpi.s}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[s.eyebrow, { marginTop: 22 }]}>Top findings</Text>
        {[
          { t: "237 likely-PII columns without governance tags", sev: "high", c: C.rose },
          { t: "No vector index detected — RAG retrieval will scan at query time", sev: "high", c: C.rose },
          { t: "40% of bronze tables lack descriptions", sev: "med", c: C.amber },
          { t: "Lineage edges captured across silver and gold layers", sev: "ok", c: C.emerald },
        ].map((f, i) => (
          <View
            key={i}
            style={[s.card, { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6, padding: 11 }]}
          >
            <Text style={[s.body, { color: C.text }]}>{f.t}</Text>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: f.c }}>
              <Text style={{ fontSize: 8, color: f.c, letterSpacing: 1.2, textTransform: "uppercase" }}>
                {f.sev}
              </Text>
            </View>
          </View>
        ))}
      </PageChrome>

      {/* === Page 7: Security ================================================= */}
      <PageChrome pageNo={7}>
        <Eyebrow>Security</Eyebrow>
        <Text style={s.h2}>Read-only by design.</Text>
        <Text style={s.body}>
          Built for procurement and security review. Self-host available for
          regulated workloads.
        </Text>

        <View style={[s.row, { gap: 12, marginTop: 18 }]}>
          <View
            style={[
              s.card,
              { flex: 1, borderColor: C.emerald, backgroundColor: "rgba(16,185,129,0.06)" },
            ]}
          >
            <Text style={[s.h3, { color: C.emerald }]}>What we do</Text>
            {[
              "Read metadata: table & column names, descriptions, sizes, types",
              "Read pipeline status (success/fail/schedule)",
              "Read lineage edges (upstream → downstream FQNs)",
              "Store inventory snapshots in your tenant database",
              "Encrypt connection credentials with envelope encryption",
            ].map((x) => (
              <Bullet key={x}>{x}</Bullet>
            ))}
          </View>
          <View
            style={[
              s.card,
              { flex: 1, borderColor: C.rose, backgroundColor: "rgba(244,63,94,0.06)" },
            ]}
          >
            <Text style={[s.h3, { color: C.rose }]}>What we never do</Text>
            {[
              "Read row-level data from any table",
              "Copy or replicate your data",
              "Train models on your catalog",
              "Share inventory snapshots across tenants",
              "Require write permissions of any kind",
            ].map((x) => (
              <Bullet key={x}>{x}</Bullet>
            ))}
          </View>
        </View>

        <View style={[s.card, { marginTop: 14 }]}>
          <Text style={s.h3}>Self-hosted available</Text>
          <Text style={s.body}>
            For regulated workloads, deploy the API + worker into your VPC. Data
            never leaves your network — Anthropic API calls are optional and can be
            swapped for an in-VPC LLM endpoint.
          </Text>
        </View>
      </PageChrome>

      {/* === Page 8: Get started CTA ========================================== */}
      <PageChrome pageNo={8}>
        <Eyebrow>Get started</Eyebrow>
        <Text style={s.h2}>Ready to score your platform?</Text>
        <Text style={s.body}>
          Free during private beta. No credit card. Mock data available so you can
          evaluate the full product without exposing credentials.
        </Text>

        <View style={[s.card, { marginTop: 20, padding: 24 }]}>
          <Text style={s.h3}>Three ways to start</Text>
          <View style={{ marginTop: 12, gap: 8 }}>
            <View style={[s.card, { backgroundColor: C.surfaceAlt, padding: 14 }]}>
              <Text style={[s.h3, { color: C.blueLight }]}>1 · Try the mock data</Text>
              <Text style={s.body}>
                Sign up at readiness.ai → add a "Mock" connection → run a scan. Full
                report in under 5 seconds, zero credentials.
              </Text>
            </View>
            <View style={[s.card, { backgroundColor: C.surfaceAlt, padding: 14 }]}>
              <Text style={[s.h3, { color: C.blueLight }]}>2 · Connect your warehouse</Text>
              <Text style={s.body}>
                Add a Databricks PAT or Snowflake service account (read-only). First
                real report in under 10 minutes.
              </Text>
            </View>
            <View style={[s.card, { backgroundColor: C.surfaceAlt, padding: 14 }]}>
              <Text style={[s.h3, { color: C.blueLight }]}>3 · Book a guided session</Text>
              <Text style={s.body}>
                For larger teams: 30-minute scan-and-walkthrough with a solutions
                engineer. Email hello@readiness.ai.
              </Text>
            </View>
          </View>
        </View>

        <View style={[s.divider]} />

        <View style={[s.row, { justifyContent: "space-between", alignItems: "center" }]}>
          <View>
            <Text style={s.h3}>readiness.ai</Text>
            <Text style={s.small}>hello@readiness.ai</Text>
          </View>
          <Text style={[s.small, { textAlign: "right" }]}>
            © {new Date().getFullYear()} Readiness — Enterprise AI Readiness for the modern data stack.
          </Text>
        </View>
      </PageChrome>
    </Document>
  );
}
