module.exports = {
    one2twoPoints
};

// A is the data point, B is the center of the hull
// P is the previous point in the hull
// Result is two points around A
function one2twoPoints(A, B, P, pad) {
    result = [];
    //const pad = 0.05; // 0.2 * lengthAB

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
    //const E = [B[0] - pad * unitAB[1], B[1] + pad * unitAB[0]];

    // Calculate the coordinates of point F
    //const F = [E[0] + AB[0], E[1] + AB[1]];
    //const F = [2*B[0] - E[0], 2*B[1] - E[1]];

    // Calculate the vector PC
    const PC = [C[0] - P[0], C[1] - P[1]];

    // Calculate the length of PC
    const lengthPC = Math.sqrt(PC[0] * PC[0] + PC[1] * PC[1]);

    // Calculate the vector PD
    const PD = [D[0] - P[0], D[1] - P[1]];

    // Calculate the length of PD
    const lengthPD = Math.sqrt(PD[0] * PD[0] + PD[1] * PD[1]);

    if (lengthPC < lengthPD) {
      result.push(C);
      result.push(D);
    }
    else {
      result.push(D);
      result.push(C);
    }
    return result;
}
/*
// Example usage:
const A = [0, 0];
const B = [3, 4];
const points = one2twoPoints(A, B);
console.log("Point C:", points.C);
console.log("Point D:", points.D);
*/
