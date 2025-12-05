// GraphQL Query Module

const GRAPHQL_ENDPOINT = "/api/graphql";

/**
 * Execute a GraphQL query
 */
async function executeQuery(query, variables = {}) {
  try {
    const headers = getAuthHeaders();

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        query: query,
        variables: variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      throw new Error(data.errors[0].message || "GraphQL query failed");
    }

    return data.data;
  } catch (error) {
    console.error("Query error:", error);
    throw error;
  }
}

/**
 * Get user information
 */
async function getUserInfo() {
  const query = `
        query {
            user {
                id
                login
            }
        }
    `;

  const data = await executeQuery(query);
  return data.user ? data.user[0] : null;
}

/**
 * Get total XP for the user
 */
async function getTotalXP() {
  const query = `
        query {
            transaction(where: {type: {_eq: "xp"}}) {
                amount
            }
        }
    `;

  const data = await executeQuery(query);
  if (!data.transaction) return 0;

  return data.transaction.reduce((total, tx) => total + tx.amount, 0);
}

/**
 * Get XP transactions over time (for charting)
 */
async function getXPOverTime() {
  const query = `
        query {
            transaction(
                where: {type: {_eq: "xp"}}
                order_by: [{createdAt: asc}]
            ) {
                amount
                createdAt
                path
            }
        }
    `;

  const data = await executeQuery(query);
  return data.transaction || [];
}

/**
 * Get user grades and progress
 */
async function getUserGrades() {
  const query = `
        query {
            progress(order_by: [{createdAt: desc}], limit: 10) {
                grade
                objectId
                createdAt
                object {
                    name
                }
            }
        }
    `;

  const data = await executeQuery(query);
  return data.progress || [];
}

/**
 * Get project results (pass/fail)
 */
async function getProjectResults() {
  const query = `
        query {
            result(order_by: [{createdAt: desc}], limit: 100) {
                id
                grade
                objectId
                createdAt
                object {
                    name
                    type
                }
            }
        }
    `;

  const data = await executeQuery(query);
  return data.result || [];
}

/**
 * Get audit ratio (audits done vs audits received)
 */
async function getAuditRatio() {
  const query = `
        query {
            transaction(
                where: {type: {_eq: "audit"}}
            ) {
                amount
            }
        }
    `;

  const data = await executeQuery(query);
  if (!data.transaction) return 0;

  return data.transaction.reduce((total, tx) => total + tx.amount, 0);
}

/**
 * Get user's skill information if available
 */
async function getUserSkills() {
  const query = `
        query {
            skillType {
                skillTypeId
                skillTypeName
            }
            userSkill(order_by: [{skillId: desc}]) {
                skillId
                skillName
                skillLevel
            }
        }
    `;

  try {
    const data = await executeQuery(query);
    return {
      skillTypes: data.skillType || [],
      userSkills: data.userSkill || [],
    };
  } catch (error) {
    console.warn("Skills query not available:", error);
    return { skillTypes: [], userSkills: [] };
  }
}
