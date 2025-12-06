import { 
    GRAPH_WIDTH, 
    GRAPH_HEIGHT, 
    createGraphCard 
} from './config.js';
import { 
    describeArc 
} from './graphUtils.js';

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

    // Grid
    for (let i = 0; i <= 5; i++) {
        const y = PADDING + (i / 5) * CHART_HEIGHT;
        svgContent += `<line x1="${PADDING}" y1="${y}" x2="${PADDING + CHART_WIDTH}" y2="${y}" stroke="#eee"/>`;

        const label = `${Math.round((1 - i / 5) * 150)}%`;
        svgContent += `<text x="${PADDING - 8}" y="${y + 4}" text-anchor="end" font-size="10">${label}</text>`;
    }

    // Axes
    svgContent += `<line x1="${PADDING}" y1="${PADDING}" x2="${PADDING}" y2="${PADDING + CHART_HEIGHT}" stroke="#333"/>`;
    svgContent += `<line x1="${PADDING}" y1="${PADDING + CHART_HEIGHT}" x2="${PADDING + CHART_WIDTH}" y2="${PADDING + CHART_HEIGHT}" stroke="#333"/>`;

    // Area (Fill)
    svgContent += `
        <path d="${areaPath}" fill="rgba(74,144,226,0.25)" />
    `;

    // Line
    svgContent += `
        <path d="${linePath}" fill="none" stroke="#4a90e2" stroke-width="2" />
    `;

    // Dots
    points.forEach(p => {
        svgContent += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#4a90e2"/>`;
    });

    const card = createGraphCard(
        `Progress Trend (${daysFilter === 'all' ? 'All Time' : `Last ${daysFilter} Days`})`,
        svgContent
    );

    document.getElementById('graphsContainer').appendChild(card);
}

// --- 4. Skills Radar Chart (Skills) ---
function generateSkillsRadarChart(skillRadarData) {
    const rawSkills = skillRadarData.user?.transactions || [];

    // GROUP + SUM
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

    // Optional: sort for cleaner shape
    skills.sort((a, b) => b.amount - a.amount);

    const CENTER_X = GRAPH_WIDTH / 2;
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

    // --- AXES + LABELS ---
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

    const card = createGraphCard('Technical Skills Radar', svgContent);
    document.getElementById('graphsContainer').appendChild(card);
}

// Add this new function to charting.js

// --- 5. Pass/Fail Donut Chart (Results) ---
function generatePassFailDonutChart(resultsData) {
    const rawResults = resultsData.result || [];

    // Filter for results that represent a clear final outcome (type 'piscine-go' or similar could be added if needed)
    // For simplicity, we count any grade >= 1 as a 'Pass'
    const finalResults = rawResults.filter(r => r.grade !== null && r.path);

    if (finalResults.length === 0) {
        document.getElementById('graphsContainer').innerHTML += 
            '<div class="graph-card"><p class="detail-text">No final results data to display.</p></div>';
        return;
    }

    const passes = finalResults.filter(r => r.grade >= 1).length;
    const fails = finalResults.filter(r => r.grade < 1 && r.grade > 0).length; // Only count attempts with grade > 0 as a 'fail'
    const total = passes + fails;
    
    if (total === 0) {
        document.getElementById('graphsContainer').innerHTML += 
            '<div class="graph-card"><p class="detail-text">No graded results to display.</p></div>';
        return;
    }

    const passRatio = passes / total;
    const failRatio = fails / total;

    const radius = 100;
    const center = GRAPH_WIDTH / 2;
    const strokeWidth = 50;
    
    // Determine the color for Pass (Green) and Fail (Red)
    const passColor = '#5cb85c'; // Bootstrap Success green
    const failColor = '#d9534f'; // Bootstrap Danger red

    const passAngle = 360 * passRatio;
    const failAngle = 360 * failRatio;

    // Use the describeArc helper (from graphUtils.js)
    const passPath = describeArc(center, GRAPH_HEIGHT / 2, radius, 0, passAngle);
    const failPath = describeArc(center, GRAPH_HEIGHT / 2, radius, passAngle, passAngle + failAngle);


    let svgContent = `
        <g transform="translate(0, -20)">
            <path d="${passPath}" fill="none" stroke="${passColor}" stroke-width="${strokeWidth}" stroke-linecap="butt"/>
            <path d="${failPath}" fill="none" stroke="${failColor}" stroke-width="${strokeWidth}" stroke-linecap="butt"/>
            
            <text x="${center}" y="${GRAPH_HEIGHT / 2 + 10}" text-anchor="middle" font-size="24" font-weight="bold" fill="#333333">
                ${(passRatio * 100).toFixed(0)}%
            </text>
        </g>
        
        <g transform="translate(400, 100)">
            <rect x="0" y="0" width="15" height="15" fill="${passColor}" />
            <text x="20" y="13" font-size="14" fill="#333333">Passes: ${passes} (${(passRatio * 100).toFixed(1)}%)</text>
            
            <rect x="0" y="30" width="15" height="15" fill="${failColor}" />
            <text x="20" y="43" font-size="14" fill="#333333">Fails: ${fails} (${(failRatio * 100).toFixed(1)}%)</text>
        </g>
    `;

    const card = createGraphCard('Project Pass/Fail Ratio', svgContent);
    document.getElementById('graphsContainer').appendChild(card);
}

export {
    generateProjectXPBarChart,
    generateAuditRatioDonutChart,
    generateProgressAreaChart,
    generateSkillsRadarChart,
    generatePassFailDonutChart // Export the new function
};