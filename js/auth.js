// Configuration
const CONFIG = {
    DOMAIN: 'platform.zone01.gr',
    API_BASE: 'http://localhost:8080', // Go server handles both static files and API proxy
    USE_PROXY: true // Always true since we're using the Go server
};

// DOM Elements
const loginForm = document.getElementById('loginForm');
const identifierInput = document.getElementById('identifier');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');

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
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleLogin();
});

/**
 * Main login function
 */
async function handleLogin() {
    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;

    if (!identifier || !password) {
        showError('Please enter both username/email and password');
        return;
    }

    setLoadingState(true);
    hideError();

    try {
        const credentials = btoa(`${identifier}:${password}`);
        const response = await fetch(`${CONFIG.API_BASE}/api/auth/signin`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            }
        });

        const rawText = await response.text();

        if (!response.ok) {
            console.error('Signin failed', response.status, rawText);
            let errorMsg = 'Invalid credentials. Please try again.';
            if (response.status === 401) errorMsg = 'Invalid username/email or password';
            else if (response.status === 403) errorMsg = 'Access forbidden';
            else if (response.status >= 500) errorMsg = 'Server error. Please try again later';
            showError(errorMsg);
            return;
        }

        // Try to parse JSON first; if it doesn't parse, treat as raw token
        let token = null;
        try {
            const parsed = JSON.parse(rawText);
            // Common property names used by some servers
            token = parsed.token || parsed.jwt || parsed.access_token || parsed.accessToken || null;
            if (!token && typeof parsed === 'string') token = parsed;
        } catch (e) {
            // Not JSON — treat rawText as token string
            token = rawText.trim();
        }

        if (!token) {
            console.error('No token found in response:', rawText);
            showError('Unexpected response from server. Check console for details.');
            return;
        }

        // Basic validation: JWT contains two dots
        if (token.split('.').length !== 3) {
            console.warn('Received token does not look like a JWT. Not storing.', token);
            showError('Received unexpected token format from server.');
            return;
        }

        // Store JWT, decode safely
        localStorage.setItem('jwt', token);
        const userInfo = parseJWT(token);
        if (userInfo && userInfo.sub) {
            localStorage.setItem('userId', userInfo.sub);
        }

        showSuccess('Login successful — redirecting...');
        // Use immediate redirect (no setTimeout loop exposure)
        window.location.href = 'profile.html';
    } catch (error) {
        console.error('Login error', error);
        if (error.message && (error.message.includes('Failed to fetch') || error.name === 'TypeError')) {
            showError('Network/CORS error. Consider using the proxy (see README).');
        } else {
            showError('Unexpected error. Check console.');
        }
    } finally {
        setLoadingState(false);
    }
}


/**
 * Parse JWT token to extract user information
 */
function parseJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error parsing JWT:', error);
        return null;
    }
}

/**
 * Show error message
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

/**
 * Hide error message
 */
function hideError() {
    errorMessage.style.display = 'none';
}

/**
 * Show success message
 */
function showSuccess(message) {
    errorMessage.style.display = 'block';
    errorMessage.style.background = '#d1fae5';
    errorMessage.style.borderColor = '#a7f3d0';
    errorMessage.style.color = '#065f46';
    errorMessage.textContent = message;
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
    } else {
        loginBtn.disabled = false;
        loginBtn.style.display = 'block';
        loading.style.display = 'none';
        identifierInput.disabled = false;
        passwordInput.disabled = false;
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

// Make logout available globally
window.logout = logout;