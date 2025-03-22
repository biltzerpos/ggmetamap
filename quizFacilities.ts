import { getGlobals, selectedFeatures, unselectAllFeatures, flags, quizBehaviour } from './globals';
import { colog, getRandomArray, removeAccentsAndUpperCase } from './utilities.js';
import { zoom, removeAllFeatures, loadGeoJSONFile } from './geojsonFacilities';
import { showAuxButton } from './index';
import { loadMarkerLayer, hideAllMarkers, showAllMarkers } from './markerFacilities';
import { processFeatures } from './postprocess';

export function runQuiz(markers: google.maps.marker.AdvancedMarkerElement[], nameProperty: string, clickon: string, tearDown: () => void): void {
    //colog("in");
    //colog(typeof tearDown);
    colog(markers.length);
    markers.forEach((m) => {colog(m.getAttribute("ggmmType"));});
    const buttons = getGlobals().map.controls[google.maps.ControlPosition.TOP_CENTER];
    if (buttons.getLength() == 3) buttons.pop();
    const rArray = getRandomArray(markers.length);
    let currentIndex = 0;
    let lastClicked: google.maps.Data.Feature | null = null;

    const div = document.createElement("div");
    div.className = "custom-overlay";
    div.style.zIndex = "9999";
    div.style.width = "300px";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    //div.style.alignItems = "center";

    // Create the label
    const label = document.createElement("label");
    label.textContent = getLabelText(markers[rArray[currentIndex]], clickon);
    label.style.marginBottom = "10px";

    let quizImg: HTMLImageElement | null = null;
    updateQuizImg(markers[rArray[currentIndex]]);

    // Create the div to hold the buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.alignItems = "center";
    buttonContainer.style.gap = "10px";

    // Create the skip button
    const skipButton = document.createElement("button");
    skipButton.textContent = "Skip";
    skipButton.style.flex = "1";
    skipButton.style.cursor = "pointer";
    skipButton.style.fontSize = "13px";
    skipButton.addEventListener("click", nextRound);

    // Create the show me button
    const showmeButton = document.createElement("button");
    showmeButton.textContent = "Show me";
    showmeButton.style.flex = "1";
    showmeButton.style.cursor = "pointer";
    showmeButton.style.fontSize = "13px";
    showmeButton.addEventListener("click", () => {
        // Hide wrong guess if there was one
        if (lastClicked) {
            let styleOptions = {
                strokeColor: 'black',
                strokeWeight: 10,
                fillOpacity: 0,
                strokeOpacity: 0,
                zIndex: 3
            }
            getGlobals().boundaryLayer.overrideStyle(lastClicked, styleOptions);
        }
        // Find correct answer
        let foundFeature: google.maps.Data.Feature | null = null;
        const correctName = removeAccentsAndUpperCase(getCorrectName(markers[rArray[currentIndex]], nameProperty));
        if (correctName) {
            getGlobals().boundaryLayer.forEach((feature) => {
                let name = feature.getProperty(nameProperty) as string;
                //colog(name);
                name = removeAccentsAndUpperCase(name);
                //colog(name);
                if (name.endsWith(correctName)) {
                    foundFeature = feature;
                }
            });
        }
        if (foundFeature) {
            let styleOptions = {
                strokeColor: 'blue',
                strokeWeight: 10,
                fillOpacity: 0,
                strokeOpacity: 1,
                zIndex: 3
            }
            getGlobals().boundaryLayer.overrideStyle(foundFeature, styleOptions);
            lastClicked = foundFeature;
        }
    });

    // Create the stop button
    const stopQuizButton = document.createElement("button");
    stopQuizButton.textContent = "Stop quiz";
    stopQuizButton.style.flex = "1";
    stopQuizButton.style.cursor = "pointer";
    stopQuizButton.style.fontSize = "13px";
    stopQuizButton.addEventListener("click", () => {
        if (buttons.getLength() == 3) buttons.pop();
        flags.quizOn = false;
        // Show boundary layer
        removeAllFeatures();
        getGlobals().boundaryLayer.setStyle({
            zIndex: 1,
            fillOpacity: 0,
            strokeOpacity: 1
        });
        quizBehaviour.callback = null;
        tearDown();
    });

    // Append the elements to the container div
    buttonContainer.appendChild(skipButton);
    buttonContainer.appendChild(showmeButton);
    buttonContainer.appendChild(stopQuizButton);
    div.appendChild(label);
    if (quizImg) div.appendChild(quizImg);
    div.appendChild(buttonContainer);

    buttons.push(div);
    flags.quizOn = true;

    //Hide boundaries
    getGlobals().boundaryLayer.setStyle({
        zIndex: 1,
        fillOpacity: 0,
        strokeOpacity: 0
    });
    hideAllMarkers();

    // When the user clicks to answer...
    quizBehaviour.callback = (event) => {
        // Hide last answer if any
        if (lastClicked) {
            let styleOptions = {
                strokeColor: 'black',
                strokeWeight: 10,
                fillOpacity: 0,
                strokeOpacity: 0,
                zIndex: 3
            }
            getGlobals().boundaryLayer.overrideStyle(lastClicked, styleOptions);
        }

        //colog(event);
        let name = event.feature.getProperty(nameProperty);
        //colog(name);
        name = removeAccentsAndUpperCase(name);
        colog("User Answer: " + name);
        let correctName = getCorrectName(markers[rArray[currentIndex]], nameProperty);
        correctName = removeAccentsAndUpperCase(correctName);
        colog("Correct Answer: " + correctName);
        let correct = name.endsWith(correctName);
        let colour = 'red';
        if (correct) colour = 'green';

        // Do something if wrong or right
        let styleOptions = {
            strokeColor: colour,
            strokeWeight: 10,
            fillOpacity: 0,
            strokeOpacity: 1,
            zIndex: 3
        }
        getGlobals().boundaryLayer.overrideStyle(event.feature, styleOptions);

        lastClicked = event.feature;
        if (correct) nextRound();
    };

    function updateQuizImg(marker: google.maps.marker.AdvancedMarkerElement | null): void {
        if (!marker) quizImg = null;
        else if (marker.getAttribute("ggmmType") == "image") {
            const markerImg = marker.content as HTMLImageElement;
            if (!quizImg) quizImg = document.createElement("img");
            quizImg.src = markerImg.src;
            quizImg.alt = markerImg.alt;
            quizImg.style.width = "280px"; // Make sure the image fits inside the div
            quizImg.style.height = "auto"; // Maintain aspect ratio
            quizImg.style.marginBottom = "10px"; // Optional spacing below the image
        }
    }

    function nextRound() {
        currentIndex++;
        if (currentIndex >= markers.length) {
            label.textContent = "Quiz finished!";
            //updateQuizImg(null);
            quizImg!.style.display = "none";
            skipButton.disabled = true;
            skipButton.style.opacity = "0.5";
            showmeButton.disabled = true;
            showmeButton.style.opacity = "0.5";
            stopQuizButton.textContent = "Close";
        } else {
            label.textContent = getLabelText(markers[rArray[currentIndex]], clickon);
            const mType = markers[rArray[currentIndex]].getAttribute("ggmmType");
            if (mType == "image") {
                updateQuizImg(markers[rArray[currentIndex]]);
            }
        }
    }
}

