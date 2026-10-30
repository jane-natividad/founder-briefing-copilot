import { useState } from "react";
import { callLLM, defaultLlmConfig, parseJsonReply, PROVIDERS, switchProvider, endpointHost } from "./lib/llmClient";

// ─── Fallback keyword classification (used while API loads) ───────────────────
const RED_KW = ["urgent", "critical", "failed", "blocked", "overdue", "cancelled", "immediate", "cannot", "unable", "reject"];
const AMBER_KW = ["delay", "delayed", "waiting", "pending", "unclear", "risk", "concern", "slow", "issue", "behind", "not sure", "higher than expected", "need additional"];

function classifyRisk(text) {
  const t = text.toLowerCase();
  if (RED_KW.some(k => t.includes(k))) return "red";
  if (AMBER_KW.some(k => t.includes(k))) return "amber";
  return "green";
}

function parseSection(text, sectionName) {
  if (!text.trim()) return [];
  return text.split("\n").map(l => l.trim()).filter(l => l.length > 0).map(line => ({
    text: line,
    risk: classifyRisk(line),
    nextAction: classifyRisk(line) === "red" ? "Resolve today" : classifyRisk(line) === "amber" ? "Follow up this week" : "Monitor",
    section: sectionName,
  }));
}

// ─── Two-pass LLM call (any OpenAI-compatible or Anthropic-style API) ─────────
async function analyseWithLLM(llm, customers, suppliers, hiring) {
  const prompt = `You are a chief of staff at a biotech startup. Analyse these operational updates in two passes.

CUSTOMER UPDATES:
${customers || "(none)"}

SUPPLIER UPDATES:
${suppliers || "(none)"}

HIRING UPDATES:
${hiring || "(none)"}

PASS 1 — Classify each item independently.
For every line in each section assign:
- risk: "red", "amber", or "green"
- nextAction: one short sentence (max 10 words)

PASS 2 — Company-wide synthesis across all sections.
Generate:
- overallStatus: "Healthy", "Watch closely", or "At risk"
- top3priorities: array of up to 3 objects, each with { text, owner, urgency } where urgency is "Today" or "This week"
- founderItems: array of strings (only truly critical items needing founder involvement)
- briefSummary: 2-3 sentences max, written for a busy founder

Respond ONLY with valid JSON in this exact format, no markdown, no explanation:
{
  "customers": [{ "text": "", "risk": "", "nextAction": "" }],
  "suppliers": [{ "text": "", "risk": "", "nextAction": "" }],
  "hiring": [{ "text": "", "risk": "", "nextAction": "" }],
  "overallStatus": "",
  "top3priorities": [{ "text": "", "owner": "", "urgency": "" }],
  "founderItems": [],
  "briefSummary": ""
}`;

  const text = await callLLM(llm, { prompt, maxTokens: 1500 });
  return parseJsonReply(text);
}

// ─── Health styling ───────────────────────────────────────────────────────────
const HEALTH = {
  "Healthy":      { color: "#166534", bg: "#dcfce7", border: "#86efac" },
  "Watch closely":{ color: "#92400e", bg: "#fef3c7", border: "#fcd34d" },
  "At risk":      { color: "#991b1b", bg: "#fee2e2", border: "#fca5a5" },
};

const RISK = {
  red:   { dot: "#ef4444", bg: "#fee2e2", text: "#991b1b", label: "RED" },
  amber: { dot: "#f59e0b", bg: "#fef3c7", text: "#92400e", label: "AMBER" },
  green: { dot: "#22c55e", bg: "#dcfce7", text: "#166534", label: "GREEN" },
};


