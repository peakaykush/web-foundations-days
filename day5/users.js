// ==========================================
// DOM Element Selectors
// ==========================================
const loadUsersBtn = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusEl = document.getElementById("status");
const usersList = document.getElementById("users-list");

// Stored users array
let users = [];

/**
 * Renders an array of user objects to the DOM using createElement and textContent.
 * @param {Array<object>} list - Array of user objects to display.
 */
function renderUsers(list) {
  // Clear the existing list content
  usersList.textContent = "";

  // Show friendly message if no users match
  if (!list || list.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "empty-message";
    emptyLi.textContent = "No users match your filter.";
    usersList.appendChild(emptyLi);
    return;
  }

  // Build a card for each user
  list.forEach((user) => {
    const li = document.createElement("li");
    li.className = "user-card";

    // User Name
    const nameEl = document.createElement("h3");
    nameEl.className = "user-name";
    nameEl.textContent = user.name;

    // Details container
    const detailsDiv = document.createElement("div");
    detailsDiv.className = "user-details";

    // Email
    const emailEl = document.createElement("p");
    emailEl.className = "user-detail-item";
    emailEl.textContent = `Email: ${user.email}`;

    // City
    const cityEl = document.createElement("p");
    cityEl.className = "user-detail-item";
    const city = user.address && user.address.city ? user.address.city : "N/A";
    cityEl.textContent = `City: ${city}`;

    // Company Name
    const companyEl = document.createElement("p");
    companyEl.className = "user-detail-item";
    const companyName = user.company && user.company.name ? user.company.name : "N/A";
    companyEl.textContent = `Company: ${companyName}`;

    // Assemble elements
    detailsDiv.appendChild(emailEl);
    detailsDiv.appendChild(cityEl);
    detailsDiv.appendChild(companyEl);

    li.appendChild(nameEl);
    li.appendChild(detailsDiv);

    usersList.appendChild(li);
  });
}

/**
 * Asynchronously fetches users from JSONPlaceholder, updates status messages,
 * and manages button state.
 */
async function loadUsers() {
  // Disable button and display loading status
  loadUsersBtn.disabled = true;
  statusEl.textContent = "Loading users...";
  statusEl.className = "loading";

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    users = data;

    // Apply any active filter when rendering
    const query = filterInput.value.trim().toLowerCase();
    const visibleUsers = query
      ? users.filter((user) => user.name.toLowerCase().includes(query))
      : users;

    renderUsers(visibleUsers);

    statusEl.textContent = `Successfully loaded ${users.length} users.`;
    statusEl.className = "success";
  } catch (error) {
    statusEl.textContent = `Failed to load users: ${error.message}`;
    statusEl.className = "error";
    usersList.textContent = "";
  } finally {
    // Re-enable button in finally block
    loadUsersBtn.disabled = false;
  }
}

// ==========================================
// Event Listeners
// ==========================================

// Load users on button click
loadUsersBtn.addEventListener("click", loadUsers);

// Filter users locally without making a new network request
filterInput.addEventListener("input", () => {
  const query = filterInput.value.trim().toLowerCase();
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(query)
  );
  renderUsers(filteredUsers);
});
