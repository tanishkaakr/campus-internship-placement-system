import { NextResponse } from "next/server";
import { getPoolForRole } from "@/lib/db";

export async function GET() {
  try {
    const pool = getPoolForRole("ADMIN");
    const [rows] = await pool.query(`
      SELECT j.*, r.company_name, r.industry
      FROM job_postings j
      JOIN recruiters r ON j.recruiter_id = r.recruiter_id
      ORDER BY j.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { role, recruiter_id, title, job_type, min_cgpa, package_lpa, skills_required, open_slots } =
      await request.json();
    const pool = getPoolForRole(role || "RECRUITER");

    const [result] = await pool.query(
      `INSERT INTO job_postings (recruiter_id, title, job_type, min_cgpa, package_lpa, skills_required, open_slots)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [recruiter_id, title, job_type, min_cgpa, package_lpa, skills_required, open_slots]
    );
    return NextResponse.json({ message: "Job posted successfully", job_id: result.insertId });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}