import { NextResponse } from "next/server";
import { getPoolForRole } from "@/lib/db";

export async function GET() {
  try {
    const pool = getPoolForRole("ADMIN");

    const [deptStats] = await pool.query(`
      WITH DeptSummary AS (
        SELECT d.dept_code,
               COUNT(DISTINCT s.srn) AS total_students,
               SUM(CASE WHEN s.is_placed = TRUE THEN 1 ELSE 0 END) AS placed_count,
               ROUND(AVG(s.cgpa), 2) AS avg_cgpa
        FROM departments d
        LEFT JOIN students s ON d.dept_id = s.dept_id
        GROUP BY d.dept_code
      )
      SELECT dept_code, total_students, placed_count, avg_cgpa,
             ROUND((placed_count / NULLIF(total_students, 0)) * 100, 1) AS placement_rate_pct
      FROM DeptSummary
    `);

    const [auditLogs] = await pool.query("SELECT * FROM audit_logs ORDER BY changed_at DESC LIMIT 10");

    return NextResponse.json({ deptStats, auditLogs });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}