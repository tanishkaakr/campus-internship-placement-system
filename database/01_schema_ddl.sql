CREATE DATABASE IF NOT EXISTS campus_placement_db;
USE campus_placement_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs, applications, job_postings, recruiters, students, departments, users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table (Authentication & App-Level Roles)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'RECRUITER', 'ADMIN') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments Table
CREATE TABLE departments (
    dept_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_code VARCHAR(15) NOT NULL UNIQUE,
    dept_name VARCHAR(100) NOT NULL
);

-- 3. Students Table (Links to MongoDB NoSQL document via mongo_doc_id)
CREATE TABLE students (
    srn VARCHAR(20) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    dept_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    cgpa DECIMAL(4,2) NOT NULL CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    grad_year INT NOT NULL CHECK (grad_year >= 2024),
    is_placed BOOLEAN DEFAULT FALSE,
    mongo_doc_id VARCHAR(64) NULL,
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_student_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE RESTRICT
);

-- 4. Recruiters Table
CREATE TABLE recruiters (
    recruiter_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    company_name VARCHAR(120) NOT NULL,
    industry VARCHAR(80) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    CONSTRAINT fk_recruiter_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 5. Job Postings Table
CREATE TABLE job_postings (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    recruiter_id INT NOT NULL,
    title VARCHAR(120) NOT NULL,
    job_type ENUM('INTERNSHIP', 'FULL_TIME') NOT NULL,
    min_cgpa DECIMAL(4,2) DEFAULT 6.00 CHECK (min_cgpa >= 0.00 AND min_cgpa <= 10.00),
    package_lpa DECIMAL(6,2) NOT NULL CHECK (package_lpa > 0),
    skills_required TEXT NOT NULL,
    open_slots INT NOT NULL DEFAULT 1 CHECK (open_slots >= 0),
    status ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_job_recruiter FOREIGN KEY (recruiter_id) REFERENCES recruiters(recruiter_id) ON DELETE CASCADE
);

-- 6. Applications Table (Composite UNIQUE prevents duplicate applications)
CREATE TABLE applications (
    app_id INT AUTO_INCREMENT PRIMARY KEY,
    srn VARCHAR(20) NOT NULL,
    job_id INT NOT NULL,
    match_score DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED') DEFAULT 'APPLIED',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_job (srn, job_id),
    CONSTRAINT fk_app_student FOREIGN KEY (srn) REFERENCES students(srn) ON DELETE CASCADE,
    CONSTRAINT fk_app_job FOREIGN KEY (job_id) REFERENCES job_postings(job_id) ON DELETE CASCADE
);

-- 7. Audit Logs Table (Automatically populated by AFTER UPDATE Trigger)
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    app_id INT NOT NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);