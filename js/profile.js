// --- Configuration for SVG Generation ---
const GRAPH_WIDTH = 550;
const GRAPH_HEIGHT = 350;

/**
 * Helper function to wrap SVG content into the styled graph-card container.
 * @param {string} title - Title of the graph.
 * @param {string} svgContent - The generated SVG elements string.
 * @returns {HTMLElement} - The complete graph card element.
 */
function createGraphCard(title, svgContent) {
    const card = document.createElement('div');
    card.className = 'graph-card';
    card.innerHTML = `
        <h4 style="margin-top:0; color:var(--text-color);">${title}</h4>
        <svg viewBox="0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}" width="100%" height="calc(100% - 30px)" preserveAspectRatio="xMidYMid meet">
            ${svgContent}
        </svg>
    `;
    return card;
}

/**
 * Clears the graphs container before rendering new charts.
 */
function clearGraphs() {
    const container = document.getElementById('graphsContainer');
    if (container) {
        container.innerHTML = '';
    }
}

// Function to perform logout
function logout() {
    localStorage.removeItem('jwt');
    // Assuming the login page is index.html
    window.location.href = 'index.html'; 
}

// --- 1. Project XP Bar Chart (XP Amount) ---
function generateProjectXPBarChart(transactions) {
    const projectXpMap = transactions
        .filter(t => t.object && t.object.type === 'project' && t.amount > 0)
        .reduce((acc, t) => {
            const projectName = t.object.name;
            acc[projectName] = (acc[projectName] || 0) + t.amount;
            return acc;
        }, {});

    const projects = Object.entries(projectXpMap)
        .sort(([, xpA], [, xpB]) => xpB - xpA)
        .slice(0, 10);

    if (projects.length === 0) {
        document.getElementById('graphsContainer').innerHTML += '<div class="graph-card"><p class="detail-text">No project XP data to display.</p></div>';
        return;
    }

    const maxXP = Math.max(...projects.map(([, xp]) => xp));
    const BAR_SPACING = 5;
    const BAR_WIDTH = (GRAPH_WIDTH / projects.length) - BAR_SPACING;
    const SVG_PADDING_BOTTOM = 50; 

    let svgContent = '';

    projects.forEach(([name, xp], index) => {
        const barHeight = (xp / maxXP) * (GRAPH_HEIGHT - SVG_PADDING_BOTTOM);
        const x = index * (BAR_WIDTH + BAR_SPACING);
        const y = GRAPH_HEIGHT - barHeight - SVG_PADDING_BOTTOM;

        // Bar (Primary Color)
        svgContent += `<rect x="${x}" y="${y}" width="${BAR_WIDTH}" height="${barHeight}" fill="#4a90e2" rx="3" ry="3" />`;

        // Project Name Label (Rotated)
        svgContent += `
            <g transform="translate(${x + BAR_WIDTH / 2}, ${GRAPH_HEIGHT - SVG_PADDING_BOTTOM + 5}) rotate(-45)">
                <text x="0" y="0" text-anchor="end" font-size="10" fill="#333333">
                    ${name.length > 15 ? name.substring(0, 12) + '...' : name}
                </text>
            </g>
        `;

        // XP Text (above the bar)
        svgContent += `
            <text x="${x + BAR_WIDTH / 2}" y="${y - 5}" 
                  text-anchor="middle" font-size="10" fill="#333333">
                ${(xp / 1000).toFixed(0)}kB
            </text>
        `;
    });

    const card = createGraphCard('Top 10 Project XP (kB)', svgContent);
    document.getElementById('graphsContainer').appendChild(card);
}