function getCorrectName(marker: google.maps.marker.AdvancedMarkerElement, nameProperty: string): string {
    if (!marker) colog("Weird");
    const mType = marker.getAttribute("ggmmType");
    if (mType == "image") {
        const mp = marker.position as google.maps.LatLng;
        //if (mp) {
        const correctPolygon = findContainingPolygon(getGlobals().boundaryLayer, mp);
        //}
        //colog(correctPolygon);
        return correctPolygon?.getProperty(nameProperty) as string;
    }
    else return marker.content?.textContent as string;
}

function getLabelText(marker: google.maps.marker.AdvancedMarkerElement, clickon: string) {
    if (!marker) colog("Weird2");
    const mType = marker.getAttribute("ggmmType");
    if (mType == "image") return "Click on the subdivision that corresponds to the image shown";
    else return "Click on " + clickon + marker.content?.textContent;
}

function findContainingPolygon(
    dataLayer: google.maps.Data,
    latLng: google.maps.LatLng
): google.maps.Data.Feature | null {
    let containingFeature: google.maps.Data.Feature | null = null;

    dataLayer.forEach((feature: google.maps.Data.Feature) => {
        const geometry = feature.getGeometry();
        if (!geometry) return;

        if (geometry.getType() === 'Polygon') {
            const polygon = geometryToPolygon(geometry as google.maps.Data.Polygon);
            if (google.maps.geometry.poly.containsLocation(latLng, polygon)) {
                containingFeature = feature;
            }
        } else if (geometry.getType() === 'MultiPolygon') {
            const multiPolygon = geometry as google.maps.Data.MultiPolygon;
            multiPolygon.getArray().forEach((poly) => {
                const polygon = geometryToPolygon(poly);
                if (google.maps.geometry.poly.containsLocation(latLng, polygon)) {
                    containingFeature = feature;
                }
            });
        }
    });

    return containingFeature;
}

// Helper function: Convert Data.Polygon to google.maps.Polygon
function geometryToPolygon(
    geometry: google.maps.Data.Polygon
): google.maps.Polygon {
    const paths: google.maps.LatLngLiteral[][] = [];

    geometry.getArray().forEach((linearRing: google.maps.Data.LinearRing) => {
        const path: google.maps.LatLngLiteral[] = linearRing
            .getArray()
            .map((latLng) => ({
                lat: latLng.lat(),
                lng: latLng.lng(),
            }));
        paths.push(path);
    });

    return new google.maps.Polygon({ paths });
}


