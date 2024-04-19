const fs = require('fs');
const { convexHull } = require('./hull');
const { generateGeoJSONFromCoordinates } = require('./geojson');
const { chaikin } = require('./chaikin');
const { extendHull } = require('./extendHull');



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

// Function to add coordinates to the mapping
function addCoordinates(key, coordinates) {
    if (!coordinateMapping[key]) {
        coordinateMapping[key] = [];
    }
    coordinateMapping[key].push(coordinates);
}

// Example usage
//addCoordinates('location1', [10, 20]);
//console.log(coordinateMapping['location1']); 

function makeAdjustments() {
  push[591]=0.01;
  pad[591]=0.02;
  push[593]=0.01;
  pad[593]=0.02;
  push[599]=0.01;
  pad[599]=0.02;
}

// Code start

// Create objects to store the various mappings
const coordinateMapping = {};
const hullMapping = {};
const chaikinMapping = {};
const extendedHullMapping = {};
const reHullMapping = {};
const push = {};
const pad = {};

const args = process.argv;
const filename = args[2];

readFileLinesToArray(filename)
    .then(lines => {
        let markerObjects = [];
        for (let i = 0; i < lines.length - 1; i = i+4) {
            let name = lines[i];
            let lat = Number(lines[i+1]);
            let lng = Number(lines[i+2]);
            let code = lines[i+3];
            addCoordinates(code, [lng, lat]); // Swapped because of geojson
        }
        for (area in coordinateMapping) {
            hullMapping[area] = convexHull(coordinateMapping[area]);
            push[area] = 0.02; // Default push boundary value
            pad[area] = 0.05; // Default pad value for one2two
            //console.log(hullMapping);
            let x = 0;
            let y = 0;
            for (point in hullMapping[area]) {
                const coords = hullMapping[area][point];
                x += coords[0];
                y += coords[1];
            }  
            let centerX = x / hullMapping[area].length;
            let centerY = y / hullMapping[area].length;
            //console.log(centerX, " ", centerY);
            // Add marker swapped back to lat,lng
            markerObjects.push({ text: area, type: "digit2", lat: centerY, lng: centerX });

            
            console.log(hullMapping);
            makeAdjustments();
            extendedHullMapping[area] = extendHull(hullMapping[area], centerX, centerY, push[area], pad[area]);
            //console.log(extendedHullMapping);
            reHullMapping[area] = convexHull(extendedHullMapping[area]);
            chaikinMapping[area] = chaikin(reHullMapping[area], 8);
            //console.log(chaikinMapping);
        }
        const markerFilename = 'markers.json';
        const geojsonFilename = 'areas.geojson';
        const geojsonString = generateGeoJSONFromCoordinates(chaikinMapping);
        writeStringToFile(geojsonString, geojsonFilename);
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
