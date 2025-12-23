// js/audits.js

async function loadAuditData() {
    const tableContainer = document.getElementById('auditTableContainer');
    
    try {
        const ratioData = await window.GraphQL.executeQuery(window.GraphQL.queries.GET_AUDIT_RATIO);
        const transData = await window.GraphQL.executeQuery(window.GraphQL.queries.GET_XP_TRANSACTIONS);

        if (!ratioData || !ratioData.user || !ratioData.user[0]) return;
        const user = ratioData.user[0];

        // 1. Update Stat Cards with dynamic color indicators
        document.getElementById('ratioValue').textContent = user.auditRatio.toFixed(1);
        document.getElementById('totalUp').textContent = (user.totalUp / 1000000).toFixed(2) + ' MB';
        document.getElementById('totalDown').textContent = (user.totalDown / 1000000).toFixed(2) + ' MB';

        // 2. Filter transactions
        const auditTrans = transData.transaction.filter(t => t.type === 'up' || t.type === 'down');

        if (auditTrans.length === 0) {
            tableContainer.innerHTML = '<p class="loading-text">No audit history found.</p>';
            return;
        }

        tableContainer.innerHTML = ''; // Clear container

        // 3. Build SaaS Style List
        auditTrans.forEach(t => {
            const isUp = t.type === 'up';
            const amountFormatted = (t.amount / 1000).toFixed(1) + ' kB';
            const dateStr = new Date(t.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });

            const row = document.createElement('div');
            row.className = 'audit-pro-row';
            
            row.innerHTML = `
                <div class="audit-icon-wrapper ${isUp ? 'up' : 'down'}">
                    ${isUp ? 
                        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M7 17L17 7M17 7H7M17 7V17" stroke-linecap="round" stroke-linejoin="round"/>
                         </svg>` : 
                        `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 7L7 17M7 17H17M7 17V7" stroke-linecap="round" stroke-linejoin="round"/>
                         </svg>`
                    }
                </div>
                
                <div class="audit-info">
                    <div class="audit-project-name">${t.object.name}</div>
                    <div class="audit-date">${dateStr}</div>
                </div>

                <div class="audit-type-pill ${isUp ? 'pill-up' : 'pill-down'}">
                    ${isUp ? 'GIVEN' : 'RECEIVED'}
                </div>

                <div class="audit-amount ${isUp ? 'text-success' : 'text-error'}">
                    ${isUp ? '+' : '-'}${amountFormatted}
                </div>
            `;
            tableContainer.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading audits:', error);
        tableContainer.innerHTML = `<p class="error-text">System Error: ${error.message}</p>`;
    }
}

window.onload = loadAuditData;