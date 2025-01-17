/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

//import turf from './turf.min.js';
import { markers, countryMenu, layerMenu, flags, settings, colors, overlays } from './globals';
import { initializeGlobals, getGlobals } from './globals';
import { colog, partial, splitCamelCase } from './utilities';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from './geojsonFacilities';
import { loadMarkerLayer, placeNewMarker, getTransform } from './markerFacilities';
//Remove after refactor
import { thickBlue, colorCodingFixed, colorCodingBasedOnField } from './postprocess';

let boundaryLayer: google.maps.Data;
let secondaryLayer: google.maps.Data;
let map: google.maps.Map;
let infoWindow: google.maps.InfoWindow;
let rectangle;
let startLatLng;
let rec = false;
let auxButton, saveLocsDiv, saveLayerDiv, saveGeoJsonDiv, editDocDiv;
const modules: Record<string, () => Promise<any>> = import.meta.glob('./countries/*.ts');

let gui = {
    editModeButton: createButton("Turn Edit Mode On", "Click to edit the map", editModeBehaviour),
    coverageButton: createButton("Show Coverage", "Click to show/hide streetview coverage", coverageBehaviour),
    terrainButton: createButton("Show Terrain", "Click to show/hide the terrain", terrainBehaviour),
    saveGeoJsonButton: createButton("Save GeoJson", "Click to save the displayed geojson objects", saveGeoJsonBehaviour),
    saveLocsButton: createButton("Save locs", "Click to save the location of the markers", saveLocsBehaviour),
    saveLayerButton: createButton("Save layer", "Click to save everything in this layer", saveLayerBehaviour),
    editDocButton: createButton("Edit Mode INFO", "Click to learn how to use edit mode", editDocBehaviour)
};

let contextMenu;
const currentUrl = new URL(window.location.href);
const params = new URLSearchParams(currentUrl.search);
let urlCountry, urlLayer;
let streetViewLayer;
let lastCountry, lastLayer;
let boundaryFeatures = [], secondaryFeatures = [];
let showAreas = true, showBorders = false;
interface markerLoc {
    text: string;
    type: string;
    lat: number;
    lng: number;
    scale: number;
}
//TODO Remove
let colll = {
    "E 6": 0,
    "E 12": 1,
    "E 14": 2,
    "E 16": 3,
    "E 18": 4,
    "E 39": 5,
    "E 69": 9,
    "E 134": 7,
    "E 136": 8,
    "E 8": 1,
    "E 10": 2,
    "E 45": 3,
    "E 75": 4,
    "E 105": 5
};

// function colog(a) {
//     if (debugMode) console.log(a);
// }

function updateURL(country, layer) {

    // Step 3: Set or update parameters
    if (country) params.set('country', country);
    else params.delete('country');
    if (layer) params.set('layer', layer);
    else params.delete('layer');

    // Step 4: Update the URL
    currentUrl.search = params.toString(); // Set the updated query string

    // Step 5: Use history.pushState or history.replaceState
    history.pushState(null, '', currentUrl); // This will change the URL without reloading the page

    // If you want to replace the current history state instead of pushing a new one:
    // history.replaceState(null, '', currentUrl);

}

function removeAllOverlays() {
    // Loop through the overlays array, remove each overlay from the map, and delete it
    while (overlays.length) {
      const overlay = overlays.pop(); // Remove the last overlay from the array
      if (overlay) overlay.setMap(null);          // Remove it from the map
    }
  }

function removeAccentsAndUpperCase(str) {
    return str
        .normalize('NFD') // Normalize the string to decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
        .toUpperCase(); // Convert to uppercase
}

// Define a function that partially applies another function
// function partial(fn, ...fixedArgs) {
//     return function (...freeArgs) {
//         return fn(...freeArgs, ...fixedArgs);
//     };
// }

function newCountryReset() {
    lastCountry = countryMenu.value;
    countryMenu.options[0].text = "No country";
    countryMenu.options[0].value = "No country";
    countryMenu.options[0].disabled = false;
    colog(boundaryLayer);
    boundaryLayer.setStyle({ strokeOpacity: 1, fillOpacity: 0, zIndex: 1 });
    removeAllFeatures();
    removeAllMarkers();
    hideAuxButton();
    removeAllOverlays();
    flags.askToSave = false;
    flags.displayPopups = true;
    if (flags.editMode) {
        flags.editMode = false;
        editModeOffGUI();
    }
    if (countryMenu.value == "No country") updateURL(null,null);
    else updateURL(countryMenu.value, null);
}

export function newLayerReset(opacity = 0.1) {
    let goOn = true;
    if (flags.askToSave) {
        // Display a confirmation dialog with "OK" and "Cancel" buttons
        goOn = confirm('Unsaved edits will be discarded. Do you want to continue?');
    }
    if (goOn) {
        lastLayer = layerMenu.options[layerMenu.selectedIndex].textContent;
        boundaryLayer.setStyle({ strokeOpacity: opacity, fillOpacity: 0, zIndex: 1 });
        clearSecondaryLayer();
        secondaryLayer.setStyle({ strokeColor: 'black', strokeWeight: 3, zIndex: 2 });
        removeAllMarkers();
        hideAuxButton();
        removeAllOverlays();
        flags.askToSave = false;
        if (flags.editMode) {
            flags.editMode = false;
            editModeOffGUI();
        }
        flags.displayPopups = true;
        gui.editModeButton.textContent = 'Turn Edit Mode ON';
        updateURL(countryMenu.value, layerMenu.value);
    } else {
        selectOption(layerMenu, lastLayer);
    }
    return goOn;
}



function selectOption(menu, option) {

    // Loop through all options in the select element
    for (let i = 0; i < menu.options.length; i++) {
        // Check if the current option's text matches the specified name
        if (menu.options[i].textContent === option) {
            // Set the value of the select element to the value of the matching option
            menu.value = menu.options[i].value;
            // Exit the loop since we've found the matching option
            break;
        }
    }
}



async function loadAndExecute(moduleName: string, functionName: string): Promise<void> {
    const modulePath = `./countries/${moduleName}.ts`;
    if (modules[modulePath]) {
        try {
            const module = await modules[modulePath]();
            const ClassRef = module[moduleName];
            if (ClassRef && typeof ClassRef['getInstance'] === 'function') {
                const instance = ClassRef['getInstance']();

                // Call the method on the instance
                if (instance && typeof instance[functionName] === 'function') {
                    instance[functionName]();
                } else {
                    console.error(`Instance method show not found on class instance`);
                }
            } else {
                console.error(`Method getInstance not found in class ${moduleName}`);
            }
        } catch (error) {
            console.error('Error loading module:', error);
        }
    } else {
        console.error(`Module ${moduleName} not found`);
    }
}
  
function createCountryChooser(map) {
    countryMenu.className = "buttons";
    const top = new Option("Choose Country", "Choose Country");
    top.selected = true;
    top.disabled = true;
    countryMenu.appendChild(top);
    countryMenu.appendChild(new Option("Bulgaria", "Bulgaria"));
    countryMenu.appendChild(new Option("Chile", "Chile"));
    countryMenu.appendChild(new Option("Colombia", "Colombia"));
    countryMenu.appendChild(new Option("Estonia", "Estonia"));
    countryMenu.appendChild(new Option("France", "France"));
    if (flags.localMode) countryMenu.appendChild(new Option("France Sandbox", "France Sandbox"));
    countryMenu.appendChild(new Option("Greece", "Greece"));
    if (flags.localMode) countryMenu.appendChild(new Option("Greece Sandbox", "Greece Sandbox"));
    countryMenu.appendChild(new Option("Indonesia", "Indonesia"));
    if (flags.localMode) countryMenu.appendChild(new Option("Indonesia Sandbox", "Indonesia Sandbox"));
    countryMenu.appendChild(new Option("Ireland", "Ireland"));
    countryMenu.appendChild(new Option("Jordan", "Jordan"));
    countryMenu.appendChild(new Option("Mexico", "Mexico"));
    countryMenu.appendChild(new Option("Norway", "Norway"));
    countryMenu.appendChild(new Option("Romania", "Romania"));
    countryMenu.appendChild(new Option("Sweden", "Sweden"));
    countryMenu.appendChild(new Option("South Africa", "South Africa"));
    countryMenu.appendChild(new Option("Thailand", "Thailand"));
    if (flags.localMode) countryMenu.appendChild(new Option("Thailand Sandbox", "Thailand Sandbox"));
    countryMenu.appendChild(new Option("Turkey", "Turkey"));
    if (flags.localMode) countryMenu.appendChild(new Option("Turkey Sandbox", "Turkey Sandbox"));
    countryMenu.appendChild(new Option("USA", "USA"));
    countryMenu.appendChild(new Option("Wales", "Wales"));
    if (flags.localMode) countryMenu.appendChild(new Option("Wales Sandbox", "Wales Sandbox"));

    countryMenu.onchange = async (event) => {
        colog(countryMenu.value);
        let goOn = true;
        if (flags.askToSave) {
            // Display a confirmation dialog with "OK" and "Cancel" buttons
            goOn = confirm('Unsaved edits will be discarded. Do you want to continue?');
        }
        if (goOn) {
            let countryName = countryMenu.value.replace(/\s+/g, "");;
            let displayFunction = 'show';
            if (countryName.endsWith("Sandbox")) {
                countryName = countryName.slice(0, -7);
                displayFunction = 'sandbox';
            }
            newCountryReset();
            for (var i = layerMenu.length - 1; i > 0; i--)
                layerMenu.remove(i);
            layerMenu.options[0].selected = true;
            if (countryMenu.value == "No country") {
                map.setCenter(new google.maps.LatLng(0, 0));
                map.setZoom(2);
            } 
            else loadAndExecute(countryName, displayFunction);
        } else {
            // User clicked "Cancel" or closed the dialog
            console.log('User clicked Cancel or closed the dialog');
            event.preventDefault();
            selectOption(countryMenu, lastCountry);
        }
    };
}

