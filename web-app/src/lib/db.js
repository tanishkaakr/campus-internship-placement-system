import mysql from "mysql2/promise";

const pools = {};

export function getPoolForRole(role = "ADMIN") {
  const normalizedRole = role.toUpperCase();
  if (!pools[normalizedRole]) {
    let user = process.env.ADMIN_DB_USER;
    let password = process.env.ADMIN_DB_PASS;

    if (normalizedRole === "STUDENT") {
      user = process.env.STUDENT_DB_USER;
      password = process.env.STUDENT_DB_PASS;
    } else if (normalizedRole === "RECRUITER") {
      user = process.env.RECRUITER_DB_USER;
      password = process.env.RECRUITER_DB_PASS;
    }

    pools[normalizedRole] = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user,
      password,
      database: process.env.DB_NAME || "campus_placement_db",
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pools[normalizedRole];
}