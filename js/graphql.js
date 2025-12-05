// GraphQL API Configuration
const GRAPHQL_CONFIG = {
    DOMAIN: 'platform.zone01.gr', // Your school domain
    ENDPOINT: '', // Will be set dynamically
    USE_PROXY: true // PROXY ENABLED - proxy server must be running on port 8080
};

// Set GraphQL endpoint
GRAPHQL_CONFIG.ENDPOINT = GRAPHQL_CONFIG.USE_PROXY 
    ? 'http://localhost:8080/api/graphql-engine/v1/graphql'
    : `https://${GRAPHQL_CONFIG.DOMAIN}/api/graphql-engine/v1/graphql`;

/**
 * Execute a GraphQL query
 * @param {string} query - The GraphQL query string
 * @param {object} variables - Variables for the query (optional)
 * @returns {Promise<object>} - The query result
 */
async function executeQuery(query, variables = {}) {
    const jwt = localStorage.getItem('jwt');
    
    if (!jwt) {
        console.error('No JWT token found');
        window.location.href = 'index.html';
        return null;
    }
    
    try {
        const response = await fetch(GRAPHQL_CONFIG.ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt}`
            },
            body: JSON.stringify({
                query,
                variables
            })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                console.error('Authentication failed');
                localStorage.removeItem('jwt');
                window.location.href = 'index.html';
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            throw new Error(result.errors[0].message);
        }
        
        return result.data;
        
    } catch (error) {
        console.error('Query execution error:', error);
        
        // Check for CORS issues
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            console.error('CORS Error detected. To fix this:');
            console.error('1. Set GRAPHQL_CONFIG.USE_PROXY = true in graphql.js');
            console.error('2. Run the Go proxy server from the proxy/ folder');
            console.error('3. See README.md for proxy setup instructions');
        }
        
        throw error;
    }
}

/**
 * Example Queries (to be used in profile.js)
 */

// Get basic user information
const GET_USER_INFO = `
    query {
        user {
            id
            login
        }
    }
`;

// Get user XP transactions
const GET_USER_XP = `
    query {
        transaction(
            where: { type: { _eq: "xp" } }
            order_by: { createdAt: asc }
        ) {
            id
            amount
            createdAt
            path
            object {
                name
                type
            }
        }
    }
`;

// Get user audit information
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

// Get user progress
const GET_USER_PROGRESS = `
    query {
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

// Export queries for use in other files
window.GraphQL = {
    executeQuery,
    queries: {
        GET_USER_INFO,
        GET_USER_XP,
        GET_AUDIT_RATIO,
        GET_USER_PROGRESS,
        GET_USER_RESULTS
    }
};