// js/charting-progress.js
// Progress Trend Chart Generation using amCharts 5

import { GRAPH_HEIGHT } from './config.js';

/**
 * Generates a progress trend scatter plot chart using amCharts 5
 * Displays grade progression over time with interactive tooltips
 * @param {Array} progressData - Array of progress records with grade and date information
 */
function generateProgressAreaChart(progressData) { 
    const am5 = window.am5;
    const am5xy = window.am5xy;
    const am5themes_Animated = window.am5themes_Animated;

    if (!am5 || !am5xy) {
        console.error("amCharts 5 libraries are not loaded. Check your index.html script order.");
        return;
    }

    // Prepare data: filter for passed projects and sort by date
    const amChartData = progressData
        .filter(p => p.grade >= 1 && p.path)
        .map(p => ({
            date: new Date(p.createdAt).getTime(),
            grade: p.grade,
            gradePercentage: (p.grade * 100).toFixed(0),
            object: p.object?.name || 'Unknown'
        }))
        .sort((a, b) => a.date - b.date); // strictly ascending

    const container = document.getElementById('progressChartContainer');
    container.innerHTML = ''; 
    container.style.height = `${GRAPH_HEIGHT}px`; 
    container.classList.add('graph-card'); 

    if (amChartData.length < 1) {
        container.innerHTML = `<p class="detail-text" style="padding: 20px;">Not enough progress data to display.</p>`;
        return;
    }

    // Create Root and Theme
    if (container.chartRoot) {
        container.chartRoot.dispose();
    }
    const root = am5.Root.new(container);
    container.chartRoot = root;

    root.setThemes([am5themes_Animated.new(root)]);
    root.interfaceColors.set("text", am5.color(0x333333)); 

    // Create Chart
    const chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomY", 
        pinchZoomX: true
    }));

    // Create X-axis (Date Axis)
    const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
        maxDeviation: 0.1,
        baseInterval: {
            timeUnit: "day",
            count: 1
        },
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {})
    }));
    
    // Configure X-axis labels
    xAxis.get("renderer").labels.template.setAll({
        rotation: -45,
        textAlign: "end",
    });
    
    // Create Y-axis (Value Axis for Grade)
    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
        min: 0.8, 
        max: 3.0 
    }));
    
    // Format Y-axis labels as percentage
    yAxis.get("renderer").labels.template.set("text", "{value.format(2)}%");

    // Create Series (Scatter Plot)
    const series = chart.series.push(am5xy.XYSeries.new(root, {
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: "date",
        valueYField: "grade",
        tooltip: am5.Tooltip.new(root, {})
    }));

    // Customize data points (make them circles/bullets)
    series.bullets.push(function() {
        const circle = am5.Circle.new(root, {
            radius: 5,
            fill: series.get("fill"),
            interactive: true,
            cursorOverStyle: "pointer"
        });

        // Attach tooltip to each bullet
        circle.set("tooltipText", "[bold]{object}[/]\nGrade: {gradePercentage}% \nDate: {date.formatDate('yyyy-MM-dd')}");
        
        return am5.Bullet.new(root, {
            sprite: circle
        });
    });

    // Set data and finalize
    series.data.setAll(amChartData);
    
    // Add Scrollbars 
    chart.set("scrollbarX", am5.Scrollbar.new(root, {
        orientation: "horizontal"
    }));
    
    series.appear(1000);
    chart.appear(1000, 100);
}

export { generateProgressAreaChart };