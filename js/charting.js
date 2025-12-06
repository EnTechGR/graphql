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
        const card = createGraphCard('Top 10 Project XP (kB)', '<p class="detail-text">No project XP data to display.</p>');
        return card;
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
    return card; // Return the card
}

// --- 2. Audit Ratio Donut Chart (Audits) ---
function generateAuditRatioDonutChart(auditInfo) {
    const auditUser = auditInfo.user?.[0];
    if (!auditUser || (auditUser.totalUp === 0 && auditUser.totalDown === 0)) {
        const card = createGraphCard('Audit Ratio (Up vs. Down)', '<p class="detail-text">No audit graph data to display.</p>');
        return card;
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
    return card; // Return the card
}

// --- 5. Pass/Fail Donut Chart (Results) ---
function generatePassFailDonutChart(resultsData) {
    const rawResults = resultsData.result || [];

    const finalResults = rawResults.filter(r => r.grade !== null && r.path);

    if (finalResults.length === 0) {
        const card = createGraphCard('Project Pass/Fail Ratio', '<p class="detail-text">No final results data to display.</p>');
        return card;
    }

    const passes = finalResults.filter(r => r.grade >= 1).length;
    const fails = finalResults.filter(r => r.grade < 1 && r.grade > 0).length;
    const total = passes + fails;
    
    if (total === 0) {
        const card = createGraphCard('Project Pass/Fail Ratio', '<p class="detail-text">No graded results to display.</p>');
        return card;
    }

    const passRatio = passes / total;
    const failRatio = fails / total;

    const radius = 100;
    const center = GRAPH_WIDTH / 2;
    const strokeWidth = 50;
    
    const passColor = '#5cb85c'; 
    const failColor = '#d9534f'; 

    const passAngle = 360 * passRatio;
    const failAngle = 360 * failRatio;

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
    return card; // Return the card
}

/**
 * Handles mouse events on the progress chart points.
 * We attach the tooltip and click listeners to the SVG element containing the circle.
 * @param {HTMLElement} svgElement - The main SVG element where the chart is drawn.
 */
function attachProgressChartListeners(svgElement) {
    let tooltip = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tooltip.setAttribute('id', 'progress-tooltip');
    tooltip.setAttribute('pointer-events', 'none'); // Ensure tooltip doesn't interfere with mouse events
    tooltip.style.opacity = 0;
    
    // Create background rectangle
    let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute('fill', '#333');
    rect.setAttribute('rx', 5);
    rect.setAttribute('ry', 5);
    rect.setAttribute('opacity', 0.9);
    tooltip.appendChild(rect);

    // Create text element
    let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute('fill', 'white');
    text.setAttribute('font-size', '10');
    text.setAttribute('y', 15);
    tooltip.appendChild(text);

    svgElement.appendChild(tooltip);

    // Event listeners
    svgElement.querySelectorAll('.progress-point').forEach(pointGroup => {
        const grade = pointGroup.getAttribute('data-grade');
        const object = pointGroup.getAttribute('data-object');
        const date = pointGroup.getAttribute('data-date');
        
        pointGroup.addEventListener('mouseenter', (e) => {
            const cx = parseFloat(e.currentTarget.querySelector('circle').getAttribute('cx'));
            const cy = parseFloat(e.currentTarget.querySelector('circle').getAttribute('cy'));
            
            const tooltipText = `${object} | Grade: ${grade}% | ${date}`;
            text.textContent = tooltipText;

            // Recalculate rectangle size based on text length
            const textLength = tooltipText.length * 6; // Rough estimate of pixel length
            rect.setAttribute('width', textLength + 10);
            rect.setAttribute('height', 20);
            rect.setAttribute('x', -5); // Offset for padding

            tooltip.setAttribute('transform', `translate(${cx + 10}, ${cy - 10})`);
            tooltip.style.opacity = 1;
            e.currentTarget.querySelector('circle').setAttribute('r', 6); // Enlarge on hover
        });

        pointGroup.addEventListener('mouseleave', (e) => {
            tooltip.style.opacity = 0;
            e.currentTarget.querySelector('circle').setAttribute('r', 4); // Reset size
        });

        pointGroup.addEventListener('click', () => {
            console.log(`Clicked Progress Event: Object=${object}, Grade=${grade}%, Date=${date}`);
            // Implement any actual action here (e.g., redirect to project page)
            alert(`Event Details:\nProject: ${object}\nGrade: ${grade}%\nDate: ${date}`);
        });
    });
}


// --- 3. Progress Line Chart (Grades) ---
function generateProgressAreaChart(progressData, daysFilter = 'all') {
    const now = new Date();

    const filtered = progressData
        // Only include events with grade >= 1 (passes)
        .filter(p => p.grade >= 1 && p.path)
        .filter(p => {
            if (daysFilter === 'all') return true;
            const diff = (now - new Date(p.createdAt)) / (1000 * 60 * 60 * 24);
            return diff <= Number(daysFilter);
        })
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const container = document.getElementById('progressChartContainer');
    container.innerHTML = ''; 

    if (filtered.length < 1) {
        container.innerHTML = `
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

    // Map data to coordinates
    const points = filtered.map(p => {
        const dateObj = new Date(p.createdAt);
        
        // X position: scaled based on time difference (already ensures separation by time)
        const x =
            PADDING +
            ((dateObj - firstDate) / timeRange) * CHART_WIDTH;

        // Y position: scaled based on grade
        const y =
            PADDING +
            CHART_HEIGHT *
                (1 - Math.min(p.grade, maxGrade) / maxGrade);

        return { 
            x, 
            y, 
            grade: (p.grade * 100).toFixed(0), 
            date: dateObj.toLocaleDateString(),
            object: p.object?.name || 'Unknown'
        };
    });

    let svgContent = '';

    // --- Y-Axis Grid (Grades) ---
    for (let i = 0; i <= 5; i++) {
        const y = PADDING + (i / 5) * CHART_HEIGHT;
        svgContent += `<line x1="${PADDING}" y1="${y}" x2="${PADDING + CHART_WIDTH}" y2="${y}" stroke="#eee"/>`;

        const label = `${Math.round((1 - i / 5) * 150)}%`;
        svgContent += `<text x="${PADDING - 8}" y="${y + 4}" text-anchor="end" font-size="10">${label}</text>`;
    }

    // --- X-Axis Ticks and Labels (Dates) ---
    const numTicks = 5;
    for (let i = 0; i < numTicks; i++) {
        const timeRatio = i / (numTicks - 1);
        const tickDate = new Date(firstDate.getTime() + timeRange * timeRatio);
        const tickX = PADDING + CHART_WIDTH * timeRatio;
        
        const dateLabel = tickDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        svgContent += `<line x1="${tickX}" y1="${PADDING + CHART_HEIGHT}" x2="${tickX}" y2="${PADDING + CHART_HEIGHT + 5}" stroke="#aaa"/>`;
        
        svgContent += `
            <g transform="translate(${tickX}, ${PADDING + CHART_HEIGHT + 15}) rotate(-45)">
                <text x="0" y="0" text-anchor="end" font-size="10" fill="#333">${dateLabel}</text>
            </g>
        `;
    }

    // --- Axes Lines ---
    svgContent += `<line x1="${PADDING}" y1="${PADDING}" x2="${PADDING}" y2="${PADDING + CHART_HEIGHT}" stroke="#333"/>`;
    svgContent += `<line x1="${PADDING}" y1="${PADDING + CHART_HEIGHT}" x2="${PADDING + CHART_WIDTH}" y2="${PADDING + CHART_HEIGHT}" stroke="#333"/>`;

    // --- Scatter Points (Dots Only) ---
    // Use an SVG group (<g>) for each point to make the hit area larger and attach data attributes
    points.forEach(p => {
        svgContent += `
            <g class="progress-point" 
               style="cursor: pointer;" 
               data-grade="${p.grade}" 
               data-object="${p.object}" 
               data-date="${p.date}">
                
                <circle cx="${p.x}" cy="${p.y}" r="4" fill="#4a90e2" />
                
                <circle cx="${p.x}" cy="${p.y}" r="8" fill="transparent" opacity="0"/> 
            </g>
        `;
    });

    const card = createGraphCard(
        `Progress Trend (${daysFilter === 'all' ? 'All Time' : `Last ${daysFilter} Days`})`,
        svgContent
    );

    document.getElementById('progressChartContainer').appendChild(card);
    
    // ATTACH LISTENERS AFTER THE CHART IS RENDERED IN THE DOM
    const svgElement = card.querySelector('svg');
    if (svgElement) {
        attachProgressChartListeners(svgElement);
    }
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
        const card = createGraphCard('Technical Skills Radar', '<p class="detail-text">No skill radar data available.</p>');
        return card;
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
    return card; // Return the card
}

export {
    generateProjectXPBarChart,
    generateAuditRatioDonutChart,
    generateProgressAreaChart,
    generateSkillsRadarChart,
    generatePassFailDonutChart
};