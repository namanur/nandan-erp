// pages/admin/index.js
import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function login(e) {
    e.preventDefault();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (res.ok) {
      window.location.href = "/admin/dashboard";
    } else {
      const data = await res.json();
      setMsg(data.error || "Failed");
    }
  }

  return (
    <div style={{
      maxWidth: "360px",
      margin: "100px auto",
      fontFamily: "sans-serif"
    }}>
      <h1>Admin Login</h1>
      <form onSubmit={login}>
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "10px", width: "100%" }}
        /><br /><br />
        <button style={{
          padding: "10px",
          width: "100%",
          background: "black",
          color: "white",
          border: "none"
        }}>
          Login
        </button>
      </form>
      <p style={{ color: "red" }}>{msg}</p>
    </div>
  );
}
