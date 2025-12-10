// docs/js/charts.js

(function () {
  function clearSvg(svg) {
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
  }

  function showEmptyState(svg, message) {
    clearSvg(svg);
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "50");
    text.setAttribute("y", "30");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("class", "chart__label");
    text.textContent = message;
    svg.appendChild(text);
  }

  /**
   * Render cumulative XP over time as a line chart
   * @param {SVGElement} svg
   * @param {Array<{amount:number, createdAt:string, object:{name:string,type:string}}>} xpRows
   */
  function renderXpOverTime(svg, xpRows) {
    if (!svg) return;

    if (!xpRows || xpRows.length === 0) {
      showEmptyState(svg, "No XP data yet");
      return;
    }

    clearSvg(svg);

    // Reverse because query is desc
    const rows = [...xpRows].reverse();

    const values = [];
    let cumulative = 0;
    for (const row of rows) {
      const amount = Number(row.amount) || 0;
      cumulative += amount;
      values.push({
        date: new Date(row.createdAt),
        cumulative,
      });
    }

    const maxValue = values.reduce(
      (max, p) => (p.cumulative > max ? p.cumulative : max),
      0,
    );

    if (maxValue === 0) {
      showEmptyState(svg, "XP data is zero");
      return;
    }

    const width = 100;
    const height = 60;
    const marginLeft = 6;
    const marginRight = 3;
    const marginTop = 4;
    const marginBottom = 7;

    const innerWidth = width - marginLeft - marginRight;
    const innerHeight = height - marginTop - marginBottom;

    const n = values.length;
    const stepX = n > 1 ? innerWidth / (n - 1) : 0;

    // Axes
    const axisX = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    axisX.setAttribute("x1", marginLeft);
    axisX.setAttribute("y1", height - marginBottom);
    axisX.setAttribute("x2", width - marginRight);
    axisX.setAttribute("y2", height - marginBottom);
    axisX.setAttribute("class", "chart__axis");
    svg.appendChild(axisX);

    const axisY = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    axisY.setAttribute("x1", marginLeft);
    axisY.setAttribute("y1", marginTop);
    axisY.setAttribute("x2", marginLeft);
    axisY.setAttribute("y2", height - marginBottom);
    axisY.setAttribute("class", "chart__axis");
    svg.appendChild(axisY);

    // Horizontal grid at 0%, 50%, 100%
    [0, 0.5, 1].forEach((p) => {
      const y =
        marginTop + innerHeight - innerHeight * p; // from bottom up for 0,50,100
      const gridLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      gridLine.setAttribute("x1", marginLeft);
      gridLine.setAttribute("y1", y.toString());
      gridLine.setAttribute("x2", width - marginRight);
      gridLine.setAttribute("y2", y.toString());
      gridLine.setAttribute("class", "chart__grid");
      svg.appendChild(gridLine);
    });

    // Line path & shaded area
    let dLine = "";
    let dArea = `M ${marginLeft} ${height - marginBottom}`;
    values.forEach((point, index) => {
      const x = marginLeft + stepX * index;
      const norm = point.cumulative / maxValue;
      const y = marginTop + (1 - norm) * innerHeight;

      dLine += index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      dArea += ` L ${x} ${y}`;
    });
    dArea += ` L ${
      marginLeft + stepX * (values.length - 1)
    } ${height - marginBottom} Z`;

    const areaPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    areaPath.setAttribute("d", dArea);
    areaPath.setAttribute("class", "chart__area");
    areaPath.setAttribute("fill", "#4f46e5");
    areaPath.setAttribute("fill-opacity", "0.2");
    svg.appendChild(areaPath);

    const linePath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    linePath.setAttribute("d", dLine);
    linePath.setAttribute("class", "chart__line");
    linePath.setAttribute("stroke", "#a5b4fc");
    svg.appendChild(linePath);

    // Label max value
    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    label.setAttribute("x", width - marginRight);
    label.setAttribute("y", marginTop + 4);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("class", "chart__label");
    label.textContent = `${maxValue.toLocaleString()} XP`;
    svg.appendChild(label);
  }

  /**
   * Render simple pass/fail bar chart.
   * @param {SVGElement} svg
   * @param {Array<{grade:number}>} results
   */
  function renderPassFailRatio(svg, results) {
    if (!svg) return;

    if (!results || results.length === 0) {
      showEmptyState(svg, "No results yet");
      return;
    }

    clearSvg(svg);

    let passCount = 0;
    let failCount = 0;

    for (const row of results) {
      const grade = Number(row.grade) || 0;
      if (grade >= 1) {
        passCount++;
      } else {
        failCount++;
      }
    }

    const total = passCount + failCount;
    if (total === 0) {
      showEmptyState(svg, "No graded results");
      return;
    }

    const passRatio = passCount / total;
    const failRatio = failCount / total;

    const width = 100;
    const height = 60;
    const margin = 10;
    const innerWidth = width - margin * 2;
    const innerHeight = height - margin * 2;

    // Axis line
    const axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    axis.setAttribute("x1", margin);
    axis.setAttribute("y1", height - margin);
    axis.setAttribute("x2", width - margin);
    axis.setAttribute("y2", height - margin);
    axis.setAttribute("class", "chart__axis");
    svg.appendChild(axis);

    const maxBarHeight = innerHeight - 10; // leave some space

    const passHeight = maxBarHeight * passRatio;
    const failHeight = maxBarHeight * failRatio;

    const barWidth = innerWidth / 4;
    const passX = margin + innerWidth / 4 - barWidth / 2;
    const failX = margin + (3 * innerWidth) / 4 - barWidth / 2;
    const baseY = height - margin;

    // Pass bar
    const passBar = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    passBar.setAttribute("x", passX.toString());
    passBar.setAttribute("y", (baseY - passHeight).toString());
    passBar.setAttribute("width", barWidth.toString());
    passBar.setAttribute("height", passHeight.toString());
    passBar.setAttribute("class", "chart__bar");
    passBar.setAttribute("fill", "#22c55e");
    svg.appendChild(passBar);

    // Fail bar
    const failBar = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    failBar.setAttribute("x", failX.toString());
    failBar.setAttribute("y", (baseY - failHeight).toString());
    failBar.setAttribute("width", barWidth.toString());
    failBar.setAttribute("height", failHeight.toString());
    failBar.setAttribute("class", "chart__bar");
    failBar.setAttribute("fill", "#ef4444");
    svg.appendChild(failBar);

    // Labels
    const passLabel = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    passLabel.setAttribute("x", (passX + barWidth / 2).toString());
    passLabel.setAttribute("y", (baseY + 4).toString());
    passLabel.setAttribute("text-anchor", "middle");
    passLabel.setAttribute("class", "chart__label");
    passLabel.textContent = "PASS";
    svg.appendChild(passLabel);

    const failLabel = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    failLabel.setAttribute("x", (failX + barWidth / 2).toString());
    failLabel.setAttribute("y", (baseY + 4).toString());
    failLabel.setAttribute("text-anchor", "middle");
    failLabel.setAttribute("class", "chart__label");
    failLabel.textContent = "FAIL";
    svg.appendChild(failLabel);

    // Percent labels on top of bars
    const passPercent = Math.round(passRatio * 100);
    const failPercent = Math.round(failRatio * 100);

    const passValueLabel = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    passValueLabel.setAttribute("x", (passX + barWidth / 2).toString());
    passValueLabel.setAttribute("y", (baseY - passHeight - 2).toString());
    passValueLabel.setAttribute("text-anchor", "middle");
    passValueLabel.setAttribute("class", "chart__label");
    passValueLabel.textContent = `${passPercent}%`;
    svg.appendChild(passValueLabel);

    const failValueLabel = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    failValueLabel.setAttribute("x", (failX + barWidth / 2).toString());
    failValueLabel.setAttribute("y", (baseY - failHeight - 2).toString());
    failValueLabel.setAttribute("text-anchor", "middle");
    failValueLabel.setAttribute("class", "chart__label");
    failValueLabel.textContent = `${failPercent}%`;
    svg.appendChild(failValueLabel);
  }

  window.Charts = {
    renderXpOverTime,
    renderPassFailRatio,
  };
})();