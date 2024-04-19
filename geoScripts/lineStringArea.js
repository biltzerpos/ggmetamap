const fs = require('fs');

function calculateAreaOfLineString(lineString) {
    let area = 0;
    const coordinates = lineString.coordinates;

    for (let i = 0; i < coordinates.length - 1; i++) {
        const xi = coordinates[i][0];
        const yi = coordinates[i][1];
        const xiPlus1 = coordinates[i + 1][0];
        const yiPlus1 = coordinates[i + 1][1];

        area += xi * yiPlus1 - xiPlus1 * yi;
    }

    // Add the area for the edge from the last point to the first point
    const xLast = coordinates[coordinates.length - 1][0];
    const yLast = coordinates[coordinates.length - 1][1];
    const xFirst = coordinates[0][0];
    const yFirst = coordinates[0][1];

    area += xLast * yFirst - xFirst * yLast;

    // Take the absolute value and divide by 2
    area = Math.abs(area) / 2;

    return area;
}

// Read the GeoJSON file
const filePath = process.argv[2]; // Assuming the file path is passed as the first argument

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    try {
        const geoJSON = JSON.parse(data);

        if (geoJSON.type !== 'Feature' || geoJSON.geometry.type !== 'LineString') {
            throw new Error('Input file must contain a LineString feature.');
        }

        const area = calculateAreaOfLineString(geoJSON.geometry);
        console.log("Area:", area);
    } catch (error) {
        console.error('Error parsing GeoJSON:', error);
    }
});

