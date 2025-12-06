import { 
    clearGraphs, 
    logout 
} from './config.js';
import { 
    renderKeyStats, 
    renderSkills, 
    renderRecentProgress 
} from './statsRendering.js';
import {
    generateProjectXPBarChart,
    generateAuditRatioDonutChart,
    generateProgressAreaChart,
    generateSkillsRadarChart,
    generatePassFailDonutChart
} from './charting.js';


// --- Main Data Loading Function ---
async function loadProfileData() {
    // 1️⃣ Check for JWT token and redirect if not found
    if (!localStorage.getItem('jwt')) {
        console.warn('No JWT found, redirecting to login.');
        logout();
        return;
    }

    let userInfo;
    let userIdInt;
    
    // 2️⃣ Fetch User Info first to get the required userId for parameterized queries
    try {
        // window.GraphQL is assumed to be globally available from an external script
        userInfo = await window.GraphQL.executeQuery(window.GraphQL.queries.GET_USER_INFO);
        const user = userInfo.user?.[0];
        if (!user) {
            throw new Error('User data not found in response.');
        }
        userIdInt = user.id; // Get the user ID
    } catch (error) {
        console.error('Failed to get initial user info:', error.message);
        document.getElementById('userName').textContent = 'Error Loading Profile';
        return;
    }
    
    // 3️⃣ Fetch remaining data concurrently
    try {
        const [auditInfo, xpData, results, progressData, skillRadarData] = await Promise.all([
            window.GraphQL.executeQuery(window.GraphQL.queries.GET_AUDIT_RATIO), 
            window.GraphQL.executeQuery(window.GraphQL.queries.GET_USER_XP),
            window.GraphQL.executeQuery(window.GraphQL.queries.GET_USER_RESULTS),
            window.GraphQL.executeQuery(
                window.GraphQL.queries.GET_USER_PROGRESS_BY_ID,
                { userId: userIdInt }
            ),
            window.GraphQL.executeQuery(
                window.GraphQL.queries.GET_USER_SKILLS_RADAR,
                { userId: userIdInt }
            )
            ]);

        const data = { userInfo, auditInfo, xpData, results, progressData, skillRadarData };
        
        // 4️⃣ Clear graphs container once before appending all graphs
        clearGraphs();

        // 5️⃣ Render all data
        renderKeyStats(data); 
        renderSkills(data); 
        renderRecentProgress(data);
        
        // Render Graphs
        const filter = document.getElementById('progressFilter');
        
        const renderGraphs = () => {
            clearGraphs();
            generateProjectXPBarChart(xpData.transaction); 
            generateAuditRatioDonutChart(auditInfo); 
            generateProgressAreaChart(progressData.progress, filter.value);
            generateSkillsRadarChart(skillRadarData);
            generatePassFailDonutChart(results);
        };
        
        renderGraphs();

        filter.addEventListener('change', renderGraphs);

    } catch (error) {
        console.error('Failed to load profile data:', error.message);

        // Handle expired JWT / unauthorized
        if (error.message.includes('Authentication failed (401)')) {
            alert('Your session has expired. Please log in again.');
            logout();
        } else {
            document.getElementById('userName').textContent = 'Error Loading Data';
        }
    }
}


// Run on page load
window.onload = loadProfileData;