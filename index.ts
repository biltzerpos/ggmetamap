import { markers, countryMenu, layerMenu, auxButton, flags, infoButton, overlays, selectedFeatures, unselectAllFeatures, unselectAllMarkers } from './globals';
import { initializeGlobals, getGlobals, infoWindowContent, selectedMarkers, quizBehaviour } from './globals';
import { colog, partial, readZip, resolveToNumber, renameFile, calculateDistance } from './utilities';
import { readGeoJSONFile, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile, select, removeAllFeatures } from './geojsonFacilities';
import { loadMarkerLayer, placeNewMarker, updateSize, hideAllMarkers, showAllMarkers, removeAllMarkers } from './markerFacilities';
import { processFeatures } from './postprocess';

await google.maps.importLibrary("maps");
await google.maps.importLibrary("marker");
await google.maps.importLibrary("streetView");

class CustomOverlay extends google.maps.OverlayView {
    private position: google.maps.LatLng;
    private div: HTMLElement | null;
    private fixedPosition: boolean = false;
    private x: number | undefined;
    private y: number | undefined;

    constructor(position: google.maps.LatLng, div: HTMLElement, fixedPosition?: boolean, fixedX?: number, fixedY?: number) {
        super();
        this.position = position;
        this.div = div;
        if (fixedPosition && fixedX !== undefined && fixedY !== undefined) {
            this.fixedPosition = true;
            this.x = fixedX;
            this.y = fixedY;
        }
    }

    // Called when the overlay is added to the map
    onAdd() {
        // Add the overlay to the map's overlay pane
        const panes = this.getPanes();
        if (this.div) panes?.overlayMouseTarget.appendChild(this.div);
    }

    // Called when the map is drawn
    draw() {
        if (!this.div) return;

        if (this.fixedPosition) {
            this.div.style.left = this.x + "px";
            this.div.style.top = this.y + "px";
        }
        else {
            const projection = this.getProjection();
            const position = projection.fromLatLngToDivPixel(this.position);

            if (position) {
                this.div.style.left = position.x + "px";
                this.div.style.top = position.y + "px";
            }
        }
    }

    // Called when the overlay is removed
    onRemove() {
        if (this.div) {
            this.div.parentNode?.removeChild(this.div);
            this.div = null;
        }
    }
}

let boundaryLayer: google.maps.Data;
let secondaryLayer: google.maps.Data;
let map: google.maps.Map;
let infoWindow: google.maps.InfoWindow;
let customOverlay: CustomOverlay;
let rectangle: google.maps.Rectangle;
let startLatLng;
let rec = false;
let auxListener, infoListener;
let saveLocsDiv, saveLayerDiv, saveGeoJsonDiv, editDocDiv;
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
interface markerLoc {
    text: string;
    type: string;
    lat: number;
    lng: number;
    fszl: number;
}

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
    if (countryMenu.value == "No country") updateURL(null, null);
    else updateURL(countryMenu.value, null);
}

