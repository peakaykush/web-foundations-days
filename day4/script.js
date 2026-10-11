// ==========================================
// Element Selectors
// ==========================================
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

// Storage keys
const STORAGE_DRAFT_KEY = "draft";
const STORAGE_THEME_KEY = "theme";

/**
 * Updates character counter, word counter, and warning/over classes.
 */
function updateCounts() {
  const text = noteText.value;
  const numChars = text.length;

  // Character count display
  charCount.textContent = `${numChars} / 200 characters`;

  // Word count display: split on whitespace, count non-empty words
  const trimmed = text.trim();
  const numWords = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
  wordCount.textContent = `${numWords} words`;

  // Warning and over limit classes
  if (numChars > 200) {
    charCount.classList.remove("warning");
    charCount.classList.add("over");
  } else if (numChars > 180) {
    charCount.classList.add("warning");
    charCount.classList.remove("over");
  } else {
    charCount.classList.remove("warning");
    charCount.classList.remove("over");
  }
}

/**
 * Clears the textarea, resets counters, and removes the draft from localStorage.
 */
function clearAll() {
  noteText.value = "";
  localStorage.removeItem(STORAGE_DRAFT_KEY);
  updateCounts();
}

/**
 * Toggles dark mode on body, updates button label, and persists preference.
 */
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  localStorage.setItem(STORAGE_THEME_KEY, isDark ? "dark" : "light");
}

/**
 * Restores saved draft and theme preferences on page load, then initializes counters.
 */
function init() {
  // Restore theme
  const savedTheme = localStorage.getItem(STORAGE_THEME_KEY);
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light mode";
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "Dark mode";
  }

  // Restore draft
  const savedDraft = localStorage.getItem(STORAGE_DRAFT_KEY);
  if (savedDraft !== null) {
    noteText.value = savedDraft;
  }

  // Initial count update
  updateCounts();
}

// ==========================================
// Event Listeners
// ==========================================

// Save draft and update counters on input
noteText.addEventListener("input", () => {
  updateCounts();
  localStorage.setItem(STORAGE_DRAFT_KEY, noteText.value);
});

// Clear button clears everything
clearBtn.addEventListener("click", clearAll);

// Escape key inside textarea clears everything
noteText.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearAll();
  }
});

// Theme toggle button
themeToggle.addEventListener("click", toggleTheme);

// Initialize on page load
init();
