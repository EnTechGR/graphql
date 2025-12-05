// Check if user is authenticated
if (!localStorage.getItem('jwt')) {
    window.location.href = 'index.html';
}

// Initialize profile on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadProfile();
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Failed to load profile. You may need to log in again.');
        logout();
    }
});

/**
 * Load and display user profile data
 */
async function loadProfile() {
    try {
        // Load basic user info
        await loadUserInfo();
        
        // Load XP data
        await loadXPData();
        
        // Load audit ratio
        await loadAuditRatio();
        
        // Load project stats
        await loadProjectStats();
        
        console.log('Profile loaded successfully');
    } catch (error) {
        console.error('Error in loadProfile:', error);
        throw error;
    }
}

/**
 * Load basic user information
 */
async function loadUserInfo() {
    const data = await window.GraphQL.executeQuery(
        window.GraphQL.queries.GET_USER_INFO
    );
    
    if (data && data.user && data.user.length > 0) {
        const user = data.user[0];
        document.getElementById('userName').textContent = user.login;
        document.getElementById('userId').textContent = `ID: ${user.id}`;
    }
}

/**
 * Load and calculate total XP
 */
async function loadXPData() {
    const data = await window.GraphQL.executeQuery(
        window.GraphQL.queries.GET_USER_XP
    );
    
    if (data && data.transaction) {
        // Calculate total XP
        const totalXP = data.transaction.reduce((sum, t) => sum + t.amount, 0);
        
        // Display total XP with formatting
        document.getElementById('totalXP').textContent = formatNumber(totalXP);
        
        console.log(`Total XP: ${totalXP} (from ${data.transaction.length} transactions)`);
    }
}

/**
 * Load audit ratio
 */
async function loadAuditRatio() {
    const data = await window.GraphQL.executeQuery(
        window.GraphQL.queries.GET_AUDIT_RATIO
    );
    
    if (data && data.user && data.user.length > 0) {
        const user = data.user[0];
        const ratio = user.auditRatio || 0;
        
        document.getElementById('auditRatio').textContent = ratio.toFixed(2);
        
        console.log(`Audit Ratio: ${ratio.toFixed(2)}`);
        console.log(`Total Up: ${user.totalUp || 0}, Total Down: ${user.totalDown || 0}`);
    }
}

/**
 * Load project statistics
 */
async function loadProjectStats() {
    const data = await window.GraphQL.executeQuery(
        window.GraphQL.queries.GET_USER_RESULTS
    );
    
    if (data && data.result) {
        // Count projects (type = project)
        const projects = data.result.filter(r => {
            return r.object && r.object.type === 'project';
        });
        
        // Count passed projects (grade = 1)
        const passedProjects = projects.filter(p => p.grade === 1).length;
        
        document.getElementById('projectsCompleted').textContent = passedProjects;
        
        console.log(`Projects: ${passedProjects} passed out of ${projects.length} total`);
    }
}

/**
 * Format large numbers with commas
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}