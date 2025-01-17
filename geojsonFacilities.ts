import { getGlobals } from './globals';
import { colog } from './utilities.js';

export async function loadGeoJSONFile(path: string, layer = "boundaryLayer", postProcess?) {
    let response = await fetch(path);
    let contents = await response.text();
    if (contents) {
        loadGeoJsonString(contents, layer, postProcess);
    }
}

export function loadGeoJsonString(geoString: string, layer = "boundaryLayer", postProcess) {
    try {
        //colog(geoString);
        const geojson = JSON.parse(geoString) as any;
        //colog(geojson);
        if (layer == "boundaryLayer") {
            let newFeatures = getGlobals().boundaryLayer.addGeoJson(geojson);
            
            if (postProcess) postProcess(newFeatures);
            zoom(getGlobals().map);
        }
        else if (layer.startsWith("secondaryLayer")) {
            if (layer == "secondaryLayerClear") clearSecondaryLayer();
            let newFeatures = getGlobals().secondaryLayer.addGeoJson(geojson);
            colog("newFeatures");
            colog(newFeatures);
            if (postProcess) postProcess(newFeatures);
        }
        else console.log("Unknown layer");
    } catch (e) {
        console.log(e);
        colog("Error loading GeoJSON file!");
    }
}

export function clearSecondaryLayer() {
    getGlobals().secondaryLayer.forEach(function (feature) {
        getGlobals().secondaryLayer.remove(feature);
    });
}

/**
 * Update a map's viewport to fit each geometry in a dataset
 */
export function zoom(map: google.maps.Map, layer = "boundaryLayer") {
    const bounds = new google.maps.LatLngBounds();
    if (layer == "boundaryLayer") {
        getGlobals().boundaryLayer.forEach((feature) => {
            const geometry = feature.getGeometry();
            if (geometry) {
                processPoints(geometry, bounds.extend, bounds);
            }
        });
    }
    else if (layer == "secondaryLayer") {
        getGlobals().secondaryLayer.forEach((feature) => {
            const geometry = feature.getGeometry();
            if (geometry) {
                processPoints(geometry, bounds.extend, bounds);
            }
        });
    }
    else console.log("Weird 001");
    map.fitBounds(bounds);
}

/**
 * Process each point in a Geometry, regardless of how deep the points may lie.
 */
function processPoints(
    geometry: google.maps.LatLng | google.maps.Data.Geometry,
    callback: any,
    thisArg: google.maps.LatLngBounds
) {
    if (geometry instanceof google.maps.LatLng) {
        callback.call(thisArg, geometry);
    } else if (geometry instanceof google.maps.Data.Point) {
        callback.call(thisArg, geometry.get());
    } else {
        // @ts-ignore
        geometry.getArray().forEach((g) => {
            processPoints(g, callback, thisArg);
        });
    }
}

// Utility function to download the GeoJSON as a file
export function downloadGeoJson(content, fileName) {
    const blob = new Blob([content], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}