// ─── Bring-your-own-LLM settings ──────────────────────────────────────────────
function LlmSettings({ value, onChange }) {
  const [show, setShow] = useState(false);
  const set = patch => onChange({ ...value, ...patch });
  const input = { width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13, color: "#111827", background: "#fff", boxSizing: "border-box", fontFamily: "inherit" };
  return (
    <Card title="Optional · Your LLM API key">
      <select value={value.provider} onChange={e => onChange(switchProvider(value, e.target.value))} style={{ ...input, marginBottom: 8 }} aria-label="API style">
        {Object.entries(PROVIDERS).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}
      </select>
      <div style={{ display: "flex", gap: 8 }}>
        <input type={show ? "text" : "password"} value={value.apiKey} onChange={e => set({ apiKey: e.target.value })} placeholder="Your API key (leave blank for rule-based analysis)" autoComplete="off" spellCheck={false} style={{ ...input, fontFamily: "ui-monospace, monospace" }} aria-label="API key" />
        {value.apiKey && <button type="button" onClick={() => setShow(s => !s)} style={{ border: "none", background: "none", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>{show ? "Hide" : "Show"}</button>}
      </div>
      <details style={{ marginTop: 8 }}>
        <summary style={{ fontSize: 12, color: "#6b7280", cursor: "pointer" }}>Endpoint &amp; model (advanced)</summary>
        <input value={value.baseUrl} onChange={e => set({ baseUrl: e.target.value })} style={{ ...input, marginTop: 6 }} aria-label="Base URL" spellCheck={false} />
        <input value={value.model} onChange={e => set({ model: e.target.value })} style={{ ...input, marginTop: 6 }} aria-label="Model" spellCheck={false} />
      </details>
      <p style={{ fontSize: 11.5, color: "#6b7280", margin: "8px 0 0", lineHeight: 1.5 }}>
        Works with any model behind an OpenAI-compatible or Anthropic-style API — hosted or a local Llama server. Your key stays in this browser tab's memory only and is sent only to <strong>{endpointHost(value)}</strong>. Please use fictional/sample data only.
      </p>
    </Card>
  );
}

// ─── Copyable brief ───────────────────────────────────────────────────────────
function buildBrief(result) {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const fmt = items => items.length > 0 ? items.map(i => `[${i.risk.toUpperCase()}] ${i.text} → ${i.nextAction}`).join("\n") : "No updates";
  return `Founder Daily Brief — ${today}
Status: ${result.overallStatus}

${result.briefSummary}

Top Priorities:
${result.top3priorities.length > 0 ? result.top3priorities.map((p, i) => `${i+1}. ${p.text} | ${p.owner} | ${p.urgency}`).join("\n") : "No critical priorities"}

Founder Attention:
${result.founderItems.length > 0 ? result.founderItems.map(i => `• ${i}`).join("\n") : "No escalation needed"}

Customers:
${fmt(result.customers)}

Suppliers:
${fmt(result.suppliers)}

Hiring:
${fmt(result.hiring)}`;
}

// ─── UI components ────────────────────────────────────────────────────────────
function Card({ title, children, accent }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${accent || "#e5e7eb"}`, borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
      <div style={{ padding: "10px 18px", borderBottom: "1px solid #f3f4f6", background: "#fafafa" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</span>
      </div>
      <div style={{ padding: "14px 18px" }}>{children}</div>
    </div>
  );
}

function TrackerRow({ item, last }) {
  const c = RISK[item.risk] || RISK.green;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: last ? "none" : "1px solid #f9fafb" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot, flexShrink: 0, marginTop: 6 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: "#111827", marginBottom: 3 }}>{item.text}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: c.bg, color: c.text }}>{c.label}</span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>→ {item.nextAction}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [customers, setCustomers] = useState("");
  const [suppliers, setSuppliers] = useState("");
  const [hiring, setHiring] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [llm, setLlm] = useState(defaultLlmConfig());

  async function handleGenerate() {
    if (!customers.trim() && !suppliers.trim() && !hiring.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (!llm.apiKey.trim()) throw new Error("NO_KEY");
      const aiResult = await analyseWithLLM(llm, customers, suppliers, hiring);
      // Count for metric cards
      const all = [...aiResult.customers, ...aiResult.suppliers, ...aiResult.hiring];
      setResult({
        ...aiResult,
        reds:   all.filter(i => i.risk === "red").length,
        ambers: all.filter(i => i.risk === "amber").length,
        greens: all.filter(i => i.risk === "green").length,
        brief:  buildBrief(aiResult),
      });
    } catch (e) {
      // Fallback to keyword analysis if API fails
      const c = parseSection(customers, "Customers");
      const s = parseSection(suppliers, "Suppliers");
      const h = parseSection(hiring, "Hiring");
      const all = [...c, ...s, ...h];
      const reds = all.filter(i => i.risk === "red");
      const ambers = all.filter(i => i.risk === "amber");
      const status = reds.length >= 2 ? "At risk" : reds.length === 1 || ambers.length >= 3 ? "Watch closely" : "Healthy";
      const top3 = [...reds, ...ambers].slice(0, 3).map(i => ({
        text: i.text,
        owner: i.section === "Customers" ? "Customer Success" : i.section === "Suppliers" ? "Operations" : "People",
        urgency: i.risk === "red" ? "Today" : "This week",
      }));
      const fallback = {
        customers: c, suppliers: s, hiring: h,
        overallStatus: status,
        top3priorities: top3,
        founderItems: reds.map(i => i.text),
        briefSummary: `${reds.length} critical and ${ambers.length} amber items detected. Review priorities below.`,
        reds: reds.length, ambers: ambers.length, greens: all.filter(i => i.risk === "green").length,
      };
      setResult({ ...fallback, brief: buildBrief(fallback) });
      setError(e.message === "NO_KEY"
        ? "No API key added — showing the built-in rule-based analysis. Add a key above for the AI-written briefing."
        : `AI call failed (${e.message}) — showing the built-in rule-based analysis instead.`);
    }
    setLoading(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(result.brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const health = result ? (HEALTH[result.overallStatus] || HEALTH["Healthy"]) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #e5e7eb", background: "#fff", padding: "0 24px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Founder Briefing Copilot</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>Founder Daily Briefing</div>
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", padding: "3px 9px", borderRadius: 6 }}>v3.0 · Bring your own LLM</div>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 24px" }}>
        {!result ? (
          // ── Input ────────────────────────────────────────────────────────
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 5px" }}>Founder Daily Briefing</h1>
              <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>One update per line. Works instantly with the built-in rule-based analysis; add your own LLM API key for an AI-written briefing that reads all sections together like a chief of staff.</p>
            </div>
            {[
              { label: "Customer updates", value: customers, set: setCustomers, placeholder: "Customer A screen delayed — waiting on protein sequence\nCustomer B onboarding on track" },
              { label: "Supplier updates", value: suppliers, set: setSuppliers, placeholder: "Reagent shipment blocked at customs\nSupplier C delivery confirmed Thursday" },
              { label: "Hiring updates", value: hiring, set: setHiring, placeholder: "Senior scientist offer accepted\nOps lead final interview pending" },
            ].map(({ label, value, set, placeholder }) => (
              <Card key={label} title={label}>
                <textarea
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  style={{ width: "100%", minHeight: 80, padding: 10, borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13, color: "#111827", background: "#fff", resize: "vertical", boxSizing: "border-box", outline: "none", fontFamily: "inherit", lineHeight: 1.6 }}
                />
              </Card>
            ))}
            <LlmSettings value={llm} onChange={setLlm} />
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{ padding: "9px 24px", background: loading ? "#6b7280" : "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: loading ? "default" : "pointer" }}
            >
              {loading ? "Analysing…" : "Generate briefing →"}
            </button>
          </div>
        ) : (
          // ── Dashboard ────────────────────────────────────────────────────
          <div>
            {error && (
              <div style={{ fontSize: 12, color: "#92400e", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "8px 14px", marginBottom: 14 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Status bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <span style={{ fontSize: 14, fontWeight: 600, padding: "5px 16px", borderRadius: 20, background: health.bg, color: health.color, border: `1px solid ${health.border}` }}>
                {result.overallStatus}
              </span>
              <button onClick={() => setResult(null)} style={{ fontSize: 12, color: "#6b7280", background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>
                ← New briefing
              </button>
            </div>

            {/* Metric cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              {[
                { label: "Critical", count: result.reds,   color: "#991b1b", bg: "#fee2e2", border: "#fca5a5" },
                { label: "At risk",  count: result.ambers, color: "#92400e", bg: "#fef3c7", border: "#fcd34d" },
                { label: "On track", count: result.greens, color: "#166534", bg: "#dcfce7", border: "#86efac" },
              ].map(m => (
                <div key={m.label} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: m.color, lineHeight: 1 }}>{m.count}</div>
                  <div style={{ fontSize: 12, color: m.color, marginTop: 4, fontWeight: 500 }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Brief summary */}
            {result.briefSummary && (
              <div style={{ fontSize: 13, color: "#374151", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 18px", marginBottom: 14, lineHeight: 1.6 }}>
                {result.briefSummary}
              </div>
            )}

            {/* Today's priorities */}
            <Card title="Today's priorities" accent={result.top3priorities.length > 0 ? "#fca5a5" : "#e5e7eb"}>
              {result.top3priorities.length === 0 ? (
                <div style={{ fontSize: 13, color: "#166534" }}>✓ No critical priorities today</div>
              ) : result.top3priorities.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: i < result.top3priorities.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <span style={{ minWidth: 20, height: 20, borderRadius: "50%", background: "#f3f4f6", color: "#374151", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: "#111827", flex: 1 }}>{p.text}</span>
                  <span style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap" }}>{p.owner}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: p.urgency === "Today" ? "#991b1b" : "#92400e", whiteSpace: "nowrap" }}>{p.urgency}</span>
                </div>
              ))}
            </Card>

            {/* Founder attention */}
            <Card title="Founder attention required" accent={result.founderItems.length > 0 ? "#fca5a5" : "#e5e7eb"}>
              {result.founderItems.length === 0 ? (
                <div style={{ fontSize: 13, color: "#166534" }}>✓ No founder escalation needed</div>
              ) : result.founderItems.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: i < result.founderItems.length - 1 ? "1px solid #fef2f2" : "none" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#374151" }}>{item}</span>
                </div>
              ))}
            </Card>

            {/* Trackers */}
            {[
              { title: "Customer tracker", items: result.customers },
              { title: "Supplier tracker", items: result.suppliers },
              { title: "Hiring tracker",   items: result.hiring },
            ].map(({ title, items }) => (
              <Card key={title} title={title}>
                {!items || items.length === 0
                  ? <div style={{ fontSize: 13, color: "#9ca3af" }}>No updates</div>
                  : items.map((item, i) => <TrackerRow key={i} item={item} last={i === items.length - 1} />)
                }
              </Card>
            ))}

            {/* Copyable brief */}
            <Card title="Copyable founder brief">
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                <button onClick={handleCopy} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: copied ? "#dcfce7" : "#fff", color: copied ? "#166534" : "#374151", cursor: "pointer" }}>
                  {copied ? "✓ Copied" : "Copy brief"}
                </button>
              </div>
              <pre style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit", background: "#f9fafb", padding: 14, borderRadius: 8, border: "1px solid #f3f4f6" }}>
                {result.brief}
              </pre>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
