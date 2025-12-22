// js/charting-results.js
// Pass/Fail Results Donut Chart Generation

import { 
    GRAPH_WIDTH, 
    GRAPH_HEIGHT, 
    createGraphCard 
} from './config.js';
import { describeArc } from './graphUtils.js';

/**
 * Generates a donut chart showing the pass/fail ratio for projects
 * @param {Object} resultsData - Results data containing grade information
 * @returns {HTMLElement} - Graph card element with the donut chart
 */
function generatePassFailDonutChart(resultsData) {
    const rawResults = resultsData.result || [];

    // Filter for final results with grades and paths
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
    return card;
}

export { generatePassFailDonutChart };