function removeAllFeatures() {
    boundaryLayer.forEach(function (feature) {
        boundaryLayer.remove(feature);
    });
    secondaryLayer.forEach(function (feature) {
        secondaryLayer.remove(feature);
    });
}

function removeAllMarkers() {
    hideAllMarkers();
    markers.length = 0;
}

function hideAllMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].map = null;
    }
}

function showAllMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].map = map;
    }
}

function saveGeoJsonBehaviour() {
    exportFeaturesToGeoJSON(secondaryLayer);
}

function coverageBehaviour() {
    flags.coverageMode = !flags.coverageMode;
    if (flags.coverageMode) {
        streetViewLayer.setMap(map);
        gui.coverageButton.textContent = 'Hide Coverage';
    } else {
        streetViewLayer.setMap(null);
        gui.coverageButton.textContent = 'Show Coverage';
    }
}

function terrainBehaviour() {
    flags.terrainMode = !flags.terrainMode;
    if (flags.terrainMode) {
        map.setMapTypeId("terrain");
        gui.terrainButton.textContent = 'Hide Terrain';
    } else {
        map.setMapTypeId("roadmap");
        gui.terrainButton.textContent = 'Show Terrain';
    }
}

function editDocBehaviour() {
    infoWindow.setContent(`
        <p>All markers are now draggable.</p>
        <p>Doubleclick anywhere to add a text marker.</p>
        <p>Click on a marker to edit its text.</p>
        <p>You can drag images, json, and geojson files to the map.</p>
        <p>Shift-Command-Click to increase the size of an image.</p>
        <p>Shift-Option-Click to decrease the size of an image.</p>
        <p>Shift-click to remove a marker or a geojson feature.</p>
        <p>Shift-doubleclick to show a rectangle to select multiple features.</p>
        <p>After selecting the features, shift-doubleclick anywhere to delete them.</p>
        `);
    infoWindow.class = "custom-infowindow";
    const cen = map.getCenter();
    infoWindow.setPosition({ lat: cen.lat(), lng: cen.lng() });
    infoWindow.open(map);
}

function editModeBehaviour() {
    flags.editMode = !flags.editMode;
    if (flags.editMode) {
        flags.askToSave = true;
        markers.forEach(m => { m.gmpDraggable = true; })
        map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(editDocDiv);
        map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(saveGeoJsonDiv);
        map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(saveLocsDiv);
        map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(saveLayerDiv);
        gui.editModeButton.textContent = 'Turn Edit Mode OFF';
    } else {
        markers.forEach(m => { m.gmpDraggable = false; })
        editModeOffGUI();
    }
}

function editModeOffGUI() {
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].pop();
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].pop();
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].pop();
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].pop();
    gui.editModeButton.textContent = 'Turn Edit Mode ON';
}

function createButtonDiv(guibutton, text="", tooltip="", callback=null) {
    const resultDiv = document.createElement('div');
    //gui[guibutton] = createButton(text, tooltip, callback);
    resultDiv.appendChild(gui[guibutton]);
    return resultDiv;
}

function createButton(text: string, tooltip: string, callback: any) {
    const button = document.createElement('button');
    button.className = "buttons";
    button.textContent = text;
    button.title = tooltip;
    button.classList.add("custom-control");
    //button.type = 'button';
    button.addEventListener('click', callback);
    return button;
}

function createLayerChooser(map) {
    //layerMenu = document.createElement('select');
    layerMenu.className = "buttons";

    const top = new Option("Choose Layer", "0");
    top.selected = true;
    top.disabled = true;
    layerMenu.appendChild(top);
    const dummy = new Option("Must select country first", "1");
    dummy.disabled = true;
    layerMenu.appendChild(dummy);
    //return layerMenu;
}
// function loadMarkerLayer(country, layer) {
//     const path = '/Layers/' + country + '/' + layer + '.json';
//     const imagepath = '/Layers/' + country + '/' + layer + ' Images/';
//     loadMarkers(path, imagepath);
// }

function saveLocsBehaviour() {
    let markerLocData: markerLoc[] = [];
    for (let i = 0; i < markers.length; i++) {
        let text, type;
        if (markers[i].content instanceof HTMLImageElement) {
            text = markers[i].content.alt;
            type = "image";
        }
        else {
            //console.log(markers[1].style.getProperty('--marker-color'));
            //console.log(markers[1].);
            text = markers[i].content.textContent;
            type = markers[i].getAttribute("ggmmtype");
        }
        let fszl = Number(markers[i].getAttribute("fszl"));
        markerLocData.push({ text: text, type: type, lat: markers[i].position.lat, lng: markers[i].position.lng, fszl: fszl });
    }
    markerLocData.sort((a, b) => {
        if (a.text < b.text) {
            return -1;
        }
        if (a.text > b.text) {
            return 1;
        }
        return 0;
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(markerLocData, null, 2)], {
        type: "application/json"
    }));
    a.setAttribute("download", "locs.json");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function saveLayerBehaviour() {
    let defaultLayerName = layerMenu.value;
    if (defaultLayerName == "0") defaultLayerName = "layer";
    const layerName = prompt("Enter a name for the layer:", defaultLayerName);
    if (!layerName) {
        alert("File download canceled.");
        return;
    }
    const fileName = layerName + ".zip";
    const zip = new JSZip();
    const images = [];
    let markerLocData: markerLoc[] = [];
    for (let i = 0; i < markers.length; i++) {
        let text, type;
        if (markers[i].content instanceof HTMLImageElement) {
            text = markers[i].content.alt;
            type = "image";
            images.push(markers[i].content);
        }
        else {
            //console.log(markers[1].style.getProperty('--marker-color'));
            //console.log(markers[1].);
            text = markers[i].content.textContent;
            type = markers[i].getAttribute("ggmmtype");
        }
        let fszl = Number(markers[i].getAttribute("fszl"));
        markerLocData.push({ text: text, type: type, lat: markers[i].position.lat, lng: markers[i].position.lng, fszl: fszl });
    }
    markerLocData.sort((a, b) => {
        if (a.text < b.text) {
            return -1;
        }
        if (a.text > b.text) {
            return 1;
        }
        return 0;
    });
      
    const fileContent = JSON.stringify(markerLocData, null, 2);
    zip.file(layerName + ".json", fileContent);

    await addImagesToZip(zip, images, layerName + " Images");

      // Generate the ZIP file and trigger the download
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    // Do the actual download
    // const a = document.createElement("a");
    // a.href = URL.createObjectURL(new Blob([JSON.stringify(markerLocData, null, 2)], {
    //     type: "application/json"
    // }));
    // a.setAttribute("download", "locs.json");
    // document.body.appendChild(a);
    // a.click();
    // document.body.removeChild(a);
}
  
/**
 * Processes a feature in a Google Maps Data layer, replacing it with an array of Data.LineString objects.
 *
 * @param {google.maps.Data} dataLayer - The Google Maps Data layer.
 * @param {google.maps.Data.Feature} feature - The feature to process and replace.
 */
function replaceFeatureWithLineStrings(dataLayer, feature) {
    const geometry = feature.getGeometry();
    const featureType = geometry.getType();
    const properties = {};
    feature.forEachProperty((value, key) => {
        properties[key] = value;
    });
    
    const createLineString = (coordinates) =>
      new google.maps.Data.LineString(coordinates);
  
    const splitPolygon = (polygonCoords) => {
      // Split polygon into two roughly equal parts
      const midpoint = Math.floor(polygonCoords.length / 2);
      const lineString1 = createLineString(polygonCoords.slice(0, midpoint + 1));
      const lineString2 = createLineString(polygonCoords.slice(midpoint).concat(polygonCoords[0]));
      return [lineString1, lineString2];
    };
  
    const handleGeometry = (geom) => {
      const geomType = geom.getType();
      switch (geomType) {
        case "Point":
        case "MultiPoint":
          return []; // Do nothing
        case "LineString":
          return [geom]; // Already a LineString
        case "MultiLineString": {
          // Flatten into individual LineStrings
          const lineStrings = [];
          geom.getArray().forEach((lineString) => {
            lineStrings.push(lineString);
          });
          return lineStrings;
        }
        case "Polygon": {
          // Convert LinearRings into LineStrings and split the outer ring
          const lineStrings = [];
          const rings = geom.getArray(); // Rings are LineStrings in Google Maps
          rings.forEach((ring, index) => {
            const coords = ring.getArray();
            if (index === 0) {
              // Split the outer ring
              lineStrings.push(...splitPolygon(coords));
            } else {
              // Add inner rings directly as LineStrings
              //lineStrings.push(createLineString(coords));
              lineStrings.push(...splitPolygon(coords));
            }
          });
          return lineStrings;
        }
        case "MultiPolygon": {
          // Flatten into Polygons and process each
          const lineStrings = [];
          geom.getArray().forEach((polygon) => {
            const rings = polygon.getArray();
            rings.forEach((ring, index) => {
              const coords = ring.getArray();
              if (index === 0) {
                // Split the outer ring
                lineStrings.push(...splitPolygon(coords));
              } else {
                // Add inner rings directly as LineStrings
                //lineStrings.push(createLineString(coords));
                lineStrings.push(...splitPolygon(coords));

              }
            });
          });
          return lineStrings;
        }
        default:
          throw new Error(`Unsupported geometry type: ${geomType}`);
      }
    };
  
    // Replace the feature with the new LineStrings
    const lineStrings = handleGeometry(geometry);
  
    // Remove the original feature
    dataLayer.remove(feature);
  
    // Add new LineStrings as separate features
    lineStrings.forEach((lineString) => {
      dataLayer.add(new google.maps.Data.Feature({
        geometry: lineString,
        properties: properties,
      }));
    });
  }
  

