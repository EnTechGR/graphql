// Configuration - Replace with your actual domain
const CONFIG = {
    DOMAIN: 'platform.zone01.gr', // Your school domain
    API_BASE: '', // Will be set dynamically
    USE_PROXY: true // PROXY ENABLED - proxy server must be running on port 8080
};

// Set API base URL
CONFIG.API_BASE = CONFIG.USE_PROXY 
    ? 'http://localhost:8080' 
    : `https://${CONFIG.DOMAIN}`;

// DOM Elements
const loginForm = document.getElementById('loginForm');
const identifierInput = document.getElementById('identifier');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');

// Check if user is already logged in
if (localStorage.getItem('jwt')) {
    window.location.href = 'profile.html';
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
    
    // Show loading state
    setLoadingState(true);
    hideError();
    
    try {
        // Create credentials for Basic authentication
        const credentials = btoa(`${identifier}:${password}`);
        
        // Make login request
        const response = await fetch(`${CONFIG.API_BASE}/api/auth/signin`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });
        
        // Handle response
        if (response.ok) {
            const jwt = await response.text(); // JWT is returned as plain text
            
            // Store JWT in localStorage
            localStorage.setItem('jwt', jwt);
            
            // Decode and store user info (optional)
            const userInfo = parseJWT(jwt);
            if (userInfo) {
                localStorage.setItem('userId', userInfo.sub);
            }
            
            // Show success and redirect
            showSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 500);
            
        } else {
            // Handle error responses
            let errorMsg = 'Invalid credentials. Please try again.';
            
            if (response.status === 401) {
                errorMsg = 'Invalid username/email or password';
            } else if (response.status === 403) {
                errorMsg = 'Access forbidden';
            } else if (response.status >= 500) {
                errorMsg = 'Server error. Please try again later';
            }
            
            showError(errorMsg);
        }
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Check if it's a CORS error
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            showError(
                'Connection error. This might be a CORS issue. ' +
                'You may need to use the Go proxy server. Check the console for details.'
            );
            console.log('CORS Error detected. To fix this:');
            console.log('1. Set CONFIG.USE_PROXY = true in auth.js');
            console.log('2. Run the Go proxy server from the proxy/ folder');
            console.log('3. See README.md for proxy setup instructions');
        } else {
            showError('An unexpected error occurred. Please try again.');
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