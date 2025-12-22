// // js/charting.js

// import { 
//     GRAPH_WIDTH, 
//     GRAPH_HEIGHT, 
//     createGraphCard 
// } from './config.js';
// import { 
//     describeArc 
// } from './graphUtils.js';

// // --- Global amCharts References (Removed top-level assignment) ---
// // const am5 = window.am5; // REMOVED
// // const am5xy = window.am5xy; // REMOVED
// // const am5themes_Animated = window.am5themes_Animated; // REMOVED
// // --------------------------------------------------------------------------

// // --- 1. Project XP Bar Chart (XP Amount) ---
// function generateProjectXPBarChart(transactions) {
//     const projectXpMap = transactions
//         .filter(t => t.object && t.object.type === 'project' && t.amount > 0)
//         .reduce((acc, t) => {
//             const projectName = t.object.name;
//             acc[projectName] = (acc[projectName] || 0) + t.amount;
//             return acc;
//         }, {});

//     const projects = Object.entries(projectXpMap)
//         .sort(([, xpA], [, xpB]) => xpB - xpA)
//         .slice(0, 10);

//     if (projects.length === 0) {
//         return createGraphCard('Top 10 Project XP (kB)', '<p class="detail-text">No project XP data to display.</p>');
//     }

//     const maxXP = Math.max(...projects.map(([, xp]) => xp));
//     const BAR_SPACING = 5;
//     const CHART_PADDING_LEFT = 50;   // new
//     const CHART_PADDING_RIGHT = 50;  // new
//     const availableWidth = GRAPH_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
//     const BAR_WIDTH = (availableWidth / projects.length) - BAR_SPACING;

//     const SVG_PADDING_BOTTOM = 80; // space for rotated labels
//     const CARD_HEIGHT = GRAPH_HEIGHT + 50;

//     let svgContent = `<svg width="${GRAPH_WIDTH}" height="${CARD_HEIGHT}">`;

//     projects.forEach(([name, xp], index) => {
//         const barHeight = (xp / maxXP) * (GRAPH_HEIGHT - SVG_PADDING_BOTTOM);
//         const x = CHART_PADDING_LEFT + index * (BAR_WIDTH + BAR_SPACING);
//         const y = GRAPH_HEIGHT - barHeight - SVG_PADDING_BOTTOM;

//         // Bar
//         svgContent += `<rect x="${x}" y="${y}" width="${BAR_WIDTH}" height="${barHeight}" fill="#4a90e2" rx="3" ry="3" />`;

//         // XP Text: inside bar if tall enough, else above
//         const xpText = xp >= 1000 ? (xp / 1000).toFixed(1) + 'kB' : xp + 'B';
//         const xpTextY = barHeight > 15 ? y + 15 : y - 5;
//         svgContent += `
//             <text x="${x + BAR_WIDTH / 2}" y="${xpTextY}" 
//                 text-anchor="middle" font-size="10" fill="#fff">
//                 ${xpText}
//             </text>
//         `;

//         // Project Name Label (rotated)
//         svgContent += `
//             <g transform="translate(${x + BAR_WIDTH / 2}, ${GRAPH_HEIGHT - SVG_PADDING_BOTTOM + 10}) rotate(-45)">
//                 <text x="0" y="0" text-anchor="end" dominant-baseline="hanging" font-size="10" fill="#333333">
//                     ${name.length > 15 ? name.substring(0, 12) + '...' : name}
//                 </text>
//             </g>
//         `;
//     });

//     svgContent += `</svg>`;

//     return createGraphCard('Top 10 Project XP (kB)', svgContent);
// }



// // --- 2. Audit Ratio Donut Chart (Audits) ---
// function generateAuditRatioDonutChart(auditInfo) {
//     // ... (Implementation remains unchanged) ...
//     const auditUser = auditInfo.user?.[0];
//     if (!auditUser || (auditUser.totalUp === 0 && auditUser.totalDown === 0)) {
//         const card = createGraphCard('Audit Ratio (Up vs. Down)', '<p class="detail-text">No audit graph data to display.</p>');
//         return card;
//     }

