import { getGlobals, flags, settings, colors } from './globals';
import { markers, selectedMarkers, unselectAllMarkers } from './globals';
import { colog } from './utilities.js';

export function loadMarkerLayer(country, layer) {
    const path = '/Layers/' + country + '/' + layer + '.json';
    const imagepath = '/Layers/' + country + '/' + layer + ' Images/';
    loadMarkers(path, imagepath);
}

export function removeAllMarkers() {
    hideAllMarkers();
    markers.length = 0;
}

export function hideAllMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].map = null;
    }
}

export function showAllMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].map = getGlobals().map;
    }
}

async function loadMarkers(path: string, imagepathdir: string): Promise<void> {

    let response = await fetch(path);
    if (!response.ok) {
        console.log(path + " does not exist");
    }
    else {
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
            let markerLocData = await response.json();
            for (let markerLoc of markerLocData) {
                let position = { lat: markerLoc.lat, lng: markerLoc.lng };
                let text = markerLoc.text.toString();
                let imagepath = imagepathdir + text;
                //console.log(imagepath);
                placeNewMarker(getGlobals().map, position, text, imagepath, markerLoc.type, markerLoc.fszl, false);
            }
        }
    }
}

export function placeNewMarker(map, position, content = "00", imagepath = "", type = "name", fszl = -1, draggable = true) {
    colog("New marker " + markers.length);
    let zIndex = 10;
    if (content == "") zIndex = -1;

    var marker = new google.maps.marker.AdvancedMarkerElement({
        map: map,
        position: position,
        gmpDraggable: draggable,
        zIndex: zIndex,
    });
    marker.setAttribute("ggmmtype", type.toString());
    marker.setAttribute("fszl", fszl.toString());
    setMarkerContent(marker, content, imagepath, type, fszl);
    marker.addListener('click', (event) => {
        if (flags.editMode && event.domEvent.shiftKey && event.domEvent.metaKey) { // Shift-Command-Click = Increase size
            let fszl = Number(marker.getAttribute("fszl"));
            if (fszl == -1) console.log("Should not happen fszl=-1");
            else {
                fszl--;
                marker.setAttribute("fszl", fszl.toString());
                if (marker.content && marker.content instanceof HTMLElement) {
                    //marker.content.style.transform = 
                    updateSize(marker);
                } else {
                    console.error("Marker content is not an HTMLElement, weird!");
                }
            }
        } else if (flags.editMode && event.domEvent.shiftKey && event.domEvent.altKey) { // Shift-Option-Click = Decrease size
            let fszl = Number(marker.getAttribute("fszl"));
            if (fszl == -1) console.log("Should not happen fszl=-1");
            else {
                fszl++;
                marker.setAttribute("fszl", fszl.toString());
                if (marker.content && marker.content instanceof HTMLElement) {
                    //marker.content.style.transform = 
                    updateSize(marker);
                } else {
                    console.error("Marker content is not an HTMLElement, weird!");
                }
            }
        } else if (flags.editMode && event.domEvent.shiftKey) { // Shift-Click = DELETE
            colog(markers.length);
            marker.map = null;
            const index = markers.indexOf(marker);
            if (index > -1) { // only splice array when item is found
                markers.splice(index, 1); // 2nd parameter means remove one item only
            }
            colog(markers.length);
        } else if (flags.editMode && event.domEvent.altKey && marker.content && marker.content instanceof HTMLElement) { // Option-Click = Change to red backgroung
            const mtype = marker.getAttribute("ggmmtype");
            colog(mtype);
            if (mtype == "name") {
                marker.content.style.setProperty('--marker-color', colors[3]);
                marker.setAttribute("ggmmtype", "text3");
            }
            else if (mtype && mtype.startsWith("text")) {
                let col = Number(mtype[4]);
                col++;
                if (col == 10) col = 0;
                colog(col);
                marker.content.style.setProperty('--marker-color', colors[col]);
                marker.setAttribute("ggmmtype", "text" + col);
            }
        } else { // Default Operation
            colog(position);
            if (type == "image") {
                getGlobals().infoWindow.close();
                const img = document.createElement('img');
                img.src = imagepath;
                img.onload = function () {
                    // Once the image is loaded, get its dimensions
                    const width = marker.getAttribute("ggmmWidth"); //this.naturalWidth;
                    const height = marker.getAttribute("ggmmHeight"); //this.naturalHeight;
                    if (!width || !height) return;
                    const h = Number(height);
                    const w = Number(width);
                    //console.log(window.screen.height);
                    //console.log(window.screen.width);
                    const maxh = Math.floor(window.screen.height * 0.9);
                    // Set max height
                    if (h > maxh) {
                        img.style.setProperty('--iwmh', maxh.toString());
                    }
                    else {
                        img.style.setProperty('--iwmh', h.toString());
                    }
                    const maxw = Math.floor(window.screen.width * 0.9);
                    if (w > maxw) {
                        // Set max width
                        getGlobals().infoWindow.setOptions({
                            maxWidth: maxw
                        });
                    }
                    else {
                        getGlobals().infoWindow.setOptions({
                            maxWidth: Math.floor(w * 1.2)
                        });
                    }
                    getGlobals().infoWindow.setContent(img);
                    //getGlobals().infoWindow.class = "custom-infowindow";

                    const bounds = map.getBounds();
                    const northLat = bounds.getNorthEast().lat();
                    const southLat = bounds.getSouthWest().lat();
                    const latDifference = northLat - southLat;
                    const mapHeight = map.getDiv().offsetHeight;
                    const cen = map.getCenter();
                    const goDown = (h / 2) * latDifference / mapHeight;
                    const newLat = cen.lat() - goDown;
                    getGlobals().infoWindow.setPosition({ lat: newLat, lng: cen.lng() });
                    getGlobals().infoWindow.open(map);
                };
            }
            else if (flags.editMode) { // text marker
                var result = prompt("Enter new value for marker:", marker.content?.textContent?.toString());
                //if (result) setMarkerContent(marker, result, marker.content.src, marker.getAttribute("ggmmtype"), fszl);
                if (result) setMarkerContent(marker, result, "", marker.getAttribute("ggmmtype"), fszl);
            }
        }
    });
    markers.push(marker);
}