export function cycleLayers() {
    const currentSelection = layerMenu.selectedIndex;
    if (currentSelection < layerMenu.options.length - 1) {
        layerMenu.selectedIndex = currentSelection + 1;
    }
    else layerMenu.selectedIndex = 1;
    const event = new Event("change");
    layerMenu.dispatchEvent(event);
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
        hideInfoButton();
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

function createCountryChooser() {
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
    countryMenu.appendChild(new Option("Hungary", "Hungary"));
    countryMenu.appendChild(new Option("Indonesia", "Indonesia"));
    if (flags.localMode) countryMenu.appendChild(new Option("Indonesia Sandbox", "Indonesia Sandbox"));
    countryMenu.appendChild(new Option("Ireland", "Ireland"));
    countryMenu.appendChild(new Option("Jordan", "Jordan"));
    countryMenu.appendChild(new Option("Mexico", "Mexico"));
    countryMenu.appendChild(new Option("Norway", "Norway"));
    countryMenu.appendChild(new Option("Romania", "Romania"));
    countryMenu.appendChild(new Option("Sweden", "Sweden"));
    countryMenu.appendChild(new Option("South Africa", "South Africa"));
    //if (flags.localMode) countryMenu.appendChild(new Option("South Korea", "South Korea"));
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
    const cen = map.getCenter();
    if (cen) infoWindow.setPosition({ lat: cen.lat(), lng: cen.lng() });
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
    //Un-highlight selected features
    processFeatures(selectedFeatures, { selected: false });
    unselectAllFeatures();
}

function createButtonDiv(guibutton, text = "", tooltip = "", callback = null) {
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

function saveLocsBehaviour() {
    let markerLocData: markerLoc[] = [];
    for (let i = 0; i < markers.length; i++) {
        let text, type;
        const content = markers[i].content;
        if (content instanceof HTMLImageElement) {
            text = content.alt;
            type = "image";
        }
        else if (content) {
            text = content.textContent;
            type = markers[i].getAttribute("ggmmtype");
        }
        else colog("Marker with no content, should not happen.");
        let fszl = Number(markers[i].getAttribute("fszl"));
        const pos = markers[i].position;
        if (pos) {
            const lat = resolveToNumber(pos.lat);
            const lng = resolveToNumber(pos.lng);
            markerLocData.push({ text: text, type: type, lat: lat, lng: lng, fszl: fszl });
        }
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
            const img = markers[i].content as HTMLImageElement;
            const w = markers[i].getAttribute("ggmmWidth");
            const h = markers[i].getAttribute("ggmmHeight");
            images.push({content: img, width: w, height: h});
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

    const markerFileContent = JSON.stringify(markerLocData, null, 2);
    zip.file(layerName + ".ggmm.json", markerFileContent);

    await addImagesToZip(zip, images, layerName + " Images");

    await addGeoJSONToZip(zip, layerName);

    // Generate the ZIP file and trigger the download
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    // Replace each feature with LineStrings
    const lineStrings = handleGeometry(geometry);

    // Remove the original feature
    dataLayer.remove(feature);

    const allFeatures: google.maps.Data.Feature[] = [];

    // Add new LineStrings as separate features
    lineStrings.forEach((lineString) => {
        const thisFeature = dataLayer.add(new google.maps.Data.Feature({
            geometry: lineString,
            properties: properties,
        }));
        allFeatures.push(thisFeature);
    });
    processFeatures(allFeatures, { type: "inherent" });
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

function getGeoJson(dataLayer: any, ggmmfileName?: string) {
    const geoJson = turf.featureCollection([]);
    dataLayer.forEach((feature) => {
        if (ggmmfileName && feature.getProperty("ggmmFileName") != ggmmfileName) return;
        const geometry = feature.getGeometry();
        const properties = {};
        feature.forEachProperty((value, key) => {
            if ((key != "ggmmSessionID") && (key != "ggmmFileName")) properties[key] = value;
        });
        if (geometry) {
            let turfFeature;
            // Convert Google Maps geometry to Turf.js compatible GeoJSON
            switch (geometry.getType()) {
                case 'Point':
                    turfFeature = turf.point(geometry.get());
                    break;
                case 'Polygon':
                    const coordinates: number[][][] = [];

                    // Extract rings from the Google Maps polygon
                    (geometry as google.maps.Data.Polygon).getArray().forEach((linearRing) => {
                        const ringCoords: number[][] = linearRing.getArray().map(latLng => [
                            latLng.lng(),  // Longitude first
                            latLng.lat()   // Latitude second
                        ]);

                        // Ensure the ring is closed (first and last point must be the same)
                        if (ringCoords.length > 0 && (ringCoords[0][0] !== ringCoords[ringCoords.length - 1][0] ||
                            ringCoords[0][1] !== ringCoords[ringCoords.length - 1][1])) {
                            ringCoords.push(ringCoords[0]); // Close the ring
                        }

                        coordinates.push(ringCoords);
                    });
                    turfFeature = turf.polygon(coordinates);
                    break;
                case 'MultiPolygon':
                    const multiPolygonCoordinates: number[][][][] = [];

                    // Loop through each Polygon inside the MultiPolygon
                    (geometry as google.maps.Data.MultiPolygon).getArray().forEach(polygon => {
                        const polygonCoordinates: number[][][] = [];

                        // Extract each ring (outer + holes)
                        polygon.getArray().forEach(linearRing => {
                            const ringCoords: number[][] = linearRing.getArray().map(latLng => [
                                latLng.lng(), // Longitude first
                                latLng.lat()  // Latitude second
                            ]);

                            // Ensure the ring is closed
                            if (ringCoords.length > 0 && (ringCoords[0][0] !== ringCoords[ringCoords.length - 1][0] ||
                                ringCoords[0][1] !== ringCoords[ringCoords.length - 1][1])) {
                                ringCoords.push(ringCoords[0]); // Close the ring
                            }

                            polygonCoordinates.push(ringCoords);
                        });

                        multiPolygonCoordinates.push(polygonCoordinates);
                    });
                    turfFeature = turf.multiPolygon(multiPolygonCoordinates);
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

export function showAuxButton(name: string, listener) {
    auxButton.textContent = name;
    auxButton.removeEventListener('click', auxListener);
    auxButton.addEventListener('click', listener);
    auxListener = listener;
    const buttons = map.controls[google.maps.ControlPosition.TOP_CENTER];
    if (buttons.getLength() == 2) buttons.push(auxButton);
}

function hideAuxButton() {
    const buttons = map.controls[google.maps.ControlPosition.TOP_CENTER];
    if (buttons.getLength() == 3) buttons.pop();
}

export function showInfoButton(name: string, listener) {
    infoButton.textContent = name;
    infoButton.removeEventListener('click', infoListener);
    infoButton.addEventListener('click', listener);
    infoListener = listener;
    const buttons = map.controls[google.maps.ControlPosition.BOTTOM_CENTER];
    if (buttons.getLength() == 0) buttons.push(infoButton);
}

function hideInfoButton() {
    const buttons = map.controls[google.maps.ControlPosition.BOTTOM_CENTER];
    if (buttons.getLength() == 1) buttons.pop();
}

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
    if (event.domEvent) {
        contextMenu.style.left = `${event.domEvent.clientX}px`;
        contextMenu.style.top = `${event.domEvent.clientY}px`;
    } else {
        contextMenu.style.left = `${event.clientX}px`;
        contextMenu.style.top = `${event.clientY}px`;
    }

    // Display the context menu
    contextMenu.style.display = "block";

    // Close the menu when clicked outside
    google.maps.event.addListenerOnce(map, "click", function () {
        contextMenu.style.display = "none";
    });
}

async function initMap(): Promise<void> {


    //streetViewLayer = new google.maps.StreetViewCoverageLayer();

    await initializeGlobals();
    const globals = getGlobals();
    map = globals.map;
    boundaryLayer = globals.boundaryLayer;
    secondaryLayer = globals.secondaryLayer;
    streetViewLayer = new google.maps.StreetViewCoverageLayer();
    infoWindow = globals.infoWindow;

    boundaryLayer.setMap(map);
    boundaryLayer.setStyle({
        zIndex: 1,
        fillOpacity: 0,
        strokeOpacity: 1
    });

    secondaryLayer.setMap(map);
    secondaryLayer.setStyle({
        zIndex: 2,
        fillOpacity: 0,
        strokeOpacity: 1,
        strokeColor: 'black'
    });

    // Right Click behaviour
    map.addListener("contextmenu", (event) => {
        colog("Map Layer rightclick");
        colog(event);
        //colog(event.domEvent.target);

        if (flags.editMode) {
            let menuItems: { label: string; action: () => void }[] = [];
            if (rec) {
                menuItems = [
                    { label: "Exact delete", action: splitAndDelete },
                    { label: "Delete touching features", action: deleteTouchingGeojsonFeatures },
                    { label: "Hide Rectangle", action: hideRectangleAndContextMenu },
                ];
            }
            else if (selectedFeatures.length > 0) {
                menuItems = [
                    {
                        label: "Change colour of selection", action: function () {
                            contextMenu.style.display = "none";
                            const overlayPosition = event.latLng;
                            let startColour = "#000000";
                            const realColour = selectedFeatures[0].getProperty('ggmmColour');
                            if (realColour) startColour = realColour.toString();
                            customOverlay = new CustomOverlay(overlayPosition, createColorPicker(startColour));
                            customOverlay.setMap(map);
                        }
                    },
                    {
                        label: "Adjust line width of selection", action: function () {
                            contextMenu.style.display = "none";
                            const overlayPosition = event.latLng;
                            let currentWidth = 5;
                            const realWidth = selectedFeatures[0].getProperty('ggmmWeight');
                            if (realWidth) currentWidth = Number(realWidth);
                            customOverlay = new CustomOverlay(overlayPosition, createWeightAdjuster(currentWidth));
                            customOverlay.setMap(map);
                        }
                    },
                    {
                        label: "Set info to display", action: function () {
                            contextMenu.style.display = "none";
                            const overlayPosition = event.latLng;
                            // let currentWidth = 5;
                            const fileName = selectedFeatures[0].getProperty('ggmmFileName');
                            // if (realWidth) currentWidth = Number(realWidth);
                            if (fileName) {
                                customOverlay = new CustomOverlay(overlayPosition, createImageAndTextInput(fileName.toString()));
                                customOverlay.setMap(map);
                            }
                        }
                    },
                ];
            }
            else if (selectedMarkers.length > 0) {
                let labels: string[] = [];
                if (selectedMarkers.length = 1) labels = [
                    "Change marker text",
                    "Change marker background colour",
                    "Delete marker"];
                else labels = [
                    "Change text of selected markers",
                    "Change background colour of selected markers",
                    "Delete selected markers"];
                menuItems = [
                    {
                        label: labels[0], action: function () {
                            contextMenu.style.display = "none";
                            const overlayPosition = event.latLng;
                            let startColour = "#000000";
                            const realColour = selectedFeatures[0].getProperty('ggmmColour');
                            if (realColour) startColour = realColour.toString();
                            customOverlay = new CustomOverlay(overlayPosition, createColorPicker(startColour));
                            customOverlay.setMap(map);
                        }
                    },
                    {
                        label: labels[1], action: function () {
                            contextMenu.style.display = "none";
                            const overlayPosition = event.latLng;
                            let startColour = "#000000";
                            let realColour: string | null = null;
                            const firstContent = selectedMarkers[0].content as HTMLElement;;
                            if (firstContent) realColour = firstContent.style.getPropertyValue('--marker-color');
                            if (realColour) startColour = realColour.toString();
                            customOverlay = new CustomOverlay(overlayPosition, createColorPicker(startColour));
                            customOverlay.setMap(map);
                        }
                    },
                    {
                        label: labels[2], action: function () {
                            contextMenu.style.display = "none";
                            selectedMarkers.forEach((marker) => {
                                marker.map = null;
                                const index = markers.indexOf(marker);
                                if (index > -1) { // only splice array when item is found
                                    markers.splice(index, 1); // 2nd parameter means remove one item only
                                }
                            });
                        }
                    },
                ];
            }
            else {
                menuItems = [
                    { label: "Edit using rectangle", action: () => showRectangle(event) },
                ];
            }
            showContextMenu(event, menuItems);
        }
    });

    // List of events you want to propagate from the data layers to the map
    const eventsToPropagate = ["click", "mouseup", "dblclick", "rightclick"];

    // Function to propagate events from the data layer to the map
    eventsToPropagate.forEach((eventType) => {
        boundaryLayer.addListener(eventType, (event) => {
            colog("Boundary Layer " + eventType);
            colog(event);
            google.maps.event.trigger(map, eventType, event);
        });
        // secondaryLayer.addListener(eventType, (event) => {
        //     google.maps.event.trigger(map, eventType, event);
        // });
    });

    map.addListener('dblclick', function (event) {
        if (flags.editMode) {
            placeNewMarker(map, event.latLng);
        }
    });

    map.addListener('click', function (event) {
        colog(event);
        if (flags.editMode && event.feature) {
            //colog(event.feature);
        }
        else if (flags.quizOn) {
            colog("here");
            if (quizBehaviour.callback) quizBehaviour.callback(event);
            else colog("Quiz callback was null!");
        }
        else {
            infoWindow.close();
            if (customOverlay) customOverlay.setMap(null);
            //Un-highlight selected features
            processFeatures(selectedFeatures, { selected: false });
            unselectAllFeatures();
            //event.stop();
        }
    });

    // Old popup code
    // boundaryLayer.addListener('click', function (e) {
    //     // colog(e.feature);
    //     if (flags.displayPopups && !flags.editMode) {
    //         let name = e.feature.getProperty(settings.popupPropertyName);
    //         if (name) {
    //             name = removeAccentsAndUpperCase(splitCamelCase(name));
    //             infoWindow.setContent('<h2 style="color: black;">' + name + '</h2>');
    //             //infoWindow.setStyle = "popup-infowindow";
    //             infoWindow.setPosition(e.latLng);
    //             infoWindow.open(map);
    //         };
    //     }
    // });

    secondaryLayer.addListener('click', function (e) {
        infoWindow.close();
        if (customOverlay) customOverlay.setMap(null);
        colog("sec");
        colog(e);
        colog(e.feature);
        //To remove the feature being clicked on
        if (flags.editMode && e.domEvent.shiftKey) { // Shift - Click to select more   
            select(secondaryLayer, e.feature, false);
        } else if (flags.editMode && e.domEvent.altKey) { // Opt - Click to delete
            secondaryLayer.remove(e.feature);
        } else if (flags.editMode) { // Click to select
            select(secondaryLayer, e.feature, true);
        }
        else {
            //colog(e);
            let infoContent;
            const fileName = e.feature.getProperty('ggmmFileName');
            if (fileName) infoContent = infoWindowContent[fileName];
            if (!infoContent) { //let's also try ref
                const refName = e.feature.getProperty('ref');
                if (refName) {
                    const infotext = '<h2 style="color: black;">' + refName + '</h2>';
                    infoWindow.setContent(infotext);
                    infoWindow.setPosition(e.latLng);
                    infoWindow.open(map);
                }
            }
            if (infoContent) {
                //infoWindow.content.class = "popup-infowindow";
                //Show the info!
                customOverlay = new CustomOverlay(e.latLng, createInfoOverlayDiv(infoContent.text, infoContent.img));
                customOverlay.setMap(map);
            };
        }
    });

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
        for (let i = 0; i < markers.length; i++) {
            const content = markers[i].content;
            if (content && content instanceof HTMLElement) {
                updateSize(markers[i]);
            } else {
                console.error("Marker content is not an HTMLElement, weird!");
            }
        }
    });

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
    createCountryChooser();
    countrySelectDiv.appendChild(countryMenu);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(countryMenu);

    // Create the layer drop down menu
    const layerSelectDiv = document.createElement('div');
    //layerMenu = 
    createLayerChooser(map);
    layerSelectDiv.appendChild(layerMenu);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(layerMenu);

    auxButton.className = "buttons";
    auxButton.textContent = "Default text";
    auxButton.type = 'button';

    if (urlCountry) {
        countryMenu.value = urlCountry;
        countryMenu.dispatchEvent(new Event('change'));
    }
    if (urlLayer) {
        layerMenu.value = urlLayer;
        layerMenu.dispatchEvent(new Event('change'));
    }
}

function createColorPicker(startColour: string): HTMLDivElement {

    let selectedColour = startColour;
    // Create the main div container
    const div = document.createElement("div");
    div.className = "custom-overlay";
    div.style.zIndex = "9999";
    div.style.width = "300px";
    div.style.display = "flex";
    div.style.flexDirection = "column";

    // Create the label
    const label = document.createElement("label");
    label.textContent = "Click below to pick colour";
    label.style.marginBottom = "10px";

    // Create the div to hold the color picker and cancel button
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.alignItems = "center";
    buttonContainer.style.gap = "10px";

    // Create the color picker input
    const colorPicker = document.createElement("input");
    colorPicker.type = "color";
    colorPicker.style.flex = "3"; // Takes 60% of the space
    colorPicker.value = startColour;

    // Create the select button
    const selectButton = document.createElement("button");
    selectButton.textContent = "Select";
    selectButton.style.flex = "1"; // Takes 20% of the space
    selectButton.style.cursor = "pointer";
    selectButton.style.fontSize = "13px";
    selectButton.disabled = true;
    selectButton.style.opacity = "0.5";

    // Create the cancel button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.style.flex = "1"; // Takes 20% of the space
    cancelButton.style.cursor = "pointer";
    cancelButton.style.fontSize = "13px";

    // Add event to the cancel button (to hide the div for example)
    cancelButton.addEventListener("click", () => {
        div.style.display = "none";
        customOverlay.setMap(null);
    });

    selectButton.addEventListener("click", () => {
        processFeatures(selectedFeatures, { type: "specified", colour: selectedColour });
        unselectAllFeatures();
        selectedMarkers.forEach((marker) => {
            const markerContent = marker.content as HTMLElement;
            if (markerContent) markerContent.style.setProperty('--marker-color', selectedColour);
        });
        unselectAllMarkers();
        div.style.display = "none";
        customOverlay.setMap(null);
    });

    // Append the elements to the container div
    buttonContainer.appendChild(colorPicker);
    buttonContainer.appendChild(selectButton);
    buttonContainer.appendChild(cancelButton);
    div.appendChild(label);
    div.appendChild(buttonContainer);

    stopDivEvents(div);

    colorPicker.addEventListener("input", (event) => {
        event.stopPropagation();
        selectButton.disabled = false;
        selectButton.style.opacity = "1";
        selectedColour = (event.target as HTMLInputElement).value;
        console.log("Selected color:", selectedColour);
    });
    // colorPicker.addEventListener("change", (event) => {
    //     if (event.target) {
    //         event.stopPropagation();
    //         selectedColour = (event.target as HTMLInputElement).value;
    //         console.log("Color selected:", selectedColour);
    //         processFeatures(selectedFeatures, { type: "specified", colour: selectedColour });
    //         unselectAllFeatures();
    //         customOverlay.setMap(null);
    //     }
    // });
    return div;
}

function createWeightAdjuster(defaultValue: number): HTMLDivElement {
    // Validate default value
    if (defaultValue < 1) {
        throw new Error("Default value must be at least 1.");
    }

    // Create the main container div
    const div = document.createElement("div");
    div.className = "custom-overlay";
    div.style.zIndex = "9999";
    div.style.border = "1px solid black";
    div.style.padding = "10px";
    //div.style.width = "300px";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.gap = "10px";
    div.style.alignItems = "center";

    // Create the label
    const label = document.createElement("label");
    label.textContent = "Adjust line width";
    label.style.fontWeight = "bold";

    // Create the value container (textarea and buttons)
    const valueContainer = document.createElement("div");
    valueContainer.style.display = "flex";
    valueContainer.style.alignItems = "center";
    valueContainer.style.gap = "5px";

    // Create the text area
    const textArea = document.createElement("textarea");
    textArea.value = defaultValue.toString();
    textArea.style.width = "50px";
    textArea.style.height = "25px";
    textArea.style.resize = "none";
    textArea.style.textAlign = "center";

    // Function to update the value in the textarea
    const updateValue = (increment: number) => {
        const currentValue = parseInt(textArea.value, 10) || 0;
        const newValue = Math.max(1, currentValue + increment); // Ensure value is >= 1
        textArea.value = newValue.toString();
    };

    // Create the "+" button
    const plusButton = document.createElement("button");
    plusButton.textContent = "+";
    plusButton.style.cursor = "pointer";
    plusButton.style.padding = "5px";
    plusButton.addEventListener("click", () => updateValue(1));

    // Create the "−" button
    const minusButton = document.createElement("button");
    minusButton.textContent = "−";
    minusButton.style.cursor = "pointer";
    minusButton.style.padding = "5px";
    minusButton.addEventListener("click", () => updateValue(-1));

    // Append buttons and textarea to the value container
    valueContainer.appendChild(label);
    valueContainer.appendChild(minusButton);
    valueContainer.appendChild(textArea);
    valueContainer.appendChild(plusButton);

    // Create the button container for Select and Cancel buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.justifyContent = "flex-end";

    // Create the "Select" button
    const selectButton = document.createElement("button");
    selectButton.textContent = "Select";
    selectButton.style.cursor = "pointer";
    selectButton.addEventListener("click", () => {
        console.log("Selected value:", textArea.value); // Log the adjusted value
        processFeatures(selectedFeatures, { type: "specified", weight: Number(textArea.value) });
        unselectAllFeatures();
        div.remove(); // Remove the entire div
    });

    // Create the "Cancel" button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.style.cursor = "pointer";
    cancelButton.addEventListener("click", () => {
        div.remove(); // Remove the entire div
    });

    // Append buttons to the button container
    buttonContainer.appendChild(selectButton);
    buttonContainer.appendChild(cancelButton);

    // Append all elements to the main div
    div.appendChild(label);
    div.appendChild(valueContainer);
    div.appendChild(buttonContainer);

    stopDivEvents(div);

    return div;
}

function createImageAndTextInput(fileName: string): HTMLDivElement {
    // Create the main container div
    const container = document.createElement("div");
    container.className = "custom-overlay";
    container.style.zIndex = "9999";
    container.style.border = "2px solid black";
    container.style.borderRadius = "8px";
    container.style.padding = "20px";
    container.style.width = "300px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.gap = "10px";
    container.style.backgroundColor = "#f9f9f9";

    // --- Image Drop Zone ---
    const dropZone = document.createElement("div");
    dropZone.style.border = "2px dashed #ccc";
    dropZone.style.borderRadius = "4px";
    dropZone.style.padding = "6px";
    dropZone.style.width = "100%";
    dropZone.style.height = "150px";
    dropZone.style.display = "flex";
    dropZone.style.justifyContent = "center";
    dropZone.style.alignItems = "center";
    dropZone.style.textAlign = "center";
    dropZone.style.backgroundColor = "#f9f9f9";
    dropZone.style.cursor = "pointer";
    dropZone.textContent = "Drag and drop an image here or click to select";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";

    const imagePreview = document.createElement("img");
    imagePreview.style.maxWidth = "100%";
    imagePreview.style.maxHeight = "100%";
    imagePreview.style.borderRadius = "4px";
    imagePreview.style.padding = "8px";
    imagePreview.style.display = "none";

    let storedImageFile: File | null = null;

    const handleImageUpload = (file: File) => {
        if (!file.type.startsWith("image/")) {
            alert("Only image files are supported!");
            return;
        }
        storedImageFile = file;
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.src = event.target?.result as string;
            imagePreview.style.display = "block";
            dropZone.textContent = "";
            dropZone.appendChild(imagePreview);
        };
        reader.readAsDataURL(file);
    };

    dropZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropZone.style.borderColor = "#007bff";
        dropZone.style.backgroundColor = "#e9f7fe";
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.style.borderColor = "#ccc";
        dropZone.style.backgroundColor = "#f9f9f9";
    });

    dropZone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropZone.style.borderColor = "#ccc";
        dropZone.style.backgroundColor = "#f9f9f9";
        if (event.dataTransfer?.files.length) {
            const file = event.dataTransfer.files[0];
            handleImageUpload(file);
        }
        removeClassFromDropTarget(event);
    });

    dropZone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
        if (fileInput.files?.length) {
            const file = fileInput.files[0];
            handleImageUpload(file);
        }
    });

    dropZone.appendChild(fileInput);

    // --- Text Area ---
    const textArea = document.createElement("textarea");
    textArea.style.width = "100%";
    textArea.style.height = "100px";
    textArea.style.border = "1px solid #ccc";
    textArea.style.borderRadius = "4px";
    textArea.style.padding = "8px";
    textArea.style.resize = "none";
    textArea.placeholder = "Enter your text here...";

    // --- Button Container ---
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.width = "100%";
    buttonContainer.style.justifyContent = "space-around";
    buttonContainer.style.marginTop = "10px";

    // Save Button
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.style.padding = "8px 16px";
    saveButton.style.cursor = "pointer";
    saveButton.style.border = "none";
    saveButton.style.borderRadius = "4px";
    saveButton.style.backgroundColor = "#007bff";
    saveButton.style.color = "#fff";
    saveButton.style.fontWeight = "bold";
    saveButton.addEventListener("click", () => {
        console.log("Saved Data:");
        console.log("Text:", textArea.value);
        console.log("Image:", storedImageFile);
        let renamedFile: File | null = null;
        if (storedImageFile) {
            const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
            const extension = storedImageFile.name.substring(storedImageFile.name.lastIndexOf('.')) || '';
            const newName = baseName + extension;
            renamedFile = renameFile(storedImageFile, newName);
        }
        const newContent: infoWindowContent = {
            text: textArea.value,
            img: imagePreview,
            imgFile: renamedFile
        }
        infoWindowContent[fileName] = newContent;
        container.remove();
    });

    // Cancel Button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.style.padding = "8px 16px";
    cancelButton.style.cursor = "pointer";
    cancelButton.style.border = "none";
    cancelButton.style.borderRadius = "4px";
    cancelButton.style.backgroundColor = "#f44336";
    cancelButton.style.color = "#fff";
    cancelButton.style.fontWeight = "bold";
    cancelButton.addEventListener("click", () => {
        container.remove();
    });

    // Append buttons to button container
    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(cancelButton);

    // Append all elements to the main container
    container.appendChild(dropZone);
    container.appendChild(textArea);
    container.appendChild(buttonContainer);

    stopDivEvents(container);
    // Return the container
    return container;
}

