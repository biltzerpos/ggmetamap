const fs = require('fs');
//let Decimate = require('decimate');
const turf = require('@turf/turf');

let data = fs.readFileSync(process.argv[2], 'utf8');
let geojson = JSON.parse(data);  // Parse the JSON string into an object
//console.log(geojson);

const tolerance = Number(process.argv[4]);  // Tolerance value (higher = more simplification)
const simplified = turf.simplify(geojson, { tolerance, highQuality: false });

//console.log(simplified);

//let d = new Decimate(null, null);
//console.log(d);
//let simplified = d.decimateRadialDistance(geojson, 1);

//console.log(simplified);
fs.writeFile(process.argv[3], JSON.stringify(simplified, null, 2), 'utf8', (err) => {
  if (err) {
    console.error("Error writing to file:", err);
  } else {
    console.log("File has been saved!");
  }
});
