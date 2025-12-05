// GraphQL API Configuration
const GRAPHQL_CONFIG = {
    DOMAIN: 'platform.zone01.gr',
    ENDPOINT: 'http://localhost:8080/api/graphql-engine/v1/graphql', // Go server handles API proxy
    USE_PROXY: true // Always true since we're using the Go server
};

/**
 * Execute a GraphQL query
 * @param {string} query - The GraphQL query string
 * @param {object} variables - Variables for the query (optional)
 * @returns {Promise<object>} - The query result
 */
async function executeQuery(query, variables = {}) {
    let jwt = localStorage.getItem('jwt'); // Use 'let'
    
    // CRITICAL FIX
    if (jwt) {
        jwt = jwt.trim(); // Trim token before use
    }
    // END CRITICAL FIX
    
    console.log('=== GraphQL Query Debug ===');
    console.log('Endpoint:', GRAPHQL_CONFIG.ENDPOINT);
    console.log('JWT exists:', !!jwt);
    console.log('JWT preview:', jwt ? jwt.substring(0, 30) + '...' : 'none');
    
    if (!jwt) {
        console.error('No JWT token found');
        window.location.href = 'index.html';
        return null;
    }
    
    try {
        console.log('Making GraphQL request...');
        console.log('Query:', query.substring(0, 100) + '...');
        
        const response = await fetch(GRAPHQL_CONFIG.ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // IMPORTANT: The Go server should handle adding the JWT to X-Hasura-Admin-Secret header
                'Authorization': `Bearer ${jwt}` 
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        });

        // The Go server handles the proxy logic, so we look for standard HTTP errors first.
        if (response.status === 401) {
             throw new Error('Authentication failed (401). JWT is invalid or expired.');
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GraphQL request failed with status ${response.status}: ${errorText}`);
        }

        const json = await response.json();
        
        if (json.errors) {
            console.error('GraphQL errors:', json.errors);
            throw new Error(`GraphQL Errors: ${json.errors.map(e => e.message).join('; ')}`);
        }
        
        console.log('GraphQL request successful.');
        return json.data;

    } catch (error) {
        console.error('Error executing GraphQL query:', error);
        throw error;
    }
}

// Get user info, campus, and skills (via attrs)
const GET_USER_INFO = `
    query {
        user {
            id
            login
            campus
            createdAt
            attrs # Fetches user attributes, assumed to contain skill data
        }
    }
`;

// Get user XP transactions
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

// Get user audit information (Audits)
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

// Get results (pass/fail)
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

// Get user progress by ID (Grades)
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
        GET_USER_SKILLS_RADAR
    }
};