function setMarkerContent(marker, text, imagepath, type, fszl) {

    if (type == "image") {
        const img = document.createElement('img');
        img.src = imagepath;
        img.onload = function () {
            img.alt = text;
            var height = this.height;
            var width = this.width;
            marker.setAttribute("ggmmHeight", height.toString());
            marker.setAttribute("ggmmWidth", width.toString());
            let zoomReduction = 0;
            while (height > 200) {
                zoomReduction++;
                height = height / 2.0;
                width = width / 2.0;
            }
            if (fszl == -1) fszl = getGlobals().map.getZoom() + zoomReduction;
            marker.setAttribute("fszl", fszl.toString());

            // img.style.height = height;
            // img.style.width = width;

            //img.style.transform = getTransform(marker);

            marker.content = img;
            // marker.content.style.width = width;
            // marker.content.style.height = height;
            updateSize(marker);
            colog(marker.content.style.width);
            colog(marker.content.style.height);
        };
    }
    else { // We are dealing with a text marker
        const markerDiv = document.createElement('div');
        markerDiv.className = "text-marker";
        if (type.startsWith("text") && (type.length == 5)) {
            const col = Number(type[4]);
            markerDiv.style.setProperty('--marker-color', colors[col]);
        }
        else if (type == "digit2") {
            let ch = text[settings.colourDigit];
            if (!isNaN(ch)) {
                //console.log(ch);
                markerDiv.style.setProperty('--marker-color', colors[ch]);
            }
        }
        markerDiv.textContent = text.toString();
        markerDiv.addEventListener("contextmenu", (event) => {
            event.preventDefault(); // Prevent the default browser context menu
            event.stopPropagation();
            colog("Right-click detected on the marker!");
            colog("Marker position:" + marker.position);
            colog(event);
            unselectAllMarkers();
            selectedMarkers.push(marker);
            google.maps.event.trigger(getGlobals().map, "contextmenu", event);
        });
        marker.content = markerDiv;
        //marker.content.style.transform = 
        updateSize(marker);
    }
}

export function updateSize(marker) {
    let sc = 1;
    let fszl = Number(marker.getAttribute("fszl"));
    let mtype = marker.getAttribute("ggmmtype");
    let isImage = mtype == "image";
    if (fszl >= 0) {
        let zoom = getGlobals().map.getZoom() - fszl;
        if ((!isImage) && (zoom > 0)) sc = 1;
        else {
            sc = Math.pow(2, zoom); // Math.cos(lat * Math.PI / 180);
            if (sc < settings.layerMin) sc = 0.1;
        }
        //let isName = marker.getAttribute("ggmmtype") == "name";
        //if ((mtype == "name") && (sc > 1)) sc = 1;
    }
    if (isImage) {
        let newWidth = marker.getAttribute("ggmmWidth");
        newWidth = newWidth * sc;
        marker.content.style.width = newWidth + "px";
        let newHeight = marker.getAttribute("ggmmHeight");
        newHeight = newHeight * sc;
        marker.content.style.heigth = newHeight + "px";
    }
    else { // text marker
        marker.content.style.transform = "scale(" + sc + "," + sc + ")";
    }
}