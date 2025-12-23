// js/projects.js

async function loadProjects() {
    const container = document.getElementById('projectsGrid');
    if (!container) return;

    try {
        const data = await window.GraphQL.executeQuery(window.GraphQL.queries.GET_USER_RESULTS);
        
        if (!data || !data.result) {
            container.innerHTML = '<p class="loading-text">No project data found in current scope.</p>';
            return;
        }

        // 1. Filter and Deduplicate (Keep only the best grade for each unique project)
        const projectMap = new Map();
        data.result
            .filter(item => item.object.type === 'project')
            .forEach(proj => {
                const existing = projectMap.get(proj.object.name);
                if (!existing || proj.grade > existing.grade) {
                    projectMap.set(proj.object.name, proj);
                }
            });

        const projects = Array.from(projectMap.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = ''; 

        projects.forEach(proj => {
            const isPass = proj.grade >= 1;
            const dateStr = new Date(proj.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            const card = document.createElement('div');
            card.className = 'project-pro-card';
            
            card.innerHTML = `
                <div class="project-card-top">
                    <div class="project-icon-box">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                        </svg>
                    </div>
                    <div class="status-badge ${isPass ? 'pass' : 'fail'}">
                        ${isPass ? 'Success' : 'Incomplete'}
                    </div>
                </div>

                <div class="project-body">
                    <h3 class="project-name">${proj.object.name}</h3>
                    <div class="project-path-crumb">${proj.path.split('/').slice(-2, -1)}</div>
                    
                    <div class="project-stats-row">
                        <div class="stat-item">
                            <span class="stat-label">Grade</span>
                            <span class="stat-value ${isPass ? 'text-blue' : 'text-error'}">${proj.grade.toFixed(2)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Verified</span>
                            <span class="stat-value">${dateStr}</span>
                        </div>
                    </div>
                </div>

                <div class="project-footer-svg">
                    <svg width="100%" height="4" style="border-radius: 2px;">
                        <rect width="100%" height="4" fill="#f1f5f9"/>
                        <rect width="${Math.min(proj.grade * 100, 100)}%" height="4" fill="${isPass ? '#4a90e2' : '#ef4444'}"/>
                    </svg>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Project Load Error:', error);
        container.innerHTML = `<div class="error-msg">Failed to retrieve repository: ${error.message}</div>`;
    }
}

window.onload = loadProjects;