import { useEffect, useState } from "react";

export default function Home() {
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4501";
    fetch(`${url}/health`)
      .then((r) => r.json())
      .then((data) => setApiStatus(data))
      .catch(() => setApiStatus({ ok: false }));
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>Recon Web UI</h1>
      <p>Custom ports: Frontend 4500, API 4501, MinIO 4510/4511</p>
      <h2>API Health</h2>
      <pre>{JSON.stringify(apiStatus, null, 2)}</pre>
    </div>
  );
}

