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
                'Authorization': `Bearer ${jwt}`
            },
            body: JSON.stringify({
                query,
                variables
            })
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            const responseText = await response.text();
            console.error('Response error body:', responseText);
            
            if (response.status === 401) {
                console.error('Authentication failed - 401 Unauthorized');
                console.error('This usually means the JWT token is invalid or expired');
                throw new Error('Authentication failed (401)');
            }
            throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
        }
        
        const result = await response.json();
        console.log('GraphQL response received:', result);
        
        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            throw new Error(result.errors[0].message);
        }
        
        console.log('Query successful!');
        return result.data;
        
    } catch (error) {
        console.error('=== Query Execution Error ===');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            console.error('CORS/Network Error detected!');
            console.error('Possible issues:');
            console.error('1. Server not running');
            console.error('2. Wrong endpoint URL');
            console.error('3. Network connectivity issue');
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
