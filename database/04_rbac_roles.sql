USE campus_placement_db;

-- Create Database Roles
CREATE ROLE IF NOT EXISTS 'role_student', 'role_recruiter', 'role_placement_admin';

-- Grant Least-Privilege Access per Role
GRANT SELECT ON campus_placement_db.job_postings TO 'role_student';
GRANT SELECT ON campus_placement_db.recruiters TO 'role_student';
GRANT SELECT, INSERT ON campus_placement_db.applications TO 'role_student';
GRANT EXECUTE ON PROCEDURE campus_placement_db.sp_apply_for_job TO 'role_student';

GRANT SELECT, INSERT, UPDATE ON campus_placement_db.job_postings TO 'role_recruiter';
GRANT SELECT, UPDATE ON campus_placement_db.applications TO 'role_recruiter';
GRANT SELECT ON campus_placement_db.students TO 'role_recruiter';

GRANT ALL PRIVILEGES ON campus_placement_db.* TO 'role_placement_admin';

-- Create Database Users & Assign Roles
CREATE USER IF NOT EXISTS 'app_student'@'localhost' IDENTIFIED BY 'Student@123';
CREATE USER IF NOT EXISTS 'app_recruiter'@'localhost' IDENTIFIED BY 'Recruiter@123';
CREATE USER IF NOT EXISTS 'app_admin'@'localhost' IDENTIFIED BY 'Admin@123';

GRANT 'role_student' TO 'app_student'@'localhost';
GRANT 'role_recruiter' TO 'app_recruiter'@'localhost';
GRANT 'role_placement_admin' TO 'app_admin'@'localhost';

SET DEFAULT ROLE ALL TO
    'app_student'@'localhost',
    'app_recruiter'@'localhost',
    'app_admin'@'localhost';

FLUSH PRIVILEGES;