function exportFeaturesToGeoJSON(dataLayer) {
    const geoJson = getGeoJson(dataLayer);

    // Convert the GeoJSON object to a Blob
    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/geo+json' });

    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'features.geojson';

    // Append the link to the body and trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
}

function getGeoJson(dataLayer: any) {
    const geoJson = turf.featureCollection([]);
    dataLayer.forEach((feature) => {
        const geometry = feature.getGeometry();
        const properties = {};
        feature.forEachProperty((value, key) => {
            properties[key] = value;
        });
        if (geometry) {
            let turfFeature;
            // Convert Google Maps geometry to Turf.js compatible GeoJSON
            switch (geometry.getType()) {
                case 'Point':
                    turfFeature = turf.point(geometry.get());
                    break;
                case 'Polygon':
                    turfFeature = turf.polygon(geometry.get().coordinates);
                    break;
                case 'LineString':
                    turfFeature = turf.lineString(geometry.getArray().map(coord => [coord.lng(), coord.lat()]));
                    break;
                case 'MultiLineString':
                    const multiLineCoords = geometry.getArray().map(line => line.getArray().map(coord => [coord.lng(), coord.lat()])
                    );
                    turfFeature = turf.multiLineString(multiLineCoords);
                    break;
                default:
                    console.warn('Unsupported geometry type:', geometry.getType());
                    return; // Skip unsupported types
            }

            // Set properties on the Turf feature
            if (turfFeature) {
                turfFeature.properties = properties;
                geoJson.features.push(turfFeature);
            }
        }
    });
    return geoJson;
}

// function createSaveGeoJsonControl(map) {
//     const saveGeoJsonButton = document.createElement('button');
//     saveGeoJsonButton.className = "buttons";

//     saveGeoJsonButton.textContent = 'Save GeoJson';
//     saveGeoJsonButton.title = 'Click to save the displayed geojson objects';
//     saveGeoJsonButton.type = 'button';

//     // Setup the click event listener
//     saveGeoJsonButton.addEventListener('click', () => {
//         exportFeaturesToGeoJSON(secondaryLayer);
//     });

//     return saveGeoJsonButton;
// }

function createAuxButton() {
    auxButton = document.createElement('button');
    auxButton.className = "buttons";
    auxButton.textContent = "Default text";
    auxButton.type = 'button';
    auxButton.addEventListener('click', () => {
        if (countryMenu.value == "Mexico") {
            showAreas = !showAreas;
            if (showAreas) {
                auxButton.textContent = "Hide Area Boundaries";
                if (layerMenu.value == "Phone Codesall") showAllAreas();
                else loadGeoJSONFile('Layers/Mexico/' + layerMenu.value + '.geojson', "secondaryLayerClear");
            }
            else {
                clearSecondaryLayer();
                auxButton.textContent = "Show Area Boundaries";
            }
        }
        else if ((countryMenu.value == "South Africa") || (countryMenu.value == "Turkey") || (countryMenu.value == "Turkey Sandbox")) {
            // Get the currently selected index
            const currentSelection = layerMenu.selectedIndex;
            if (currentSelection < layerMenu.options.length - 1) {
                layerMenu.selectedIndex = currentSelection + 1;
            }
            else layerMenu.selectedIndex = 1;
            const event = new Event("change");
            layerMenu.dispatchEvent(event);
        }
        else if (countryMenu.value == "Indonesia") {
            showBorders = !showBorders;
            if (showBorders) {
                auxButton.textContent = "Hide Province Borders";
                loadGeoJSONFile('/Layers/Indonesia/Level1.geojson', "secondaryLayer", thickBlue);
            }
            else {
                clearSecondaryLayer();
                auxButton.textContent = "Show Province Borders";
            }
        }
        else if ((countryMenu.value == "Estonia") && (layerMenu.value == "Bike routes 1-16")) {
            clearSecondaryLayer();
            let numb = Number(markers[0].content.textContent.substring(11));
            numb++;
            if (numb == 7) numb = 11;
            if (numb == 17) numb = 1;
            const geopath = 'Layers/Estonia/geojson/B' + numb + '.geojson';
            loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
            //placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Route 2");
            markers[0].content.textContent = "Bike Route " + numb;
        }
        else if ((countryMenu.value == "Estonia") && (layerMenu.value == "3-digit bike routes")) {
            clearSecondaryLayer();
            let numb = Number(markers[0].content.textContent.substring(12, 14));
            colog(numb);
            numb++;
            if (numb == 15) numb = 16;
            if (numb == 17) numb = 20;
            if (numb == 21) numb = 22;
            if (numb == 24) numb = 26;
            if (numb == 27) numb = 28;
            if (numb == 29) numb = 30;
            if (numb == 31) numb = 32;
            if (numb == 38) numb = 14;
            const geopath = 'Layers/Estonia/geojson/B' + numb + 'x.geojson';
            loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
            //placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Route 2");
            markers[0].content.textContent = "Bike Routes " + numb + "0-" + numb + "9";
        }
        else if ((countryMenu.value == "Estonia") && (layerMenu.value == "Highways")) {
            clearSecondaryLayer();
            let numb = Number(markers[0].content.textContent.substring(9, 10));
            colog(numb);
            numb++;
            if (numb == 10) numb = 1;
            const geopath = 'Layers/Estonia/geojson/H' + numb + '.geojson';
            loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
            //placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Route 2");
            markers[0].content.textContent = "Highways " + numb + "0-" + numb + "9";
        }
        else if ((countryMenu.value == "Wales") && (layerMenu.value == "Most useful highway meta")) {
            clearSecondaryLayer();
            let hnames = ["A5x", "B5x", "A46", "A49", "B42"];
            let numb = markers[0].content.textContent.substring(0, 3);
            colog(numb);
            let index = hnames.indexOf(numb);
            index++;
            if (index == 5) index = 0;
            const geopath = 'Layers/Wales/' + hnames[index] + '.geojson';
            loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
            //placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Route 2");
            markers[0].content.textContent = hnames[index] + "xx";
            //"Highways " + numb + "0-" + numb + "9";
        } else if ((countryMenu.value == "Wales") && (layerMenu.value == "A Highways")) {
            clearSecondaryLayer();
            let hnames = ["A40", "A41", "A42", "A46", "A47", "A48", "A49", "A5x", "A50", "A51", "A52", "A53", "A54", "A55"];
            let numb = markers[0].content.textContent.substring(0, 3);
            colog(numb);
            let index = hnames.indexOf(numb);
            index++;
            if (index == 14) index = 0;
            const geopath = 'Layers/Wales/' + hnames[index] + '.geojson';
            loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3, 3));
            //placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Route 2");
            markers[0].content.textContent = hnames[index] + "xx";
            //"Highways " + numb + "0-" + numb + "9";
        }
        else if ((countryMenu.value == "Wales") && (layerMenu.value == "B Highways")) {
            clearSecondaryLayer();
            let hnames = ["B42", "B43", "B44", "B45", "B46", "B48", "B5x", "B50", "B51", "B53", "B54"];
            let numb = markers[0].content.textContent.substring(0, 3);
            colog(numb);
            let index = hnames.indexOf(numb);
            index++;
            if (index == 11) index = 0;
            const geopath = 'Layers/Wales/' + hnames[index] + '.geojson';
            loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3, 3));
            //placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Route 2");
            markers[0].content.textContent = hnames[index] + "xx";
            //"Highways " + numb + "0-" + numb + "9";
        }
        else if ((countryMenu.value == "Norway") && (layerMenu.value == "Highways")) {
            clearSecondaryLayer();
            let spornum = markers[0].content.textContent.substring(9, 10);
            let numb;
            if (spornum == "H") numb = 0;
            else if (spornum == " ") numb = 1;
            else {
                numb = Number(spornum);
                numb++;
            }
            colog(numb);
            if (numb == 10) {
                const geopath = 'Layers/Norway/HE.geojson';

                loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "Fg", -1, colll));
                removeAllMarkers();
                loadMarkerLayer(countryMenu.value, "Ex");
                //markers[0].content.textContent = "European Highways";
            }
            else if (numb == 0) {
                const geopath = 'Layers/Norway/H .geojson';
                loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "Fg", 0));
                removeAllMarkers();
                loadMarkerLayer(countryMenu.value, "0x");
                //markers[0].content.textContent = "Highways  2-9";
            }
            else {
                const geopath = 'Layers/Norway/H' + numb + '.geojson';
                loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "ref", 1));
                //markers[0].content.textContent = "Highways " + numb + "0-" + numb + "9";
                removeAllMarkers();
                loadMarkerLayer(countryMenu.value, numb + "x");
            }
        }
    });
    return auxButton;
}

