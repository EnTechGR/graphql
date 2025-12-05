// Authentication Module

const API_DOMAIN = "https://platform.zone01.gr";

/**
 * Encode credentials to base64 for Basic Auth
 */
function encodeCredentials(username, password) {
  return btoa(`${username}:${password}`);
}

/**
 * Decode JWT to get user information (without verification)
 */
function decodeJWT(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

/**
 * Login with username/email and password
 */
async function login(credential, password) {
  try {
    const encodedCredentials = encodeCredentials(credential, password);

    const response = await fetch(`/api/auth/signin`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        "Invalid credentials. Please check your username/email and password."
      );
    }

    const data = await response.json();
    const token = data.token || data.access_token || data;

    // Store JWT in localStorage
    localStorage.setItem("jwt_token", token);

    // Decode and store user info
    const userInfo = decodeJWT(token);
    if (userInfo) {
      localStorage.setItem("user_id", userInfo.sub || userInfo.id);
    }

    return token;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

/**
 * Logout - clear stored token and user data
 */
function logout() {
  localStorage.removeItem("jwt_token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_data");
}

/**
 * Get stored JWT token
 */
function getToken() {
  return localStorage.getItem("jwt_token");
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return !!getToken();
}

/**
 * Get authorization header for GraphQL queries
 */
function getAuthHeaders() {
  const token = getToken();
  if (!token) {
    throw new Error("No authentication token found");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
