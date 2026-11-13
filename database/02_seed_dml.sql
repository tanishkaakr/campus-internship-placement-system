USE campus_placement_db;

-- INSERT Operations
INSERT INTO departments (dept_code, dept_name) VALUES
('CSE-AIML', 'Computer Science & Engineering (AI & ML)'),
('CSE', 'Computer Science & Engineering'),
('ECE', 'Electronics & Communication Engineering');

INSERT INTO users (email, password_hash, role) VALUES
('tanishkaa@pesu.pes.edu', 'pass123', 'STUDENT'),
('pavithra@pesu.pes.edu', 'pass123', 'STUDENT'),
('khushi@pesu.pes.edu', 'pass123', 'STUDENT'),
('hr@vehere.com', 'recruiter123', 'RECRUITER'),
('talent@fidelity.com', 'recruiter123', 'RECRUITER'),
('placement.admin@pes.edu', 'admin123', 'ADMIN');

INSERT INTO students (srn, user_id, dept_id, full_name, cgpa, grad_year, is_placed, mongo_doc_id) VALUES
('PES1UG24AM126', 1, 1, 'K.R. Tanishkaa', 9.46, 2028, FALSE, 'mongo_srn_126'),
('PES1UG24AM127', 2, 1, 'Pavithra S', 9.12, 2028, FALSE, 'mongo_srn_127'),
('PES1UG24CS045', 3, 2, 'Khushi R', 8.75, 2028, FALSE, 'mongo_srn_045');

INSERT INTO recruiters (user_id, company_name, industry, contact_person) VALUES
(4, 'Vehere Technologies', 'Cybersecurity & AI', 'Ananya Sharma'),
(5, 'Fidelity Investments', 'FinTech', 'Vikram Rao');

INSERT INTO job_postings (recruiter_id, title, job_type, min_cgpa, package_lpa, skills_required, open_slots, status) VALUES
(1, 'Full Stack & AI Intern', 'INTERNSHIP', 8.00, 6.00, 'React, Node.js, MongoDB, Python, RAG Pipelines, REST APIs', 3, 'OPEN'),
(2, 'Software Engineer - Data & Cloud', 'FULL_TIME', 8.50, 14.50, 'C++, Python, SQL, Distributed Systems, Docker, FastAPI', 2, 'OPEN'),
(1, 'Network Security Analyst Intern', 'INTERNSHIP', 7.50, 5.50, 'Networking, IPv4, Linux, Python, Packet Analysis', 2, 'OPEN');

INSERT INTO applications (srn, job_id, match_score, status) VALUES
('PES1UG24AM126', 1, 92.50, 'SHORTLISTED'),
('PES1UG24AM126', 2, 88.40, 'APPLIED'),
('PES1UG24AM127', 1, 84.10, 'APPLIED'),
('PES1UG24CS045', 3, 79.00, 'APPLIED');

-- UPDATE & DELETE DML Demonstration
UPDATE job_postings SET package_lpa = 15.00 WHERE job_id = 2;
DELETE FROM applications WHERE srn = 'PES1UG24CS045' AND job_id = 3;
INSERT INTO applications (srn, job_id, match_score, status) VALUES ('PES1UG24CS045', 3, 79.00, 'APPLIED');