//     const up = auditUser.totalUp;
//     const down = auditUser.totalDown;
//     const total = up + down;

//     const upRatio = up / total;
//     const downRatio = down / total;

//     const radius = 100;
//     const center = GRAPH_WIDTH / 2;
//     const strokeWidth = 50;

//     const upAngle = 360 * upRatio;
//     const downAngle = 360 * downRatio;

//     const upColor = '#50e3c2';
//     const downColor = '#e94e77';

//     const upPath = describeArc(center, GRAPH_HEIGHT / 2, radius, 0, upAngle);
//     const downPath = describeArc(center, GRAPH_HEIGHT / 2, radius, upAngle, upAngle + downAngle);


//     let svgContent = `
//         <g transform="translate(0, -20)">
//             <path d="${upPath}" fill="none" stroke="${upColor}" stroke-width="${strokeWidth}" stroke-linecap="butt"/>
//             <path d="${downPath}" fill="none" stroke="${downColor}" stroke-width="${strokeWidth}" stroke-linecap="butt"/>
            
//             <text x="${center}" y="${GRAPH_HEIGHT / 2 + 10}" text-anchor="middle" font-size="24" font-weight="bold" fill="#333333">
//                 ${(auditUser.auditRatio).toFixed(2)}
//             </text>
//         </g>
        
//         <g transform="translate(400, 100)">
//             <rect x="0" y="0" width="15" height="15" fill="${upColor}" />
//             <text x="20" y="13" font-size="14" fill="#333333">Up Audits: ${up} (${(upRatio * 100).toFixed(1)}%)</text>
            
//             <rect x="0" y="30" width="15" height="15" fill="${downColor}" />
//             <text x="20" y="43" font-size="14" fill="#333333">Down Audits: ${down} (${(downRatio * 100).toFixed(1)}%)</text>
//         </g>
//     `;

//     const card = createGraphCard('Audit Ratio (Up vs. Down)', svgContent);
//     return card;
// }

// // --- 5. Pass/Fail Donut Chart (Results) ---
// function generatePassFailDonutChart(resultsData) {
//     // ... (Implementation remains unchanged) ...
//     const rawResults = resultsData.result || [];

//     const finalResults = rawResults.filter(r => r.grade !== null && r.path);

//     if (finalResults.length === 0) {
//         const card = createGraphCard('Project Pass/Fail Ratio', '<p class="detail-text">No final results data to display.</p>');
//         return card;
//     }

//     const passes = finalResults.filter(r => r.grade >= 1).length;
//     const fails = finalResults.filter(r => r.grade < 1 && r.grade > 0).length;
//     const total = passes + fails;
    
//     if (total === 0) {
//         const card = createGraphCard('Project Pass/Fail Ratio', '<p class="detail-text">No graded results to display.</p>');
//         return card;
//     }

//     const passRatio = passes / total;
//     const failRatio = fails / total;

//     const radius = 100;
//     const center = GRAPH_WIDTH / 2;
//     const strokeWidth = 50;
    
//     const passColor = '#5cb85c'; 
//     const failColor = '#d9534f'; 

//     const passAngle = 360 * passRatio;
//     const failAngle = 360 * failRatio;

//     const passPath = describeArc(center, GRAPH_HEIGHT / 2, radius, 0, passAngle);
//     const failPath = describeArc(center, GRAPH_HEIGHT / 2, radius, passAngle, passAngle + failAngle);


//     let svgContent = `
//         <g transform="translate(0, -20)">
//             <path d="${passPath}" fill="none" stroke="${passColor}" stroke-width="${strokeWidth}" stroke-linecap="butt"/>
//             <path d="${failPath}" fill="none" stroke="${failColor}" stroke-width="${strokeWidth}" stroke-linecap="butt"/>
            
//             <text x="${center}" y="${GRAPH_HEIGHT / 2 + 10}" text-anchor="middle" font-size="24" font-weight="bold" fill="#333333">
//                 ${(passRatio * 100).toFixed(0)}%
//             </text>
//         </g>
        
