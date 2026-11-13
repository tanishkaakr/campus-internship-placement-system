"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("STUDENT");
  const [email, setEmail] = useState("tanishkaa@pesu.pes.edu");
  const [password, setPassword] = useState("pass123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const selectDemoRole = (role, demoEmail, demoPass) => {
    setActiveTab(role);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid email or password");
        setLoading(false);
        return;
      }
      localStorage.setItem("session", JSON.stringify(data));
      router.push("/dashboard");
    } catch (err) {
      setError("Server connection failed.");
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <span className="brand-pill">PES UNIVERSITY • PLACEMENT CELL</span>
        <h1 className="login-title">HireSync Portal</h1>
        <p className="login-subtitle">
          Role-Based Campus Recruitment with MySQL RBAC &amp; MongoDB Vector Search
        </p>

        <div className="role-switcher">
          <button
            type="button"
            className={`role-tab ${activeTab === "STUDENT" ? "active" : ""}`}
            onClick={() => selectDemoRole("STUDENT", "tanishkaa@pesu.pes.edu", "pass123")}
          >
            Student Demo
          </button>
          <button
            type="button"
            className={`role-tab ${activeTab === "RECRUITER" ? "active" : ""}`}
            onClick={() => selectDemoRole("RECRUITER", "hr@vehere.com", "recruiter123")}
          >
            Recruiter Demo
          </button>
          <button
            type="button"
            className={`role-tab ${activeTab === "ADMIN" ? "active" : ""}`}
            onClick={() => selectDemoRole("ADMIN", "placement.admin@pes.edu", "admin123")}
          >
            Admin Demo
          </button>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Institutional / Corporate Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ color: "#dc2626", fontSize: "13px", marginBottom: "14px", fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button className="btn btn-full" type="submit" disabled={loading}>
            {loading ? "Authenticating..." : `Sign In as ${activeTab}`}
          </button>
        </form>
      </div>
    </div>
  );
}