import { markers, countryMenu, layerMenu, flags, getGlobals, auxButton, quizBehaviour } from '../globals';
import { zoom, removeAllFeatures, loadGeoJSONFile } from '../geojsonFacilities';
import { loadMarkerLayer, hideAllMarkers, showAllMarkers } from '../markerFacilities';
import { markerInMiddle } from '../postprocess';
import { showAuxButton } from '../index';
import { Country } from './Country';
import { Layer } from './Layer';
import { colog, splitCamelCase, partial, removeAccentsAndUpperCase, getRandomArray } from '../utilities.js';

export class Greece extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Greece/Level3.geojson';
    this.layers.push(new Municipalities());
  }

  public static override getInstance(): Greece {
    return this.instance ? this.instance : (this.instance = new Greece());
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/Greece/Level3.geojson', "boundaryLayer", partial(markerInMiddle, "name", true));
  }

}

class Municipalities extends Layer {

  public constructor() {
    super();
    this.displayName = "Municipalities";
  }

  public show(): void {
    loadMarkerLayer(countryMenu.value, layerMenu.value);
    showAuxButton("Start quiz", this.auxBehaviour);
  }

  public sandbox(): void { }

  public auxBehaviour(): void {
    const buttons = getGlobals().map.controls[google.maps.ControlPosition.TOP_CENTER];
    if (buttons.getLength() == 3) buttons.pop();
    const rArray = getRandomArray(markers.length);
    let currentDimos = 0;
    let lastClicked: google.maps.Data.Feature | null = null;

    const div = document.createElement("div");
    div.className = "custom-overlay";
    div.style.zIndex = "9999";
    div.style.width = "300px";
    div.style.display = "flex";
    div.style.flexDirection = "column";

    // Create the label
    const label = document.createElement("label");
    label.textContent = "Click on ΔΗΜΟΣ " + markers[rArray[currentDimos]].content?.textContent;
    label.style.marginBottom = "10px";

    // Create the div to hold the color picker and cancel button
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
      let foundFeature: google.maps.Data.Feature | null = null;

      const correctName = markers[rArray[currentDimos]].content?.textContent;
      if (correctName) {
        getGlobals().boundaryLayer.forEach((feature) => {
          let name = feature.getProperty("name") as string;
          colog(name);
          name = removeAccentsAndUpperCase(name);
          colog(name);
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
      // if (lastClicked) {
      //   let styleOptions = {
      //     strokeColor: 'black',
      //     strokeWeight: 10,
      //     fillOpacity: 0,
      //     strokeOpacity: 0,
      //     zIndex: 3
      //   }
      //   getGlobals().boundaryLayer.overrideStyle(lastClicked, styleOptions);
      // }
      if (buttons.getLength() == 3) buttons.pop();
      showAuxButton("Start quiz", this.auxBehaviour);
      flags.quizOn = false;
      // Show boundary layer
      removeAllFeatures();
      getGlobals().boundaryLayer.setStyle({
        zIndex: 1,
        fillOpacity: 0,
        strokeOpacity: 1
      });
      loadGeoJSONFile('/Layers/Greece/Level3.geojson');
      showAllMarkers();
      quizBehaviour.callback = null;
    });

    // Append the elements to the container div
    //buttonContainer.appendChild(colorPicker);
    buttonContainer.appendChild(skipButton);
    buttonContainer.appendChild(showmeButton);
    buttonContainer.appendChild(stopQuizButton);
    div.appendChild(label);
    div.appendChild(buttonContainer);

    //stopDivEvents(div);

    // colorPicker.addEventListener("input", (event) => {
    //     event.stopPropagation();
    //     skipButton.disabled = false;
    //     skipButton.style.opacity = "1";
    //     selectedColour = (event.target as HTMLInputElement).value;
    //     console.log("Selected color:", selectedColour);
    // });
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
    buttons.push(div);
    // const customOverlay = new CustomOverlay(new google.maps.LatLng(0,0), overlayDiv, true, 400, 200);
    // customOverlay.setMap(getGlobals().map);
    flags.quizOn = true;
    //auxButton.textContent = "Stop quiz";
    //Hide boundaries
    getGlobals().boundaryLayer.setStyle({
      zIndex: 1,
      fillOpacity: 0,
      strokeOpacity: 0
    });
    hideAllMarkers();

    quizBehaviour.callback = (event) => {
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
      colog(event);
      let name = event.feature.getProperty("name");
      colog(name);
      name = removeAccentsAndUpperCase(name);
      colog(name);
      const correctName = markers[rArray[currentDimos]].content?.textContent;
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

    function nextRound() {
      currentDimos++;
      if (currentDimos > markers.length) {
        label.textContent = "Quiz finished!";
        skipButton.disabled = true;
        skipButton.style.opacity = "0.5";
        showmeButton.disabled = true;
        showmeButton.style.opacity = "0.5";
        stopQuizButton.textContent = "Close";
      } else label.textContent = "Click on ΔΗΜΟΣ " + markers[rArray[currentDimos]].content?.textContent;
    }
  }
}
