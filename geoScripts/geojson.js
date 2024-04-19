module.exports = {
    generateGeoJSONFromCoordinates
};

function generateGeoJSONFromCoordinates(coordinatesObject) {
    // Initialize an empty FeatureCollection
    const featureCollection = {
        type: "FeatureCollection",
        features: []
    };

    // Iterate over the keys in the input object
    for (const key in coordinatesObject) {
        if (Object.hasOwnProperty.call(coordinatesObject, key)) {
            const coordinates = coordinatesObject[key];
            
            // Create a Feature for each set of coordinates
            const feature = {
                type: "Feature",
                properties: {
                    name: key
                },
                geometry: {
                    type: "LineString",
                    coordinates: coordinates
                }
            };

            // Add the Feature to the FeatureCollection
            featureCollection.features.push(feature);
        }
    }

    // Convert the FeatureCollection to a GeoJSON string
    //console.log(JSON.stringify(featureCollection, null, 2));
    return JSON.stringify(featureCollection, null, 2);
}

// Example input JSON object mapping keys to arrays of coordinates
const coordinatesObject = {
    "Route 1": [
  [ -97.3683685, 19.825485875000002 ],
  [ -97.3552435, 19.832847125 ],
  [ -97.3469351625, 19.8366896 ],
  [ -97.3434434875, 19.837013300000002 ],
  [ -97.344768475, 19.833818225 ],
  [ -97.350910125, 19.827104374999998 ],
  [ -97.3572622, 19.8219071375 ],
  [ -97.3638247, 19.818226512499997 ],
  [ -97.370597625, 19.816062499999997 ],
  [ -97.377580975, 19.8154151 ],
  [ -97.3795372375, 19.8167698625 ],
  [ -97.37646641250001, 19.8201267875 ]
]
,
    "Route 2": [
        [-77.025671, 38.885507],
        [-77.021884, 38.889563]
    ]
};

// Generate GeoJSON string from input coordinates
//const geoJSONString = generateGeoJSONFromCoordinates(coordinatesObject);

// Output the generated GeoJSON string
//console.log(geoJSONString);

