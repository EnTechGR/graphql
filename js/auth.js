// auth.js

// Configuration
const CONFIG = {
    DOMAIN: 'platform.zone01.gr',
    API_BASE: 'http://localhost:8080', // Go server handles both static files and API proxy
    USE_PROXY: true // Always true since we're using the Go server
};
const SIGNIN_ENDPOINT = CONFIG.API_BASE + '/api/auth/signin';

// DOM Elements (using IDs from your index.html)
const loginForm = document.getElementById('loginForm');
const identifierInput = document.getElementById('identifier'); // Correct ID from index.html
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage'); // Correct ID from index.html
const loading = document.getElementById('loading');

// Helper to decode Base64 URL parts
function parseJWT(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error parsing JWT:', error);
        return null;
    }
}

/**
 * Set loading state
 */
function setLoadingState(isLoading) {
    if (isLoading) {
        loginBtn.disabled = true;
        loginBtn.style.display = 'none';
        loading.style.display = 'flex';
        identifierInput.disabled = true;
        passwordInput.disabled = true;
        errorMessage.style.display = 'none'; // Clear error on load
    } else {
        loginBtn.disabled = false;
        loginBtn.style.display = 'block';
        loading.style.display = 'none';
        identifierInput.disabled = false;
        passwordInput.disabled = false;
    }
}

/**
 * Login function
 */
async function handleLogin() {
    setLoadingState(true);
    
    const username = identifierInput.value;
    const password = passwordInput.value;
    
    // --- 1. PATCH: Robust Basic Auth Encoding (Fixes InvalidCharacterError) ---
    const credentialsString = `${username}:${password}`;
    let credentials;
    try {
        // Safely encode username:password string using UTF-8 before Base64 encoding.
        const utf8Bytes = new TextEncoder().encode(credentialsString);
        const binaryString = String.fromCodePoint(...utf8Bytes);
        credentials = btoa(binaryString);
    } catch (error) {
        console.error('Encoding error:', error);
        errorMessage.textContent = 'A character encoding error occurred during login.';
        errorMessage.style.display = 'block';
        setLoadingState(false);
        return;
    }
    // --- END PATCH ---

    try {
        const response = await fetch(SIGNIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}` 
            }
        });

        // Read response text once for parsing below
        const rawResponseText = await response.text(); 

        if (!response.ok) {
            setLoadingState(false);
            // Handle error status
            if (response.status === 401) {
                errorMessage.textContent = 'Invalid credentials. Please try again.';
            } else {
                errorMessage.textContent = `Login failed: HTTP status ${response.status}`;
            }
            errorMessage.style.display = 'block';
            return;
        }

        // --- 2. CRITICAL PATCH: Robust JWT Parsing and Quote Removal (Fixes "Not valid base64url") ---
        let jwt = null;
        try {
            const parsed = JSON.parse(rawResponseText);
            
            if (typeof parsed === 'string') {
                // Scenario 1: JWT returned as a raw quoted string, JSON.parse unquotes it.
                jwt = parsed;
            } else {
                // Scenario 2: JWT returned as a JSON object
                jwt = parsed.token 
                    || parsed.jwt 
                    || parsed.access_token 
                    || parsed.accessToken 
                    || null;
            }
        } catch (e) {
            // Scenario 3: Not JSON — treat raw response as the token string.
            jwt = rawResponseText; 
        }

        // Final cleanup: Remove quotes and trim whitespace from the token
        if (jwt && typeof jwt === 'string') {
            jwt = jwt.trim();
            // Remove outer quotes if present (double or single)
            if ((jwt.startsWith('"') && jwt.endsWith('"')) || 
                (jwt.startsWith("'") && jwt.endsWith("'"))) {
                jwt = jwt.slice(1, -1);
            }
        }
        
        // Final check that a clean token was acquired
        if (!jwt || jwt.length < 10) { // Check for minimal JWT length
            console.error('Login successful, but no valid JWT found in response.');
            errorMessage.textContent = 'Login successful, but server response was invalid.';
            errorMessage.style.display = 'block';
            setLoadingState(false);
            return;
        }
        // --- END CRITICAL PATCH ---


        // Store the clean JWT and redirect
        localStorage.setItem('jwt', jwt);
        
        // Attempt to extract userId and store it (for queries using $userId)
        const payload = parseJWT(jwt);
        if (payload && payload['https://hasura.io/jwt/claims'] && payload['https://hasura.io/jwt/claims']['x-hasura-user-id']) {
            localStorage.setItem('userId', payload['https://hasura.io/jwt/claims']['x-hasura-user-id']);
        }

        showSuccess('Login successful. Redirecting...');
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 100);

    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'A network error occurred. Check the server connection.';
        errorMessage.style.display = 'block';
    } finally {
        setLoadingState(false);
    }
}

// Check if user is already logged in
// Check stored JWT and validate minimal structure + expiry (if present)
const storedJwt = localStorage.getItem('jwt');
if (storedJwt) {
    const payload = parseJWT(storedJwt);
    let ok = true;
    if (!payload || typeof payload !== 'object') ok = false;
    // If token has exp, check if expired
    if (ok && payload.exp) {
        const nowSec = Math.floor(Date.now() / 1000);
        if (payload.exp <= nowSec) {
            ok = false;
            console.log('Stored JWT expired, removing it.');
            localStorage.removeItem('jwt');
            localStorage.removeItem('userId');
        }
    }
    if (ok) {
        // token seems valid-ish: go to profile
        window.location.href = 'profile.html';
    }
}

// Handle form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });
}

/**
 * Show error message
 */
function showSuccess(message) {
    if (errorMessage) {
        errorMessage.style.display = 'block';
        errorMessage.style.background = '#d1fae5';
        errorMessage.style.borderColor = '#a7f3d0';
        errorMessage.style.color = '#065f46';
        errorMessage.textContent = message;
    }
}

/**
 * Logout function (can be called from profile page)
 */
function logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

window.logout = logout;