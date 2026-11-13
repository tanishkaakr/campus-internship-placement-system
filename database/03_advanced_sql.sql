USE campus_placement_db;

DELIMITER //

-- 1. STORED FUNCTION: Compute Candidate Priority Tier from CGPA + Vector Match Score
DROP FUNCTION IF EXISTS fn_compute_priority_tier//
CREATE FUNCTION fn_compute_priority_tier(p_cgpa DECIMAL(4,2), p_match_score DECIMAL(5,2))
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    DECLARE v_index DECIMAL(6,2);
    SET v_index = (p_cgpa * 5) + (p_match_score * 0.5);
    IF v_index >= 90 THEN
        RETURN 'TIER_1_FASTTRACK';
    ELSEIF v_index >= 75 THEN
        RETURN 'TIER_2_STANDARD';
    ELSE
        RETURN 'TIER_3_REVIEW';
    END IF;
END//

-- 2. STORED PROCEDURE: Transactional Job Application with CGPA & Slot Validation
DROP PROCEDURE IF EXISTS sp_apply_for_job//
CREATE PROCEDURE sp_apply_for_job(
    IN p_srn VARCHAR(20),
    IN p_job_id INT,
    IN p_match_score DECIMAL(5,2)
)
BEGIN
    DECLARE v_student_cgpa DECIMAL(4,2);
    DECLARE v_min_cgpa DECIMAL(4,2);
    DECLARE v_slots INT;
    DECLARE v_job_status VARCHAR(10);

    SELECT cgpa INTO v_student_cgpa FROM students WHERE srn = p_srn;
    SELECT min_cgpa, open_slots, status INTO v_min_cgpa, v_slots, v_job_status
    FROM job_postings WHERE job_id = p_job_id;

    IF v_job_status <> 'OPEN' OR v_slots <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Job posting is closed or has zero open slots.';
    ELSEIF v_student_cgpa < v_min_cgpa THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student CGPA does not meet minimum eligibility criteria.';
    ELSE
        INSERT INTO applications (srn, job_id, match_score, status)
        VALUES (p_srn, p_job_id, p_match_score, 'APPLIED')
        ON DUPLICATE KEY UPDATE match_score = p_match_score;
    END IF;
END//

-- 3. TRIGGER: Audit Status Transitions + Auto-Decrement Slots & Mark Student Placed
DROP TRIGGER IF EXISTS trg_after_application_update//
CREATE TRIGGER trg_after_application_update
AFTER UPDATE ON applications
FOR EACH ROW
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO audit_logs (app_id, old_status, new_status)
        VALUES (NEW.app_id, OLD.status, NEW.status);

        IF NEW.status = 'SELECTED' AND OLD.status <> 'SELECTED' THEN
            UPDATE students SET is_placed = TRUE WHERE srn = NEW.srn;
            UPDATE job_postings
            SET open_slots = GREATEST(open_slots - 1, 0),
                status = IF(open_slots - 1 <= 0, 'CLOSED', 'OPEN')
            WHERE job_id = NEW.job_id;
        END IF;
    END IF;
END//

DELIMITER ;

-- =========================================================================
-- ANALYTICAL SQL QUERIES (Multi-Table Joins, Correlated Subquery, CTE, Recursive CTE)
-- =========================================================================

-- A. MULTI-TABLE JOIN + STORED FUNCTION CALL
SELECT
    a.app_id,
    s.srn,
    s.full_name,
    d.dept_code,
    s.cgpa,
    r.company_name,
    j.title AS job_title,
    a.match_score,
    fn_compute_priority_tier(s.cgpa, a.match_score) AS priority_tier,
    a.status
FROM applications a
INNER JOIN students s ON a.srn = s.srn
INNER JOIN departments d ON s.dept_id = d.dept_id
INNER JOIN job_postings j ON a.job_id = j.job_id
INNER JOIN recruiters r ON j.recruiter_id = r.recruiter_id
ORDER BY a.match_score DESC;

-- B. CORRELATED SUBQUERY: Students scoring above their own department's average CGPA
SELECT s1.srn, s1.full_name, d.dept_code, s1.cgpa
FROM students s1
JOIN departments d ON s1.dept_id = d.dept_id
WHERE s1.cgpa > (
    SELECT AVG(s2.cgpa)
    FROM students s2
    WHERE s2.dept_id = s1.dept_id
);

-- C. CTE (Common Table Expression): Department-wise Placement Rate Analytics
WITH DeptSummary AS (
    SELECT
        d.dept_code,
        COUNT(DISTINCT s.srn) AS total_students,
        SUM(CASE WHEN s.is_placed = TRUE THEN 1 ELSE 0 END) AS placed_count,
        ROUND(AVG(s.cgpa), 2) AS avg_cgpa
    FROM departments d
    LEFT JOIN students s ON d.dept_id = s.dept_id
    GROUP BY d.dept_code
)
SELECT
    dept_code,
    total_students,
    placed_count,
    avg_cgpa,
    ROUND((placed_count / NULLIF(total_students, 0)) * 100, 1) AS placement_rate_pct
FROM DeptSummary;

-- D. RECURSIVE CTE: Generate CGPA Cutoff Tier Ladder (6.0 to 9.5) & Eligible Student Counts
WITH RECURSIVE cgpa_ladder(cutoff) AS (
    SELECT CAST(6.00 AS DECIMAL(4,2))
    UNION ALL
    SELECT CAST(cutoff + 0.50 AS DECIMAL(4,2))
    FROM cgpa_ladder
    WHERE cutoff < 9.50
)
SELECT
    c.cutoff AS min_cgpa_threshold,
    COUNT(s.srn) AS eligible_students
FROM cgpa_ladder c
LEFT JOIN students s ON s.cgpa >= c.cutoff
GROUP BY c.cutoff
ORDER BY c.cutoff;