"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StaffLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Staff login failed.");
      router.push("/staff");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Staff login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>Staff login</h2>
      <p className="muted">Enter the staff password to open the production queue.</p>
      {error ? <p className="error-state">{error}</p> : null}
      <div className="field">
        <label>Staff Password</label>
        <input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && login()} />
      </div>
      <div className="actions">
        <button className="button" disabled={busy} onClick={login} type="button">{busy ? "Checking..." : "Open Staff Dashboard"}</button>
      </div>
    </section>
  );
}
