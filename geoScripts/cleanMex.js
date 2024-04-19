const fs = require('fs');
//const { convexHull } = require('./hull');
//const { generateGeoJSONFromCoordinates } = require('./geojson');
//const { chaikin } = require('./chaikin');
//const { extendHull } = require('./extendHull');


// Function to read file line by line and store lines in an array
function readFileLinesToArray(filename) {
    return new Promise((resolve, reject) => {
        const lines = [];
        const readStream = fs.createReadStream(filename, { encoding: 'utf8' });

        readStream.on('data', chunk => {
            lines.push(...chunk.split('\n'));
        });

        readStream.on('end', () => {
            resolve(lines);
        });

        readStream.on('error', err => {
            reject(err);
        });
    });
}

function writeJSONObjectsToFile(jsonArray, filename) {
    return new Promise((resolve, reject) => {
        //const data = jsonArray.map(obj => JSON.stringify(obj)).join('\n');
        const data = JSON.stringify(jsonArray, null, 2);
        fs.writeFile(filename, data, { encoding: 'utf8' }, err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function writeStringToFile(data, fileName) {
    fs.writeFileSync(fileName, data, 'utf8');
    console.log(`Geojson info has been written to ${fileName}`);
}

// Create an object to store the mapping and the hulled mapping
//const coordinateMapping = {};
//const hullMapping = {};
//const chaikinMapping = {};
//const extendedHullMapping = {};

// Function to add coordinates to the mapping
//function addCoordinates(key, coordinates) {
//    if (!coordinateMapping[key]) {
//        coordinateMapping[key] = [];
//    }
//    coordinateMapping[key].push(coordinates);
//}

function startsWithLetter(str) {
    return /^[A-Za-z]/.test(str);
}

// Example usage
//addCoordinates('location1', [10, 20]);
//console.log(coordinateMapping['location1']); 

// Code start
const filename = 'input.txt'; // Change this to your input file name

readFileLinesToArray(filename)
    .then(lines => {
        let markerObjects = [];
        let tracking = [];
        for (let i = 0; i < lines.length; i = i + 1) {
            //console.log(lines[i]);
            if (startsWithLetter(lines[i])) {
                //console.log(lines[i]);
                tracking.push(i);
                //console.log(tracking);
            }
        }
        tracking.push(lines.length-1);
        console.log(tracking);
        for (let i = 0; i < tracking.length - 1; i = i + 1) {
            let d = tracking[i + 1] - tracking[i];
            let locs = (d - 2) / 2;
            for (let j = 1; j <= locs; j++) {
                let name = lines[tracking[i]];
                console.log(name);
                let lat = Number(lines[tracking[i]+j]);
                let lng = Number(lines[tracking[i]+j+locs]);
                //let code = lines[i + 3];
                let tt = "area-code";
                if (locs > 1) tt = "city-code"; 
                markerObjects.push({ text: name.substring(0,5), type: tt, lat: lat, lng: lng });
            }
        }
        //for (let i = 0; i < lines.length - 1; i = i+4) {
        //    let name = lines[i];
        //    let lat = Number(lines[i+1]);
        //    let lng = Number(lines[i+2]);
        //    let code = lines[i+3];
        //    addCoordinates(code, [lng, lat]); // Swapped because of geojson
        //}
        //for (area in coordinateMapping) {
        //    let x = 0;
        //    let y = 0;
        //    for (point in coordinateMapping[area]) {
        //        const coords = coordinateMapping[area][point];
        //        x += coords[0];
        //        y += coords[1];
        //    }  
        //    let centerX = x / coordinateMapping[area].length;
        //    let centerY = y / coordinateMapping[area].length;
        //    console.log(centerX, " ", centerY);
        //    // Add marker swapped back to lat,lng
        //    markerObjects.push({ text: area, type: "digit2", lat: centerY, lng: centerX });

        //    hullMapping[area] = convexHull(coordinateMapping[area]);
        //    console.log(hullMapping);
        //    extendedHullMapping[area] = extendHull(hullMapping[area], centerX, centerY);
        //    console.log(extendedHullMapping);
        //    chaikinMapping[area] = chaikin(extendedHullMapping[area], 5);
        //    console.log(chaikinMapping);
        //}
        const markerFilename = 'svMarkers.json';
        //const geojsonFilename = 'areas.geojson';
        //const geojsonString = generateGeoJSONFromCoordinates(chaikinMapping);
        //writeStringToFile(geojsonString, geojsonFilename);
        writeJSONObjectsToFile(markerObjects, markerFilename)
              .then(() => {
              console.log(`Marker JSON objects have been written to ${markerFilename}`);
          })
          .catch(err => {
              console.error('Error writing marker JSON objects to file:', err);
          });
        
    })
    .catch(err => {
        console.error('Error reading file:', err);
    });
