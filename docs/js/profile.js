// docs/js/profile.js

(function () {
  const { executeQuery, queries } = window.GraphQL;
  const { logout } = window.API;
  const { renderXpOverTime, renderPassFailRatio } = window.Charts;

  const elements = {
    tagline: document.getElementById("user-tagline"),
    login: document.getElementById("profile-login"),
    campus: document.getElementById("profile-campus"),
    createdAt: document.getElementById("profile-created-at"),
    totalXp: document.getElementById("stat-total-xp"),
    auditRatio: document.getElementById("stat-audit-ratio"),
    auditUp: document.getElementById("stat-audit-up"),
    auditDown: document.getElementById("stat-audit-down"),
    passRate: document.getElementById("stat-pass-rate"),
    passCount: document.getElementById("stat-pass-count"),
    failCount: document.getElementById("stat-fail-count"),
    recentProjects: document.getElementById("recent-projects"),
    xpChart: document.getElementById("xp-chart"),
    passFailChart: document.getElementById("passfail-chart"),
    logoutBtn: document.getElementById("logout-btn"),
  };

  function formatDate(isoString) {
    if (!isoString) return "—";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatNumber(n) {
    return Number(n || 0).toLocaleString();
  }

  function computeTotalXp(xpRows) {
    return xpRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  }

  function computePassFail(results) {
    let pass = 0;
    let fail = 0;
    for (const row of results) {
      const grade = Number(row.grade) || 0;
      if (grade >= 1) pass++;
      else fail++;
    }
    const total = pass + fail;
    const rate = total > 0 ? Math.round((pass / total) * 100) : 0;
    return { pass, fail, rate };
  }

  function renderUserInfo(user) {
    if (!user) return;
    const campus = user.campus || "—";

    elements.login.textContent = user.login || "—";
    elements.campus.textContent = campus;
    elements.createdAt.textContent = formatDate(user.createdAt);
    elements.tagline.textContent = `${user.login} · ${campus}`;
  }

  function renderAuditInfo(user) {
    if (!user) return;
    const auditRatio = user.auditRatio ?? null;
    const totalUp = user.totalUp ?? null;
    const totalDown = user.totalDown ?? null;

    elements.auditRatio.textContent =
      auditRatio !== null ? auditRatio.toFixed(2) : "—";
    elements.auditUp.textContent =
      totalUp !== null ? formatNumber(totalUp) : "—";
    elements.auditDown.textContent =
      totalDown !== null ? formatNumber(totalDown) : "—";
  }

  function renderRecentProjects(xpRows) {
    const container = elements.recentProjects;
    container.innerHTML = "";

    if (!xpRows || xpRows.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No XP transactions yet.";
      container.appendChild(li);
      return;
    }

    // Latest first
    const byDateDesc = [...xpRows].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const slice = byDateDesc.slice(0, 6);
    slice.forEach((row) => {
      const li = document.createElement("li");
      li.className = "projects-list__item";

      const nameSpan = document.createElement("span");
      nameSpan.className = "projects-list__name";
      nameSpan.textContent = row.object?.name || row.path || "Unknown";

      const xpSpan = document.createElement("span");
      xpSpan.className = "projects-list__xp";
      xpSpan.textContent = `+${formatNumber(row.amount)} XP`;

      li.appendChild(nameSpan);
      li.appendChild(xpSpan);
      container.appendChild(li);
    });
  }

  async function loadProfile() {
    // If no JWT, graphql.js will redirect on first call, but we can be explicit too
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      window.location.href = "index.html";
      return;
    }

    try {
      // Fire requests in parallel
      const [userData, xpData, auditData, resultsData] = await Promise.all([
        executeQuery(queries.GET_USER_INFO),
        executeQuery(queries.GET_USER_XP),
        executeQuery(queries.GET_AUDIT_RATIO),
        executeQuery(queries.GET_USER_RESULTS),
      ]);

      const user = userData?.user?.[0] || null;
      const auditUser = auditData?.user?.[0] || null;
      const xpRows = xpData?.transaction || [];
      const results = resultsData?.result || [];

      // Render profile info
      renderUserInfo(user);
      renderAuditInfo(auditUser);
      renderRecentProjects(xpRows);

      // Stats
      const totalXp = computeTotalXp(xpRows);
      elements.totalXp.textContent = `${formatNumber(totalXp)} XP`;

      const { pass, fail, rate } = computePassFail(results);
      elements.passRate.textContent = `${rate}%`;
      elements.passCount.textContent = pass.toString();
      elements.failCount.textContent = fail.toString();

      // Charts
      renderXpOverTime(elements.xpChart, xpRows);
      renderPassFailRatio(elements.passFailChart, results);
    } catch (err) {
      console.error("Failed to load profile:", err);
      elements.tagline.textContent = "Error loading profile.";
    }
  }

  function setupLogout() {
    if (!elements.logoutBtn) return;
    elements.logoutBtn.addEventListener("click", () => {
      logout();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupLogout();
    loadProfile();
  });
})();