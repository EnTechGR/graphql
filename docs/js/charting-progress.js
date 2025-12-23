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
        .map(p => {
            const gradeVal = p.grade ?? 0; // Defensive null check
            return {
                date: new Date(p.createdAt).getTime(),
                grade: gradeVal,
                // Changed from percentage to decimal string
                gradeDecimal: gradeVal.toFixed(2), 
                object: p.object?.name || 'Unknown'
            };
        })
        .sort((a, b) => a.date - b.date); 

    const container = document.getElementById('progressChartContainer');
    if (!container) return;

    container.innerHTML = ''; 
    container.style.height = `${GRAPH_HEIGHT}px`; 
    container.classList.add('graph-card'); 

    if (amChartData.length < 1) {
        container.innerHTML = `<p class="detail-text" style="padding: 20px;">Not enough progress data to display.</p>`;
        return;
    }

    if (container.chartRoot) {
        container.chartRoot.dispose();
    }
    const root = am5.Root.new(container);
    container.chartRoot = root;

    root.setThemes([am5themes_Animated.new(root)]);
    root.interfaceColors.set("text", am5.color(0x333333)); 

    const chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomY", 
        pinchZoomX: true
    }));

    const xAxis = chart.xAxes.push(am5xy.DateAxis.new(root, {
        maxDeviation: 0.1,
        baseInterval: {
            timeUnit: "day",
            count: 1
        },
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {})
    }));
    
    xAxis.get("renderer").labels.template.setAll({
        rotation: -45,
        textAlign: "end",
    });
    
    const yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
        min: 0.8, 
        max: 3.0 
    }));
    
    // Removed the '%' suffix from Y-axis labels
    yAxis.get("renderer").labels.template.set("text", "{value.formatNumber('#.00')}");

    const series = chart.series.push(am5xy.XYSeries.new(root, {
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: "date",
        valueYField: "grade",
        tooltip: am5.Tooltip.new(root, {})
    }));

    series.bullets.push(function() {
        const circle = am5.Circle.new(root, {
            radius: 5,
            fill: series.get("fill"),
            interactive: true,
            cursorOverStyle: "pointer"
        });

        // Updated tooltip to show decimal grade instead of percentage
        circle.set("tooltipText", "[bold]{object}[/]\nGrade: {gradeDecimal}\nDate: {date.formatDate('yyyy-MM-dd')}");
        
        return am5.Bullet.new(root, {
            sprite: circle
        });
    });

    series.data.setAll(amChartData);
    
    chart.set("scrollbarX", am5.Scrollbar.new(root, {
        orientation: "horizontal"
    }));
    
    series.appear(1000);
    chart.appear(1000, 100);
}

export { generateProgressAreaChart };