export function showAuxButton(name) {
    const buttons = map.controls[google.maps.ControlPosition.TOP_CENTER];
    if (buttons.length == 3) buttons.pop();
    auxButton.textContent = name;
    buttons.push(auxButton);
}

function hideAuxButton() {
    const buttons = map.controls[google.maps.ControlPosition.TOP_CENTER];
    if (buttons.length == 3) buttons.pop();
}

// function getTransform(marker) {
//     let sc = 1;
//     let fszl = Number(marker.getAttribute("fszl"));
//     let mtype = marker.getAttribute("ggmmtype");
//     let isImage = mtype == "image";
//     if (fszl >= 0) {
//         let zoom = map.getZoom() - fszl;
//         if ((!isImage) && (zoom > 0)) sc = 1;
//         else {
//             sc = Math.pow(2, zoom); // Math.cos(lat * Math.PI / 180);
//             if (sc < settings.layerMin) sc = 0.1;
//         }
//         //let isName = marker.getAttribute("ggmmtype") == "name";
//         //if ((mtype == "name") && (sc > 1)) sc = 1;
//     }
//     let transform = "scale(" + sc + "," + sc + ")";
//     if (isImage) transform = 'translateY(50%) ' + transform;
//     return transform;
// }

// function placeNewMarker(map, position, content = "00", imagepath = "", type = "name", fszl = -1, draggable = true) {
//     colog("New marker " + markers.length);
//     let zIndex = 10;
//     if (content == "") zIndex = -1;

//     var marker = new google.maps.marker.AdvancedMarkerElement({
//         map: map,
//         position: position,
//         gmpDraggable: draggable,
//         zIndex: zIndex,
//     });
//     marker.setAttribute("ggmmtype", type.toString());
//     marker.setAttribute("fszl", fszl.toString());
//     setMarkerContent(marker, content, imagepath, type, fszl);
//     marker.addListener('click', (event) => {
//         if (editMode && event.domEvent.shiftKey && event.domEvent.metaKey) { // Shift-Command-Click = Increase size
//             let fszl = Number(marker.getAttribute("fszl"));
//             if (fszl == -1) console.log("Should not happen fszl=-1");
//             else {
//                 fszl--;
//                 marker.setAttribute("fszl", fszl.toString());
//                 marker.content.style.transform = getTransform(marker);
//             }
//         } else if (editMode && event.domEvent.shiftKey && event.domEvent.altKey) { // Shift-Option-Click = Decrease size
//             let fszl = Number(marker.getAttribute("fszl"));
//             if (fszl == -1) console.log("Should not happen fszl=-1");
//             else {
//                 fszl++;
//                 marker.setAttribute("fszl", fszl.toString());
//                 marker.content.style.transform = getTransform(marker);
//             }
//         } else if (editMode && event.domEvent.shiftKey) { // Shift-Click = DELETE
//             colog(markers.length);
//             marker.setMap(null);
//             const index = markers.indexOf(marker);
//             if (index > -1) { // only splice array when item is found
//                 markers.splice(index, 1); // 2nd parameter means remove one item only
//             }
//             colog(markers.length);
//         } else if (editMode && event.domEvent.altKey) { // Option-Click = Change to red backgroung
//             const mtype = marker.getAttribute("ggmmtype");
//             colog(mtype);
//             if (mtype == "name") {
//                 marker.content.style.setProperty('--marker-color', colors[3]);
//                 marker.setAttribute("ggmmtype", "text3");
//             }
//             else if (mtype.startsWith("text")) {
//                 let col = Number(mtype[4]);
//                 col++;
//                 if (col == 10) col = 0;
//                 colog(col);
//                 marker.content.style.setProperty('--marker-color', colors[col]);
//                 marker.setAttribute("ggmmtype", "text" + col);
//             }
//         } else { // Default Operation
//             colog(position);
//             if (type == "image") {
//                 infoWindow.close();
//                 const img = document.createElement('img');
//                 img.src = imagepath;
//                 img.onload = function () {
//                     // Once the image is loaded, get its dimensions
//                     var width = this.naturalWidth;
//                     var height = this.naturalHeight;
//                     //console.log(window.screen.height);
//                     //console.log(window.screen.width);
//                     const maxh = Math.floor(window.screen.height * 0.9);
//                     // Set max height
//                     if (height > maxh) {
//                         img.style.setProperty('--iwmh', maxh.toString());
//                     }
//                     else {
//                         img.style.setProperty('--iwmh', height.toString());
//                     }
//                     const maxw = Math.floor(window.screen.width * 0.9);
//                     if (width > maxw) {
//                         // Set max width
//                         infoWindow.setOptions({
//                             maxWidth: maxw
//                         });
//                     }
//                     else {
//                         infoWindow.setOptions({
//                             maxWidth: Math.floor(width * 1.1)
//                         });
//                     }
//                     infoWindow.setContent(img);
//                     infoWindow.class = "custom-infowindow";

//                     const bounds = map.getBounds();
//                     const northLat = bounds.getNorthEast().lat();
//                     const southLat = bounds.getSouthWest().lat();
//                     const latDifference = northLat - southLat;
//                     const mapHeight = map.getDiv().offsetHeight;
//                     const cen = map.getCenter();
//                     const goDown = (height / 2) * latDifference / mapHeight;
//                     const newLat = cen.lat() - goDown;
//                     infoWindow.setPosition({ lat: newLat, lng: cen.lng() });
//                     infoWindow.open(map);
//                 };
//             }
//             else if (editMode) {
//                 var result = prompt("Enter new value for marker:", marker.content.textContent);
//                 let thistype = marker.getAttribute("ggmmtype");
//                 if (result) setMarkerContent(marker, result, marker.content.src, marker.getAttribute("ggmmtype"), fszl);
//             }
//         }
//     });
//     markers.push(marker);
// }

function showContextMenu(event, menuItems) {
    // Create the context menu container dynamically
    if (!contextMenu) {
      contextMenu = document.createElement("div");
      contextMenu.className = "contextMenu";
      document.body.appendChild(contextMenu);
    }

    // Clear the existing menu items
    const menuList = document.createElement("ul");
    contextMenu.innerHTML = ''; // Clear any existing content
    contextMenu.appendChild(menuList);

    menuItems.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.label;
      li.onclick = item.action; // Attach the action to the click event
      menuList.appendChild(li);
    });

    // Get the position of the right-click
    // const projection = map.getProjection();
    // const point = projection.fromLatLngToPoint(event);
    // colog(point);

    // Set the position of the context menu
    contextMenu.style.left = `${event.domEvent.clientX}px`;
    contextMenu.style.top = `${event.domEvent.clientY}px`;

    // Display the context menu
    contextMenu.style.display = "block";

    // Close the menu when clicked outside
    google.maps.event.addListenerOnce(map, "click", function() {
      contextMenu.style.display = "none";
    });
}