// --- 2. Audit Ratio Donut Chart (Audits) ---
function generateAuditRatioDonutChart(auditInfo) {
    const auditUser = auditInfo.user?.[0];
    if (!auditUser || (auditUser.totalUp === 0 && auditUser.totalDown === 0)) {
        document.getElementById('graphsContainer').innerHTML += '<div class="graph-card"><p class="detail-text">No audit graph data to display.</p></div>';
        return;
    }

    const up = auditUser.totalUp;
    const down = auditUser.totalDown;
    const total = up + down;

    const upRatio = up / total;
    const downRatio = down / total;

    const radius = 100;
    const center = GRAPH_WIDTH / 2;
    const strokeWidth = 50;

    // Helper to convert polar coordinates to cartesian
    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    // Function to calculate SVG path for an arc
    const describeArc = (x, y, radius, startAngle, endAngle) => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const sweepAngle = endAngle - startAngle;
        const largeArcFlag = sweepAngle <= 180 ? '0' : '1';
        
        if (sweepAngle >= 360) {
             return `M ${x - radius} ${y} A ${radius} ${radius} 0 1 0 ${x + radius} ${y} A ${radius} ${radius} 0 1 0 ${x - radius} ${y} Z`;
        }

        return [
            'M', start.x, start.y,
            'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(' ');
    };

    const upAngle = 360 * upRatio;
    const downAngle = 360 * downRatio;

    const upColor = '#50e3c2';
    const downColor = '#e94e77';

    const upPath = describeArc(center, GRAPH_HEIGHT / 2, radius, 0, upAngle);
    const downPath = describeArc(center, GRAPH_HEIGHT / 2, radius, upAngle, upAngle + downAngle);


    let svgContent = `
        <g transform="translate(0, -20)">
            <path d="${upPath}" fill="none" stroke="${upColor}" stroke-width="${strokeWidth}" stroke-linecap="butt"/>
            <path d="${downPath}" fill="none" stroke="${downColor}" stroke-width="${strokeWidth}" stroke-linecap="butt"/>
            
            <text x="${center}" y="${GRAPH_HEIGHT / 2 + 10}" text-anchor="middle" font-size="24" font-weight="bold" fill="#333333">
                ${(auditUser.auditRatio).toFixed(2)}
            </text>
        </g>
        
        <g transform="translate(400, 100)">
            <rect x="0" y="0" width="15" height="15" fill="${upColor}" />
            <text x="20" y="13" font-size="14" fill="#333333">Up Audits: ${up} (${(upRatio * 100).toFixed(1)}%)</text>
            
            <rect x="0" y="30" width="15" height="15" fill="${downColor}" />
            <text x="20" y="43" font-size="14" fill="#333333">Down Audits: ${down} (${(downRatio * 100).toFixed(1)}%)</text>
        </g>
    `;

    const card = createGraphCard('Audit Ratio (Up vs. Down)', svgContent);
    document.getElementById('graphsContainer').appendChild(card);
}

// --- 3. Progress Line Chart (Grades) ---
function generateProgressAreaChart(progressData, daysFilter = 'all') {
    const now = new Date();

    const filtered = progressData
        .filter(p => p.grade >= 1 && p.path)
        .filter(p => {
            if (daysFilter === 'all') return true;
            const diff = (now - new Date(p.createdAt)) / (1000 * 60 * 60 * 24);
            return diff <= Number(daysFilter);
        })
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (filtered.length < 2) {
        document.getElementById('graphsContainer').innerHTML += `
            <div class="graph-card">
                <p class="detail-text">Not enough progress data for this time range.</p>
            </div>
        `;
        return;
    }

    const PADDING = 45;
    const CHART_WIDTH = GRAPH_WIDTH - 2 * PADDING;
    const CHART_HEIGHT = GRAPH_HEIGHT - 2 * PADDING;

    const maxGrade = 1.5;

    const firstDate = new Date(filtered[0].createdAt);
    const lastDate = new Date(filtered[filtered.length - 1].createdAt);
    const timeRange = lastDate - firstDate;

    const points = filtered.map(p => {
        const x =
            PADDING +
            ((new Date(p.createdAt) - firstDate) / timeRange) * CHART_WIDTH;

        const y =
            PADDING +
            CHART_HEIGHT *
                (1 - Math.min(p.grade, maxGrade) / maxGrade);

        return { x, y, grade: p.grade };
    });

    const linePath = points
        .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
        .join(' ');

    const areaPath = `
        ${linePath}
        L ${points[points.length - 1].x} ${PADDING + CHART_HEIGHT}
        L ${points[0].x} ${PADDING + CHART_HEIGHT}
        Z
    `;

    let svgContent = '';

    // ✅ Grid
    for (let i = 0; i <= 5; i++) {
        const y = PADDING + (i / 5) * CHART_HEIGHT;
        svgContent += `<line x1="${PADDING}" y1="${y}" x2="${PADDING + CHART_WIDTH}" y2="${y}" stroke="#eee"/>`;

        const label = `${Math.round((1 - i / 5) * 150)}%`;
        svgContent += `<text x="${PADDING - 8}" y="${y + 4}" text-anchor="end" font-size="10">${label}</text>`;
    }

    // ✅ Axes
    svgContent += `<line x1="${PADDING}" y1="${PADDING}" x2="${PADDING}" y2="${PADDING + CHART_HEIGHT}" stroke="#333"/>`;
    svgContent += `<line x1="${PADDING}" y1="${PADDING + CHART_HEIGHT}" x2="${PADDING + CHART_WIDTH}" y2="${PADDING + CHART_HEIGHT}" stroke="#333"/>`;

    // ✅ Area (Fill)
    svgContent += `
        <path d="${areaPath}" fill="rgba(74,144,226,0.25)" />
    `;

    // ✅ Line
    svgContent += `
        <path d="${linePath}" fill="none" stroke="#4a90e2" stroke-width="2" />
    `;

    // ✅ Dots
    points.forEach(p => {
        svgContent += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#4a90e2"/>`;
    });

    const card = createGraphCard(
        `Progress Trend (${daysFilter === 'all' ? 'All Time' : `Last ${daysFilter} Days`})`,
        svgContent
    );

    document.getElementById('graphsContainer').appendChild(card);
}



