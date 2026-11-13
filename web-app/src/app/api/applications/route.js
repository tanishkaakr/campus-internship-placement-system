import { NextResponse } from "next/server";
import { getPoolForRole } from "@/lib/db";

export async function GET() {
  try {
    const pool = getPoolForRole("ADMIN");
    const [rows] = await pool.query(`
      SELECT
        a.app_id, a.srn, s.full_name, d.dept_code, s.cgpa,
        r.company_name, j.title AS job_title, a.match_score,
        fn_compute_priority_tier(s.cgpa, a.match_score) AS priority_tier,
        a.status
      FROM applications a
      JOIN students s ON a.srn = s.srn
      JOIN departments d ON s.dept_id = d.dept_id
      JOIN job_postings j ON a.job_id = j.job_id
      JOIN recruiters r ON j.recruiter_id = r.recruiter_id
      ORDER BY a.match_score DESC
    `);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { role, srn, job_id, match_score } = await request.json();
    const pool = getPoolForRole(role || "STUDENT");

    await pool.query("CALL sp_apply_for_job(?, ?, ?)", [srn, job_id, match_score || 85.0]);
    return NextResponse.json({ message: "Application submitted via stored procedure!" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const { role, app_id, status } = await request.json();
    const pool = getPoolForRole(role || "RECRUITER");

    await pool.query("UPDATE applications SET status = ? WHERE app_id = ?", [status, app_id]);
    return NextResponse.json({ message: `Status updated to ${status} (Trigger executed)` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}