async function initMap(): void {

    //@ts-ignore
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { StreetViewCoverageLayer } = await google.maps.importLibrary("streetView");
    streetViewLayer = new google.maps.StreetViewCoverageLayer();

    await initializeGlobals();
    const globals = getGlobals();
    map = globals.map;
    boundaryLayer = globals.boundaryLayer;
    secondaryLayer = globals.secondaryLayer;
    infoWindow = globals.infoWindow;

    // map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
    //     center: new google.maps.LatLng(0, 0),
    //     zoom: 2,
    //     mapId: 'DEMO_MAP_ID',
    //     zoomControl: false,
    //     scaleControl: true,
    //     streetViewControl: true,
    //     disableDoubleClickZoom: true,
    //     mapTypeControl: false,
    //     // mapTypeControlOptions: {
    //     //     style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
    //     //     mapTypeIds: ["roadmap", "terrain"],
    //     // },
    // });

    //boundaryLayer = new google.maps.Data();
    boundaryLayer.setMap(map);
    boundaryLayer.setStyle({
        zIndex: 1,
        fillOpacity: 0,
        strokeOpacity: 1
    });

    //secondaryLayer = new google.maps.Data();
    secondaryLayer.setMap(map);
    secondaryLayer.setStyle({
        zIndex: 2,
        fillOpacity: 0,
        strokeOpacity: 1,
        strokeColor: 'black'
    });

    google.maps.event.addListener(map, "rightclick", function (event) {
        //colog(event);
        
        if (flags.editMode) {
            let menuItems: { label: string; action: () => void }[] = [];
            if (rec) {
                menuItems = [
                    { label: "Exact delete", action: splitAndDelete },
                    { label: "Delete touching features", action: deleteTouchingGeojsonFeatures },
                    { label: "Hide Rectangle", action: hideRectangleAndContextMenu },
                ];
            }
            else {
                menuItems = [
                    { label: "Select using rectangle", action: () => showRectangle(event) },
                    { label: "Option 2", action: function () { alert("Option 2 clicked!"); } },
                    { label: "Option 3", action: function () { alert("Option 3 clicked!"); } },
                ];
            }
            showContextMenu(event, menuItems);
        }
    });

    // List of events you want to propagate from the data layer to the map
    const eventsToPropagate = ["click", "mouseup", "dblclick", "rightclick"];

    // Function to propagate events from the data layer to the map
    eventsToPropagate.forEach((eventType) => {
        boundaryLayer.addListener(eventType, (event) => {
            colog(event);
            google.maps.event.trigger(map, eventType, event);
            //google.maps.event.trigger(map, `layer_${eventType}`, event);
        });
        secondaryLayer.addListener(eventType, (event) => {
            google.maps.event.trigger(map, eventType, event);
            //google.maps.event.trigger(map, `layer_${eventType}`, event);
        });
    });

    map.addListener('dblclick', function (event) {
        if (flags.editMode) {
            if (event.domEvent.shiftKey) {
                if (!rec) showRectangle(event);
                else if (rec) {
                    deleteTouchingGeojsonFeatures();
                }
            }
            else placeNewMarker(map, event.latLng);
        }
    });

    map.addListener('click', function (event) {
        if (flags.editMode && event.feature) {
            //secondaryLayer.remove(event.feature);
            colog(event.feature);
        }
        else infoWindow.close();
        // if (editMode && event.domEvent.shiftKey) {
        //     if (!rec) {
        //         startLatLng = event.latLng;
        //         const newLatLng = new google.maps.LatLng(
        //             startLatLng.lat() + 1,
        //             startLatLng.lng() + 1
        //           );
        //         rectangle = new google.maps.Rectangle({
        //             bounds: new google.maps.LatLngBounds(startLatLng, newLatLng),
        //             map: map,
        //             editable: true,
        //             draggable: true,
        //         });
        //         rec = true;
        //     }
        //     else if (rec) {
        //         const bounds = rectangle.getBounds();
        //         console.log("Rectangle Bounds:", bounds.toJSON());
        //         rec = false;
        //     }
        // }
    });

    map.addListener('mouseup', function (e) {
        infoWindow.close();
    });

    //       // Start drawing the rectangle on mouse down
    //   map.addListener("mousedown", (event) => {
    //     startLatLng = event.latLng;
    //     rectangle = new google.maps.Rectangle({
    //       bounds: new google.maps.LatLngBounds(startLatLng, startLatLng),
    //       map: map,
    //       editable: true,
    //       draggable: true,
    //     });
    //     rec = true;
    //     // map.addListener("mousemove", onMouseMove);
    //     // map.addListener("mouseup", onMouseUp);
    //   });

    //   map.addListener("mousemove", (event) => {
    //     if (editMode && event.domEvent.shiftKey && rec) {
    //     const bounds = new google.maps.LatLngBounds(startLatLng, event.latLng);
    //     rectangle.setBounds(bounds);
    //     }
    //   });

    //   map.addListener("mouseup", (event) => {
    //     if (rec) {
    //         const bounds = rectangle.getBounds();
    //         console.log("Rectangle Bounds:", bounds.toJSON());
    //         rec = false;
    //         map.setOptions({ draggable: true });
    //     }
    //   });

    // // Update the rectangle as the mouse moves
    // function onMouseMove(event) {
    //   const bounds = new google.maps.LatLngBounds(startLatLng, event.latLng);
    //   rectangle.setBounds(bounds);
    // }

    // // Stop drawing on mouse up
    // function onMouseUp() {
    //   google.maps.event.clearListeners(map, "mousemove");
    //   google.maps.event.clearListeners(map, "mouseup");

    //   // Log the coordinates of the rectangle bounds
    //   const bounds = rectangle.getBounds();
    //   console.log("Rectangle Bounds:", bounds.toJSON());
    // }

    // map.addListener("mousedown", (event) => {
    // // Initialize the Drawing Manager
    // const drawingManager = new google.maps.drawing.DrawingManager({
    //     drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
    //     drawingControl: true,
    //     drawingControlOptions: {
    //       position: google.maps.ControlPosition.TOP_CENTER,
    //       //drawingModes: ["rectangle"], // Only enable rectangle drawing
    //     },
    //     rectangleOptions: {
    //       fillColor: "#FF0000",
    //       fillOpacity: 0.2,
    //       strokeWeight: 2,
    //       clickable: true,
    //       editable: true,
    //       draggable: true,
    //     },
    //   });

    //   // Add the Drawing Manager to the map
    //   drawingManager.setMap(map);

    //   // Add an event listener to capture the bounds of the drawn rectangle
    //   google.maps.event.addListener(drawingManager, "rectanglecomplete", function(rectangle) {
    //     const bounds = rectangle.getBounds();
    //     console.log("Rectangle bounds:", bounds.toString());

    //     // You can use `bounds.getNorthEast()` and `bounds.getSouthWest()` 
    //     // to get the coordinates of the corners if needed.

    //     // Optional: Remove the rectangle after drawing
    //     drawingManager.setDrawingMode(null); // Switch off drawing mode
    //   });
    // });

    // boundaryLayer.addListener('click', function (e) {
    //         infoWindow.close();
    //         colog(e.feature);
    //     });

    //     boundaryLayer.addListener('mouseup', function (e) {
    //         infoWindow.close();
    //     });

    boundaryLayer.addListener('mousedown', function (e) {
        // infoWindow.close();
        // colog(e.feature);
        if (flags.displayPopups && !flags.editMode) {
            let name = e.feature.getProperty(settings.popupPropertyName);
            if (name) {
                name = removeAccentsAndUpperCase(splitCamelCase(name));
                infoWindow.setContent('<h2 style="color: black;">' + name + '</h2>');
                //infoWindow.setStyle = "popup-infowindow";
                infoWindow.setPosition(e.latLng);
                infoWindow.open(map);
            };
        }
    });

    // secondaryLayer.addListener('click', function (e) {
    //     infoWindow.close();
    // });

    // secondaryLayer.addListener('mouseup', function (e) {
    //     infoWindow.close();
    // });

    secondaryLayer.addListener('mousedown', function (e) {
        infoWindow.close();
        //To remove the feature being clicked on
        if (flags.editMode && e.domEvent.shiftKey) colog("hi"); //secondaryLayer.remove(e.feature);
        else {
            //colog(e);
            let name = e.feature.getProperty('ref');
            if (name) {
                infoWindow.setContent('<h2 style="color: black;">' + name + '</h2>');
                //infoWindow.content.class = "popup-infowindow";
                infoWindow.setPosition(e.latLng);
                infoWindow.open(map);
            };
        }
    });

    // boundaryLayer.addListener('dblclick',function(e){
    //   if (editMode) placeNewMarker(map, e.latLng);
    // });

    document.addEventListener('keydown', function (event) {
        if (!event.repeat) {
            if (event.key === 'Escape') {
                boundaryLayer.setMap(null);
                secondaryLayer.setMap(null);
                hideAllMarkers();
            }
        }
    });

    document.addEventListener('keyup', function (event) {
        if (!event.repeat) {
            if (event.key === 'Escape') {
                boundaryLayer.setMap(map);
                secondaryLayer.setMap(map);
                showAllMarkers();
            }
        }
    });

    map.addListener('zoom_changed', function () {
        console.log(map.getZoom());
        for (let i = 0; i < markers.length; i++) {
            //let fszl = Number(markers[i].getAttribute("fszl"));
            markers[i].content.style.transform = getTransform(markers[i]);
            // if (markers[i].content instanceof google.maps.LatLng)
        }
    });

    // const maxw = Math.floor(window.screen.width * 0.9);
    // infoWindow = new google.maps.InfoWindow({
    //     maxWidth: maxw // Set a maximum width for the InfoWindow
    //     // maxHeight: 1800 // No such option
    // });

    

    const terrainDiv = createButtonDiv("terrainButton");
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(terrainDiv);

    const coverageDiv = createButtonDiv("coverageButton");
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(coverageDiv);

    const editModeDiv = createButtonDiv("editModeButton");
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(editModeDiv);

    saveLocsDiv = createButtonDiv("saveLocsButton");
    saveLayerDiv = createButtonDiv("saveLayerButton");
    saveGeoJsonDiv = createButtonDiv("saveGeoJsonButton");
    editDocDiv = createButtonDiv("editDocButton");
    
    // Create the country drop down menu
    const countrySelectDiv = document.createElement('div');
    // countryMenu = 
    createCountryChooser(map);
    countrySelectDiv.appendChild(countryMenu);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(countryMenu);


    // Create the layer drop down menu
    const layerSelectDiv = document.createElement('div');
    //layerMenu = 
    createLayerChooser(map);
    layerSelectDiv.appendChild(layerMenu);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(layerMenu);

    // Create the aux button
    //const auxDiv = document.createElement('div');
    auxButton = createAuxButton();
    //auxDiv.appendChild(auxButton);
    //map.controls[google.maps.ControlPosition.TOP_CENTER].push(auxButton);

    if (urlCountry) {
        countryMenu.value = urlCountry;
        countryMenu.dispatchEvent(new Event('change'));
    }
    if (urlLayer) {
        layerMenu.value = urlLayer;
        layerMenu.dispatchEvent(new Event('change'));
    }

}

/**
 * Creates a rectangle on the map that looks proportionally correct regardless of latitude.
 *
 * @param {google.maps.Map} map - The Google Maps instance.
 * @param {google.maps.LatLng} center - The center of the rectangle.
 * @param {number} widthKm - The width of the rectangle in kilometers.
 * @param {number} heightKm - The height of the rectangle in kilometers.
 * @returns {google.maps.Rectangle} - The rectangle instance added to the map.
 */
