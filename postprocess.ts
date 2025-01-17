import { getGlobals, colors } from './globals';
import { colog, splitCamelCase } from './utilities.js';
import {  placeNewMarker } from './markerFacilities';

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
    let pointsArray: google.maps.LatLng[] = [];
    let name = feature.getProperty(field);
    //colog(name);
    if (split) {
        name = splitCamelCase(name);
    }
    //name = removeAccentsAndUpperCase(name);
    name = name.toUpperCase();
    const geometry = feature.getGeometry();
    if (geometry) {
        processPoints2(geometry, pointsArray, (p, a) => { a.push(p); });
    }
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



export function colorCodingFixed(farr, argColour = 0, w = 5) {

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

export function colorCodingBasedOnField(farr, field, digit = 0, colArray, w = 5) {

    if (farr.length > 0) {
        farr.forEach((feature) => {

            let col = 3;
            //colog(feature);
            let name = "";
            // if (feature[field] )
            //&& feature[field][field2])
            //     name = feature[field][field2].toString();
            // if (field in feature.properties) 
            name = feature.getProperty(field);
            if (name === undefined) {
                name = "00000000000";
                colog("Feature with no " + field);
                colog(feature);
            }

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
    //colog(farr);
    if (farr.length > 0) {
        farr.forEach((feature) => {
            //colog("t2");
            let styleOptions = {
                strokeColor: 'blue',
                strokeWeight: 10,
                fillOpacity: 0,
                strokeOpacity: 0.2,
                zIndex: 3
            }
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