//         <g transform="translate(400, 100)">
//             <rect x="0" y="0" width="15" height="15" fill="${passColor}" />
//             <text x="20" y="13" font-size="14" fill="#333333">Passes: ${passes} (${(passRatio * 100).toFixed(1)}%)</text>
            
//             <rect x="0" y="30" width="15" height="15" fill="${failColor}" />
//             <text x="20" y="43" font-size="14" fill="#333333">Fails: ${fails} (${(failRatio * 100).toFixed(1)}%)</text>
//         </g>
//     `;

//     const card = createGraphCard('Project Pass/Fail Ratio', svgContent);
//     return card;
// }


// // --- 3. Progress Trend Chart (amCharts Scatter Plot) ---
// /**
//  * Generates the Progress Trend Chart using amCharts 5 Scatter Plot.
//  * Displays only dots, with Date Axis and Grade Value Axis.
//  */
// function generateProgressAreaChart(progressData) { 
//     const am5 = window.am5;
//     const am5xy = window.am5xy;
//     const am5themes_Animated = window.am5themes_Animated;

//     if (!am5 || !am5xy) {
//         console.error("amCharts 5 libraries are not loaded. Check your index.html script order.");
//         return;
//     }

//     const amChartData = progressData
//     .filter(p => p.grade >= 1 && p.path)
//     .map(p => ({
//         date: new Date(p.createdAt).getTime(),
//         grade: p.grade,
//         gradePercentage: (p.grade * 100).toFixed(0),
//         object: p.object?.name || 'Unknown'
//     }))
//     .sort((a, b) => a.date - b.date); // strictly ascending



//     const container = document.getElementById('progressChartContainer');
//     container.innerHTML = ''; 
//     container.style.height = `${GRAPH_HEIGHT}px`; 
//     container.classList.add('graph-card'); 

//     if (amChartData.length < 1) {
//         container.innerHTML = `<p class="detail-text" style="padding: 20px;">Not enough progress data to display.</p>`;
//         return;
//     }

//     // 2. Create Root and Theme
//     if (container.chartRoot) {
//         container.chartRoot.dispose();
//     }
//     const root = am5.Root.new(container);
//     container.chartRoot = root;

//     root.setThemes([am5themes_Animated.new(root)]);
//     root.interfaceColors.set("text", am5.color(0x333333)); 

//     // 3. Create Chart
//     const chart = root.container.children.push(am5xy.XYChart.new(root, {
//         panX: true,
//         panY: true,
//         wheelX: "panX",
//         wheelY: "zoomY", 
//         pinchZoomX: true
//     }));

//     // 4. Create X-axis (Date Axis)
//     const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
//         maxDeviation: 0.1,
//         baseInterval: {
//             timeUnit: "day",
//             count: 1
//         },
//         renderer: am5xy.AxisRendererX.new(root, {}),
//         tooltip: am5.Tooltip.new(root, {})
//     }));
    
//     // Configure X-axis labels
//     xAxis.get("renderer").labels.template.setAll({
//         rotation: -45,
//         textAlign: "end",
//     });
    
//     // 5. Create Y-axis (Value Axis for Grade)
//     const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
//         renderer: am5xy.AxisRendererY.new(root, {}),
//         min: 0.8, 
//         max: 3.0 
//     }));
    
//     // Format Y-axis labels as percentage
//     yAxis.get("renderer").labels.template.set("text", "{value.format(2)}%");

//     // 6. Create Series (Scatter Plot)
//     const series = chart.series.push(am5xy.XYSeries.new(root, {
//         xAxis: xAxis,
//         yAxis: yAxis,
//         valueXField: "date",
//         valueYField: "grade",
//         tooltip: am5.Tooltip.new(root, {})
//     }));


//     // Customize data points (make them circles/bullets)
//     series.bullets.push(function() {
//         const circle = am5.Circle.new(root, {
//             radius: 5,
//             fill: series.get("fill"),
//             interactive: true,
//             cursorOverStyle: "pointer"
//         });

