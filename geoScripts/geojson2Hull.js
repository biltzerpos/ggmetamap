#!/usr/bin/env node
const fs = require('fs');
const { convexHull } = require('./hull');

function createLineStringGeoJSON(points) {
    const geoJSON = {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: points
        },
        properties: {}
    };
    
    return JSON.stringify(geoJSON);
}


function writeStringToFile(data, fileName) {
    fs.writeFileSync(fileName, data, 'utf8');
    console.log(`Geojson info has been written to ${fileName}`);
}

function getPointsFromGeoJSON(geoJSONString) {
    try {
        const geoJSON = JSON.parse(geoJSONString);
        
        if (geoJSON.type !== 'FeatureCollection') {
            throw new Error('Input is not a FeatureCollection GeoJSON');
        }
        
        const points = [];
        
        geoJSON.features.forEach(feature => {
            const geometry = feature.geometry;
            
            switch (geometry.type) {
                case 'Point':
                    points.push(geometry.coordinates);
                    break;
                case 'MultiPoint':
                    geometry.coordinates.forEach(point => {
                        points.push(point);
                    });
                    break;
                case 'LineString':
                    geometry.coordinates.forEach(point => {
                        points.push(point);
                    });
                    break;
                case 'MultiLineString':
                    geometry.coordinates.forEach(line => {
                        line.forEach(point => {
                            points.push(point);
                        });
                    });
                    break;
                // You can add more cases for other geometry types if needed
                default:
                    console.warn(`Geometry type "${geometry.type}" is not supported.`);
            }
        });
        
        return points;
    } catch (error) {
        console.error('Error parsing GeoJSON:', error);
        return [];
    }
}

function getPointsFromGeoJSONFiles(fileNames) {
    const allPoints = [];
    fileNames.forEach(fileName => {
        try {
            const geoJSONString = fs.readFileSync(fileName, 'utf8');
            const pointsArray = getPointsFromGeoJSON(geoJSONString);
            allPoints.push(...pointsArray);
        } catch (error) {
            console.error(`Error reading or parsing ${fileName}:`, error);
        }
    });
    return allPoints;
}
if (process.argv.length < 3) {
    console.error('Usage: node geojson2Hull.js outputFile.geojson inputFile(s).geojson');
    process.exit(1); // Exit the process with a non-zero status code to indicate failure
}
const fileNames = process.argv.slice(3);
const allPoints = getPointsFromGeoJSONFiles(fileNames);
console.log(allPoints);
const hull = convexHull(allPoints);
console.log(hull);
const geojsonString = createLineStringGeoJSON(hull);
const geojsonFilename = process.argv[2];
writeStringToFile(geojsonString, geojsonFilename);


