const GRAPH_WIDTH = 550;
const GRAPH_HEIGHT = 350;

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

function clearGraphs() {
    const container = document.getElementById('graphsContainer');
    if (container) {
        container.innerHTML = '';
    }
}

function logout() {
    localStorage.removeItem('jwt');
    window.location.href = 'index.html'; 
}

export { 
    GRAPH_WIDTH, 
    GRAPH_HEIGHT, 
    createGraphCard, 
    clearGraphs, 
    logout 
};