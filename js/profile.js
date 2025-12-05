// profile.js

// Function to handle logout (referenced in profile.html)
function logout() {
    console.log("Logging out...");
    localStorage.removeItem('jwt');
    // Assuming 'index.html' is your login page
    window.location.href = 'index.html';
}

/**
 * Renders the basic user identification and key metrics.
 * @param {object} data - The data object containing user, audit, and XP info.
 */
function renderKeyStats(data) {
    const { userInfo, auditInfo, xpData } = data;

    // 1. Basic User Identification (using nested query data)
    const user = userInfo.user[0]; // user query returns an array
    if (user) {
        document.getElementById('userName').textContent = user.login;
        document.getElementById('userId').textContent = `ID: ${user.id}`;
    }

    // 2. XP Amount (by summing all transactions)
    let totalXP = 0;
    if (xpData && xpData.transaction) {
        xpData.transaction.forEach(t => {
            totalXP += t.amount;
        });
        document.getElementById('totalXP').textContent = `${(totalXP / 1000).toFixed(1)} kB`; // Convert to kB for cleaner display
    }

    // 3. Audit Ratio (using nested query data)
    const auditUser = auditInfo.user[0]; // user query returns an array
    if (auditUser) {
        const auditRatio = auditUser.auditRatio.toFixed(2);
        const totalUp = auditUser.totalUp;
        const totalDown = auditUser.totalDown;
        
        document.getElementById('auditRatio').textContent = auditRatio;
        
        // Add more detailed info
        const ratioCard = document.getElementById('statsGrid').children[1];
        const detailP = document.createElement('p');
        detailP.className = 'detail-text';
        detailP.textContent = `(Up: ${totalUp} / Down: ${totalDown})`;
        ratioCard.appendChild(detailP);
    }
    
    // Calculate and display Projects Completed (as a bonus metric)
    const completedProjects = xpData.transaction.filter(t => 
        t.object.type === 'project' && t.amount > 0
    ).length;
    document.getElementById('projectsCompleted').textContent = completedProjects;
}


/**
 * Generates an SVG Bar Chart for XP earned per project.
 * @param {Array} transactions - The array of XP transactions.
 */
function generateProjectXPBarChart(transactions) {
    const container = document.getElementById('graphsContainer');
    
    // Group XP by project name
    const projectXpMap = transactions
        .filter(t => t.object && t.object.type === 'project' && t.amount > 0)
        .reduce((acc, t) => {
            const name = t.object.name || t.path.split('/').pop();
            acc[name] = (acc[name] || 0) + t.amount;
            return acc;
        }, {});

    const projectXp = Object.entries(projectXpMap)
        .sort(([, a], [, b]) => b - a) // Sort by amount descending
        .slice(0, 10); // Take top 10 projects

    if (projectXp.length === 0) return;

    // SVG parameters
    const width = 600;
    const height = 300;
    const padding = 30;
    const barWidth = (width - 2 * padding) / projectXp.length - 10;
    const maxValue = Math.max(...projectXp.map(([, amount]) => amount));

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('width', width);
    svg.setAttribute('height', height + 20); // Extra space for title
    svg.innerHTML = `<text x="${width/2}" y="15" text-anchor="middle" style="font-size: 16px; fill: var(--text-color);">XP Earned by Top 10 Projects</text>`;

    projectXp.forEach(([name, amount], i) => {
        const barHeight = (amount / maxValue) * height * 0.7; // Scale height
        const x = padding + i * (barWidth + 10);
        const y = height - barHeight - padding;

        // Bar
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', barWidth);
        rect.setAttribute('height', barHeight);
        rect.setAttribute('fill', 'var(--primary-color)');
        svg.appendChild(rect);

        // Label (Project Name - rotate for readability)
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute('x', x + barWidth / 2);
        label.setAttribute('y', height + 5);
        label.setAttribute('transform', `rotate(-45 ${x + barWidth / 2} ${height + 5})`);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('fill', 'var(--text-color)');
        label.textContent = name;
        svg.appendChild(label);
    });

    // Append to container
    const chartDiv = document.createElement('div');
    chartDiv.className = 'graph-card';
    chartDiv.appendChild(svg);
    container.appendChild(chartDiv);
    
    // Add informational diagram
    
}


/**
 * Generates an SVG Circle/Donut Chart for the Audit Ratio (Up vs Down).
 * @param {object} auditInfo - The data object containing audit info.
 */
