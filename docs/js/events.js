// js/events.js

async function loadEvents() {
    const container = document.getElementById('eventsContainer');
    if (!container) return;

    try {
        const userInfo = await window.GraphQL.executeQuery(window.GraphQL.queries.GET_USER_INFO);
        const userId = userInfo.user?.[0]?.id;

        if (!userId) throw new Error("User session not found.");

        const variables = {
            userId: userId,
            parentIds: [200] 
        };

        const data = await window.GraphQL.executeQuery(window.GraphQL.queries.GET_USER_EVENTS, variables);
        
        if (!data || !data.registration || data.registration.length === 0) {
            container.innerHTML = '<div class="loading-text">No active event registrations found.</div>';
            return;
        }

        container.innerHTML = ''; 

        data.registration.forEach((reg, index) => {
            const joinedDate = new Date(reg.eventJoinedAt).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric'
            });

            // Professional Path Formatting: /athens/piscine-go -> Piscine Go
            const pathParts = reg.path.split('/').filter(p => p && p !== 'athens');
            const breadcrumbs = pathParts.map(p => p.replace(/-/g, ' ')).join(' › ');

            const eventCard = document.createElement('div');
            eventCard.className = 'event-timeline-item';
            
            eventCard.innerHTML = `
                <div class="timeline-visual">
                    <div class="timeline-node">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-linecap="round" stroke-linejoin="round"/>
                            <polyline points="22 4 12 14.01 9 11.01" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    ${index !== data.registration.length - 1 ? '<div class="timeline-connector"></div>' : ''}
                </div>

                <div class="event-content-pro">
                    <div class="event-header-main">
                        <div>
                            <h3 class="event-title-text">${reg.object.name}</h3>
                            <div class="event-breadcrumb">${breadcrumbs}</div>
                        </div>
                        <div class="status-pill">
                            <span class="status-pulse"></span>
                            ACTIVE
                        </div>
                    </div>

                    <div class="event-meta-row">
                        <div class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Enrolled on ${joinedDate}
                        </div>
                        <div class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                            Verified Registration
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(eventCard);
        });

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `<div class="error-msg">Systems offline: ${error.message}</div>`;
    }
}

window.onload = loadEvents;