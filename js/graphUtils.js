// This file is for reusable graph-specific math/SVG helpers

/**
 * Helper to convert polar coordinates to cartesian (for Donut Chart).
 * @param {number} centerX - X coordinate of the center.
 * @param {number} centerY - Y coordinate of the center.
 * @param {number} radius - Radius of the circle.
 * @param {number} angleInDegrees - Angle to convert (0 is right, 90 is top).
 * @returns {{x: number, y: number}} - Cartesian coordinates.
 */
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

/**
 * Function to calculate SVG path for an arc (for Donut Chart).
 * @param {number} x - Center X.
 * @param {number} y - Center Y.
 * @param {number} radius - Arc radius.
 * @param {number} startAngle - Start angle in degrees.
 * @param {number} endAngle - End angle in degrees.
 * @returns {string} - SVG path 'd' attribute string.
 */
function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const sweepAngle = endAngle - startAngle;
    const largeArcFlag = sweepAngle <= 180 ? '0' : '1';
    
    if (sweepAngle >= 360) {
         return `M ${x - radius} ${y} A ${radius} ${radius} 0 1 0 ${x + radius} ${y} A ${radius} ${radius} 0 1 0 ${x - radius} ${y} Z`;
    }

    return [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
}

export { 
    polarToCartesian, 
    describeArc 
};