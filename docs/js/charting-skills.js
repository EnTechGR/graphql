// js/charting-skills.js
// Skills Radar Chart Generation

import { 
    GRAPH_WIDTH, 
    GRAPH_HEIGHT, 
    createGraphCard 
} from './config.js';

/**
 * Generates a radar chart displaying technical skills
 * @param {Object} skillRadarData - Skill data containing user transactions
 * @returns {HTMLElement} - Graph card element with the radar chart
 */
function generateSkillsRadarChart(skillRadarData) {
    const rawSkills = skillRadarData.user?.transactions || [];

    // GROUP + SUM skills by type
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
    return card;
}

export { generateSkillsRadarChart };