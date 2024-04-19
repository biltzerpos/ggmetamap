// Create an object to store the mapping
const coordinateMapping = {};

// Function to add coordinates to the mapping
function addCoordinates(key, coordinates) {
    if (!coordinateMapping[key]) {
        coordinateMapping[key] = [];
    }
    coordinateMapping[key].push(coordinates);
}

// Example usage
addCoordinates('location1', [10, 20]);
console.log(coordinateMapping['location1']); // Output: [ [10, 20], [30, 40] ]
addCoordinates('location1', [30, 40]);
addCoordinates('location2', [ [50, 60], [70, 80], [90, 100] ]);
addCoordinates('location1', [33, 43]);

// Accessing the mapping
console.log(coordinateMapping['location1']); // Output: [ [10, 20], [30, 40] ]
console.log(coordinateMapping['location2']); // Output: [ [50, 60], [70, 80], [90, 100] ]

