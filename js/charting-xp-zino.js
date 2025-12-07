// js/charting-xp-zino.js
// "Zino" SVG cumulative XP diagram with optional date-range filtering
// Exports: async function generateUserXPZinoChart(userId, options = {})
// Usage: import { generateUserXPZinoChart } from './charting-xp-zino.js';
// Then call generateUserXPZinoChart(userId, { fromDate: '2024-01-01', toDate: '2024-12-31' })

import { createGraphCard } from './config.js';

function formatDateShort(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function generateUserXPZinoChart(userId, options = {}) {
  // options: { fromDate: 'YYYY-MM-DD', toDate: 'YYYY-MM-DD', width, height }
  const WIDTH = options.width || 800;
  const HEIGHT = options.height || 320;
  const PADDING = 56; // space for axis ticks & labels

  // Fetch XP transactions (uses global GraphQL defined elsewhere)
  const xpData = await window.GraphQL.executeQuery(window.GraphQL.queries.GET_USER_XP);

  if (!xpData?.transaction?.length) {
    return createGraphCard(
      'Cumulative XP Over Time (Zino)',
      '<p class="detail-text">No XP data available.</p>'
    );
  }

  // Map and filter by userId if transactions include userId (some backends return all users)
  // We'll filter by options.date range as well
  const raw = xpData.transaction
    .filter(t => t.amount > 0 && t.object)
    .map(t => ({
      date: new Date(t.createdAt),
      xp: Number(t.amount),
      label: t.object?.name || 'Unknown'
    }))
    .sort((a, b) => a.date - b.date);

  // Optional date range
  let from = options.fromDate ? new Date(options.fromDate) : null;
  let to = options.toDate ? new Date(options.toDate) : null;

  if (from && isNaN(from)) from = null;
  if (to && isNaN(to)) to = null;

  let filtered = raw;
  if (from) filtered = filtered.filter(r => r.date >= from);
  if (to) filtered = filtered.filter(r => r.date <= to);

  if (filtered.length === 0) {
    return createGraphCard(
      'Cumulative XP Over Time (Zino)',
      '<p class="detail-text">No XP data in the selected date range.</p>'
    );
  }

  // Build cumulative data
  let cumulative = 0;
  const cumulativeData = filtered.map(pt => {
    cumulative += pt.xp;
    return { ...pt, cumulativeXP: cumulative };
  });

  const totalXP = cumulativeData[cumulativeData.length - 1].cumulativeXP;

  // Scales (use timestamps for x)
  const minTime = cumulativeData[0].date.getTime();
  const maxTime = cumulativeData[cumulativeData.length - 1].date.getTime();
  const xScale = (time) => PADDING + ((time - minTime) / (maxTime - minTime || 1)) * (WIDTH - 2 * PADDING);
  const yScale = (xp) => HEIGHT - PADDING - ((xp / totalXP) * (HEIGHT - 2 * PADDING));

  // Create SVG content string (we'll later attach DOM events to the returned card)
  // Use viewBox to make it responsive when the card is resized
  let svg = `
    <svg viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Cumulative XP over time">
      <defs>
        <linearGradient id="zinoGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-opacity="0.35" stop-color="#4a90e2" />
          <stop offset="100%" stop-opacity="0.05" stop-color="#4a90e2" />
        </linearGradient>
      </defs>

      <!-- Axes -->
      <g class="axes" fill="none" stroke="#ccc" stroke-width="1">
        <line x1="${PADDING}" y1="${HEIGHT - PADDING}" x2="${WIDTH - PADDING}" y2="${HEIGHT - PADDING}" />
        <line x1="${PADDING}" y1="${HEIGHT - PADDING}" x2="${PADDING}" y2="${PADDING}" />
      </g>

      <!-- Y ticks & labels -->
  `;

  // Y ticks: 4 ticks (0, 25%, 50%, 100%)
  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  yTicks.forEach(t => {
    const y = yScale(totalXP * t);
    const val = Math.round(totalXP * t);
    svg += `<g class="ytick"><line x1="${PADDING - 6}" y1="${y}" x2="${PADDING}" y2="${y}" stroke="#ddd"/>`;
    svg += `<text x="${PADDING - 10}" y="${y + 4}" font-size="10" text-anchor="end" fill="#333">${val}</text></g>`;
  });

  // X ticks: choose up to 6 ticks evenly
  const maxXTicks = 6;
  const timeSpan = maxTime - minTime || 1;
  const xTickCount = Math.min(maxXTicks, cumulativeData.length);
  for (let i = 0; i < xTickCount; i++) {
    const idx = Math.floor((i / (xTickCount - 1 || 1)) * (cumulativeData.length - 1));
    const pt = cumulativeData[idx];
    const x = xScale(pt.date.getTime());
    svg += `<text x="${x}" y="${HEIGHT - PADDING + 18}" font-size="10" text-anchor="middle" fill="#333">${formatDateShort(pt.date)}</text>`;
  }

  // Build area path
  let areaPath = '';
  cumulativeData.forEach((pt, i) => {
    const x = xScale(pt.date.getTime());
    const y = yScale(pt.cumulativeXP);
    if (i === 0) {
      areaPath += `M ${x} ${HEIGHT - PADDING} L ${x} ${y}`;
    } else {
      areaPath += ` L ${x} ${y}`;
    }
  });
  const lastX = xScale(cumulativeData[cumulativeData.length - 1].date.getTime());
  areaPath += ` L ${lastX} ${HEIGHT - PADDING} Z`;

  svg += `
      <path class="zino-area" d="${areaPath}" fill="url(#zinoGradient)" stroke="#4a90e2" stroke-width="2" />
  `;

  // Add polylines (line on top of area)
  let linePath = '';
  cumulativeData.forEach((pt, i) => {
    const x = xScale(pt.date.getTime());
    const y = yScale(pt.cumulativeXP);
    linePath += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  });
  svg += `<path d="${linePath}" fill="none" stroke="#2b6fb2" stroke-width="2" />`;

  // Add circles for points with data attributes for tooltip
  cumulativeData.forEach(pt => {
    const cx = xScale(pt.date.getTime());
    const cy = yScale(pt.cumulativeXP);
    svg += `<circle class="zino-point" cx="${cx}" cy="${cy}" r="4" fill="#2b6fb2" data-label="${escapeHtml(pt.label)}" data-date="${formatDateShort(pt.date)}" data-xp="${pt.cumulativeXP}" />`;
  });

  svg += `</svg>`;

  // Create card using existing helper and then attach interactivity
  const card = createGraphCard('Cumulative XP Over Time (Zino)', svg);

  // Add a simple tooltip element inside the card
  const tooltip = document.createElement('div');
  tooltip.className = 'zino-tooltip';
  tooltip.style.cssText = 'position:absolute;pointer-events:none;padding:6px 8px;border-radius:6px;background:rgba(0,0,0,0.75);color:#fff;font-size:12px;display:none;z-index:10;white-space:nowrap;';
  card.style.position = 'relative';
  card.appendChild(tooltip);

  // Attach event listeners to circles after the DOM is ready (card not yet appended is fine)
  // Use a small timeout to ensure innerHTML is parsed in createGraphCard
  setTimeout(() => {
    const svgEl = card.querySelector('svg');
    if (!svgEl) return;

    const points = svgEl.querySelectorAll('.zino-point');
    points.forEach(ptEl => {
      ptEl.addEventListener('mouseenter', (ev) => {
        const lbl = ptEl.getAttribute('data-label');
        const date = ptEl.getAttribute('data-date');
        const xp = ptEl.getAttribute('data-xp');
        tooltip.innerHTML = `${escapeHtml(lbl)}<br/><strong>${xp} XP</strong><br/>${date}`;
        tooltip.style.display = 'block';
      });
      ptEl.addEventListener('mousemove', (ev) => {
        // Position tooltip near cursor within card bounds
        const rect = card.getBoundingClientRect();
        const left = ev.clientX - rect.left + 12;
        const top = ev.clientY - rect.top + 12;
        tooltip.style.left = Math.min(left, rect.width - 120) + 'px';
        tooltip.style.top = top + 'px';
      });
      ptEl.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
    });
  }, 20);

  return card;
}

// small helper to escape strings embedded in attributes
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export { generateUserXPZinoChart };