function createProportionalRectangle(map, center, widthKm, heightKm) {
    const EARTH_RADIUS = 6371; // Earth's radius in kilometers
  
    const lat = center.lat();
    const lng = center.lng();
  
    // Convert width and height in kilometers to degrees
    const heightDegrees = (heightKm / EARTH_RADIUS) * (180 / Math.PI);
    const widthDegrees =
      (widthKm / EARTH_RADIUS) * (180 / Math.PI) / Math.cos((lat * Math.PI) / 180);
  
    // Calculate bounds
    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(lat - heightDegrees / 2, lng - widthDegrees / 2),
      new google.maps.LatLng(lat + heightDegrees / 2, lng + widthDegrees / 2)
    );
  
    // Create the rectangle
    const rectangle = new google.maps.Rectangle({
      bounds: bounds,
      map: map,
      editable: true,
      draggable: true,
    });
  
    return rectangle;
  }
  
function showRectangle(event: any) {
        startLatLng = event.latLng;
        const side = Math.pow(2,(13 - map.getZoom()));
        rectangle = createProportionalRectangle(map, startLatLng, side, side);
        rec = true;
        contextMenu.style.display = "none";
}

/**
 * Processes a LineString, adding points to the geometry whenever a segment intersects the given bounds.
 *
 * @param {google.maps.Data} dataLayer - The Google Maps Data layer.
 * @param {google.maps.Data.LineString} lineString - The LineString to process.
 * @param {google.maps.LatLngBounds} bounds - The bounds to check for intersections.
 */
// function addPointsAtBoundsIntersections(dataLayer, lineString, bounds) {
//     const expandedCoordinates = [];
//     const coordinates = lineString.getGeometry().getArray();
  
//     // Convert bounds to a polygon for easier intersection checks
//     const boundsPolygon = [
//       bounds.getSouthWest(),
//       new google.maps.LatLng({ lat: bounds.getSouthWest().lat(), lng: bounds.getNorthEast().lng() }),
//       bounds.getNorthEast(),
//       new google.maps.LatLng({ lat: bounds.getNorthEast().lat(), lng: bounds.getSouthWest().lng() }),
//       bounds.getSouthWest(),
//     ];
  
//     colog(boundsPolygon);

//     /**
//      * Helper function to check if two line segments intersect and return the intersection point.
//      * @param {google.maps.LatLng} p1 - Start of first segment.
//      * @param {google.maps.LatLng} p2 - End of first segment.
//      * @param {google.maps.LatLng} q1 - Start of second segment (from bounds).
//      * @param {google.maps.LatLng} q2 - End of second segment (from bounds).
//      * @returns {google.maps.LatLng|null} - Intersection point or null.
//      */
//     function getIntersection(p1, p2, q1, q2) {
//       const toLatLng = ({ lat, lng }) => ({ x: lng, y: lat });
  
//       const p = toLatLng(p1);
//       const r = { x: p2.lng() - p1.lng(), y: p2.lat() - p1.lat() };
  
//       const q = toLatLng(q1);
//       const s = { x: q2.lng() - q1.lng(), y: q2.lat() - q1.lat() };
  
//       const crossRS = r.x * s.y - r.y * s.x;
//       const crossQP = (q.x - p.x) * r.y - (q.y - p.y) * r.x;
  
//       if (crossRS === 0) {
//         return null; // Lines are parallel
//       }
  
//       const t = ((q.x - p.x) * s.y - (q.y - p.y) * s.x) / crossRS;
//       const u = crossQP / crossRS;
  
//       if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
//         // Intersection point
//         return new google.maps.LatLng(p.y + t * r.y, p.x + t * r.x);
//       }
//       return null;
//     }
  
//     // Process each segment in the LineString
//     for (let i = 0; i < coordinates.length - 1; i++) {
//       const start = coordinates[i];
//       const end = coordinates[i + 1];
  
//       expandedCoordinates.push(start);
  
//       for (let j = 0; j < boundsPolygon.length - 1; j++) {
//         const boundStart = boundsPolygon[j];
//         const boundEnd = boundsPolygon[j + 1];
//         const intersection = getIntersection(start, end, boundStart, boundEnd);
  
//         if (intersection) {
//           expandedCoordinates.push(intersection);
//         }
//       }
//     }
  
//     expandedCoordinates.push(coordinates[coordinates.length - 1]);
  
//     // Replace the original LineString with the updated version
//     //dataLayer.remove(dataLayer.getFeatureById(lineString.getId()));
//     dataLayer.remove(lineString);
//     const newLineString = new google.maps.Data.LineString(expandedCoordinates);
//     dataLayer.add(new google.maps.Data.Feature({ geometry: newLineString }));
//   }
  
/**
* Calculates the distance between two google.maps.LatLng points using the Haversine formula.
*
* @param {google.maps.LatLng} point1 - The first point.
* @param {google.maps.LatLng} point2 - The second point.
* @returns {number} - The distance between the two points in kilometers.
*/
function calculateDistance(point1, point2) {
    const toRadians = (degrees) => degrees * (Math.PI / 180);

    const R = 6371; // Radius of the Earth in kilometers
    const lat1 = point1.lat();
    const lng1 = point1.lng();
    const lat2 = point2.lat();
    const lng2 = point2.lng();

    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in kilometers
}
  
/**
* Processes a LineString, splitting it into two LineStrings whenever a segment intersects the given bounds.
*
* @param {google.maps.Data} dataLayer - The Google Maps Data layer.
* @param {google.maps.Data.LineString} lineString - The LineString to process.
* @param {google.maps.LatLngBounds} bounds - The bounds to check for intersections.
*/
function splitAndDeleteLineString(dataLayer, lineString, bounds) {
    const geometry = lineString.getGeometry();
    const coordinates = geometry.getArray();
    const properties = {};
    lineString.forEachProperty((value, key) => {
        properties[key] = value;
    });

    const newLineStrings = [];
    let currentLineString = [];
    let intersectionFound = false;

    // Convert bounds to a polygon for easier intersection checks
    const boundsPolygon = [
        bounds.getSouthWest(),
        new google.maps.LatLng({ lat: bounds.getSouthWest().lat(), lng: bounds.getNorthEast().lng() }),
        bounds.getNorthEast(),
        new google.maps.LatLng({ lat: bounds.getNorthEast().lat(), lng: bounds.getSouthWest().lng() }),
        bounds.getSouthWest(),
    ];

    /**
     * Helper function to check if two line segments intersect and return the intersection point.
     * @param {google.maps.LatLng} p1 - Start of first segment.
     * @param {google.maps.LatLng} p2 - End of first segment.
     * @param {google.maps.LatLng} q1 - Start of second segment (from bounds).
     * @param {google.maps.LatLng} q2 - End of second segment (from bounds).
     * @returns {google.maps.LatLng|null} - Intersection point or null.
     */
    function getIntersection(p1, p2, q1, q2) {
        const toXY = (ll) => ({ x: ll.lng(), y: ll.lat() });

        const p = toXY(p1);
        const r = { x: p2.lng() - p1.lng(), y: p2.lat() - p1.lat() };

        const q = toXY(q1);
        const s = { x: q2.lng() - q1.lng(), y: q2.lat() - q1.lat() };

        const crossRS = r.x * s.y - r.y * s.x;
        const crossQP = (q.x - p.x) * r.y - (q.y - p.y) * r.x;

        if (crossRS === 0) {
            return null; // Lines are parallel
        }

        const t = ((q.x - p.x) * s.y - (q.y - p.y) * s.x) / crossRS;
        const u = crossQP / crossRS;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            // Intersection point
            return new google.maps.LatLng(p.y + t * r.y, p.x + t * r.x);
        }
        return null;
    }

    // Process each segment in the LineString
    for (let i = 0; i < coordinates.length - 1; i++) {
        const start = coordinates[i];
        const end = coordinates[i + 1];
        let segmentSplit = false;

        currentLineString.push(start);
        let intersectionPoints = [];
        for (let j = 0; j < boundsPolygon.length - 1; j++) {
            const boundStart = boundsPolygon[j];
            const boundEnd = boundsPolygon[j + 1];
            const intersection = getIntersection(start, end, boundStart, boundEnd);
            if (intersection) { intersectionPoints.push(intersection); }
        }

        if (intersectionPoints.length > 0) {
            segmentSplit = true;
            intersectionFound = true;
            if (intersectionPoints.length == 1) {
                colog("Single Intersection Found");
                const intersection = intersectionPoints[0];
                if (bounds.contains(end)) {
                    currentLineString.push(intersection); // Add the intersection point
                    newLineStrings.push(new google.maps.Data.LineString(currentLineString)); // Create a new LineString up to the intersection
                    currentLineString = []; // To get ready for the next lineString
                } else {
                    // currentSegment.push(intersection); // Add the intersection point
                    // newLineStrings.push(new google.maps.Data.LineString(currentSegment)); // Create a new LineString up to the intersection
                    currentLineString = [intersection]; // Start a new segment from the intersection
                }
            } else if (intersectionPoints.length == 2) {
                colog("Double Intersection Found");
                const distance0 = calculateDistance(start, intersectionPoints[0]);
                const distance1 = calculateDistance(start, intersectionPoints[1]);
                if (distance0 < distance1) {
                    currentLineString.push(intersectionPoints[0]); // Add the intersection point
                    newLineStrings.push(new google.maps.Data.LineString(currentLineString)); // Create a new LineString up to the intersection
                    currentLineString = [intersectionPoints[1]]; // Start a new segment from the intersection
                } else {
                    currentLineString.push(intersectionPoints[1]); // Add the intersection point
                    newLineStrings.push(new google.maps.Data.LineString(currentLineString)); // Create a new LineString up to the intersection
                    currentLineString = [intersectionPoints[0]]; // Start a new segment from the intersection
                }
            } else colog("More than two intersections, should not be possible");
        } else { //No intersection points, probably not needed
            let isInside = bounds.contains(start);
            if (isInside) currentLineString = []; // Restart the next lineString
        }
        //if  {
        if ((i == coordinates.length - 2) && (!segmentSplit) && (currentLineString.length > 0)) { // At the last segment, add the end point if needed
            currentLineString.push(end);
            newLineStrings.push(new google.maps.Data.LineString(currentLineString));
        }
    }

    // Add the last segment
    // if (currentLineString) {
    //     newLineStrings.push(new google.maps.Data.LineString(currentLineString));
    // }


    // Remove the original LineString and add the new segments
    dataLayer.remove(lineString);
    newLineStrings.forEach((newLineString) => {
        let l = newLineString.getArray().length;
        if (l < 2) {
            colog("Linestring with " + l + " coordinates found.");
            colog(newLineString);
            colog(properties);
            if (l == 1) colog(newLineString.getArray()[0]);
            if (l == 1) placeNewMarker(map, newLineString.getArray()[0], "Here");
        }
        dataLayer.add(new google.maps.Data.Feature({ geometry: newLineString, properties: properties }));

    }
    );

    colog(newLineStrings);
    // Indicate if an intersection was found
    return intersectionFound;
}

