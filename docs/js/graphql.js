// docs/js/graphql.js

// GraphQL API Configuration
const GRAPHQL_CONFIG = {
  DOMAIN: "platform.zone01.gr",
  // We send all GraphQL requests to our own Go proxy
  ENDPOINT: "/graphql",
  USE_PROXY: true,
};

/**
 * Execute a GraphQL query
 * @param {string} query - The GraphQL query string
 * @param {object} variables - Variables for the query (optional)
 * @returns {Promise<object|null>} - The query result (data) or null if redirected
 */
async function executeQuery(query, variables = {}) {
  let jwt = localStorage.getItem("jwt");

  // Avoid issues with accidental whitespace
  if (jwt) {
    jwt = jwt.trim();
  }

  console.log("=== GraphQL Query Debug ===");
  console.log("Endpoint:", GRAPHQL_CONFIG.ENDPOINT);
  console.log("JWT exists:", !!jwt);
  console.log("JWT preview:", jwt ? jwt.substring(0, 30) + "..." : "none");

  if (!jwt) {
    console.error("No JWT token found; redirecting to login");
    window.location.href = "index.html";
    return null;
  }

  try {
    console.log("Making GraphQL request...");
    console.log("Query (first 100 chars):", query.substring(0, 100) + "...");

    const response = await fetch(GRAPHQL_CONFIG.ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    // Auth error – token invalid / expired
    if (response.status === 401) {
      console.error("Authentication failed (401). JWT invalid or expired.");
      localStorage.removeItem("jwt");
      window.location.href = "index.html";
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GraphQL request failed with status ${response.status}: ${errorText}`,
      );
    }

    const json = await response.json();

    if (json.errors) {
      console.error("GraphQL errors:", json.errors);
      const msg = json.errors.map((e) => e.message).join("; ");
      throw new Error(`GraphQL Errors: ${msg}`);
    }

    console.log("GraphQL request successful.");
    return json.data;
  } catch (error) {
    console.error("Error executing GraphQL query:", error);
    throw error;
  }
}

/* =======================
 *  GraphQL QUERIES
 * ======================= */

/**
 * Basic user info (simple query)
 * - You can use attrs to extract more info (skills etc.) later.
 */
const GET_USER_INFO = `
  query {
    user {
      id
      login
      campus
      createdAt
      attrs
    }
  }
`;

/**
 * XP transactions for the authenticated user.
 * Uses nested object to grab project/module/piscine info.
 */
const GET_USER_XP = `
  query {
    transaction(
      where: {
        type: { _eq: "xp" }
        _or: [
          { object: { type: { _eq: "project" } } }
          { object: { type: { _eq: "module" } } }
          { object: { type: { _eq: "piscine" } } }
        ]
      }
      order_by: { createdAt: desc }
    ) {
      id
      amount
      createdAt
      object {
        name
        type
      }
    }
  }
`;

/**
 * Audit ratio (nested inside user)
 */
const GET_AUDIT_RATIO = `
  query {
    user {
      id
      login
      auditRatio
      totalUp
      totalDown
    }
  }
`;

/**
 * Result history (pass/fail)
 * Good for pass/fail ratio and recent attempts.
 */
const GET_USER_RESULTS = `
  query {
    result(
      order_by: { createdAt: desc }
    ) {
      id
      grade
      type
      path
      createdAt
      object {
        name
        type
      }
    }
  }
`;

/**
 * Progress per object for a specific user
 * (uses arguments: $userId)
 */
const GET_USER_PROGRESS_BY_ID = `
  query ($userId: Int!) {
    progress(
      where: { userId: { _eq: $userId } }
      order_by: { createdAt: desc }
    ) {
      id
      grade
      createdAt
      path
      object {
        name
        type
      }
    }
  }
`;

/**
 * Skills for a radar chart
 * - Uses user_by_pk and filters transactions where type starts with "skill_"
 * - This is a nice example of nested + arguments together.
 */
const GET_USER_SKILLS_RADAR = `
  query ($userId: Int!) {
    user: user_by_pk(id: $userId) {
      id
      login
      transactions(
        order_by: [{ type: asc }]
        where: {
          userId: { _eq: $userId }
          type: { _like: "skill_%" }
        }
      ) {
        type
        amount
      }
    }
  }
`;

// Export queries for use in other files
window.GraphQL = {
  executeQuery,
  queries: {
    GET_USER_INFO,
    GET_USER_XP,
    GET_AUDIT_RATIO,
    GET_USER_RESULTS,
    GET_USER_PROGRESS_BY_ID,
    GET_USER_SKILLS_RADAR,
  },
};