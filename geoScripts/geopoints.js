function getPointsFromGeoJSON(geoJSONString) {
    try {
        const geoJSON = JSON.parse(geoJSONString);
        
        if (geoJSON.type !== 'FeatureCollection') {
            throw new Error('Input is not a FeatureCollection GeoJSON');
        }
        
        const points = [];
        
        geoJSON.features.forEach(feature => {
            if (feature.geometry.type === 'Point') {
                points.push(feature.geometry.coordinates);
            } else if (feature.geometry.type === 'MultiPoint') {
                feature.geometry.coordinates.forEach(point => {
                    points.push(point);
                });
            }
        });
        
        return points;
    } catch (error) {
        console.error('Error parsing GeoJSON:', error);
        return [];
    }
}

// Example usage:
const geoJSONString = '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[1,1]}},{"type":"Feature","properties":{},"geometry":{"type":"MultiPoint","coordinates":[[2,2],[3,3]]}}]}';

const pointsArray = getPointsFromGeoJSON(geoJSONString);
console.log(pointsArray); // Output: [[1,1], [2,2], [3,3]]
