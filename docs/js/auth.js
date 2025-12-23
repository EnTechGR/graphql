// auth.js

// Configuration
const CONFIG = {
    DOMAIN: 'platform.zone01.gr',
    API_BASE: 'https://platform.zone01.gr',
    USE_PROXY: true
};

// ✅ Direct real auth endpoint (no proxy)
const SIGNIN_ENDPOINT = 'https://zone01-proxy.onrender.com/api/auth/signin';

// DOM Elements (using IDs from your index.html)
const loginForm = document.getElementById('loginForm');
const identifierInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
const errorMessage = document.getElementById('error-message');
const loading = null;

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

function setLoadingState(isLoading) {
    if (!loginBtn || !identifierInput || !passwordInput || !errorMessage) return;

    if (isLoading) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing In...';
        identifierInput.disabled = true;
        passwordInput.disabled = true;
        errorMessage.style.display = 'none';
    } else {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
        identifierInput.disabled = false;
        passwordInput.disabled = false;
    }
}

async function handleLogin() {
    setLoadingState(true);
    
    const username = identifierInput.value;
    const password = passwordInput.value;
    
    const credentialsString = `${username}:${password}`;
    let credentials;
    try {
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

    try {
        const response = await fetch(SIGNIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}` 
            }
        });

        const rawResponseText = await response.text();

        if (!response.ok) {
            setLoadingState(false);
            if (response.status === 401) {
                errorMessage.textContent = 'Invalid credentials. Please try again.';
            } else {
                errorMessage.textContent = `Login failed: HTTP status ${response.status}`;
            }
            errorMessage.style.display = 'block';
            return;
        }

        let jwt = null;
        try {
            const parsed = JSON.parse(rawResponseText);
            
            if (typeof parsed === 'string') {
                jwt = parsed;
            } else {
                jwt = parsed.token 
                    || parsed.jwt 
                    || parsed.access_token 
                    || parsed.accessToken 
                    || null;
            }
        } catch (e) {
            jwt = rawResponseText; 
        }

        if (jwt && typeof jwt === 'string') {
            jwt = jwt.trim();
            if ((jwt.startsWith('"') && jwt.endsWith('"')) || 
                (jwt.startsWith("'") && jwt.endsWith("'"))) {
                jwt = jwt.slice(1, -1);
            }
        }
        
        if (!jwt || jwt.length < 10) {
            console.error('Login successful, but no valid JWT found in response.');
            errorMessage.textContent = 'Login successful, but server response was invalid.';
            errorMessage.style.display = 'block';
            setLoadingState(false);
            return;
        }

        localStorage.setItem('jwt', jwt);
        
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

const storedJwt = localStorage.getItem('jwt');
if (storedJwt) {
    const payload = parseJWT(storedJwt);
    let ok = true;
    if (!payload || typeof payload !== 'object') ok = false;
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
        const currentPath = window.location.pathname.split('/').pop();
        const protectedPages = ['profile.html', 'projects.html', 'audits.html', 'events.html']; 
    
        if (!protectedPages.includes(currentPath) && currentPath !== '') {
            console.log('Valid JWT found. Redirecting to profile.html.');
            window.location.href = 'profile.html';
        }
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });
}

function showSuccess(message) {
    if (errorMessage) {
        errorMessage.style.display = 'block';
        errorMessage.style.background = '#d1fae5';
        errorMessage.style.borderColor = '#a7f3d0';
        errorMessage.style.color = '#065f46';
        errorMessage.textContent = message;
    }
}

function logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

window.logout = logout;