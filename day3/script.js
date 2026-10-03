// Starting notes data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

/**
 * Searches notes whose text contains the given word (case-insensitive).
 * Uses filter, toLowerCase, and includes.
 * @param {string} word - The search term.
 * @returns {Array<object>} - Array of matching notes.
 */
function searchNotes(word) {
  const lowerWord = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(lowerWord));
}

/**
 * Finds the note with the most characters.
 * Handles the empty array first, then compares lengths.
 * @returns {object|null} - Longest note object or null if empty.
 */
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }
  return longest;
}

/**
 * Counts the number of notes per category.
 * Loops over the notes and increments a counter in an object.
 * @returns {object} - Object with category counts, e.g. { personal: 2, work: 1, study: 2 }.
 */
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  }
  return counts;
}

/**
 * Generates a summary sentence of the notes.
 * Uses countByCategory and a template literal.
 * Uses "note" for exactly one note and "notes" otherwise.
 * @returns {string} - Summary sentence, e.g. "5 notes: 2 personal, 1 work, 2 study."
 */
function getSummary() {
  const total = notes.length;
  const noteWord = total === 1 ? "note" : "notes";
  const counts = countByCategory();

  const standardOrder = ["personal", "work", "study"];
  const allCategories = [
    ...standardOrder.filter((cat) => cat in counts),
    ...Object.keys(counts).filter((cat) => !standardOrder.includes(cat)),
  ];

  const breakdown = allCategories
    .filter((cat) => counts[cat] > 0)
    .map((cat) => `${counts[cat]} ${cat}`)
    .join(", ");

  if (!breakdown) {
    return `${total} ${noteWord}.`;
  }

  return `${total} ${noteWord}: ${breakdown}.`;
}

/**
 * Checks if a note with the same text already exists (ignoring case and extra spaces).
 * Uses some and compares trimmed lower-case text.
 * @param {string} text - Note text to check.
 * @returns {boolean} - True if duplicate exists, false otherwise.
 */
function isDuplicate(text) {
  if (typeof text !== "string") {
    return false;
  }
  const cleanText = text.trim().toLowerCase();
  return notes.some((note) => note.text.trim().toLowerCase() === cleanText);
}

/**
 * Adds a new note if it meets all validation criteria:
 * - text length is 1–200 characters
 * - text is not a duplicate
 * - category is one of personal, work, or study
 * Logs the reason if validation fails.
 * @param {string} text - Note text.
 * @param {string} category - Category name.
 * @returns {boolean} - True if added, false otherwise.
 */
function addNote(text, category) {
  if (typeof text !== "string" || text.trim().length < 1 || text.length > 200) {
    console.log("Failed to add note: text must be between 1 and 200 characters.");
    return false;
  }

  const validCategories = ["personal", "work", "study"];
  if (!validCategories.includes(category)) {
    console.log(`Failed to add note: category must be one of "personal", "work", or "study". Received: "${category}".`);
    return false;
  }

  if (isDuplicate(text)) {
    console.log(`Failed to add note: a note with the text "${text.trim()}" already exists.`);
    return false;
  }

  const nextId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1;
  notes.push({ id: nextId, text: text.trim(), category });
  return true;
}

// ==========================================
// Tests
// ==========================================

console.log("--- Testing searchNotes ---");
// Normal case: finding notes containing "javascript" (case-insensitive)
console.log(searchNotes("javascript")); // Expected: [ { id: 4, text: 'Revise JavaScript arrays', category: 'study' } ]
// Edge case: search word not found in any note
console.log(searchNotes("gym")); // Expected: []

console.log("\n--- Testing longestNote ---");
// Normal case: finding longest note among starting notes
console.log(longestNote()); // Expected: { id: 3, text: 'Email the project report to Grace', category: 'work' }
// Edge case: empty notes array returns null
const savedNotes = [...notes];
notes = [];
console.log(longestNote()); // Expected: null
notes = [...savedNotes];

console.log("\n--- Testing countByCategory ---");
// Normal case: counting notes by category
console.log(countByCategory()); // Expected: { personal: 2, study: 2, work: 1 }
// Edge case: empty notes array returns empty object
notes = [];
console.log(countByCategory()); // Expected: {}
notes = [...savedNotes];

console.log("\n--- Testing getSummary ---");
// Normal case: summary of starting notes
console.log(getSummary()); // Expected: "5 notes: 2 personal, 1 work, 2 study."
// Edge case: exactly one note uses the singular word "note"
notes = [{ id: 1, text: "Buy milk", category: "personal" }];
console.log(getSummary()); // Expected: "1 note: 1 personal."
notes = [...savedNotes];

console.log("\n--- Testing isDuplicate ---");
// Normal case: checks existing text
console.log(isDuplicate("Call mum")); // Expected: true
// Edge case: checks text ignoring surrounding whitespace and mixed case
console.log(isDuplicate("   cAlL MUM   ")); // Expected: true
// Normal case / Edge case: non-duplicate text returns false
console.log(isDuplicate("Organize desk")); // Expected: false

console.log("\n--- Testing addNote ---");
// Normal case: successfully adding a new valid note
console.log(addNote("Organize desk", "personal")); // Expected: true
// Edge case: duplicate note with extra whitespace and different casing (fails and logs reason)
console.log(addNote("  buy Milk and Bread  ", "personal")); // Expected: false
// Edge case: invalid category (fails and logs reason)
console.log(addNote("Cook dinner", "cooking")); // Expected: false
// Edge case: empty text (fails and logs reason)
console.log(addNote("", "work")); // Expected: false
// Edge case: text exceeding 200 characters (fails and logs reason)
console.log(addNote("x".repeat(201), "study")); // Expected: false
