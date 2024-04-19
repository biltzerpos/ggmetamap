const { one2twoPoints } = require('./one2twopoints');

module.exports = {
    extendHull
};

function extendHull(arr, x, y, pushAmount, padAmount) {
  if (arr.length == 1) return arr;
  let result = [];
  //const offset = 0.03;
  for (let point = 0; point < arr.length; point++)
  {
    console.log(arr);
    console.log(arr[point]);
    let diffx = arr[point][0] - x;
    let diffy = arr[point][1] - y;
    let diff1x = arr[point][0] - arr[(Number(point)+arr.length-1)%arr.length][0];
    let diff1y = arr[point][1] - arr[(Number(point)+arr.length-1)%arr.length][1];
    let diff2x = arr[point][0] - arr[(Number(point)+1)%arr.length][0];
    let diff2y = arr[point][1] - arr[(Number(point)+1)%arr.length][1];
    let dist1 = Math.sqrt(diff1x * diff1x + diff1y * diff1y);
    let dist2 = Math.sqrt(diff2x * diff2x + diff2y * diff2y);
    let offset = pushAmount * (dist1 + dist2);
    //if (arr.length == 2) offset = 0.03; 
    let factor = Math.sqrt(1 + offset / (diffx * diffx + diffy * diffy));
    let newx = x + diffx * factor;
    let newy = y + diffy * factor;
    console.log(newx);
    console.log(newy);
    let prevpoint = arr[(Number(point)+arr.length-1)%arr.length];
    let twofer = one2twoPoints([newx,newy],[x,y], prevpoint, padAmount);
    //let twofer = one2twoPoints(arr[point],[x,y], prevpoint);
    //result.push([newx,newy]);
    result.push(twofer);
  }
  return result.flat();
}

// Example usage
const points = [
[0,0],
[0,2],
[2,2],
[2,0]
  ];

//const smoothed = extendHull(points,1,1);
//console.log("Extended Points:", smoothed);

