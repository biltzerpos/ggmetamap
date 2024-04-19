module.exports = {
    convexHull
};

// Function to calculate the cross product of three points
function crossProduct(p1, p2, p3) {
    return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p3[0] - p1[0]) * (p2[1] - p1[1]);
}

// Function to determine if a point is to the left of a line segment
function isLeftTurn(p1, p2, p3) {
    return crossProduct(p1, p2, p3) > 0;
}

// Function to find the convex hull using the Graham scan algorithm
function convexHull(points) {
    if (points.length < 3) return points;

    // Sort points by x-coordinate (leftmost point comes first)
    points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    // Initialize stack to store convex hull points
    const stack = [];

    // Build lower hull
    for (let i = 0; i < points.length; i++) {
        while (stack.length >= 2 && !isLeftTurn(stack[stack.length - 2], stack[stack.length - 1], points[i])) {
            stack.pop();
        }
        stack.push(points[i]);
    }

    // Build upper hull
    const upperHullStartIndex = stack.length + 1;
    for (let i = points.length - 2; i >= 0; i--) {
        while (stack.length >= upperHullStartIndex && !isLeftTurn(stack[stack.length - 2], stack[stack.length - 1], points[i])) {
            stack.pop();
        }
        stack.push(points[i]);
    }

    // Remove duplicate points
    stack.pop();
    //Close the hull by repeating first point
    stack.push(stack[0]);
    return stack;
}

// Example usage
const points = [
    [ 19.0437196, -98.1981486 ],
    [ 19.0446393, -98.0440666 ],
    [ 19.0061111, -98.3305556 ],
    [ 19.0678244, -98.3106315 ],
    [ 19.168611, -98.203889 ],
    [ 18.9024652, -98.2549921 ],
    [ 19.0519385, -98.2976151 ],
    [ 18.908889, -98.176389 ],
    [ 19.0897222, -98.2725 ],
    [ 19.0390808, -98.3385842 ],
    [ 18.9775, -98.396944 ],
    [ 19.151944, -98.103056 ],
    [ 19.169167, -98.308889 ],
    [ 18.942778, -98.156111 ],
    [ 18.976944, -98.301389 ],
    [ 18.996667, -98.379444 ],
    [ 19.1322222, -98.3069444 ],
    [ 18.943056, -98.301667 ],
    [ 19.089444, -98.103611 ],
    [ 18.965833, -98.153056 ],
    [ 19.171389, -98.345556 ]
  ];


//const convexHullPoints = convexHull(points);
//console.log("Convex Hull Points:", convexHullPoints);

