"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [analytics, setAnalytics] = useState({ deptStats: [], auditLogs: [] });
  const [mongoResumes, setMongoResumes] = useState([]);
  const [skillFilter, setSkillFilter] = useState("");
  const [msg, setMsg] = useState("");

  // Student MongoDB NoSQL Profile State
  const [nosqlForm, setNosqlForm] = useState({
    bio: "",
    skills: "",
    projects: "",
  });

  // Recruiter Job Form State
  const [newJob, setNewJob] = useState({
    title: "",
    job_type: "INTERNSHIP",
    min_cgpa: 8.0,
    package_lpa: 8.0,
    skills_required: "",
    open_slots: 2,
  });

  const loadData = async (filterSkill = "") => {
    const matchUrl = filterSkill ? `/api/match?skill=${encodeURIComponent(filterSkill)}` : "/api/match";
    const [jobsRes, appsRes, statsRes, mongoRes] = await Promise.all([
      fetch("/api/jobs"),
      fetch("/api/applications"),
      fetch("/api/analytics"),
      fetch(matchUrl),
    ]);
    setJobs(await jobsRes.json());
    setApplications(await appsRes.json());
    setAnalytics(await statsRes.json());
    const mongoData = await mongoRes.json();
    setMongoResumes(mongoData.resumes || []);
  };

  useEffect(() => {
    const stored = localStorage.getItem("session");
    if (!stored) {
      router.push("/");
      return;
    }
    setSession(JSON.parse(stored));
    loadData();
  }, [router]);

  if (!session) return null;
  const { user, profile } = session;

  const handleApply = async (job_id) => {
    setMsg("");
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: user.role, srn: profile.srn, job_id, match_score: 90.0 }),
    });
    const data = await res.json();
    setMsg(data.message || data.error);
    loadData(skillFilter);
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newJob, role: user.role, recruiter_id: profile.recruiter_id }),
    });
    const data = await res.json();
    setMsg(data.message || data.error);
    setNewJob({ title: "", job_type: "INTERNSHIP", min_cgpa: 8.0, package_lpa: 8.0, skills_required: "", open_slots: 2 });
    loadData(skillFilter);
  };

  const handleStatusChange = async (app_id, status) => {
    const res = await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: user.role, app_id, status }),
    });
    const data = await res.json();
    setMsg(data.message || data.error);
    loadData(skillFilter);
  };

  const handleSaveNoSqlProfile = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/match", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        srn: profile.srn,
        name: profile.full_name,
        dept: "CSE-AIML",
        bio: nosqlForm.bio,
        skills: nosqlForm.skills,
        projects: nosqlForm.projects,
      }),
    });
    const data = await res.json();
    setMsg(data.message || data.error);
    setNosqlForm({ bio: "", skills: "", projects: "" });
    loadData(skillFilter);
  };

  const handleDeleteNoSqlDoc = async (srn) => {
    const res = await fetch(`/api/match?srn=${encodeURIComponent(srn)}`, { method: "DELETE" });
    const data = await res.json();
    setMsg(data.message || data.error);
    loadData(skillFilter);
  };

  const getStatusBadge = (status) => {
    if (status === "SELECTED" || status === "OPEN") return "badge badge-green";
    if (status === "SHORTLISTED") return "badge badge-indigo";
    if (status === "CLOSED" || status === "REJECTED") return "badge badge-red";
    return "badge badge-amber";
  };

  const totalOpenSlots = jobs.reduce((acc, j) => acc + (j.status === "OPEN" ? Number(j.open_slots) : 0), 0);
  const selectedCount = applications.filter((a) => a.status === "SELECTED").length;

  return (
    <div className="app-shell">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            PESU <span>HireSync</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, marginBottom: "10px", letterSpacing: "0.05em" }}>
            ARCHITECTURE
          </div>
          <button className="nav-item active">Dashboard Overview</button>
          <div style={{ marginTop: "20px", fontSize: "12px", color: "#94a3b8", lineHeight: 1.8 }}>
            <div><strong>Relational DB:</strong> MySQL 8</div>
            <div><strong>NoSQL Store:</strong> MongoDB</div>
            <div><strong>RBAC Session:</strong> app_{user.role.toLowerCase()}</div>
          </div>
        </div>

        <div className="profile-box">
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: "2px" }}>
            {profile.full_name || profile.contact_person || "Placement Admin"}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>{user.email}</div>
          <span className="badge badge-indigo">{user.role}</span>
          {profile.srn && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: "#cbd5e1" }}>
              SRN: <strong>{profile.srn}</strong> • CGPA: <strong>{profile.cgpa}</strong>
            </div>
          )}
          <button
            className="btn btn-danger btn-sm"
            style={{ width: "100%", marginTop: "12px" }}
            onClick={() => {
              localStorage.removeItem("session");
              router.push("/");
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div className="topbar">
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800 }}>Campus Internship &amp; Placement Portal</h1>
            <p style={{ fontSize: "13px", color: "#64748b" }}>
              Hybrid MySQL Transactional Engine &amp; MongoDB Document Portfolio System
            </p>
          </div>
        </div>

        {msg && <div className="toast">{msg}</div>}

        {/* KPI CARDS */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Active Drive Roles</div>
            <div className="kpi-value">{jobs.length}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Available Open Slots</div>
            <div className="kpi-value">{totalOpenSlots}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total Applications</div>
            <div className="kpi-value">{applications.length}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Offers Extended</div>
            <div className="kpi-value" style={{ color: "#059669" }}>{selectedCount}</div>
          </div>
        </div>

        {/* STUDENT MONGODB NOSQL CREATE / UPDATE */}
        {user.role === "STUDENT" && (
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">My NoSQL Portfolio Document (MongoDB)</h3>
                <p className="card-sub">Create or update your unstructured skills &amp; project arrays in MongoDB</p>
              </div>
              <span className="badge badge-indigo">MongoDB: UPSERT / UPDATE</span>
            </div>
            <form onSubmit={handleSaveNoSqlProfile} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <input
                className="input"
                style={{ gridColumn: "span 2" }}
                placeholder="Professional Summary / Bio"
                value={nosqlForm.bio}
                onChange={(e) => setNosqlForm({ ...nosqlForm, bio: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Skills (comma-separated, e.g. C++, React, MongoDB)"
                value={nosqlForm.skills}
                onChange={(e) => setNosqlForm({ ...nosqlForm, skills: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Projects (comma-separated)"
                value={nosqlForm.projects}
                onChange={(e) => setNosqlForm({ ...nosqlForm, projects: e.target.value })}
                required
              />
              <button className="btn" type="submit" style={{ gridColumn: "span 2" }}>
                Save NoSQL Portfolio Document
              </button>
            </form>
          </div>
        )}

        {/* RECRUITER POST JOB */}
        {user.role === "RECRUITER" && (
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Publish New Job / Internship Opening</h3>
                <p className="card-sub">Executed under MySQL role_recruiter privileges</p>
              </div>
              <span className="badge badge-indigo">MySQL RBAC: INSERT</span>
            </div>
            
              <form onSubmit={handleCreateJob} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
  <div>
    <label className="form-label">Job / Internship Title</label>
    <input
      className="input"
      placeholder="e.g., ML Intern"
      value={newJob.title}
      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
      required
    />
  </div>

  <div>
    <label className="form-label">Opportunity Type</label>
    <select
      className="select"
      value={newJob.job_type}
      onChange={(e) => setNewJob({ ...newJob, job_type: e.target.value })}
    >
      <option value="INTERNSHIP">INTERNSHIP</option>
      <option value="FULL_TIME">FULL_TIME</option>
    </select>
  </div>

  <div>
    <label className="form-label">Minimum CGPA Cutoff (0 - 10)</label>
    <input
      className="input"
      type="number"
      step="0.01"
      min="0"
      max="10"
      value={newJob.min_cgpa}
      onChange={(e) => setNewJob({ ...newJob, min_cgpa: e.target.value })}
      required
    />
  </div>

  <div>
    <label className="form-label">Package / Stipend (in LPA)</label>
    <input
      className="input"
      type="number"
      step="0.1"
      min="0"
      value={newJob.package_lpa}
      onChange={(e) => setNewJob({ ...newJob, package_lpa: e.target.value })}
      required
    />
  </div>

  <div>
    <label className="form-label">Required Skills (comma-separated)</label>
    <input
      className="input"
      placeholder="e.g., Python, PyTorch, SQL"
      value={newJob.skills_required}
      onChange={(e) => setNewJob({ ...newJob, skills_required: e.target.value })}
      required
    />
  </div>

  <div>
    <label className="form-label">Number of Open Slots</label>
    <input
      className="input"
      type="number"
      min="1"
      value={newJob.open_slots}
      onChange={(e) => setNewJob({ ...newJob, open_slots: e.target.value })}
      required
    />
  </div>

  <button className="btn" type="submit" style={{ gridColumn: "span 2", marginTop: "4px" }}>
    Publish Opening to Campus Portal
  </button>
</form>
                
             
          </div>
        )}

        {/* JOB POSTINGS TABLE */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Active Campus Recruitment Drives</h3>
              <p className="card-sub">Enforces CGPA cutoffs &amp; slot availability via sp_apply_for_job</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Position</th>
                  <th>Type</th>
                  <th>Min CGPA</th>
                  <th>CTC (LPA)</th>
                  <th>Slots</th>
                  <th>Status</th>
                  {user.role === "STUDENT" && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.job_id}>
                    <td><strong>{j.company_name}</strong></td>
                    <td>{j.title}</td>
                    <td><span className="badge badge-slate">{j.job_type}</span></td>
                    <td>{j.min_cgpa}</td>
                    <td><strong>₹{j.package_lpa} LPA</strong></td>
                    <td>{j.open_slots}</td>
                    <td><span className={getStatusBadge(j.status)}>{j.status}</span></td>
                    {user.role === "STUDENT" && (
                      <td>
                        <button
                          className="btn btn-sm"
                          disabled={j.status !== "OPEN"}
                          onClick={() => handleApply(j.job_id)}
                        >
                          Apply Now
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MONGODB NOSQL DOCUMENT EXPLORER & SKILL FILTER */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Student NoSQL Portfolios (MongoDB Collection: student_resumes)</h3>
              <p className="card-sub">Flexible JSON documents storing variable-length skill &amp; project arrays</p>
            </div>
            <span className="badge badge-indigo">MongoDB: READ {user.role === "ADMIN" ? "/ DELETE" : ""}</span>
          </div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
            <input
              className="input"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Filter MongoDB documents by skill (e.g., React, Python, Linux)..."
            />
            <button className="btn" style={{ whiteSpace: "nowrap" }} onClick={() => loadData(skillFilter)}>
              Filter Skills
            </button>
            {skillFilter && (
              <button
                className="btn btn-outline"
                onClick={() => {
                  setSkillFilter("");
                  loadData("");
                }}
              >
                Reset
              </button>
            )}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SRN</th>
                  <th>Student</th>
                  <th>Bio</th>
                  <th>Skills Array</th>
                  <th>Projects Array</th>
                  {user.role === "ADMIN" && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {mongoResumes.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#64748b" }}>
                      No MongoDB documents found. Log in as a Student to add one or seed via mongosh.
                    </td>
                  </tr>
                ) : (
                  mongoResumes.map((r) => (
                    <tr key={r.srn}>
                      <td><strong>{r.srn}</strong></td>
                      <td>{r.name}</td>
                      <td style={{ fontSize: "13px", color: "#475569" }}>{r.bio}</td>
                      <td>
                        {(r.skills || []).map((s, idx) => (
                          <span key={idx} className="badge badge-slate" style={{ marginRight: "4px", marginBottom: "4px" }}>
                            {s}
                          </span>
                        ))}
                      </td>
                      <td style={{ fontSize: "13px" }}>{(r.projects || []).join(", ")}</td>
                      {user.role === "ADMIN" && (
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteNoSqlDoc(r.srn)}>
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* APPLICATIONS PIPELINE */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Candidate Applications Pipeline</h3>
              <p className="card-sub">Multi-table SQL Join + fn_compute_priority_tier() + AFTER UPDATE Trigger</p>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SRN</th>
                  <th>Student</th>
                  <th>CGPA</th>
                  <th>Company &amp; Role</th>
                  <th>Priority Tier (SQL Fn)</th>
                  <th>Status</th>
                  {(user.role === "RECRUITER" || user.role === "ADMIN") && <th>Decision</th>}
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.app_id}>
                    <td>{a.srn}</td>
                    <td><strong>{a.full_name}</strong></td>
                    <td>{a.cgpa}</td>
                    <td>{a.company_name} — {a.job_title}</td>
                    <td><span className="badge badge-indigo">{a.priority_tier}</span></td>
                    <td><span className={getStatusBadge(a.status)}>{a.status}</span></td>
                    {(user.role === "RECRUITER" || user.role === "ADMIN") && (
                      <td style={{ display: "flex", gap: "6px" }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleStatusChange(a.app_id, "SHORTLISTED")}>
                          Shortlist
                        </button>
                        <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(a.app_id, "SELECTED")}>
                          Select
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ADMIN CTE ANALYTICS & TRIGGER LOGS */}
        {user.role === "ADMIN" && (
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Department Placement Analytics (SQL CTE) &amp; Trigger Audit Trail</h3>
                <p className="card-sub">Aggregated via Common Table Expression &amp; populated by trg_after_application_update</p>
              </div>
            </div>
            <div className="table-wrap" style={{ marginBottom: "24px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Total Students</th>
                    <th>Placed</th>
                    <th>Avg CGPA</th>
                    <th>Placement Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.deptStats.map((d) => (
                    <tr key={d.dept_code}>
                      <td><strong>{d.dept_code}</strong></td>
                      <td>{d.total_students}</td>
                      <td>{d.placed_count}</td>
                      <td>{d.avg_cgpa}</td>
                      <td><span className="badge badge-green">{d.placement_rate_pct}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>
              Trigger Audit Log (audit_logs)
            </h4>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>App ID</th>
                    <th>Previous Status</th>
                    <th>New Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.auditLogs.map((l) => (
                    <tr key={l.log_id}>
                      <td>#{l.log_id}</td>
                      <td>App #{l.app_id}</td>
                      <td><span className="badge badge-slate">{l.old_status}</span></td>
                      <td><span className="badge badge-green">{l.new_status}</span></td>
                      <td>{new Date(l.changed_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}