const { extendPoints } = require('./twopoints');

module.exports = {
    chaikin
};

function chaikin(arr, num) {
  if (num === 0) return arr;
  const l = arr.length;
  if (l > 2) {
  const smooth = arr.map((c,i) => {
    return [
      [0.75*c[0] + 0.25*arr[(i + 1)%l][0],0.75*c[1] + 0.25*arr[(i + 1)%l][1]],
      [0.25*c[0] + 0.75*arr[(i + 1)%l][0],0.25*c[1] + 0.75*arr[(i + 1)%l][1]]
    ];
  }).flat();
  if (num === 1) {
    smooth.push(smooth[0]);
    return smooth;
  } else return chaikin(smooth, num - 1);
  }
  else if (l == 2) {
    return chaikin(extendPoints(arr[0], arr[1]), num);
  }
  else return arr;
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

const points2 = [
[ -97.3880560, 19.8144440],
[ -97.3355560, 19.8438890],
[ -97.3601226, 19.8170336]
];

//const smoothed = chaikin(points2,2);
//console.log("Smoothed Points:", smoothed);