//         // Attach tooltip to each bullet
//         circle.set("tooltipText", "[bold]{object}[/]\nGrade: {gradePercentage}% \nDate: {date.formatDate('yyyy-MM-dd')}");
        
//         return am5.Bullet.new(root, {
//             sprite: circle
//         });
//     });

//     // 7. Add Click Event: REMOVED. Relying on native hover behavior.

//     // Set data and finalize
//     series.data.setAll(amChartData);
    
//     // Add Scrollbars 
//     chart.set("scrollbarX", am5.Scrollbar.new(root, {
//         orientation: "horizontal"
//     }));
    
//     series.appear(1000);
//     chart.appear(1000, 100);
// }

// // --- 4. Skills Radar Chart (Skills) ---
// function generateSkillsRadarChart(skillRadarData) {
//     // ... (Implementation remains unchanged) ...
//     const rawSkills = skillRadarData.user?.transactions || [];

//     // GROUP + SUM
//     const skillTotals = rawSkills.reduce((acc, t) => {
//         const cleanName = t.type
//             .replace('skill_', '')
//             .replace(/-/g, ' ')
//             .trim()
//             .toLowerCase();

//         acc[cleanName] = (acc[cleanName] || 0) + t.amount;
//         return acc;
//     }, {});

//     const skills = Object.entries(skillTotals).map(([type, amount]) => ({
//         type,
//         amount
//     }));

//     if (skills.length === 0) {
//         const card = createGraphCard('Technical Skills Radar', '<p class="detail-text">No skill radar data available.</p>');
//         return card;
//     }

//     // Optional: sort for cleaner shape
//     skills.sort((a, b) => b.amount - a.amount);

//     const CENTER_X = GRAPH_WIDTH / 2;
//     const CENTER_Y = GRAPH_HEIGHT / 2;
//     const MAX_RADIUS = 130;
//     const MAX_VALUE = Math.max(...skills.map(s => s.amount));

//     const angleStep = (Math.PI * 2) / skills.length;

//     let svgContent = '';

//     // --- GRID ---
//     for (let r = 25; r <= MAX_RADIUS; r += 25) {
//         svgContent += `
//             <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${r}" 
//                     fill="none" stroke="#ccc" stroke-width="0.5" />
//         `;
//     }

//     // --- AXES + LABELS ---
//     skills.forEach((s, i) => {
//         const angle = i * angleStep - Math.PI / 2;

//         const axisX = CENTER_X + Math.cos(angle) * MAX_RADIUS;
//         const axisY = CENTER_Y + Math.sin(angle) * MAX_RADIUS;

//         const labelX = CENTER_X + Math.cos(angle) * (MAX_RADIUS + 18);
//         const labelY = CENTER_Y + Math.sin(angle) * (MAX_RADIUS + 18);

//         svgContent += `
//             <line x1="${CENTER_X}" y1="${CENTER_Y}" 
//                   x2="${axisX}" y2="${axisY}" 
//                   stroke="#aaa" stroke-width="0.5" />

//             <text x="${labelX}" y="${labelY}" 
//                   text-anchor="middle" font-size="11" fill="#333">
//                 ${s.type}
//             </text>
//         `;
//     });

//     // --- RADAR POLYGON ---
//     const points = skills.map((s, i) => {
//         const angle = i * angleStep - Math.PI / 2;
//         const valueRatio = s.amount / MAX_VALUE;

//         const x = CENTER_X + Math.cos(angle) * valueRatio * MAX_RADIUS;
//         const y = CENTER_Y + Math.sin(angle) * valueRatio * MAX_RADIUS;

//         return `${x},${y}`;
//     }).join(' ');

//     svgContent += `
//         <polygon points="${points}" 
//                  fill="rgba(74,144,226,0.4)" 
//                  stroke="#4a90e2" 
//                  stroke-width="2" />
//     `;

//     const card = createGraphCard('Technical Skills Radar', svgContent);
//     return card;
// }


// export {
//     generateProjectXPBarChart,
//     generateAuditRatioDonutChart,
//     generateProgressAreaChart,
//     generateSkillsRadarChart,
//     generatePassFailDonutChart
// };