function createInfoOverlayDiv(text: string, image: HTMLImageElement): HTMLDivElement {
    // Create the main container div
    const container = document.createElement("div");
    container.className = "custom-overlay";
    container.style.zIndex = "9999";
    container.style.border = "2px solid black";
    container.style.borderRadius = "8px";
    container.style.padding = "20px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.gap = "10px";
    container.style.backgroundColor = "#f9f9f9";
    //container.style.width = "min(50%, 300px)";
    container.style.width = "80%";
    container.style.boxSizing = "border-box";

    // Add the image element
    image.style.maxWidth = "100%";
    image.style.borderRadius = "4px";
    container.appendChild(image);

    // Add the non-editable textarea
    const textArea = document.createElement("textarea");
    textArea.style.width = "100%";
    textArea.style.height = "100px";
    textArea.style.border = "1px solid #ccc";
    textArea.style.borderRadius = "4px";
    textArea.style.padding = "8px";
    textArea.style.resize = "none";
    textArea.style.backgroundColor = "#f0f0f0";
    textArea.style.color = "#333";
    textArea.style.fontSize = "14px";
    textArea.style.textAlign = "center";
    textArea.readOnly = true;
    textArea.value = text;

    container.appendChild(textArea);
    stopDivEvents(container);
    // Return the container div
    return container;
}

