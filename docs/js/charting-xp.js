// js/charting-xp.js
// Project XP Bar Chart Generation

import { 
    GRAPH_WIDTH, 
    GRAPH_HEIGHT, 
    createGraphCard 
} from './config.js';

/**
 * Generates a bar chart showing the top 10 projects by XP earned
 * @param {Array} transactions - Array of XP transactions
 * @returns {HTMLElement} - Graph card element with the bar chart
 */
function generateProjectXPBarChart(transactions) {
    // Aggregate XP by project
    const projectXpMap = transactions
        .filter(t => t.object && t.object.type === 'project' && t.amount > 0)
        .reduce((acc, t) => {
            const projectName = t.object.name;
            acc[projectName] = (acc[projectName] || 0) + t.amount;
            return acc;
        }, {});

    // Sort and get top 10
    const projects = Object.entries(projectXpMap)
        .sort(([, xpA], [, xpB]) => xpB - xpA)
        .slice(0, 10);

    if (projects.length === 0) {
        return createGraphCard('Top 10 Project XP (kB)', '<p class="detail-text">No project XP data to display.</p>');
    }

    const maxXP = Math.max(...projects.map(([, xp]) => xp));
    const BAR_SPACING = 5;
    const CHART_PADDING_LEFT = 50;
    const CHART_PADDING_RIGHT = 50;
    const availableWidth = GRAPH_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
    const BAR_WIDTH = (availableWidth / projects.length) - BAR_SPACING;

    const SVG_PADDING_BOTTOM = 80; // space for rotated labels
    const CARD_HEIGHT = GRAPH_HEIGHT + 50;

    let svgContent = `<svg width="${GRAPH_WIDTH}" height="${CARD_HEIGHT}">`;

    projects.forEach(([name, xp], index) => {
        const barHeight = (xp / maxXP) * (GRAPH_HEIGHT - SVG_PADDING_BOTTOM);
        const x = CHART_PADDING_LEFT + index * (BAR_WIDTH + BAR_SPACING);
        const y = GRAPH_HEIGHT - barHeight - SVG_PADDING_BOTTOM;

        // Bar
        svgContent += `<rect x="${x}" y="${y}" width="${BAR_WIDTH}" height="${barHeight}" fill="#4a90e2" rx="3" ry="3" />`;

        // XP Text: inside bar if tall enough, else above
        const xpText = xp >= 1000 ? (xp / 1000).toFixed(1) + 'kB' : xp + 'B';
        const xpTextY = barHeight > 15 ? y + 15 : y - 5;
        svgContent += `
            <text x="${x + BAR_WIDTH / 2}" y="${xpTextY}" 
                text-anchor="middle" font-size="10" fill="#fff">
                ${xpText}
            </text>
        `;

        // Project Name Label (rotated)
        svgContent += `
            <g transform="translate(${x + BAR_WIDTH / 2}, ${GRAPH_HEIGHT - SVG_PADDING_BOTTOM + 10}) rotate(-45)">
                <text x="0" y="0" text-anchor="end" dominant-baseline="hanging" font-size="10" fill="#333333">
                    ${name.length > 15 ? name.substring(0, 12) + '...' : name}
                </text>
            </g>
        `;
    });

    svgContent += `</svg>`;

    return createGraphCard('Top 10 Project XP (kB)', svgContent);
}

export { generateProjectXPBarChart };