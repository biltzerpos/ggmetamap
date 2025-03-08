const fs = require('fs');

function removeNodesFromGeoJSON(inputFile, outputFile) {
    // Read the input GeoJSON file
    fs.readFile(inputFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        try {
            const geojson = JSON.parse(data);
            
            // Filter out Point features (nodes)
            if (geojson.type === "FeatureCollection") {
                geojson.features = geojson.features.filter(feature => 
                    feature.geometry.type !== "Point"
                );
            }

            // Write the modified GeoJSON to output file
            fs.writeFile(outputFile, JSON.stringify(geojson, null, 2), (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    return;
                }
                console.log(`Processed GeoJSON saved to ${outputFile}`);
            });
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
        }
    });
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
    console.error('Usage: node script.js <inputFile> <outputFile>');
    process.exit(1);
}

const [inputFile, outputFile] = args;
removeNodesFromGeoJSON(inputFile, outputFile);