function generateAuditRatioDonutChart(auditInfo) {
    const container = document.getElementById('graphsContainer');
    const auditUser = auditInfo.user[0];
    if (!auditUser) return;
    
    const totalUp = auditUser.totalUp;
    const totalDown = auditUser.totalDown;
    const total = totalUp + totalDown;

    if (total === 0) return;

    // SVG parameters
    const size = 250;
    const radius = 100;
    const center = size / 2;
    const strokeWidth = 30;
    const circumference = 2 * Math.PI * radius;

    // Calculate percentages and offset
    const upPercent = (totalUp / total) * 100;
    const downPercent = (totalDown / total) * 100;

    const upDashOffset = circumference * (1 - (upPercent / 100));
    const downDashOffset = 0; // Starts from the beginning (top)

    // Helper to convert polar to cartesian coordinates for text placement
    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('width', size);
    svg.setAttribute('height', size + 40);

    svg.innerHTML = `<text x="${center}" y="15" text-anchor="middle" style="font-size: 16px; fill: var(--text-color);">Total Audits (Up/Down)</text>`;

    // Background circle
    svg.innerHTML += `
        <circle cx="${center}" cy="${center + 20}" r="${radius}" fill="none" stroke="var(--bg-card-color)" stroke-width="${strokeWidth}"/>
    `;

    // Up segment (Blue)
    svg.innerHTML += `
        <circle 
            cx="${center}" cy="${center + 20}" r="${radius}" fill="none" 
            stroke="var(--primary-color)" stroke-width="${strokeWidth}" 
            stroke-dasharray="${circumference}" stroke-dashoffset="${upDashOffset}" 
            transform="rotate(-90 ${center} ${center + 20})"
        >
            <title>Audits Up: ${totalUp} (${upPercent.toFixed(1)}%)</title>
        </circle>
    `;

    // Down segment (Red/Orange)
    svg.innerHTML += `
        <circle 
            cx="${center}" cy="${center + 20}" r="${radius}" fill="none" 
            stroke="var(--error-color)" stroke-width="${strokeWidth}" 
            stroke-dasharray="${circumference * (downPercent / 100)} ${circumference}" 
            stroke-dashoffset="${0}" 
            transform="rotate(${90 + (upPercent * 3.6)} ${center} ${center + 20})"
        >
            <title>Audits Down: ${totalDown} (${downPercent.toFixed(1)}%)</title>
        </circle>
    `;
    
    // Center Text (Audit Ratio)
    svg.innerHTML += `
        <text x="${center}" y="${center + 20 + 5}" text-anchor="middle" style="font-size: 20px; font-weight: bold; fill: var(--primary-color);">
            ${auditUser.auditRatio.toFixed(2)}
        </text>
    `;

    // Append to container
    const chartDiv = document.createElement('div');
    chartDiv.className = 'graph-card';
    chartDiv.appendChild(svg);
    container.appendChild(chartDiv);
    
    // Add informational diagram
    
}


/**
 * Main function to fetch all required data and render the profile.
 */
async function loadProfileData() {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
        // Redirect if not logged in (handled by graphql.js or explicit redirect)
        console.error("No JWT found, redirecting to login.");
        window.location.href = 'index.html';
        return;
    }
    
    try {
        // Fetch data concurrently
        const [userInfo, auditInfo, xpData, results] = await Promise.all([
            window.GraphQL.executeQuery(window.GraphQL.queries.GET_USER_INFO), // Normal query
            window.GraphQL.executeQuery(window.GraphQL.queries.GET_AUDIT_RATIO), // Nested query
            window.GraphQL.executeQuery(window.GraphQL.queries.GET_USER_XP), // Normal query for XP transactions
            window.GraphQL.executeQuery(window.GraphQL.queries.GET_USER_RESULTS) // Used for Pass/Fail stats
        ]);

        const data = { userInfo, auditInfo, xpData, results };
        
        // Render basic statistics
        renderKeyStats(data);

        // Generate the two required SVG graphs
        generateProjectXPBarChart(xpData.transaction); // Graph 1: XP earned by project
        generateAuditRatioDonutChart(auditInfo);       // Graph 2: Audit ratio (Up vs Down)

    } catch (error) {
        console.error('Failed to load profile data:', error.message);
        // Handle 401/expired token specifically
        if (error.message.includes('Authentication failed (401)')) {
            alert('Your session has expired. Please log in again.');
            logout(); // Clear token and redirect
        } else {
            document.getElementById('userName').textContent = 'Error Loading Data';
        }
    }
}

// Check for JWT and load data when the script runs
window.onload = loadProfileData;