// --- Key Statistics Rendering (Audits) ---
function renderKeyStats({ userInfo, auditInfo, xpData }) {
    const user = userInfo.user?.[0];
    if (user) {
        document.getElementById('userName').textContent = user.login;
        document.getElementById('userId').textContent = `ID: ${user.id}`;
        
        // Basic User Identification (NEW FIELDS POPULATED HERE)
        document.getElementById('userCampus').textContent = user.campus || 'N/A';
        const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-';
        document.getElementById('memberSince').textContent = joinDate;
    }

    // XP Amount
    const totalXP = xpData.transaction
        ?.filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0) || 0;
    document.getElementById('totalXP').textContent = `${(totalXP / 1000).toFixed(1)} kB`;

    // Audits
    const auditUser = auditInfo.user?.[0];
    if (auditUser) {
        const ratioCard = document.getElementById('statsGrid').children[1];
        const existingDetail = ratioCard.querySelector('.detail-text');
        if (existingDetail) existingDetail.remove();
        
        document.getElementById('auditRatio').textContent = auditUser.auditRatio.toFixed(2);
        const detailP = document.createElement('p');
        detailP.className = 'detail-text';
        detailP.textContent = `(Up: ${auditUser.totalUp} / Down: ${auditUser.totalDown})`;
        ratioCard.appendChild(detailP);
    }

    const projectsCompleted = xpData.transaction?.filter(t => t.object && t.object.type === 'project' && t.amount > 0).length || 0;
    document.getElementById('projectsCompleted').textContent = projectsCompleted;
}


// --- Render skills using visual bars (Skills) ---
// --- Render Top Skills using skill_* transactions (FINAL FIX) ---
function renderSkills({ skillRadarData }) {
    const container = document.getElementById('userSkillsContainer');
    container.innerHTML = '';

    const rawSkills = skillRadarData.user?.transactions || [];

    if (rawSkills.length === 0) {
        container.innerHTML = `<p class="detail-text">No skill data available.</p>`;
        return;
    }

    // ✅ GROUP + SUM skill_* transactions
    const skillTotals = rawSkills.reduce((acc, t) => {
        const cleanName = t.type
            .replace('skill_', '')
            .replace(/-/g, ' ')
            .trim()
            .toLowerCase();

        acc[cleanName] = (acc[cleanName] || 0) + t.amount;
        return acc;
    }, {});

    // ✅ Convert to sortable array
    const skills = Object.entries(skillTotals).map(([name, amount]) => ({
        name,
        amount
    }));

    // ✅ Sort by strongest first & take top 10
    const topSkills = skills
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

    const maxValue = Math.max(...topSkills.map(s => s.amount));

    const list = document.createElement('ul');
    list.className = 'skills-list';

    topSkills.forEach(skill => {
        const li = document.createElement('li');

        const percentage = (skill.amount / maxValue) * 100;

        li.innerHTML = `
            <div class="skill-name">${skill.name}</div>
            <div class="skill-level-container">
                <div class="skill-bar" style="width: ${percentage}%;"></div>
                <span class="skill-value">${skill.amount.toFixed(0)}</span>
            </div>
        `;

        list.appendChild(li);
    });

    container.appendChild(list);
}