/**
 * Shrinks a bounds object by moving each side slightly closer to the center.
 *
 * @param {google.maps.LatLngBounds} bounds - The original bounds to shrink.
 * @param {number} shrinkFactor - The fraction by which to shrink each side (e.g., 0.1 = 10%).
 * @returns {google.maps.LatLngBounds} - The new, shrunken bounds.
 */
// function shrinkBounds(bounds, shrinkFactor) {
//     if (shrinkFactor <= 0 || shrinkFactor >= 1) {
//       throw new Error("shrinkFactor must be between 0 and 1.");
//     }
  
//     const sw = bounds.getSouthWest();
//     const ne = bounds.getNorthEast();
  
//     // Calculate the new coordinates
//     const latDiff = (ne.lat() - sw.lat()) * shrinkFactor;
//     const lngDiff = (ne.lng() - sw.lng()) * shrinkFactor;
  
//     const newSw = new google.maps.LatLng(sw.lat() + latDiff, sw.lng() + lngDiff);
//     const newNe = new google.maps.LatLng(ne.lat() - latDiff, ne.lng() - lngDiff);
  
//     return new google.maps.LatLngBounds(newSw, newNe);
//   }
  
function splitAndDelete() {
    const bounds = rectangle.getBounds();
    secondaryLayer.forEach((feature) => {
        replaceFeatureWithLineStrings(secondaryLayer, feature);
    });
    secondaryLayer.forEach((feature) => {
        const geometryType = feature.getGeometry().getType();
        //colog(geometryType);
        if (geometryType == "LineString") splitAndDeleteLineString(secondaryLayer, feature, bounds);
    });
    hideRectangleAndContextMenu();
}

function hideRectangleAndContextMenu() {
    contextMenu.style.display = "none";
    rectangle.setMap(null);
    rec = false;
}

function deleteTouchingGeojsonFeatures() {
    const bounds = rectangle.getBounds();
    secondaryLayer.forEach((feature) => {
        const geometry = feature.getGeometry();

        // For Point geometries
        if (geometry.getType() === "Point") {
            const position = geometry.get();
            if (bounds.contains(position)) {
                console.log("Feature within bounds:", feature);
                secondaryLayer.remove(feature);
            }
        }

        // For other geometry types like LineString or Polygon
        else {
            let isInBounds = false;
            geometry.forEachLatLng((latLng) => {
                if (bounds.contains(latLng)) {
                    isInBounds = true;
                }
            });
            if (isInBounds) {
                console.log("Feature within bounds:", feature);
                secondaryLayer.remove(feature);
            }
        }
    });
    hideRectangleAndContextMenu();
}


async function addImagesToZip(zip, images, folderName) {
    // Create a folder in the ZIP
    const folder = zip.folder(folderName);
  
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
  
      // Set the canvas dimensions to match the image
      canvas.width = img.width;
      canvas.height = img.height;
  
      // Draw the image onto the canvas
      ctx.drawImage(img, 0, 0, img.width, img.height);
  
      let extension = img.alt.split('.').pop();
      if (extension == "jpg") extension = "jpeg";
      // Convert the canvas to a data URL and extract the Base64 data
      const dataUrl = canvas.toDataURL('image/' + extension);
      const base64Data = dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      //const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
  
      // Add the image as a file in the specified folder
      //folder.file(`image-${i + 1}.png`, base64Data, { base64: true });
      const imgName = img.alt;
      folder.file(imgName, base64Data, { base64: true });
    }
  
    return zip;
  }
  
  
// function setMarkerContent(marker, text, imagepath, type, fszl) {

//     if (type == "image") {
//         const img = document.createElement('img');
//         img.src = imagepath;
//         img.onload = function () {
//             var height = this.height;
//             let zoomReduction = 0;
//             while (height > 200) {
//                 zoomReduction++;
//                 height = height / 2.0;
//             }
//             if (fszl == -1) fszl = map.getZoom() + zoomReduction;
//             marker.setAttribute("fszl", fszl.toString());
//             img.style.transform = getTransform(marker);
//             img.alt = text;
//             marker.content = img;
//         };
//     }
//     else { // We are dealing with a text marker
//         const markerDiv = document.createElement('div');
//         markerDiv.className = "text-marker";
//         if (type.startsWith("text") && (type.length == 5)) {
//             const col = Number(type[4]);
//             markerDiv.style.setProperty('--marker-color', colors[col]);
//         }
//         else if (type == "digit2") {
//             let ch = text[settings.colourDigit];
//             if (!isNaN(ch)) {
//                 //console.log(ch);
//                 markerDiv.style.setProperty('--marker-color', colors[ch]);
//             }
//         }
//         markerDiv.textContent = text.toString();
//         marker.content = markerDiv;
//         marker.content.style.transform = getTransform(marker);
//     }
// }

// async function loadMarkers(path: string, imagepathdir: string): void {

//     let response = await fetch(path);
//     if (!response.ok) {
//         console.log(path + " does not exist");
//     }
//     else {
//         const contentType = response.headers.get('Content-Type');
//         if (contentType && contentType.includes('application/json')) {
//             let markerLocData = await response.json();
//             for (let markerLoc of markerLocData) {
//                 let position = { lat: markerLoc.lat, lng: markerLoc.lng };
//                 let text = markerLoc.text.toString();
//                 let imagepath = imagepathdir + text;
//                 //console.log(imagepath);
//                 placeNewMarker(map, position, text, imagepath, markerLoc.type, markerLoc.fszl, false);
//             }
//         }
//     }
// }

function loadMarkersBootStrap(): void {

    const infoWindow = new google.maps.InfoWindow();

    for (let i = 0; i < 70; i++) {

        const phoneCode = document.createElement('div');
        phoneCode.className = 'area-code';
        let code = 20 + i;
        phoneCode.textContent = code.toString();

        let marker = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: 40 + i / 9.9, lng: 25 },
            content: phoneCode,
            gmpDraggable: true,
        });

        markers.push(marker);

        markers[i].addListener('dragend', (event) => {
            const position = markers[i].position as google.maps.LatLng;
            infoWindow.close();
            infoWindow.setContent(`Pin dropped at: ${position.lat}, ${position.lng}`);
            infoWindow.open(markers[i].map, markers[i]);
        });
    }
}

// function clearSecondaryLayer() {
//     secondaryLayer.forEach(function (feature) {
//         secondaryLayer.remove(feature);
//     });
// }

// function loadGeoJsonString(geoString: string, layer = "boundaryLayer", postProcess) {
//     try {
//         //colog(geoString);
//         const geojson = JSON.parse(geoString) as any;
//         //colog(geojson);
//         if (layer == "boundaryLayer") {
//             let newFeatures = boundaryLayer.addGeoJson(geojson);
            
//             if (postProcess) postProcess(newFeatures);
//             zoom(map);
//         }
//         else if (layer.startsWith("secondaryLayer")) {
//             if (layer == "secondaryLayerClear") clearSecondaryLayer();
//             let newFeatures = secondaryLayer.addGeoJson(geojson);
//             colog("newFeatures");
//             colog(newFeatures);
//             if (postProcess) postProcess(newFeatures);
//         }
//         else console.log("Unknown layer");
//     } catch (e) {
//         console.log(e);
//         colog("Error loading GeoJSON file!");
//     }
// }

