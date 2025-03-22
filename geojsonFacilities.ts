import { getGlobals, selectedFeatures, unselectAllFeatures } from './globals';
import { colog, partial } from './utilities.js';
import { processFeatures } from './postprocess';
import * as turf from "@turf/turf";
import { Feature, Polygon } from "geojson"; // Import types from @turf/helpers

export function getConcaveGeoJSON(points: [number, number][]): string | null {
    const geoPoints = turf.featureCollection(points.map((p) => turf.point(p)));
    colog(geoPoints);
    // Generate a concave hull (adjust "maxEdge" for concavity)
    const concaveHull = turf.concave(geoPoints, { units: 'miles', maxEdge: 10 }) as Feature<Polygon>;
    colog(concaveHull);
    if (concaveHull) return JSON.stringify(concaveHull) // as Feature<Polygon>; // Explicitly cast to correct type
    console.error("Could not generate a concave hull. Falling back to convex hull.");
    const convexHull = turf.convex(geoPoints);
    colog(convexHull);
    if (convexHull) {
        const featureCollection = turf.featureCollection([convexHull]);
        return JSON.stringify(featureCollection); //turf.convex(geoPoints) as Feature<Polygon>; // Ensure return type matches
    }
    console.error("Could not generate a convex hull.");
    return null;
}

export async function loadGeoJSONFile(path: string, layer = "boundaryLayer", postProcess?) {
    colog(path);
    let response = await fetch(path);
    let contents = await response.text();
    if (contents) {
        loadGeoJsonString(contents, layer, postProcess);
    }
}

export function readGeoJSONFile(file: any) {
    const reader = new FileReader();

    reader.onload = function (e) {
        //(reader.result as string, "secondaryLayer", colorCodingFixed);
        const options = { type: "inherent", fileName: file.name };
        //loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, options));
        loadGeoJsonString(reader.result as string, "secondaryLayer", partial(processFeatures, options));
    };

    reader.onerror = function (e) {
        console.error("reading failed");
    };

    reader.readAsText(file);
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
            colog("sure");
            let newFeatures = getGlobals().secondaryLayer.addGeoJson(geojson);
            if (postProcess) postProcess(newFeatures);
        }
        else console.log("Unknown layer");
    } catch (e) {
        console.log(e);
        colog("Error loading GeoJSON file!");
    }
}

export function select(layer, feature, clear: boolean) {
    if (clear) {
        //Un-highlight the selected features
        processFeatures(selectedFeatures, { selected: false });
        unselectAllFeatures();
    }
    layer.forEach(function (f) {
        if (f.getProperty("ggmmFileName") === feature.getProperty("ggmmFileName")) {
            selectedFeatures.push(f);
        }
    });
    // Highlight the selected features
    processFeatures(selectedFeatures, { selected: true });
}

export function clearBoundaryLayer() {
    getGlobals().boundaryLayer.forEach(function (feature) {
        getGlobals().boundaryLayer.remove(feature);
    });
}

export function clearSecondaryLayer() {
    getGlobals().secondaryLayer.forEach(function (feature) {
        getGlobals().secondaryLayer.remove(feature);
    });
}

export function removeAllFeatures() {
    getGlobals().boundaryLayer.forEach(function (feature) {
        getGlobals().boundaryLayer.remove(feature);
    });
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