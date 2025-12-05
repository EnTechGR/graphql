// Main Application Module

// DOM Elements
const loginContainer = document.getElementById("loginContainer");
const profileContainer = document.getElementById("profileContainer");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");
const loginError = document.getElementById("loginError");

// Event Listeners
loginForm.addEventListener("submit", handleLogin);
logoutBtn.addEventListener("click", handleLogout);

/**
 * Handle login form submission
 */
async function handleLogin(e) {
  e.preventDefault();

  const credential = document.getElementById("credential").value;
  const password = document.getElementById("password").value;

  // Clear previous errors
  loginError.style.display = "none";
  loginError.textContent = "";

  try {
    // Show loading state
    const submitBtn = loginForm.querySelector("button");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Logging in...";
    submitBtn.disabled = true;

    // Attempt login
    await login(credential, password);

    // Load profile data
    await loadProfileData();

    // Switch to profile view
    loginContainer.style.display = "none";
    profileContainer.style.display = "block";

    // Reset form
    loginForm.reset();
  } catch (error) {
    // Show error message
    loginError.textContent = error.message || "Login failed. Please try again.";
    loginError.style.display = "block";

    // Reset button
    const submitBtn = loginForm.querySelector("button");
    submitBtn.textContent = "Login";
    submitBtn.disabled = false;
  }
}

/**
 * Handle logout
 */
function handleLogout() {
  logout();
  loginContainer.style.display = "flex";
  profileContainer.style.display = "none";
  loginForm.reset();
  loginError.style.display = "none";
}

/**
 * Load and display profile data
 */
async function loadProfileData() {
  try {
    // Fetch data
    const [userInfo, totalXP, grades, results, auditRatio, xpTransactions] =
      await Promise.all([
        getUserInfo(),
        getTotalXP(),
        getUserGrades(),
        getProjectResults(),
        getAuditRatio(),
        getXPOverTime(),
      ]);

    // Update user info
    if (userInfo) {
      document.getElementById("userLogin").textContent = userInfo.login || "-";
    }

    document.getElementById("totalXP").textContent = formatNumber(totalXP);

    // Get average grade
    if (grades.length > 0) {
      const avgGrade = (
        grades.reduce((sum, g) => sum + g.grade, 0) / grades.length
      ).toFixed(2);
      document.getElementById("userGrade").textContent = avgGrade;
    } else {
      document.getElementById("userGrade").textContent = "-";
    }

    // Format audit ratio
    document.getElementById("auditRatio").textContent =
      (auditRatio / 100).toFixed(2) || "-";

    // Draw charts
    if (xpTransactions.length > 0) {
      drawXPChart("xpChart", xpTransactions);
    }

    if (results.length > 0) {
      drawPassFailChart("passFailChart", results);
    }

    console.log("Profile data loaded successfully");
  } catch (error) {
    console.error("Error loading profile data:", error);
    alert("Error loading profile data. Please refresh the page.");
  }
}

/**
 * Format large numbers (utility)
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

/**
 * Check if user is already logged in
 */
function initializeApp() {
  if (isAuthenticated()) {
    // Show profile page
    loginContainer.style.display = "none";
    profileContainer.style.display = "block";
    loadProfileData();
  } else {
    // Show login page
    loginContainer.style.display = "flex";
    profileContainer.style.display = "none";
  }
}

// Initialize app on load
document.addEventListener("DOMContentLoaded", initializeApp);
