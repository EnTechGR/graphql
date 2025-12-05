// SVG Charts Module

const CHART_CONFIG = {
  padding: 40,
  axisWidth: 2,
  tickSize: 5,
  font: "12px Arial",
  colors: {
    axis: "#333",
    grid: "#ddd",
    line: "#667eea",
    fill: "rgba(102, 126, 234, 0.2)",
    pass: "#48bb78",
    fail: "#f56565",
  },
};

/**
 * Create SVG element with specified dimensions
 */
function createSVG(width, height) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  return svg;
}

/**
 * Add text to SVG
 */
function addText(svg, x, y, text, options = {}) {
  const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
  textEl.setAttribute("x", x);
  textEl.setAttribute("y", y);
  textEl.setAttribute("font-family", "Arial, sans-serif");
  textEl.setAttribute("font-size", options.fontSize || "12px");
  textEl.setAttribute("fill", options.fill || "#333");
  textEl.setAttribute("text-anchor", options.anchor || "start");
  textEl.textContent = text;
  svg.appendChild(textEl);
  return textEl;
}

/**
 * Add line to SVG
 */
function addLine(svg, x1, y1, x2, y2, options = {}) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", options.stroke || "#999");
  line.setAttribute("stroke-width", options.width || 1);
  if (options.dasharray) {
    line.setAttribute("stroke-dasharray", options.dasharray);
  }
  svg.appendChild(line);
  return line;
}

/**
 * Add circle to SVG
 */
function addCircle(svg, cx, cy, r, options = {}) {
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", r);
  circle.setAttribute("fill", options.fill || "#667eea");
  circle.setAttribute("stroke", options.stroke || "none");
  svg.appendChild(circle);
  return circle;
}

/**
 * Add rectangle (for bar charts)
 */
function addRect(svg, x, y, width, height, options = {}) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", width);
  rect.setAttribute("height", height);
  rect.setAttribute("fill", options.fill || "#667eea");
  rect.setAttribute("stroke", options.stroke || "none");
  rect.setAttribute("rx", options.rx || 0);
  svg.appendChild(rect);
  return rect;
}

/**
 * Format large numbers
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Draw XP Progress Chart (Line Chart)
 */
