# School Database Design & Architecture

This document explains the schema design, relational modeling, indexing strategy, and storage engine evaluation for the School database system.

---

## 1. Table Explanations

- **`students`**:
  - Stores foundational profile information for each registered student.
  - Contains primary key `id`, mandatory student `name`, and a mandatory `email` attribute enforced with a `UNIQUE` constraint to prevent duplicate registrations and guarantee unique identification.

- **`courses`**:
  - Represents the academic course catalog available at the institution.
  - Contains primary key `id`, mandatory course `title`, and a unique course code (`code`, such as `CS101`) to uniquely differentiate offerings.

- **`enrolments`**:
  - Serves as the associative (junction / bridge) table linking students to the courses they take.
  - Stores foreign keys `student_id` (referencing `students(id)`) and `course_id` (referencing `courses(id)`).
  - Holds relationship-specific payload attributes such as `grade`.
  - Implements a compound `UNIQUE (student_id, course_id)` constraint that enforces business rules preventing a student from enrolling in the exact same course more than once.

---

## 2. Relationships & Join Table Architecture

### Relationships
- **One-to-Many (`1:N`) Relationships**:
  - **`students` → `enrolments`**: A single student can register for multiple courses over time, producing multiple rows in `enrolments`. However, each enrolment record points back to exactly one student.
  - **`courses` → `enrolments`**: A single course can be taken by many students simultaneously, generating multiple enrolment entries. Each enrolment record belongs to exactly one course.

- **Many-to-Many (`M:N`) Relationship**:
  - **`students` ↔ `courses`**: A student can enroll in multiple courses, and conversely, a course can enroll multiple students.

### Why a Join Table is Needed
In relational database design (First Normal Form - 1NF), attributes must be atomic; tables cannot store comma-separated lists, arrays, or repeating groups of foreign keys. 
- Storing an array of course IDs in the `students` table, or student IDs in the `courses` table, breaks atomicity, complicates indexing, makes referential integrity impossible to enforce, and prevents efficient querying.
- Adding fixed columns (e.g., `course_1`, `course_2`) introduces arbitrary limits and wastes storage with `NULL` values.
- The `enrolments` join table decomposes the complex Many-to-Many relationship into two clean, manageable One-to-Many relationships. Furthermore, it provides an intuitive, normalized location to store metadata that belongs specifically to the association itself—such as the student's `grade`, enrolment date, or status.

---

## 3. Recommended Index & Justification

- **Recommended Index:**
  ```sql
  CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);
  ```

- **Reasoning:**
  - While the `UNIQUE (student_id, course_id)` table constraint automatically generates an index in SQLite, that index is ordered by `student_id` first. This makes it efficient for queries filtering by `student_id`, but suboptimal for queries filtering or joining solely by `course_id`.
  - In a school system, course roster queries (e.g., "Find all students enrolled in CS101" or `GROUP BY course_id` aggregations) execute frequently. Without an explicit index on `enrolments(course_id)`, database engines must perform a sequential full table scan of the `enrolments` table.
  - Adding `idx_enrolments_course_id` reduces lookup complexity from $O(N)$ to $O(\log N)$ for foreign key joins and reverse lookups, significantly improving query performance as enrolment volume scales.

---

## 4. Architectural Decision: SQL vs. NoSQL

For this school registration and grading system, a relational **SQL database** is the optimal choice over a NoSQL document or key-value store. Academic records demand strict ACID guarantees and strong data integrity: relational foreign keys prevent orphaned enrolment records if a student or course is modified or deleted, while schema-level uniqueness constraints guarantee that duplicate course registrations or duplicate emails are impossible at the database engine level. Furthermore, educational data is inherently relational and frequently queried through multi-table joins—such as calculating GPAs, compiling course rosters, or detecting students with zero enrolments via `LEFT JOIN`. In a NoSQL system, achieving this consistency would require either error-prone application-level validation or extensive data duplication, increasing the risk of data anomalies whenever course titles or student details are updated.
