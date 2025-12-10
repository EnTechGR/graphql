// docs/js/api.js

const API_CONFIG = {
  // Same-origin now that Go serves frontend + API
  SIGNIN_ENDPOINT: "/signin",
};

function buildBasicToken(identifier, password) {
  const raw = `${identifier}:${password}`;
  return btoa(raw);
}

/**
 * Sign in via proxy, store JWT in localStorage
 * identifier can be username OR email
 */
async function signin(identifier, password) {
  const basic = buildBasicToken(identifier, password);

  const response = await fetch(API_CONFIG.SIGNIN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
    },
  });

  if (response.status === 401) {
    throw new Error("Invalid credentials.");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Signin failed: ${response.status} ${text}`);
  }

  const raw = await response.text();
  let token = raw.trim();

  // Try to be smart: handle JSON or quoted strings
  try {
    const parsed = JSON.parse(raw);

    // Case 1: body is just a JSON string: "eyJ..."
    if (typeof parsed === "string") {
      token = parsed;
    }

    // Case 2: body is an object like { token: "..."} or { jwt: "..." }
    if (parsed && typeof parsed === "object") {
      if (parsed.token) {
        token = parsed.token;
      } else if (parsed.jwt) {
        token = parsed.jwt;
      }
    }
  } catch (_) {
    // raw is not JSON, ignore and keep token as trimmed text
  }

  // Extra safety: strip wrapping quotes if still present
  if (token.startsWith('"') && token.endsWith('"')) {
    token = token.slice(1, -1);
  }

  token = token.trim();

  console.log("=== Signin Debug ===");
  console.log("Raw response:", raw);
  console.log("Final JWT to store:", token.substring(0, 30) + "...");

  if (!token || token.split(".").length < 3) {
    console.warn("Token does not look like a valid JWT:", token);
  }

  localStorage.setItem("jwt", token);
  return token;
}

/**
 * Clear JWT and log out
 */
function logout() {
  localStorage.removeItem("jwt");
  window.location.href = "index.html";
}

window.API = {
  signin,
  logout,
};