function stopDivEvents(div: HTMLDivElement) {
    const eventsToStop = ["click", "mouseup", "mousedown", "dblclick", "rightclick", "drop"];
    eventsToStop.forEach((eventType) => {
        div.addEventListener(eventType, (event) => {
            event.stopPropagation();
        });
    });
    // div.addEventListener("mousedown", (event) => {
    //     event.stopPropagation();
    // });
    // div.addEventListener("mouseup", (event) => {
    //     event.stopPropagation();
    // });
    // div.addEventListener("click", (event) => {
    //     event.stopPropagation();
    // });
    // div.addEventListener("dblclick", (event) => {
    //     event.stopPropagation();
    // });
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
    let side = Math.pow(2, 13);
    const zoom = map.getZoom();
    if (zoom) side = Math.pow(2, (13 - zoom));
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

    const allFeatures: google.maps.Data.Feature[] = [];
    newLineStrings.forEach((newLineString) => {
        let l = newLineString.getArray().length;
        if (l < 2) {
            colog("Linestring with " + l + " coordinates found.");
            colog(newLineString);
            colog(properties);
            if (l == 1) colog(newLineString.getArray()[0]);
            if (l == 1) placeNewMarker(map, newLineString.getArray()[0], "Here");
        }
        const thisFeature = dataLayer.add(new google.maps.Data.Feature({
            geometry: newLineString,
            properties: properties
        }));
        allFeatures.push(thisFeature);
    }
    );

    processFeatures(allFeatures, { type: "inherent" });
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
        const geom = feature.getGeometry();
        if (geom) {
            const geometryType = geom.getType();
            //colog(geometryType);
            if (geometryType == "LineString") splitAndDeleteLineString(secondaryLayer, feature, bounds);
        }
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
        if (geometry) {
            // For Point geometries
            if (geometry.getType() === "Point") {
                const point = geometry as google.maps.Data.Point;
                const position = point.get();
                if (bounds?.contains(position)) {
                    console.log("Feature within bounds:", feature);
                    secondaryLayer.remove(feature);
                }
            }
            // For other geometry types like LineString or Polygon
            else {
                let isInBounds = false;
                geometry.forEachLatLng((latLng) => {
                    if (bounds?.contains(latLng)) {
                        isInBounds = true;
                    }
                });
                if (isInBounds) {
                    console.log("Feature within bounds:", feature);
                    secondaryLayer.remove(feature);
                }
            }
        }
    });
    hideRectangleAndContextMenu();
}