// --- Render recent progress/results in a table (Grades) ---
function renderRecentProgress({ progressData }) {
    const container = document.getElementById('recentProgressTableContainer');
    const recentProgress = progressData.progress.slice(0, 10); // Show only the 10 most recent records

    if (recentProgress.length === 0) {
        container.innerHTML = '<p class="detail-text">No recent progress records found.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'progress-table';
    
    // Table Header
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    ['Object', 'Path', 'Grade', 'Date'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    // Table Body
    const tbody = table.createTBody();
    recentProgress.forEach(item => {
        const row = tbody.insertRow();
        
        // 1. Object Name
        row.insertCell().textContent = item.object?.name || 'N/A';
        
        // 2. Path
        row.insertCell().textContent = item.path || 'N/A';
        
        // 3. Grade
        const gradeCell = row.insertCell();
        const grade = item.grade * 100;
        gradeCell.textContent = grade.toFixed(0) + '%';
        if (grade >= 100) {
            gradeCell.classList.add('grade-pass');
        } else if (grade > 0) {
            gradeCell.classList.add('grade-fail');
        }

        // 4. Date
        row.insertCell().textContent = new Date(item.createdAt).toLocaleString();
    });

    container.innerHTML = ''; // Clear 'loading' message
    container.appendChild(table);
}


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
        // Renders Audits (Audit Ratio stat) and Basic User Info
        renderKeyStats(data); 
        // Renders Skills (bar list)
        renderSkills(data); 
        // Renders Grades (Recent Progress Table)
        renderRecentProgress(data);
        
        // Render Graphs
        generateProjectXPBarChart(xpData.transaction); // XP Graph
        generateAuditRatioDonutChart(auditInfo); // Audits Graph
        const filter = document.getElementById('progressFilter');
        generateProgressAreaChart(progressData.progress, filter.value);

        filter.addEventListener('change', () => {
            clearGraphs();
            generateProjectXPBarChart(xpData.transaction);
            generateAuditRatioDonutChart(auditInfo);
            generateProgressAreaChart(progressData.progress, filter.value);
            generateSkillsRadarChart(skillRadarData);
        });

        generateSkillsRadarChart(skillRadarData);


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

function generateSkillsRadarChart(skillRadarData) {
    const rawSkills = skillRadarData.user?.transactions || [];

    // ✅ GROUP + SUM
    const skillTotals = rawSkills.reduce((acc, t) => {
        const cleanName = t.type
            .replace('skill_', '')
            .replace(/-/g, ' ')
            .trim()
            .toLowerCase();

        acc[cleanName] = (acc[cleanName] || 0) + t.amount;
        return acc;
    }, {});

    const skills = Object.entries(skillTotals).map(([type, amount]) => ({
        type,
        amount
    }));

    if (skills.length === 0) {
        document.getElementById('graphsContainer').innerHTML +=
            '<div class="graph-card"><p class="detail-text">No skill radar data available.</p></div>';
        return;
    }

    // ✅ Optional: sort for cleaner shape
    skills.sort((a, b) => b.amount - a.amount);

    const CENTER_X = GRAPH_WIDTH / 2;   // ✅ MATCHES createGraphCard SVG
    const CENTER_Y = GRAPH_HEIGHT / 2;
    const MAX_RADIUS = 130;
    const MAX_VALUE = Math.max(...skills.map(s => s.amount));

    const angleStep = (Math.PI * 2) / skills.length;

    let svgContent = '';

    // --- GRID ---
    for (let r = 25; r <= MAX_RADIUS; r += 25) {
        svgContent += `
            <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${r}" 
                    fill="none" stroke="#ccc" stroke-width="0.5" />
        `;
    }

    // --- AXES + LABELS (✅ ONE LOOP ONLY) ---
    skills.forEach((s, i) => {
        const angle = i * angleStep - Math.PI / 2;

        const axisX = CENTER_X + Math.cos(angle) * MAX_RADIUS;
        const axisY = CENTER_Y + Math.sin(angle) * MAX_RADIUS;

        const labelX = CENTER_X + Math.cos(angle) * (MAX_RADIUS + 18);
        const labelY = CENTER_Y + Math.sin(angle) * (MAX_RADIUS + 18);

        svgContent += `
            <line x1="${CENTER_X}" y1="${CENTER_Y}" 
                  x2="${axisX}" y2="${axisY}" 
                  stroke="#aaa" stroke-width="0.5" />

            <text x="${labelX}" y="${labelY}" 
                  text-anchor="middle" font-size="11" fill="#333">
                ${s.type}
            </text>
        `;
    });

    // --- RADAR POLYGON ---
    const points = skills.map((s, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const valueRatio = s.amount / MAX_VALUE;

        const x = CENTER_X + Math.cos(angle) * valueRatio * MAX_RADIUS;
        const y = CENTER_Y + Math.sin(angle) * valueRatio * MAX_RADIUS;

        return `${x},${y}`;
    }).join(' ');

    svgContent += `
        <polygon points="${points}" 
                 fill="rgba(74,144,226,0.4)" 
                 stroke="#4a90e2" 
                 stroke-width="2" />
    `;

    // ✅ IMPORTANT: DO NOT NEST SVG AGAIN
    const card = createGraphCard('Technical Skills Radar', svgContent);
    document.getElementById('graphsContainer').appendChild(card);
}


// Run on page load
window.onload = loadProfileData;