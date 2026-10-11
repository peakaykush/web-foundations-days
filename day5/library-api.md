# Library Books REST API Design

This document specifies the RESTful API design for managing a library's `books` resource. It outlines core CRUD operations, query parameter filtering, request payloads, success response status codes, and standard client error handling.

---

## Base URL
`/api/books`

---

## Endpoints

### 1. List All Books
- **Method:** `GET`
- **Path:** `/api/books`
- **Description:** Retrieves an array of all books available in the library collection.
- **Request Body:** None
- **Success Status Code:** `200 OK`

---

### 2. Get One Book
- **Method:** `GET`
- **Path:** `/api/books/:id`
- **Description:** Retrieves the detailed record of a single book identified by its unique ID.
- **Request Body:** None
- **Success Status Code:** `200 OK`

---

### 3. Create a Book
- **Method:** `POST`
- **Path:** `/api/books`
- **Description:** Adds a new book entry to the library catalog.
- **Request Body:**
  ```json
  {
    "title": "The Pragmatic Programmer",
    "author": "David Thomas, Andrew Hunt",
    "isbn": "978-0135957059",
    "publishedYear": 2019,
    "genre": "Computer Science",
    "copiesAvailable": 4
  }
  ```
- **Success Status Code:** `201 Created`

---

### 4. Update a Book
- **Method:** `PUT`
- **Path:** `/api/books/:id`
- **Description:** Updates the entire information record of an existing book identified by its ID.
- **Request Body:**
  ```json
  {
    "title": "The Pragmatic Programmer: 20th Anniversary Edition",
    "author": "David Thomas, Andrew Hunt",
    "isbn": "978-0135957059",
    "publishedYear": 2019,
    "genre": "Computer Science",
    "copiesAvailable": 6
  }
  ```
- **Success Status Code:** `200 OK`

---

### 5. Delete a Book
- **Method:** `DELETE`
- **Path:** `/api/books/:id`
- **Description:** Permanently deletes a book from the library catalog using its ID.
- **Request Body:** None
- **Success Status Code:** `200 OK` (or `204 No Content`)

---

### 6. List Books by Author (Query Parameter)
- **Method:** `GET`
- **Path:** `/api/books?author={authorName}`
- **Description:** Filters and returns all books authored by the specified name provided in the query string.
- **Request Body:** None
- **Success Status Code:** `200 OK`

---

## Standard Error Codes

- **400 Bad Request**
  - **Description:** The server cannot process the request due to a client-side error, such as malformed syntax, missing mandatory fields, or invalid data types.
  - **Example Scenario:** A client sends a `POST /api/books` request where the required `"title"` field is omitted or `"publishedYear"` contains a string value (e.g., `"twenty-twenty"`) instead of an integer.

- **404 Not Found**
  - **Description:** The server cannot find the requested resource because the specified identifier does not exist.
  - **Example Scenario:** A client sends a `GET /api/books/9999` or `DELETE /api/books/9999` request, but no book with ID `9999` exists in the library database.
