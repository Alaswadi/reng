import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [apiStatus, setApiStatus] = useState(null);
  const [healthInfo, setHealthInfo] = useState({ status: "unknown", error: null, latencyMs: null, endpoint: "/api/health", checkedAt: null, open: false });
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [onlyAlive, setOnlyAlive] = useState(false);

  const apiPath = "/api"; // proxied via Next.js rewrites to the API service

  useEffect(() => {
    const checkHealth = async () => {
      const endpoint = `${apiPath}/health`;
      const started = Date.now();
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 7000);
        const res = await fetch(endpoint, { signal: ctrl.signal });
        clearTimeout(t);
        const latencyMs = Date.now() - started;
        let body = null;
        try { body = await res.json(); } catch {}
        const ok = res.ok && body && body.ok === true;
        setApiStatus(body || { ok: false });
        setHealthInfo({ status: ok ? "online" : "offline", error: ok ? null : `HTTP ${res.status}`, latencyMs, endpoint, checkedAt: new Date().toISOString(), open: false });
      } catch (err) {
        const latencyMs = Date.now() - started;
        setApiStatus({ ok: false });
        setHealthInfo({ status: "offline", error: err.name === "AbortError" ? "Timeout" : (err.message || "Network error"), latencyMs, endpoint, checkedAt: new Date().toISOString(), open: false });
      }
    };
    checkHealth();
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    setError("");
    const d = domain.trim().toLowerCase();
    if (!d) {
      setError("Please enter a domain, e.g. example.com");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiPath}/scan?domain=${encodeURIComponent(d)}`);
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.detail || `Scan failed (${res.status})`);
      }
      const body = await res.json();
      setData(body);
    } catch (err) {
      setError(err.message || "Scan failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const results = useMemo(() => {
    const r = data?.results || [];
    return onlyAlive ? r.filter((x) => x.reachable) : r;
  }, [data, onlyAlive]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>reNgine Recon</div>
        <div style={styles.health}>
          <button
            onClick={() => setHealthInfo((h) => ({ ...h, open: !h.open }))}
            title={healthInfo.status === "online" ? "API reachable" : "API unreachable"}
            style={{ ...styles.badgeButton, background: apiStatus?.ok ? "#16a34a" : "#dc2626" }}
          >
            API {apiStatus?.ok ? "Online" : "Offline"}
          </button>
          {healthInfo.open && (
            <div style={styles.healthPanel}>
              <div><strong>Endpoint:</strong> {healthInfo.endpoint}</div>
              <div><strong>Checked:</strong> {healthInfo.checkedAt || "—"}</div>
              <div><strong>Latency:</strong> {healthInfo.latencyMs != null ? `${healthInfo.latencyMs} ms` : "—"}</div>
              <div><strong>Error:</strong> {healthInfo.error || "none"}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button style={styles.smallButton} onClick={() => {
                  // re-run health check
                  (async () => {
                    const endpoint = `${apiPath}/health`;
                    const started = Date.now();
                    try {
                      const ctrl = new AbortController();
                      const t = setTimeout(() => ctrl.abort(), 7000);
                      const res = await fetch(endpoint, { signal: ctrl.signal });
                      clearTimeout(t);
                      const latencyMs = Date.now() - started;
                      let body = null;
                      try { body = await res.json(); } catch {}
                      const ok = res.ok && body && body.ok === true;
                      setApiStatus(body || { ok: false });
                      setHealthInfo((h) => ({ ...h, status: ok ? "online" : "offline", error: ok ? null : `HTTP ${res.status}`, latencyMs, checkedAt: new Date().toISOString() }));
                    } catch (err) {
                      const latencyMs = Date.now() - started;
                      setApiStatus({ ok: false });
                      setHealthInfo((h) => ({ ...h, status: "offline", error: err.name === "AbortError" ? "Timeout" : (err.message || "Network error"), latencyMs, checkedAt: new Date().toISOString() }));
                    }
                  })();
                }}>Recheck</button>
                <a href={healthInfo.endpoint} target="_blank" rel="noreferrer" style={styles.smallLink}>Open health</a>
              </div>
            </div>
          )}
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.card}>
          <h2 style={styles.h2}>Subdomains + Probing</h2>
          <form onSubmit={handleScan} style={styles.form}>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              style={styles.input}
              aria-label="Domain"
            />
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Scanning…" : "Enumerate & Probe"}
            </button>
          </form>
          {error && <div style={styles.error}>{error}</div>}

          {data && (
            <div style={styles.summaryRow}>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Domain</div>
                <div style={styles.statValue}>{data.domain}</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Total</div>
                <div style={styles.statValue}>{data.total}</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Alive</div>
                <div style={styles.statValue}>{data.alive}</div>
              </div>
              <label style={styles.toggle}>
                <input type="checkbox" checked={onlyAlive} onChange={(e) => setOnlyAlive(e.target.checked)} />
                Show only alive
              </label>
            </div>
          )}
        </section>

        {data && (
          <section style={styles.card}>
            <h3 style={styles.h3}>Results</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Subdomain</th>
                    <th style={styles.th}>Reachable</th>
                    <th style={styles.th}>Protocol</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>URL</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={`${row.host}-${i}`} style={styles.tr}>
                      <td style={styles.td}>{row.host}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: row.reachable ? "#16a34a" : "#9ca3af" }}>
                          {row.reachable ? "Alive" : "Down"}
                        </span>
                      </td>
                      <td style={styles.td}>{row.protocol || "—"}</td>
                      <td style={styles.td}>{row.status_code ?? "—"}</td>
                      <td style={styles.td}>{row.elapsed_ms ? `${row.elapsed_ms} ms` : "—"}</td>
                      <td style={styles.td}>
                        {row.final_url ? (
                          <a href={row.final_url} target="_blank" rel="noreferrer" style={styles.link}>
                            {row.final_url}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: { fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", background: "#0b1220", color: "#e5e7eb", minHeight: "100vh" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #1f2937" },
  brand: { fontWeight: 600, letterSpacing: 0.5 },
  health: {},
  badge: { display: "inline-block", padding: "4px 8px", borderRadius: 6, fontSize: 12, color: "#fff" },
  badgeButton: { padding: "4px 8px", borderRadius: 6, fontSize: 12, color: "#fff", border: "none", cursor: "pointer" },
  main: { maxWidth: 1000, margin: "0 auto", padding: 24 },
  card: { background: "#0f172a", border: "1px solid #1f2937", borderRadius: 12, padding: 20, marginBottom: 16 },
  h2: { margin: 0, marginBottom: 12, fontSize: 18 },
  h3: { margin: 0, marginBottom: 12, fontSize: 16 },
  form: { display: "flex", gap: 8 },
  input: { flex: 1, background: "#0b1220", border: "1px solid #374151", color: "#e5e7eb", borderRadius: 8, padding: "10px 12px" },
  button: { background: "#2563eb", color: "white", border: "none", borderRadius: 8, padding: "10px 14px", cursor: "pointer" },
  error: { background: "#1f2937", color: "#fca5a5", border: "1px solid #dc2626", borderRadius: 8, padding: 12, marginTop: 12 },
  summaryRow: { display: "flex", alignItems: "center", gap: 16, marginTop: 16, flexWrap: "wrap" },
  stat: { background: "#0b1220", border: "1px solid #1f2937", borderRadius: 8, padding: 12, minWidth: 120 },
  statLabel: { fontSize: 12, color: "#9ca3af" },
  statValue: { fontSize: 16, fontWeight: 600 },
  toggle: { display: "flex", alignItems: "center", gap: 8, fontSize: 14 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #1f2937", fontWeight: 500, color: "#9ca3af" },
  tr: {},
  td: { padding: "10px 12px", borderBottom: "1px solid #1f2937" },
  link: { color: "#93c5fd", textDecoration: "none" },
  smallButton: { background: "#374151", color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 12 },
  smallLink: { color: "#93c5fd", textDecoration: "none", fontSize: 12 },
  healthPanel: { position: "absolute", right: 24, top: 48, background: "#0f172a", border: "1px solid #1f2937", borderRadius: 8, padding: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" },
};
