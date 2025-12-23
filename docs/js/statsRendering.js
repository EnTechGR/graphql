import { createGraphCard, GRAPH_WIDTH, GRAPH_HEIGHT } from './config.js';

function renderKeyStats({ userInfo, auditInfo, xpData }) {
    const user = userInfo.user?.[0];
    if (user) {
        document.getElementById('userName').textContent = user.login || 'Unknown';
        document.getElementById('userId').textContent = `ID: ${user.id || 'N/A'}`;
        
        document.getElementById('userCampus').textContent = user.campus || 'N/A';
        const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-';
        document.getElementById('memberSince').textContent = joinDate;
    }

    const totalXP = xpData.transaction
        ?.filter(t => t.amount > 0)
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    document.getElementById('totalXP').textContent = `${(totalXP / 1000).toFixed(1)} kB`;

    const auditUser = auditInfo.user?.[0];
    if (auditUser) {
        const ratioCard = document.getElementById('statsGrid').children[1];
        const existingDetail = ratioCard.querySelector('.detail-text');
        if (existingDetail) existingDetail.remove();
        
        // Safety check: Use 0 if auditRatio is null
        const ratio = auditUser.auditRatio ?? 0;
        document.getElementById('auditRatio').textContent = ratio.toFixed(2);
        
        const detailP = document.createElement('p');
        detailP.className = 'detail-text';
        detailP.textContent = `(Up: ${auditUser.totalUp || 0} / Down: ${auditUser.totalDown || 0})`;
        ratioCard.appendChild(detailP);
    }

    const projectsCompleted = xpData.transaction?.filter(t => t.object && t.object.type === 'project' && (t.amount || 0) > 0).length || 0;
    document.getElementById('projectsCompleted').textContent = projectsCompleted;
}

function renderSkills({ skillRadarData }) {
    const container = document.getElementById('userSkillsContainer');
    container.innerHTML = '';

    const rawSkills = skillRadarData.user?.transactions || [];

    if (rawSkills.length === 0) {
        container.innerHTML = `<p class="detail-text">No skill data available.</p>`;
        return;
    }

    const skillTotals = rawSkills.reduce((acc, t) => {
        const cleanName = t.type
            .replace('skill_', '')
            .replace(/-/g, ' ')
            .trim()
            .toLowerCase();

        acc[cleanName] = (acc[cleanName] || 0) + (t.amount || 0);
        return acc;
    }, {});

    const skills = Object.entries(skillTotals).map(([name, amount]) => ({
        name,
        amount
    }));

    const topSkills = skills
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

    const maxValue = Math.max(...topSkills.map(s => s.amount)) || 1;

    const list = document.createElement('ul');
    list.className = 'skills-list';

    topSkills.forEach(skill => {
        const li = document.createElement('li');
        const percentage = (skill.amount / maxValue) * 100;

        li.innerHTML = `
            <div class="skill-name">${skill.name}</div>
            <div class="skill-level-container">
                <div class="skill-bar" style="width: ${percentage}%;"></div>
                <span class="skill-value">${(skill.amount || 0).toFixed(0)}</span>
            </div>
        `;
        list.appendChild(li);
    });

    container.appendChild(list);
}

function renderRecentProgress({ progressData }) {
    const container = document.getElementById('recentProgressTableContainer');
    const recentProgress = progressData?.progress?.slice(0, 10) || [];

    if (recentProgress.length === 0) {
        container.innerHTML = '<p class="detail-text">No recent progress records found.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'progress-table';
    
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    ['Object', 'Path', 'Grade', 'Date'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    recentProgress.forEach(item => {
        const row = tbody.insertRow();
        
        row.insertCell().textContent = item.object?.name || 'N/A';
        row.insertCell().textContent = item.path || 'N/A';
        
        const gradeCell = row.insertCell();
        // Safety check: if grade is null, default to 0
        const grade = item.grade ?? 0;
        
        gradeCell.textContent = grade.toFixed(2);
        
        if (grade >= 1) {
            gradeCell.classList.add('grade-pass');
        } else if (grade > 0) {
            gradeCell.classList.add('grade-fail');
        }

        row.insertCell().textContent = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A';
    });

    container.innerHTML = '';
    container.appendChild(table);
}

export {
    renderKeyStats,
    renderSkills,
    renderRecentProgress
};