// /**
//  * Update a map's viewport to fit each geometry in a dataset
//  */
// function zoom(map: google.maps.Map, layer = "boundaryLayer") {
//     const bounds = new google.maps.LatLngBounds();
//     if (layer == "boundaryLayer") {
//         boundaryLayer.forEach((feature) => {
//             const geometry = feature.getGeometry();
//             if (geometry) {
//                 processPoints(geometry, bounds.extend, bounds);
//             }
//         });
//     }
//     else if (layer == "secondaryLayer") {
//         secondaryLayer.forEach((feature) => {
//             const geometry = feature.getGeometry();
//             if (geometry) {
//                 processPoints(geometry, bounds.extend, bounds);
//             }
//         });
//     }
//     else console.log("Weird 001");
//     map.fitBounds(bounds);
// }

/**
 * Process each point in a Geometry, regardless of how deep the points may lie.
 */
// function processPoints(
//     geometry: google.maps.LatLng | google.maps.Data.Geometry,
//     callback: any,
//     thisArg: google.maps.LatLngBounds
// ) {
//     if (geometry instanceof google.maps.LatLng) {
//         callback.call(thisArg, geometry);
//     } else if (geometry instanceof google.maps.Data.Point) {
//         callback.call(thisArg, geometry.get());
//     } else {
//         // @ts-ignore
//         geometry.getArray().forEach((g) => {
//             processPoints(g, callback, thisArg);
//         });
//     }
// }



// async function loadGeoJSONFile(path: string, layer = "boundaryLayer", postProcess?) {
//     let response = await fetch(path);
//     let contents = await response.text();
//     if (contents) {
//         loadGeoJsonString(contents, layer, postProcess);
//     }
// }

/* DOM (drag/drop) functions */
function initEvents() {
    //[...document.getElementsByClassName("file")].forEach((fileElement) => {
    //    fileElement.addEventListener(
    //        "dragstart",
    //        (e: Event) => {
    //            // @ts-ignore
    //            e.dataTransfer.setData(
    //                "text/plain",
    //                JSON.stringify(files[Number((e.target as HTMLElement).dataset.value)])
    //            );
    //            console.log(e);
    //            console.log("ERTERT");
    //        },
    //        false
    //    );
    //});

    // set up the drag & drop events
    const mapContainer = document.getElementById("map") as HTMLElement;

    mapContainer.addEventListener("dragenter", addClassToDropTarget, false);
    mapContainer.addEventListener("dragover", addClassToDropTarget, false);
    mapContainer.addEventListener("drop", handleDrop, false);
    mapContainer.addEventListener("dragleave", removeClassFromDropTarget, false);
}

function addClassToDropTarget(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    document.getElementById("map")!.classList.add("over");
    return false;
}

function removeClassFromDropTarget(e: Event) {
    document.getElementById("map")!.classList.remove("over");
}

async function handleDrop(e: DragEvent) {
    
    e.preventDefault();
    e.stopPropagation();
    removeClassFromDropTarget(e);
    if (!flags.editMode) return;
    const files = (e.dataTransfer as DataTransfer).files;

    if (files.length) {
        for (let i = 0, file; (file = files[i]); i++) {

            if (file.type === "application/zip" || file.type === "application/x-zip-compressed" || file.name.endsWith(".zip")) {
                const zipFile = files[0];
                const jszip = new JSZip();
                try {
                    const zip = await jszip.loadAsync(zipFile); // Load the ZIP file
                    const folderNames = Object.keys(zip.files).filter(name => name.endsWith("/"));
                    const fileNames = Object.keys(zip.files).filter(name => !name.endsWith("/"));
                    const imageDir = folderNames.find(name => name.endsWith(" Images/"));
                    if (!imageDir) {
                        colog("No image directory found in the main folder.");
                        return;
                    }
                    const geoJsonDir = folderNames.find(name => name.endsWith(" geojson/"));
                    const jsonFile = fileNames.find(name => name.endsWith(".json"));
                    if (!jsonFile) {
                        colog("No JSON file found in the main folder.");
                        return;
                    }
                    const jsonContent = await zip.files[jsonFile].async("string");
                    const markerLocData = JSON.parse(jsonContent);
                    for (let markerLoc of markerLocData) {
                        let position = { lat: markerLoc.lat, lng: markerLoc.lng };
                        let text = markerLoc.text.toString();
                        const fileName = Object.keys(zip.files).find((name => name.endsWith(text)));
                        const fileBlob = await zip.file(fileName).async("blob");
                        const objectURL = URL.createObjectURL(fileBlob);
                        placeNewMarker(map, position, text, objectURL, markerLoc.type, markerLoc.fszl);
                    }
                } catch (error) {
                    console.error("Error handling ZIP file:", error);
                    colog("An error occurred while processing the ZIP file.");
                }
            }
            else if (file.type == 'application/geo+json') {
                const reader = new FileReader();

                reader.onload = function (e) {
                    loadGeoJsonString(reader.result as string, "secondaryLayer", colorCodingFixed);
                };

                reader.onerror = function (e) {
                    console.error("reading failed");
                };

                reader.readAsText(file);
            } else if (file.type == 'application/json') {
                const reader = new FileReader();

                reader.onload = function (e) {
                    let markerLocData = JSON.parse(reader.result as string);
                    console.log(markerLocData);
                    for (let markerLoc of markerLocData) {
                        let position = { lat: markerLoc.lat, lng: markerLoc.lng };
                        let text = markerLoc.text.toString();
                        let imagepath = "";
                        placeNewMarker(map, position, text, imagepath, markerLoc.type, markerLoc.fszl);
                    }
                };

                reader.onerror = function (e) {
                    console.error("reading failed");
                };

                reader.readAsText(file);
            }
            else if (file.type.startsWith("image")) { //((file.type == 'image/jpeg') || (file.type == 'image/svg+xml')) {

                // read the image...
                colog("Image dropped");
                var reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function (e) {
                    placeNewMarker(map, map.getCenter(), file.name, e.target.result, "image", -1);
                    console.log(file);
                }
            }
            else
                alert("Unsupported file format. Only geojson, jpg, svg, json (array of markers), and text (mex style) supported at the moment.");
        }
    } else {
        // process non-file (e.g. text or html) content being dropped
        // grab the plain text version of the data
        // Left over from working on Mexico
        const plainText = (e.dataTransfer as DataTransfer).getData("text/plain");

        console.log(plainText);

        if (plainText) {
            //loadGeoJsonString(plainText);
            let lines = separateLines(plainText);
            console.log(lines);
            let tracking = [];
            for (let i = 0; i < lines.length; i = i + 1) {
                //console.log(lines[i]);
                if (isNaN(lines[i].substring(0, 2))) {
                    //console.log(lines[i]);
                    tracking.push(i);
                    //console.log(tracking);
                }
            }
            tracking.push(lines.length - 1);
            console.log(tracking);
            let codeStart = [];
            let currentCode = lines[tracking[1] - 1];
            codeStart.push(0);
            for (let i = 1; i < tracking.length; i = i + 1) {
                if (currentCode != lines[tracking[i + 1] - 1]) {
                    codeStart.push(i);
                    currentCode = lines[tracking[i + 1] - 1];
                }
            }
            let allGood = true;
            for (let i = 0; i < tracking.length - 1; i = i + 1) {
                let d = tracking[i + 1] - tracking[i];
                if (d > 4) allGood = false;
                let locs = (d - 2) / 2;
                for (let j = 1; j <= locs; j++) {
                    let name = lines[tracking[i]];
                    console.log(name);
                    let lat = Number(lines[tracking[i] + j]);
                    let lng = Number(lines[tracking[i] + j + locs]);
                    //let code = lines[i + 3];
                    let tt = "area-code";
                    if (locs > 1) tt = "city-code";
                    //markerObjects.push({ text: name.substring(0, 5), type: tt, lat: lat, lng: lng });
                    placeNewMarker(map, { lat: lat, lng: lng }, name.substring(0, 5), "", tt);
                }
                //if (codeStart.includes(i+1)) {
                //    if (allGood) removeAllMarkers();
                //    else break;
                //}
            }
        }
    }

    // prevent drag event from bubbling further
    return false;
}

//function startsWithLetter(str) {
//    return /^[A-Za-z]/.test(str);
//}

function separateLines(str: string) {
    // Split the string into an array of lines
    const lines = str.split(/\r?\n/);
    return lines;
}

function initialize() {
    const currentURL = window.location.href;
    if (currentURL.startsWith("http://localhost")) {
        flags.debugMode = true;
        flags.localMode = true;
    }
    // Step 1: Get the current URL's query string
    const queryString = window.location.search;

    // Step 2: Create a URLSearchParams object from the query string
    const urlParams = new URLSearchParams(queryString);

    // Step 3: Get the values of specific parameters
    urlCountry = urlParams.get('country');
    //colog("ST " + urlCountry);
    urlLayer = urlParams.get('layer');
    //colog("ST" + urlLayer);

    window.addEventListener('beforeunload', function (event) {
        if (flags.askToSave) {
            // Cancel the default behavior to prevent the browser from immediately refreshing the page
            event.preventDefault();
            // Show an alert to confirm whether the user wants to refresh the page
            event.returnValue = ''; // Some browsers require a non-empty string for the dialog message
            return ''; // For compatibility with older browsers
        }
    });
    initMap();
    initEvents();
}

//declare global {
//  interface Window {
//    initialize: () => void;
//  }
//}

//window.initialize = initialize;
initialize();
//export { };
