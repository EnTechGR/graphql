const GRAPHQL_CONFIG = {
    DOMAIN: 'platform.zone01.gr',
    ENDPOINT: 'https://zone01-proxy.onrender.com/api/graphql-engine/v1/graphql',
    USE_PROXY: true
};

async function executeQuery(query, variables = {}) {
    let jwt = localStorage.getItem('jwt');
    
    if (jwt) {
        jwt = jwt.trim();
    }
    
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
                query: query,
                variables: variables
            })
        });

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