async function addImagesToZip(zip, images, folderName) {
    // Create a folder in the ZIP
    const folder = zip.folder(folderName);

    for (let i = 0; i < images.length; i++) {
        const img = images[i].content;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set the canvas dimensions to match the image
        canvas.width = images[i].width;
        canvas.height = images[i].height;

        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0, images[i].width, images[i].height);

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

async function addGeoJSONToZip(zip, folderName) {
    // Create three folder in the ZIP
    const geojsonFolder = zip.folder(folderName + " geojson");
    const geoimagesFolder = zip.folder(folderName + " geoimages");
    const geotextFolder = zip.folder(folderName + " geotext");

    let allggmmFileNames: Set<string> = new Set();
    secondaryLayer.forEach((feature) => {
        const name = feature.getProperty("ggmmFileName");
        if (name) allggmmFileNames.add(name.toString());
    });
    allggmmFileNames.forEach((name) => {
        // Save the geojson file
        const geoJSON = getGeoJson(secondaryLayer, name);
        const geoJSONcontent = JSON.stringify(geoJSON, null, 2);
        geojsonFolder.file(name, geoJSONcontent);
        // Save the info text
        if (infoWindowContent[name]) {
            const infoText = infoWindowContent[name].text;
            if (infoText) {
                const baseName = name.substring(0, name.lastIndexOf('.')) || name;
                geotextFolder.file(baseName + ".txt", infoText);
            }
        }
        // Save the image file
        if (infoWindowContent[name]) {
            const imageFile = infoWindowContent[name].imgFile;
            if (imageFile) geoimagesFolder.file(imageFile.name, imageFile);
        }
    });

    return zip;
}

function initEvents() {
    // Drag & drop events
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


async function handleDrop(dragEvent: DragEvent) {

    dragEvent.preventDefault();
    dragEvent.stopPropagation();
    removeClassFromDropTarget(dragEvent);
    if (!flags.editMode) return;
    const files = (dragEvent.dataTransfer as DataTransfer).files;

    if (files.length) {
        for (let i = 0, file; (file = files[i]); i++) {

            if (file.type === "application/zip" || file.type === "application/x-zip-compressed" || file.name.endsWith(".zip")) {
                const zipFile = files[0];
                const jszip = new JSZip();
                try {
                    const zip = await jszip.loadAsync(zipFile); // Load the ZIP file
                    readZip(zip);
                } catch (error) {
                    console.error("Error handling ZIP file:", error);
                    colog("An error occurred while processing the ZIP file.");
                }
            }
            else if (file.type == 'application/geo+json') {
                readGeoJSONFile(file);
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
            else if (file.type.startsWith("image")) {
                colog("Image dropped");
                var reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function (e) {
                    placeNewMarker(map, map.getCenter(), file.name, e.target.result, "image", -1);
                    //colog(file);
                }
            }
            else
                alert("Unsupported file format. Only geojson, jpg, svg, json (array of markers), and text (mex style) supported at the moment.");
        }
    } else {
        // process non-file (e.g. text or html) content being dropped
        // grab the plain text version of the data
        // Left over from working on Mexico
        const plainText = (dragEvent.dataTransfer as DataTransfer).getData("text/plain");

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

initialize();
