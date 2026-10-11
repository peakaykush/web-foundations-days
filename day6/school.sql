-- ============================================================================
-- School Database Schema & Queries (SQLite)
-- Day 6 Assignment
-- ============================================================================

-- Enable foreign key constraint enforcement in SQLite
PRAGMA foreign_keys = ON;

-- Drop tables if they already exist to ensure a clean run
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- ============================================================================
-- 1. Table Definitions
-- ============================================================================

-- Students table: stores student profiles
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- Courses table: stores available course offerings
CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

-- Enrolments table: junction table linking students and courses (M:N)
-- Includes a rule preventing duplicate enrolments for the same student on the same course
CREATE TABLE enrolments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE (student_id, course_id)
);

-- ============================================================================
-- 2. Sample Data Insertion
-- ============================================================================

-- Insert at least 3 students (inserting 4 so student 4 has no enrolments)
INSERT INTO students (name, email) VALUES
    ('Alice Johnson', 'alice.johnson@example.com'),
    ('Bob Smith', 'bob.smith@example.com'),
    ('Charlie Brown', 'charlie.brown@example.com'),
    ('Diana Prince', 'diana.prince@example.com');

-- Insert at least 3 courses
INSERT INTO courses (title, code) VALUES
    ('Introduction to Web Development', 'CS101'),
    ('Data Structures and Algorithms', 'CS201'),
    ('Database Systems & SQL', 'CS301');

-- Insert at least 5 enrolments
INSERT INTO enrolments (student_id, course_id, grade) VALUES
    (1, 1, 'A'),   -- Alice in CS101
    (1, 2, 'B+'),  -- Alice in CS201
    (2, 1, 'A-'),  -- Bob in CS101
    (2, 3, 'B'),   -- Bob in CS301
    (3, 2, 'A');   -- Charlie in CS201

-- ============================================================================
-- 3. Queries
-- ============================================================================

-- Query 1: All courses for one student (by name)
SELECT 
    s.name AS student_name,
    c.code AS course_code,
    c.title AS course_title,
    e.grade
FROM students s
JOIN enrolments e ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id
WHERE s.name = 'Alice Johnson';

-- Query 2: All students on one course (by title)
SELECT 
    c.title AS course_title,
    s.name AS student_name,
    s.email AS student_email,
    e.grade
FROM courses c
JOIN enrolments e ON c.id = e.course_id
JOIN students s ON s.id = e.student_id
WHERE c.title = 'Introduction to Web Development';

-- Query 3: The number of students per course (includes courses with 0 students)
SELECT 
    c.code AS course_code,
    c.title AS course_title,
    COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.id = e.course_id
GROUP BY c.id, c.code, c.title
ORDER BY student_count DESC;

-- Query 4: Students who have no enrolments
SELECT 
    s.id AS student_id,
    s.name AS student_name,
    s.email AS student_email
FROM students s
LEFT JOIN enrolments e ON s.id = e.student_id
WHERE e.id IS NULL;

-- Query 5: An update of one enrolment's grade
UPDATE enrolments
SET grade = 'A+'
WHERE student_id = (SELECT id FROM students WHERE name = 'Bob Smith')
  AND course_id = (SELECT id FROM courses WHERE code = 'CS301');

-- Verification of updated grade
SELECT 
    s.name AS student_name,
    c.code AS course_code,
    e.grade AS updated_grade
FROM enrolments e
JOIN students s ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id
WHERE s.name = 'Bob Smith' AND c.code = 'CS301';
