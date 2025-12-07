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
    // Use window.GRAPH_WIDTH and window.GRAPH_HEIGHT after assignment in main.js
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

// Exporting necessary items
export { 
    GRAPH_WIDTH, 
    GRAPH_HEIGHT, 
    createGraphCard, 
    clearGraphs, 
    logout 
};