function drawXPChart(containerId, transactions) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = container.clientWidth || 500;
  const height = 350;
  const padding = CHART_CONFIG.padding;

  // Group transactions by date and accumulate XP
  const xpByDate = {};
  let cumulativeXP = 0;

  transactions.forEach((tx) => {
    const date = new Date(tx.createdAt).toLocaleDateString();
    if (!xpByDate[date]) {
      xpByDate[date] = 0;
    }
    xpByDate[date] += tx.amount;
    cumulativeXP += tx.amount;
  });

  const dates = Object.keys(xpByDate).sort();
  const xpValues = [];
  let runningTotal = 0;
  dates.forEach((date) => {
    runningTotal += xpByDate[date];
    xpValues.push(runningTotal);
  });

  if (dates.length === 0) {
    container.innerHTML = "<p>No XP data available</p>";
    return;
  }

  const svg = createSVG(width, height);
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxXP = Math.max(...xpValues);
  const minXP = 0;

  // Draw grid lines and labels
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const y = height - padding - (chartHeight / ySteps) * i;
    const value = (maxXP / ySteps) * i;

    // Grid line
    addLine(svg, padding, y, width - padding, y, {
      stroke: CHART_CONFIG.colors.grid,
      width: 1,
      dasharray: "5,5",
    });

    // Y-axis label
    addText(svg, padding - 10, y + 4, formatNumber(value), {
      fontSize: "11px",
      anchor: "end",
      fill: "#666",
    });
  }

  // Draw axes
  addLine(svg, padding, height - padding, width - padding, height - padding, {
    stroke: CHART_CONFIG.colors.axis,
    width: CHART_CONFIG.axisWidth,
  });

  addLine(svg, padding, padding, padding, height - padding, {
    stroke: CHART_CONFIG.colors.axis,
    width: CHART_CONFIG.axisWidth,
  });

  // Draw line chart
  const points = [];
  dates.forEach((date, index) => {
    const x = padding + (chartWidth / (dates.length - 1 || 1)) * index;
    const y =
      height -
      padding -
      ((xpValues[index] - minXP) / (maxXP - minXP)) * chartHeight;
    points.push({ x, y, date, value: xpValues[index] });
  });

  // Draw line
  if (points.length > 1) {
    let pathData = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathData += ` L ${points[i].x} ${points[i].y}`;
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", CHART_CONFIG.colors.line);
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    svg.appendChild(path);

    // Draw fill area
    const fillPath =
      pathData +
      ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${
        height - padding
      } Z`;
    const fillArea = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    fillArea.setAttribute("d", fillPath);
    fillArea.setAttribute("fill", CHART_CONFIG.colors.fill);
    svg.appendChild(fillArea);
  }

  // Draw points and add tooltips
  points.forEach((point) => {
    const circle = addCircle(svg, point.x, point.y, 4, {
      fill: CHART_CONFIG.colors.line,
    });

    // Add tooltip
    circle.addEventListener("mouseenter", function () {
      this.setAttribute("r", 6);
      this.setAttribute("fill", "#764ba2");
    });

    circle.addEventListener("mouseleave", function () {
      this.setAttribute("r", 4);
      this.setAttribute("fill", CHART_CONFIG.colors.line);
    });
  });

  // X-axis labels (show every nth date to avoid crowding)
  const labelStep = Math.ceil(dates.length / 5);
  dates.forEach((date, index) => {
    if (index % labelStep === 0 || index === dates.length - 1) {
      const x = padding + (chartWidth / (dates.length - 1 || 1)) * index;
      addText(svg, x, height - padding + 20, formatDate(date), {
        fontSize: "10px",
        anchor: "middle",
        fill: "#666",
      });
    }
  });

  // Y-axis label
  addText(svg, 10, padding - 10, "XP", { fontSize: "12px", fill: "#333" });

  // X-axis label
  addText(svg, width - padding + 20, height - 15, "Date", {
    fontSize: "12px",
    fill: "#333",
  });

  container.innerHTML = "";
  container.appendChild(svg);
}

/**
 * Draw Pass/Fail Ratio Chart (Pie Chart)
 */
function drawPassFailChart(containerId, results) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const width = container.clientWidth || 500;
  const height = 350;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 3;

  // Count passes and fails
  let passCount = 0;
  let failCount = 0;

  results.forEach((result) => {
    if (result.grade >= 1) {
      passCount++;
    } else {
      failCount++;
    }
  });

  const total = passCount + failCount;
  if (total === 0) {
    container.innerHTML = "<p>No project data available</p>";
    return;
  }

  const passPercentage = (passCount / total) * 100;
  const failPercentage = (failCount / total) * 100;

  const svg = createSVG(width, height);

  // Draw pie slices
  const passAngle = (passPercentage / 100) * 2 * Math.PI;
  const failAngle = (failPercentage / 100) * 2 * Math.PI;

  // Pass slice (green)
  const passEndX = centerX + radius * Math.cos(passAngle - Math.PI / 2);
  const passEndY = centerY + radius * Math.sin(passAngle - Math.PI / 2);
  const passLargeArc = passAngle > Math.PI ? 1 : 0;

  const passPath = `
        M ${centerX} ${centerY}
        L ${centerX} ${centerY - radius}
        A ${radius} ${radius} 0 ${passLargeArc} 1 ${passEndX} ${passEndY}
        Z
    `;

  const passSlice = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  passSlice.setAttribute("d", passPath);
  passSlice.setAttribute("fill", CHART_CONFIG.colors.pass);
  passSlice.setAttribute("stroke", "white");
  passSlice.setAttribute("stroke-width", 2);
  svg.appendChild(passSlice);

  // Fail slice (red)
  const failStartX = passEndX;
  const failStartY = passEndY;
  const failEndX = centerX + radius * Math.cos(2 * Math.PI - Math.PI / 2);
  const failEndY = centerY + radius * Math.sin(2 * Math.PI - Math.PI / 2);

  const failPath = `
        M ${centerX} ${centerY}
        L ${failStartX} ${failStartY}
        A ${radius} ${radius} 0 ${
    failAngle > Math.PI ? 1 : 0
  } 1 ${failEndX} ${failEndY}
        Z
    `;

  const failSlice = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  failSlice.setAttribute("d", failPath);
  failSlice.setAttribute("fill", CHART_CONFIG.colors.fail);
  failSlice.setAttribute("stroke", "white");
  failSlice.setAttribute("stroke-width", 2);
  svg.appendChild(failSlice);

  // Add percentage labels
  const passLabelAngle = passAngle / 2 - Math.PI / 2;
  const passLabelX = centerX + radius * 0.7 * Math.cos(passLabelAngle);
  const passLabelY = centerY + radius * 0.7 * Math.sin(passLabelAngle);

  addText(svg, passLabelX, passLabelY, `${passPercentage.toFixed(1)}%`, {
    fontSize: "14px",
    anchor: "middle",
    fill: "white",
    fontWeight: "bold",
  });

  const failLabelAngle = passAngle + failAngle / 2 - Math.PI / 2;
  const failLabelX = centerX + radius * 0.7 * Math.cos(failLabelAngle);
  const failLabelY = centerY + radius * 0.7 * Math.sin(failLabelAngle);

  addText(svg, failLabelX, failLabelY, `${failPercentage.toFixed(1)}%`, {
    fontSize: "14px",
    anchor: "middle",
    fill: "white",
    fontWeight: "bold",
  });

  // Add legend
  const legendX = 20;
  const legendY = height - 60;

  addRect(svg, legendX, legendY, 15, 15, { fill: CHART_CONFIG.colors.pass });
  addText(svg, legendX + 25, legendY + 12, `Pass (${passCount})`, {
    fontSize: "12px",
    fill: "#333",
  });

  addRect(svg, legendX, legendY + 25, 15, 15, {
    fill: CHART_CONFIG.colors.fail,
  });
  addText(svg, legendX + 25, legendY + 37, `Fail (${failCount})`, {
    fontSize: "12px",
    fill: "#333",
  });

  container.innerHTML = "";
  container.appendChild(svg);
}
