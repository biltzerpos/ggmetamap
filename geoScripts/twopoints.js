module.exports = {
    extendPoints
};

function extendPoints(A, B) {
    result = [];
    const pad = 0.05; // 0.2 * lengthAB

    // Calculate the vector AB
    const AB = [B[0] - A[0], B[1] - A[1]];

    // Calculate the length of AB
    const lengthAB = Math.sqrt(AB[0] * AB[0] + AB[1] * AB[1]);

    // Calculate the unit vector of AB
    const unitAB = [AB[0] / lengthAB, AB[1] / lengthAB];

    // Calculate the coordinates of point C
    const C = [A[0] + pad * unitAB[1], A[1] - pad * unitAB[0]];

    // Calculate the coordinates of point D
    //const D = [C[0] - AB[0], C[1] - AB[1]];
    const D = [2*A[0] - C[0], 2*A[1] - C[1]];

    // Calculate the coordinates of point E
    const E = [B[0] - pad * unitAB[1], B[1] + pad * unitAB[0]];

    // Calculate the coordinates of point F
    //const F = [E[0] + AB[0], E[1] + AB[1]];
    const F = [2*B[0] - E[0], 2*B[1] - E[1]];

    result.push(C);
    result.push(D);
    result.push(E);
    result.push(F);
    return result;
}
/*
// Example usage:
const A = [0, 0];
const B = [3, 4];
const points = extendPoints(A, B);
console.log("Point C:", points.C);
console.log("Point D:", points.D);
console.log("Point E:", points.E);
console.log("Point F:", points.F);
*/
