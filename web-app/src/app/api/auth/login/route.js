import { NextResponse } from "next/server";
import { getPoolForRole } from "@/lib/db";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    const pool = getPoolForRole("ADMIN");

    const [users] = await pool.query(
      "SELECT user_id, email, role FROM users WHERE email = ? AND password_hash = ?",
      [email, password]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = users[0];
    let profile = {};

    if (user.role === "STUDENT") {
      const [rows] = await pool.query("SELECT * FROM students WHERE user_id = ?", [user.user_id]);
      profile = rows[0] || {};
    } else if (user.role === "RECRUITER") {
      const [rows] = await pool.query("SELECT * FROM recruiters WHERE user_id = ?", [user.user_id]);
      profile = rows[0] || {};
    }

    return NextResponse.json({ user, profile });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}