import { getGlobals, colors, getUniqueID, selectedFeatures } from './globals';
import { colog, splitCamelCase, isNonNegativeNumber, removeAccentsAndUpperCase } from './utilities.js';
import { placeNewMarker } from './markerFacilities';

export function markerInMiddleRemoveNodes(farr, field, split = false) {
    if (farr.length > 0) {
        farr.forEach((feature) => {
            const geometry = feature.getGeometry();
            if (geometry.getType() === "Point") getGlobals().boundaryLayer.remove(feature);
            else findMiddlePutMarker(feature, field, split);
        });
    }
}

export function markerInMiddle(farr, field, split = false) {
    if (farr.length > 0) {
        farr.forEach((feature) => {
            findMiddlePutMarker(feature, field, split);
        });
    }
}



function findMiddlePutMarker(feature: any, field: any, split: boolean) {
    colog(feature);
    const geometry = feature.getGeometry();
    let isNode = false;
    if (geometry) {
        isNode = ((geometry instanceof google.maps.LatLng) || (geometry instanceof google.maps.Data.Point));
        if (!isNode) {
            let pointsArray: google.maps.LatLng[] = [];
            let name = feature.getProperty(field);
            //colog(name);
            if (split) {
                name = splitCamelCase(name);
            }
            name = removeAccentsAndUpperCase(name);
            name = name.toUpperCase();
            if (name.startsWith("ΔΗΜΟΣ ")) name = name.substring(6,name.length);

            processPoints2(geometry, pointsArray, (p, a) => { a.push(p); });

            //colog(pointsArray.length);
            if (pointsArray.length > 0) {
                let n = 0, avgLat = 0, avgLng = 0;
                pointsArray.forEach(p => {
                    avgLat = n * avgLat / (n + 1) + p.lat() / (n + 1);
                    avgLng = n * avgLng / (n + 1) + p.lng() / (n + 1);
                    n++;
                });
                //let pp = new google.maps.LatLng(avgLat, avgLng);
                //const overlay = new TxtOverlay(pp, name, "transp", 6, map);
                //overlay.setMap(map);
                placeNewMarker(getGlobals().map, { lat: avgLat, lng: avgLng }, name, "", "name", 9);
            }
        }
        else getGlobals().boundaryLayer.remove(feature);
    }
}

export type processingOptions = {
    type: string;
    colour: string;
    weight: number;
    field: string;
    digit: number;
    colArray: { [key: string]: number };
    fileName: string;
    selected: boolean;
};

export function processFeatures(farr, options: Partial<processingOptions>) {
    //let sessionID = getUniqueID();

    colog("One");
    //colog(farr);
    if (farr.length > 0) {
        farr.forEach((feature) => {
            // Default values
            let col = "#000000";
            let w = 5;
            let inherentCol = feature.getProperty("ggmmColour");
            if (inherentCol) col = inherentCol;
            let inherentWeight = feature.getProperty("ggmmWeight");
            if (inherentWeight) w = Number(inherentWeight);
            //colog(col);

            if (!feature.getProperty("ggmmSessionID")) feature.setProperty("ggmmSessionID", getUniqueID());
            // if (options.type === "inherent") {
            //     let inherentCol = feature.getProperty("ggmmColour");
            //     if (inherentCol) col = inherentCol;
            //     let inherentWeight = feature.getProperty("ggmmWeight");
            //     if (inherentWeight) w = inherentWeight;
            // }
            if (options.type === "specified") {
                if (options.colour) col = options.colour;
                if (options.weight) w = options.weight;
            }
            else if (options.type?.endsWith("based")) {
                let name = "";
                name = feature.getProperty(options.field);
                if (name === undefined) {
                    name = "00000000000";
                    colog("Feature with no " + options.field);
                    colog(feature);
                } else name = name.toString();
                //colog(name);
                if ((options.type === "field-based")) {
                    let theDigit = 0;
                    if (typeof options.digit === "number" && Number.isFinite(options.digit) && options.digit >= 0) {
                        theDigit = options.digit;
                        if (theDigit == 9) theDigit = name.length - 1;
                        col = colors[Number(name[theDigit])];
                    }
                }
                else if ((options.type === "array-based") && (options.colArray)) {
                    let index = name.indexOf(";");
                    let rname = index !== -1 ? name.substring(0, index) : name;
                    if (rname in options.colArray) col = colors[Number(options.colArray[rname])];
                }
            }
            //colog(col);
            let appliedWeight = w;
            if (options.selected) appliedWeight += 4;
            let styleOptions = {
                strokeColor: col,
                strokeWeight: appliedWeight,
            }
            getGlobals().secondaryLayer.overrideStyle(feature, styleOptions);
            feature.setProperty("ggmmColour", col.toString());
            feature.setProperty("ggmmWeight", w.toString());
            if (options.fileName) feature.setProperty("ggmmFileName", options.fileName);
            //colog(feature);

        });
    }
}

function colorCodingFixed(farr, argColour = 0, w = 5) {

    let arbitrary = false;
    let col = "black";
    if (argColour < 0) {
        arbitrary = true;
        argColour = 0;
    }
    if (farr.length > 0) {
        farr.forEach((feature) => {

            //colog(w);
            //colog(col);
            //colog(feature);

            // Respect inherent colour if it exists
            let inherentCol = feature.getProperty("colour");
            if (inherentCol) col = inherentCol;
            else col = colors[argColour];

            // Assign arbitrary colour (should probably refactor)
            if (arbitrary) col = ((Number(feature.Fg.ref)) % 10).toString();

            let styleOptions = {
                strokeColor: col,
                strokeWeight: w,
            }
            getGlobals().secondaryLayer.overrideStyle(feature, styleOptions);
            //feature.properties["colour"] = col.toString();
            feature.setProperty("colour", col.toString());
            //colog(feature);
        });
    }
}

function colorCodingBasedOnField(farr, field, digit = 0, colArray, w = 5) {

    if (farr.length > 0) {
        farr.forEach((feature) => {

            let col = 3;
            //colog(feature);
            let name = "";
            name = feature.getProperty(field).toString();
            if (name === undefined) {
                name = "00000000000";
                colog("Feature with no " + field);
                colog(feature);
            }
            colog(name);
            if (digit < 0) {
                let index = name.indexOf(";");
                let rname = index !== -1 ? name.substring(0, index) : name;
                if (rname in colArray) col = Number(colArray[rname]);
            }
            else {
                if (digit == 9) digit = name.length - 1;
                col = Number(name[digit]);
            }
            let styleOptions = {
                strokeColor: colors[col],
                strokeWeight: w,
            }
            getGlobals().secondaryLayer.overrideStyle(feature, styleOptions);
        });
    }
}

export function thickBlue(farr) {
    if (farr.length > 0) {
        farr.forEach((feature) => {
            let styleOptions = {
                strokeColor: 'blue',
                strokeWeight: 10,
                fillOpacity: 0,
                strokeOpacity: 0.2,
                zIndex: 3
            }
            feature.setProperty("ggmmLayer", "thickBlue");
            getGlobals().secondaryLayer.overrideStyle(feature, styleOptions);
        });
    }
}

function processPoints2(
    geometry: google.maps.LatLng | google.maps.Data.Geometry,
    arr: any,
    callback: any
) {
    if (geometry instanceof google.maps.LatLng) {
        callback(geometry, arr);
    } else if (geometry instanceof google.maps.Data.Point) {
        callback(geometry.get(), arr);
    } else {
        // @ts-ignore
        geometry.getArray().forEach((g) => {
            processPoints2(g, arr, callback);
        });
    }
}