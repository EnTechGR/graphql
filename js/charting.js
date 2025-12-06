import { 
    GRAPH_WIDTH, 
    GRAPH_HEIGHT, 
    createGraphCard 
} from './config.js';
import { 
    describeArc 
} from './graphUtils.js';

const am5 = window.am5;
const am5xy = window.am5xy;
const am5themes_Animated = window.am5themes_Animated;

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


// --- 3. Progress Trend Chart (amCharts Scatter Plot) ---
/**
 * Generates the Progress Trend Chart using amCharts 5 Scatter Plot.
 * Displays only dots, with Date Axis and Grade Value Axis.
 */
function generateProgressAreaChart(progressData, daysFilter = 'all') {
    if (!am5 || !am5xy) {
        console.error("amCharts 5 libraries are not loaded.");
        return;
    }

    const now = new Date();

    // 1. Filter and Prepare Data for amCharts
    const amChartData = progressData
        // Only include events with grade >= 1 (passes)
        .filter(p => p.grade >= 1 && p.path)
        .filter(p => {
            if (daysFilter === 'all') return true;
            const diff = (now - new Date(p.createdAt)) / (1000 * 60 * 60 * 24);
            return diff <= Number(daysFilter);
        })
        .map(p => ({
            date: new Date(p.createdAt).getTime(), // amCharts requires Unix timestamp (milliseconds)
            grade: p.grade,
            gradePercentage: (p.grade * 100).toFixed(0),
            object: p.object?.name || 'Unknown'
        }))
        .sort((a, b) => a.date - b.date);


    const container = document.getElementById('progressChartContainer');
    // Clear previous content
    container.innerHTML = ''; 
    container.style.height = `${GRAPH_HEIGHT}px`; // Set height for amChart container
    container.classList.add('graph-card'); // Use the same styling

    if (amChartData.length < 1) {
        container.innerHTML = `<p class="detail-text" style="padding: 20px;">Not enough progress data for this time range.</p>`;
        return;
    }

    // 2. Create Root and Theme
    const root = am5.Root.new(container);
    root.setThemes([am5themes_Animated.new(root)]);
    root.interfaceColors.set("text", am5.color(0x333333)); // Match text color

    // 3. Create Chart
    const chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true
    }));

    // 4. Create X-axis (Date Axis)
    const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
        maxDeviation: 0.1,
        baseInterval: {
            timeUnit: "day",
            count: 1
        },
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {})
    }));
    
    // Hide default X-axis labels and use the Date Axis tooltip for information
    xAxis.get("renderer").labels.template.setAll({
        rotation: -45,
        textAlign: "end",
        // Only show a few labels to declutter
        disabled: false
    });
    
    // 5. Create Y-axis (Value Axis for Grade)
    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
        min: 0.8, // Start slightly below 100% to show context
        max: 1.5 // Max grade 150%
    }));
    
    // Format Y-axis labels as percentage
    yAxis.get("renderer").labels.template.set("text", "{value.format(2)}%");

    // 6. Create Series (Scatter Plot)
    const series = chart.series.push(am5xy.LineSeries.new(root, {
        name: "Progress",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "grade",
        valueXField: "date",
        // Crucial: Set connect to false to get a scatter plot (dots only)
        connect: false, 
        tooltip: am5.Tooltip.new(root, {
            labelText: "[bold]{object}[/]\nGrade: {gradePercentage}% \nDate: {date.formatdate()}"
        })
    }));

    // Customize data points (make them circles/bullets)
    series.bullets.push(function() {
        return am5.Bullet.new(root, {
            sprite: am5.Circle.new(root, {
                radius: 5,
                fill: series.get("fill"),
                // Make points hoverable/clickable
                interactive: true,
                cursorOverStyle: "pointer"
            })
        });
    });
    
    // 7. Add Click Event (The amCharts way to make it clickable)
    series.bullets.events.on("click", function(ev) {
        const data = ev.target.dataItem.dataContext;
        console.log(`Clicked Progress Event: Object=${data.object}, Grade=${data.gradePercentage}%, Date=${new Date(data.date).toLocaleDateString()}`);
        alert(`Event Details:\nProject: ${data.object}\nGrade: ${data.gradePercentage}%\nDate: ${new Date(data.date).toLocaleDateString()}`);
    });


    // Set data and finalize
    series.data.setAll(amChartData);
    
    // Add Scrollbars for better interaction with many points
    chart.set("scrollbarX", am5.Scrollbar.new(root, {
        orientation: "horizontal"
    }));
    chart.set("scrollbarY", am5.Scrollbar.new(root, {
        orientation: "vertical"
    }));
    
    // Make stuff animate on load
    series.appear(1000);
    chart.appear(1000, 100);
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