"use client";
import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

const API = "https://oracle-ai-hmxz.onrender.com";

const MODEL_COLORS: Record<string, string> = {
  gpt4: "#a78bfa",
  claude: "#f59e0b",
  gemini: "#60a5fa",
};

const MODEL_LABELS: Record<string, string> = {
  gpt4: "GPT-4o",
  claude: "Claude Sonnet",
  gemini: "Gemini 1.5 Pro",
};

function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0px)" : "translateY(28px)",
      transition: `opacity 0.75s cubic-bezier(0.4,0,0.2,1) ${delay}ms, transform 0.75s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

function AnimatedNumber({ target, decimals = 1 }: { target: number; decimals?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const dur = 1400;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      setVal(target * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return <>{val.toFixed(decimals)}</>;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value * 100), 400);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1 }}>
        <div style={{
          width: `${w}%`, height: "100%", background: color, borderRadius: 1,
          transition: "width 1.3s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
      <span style={{
        fontSize: 11, color: "rgba(255,255,255,0.3)", minWidth: 32,
        fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em",
        fontFamily: "'DM Mono', monospace",
      }}>
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function ModelPill({ model }: { model: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: "4px 12px", borderRadius: 6,
      background: `${MODEL_COLORS[model]}12`,
      border: `1px solid ${MODEL_COLORS[model]}25`,
      color: MODEL_COLORS[model], fontSize: 12, fontWeight: 500,
      letterSpacing: "0.01em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: MODEL_COLORS[model] }} />
      {MODEL_LABELS[model] || model}
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0f1117", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10, padding: "12px 16px", fontSize: 12,
    }}>
      <div style={{ color: "rgba(255,255,255,0.4)", marginBottom: 8, letterSpacing: "0.04em" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
          <span style={{ width: 8, height: 2, background: p.color, display: "inline-block" }} />
          <span style={{ color: "rgba(255,255,255,0.5)" }}>{p.name}</span>
          <span style={{ color: "#fff", fontVariantNumeric: "tabular-nums" }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

const OracleLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <circle cx="14" cy="14" r="13" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
    <circle cx="14" cy="14" r="8" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    <circle cx="14" cy="14" r="3" fill="white" opacity="0.9" />
    <line x1="14" y1="1" x2="14" y2="7" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    <line x1="14" y1="21" x2="14" y2="27" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    <line x1="1" y1="14" x2="7" y2="14" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    <line x1="21" y1="14" x2="27" y2="14" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
  </svg>
);

const EmptyState = ({ message }: { message: string }) => (
  <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.18)" }}>
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: "0 auto 16px", display: "block" }}>
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1" />
      <circle cx="20" cy="20" r="11" stroke="currentColor" strokeWidth="1" />
      <circle cx="20" cy="20" r="3" fill="currentColor" />
    </svg>
    <div style={{ fontSize: 14, marginBottom: 6 }}>{message}</div>
    <div style={{ fontSize: 12, opacity: 0.7 }}>Click "Run Probe" to begin</div>
  </div>
);

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [drift, setDrift] = useState<any>({});
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [probeLoading, setProbeLoading] = useState(false);
  const [probeResult, setProbeResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "drift" | "query">("leaderboard");
  const [selectedModel, setSelectedModel] = useState("gpt4");
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    fetchData();
    const interval = setInterval(fetchData, 30000);
    const timeInterval = setInterval(() => setTime(new Date()), 1000);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  async function fetchData() {
    try {
      const [lb, dr] = await Promise.all([
        fetch(`${API}/leaderboard`).then(r => r.json()),
        fetch(`${API}/drift?days=30`).then(r => r.json()),
      ]);
      setLeaderboard(Array.isArray(lb) ? lb : []);
      setDrift(dr && typeof dr === "object" ? dr : {});
    } catch (e) { console.error(e); }
  }

  async function runQuery() {
    if (!query.trim()) return;
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const res = await fetch(`${API}/probe/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query }),
      });
      setQueryResult(await res.json());
    } catch (e) { console.error(e); }
    finally { setQueryLoading(false); }
  }

  async function triggerProbe() {
    setProbeLoading(true);
    try {
      const res = await fetch(`${API}/probe/run`, { method: "POST" });
      const data = await res.json();
      setProbeResult(data.run_id);
      await fetchData();
    } catch (e) { console.error(e); }
    finally { setProbeLoading(false); }
  }

  const driftHistory = drift[selectedModel]?.history || [];
  const chartData = driftHistory.map((h: any) => ({
    date: new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    confidence: parseFloat((h.avg_confidence * 100).toFixed(1)),
    accuracy: parseFloat((h.avg_accuracy * 100).toFixed(1)),
  }));

  const headerOpacity = mounted ? Math.min(scrollY / 60, 0.97) : 0;
  const headerBorderOpacity = mounted ? Math.min(scrollY / 200, 0.07) : 0;

  const tabs = [
    { id: "leaderboard" as const, label: "Leaderboard" },
    { id: "drift" as const, label: "Drift Tracker" },
    { id: "query" as const, label: "Live Query" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&family=DM+Mono:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #07080c; color: #e8eaf0; font-family: 'DM Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
        input, button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        ::placeholder { color: rgba(255,255,255,0.18) !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: `rgba(7,8,12,${headerOpacity})`,
        borderBottom: `1px solid rgba(255,255,255,${headerBorderOpacity})`,
        backdropFilter: mounted && scrollY > 20 ? "blur(24px) saturate(180%)" : "none",
        transition: "background 0.4s ease, border-color 0.4s ease",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 32px",
          height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <OracleLogo />
            <div>
              <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em", color: "#fff" }}>
                ORACLE
              </span>
              <span style={{
                fontSize: 10, color: "rgba(255,255,255,0.2)", marginLeft: 10,
                letterSpacing: "0.06em", fontFamily: "'DM Mono', monospace",
              }}>
                AI OBSERVATORY
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", background: "#34d399",
                display: "inline-block", animation: "pulse 2.5s infinite",
              }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>
                {mounted && time ? time.toLocaleTimeString("en-US", { hour12: false }) : "--:--:--"}
              </span>
            </div>

            <button
              onClick={triggerProbe}
              disabled={probeLoading}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 18px", borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                color: probeLoading ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.09)",
                fontSize: 13, fontWeight: 500,
                cursor: probeLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s", letterSpacing: "-0.01em",
              }}
              onMouseEnter={e => { if (!probeLoading) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={e => { if (!probeLoading) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
            >
              {probeLoading ? (
                <>
                  <span style={{
                    width: 12, height: 12,
                    border: "1.5px solid rgba(255,255,255,0.2)",
                    borderTopColor: "rgba(255,255,255,0.5)",
                    borderRadius: "50%", animation: "spin 0.8s linear infinite",
                  }} />
                  Running…
                </>
              ) : "Run Probe"}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px 32px 80px", position: "relative",
      }}>
        {/* Grid background */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }} />

        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 700, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 820, textAlign: "center" }}>

          {/* Full form badge */}
          <div style={{
            display: "inline-block", marginBottom: 20,
            padding: "5px 14px", borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            fontSize: 11, color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.06em", fontFamily: "'DM Mono', monospace",
          }}>
            Observatory for Real-time AI Confidence and Longitudinal Error tracking
          </div>

          {/* Live indicator */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            marginBottom: 44, marginLeft: 8,
            padding: "5px 14px", borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.02)",
            fontSize: 12, color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.02em",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", animation: "pulse 2.5s infinite" }} />
            Live · 3 models tracked
          </div>

          <h1 style={{
            fontSize: "clamp(42px, 7vw, 78px)", fontWeight: 700,
            lineHeight: 1.04, letterSpacing: "-0.04em", marginBottom: 28,
            color: "#fff", display: "block",
          }}>
            Do AI models know
            <br />
            <span style={{ color: "rgba(255,255,255,0.25)" }}>what they don&apos;t know?</span>
          </h1>

          <p style={{
            fontSize: 17, color: "rgba(255,255,255,0.38)", lineHeight: 1.78,
            maxWidth: 580, margin: "0 auto 16px", fontWeight: 400,
          }}>
            ORACLE probes GPT-4o, Claude, and Gemini with the same question rephrased 5 different ways —
            catching inconsistency <em>before</em> the model commits to an answer.
          </p>

          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.22)", lineHeight: 1.7,
            maxWidth: 480, margin: "0 auto 48px", fontStyle: "italic",
          }}>
            We don&apos;t ask if they got it right. We ask if they even knew before they answered.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                padding: "12px 28px", borderRadius: 9,
                background: "#fff", color: "#07080c",
                border: "none", fontSize: 14, fontWeight: 600,
                cursor: "pointer", letterSpacing: "-0.02em",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "0.88")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
            >Open Observatory</button>

            <button
              onClick={() => {
                setActiveTab("query");
                document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                padding: "12px 28px", borderRadius: 9,
                background: "transparent", color: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.1)", fontSize: 14, fontWeight: 500,
                cursor: "pointer", letterSpacing: "-0.02em", transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.72)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
              }}
            >Try Live Query</button>
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{
          position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
          opacity: mounted && scrollY > 60 ? 0 : 0.3, transition: "opacity 0.4s",
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10l6 6 6-6" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* Stats strip */}
      <Reveal>
        <div style={{ padding: "0 32px 80px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
              border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden",
            }}>
              {[
                { n: "3", label: "Models Tracked", sub: "GPT-4o · Claude · Gemini" },
                { n: "5×", label: "Rephrasing Probes", sub: "Per question per model" },
                { n: "10", label: "Financial Questions", sub: "Verified against ground truth" },
                { n: "24h", label: "Probe Cadence", sub: "Z-score drift detection" },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: "32px 28px",
                  borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: "#fff", letterSpacing: "-0.04em", marginBottom: 6 }}>
                    {s.n}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace" }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* Dashboard */}
      <section id="dashboard" style={{ padding: "0 32px 120px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>

          <Reveal>
            <div style={{ marginBottom: 40 }}>
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.22)", letterSpacing: "0.1em",
                fontFamily: "'DM Mono', monospace", marginBottom: 10,
              }}>OBSERVATORY</div>
              <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "#fff" }}>
                Real-time Intelligence
              </h2>
              {probeResult && (
                <div style={{
                  display: "inline-block", marginTop: 12,
                  padding: "5px 12px", borderRadius: 6,
                  background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.18)",
                  fontSize: 11, color: "#34d399", fontFamily: "'DM Mono', monospace",
                }}>
                  ✓ Probe complete · {probeResult.slice(0, 8)}…
                </div>
              )}
            </div>
          </Reveal>

          {/* Tabs */}
          <Reveal delay={80}>
            <div style={{
              display: "flex", gap: 0, marginBottom: 36,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              {tabs.map(({ id, label }) => {
                const active = activeTab === id;
                return (
                  <button key={id} onClick={() => setActiveTab(id)} style={{
                    padding: "10px 22px", background: "transparent",
                    color: active ? "#fff" : "rgba(255,255,255,0.3)",
                    border: "none",
                    borderBottom: active ? "1.5px solid #fff" : "1.5px solid transparent",
                    marginBottom: -1, fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    cursor: "pointer", transition: "all 0.2s",
                    letterSpacing: "-0.01em",
                  }}>{label}</button>
                );
              })}
            </div>
          </Reveal>

          {/* Leaderboard Tab */}
          {activeTab === "leaderboard" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Reveal delay={0}>
                <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{
                    padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>
                      Epistemic Leaderboard
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace" }}>
                      7-day average
                    </div>
                  </div>
                  <div style={{ padding: 28 }}>
                    {leaderboard.length === 0 ? (
                      <EmptyState message="No probe data yet" />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                        {leaderboard.map((m: any, i: number) => (
                          <div key={m.model}>
                            <div style={{
                              display: "flex", alignItems: "center",
                              justifyContent: "space-between", marginBottom: 16,
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{
                                  width: 26, height: 26, borderRadius: 6,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  background: i === 0 ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
                                  fontSize: 11, fontFamily: "'DM Mono', monospace",
                                  color: i === 0 ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.2)",
                                }}>0{i + 1}</span>
                                <ModelPill model={m.model} />
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{
                                  fontSize: 26, fontWeight: 700, color: MODEL_COLORS[m.model],
                                  letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums",
                                }}>
                                  <AnimatedNumber target={m.epistemic_score * 100} />
                                </div>
                                <div style={{
                                  fontSize: 10, color: "rgba(255,255,255,0.18)",
                                  fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em",
                                }}>EPISTEMIC SCORE</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              {[
                                { label: "Confidence", val: m.avg_confidence },
                                { label: "Accuracy", val: m.avg_accuracy },
                                { label: "Consistency", val: m.avg_consistency },
                              ].map(({ label, val }) => (
                                <div key={label}>
                                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", marginBottom: 6 }}>{label}</div>
                                  <ScoreBar value={val} color={MODEL_COLORS[m.model]} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>
                      How ORACLE Works
                    </div>
                  </div>
                  <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      {
                        n: "01", color: "#a78bfa", title: "Self-Consistency Probing",
                        desc: "Each question is rephrased 5 ways. Inconsistent answers reveal low internal certainty — even when every individual answer sounds confident.",
                      },
                      {
                        n: "02", color: "#60a5fa", title: "Pre-Answer Uncertainty Detection",
                        desc: "We detect hedging and vagueness in responses before scoring. A model that qualifies its answers appropriately is more epistemically honest.",
                      },
                      {
                        n: "03", color: "#f59e0b", title: "Cross-Model Agreement",
                        desc: "When GPT-4o, Claude, and Gemini significantly disagree, at least one is wrong. High agreement signals reliability; divergence signals doubt.",
                      },
                      {
                        n: "04", color: "#34d399", title: "Longitudinal Drift Detection",
                        desc: "Z-score anomaly detection tracks behavioral shifts over time. A sudden calibration drop often indicates a silent model update.",
                      },
                    ].map((item) => (
                      <div
                        key={item.n}
                        style={{
                          padding: "18px", borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.04)",
                          transition: "border-color 0.2s, background 0.2s",
                          cursor: "default",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)";
                          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.04)";
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                      >
                        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                          <span style={{
                            fontSize: 10, color: item.color, fontFamily: "'DM Mono', monospace",
                            opacity: 0.8, marginTop: 2, minWidth: 20,
                          }}>{item.n}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.78)", marginBottom: 5, letterSpacing: "-0.01em" }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", lineHeight: 1.65 }}>
                              {item.desc}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          )}

          {/* Drift Tracker Tab */}
          {activeTab === "drift" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Reveal>
                <div style={{ display: "flex", gap: 8 }}>
                  {["gpt4", "claude", "gemini"].map((m) => (
                    <button key={m} onClick={() => setSelectedModel(m)} style={{
                      padding: "8px 18px", borderRadius: 8,
                      border: `1px solid ${selectedModel === m ? `${MODEL_COLORS[m]}45` : "rgba(255,255,255,0.07)"}`,
                      background: selectedModel === m ? `${MODEL_COLORS[m]}0e` : "transparent",
                      color: selectedModel === m ? MODEL_COLORS[m] : "rgba(255,255,255,0.3)",
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                      transition: "all 0.2s", letterSpacing: "-0.01em",
                    }}>{MODEL_LABELS[m]}</button>
                  ))}
                </div>
              </Reveal>

              {drift[selectedModel] && drift[selectedModel].status !== "no_data" && (
                <Reveal delay={80}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {[
                      { label: "Avg Confidence", value: `${(drift[selectedModel].avg_confidence_30d * 100).toFixed(1)}%`, color: MODEL_COLORS[selectedModel] },
                      { label: "Avg Accuracy", value: `${(drift[selectedModel].avg_accuracy_30d * 100).toFixed(1)}%`, color: MODEL_COLORS[selectedModel] },
                      {
                        label: "30-Day Trend",
                        value: `${drift[selectedModel].confidence_trend >= 0 ? "+" : ""}${(drift[selectedModel].confidence_trend * 100).toFixed(1)}%`,
                        color: drift[selectedModel].confidence_trend >= 0 ? "#34d399" : "#f87171",
                      },
                      {
                        label: "Anomalies",
                        value: String(drift[selectedModel].anomaly_count),
                        color: drift[selectedModel].anomaly_count > 0 ? "#fbbf24" : "#34d399",
                      },
                    ].map((s, i) => (
                      <div key={i} style={{ padding: "24px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", letterSpacing: "0.04em", marginBottom: 10 }}>
                          {s.label.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: s.color, letterSpacing: "-0.04em" }}>
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </Reveal>
              )}

              <Reveal delay={160}>
                <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{
                    padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>
                      {MODEL_LABELS[selectedModel]} · Epistemic Drift (30 days)
                    </div>
                    <div style={{ display: "flex", gap: 20 }}>
                      {[
                        { color: MODEL_COLORS[selectedModel], label: "Confidence" },
                        { color: "#60a5fa", label: "Accuracy" },
                      ].map(l => (
                        <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ width: 14, height: 1.5, background: l.color, display: "inline-block" }} />
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono', monospace" }}>
                            {l.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: "28px", height: 340 }}>
                    {chartData.length === 0 ? (
                      <div style={{
                        height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                        flexDirection: "column", gap: 12, color: "rgba(255,255,255,0.18)",
                      }}>
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ display: "block" }}>
                          <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="1" />
                          <circle cx="18" cy="18" r="9" stroke="currentColor" strokeWidth="1" />
                          <circle cx="18" cy="18" r="2.5" fill="currentColor" />
                        </svg>
                        <div style={{ fontSize: 13 }}>Run probes over multiple days to see drift</div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={MODEL_COLORS[selectedModel]} stopOpacity={0.12} />
                              <stop offset="95%" stopColor={MODEL_COLORS[selectedModel]} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.1} />
                              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11, fontFamily: "DM Mono, monospace" }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="confidence" name="Confidence" stroke={MODEL_COLORS[selectedModel]} strokeWidth={1.75} fill="url(#g1)" dot={false} />
                          <Area type="monotone" dataKey="accuracy" name="Accuracy" stroke="#60a5fa" strokeWidth={1.75} fill="url(#g2)" dot={false} strokeDasharray="5 5" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </Reveal>

              {drift[selectedModel]?.anomaly_count > 0 && (
                <Reveal delay={200}>
                  <div style={{
                    padding: "20px 24px", borderRadius: 12,
                    background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.14)",
                    display: "flex", alignItems: "flex-start", gap: 14,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
                      <path d="M9 2L16.5 15H1.5L9 2z" stroke="#fbbf24" strokeWidth="1.25" strokeLinejoin="round" />
                      <path d="M9 7v4" stroke="#fbbf24" strokeWidth="1.25" strokeLinecap="round" />
                      <circle cx="9" cy="12.5" r="0.75" fill="#fbbf24" />
                    </svg>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24", marginBottom: 5 }}>
                        Behavioral Anomaly Detected
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.32)", lineHeight: 1.65 }}>
                        {MODEL_LABELS[selectedModel]} exhibited {drift[selectedModel].anomaly_count} statistically significant deviation{drift[selectedModel].anomaly_count > 1 ? "s" : ""} in the past 30 days (|z| &gt; 2.0).
                        This may indicate a silent model update or a policy shift in training.
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          )}

          {/* Live Query Tab */}
          {activeTab === "query" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Reveal>
                <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 28 }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: "-0.02em", marginBottom: 6 }}>
                      Live Confidence Autopsy
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.65 }}>
                      Enter a factual question. ORACLE asks it 5 different ways to each model,
                      measures self-consistency, and predicts reliability before you read the answer.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <input
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && runQuery()}
                      placeholder="e.g. What was Apple's total revenue in fiscal year 2023?"
                      style={{
                        flex: 1, padding: "12px 16px", borderRadius: 9,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)", color: "#fff",
                        fontSize: 13, outline: "none", transition: "border-color 0.2s",
                        fontFamily: "'DM Mono', monospace",
                      }}
                      onFocus={e => ((e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.18)")}
                      onBlur={e => ((e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)")}
                    />
                    <button
                      onClick={runQuery}
                      disabled={queryLoading || !query.trim()}
                      style={{
                        padding: "12px 24px", borderRadius: 9,
                        background: queryLoading || !query.trim() ? "rgba(255,255,255,0.04)" : "#fff",
                        color: queryLoading || !query.trim() ? "rgba(255,255,255,0.2)" : "#07080c",
                        border: "none", fontSize: 13, fontWeight: 600,
                        cursor: queryLoading || !query.trim() ? "not-allowed" : "pointer",
                        transition: "all 0.2s", whiteSpace: "nowrap", letterSpacing: "-0.01em",
                      }}
                    >{queryLoading ? "Analyzing…" : "Analyze →"}</button>
                  </div>
                </div>
              </Reveal>

              {queryResult && (
                <>
                  <Reveal delay={60}>
                    <div style={{
                      padding: "22px 28px", borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div>
                        <div style={{
                          fontSize: 11, color: "rgba(255,255,255,0.22)", letterSpacing: "0.06em",
                          fontFamily: "'DM Mono', monospace", marginBottom: 8,
                        }}>CROSS-MODEL AGREEMENT</div>
                        <div style={{
                          fontSize: 36, fontWeight: 700, letterSpacing: "-0.04em",
                          fontVariantNumeric: "tabular-nums",
                          color: queryResult.cross_model_agreement > 0.8 ? "#34d399"
                            : queryResult.cross_model_agreement > 0.5 ? "#fbbf24" : "#f87171",
                        }}>
                          <AnimatedNumber target={queryResult.cross_model_agreement * 100} />%
                        </div>
                      </div>
                      <div style={{
                        padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, letterSpacing: "-0.01em",
                        background: queryResult.cross_model_agreement > 0.8 ? "rgba(52,211,153,0.07)"
                          : queryResult.cross_model_agreement > 0.5 ? "rgba(251,191,36,0.07)" : "rgba(248,113,113,0.07)",
                        border: `1px solid ${queryResult.cross_model_agreement > 0.8 ? "rgba(52,211,153,0.2)"
                          : queryResult.cross_model_agreement > 0.5 ? "rgba(251,191,36,0.2)" : "rgba(248,113,113,0.2)"}`,
                        color: queryResult.cross_model_agreement > 0.8 ? "#34d399"
                          : queryResult.cross_model_agreement > 0.5 ? "#fbbf24" : "#f87171",
                      }}>
                        {queryResult.cross_model_agreement > 0.8 ? "High Reliability"
                          : queryResult.cross_model_agreement > 0.5 ? "Moderate — Verify" : "Low — Verify Manually"}
                      </div>
                    </div>
                  </Reveal>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                    {Object.entries(queryResult.model_results).map(([model, result]: any, i) => (
                      <Reveal key={model} delay={i * 80}>
                        <div
                          style={{
                            border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14,
                            overflow: "hidden", transition: "border-color 0.25s",
                          }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = `${MODEL_COLORS[model]}38`)}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)")}
                        >
                          <div style={{
                            padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                          }}>
                            <ModelPill model={model} />
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                              {(result.confidence_score * 100).toFixed(0)}% conf
                            </span>
                          </div>
                          <div style={{ padding: 20 }}>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em", marginBottom: 8 }}>
                              PRIMARY ANSWER
                            </div>
                            <div style={{
                              fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.7,
                              marginBottom: 20, fontFamily: "'DM Mono', monospace",
                              maxHeight: 72, overflow: "hidden",
                            }}>
                              {result.primary_answer?.slice(0, 160)}{result.primary_answer?.length > 160 ? "…" : ""}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              {[
                                { label: "Self-Consistency", val: result.consistency_score },
                                { label: "Confidence", val: result.confidence_score },
                              ].map(({ label, val }) => (
                                <div key={label}>
                                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginBottom: 6 }}>{label}</div>
                                  <ScoreBar value={val} color={MODEL_COLORS[model]} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Mission */}
      <Reveal>
        <section style={{ padding: "0 32px 120px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{
              border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20,
              padding: "72px 80px", textAlign: "center",
              background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.04) 0%, transparent 65%)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em",
                fontFamily: "'DM Mono', monospace", marginBottom: 24,
              }}>
                THE QUESTION THAT DRIVES US
              </div>
              <h2 style={{
                fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 700,
                letterSpacing: "-0.04em", color: "#fff",
                maxWidth: 680, margin: "0 auto 20px", lineHeight: 1.1,
              }}>
                Are AI models getting smarter about their own ignorance?
              </h2>
              <p style={{
                fontSize: 15, color: "rgba(255,255,255,0.28)",
                maxWidth: 540, margin: "0 auto 12px", lineHeight: 1.78,
              }}>
                Benchmarks test what AI knows. ORACLE tests whether AI knew before it answered.
              </p>
              <p style={{
                fontSize: 14, color: "rgba(255,255,255,0.18)",
                maxWidth: 520, margin: "0 auto", lineHeight: 1.75, fontStyle: "italic",
              }}>
                By the time a model gives you a confident response, we&apos;ve already measured whether
                that confidence was warranted — or performed.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "28px 32px" }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="8" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
              <circle cx="9" cy="9" r="4.5" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <circle cx="9" cy="9" r="1.5" fill="rgba(255,255,255,0.35)" />
            </svg>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace" }}>
            ORACLE · Built with curiosity · Siddhi & Aksh · {new Date().getFullYear()}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.1)", fontFamily: "'DM Mono', monospace" }}>
            GPT-4o · Claude Sonnet · Gemini 1.5 Pro
          </div>
        </div>
      </footer>
    </>
  );
}
