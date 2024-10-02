/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import TxtOverlay from './ov.jsx';

let map: google.maps.Map;
let streetViewLayer;
let lastCountry, lastLayer;
let boundaryLayer, secondaryLayer, auxButton, saveLocsButton, editModeButton, coverageButton;
let boundaryFeatures = [], secondaryFeatures = [];
let overlay;
var markers: google.maps.marker.AdvancedMarkerElement[] = [];
let countryMenu, layerMenu: HTMLSelectElement;
let layerMin = 0;
let infoWindow;
let editMode = false, debugMode = false, localMode = false, coverageMode = false, askToSave = false;
let showAreas = true, showBorders = false;
const colors = ["#000000", "#CD66FF", "#FF6599", "#FF0000", "#FF8E00", "#9B870C", "#008E00", "#00C0C0", "#400098", "#8E008E"];
let colourDigit = 1; // which digit is used for colour selection
interface markerLoc {
    text: string;
    type: string;
    lat: number;
    lng: number;
    scale: number;
}
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

function colog(a) {
    if (debugMode) console.log(a);
}

// Define a function that partially applies another function
function partial(fn, ...fixedArgs) {
    return function (...freeArgs) {
        return fn(...freeArgs, ...fixedArgs);
    };
}

function newCountryReset() {
    lastCountry = countryMenu.value;
    boundaryLayer.setStyle({ strokeOpacity: '1', fillOpacity: '0' });
    removeAllFeatures();
    removeAllMarkers();
    hideAuxButton();
    if (overlay) overlay.setMap(null);
    askToSave = false;
    editMode = false;
    editModeButton.textContent = 'Turn Edit Mode ON';
}

function newLayerReset(opacity = 0.1) {
    let goOn = true;
    if (askToSave) {
        // Display a confirmation dialog with "OK" and "Cancel" buttons
        goOn = confirm('Unsaved edits will be discarded. Do you want to continue?');
    }
    if (goOn) {
        lastLayer = layerMenu.options[layerMenu.selectedIndex].textContent;
        boundaryLayer.setStyle({ strokeOpacity: opacity, fillOpacity: '0' });
        clearSecondaryLayer();
        secondaryLayer.setStyle({
            strokeColor: 0,
            strokeWeight: 3});
        removeAllMarkers();
        hideAuxButton();
        if (overlay) overlay.setMap(null);
        askToSave = false;
        editMode = false;
        editModeButton.textContent = 'Turn Edit Mode ON';
    } else {
        selectOption(layerMenu, lastLayer);
    }
    return goOn;
}

function showAllAreas() {
    loadGeoJSONFile('Layers/Mexico/' + "Phone Codes200" + '.geojson', "secondaryLayerClear");
    for (let i = 3; i <= 9; i++) {
        let layerName = "Phone Codes" + i + "00";
        loadGeoJSONFile('Layers/Mexico/' + layerName + '.geojson', "secondaryLayer");
    }
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

function markerInMiddle(farr, split = false, col) {

              if (farr.length > 0) {
                  farr.forEach((feature) => {
                      let styleOptions = {
                          strokeColor: colors[col]
                      }
                      secondaryLayer.overrideStyle(feature, styleOptions);  
                      let pointsArray = [];
                      //colog(feature);
                      let name = feature.Fg.ref;
                      //colog(name);
                      if (split) {
                              let result = '';
                              for (let i = 0; i < name.length; i++) {
                                  const char = name[i];
                                  // Check if the character is uppercase and not the first character
                                  if (char !== char.toLowerCase() && i !== 0) {
                                      // If it's uppercase and not the first character, add a space before it
                                      result += ' ';
                                  }
                                  // Add the current character to the result
                                  result += char;
                              }
                              name = result;
                      }
                      const geometry = feature.getGeometry();
                      if (geometry) {
                          processPoints2(geometry, pointsArray, (p, a) => { a.push(p) });
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
                          placeNewMarker(map, { lat: avgLat, lng: avgLng }, name, null, "name", 6);
                      }
                  });
    }
}

function colorCoding(farr, col, w = 5) {

    let arbitrary = false;
    if (col < 0) {
        arbitrary = true;
        col = 0;
    }
    if (farr.length > 0) {
        farr.forEach((feature) => {

            //colog(w);
            //colog(col);
            colog(feature.Fg.ref);
            if (arbitrary) col = (Number(feature.Fg.ref)) % 10;
            let styleOptions = {
                strokeColor: colors[col],
                strokeWeight: w,
            }
            secondaryLayer.overrideStyle(feature, styleOptions);  
        });
    }
}

function colorCoding2(farr, field, field2, digit, colArray, w = 5) {

    if (farr.length > 0) {
        farr.forEach((feature) => {

            let col = 3;
            let name = feature[field][field2].toString();
            colog("here" + name);
            
            if (digit < 0) {
                let index = name.indexOf(";");
                let rname = index !== -1 ? name.substring(0, index) : name;
                if (rname in colArray) col = Number(colArray[rname]);   
            }
            else {
                col = Number(name[digit]);
            }
            let styleOptions = {
                strokeColor: colors[col],
                strokeWeight: w,
            }
            secondaryLayer.overrideStyle(feature, styleOptions);

            //markerInMiddle(feature);
        });
    }
}

function thickBlue(farr) {
    //colog(farr);
    if (farr.length > 0) {
        farr.forEach((feature) => {
            //colog("t2");
            let styleOptions = {
                strokeColor: 'blue',
                strokeWeight: '10',
                strokeOpacity: '0.2',
                zIndex: '1'
            }
            secondaryLayer.overrideStyle(feature, styleOptions);
        });
    }
}

function createCountryChooser(map) {
    countryMenu = document.createElement('select');
    countryMenu.className = "buttons";

    const top = new Option("Choose Country", "0");
    top.selected = true;
    top.disabled = true;
    countryMenu.appendChild(top);
    countryMenu.appendChild(new Option("Bulgaria", "Bulgaria"));
    countryMenu.appendChild(new Option("Chile", "Chile"));
    countryMenu.appendChild(new Option("Estonia", "Estonia"));
    countryMenu.appendChild(new Option("France", "France"));
    if (localMode) countryMenu.appendChild(new Option("France Sandbox", "France Sandbox"));
    if (localMode) countryMenu.appendChild(new Option("Greece Sandbox", "Greece Sandbox"));
    if (localMode) countryMenu.appendChild(new Option("Indonesia Sandbox", "Indonesia Sandbox"));
    countryMenu.appendChild(new Option("Indonesia", "Indonesia"));
    countryMenu.appendChild(new Option("Ireland", "Ireland"));
    countryMenu.appendChild(new Option("Jordan", "Jordan"));
    countryMenu.appendChild(new Option("Mexico", "Mexico"));
    countryMenu.appendChild(new Option("Norway", "Norway"));
    countryMenu.appendChild(new Option("Romania", "Romania"));
    countryMenu.appendChild(new Option("Sweden", "Sweden"));
    countryMenu.appendChild(new Option("South Africa", "South Africa"));
    countryMenu.appendChild(new Option("Turkey", "Turkey"));
    countryMenu.appendChild(new Option("Turkey (with colors)", "Turkey Sandbox"));
    countryMenu.appendChild(new Option("USA", "USA"));

    countryMenu.onchange = (event) => {
      colog(countryMenu.value);
      let goOn = true;
      if (askToSave) {
          // Display a confirmation dialog with "OK" and "Cancel" buttons
          goOn = confirm('Unsaved edits will be discarded. Do you want to continue?');
      }
      if (goOn) {          
      newCountryReset();
      for (var i = layerMenu.length - 1; i > 0; i--)
          layerMenu.remove(i);
      layerMenu.options[0].selected = true;
      if (countryMenu.value == "Bulgaria") {
          loadGeoJSONFile('/Layers/Bulgaria/Provinces.geojson');
          const newtop = new Option("Phone Codes", "Phone Codes");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              if (!newLayerReset(1)) return;
              loadMarkerLayer(countryMenu.value, layerMenu.value);
          };
      }
      if (countryMenu.value == "France Sandbox") {
          loadGeoJSONFile('/Layers/France/Level2.geojson', "boundaryLayer", markerInMiddle);
      }
      if (countryMenu.value == "Indonesia") {
          loadGeoJSONFile('/Layers/Indonesia/Level2.geojson');
          layerMenu.appendChild(new Option("Kabupaten", "Kabupaten"));
          //layerMenu.appendChild(new Option("Kecamatan", "Kecamatan"));
          layerMenu.onchange = () => {
              if (!newLayerReset(1)) return;
              showAuxButton("Show Province borders");
              loadMarkerLayer(countryMenu.value, layerMenu.value);
          };
      }
          if (countryMenu.value == "Greece Sandbox") {
              loadGeoJSONFile('/Layers/Greece/Level3.geojson', "boundaryLayer", partial(markerInMiddle));
          }
          if (countryMenu.value == "Indonesia Sandbox") {
          loadGeoJSONFile('/Layers/Indonesia/Level3.geojson', "boundaryLayer", partial(markerInMiddle, true));
      }
      if (countryMenu.value == "France") {
          loadGeoJSONFile('/Layers/France/Level2.geojson');
          const newtop = new Option("Department Names", "NamesLevel2");
          layerMenu.appendChild(newtop);
          const clusters = new Option("Placename Clusters", "Clusters");
          layerMenu.appendChild(clusters);
          const bigR = new Option("Major Rivers", "Major Rivers");
          layerMenu.appendChild(bigR);
          const smallR = new Option("Smaller Rivers", "Smaller Rivers");
          layerMenu.appendChild(smallR);
          layerMenu.onchange = () => {
              if (!newLayerReset()) return;
              if (layerMenu.value == "Clusters") {
                  loadMarkerLayer("France", "Brie");
                  loadMarkerLayer("France", "Vexin");
                  loadMarkerLayer("France", "Auge");
                  loadMarkerLayer("France", "Argonne");
                  loadMarkerLayer("France", "Bresse");
                  loadMarkerLayer("France", "Bray");
                  loadMarkerLayer("France", "Beauce");
                  loadMarkerLayer("France", "Woevre");
                  loadMarkerLayer("France", "Morvan");
                  loadMarkerLayer("France", "Caux");
                  loadMarkerLayer("France", "Gatinais");
                  loadMarkerLayer("France", "Bessin");
                  loadMarkerLayer("France", "Othe");
                  loadMarkerLayer("France", "Diois");
                  loadMarkerLayer("France", "Santerre");
                  loadMarkerLayer("France", "Mauges");
                  loadMarkerLayer("France", "Vercors");
                  loadMarkerLayer("France", "Royans");
                  loadMarkerLayer("France", "Cambresis");
              }
              else if (layerMenu.value == "Major Rivers") {
                  loadMarkerLayer("France", "MajorRivers");
              }
              else if (layerMenu.value == "Smaller Rivers") {
                  loadMarkerLayer("France", "MinorRivers");
              }
              else {
                  boundaryLayer.setStyle({ strokeOpacity: '1', fillOpacity: '0' });
                  loadGeoJSONFile('/Layers/France/Level2.geojson');
                  loadMarkerLayer(countryMenu.value, layerMenu.value);                  
              }
          };
      }
      if (countryMenu.value == "Chile") {
          loadGeoJSONFile('/Layers/Chile/Level1.geojson');
          const newtop = new Option("Phone Codes", "Phone Codes");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              if (!newLayerReset(1)) return;
              loadMarkerLayer(countryMenu.value, layerMenu.value);
          };
      }
          if (countryMenu.value == "Estonia") {
              loadGeoJSONFile('/Layers/Estonia/Level1.geojson');
              layerMenu.appendChild(new Option("Phone Codes", "Phone Codes"));
              layerMenu.appendChild(new Option("Bike routes 1-16", "Bike routes 1-16"));
              layerMenu.appendChild(new Option("3-digit bike routes", "3-digit bike routes"));
              layerMenu.appendChild(new Option("Highways", "Highways"));
              layerMenu.appendChild(new Option("Rivers", "Rivers"));
              layerMenu.onchange = () => {
                  if (!newLayerReset(1)) return;
                  if (layerMenu.value == "Phone Codes") {
                      loadMarkerLayer(countryMenu.value, layerMenu.value);
                  }
                  else if (layerMenu.value == "Bike routes 1-16") {
                      showAuxButton("Next route");
                      const geopath = 'Layers/Estonia/geojson/B1.geojson';
                      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, 3));
                      placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Route 1");
                  }
                  else if (layerMenu.value == "3-digit bike routes") {
                      showAuxButton("Next set of routes");
                      const geopath = 'Layers/Estonia/geojson/B14x.geojson';
                      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, 3));
                      placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Routes 140-149");
                  }
                  else if (layerMenu.value == "Highways") {
                      showAuxButton("Next set of highways");
                      const geopath = 'Layers/Estonia/geojson/H1.geojson';
                      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, 3));
                      placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Highways 12-19");
                  }
                  else if (layerMenu.value == "Rivers") {
                      //showAuxButton("Next set of highways");
                      const geopath = 'Layers/Estonia/Rivers.geojson';
                      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, 3, 7));
                      loadMarkerLayer(countryMenu.value, layerMenu.value);
                  }
              };
          }
              if (countryMenu.value == "Estonia") {
              loadGeoJSONFile('/Layers/Estonia/Level1.geojson');
              layerMenu.appendChild(new Option("Phone Codes", "Phone Codes"));
              layerMenu.appendChild(new Option("Bike routes 1-16", "Bike routes 1-16"));
              layerMenu.appendChild(new Option("3-digit bike routes", "3-digit bike routes"));
              layerMenu.appendChild(new Option("Highways", "Highways"));
              layerMenu.appendChild(new Option("Rivers", "Rivers"));
              layerMenu.onchange = () => {
                  if (!newLayerReset(1)) return;
                  if (layerMenu.value == "Phone Codes") {
                      loadMarkerLayer(countryMenu.value, layerMenu.value);
                  }
                  else if (layerMenu.value == "Bike routes 1-16") {
                      showAuxButton("Next route");
                      const geopath = 'Layers/Estonia/geojson/B1.geojson';
                      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, 3));
                      placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Route 1");
                  }
                  else if (layerMenu.value == "3-digit bike routes") {
                      showAuxButton("Next set of routes");
                      const geopath = 'Layers/Estonia/geojson/B14x.geojson';
                      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, 3));
                      placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Routes 140-149");
                  }
                  else if (layerMenu.value == "Highways") {
                      showAuxButton("Next set of highways");
                      const geopath = 'Layers/Estonia/geojson/H1.geojson';
                      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, 3));
                      placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Highways 12-19");
                  }
                  else if (layerMenu.value == "Rivers") {
                      //showAuxButton("Next set of highways");
                      const geopath = 'Layers/Estonia/Rivers.geojson';
                      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, 3, 7));
                      loadMarkerLayer(countryMenu.value, layerMenu.value);
                  }
              };
          }
      if (countryMenu.value == "Jordan") {
          loadGeoJSONFile('/Layers/Jordan/Level0.geojson');          
          const newtop = new Option("Misc Meta", "Misc Meta");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              if (!newLayerReset()) return;
              loadMarkerLayer(countryMenu.value, layerMenu.value);
              layerMin = 0.1; // So images do not get too small
          };
      }
      if (countryMenu.value == "Mexico") {
          loadGeoJSONFile('/Layers/Mexico/States.geojson');
          const plates = new Option("License Plates", "License Plates");
          const code200 = new Option("Phone Codes (200)", "Phone Codes200");
          const code300 = new Option("Phone Codes (300)", "Phone Codes300");
          const code400 = new Option("Phone Codes (400)", "Phone Codes400");
          const code500 = new Option("Phone Codes (500)", "Phone Codes500");
          const code600 = new Option("Phone Codes (600)", "Phone Codes600");
          const code700 = new Option("Phone Codes (700)", "Phone Codes700");
          const code800 = new Option("Phone Codes (800)", "Phone Codes800");
          const code900 = new Option("Phone Codes (900)", "Phone Codes900");
          const codeAll = new Option("Phone Codes (all)", "Phone Codesall");
          layerMenu.appendChild(plates);
          layerMenu.appendChild(code200);
          layerMenu.appendChild(code300);
          layerMenu.appendChild(code400);
          layerMenu.appendChild(code500);
          layerMenu.appendChild(code600);
          layerMenu.appendChild(code700);
          layerMenu.appendChild(code800);
          layerMenu.appendChild(code900);
          layerMenu.appendChild(codeAll);
          
          layerMenu.onchange = async () => {
              if (!newLayerReset()) return;
              colourDigit = 0;
              //boundaryLayer.setStyle({ strokeOpacity: '0.2', fillOpacity: '0' }); 
              showAreas = true;
              if (layerMenu.value == "License Plates") {
                  loadMarkerLayer(countryMenu.value, layerMenu.value);
              } 
              else if (layerMenu.value == "Phone Codesall") {
                  showAuxButton("Hide Area Boundaries");
                  showAllAreas();
                  for (let i = 2; i <= 9; i++) {
                      let layerName = "Phone Codes" + i + "00";
                      loadMarkerLayer(countryMenu.value, layerName);
                  }
                  zoom(map);
              }
              else {
                  showAuxButton("Hide Area Boundaries");
                  colourDigit = 1;
                  loadMarkerLayer(countryMenu.value, layerMenu.value);
                  await loadGeoJSONFile('Layers/Mexico/' + layerMenu.value + '.geojson', "secondaryLayerClear");
                  zoom(map, "secondaryLayer");
              }   
          };
      }
          if (countryMenu.value == "Norway") {
              loadGeoJSONFile('/Layers/Norway/Level1.geojson');
              //layerMenu.appendChild(new Option("Phone Codes", "Phone Codes"));
              //layerMenu.appendChild(new Option("Bike routes 1-16", "Bike routes 1-16"));
              //layerMenu.appendChild(new Option("3-digit bike routes", "3-digit bike routes"));
              layerMenu.appendChild(new Option("Highways", "Highways"));
              //layerMenu.appendChild(new Option("Rivers", "Rivers"));
              layerMenu.onchange = () => {
                  if (!newLayerReset(0)) return;
                  //if (layerMenu.value == "Phone Codes") {
                  //    loadMarkerLayer(countryMenu.value, layerMenu.value);
                  //}
                  //else if (layerMenu.value == "Bike routes 1-16") {
                  //    showAuxButton("Next route");
                  //    const geopath = 'Layers/Estonia/geojson/B1.geojson';
                  //    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, 3));
                  //    placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Route 1");
                  //}
                  //else if (layerMenu.value == "3-digit bike routes") {
                  //    showAuxButton("Next set of routes");
                  //    const geopath = 'Layers/Estonia/geojson/B14x.geojson';
                  //    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, 3));
                  //    placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Routes 140-149");
                  //}
                  if (layerMenu.value == "Highways") {
                      showAuxButton("Next set of highways");
                      const geopath = 'Layers/Norway/HE.geojson';
                      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding2, "Fg", "ref", -1, colll));
                      loadMarkerLayer(countryMenu.value, "Ex")
                      //placeNewMarker(map, { lat: 65.7, lng: 8.9 }, "European Highways");
                  }
                  //else if (layerMenu.value == "Rivers") {
                  //    //showAuxButton("Next set of highways");
                  //    const geopath = 'Layers/Estonia/Rivers.geojson';
                  //    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, 3, 7));
                  //    loadMarkerLayer(countryMenu.value, layerMenu.value);
                  //}
              };
          }
      if (countryMenu.value == "Romania") {
          loadGeoJSONFile('/Layers/Romania/Counties.geojson');
          const newtop = new Option("Phone Codes", "Phone Codes");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              if (!newLayerReset(1)) return;
              loadMarkerLayer(countryMenu.value, layerMenu.value);
          };
      }
      if (countryMenu.value == "Sweden") {
          loadGeoJSONFile('/Layers/Sweden/Level1.geojson');
          const newtop = new Option("Bus Stop Signs", "Bus Stop Signs");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              if (!newLayerReset(1)) return;
              loadMarkerLayer(countryMenu.value, layerMenu.value);
              layerMin = 0; // Images can get arbitrarily small
          };
      }
          if (countryMenu.value == "Ireland") {
              loadGeoJSONFile('/Layers/Ireland/Level1.geojson');
              layerMenu.appendChild(new Option("Phone Codes", "Phone Codes"));
              layerMenu.appendChild(new Option("Flags", "Flags"));
              layerMenu.onchange = () => {
                  if (!newLayerReset(0)) return;
                  
                      loadMarkerLayer(countryMenu.value, layerMenu.value);
                  
                  if (layerMenu.value == "Phone Codes") {
                      const imageBounds = {
                          north: 55.39670541542703,
                          south: 51.39515298809492,
                          east: -5.794921399305524,
                          west: -10.724657727430525,
                      };

                      overlay = new google.maps.GroundOverlay(
                          "/Layers/Ireland/Codes.png",
                          imageBounds,
                      );
                      overlay.setMap(map);
                  }
                  
                  //layerMin = 0; // Images can get arbitrarily small
              };
          }
      if (countryMenu.value == "South Africa") {
          loadGeoJSONFile('/Layers/South Africa/Level1.geojson');
          layerMenu.appendChild(new Option("Most useful highway clusters", "Clusters"));
          for (let i = 2; i <= 7; i++) {
              const optionName = " " + i + "x Highway Numbers";
              layerMenu.appendChild(new Option(optionName, optionName));
          }
          layerMenu.appendChild(new Option(" 8x 9x Highway Numbers", " 8x 9x Highway Numbers"));
          layerMenu.appendChild(new Option("Parallel routes (R1xy)", "Parallel routes"));
          for (let i = 30; i <= 72; i++) {
              const optionName = i + "x Highway Numbers";
              layerMenu.appendChild(new Option(optionName, optionName));
              if (i == 41) i = 49;
              if (i == 57) i = 59;
              if (i == 62) i = 69;
          }
          layerMenu.onchange = async () => {
              if (!newLayerReset()) return;
              showAuxButton("Next option");
              const styleOptions = {
                  strokeColor: 'black',
                  strokeOpacity: '1',
                  strokeWeight: '5'
              };
              secondaryLayer.setStyle(styleOptions);
              if (layerMenu.value == "Clusters") {
                  loadGeoJSONFile('Layers/South Africa/Clusters.geojson', "secondaryLayer");
                  loadMarkerLayer(countryMenu.value, layerMenu.value);
              }
              else {
                  const group = layerMenu.value.substring(0, 2).replace(/\s/g, '');
                  const geopath = 'Layers/South Africa/geojson/' + group + 'x.geojson';
                  loadGeoJSONFile(geopath, "secondaryLayer");
                  loadMarkerLayer("South Africa", "markers/" + group);
              }
          };
      }
      if (countryMenu.value == "Turkey") {
          loadGeoJSONFile('/Layers/Turkey/Level1.geojson');
          for (let i = 0; i <= 9; i++) {
              const optionName = "D" + i + "xx Highway Numbers";
              layerMenu.appendChild(new Option(optionName, optionName));
          }
          layerMenu.onchange = async () => {
              if (!newLayerReset()) return;
              showAuxButton("Next option");
              const styleOptions = {
                  strokeColor: 'black',
                  strokeOpacity: '1',
                  strokeWeight: '5'
              };
              secondaryLayer.setStyle(styleOptions);
              const group = layerMenu.value.substring(1, 2);
              //Explore code
              //for (let i = 0; i <= 9; i++) {
              //    const geopath = 'Layers/Turkey/geojson/D' + group + "0" + i + '.geojson';
              //    await loadGeoJSONFile(geopath, "secondaryLayer", styleOptions, true);
              //    //loadMarkerLayer("Turkey", "markers/" + group);
              //}
              //for (let i = 10; i <= 99; i++) {
              //    const geopath = 'Layers/Turkey/geojson/D' + group + i + '.geojson';
              //    await loadGeoJSONFile(geopath, "secondaryLayer", styleOptions, true);
              //    //loadMarkerLayer("Turkey", "markers/" + group);
              //}
              
              const geopath = 'Layers/Turkey/D' + group + '.geojson';
              loadGeoJSONFile(geopath, "secondaryLayer");
              loadMarkerLayer("Turkey", "D" + group);
          };
      }
      if (countryMenu.value == "Turkey Sandbox") {
          loadGeoJSONFile('/Layers/Turkey/Level1.geojson');
          for (let i = 0; i <= 9; i++) {
              const optionName = "D" + i + "xx Highway Numbers";
              layerMenu.appendChild(new Option(optionName, optionName));
          }
          let hnames = [];
          hnames.push(["010", "014", "016", "020", "030", "040", "050", "060", "062", "070", "080"]);
          hnames.push(["100", "110", "120", "130", "140", "150", "160", "170", "180", "190"]);
          hnames.push(["200","210","230","240","250","260","270","280","290"]);
          hnames.push(["300", "302", "310", "320", "330", "340", "350", "360", "370", "380", "390"]);
          hnames.push(["400", "410", "420", "430"]);
          hnames.push(["505", "515", "525", "535", "550", "555", "565", "567", "569", "573", "575", "585", "587", "595"]);
          hnames.push(["605", "615", "625", "635", "650", "655", "665", "675", "685", "687", "695", "696"]);
          hnames.push(["705", "715", "750", "753", "755", "757", "759", "765", "775", "785", "795"]);
          hnames.push(["805", "815", "817", "825", "827", "835", "850", "851", "855", "865", "875", "877", "883", "885", "887"]);
          hnames.push(["905", "915", "925", "950", "955", "957", "959", "965", "975", "977"]);
              layerMenu.onchange = async () => {
                  if (!newLayerReset()) return;
              showAuxButton("Next option");
                  const styleOptions = {
                      strokeColor: 'black',
                      strokeOpacity: '1',
                      strokeWeight: '5'
                  };
                  secondaryLayer.setStyle(styleOptions);
              const group = layerMenu.value.substring(1, 2);
              
                  hnames[group].forEach(async (name, index) => {
                      const col = Number(name.substring(1, 2));
                      colog(col);
                      const geopath = 'Layers/Turkey/geojson/D' + name + '.geojson';
                      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, col));
                  });

                  loadMarkerLayer("Turkey", "D" + group);
                  //const col = Number(name.substring(1, 2));
                  //colog(col);
                  //let styleOptions = {
                  //    strokeColor: colors[col],
                  //    strokeOpacity: '1',
                  //    strokeWeight: '5'
                  //};
              //for (let i = 0; i <= 9; i++) {
              //    const geopath = 'Layers/Turkey/geojson/D' + group + "0" + i + '.geojson';
              //    await loadGeoJSONFile(geopath, "secondaryLayer", styleOptions);
              //    //loadMarkerLayer("Turkey", "markers/" + group);
              //}
              //for (let i = 10; i <= 99; i++) {
              //    const geopath = 'Layers/Turkey/geojson/D' + group + i + '.geojson';
              //    await loadGeoJSONFile(geopath, "secondaryLayer", styleOptions);
              //    //loadMarkerLayer("Turkey", "markers/" + group);
              //}
          };
      }
      if (countryMenu.value == "USA") {
          loadGeoJSONFile('/Layers/USA/States.geojson');
          const newtop = new Option("License Plates", "License Plates");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              if (!newLayerReset()) return;
              loadMarkerLayer(countryMenu.value, layerMenu.value);
              layerMin = 0; // Images can get arbitrarily small
          };
      }
          } else {
              // User clicked "Cancel" or closed the dialog
              console.log('User clicked Cancel or closed the dialog');
          event.preventDefault();
          selectOption(countryMenu, lastCountry);
          }
  };

  return countryMenu;
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
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function createCoverageButton(map) {
    coverageButton = document.createElement('button');
    coverageButton.className = "buttons";
    coverageButton.textContent = 'Show Coverage';
    coverageButton.title = 'Click to show/hide streetview coverage';
    coverageButton.type = 'button';

    // Setup the click event listener
    coverageButton.addEventListener('click', () => {
        coverageMode = !coverageMode;
        if (coverageMode) {
            streetViewLayer.setMap(map);
            coverageButton.textContent = 'Hide Coverage';
        } else {
            streetViewLayer.setMap(null);
            coverageButton.textContent = 'Show Coverage';
        }
    });
    return coverageButton;
}

function createEditModeButton(map) {
    editModeButton = document.createElement('button');
    editModeButton.className = "buttons";
    editModeButton.textContent = 'Turn Edit Mode ON';
    editModeButton.title = 'Click to edit the map';
    editModeButton.type = 'button';

    // Setup the click event listener
    editModeButton.addEventListener('click', () => {
        editMode = !editMode;
        if (editMode) {
            askToSave = true;
            markers.forEach(m => { m.gmpDraggable = true; })
            map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(saveLocsButton);
            editModeButton.textContent = 'Turn Edit Mode OFF';
        } else {
            markers.forEach(m => { m.gmpDraggable = false; })
            map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].pop();
            editModeButton.textContent = 'Turn Edit Mode ON';
        }
    });
    return editModeButton;
}

function createLayerChooser(map) {
    layerMenu = document.createElement('select');
    layerMenu.className = "buttons";

    const top = new Option("Choose Layer", "0");
    top.selected = true;
    top.disabled = true;
    layerMenu.appendChild(top);
    const dummy = new Option("Must select country first", "1");
    dummy.disabled = true;
    layerMenu.appendChild(dummy);
    return layerMenu;
}

function loadMarkerLayer(country, layer) {
    const path = '/Layers/' + country + '/' + layer + '.json';
    const imagepath = '/Layers/' + country + '/' + layer + ' Images/';
    loadMarkers(path, imagepath);
}

function createSaveLocsControl(map) {
    const saveLocsButton = document.createElement('button');
    saveLocsButton.className = "buttons";

  saveLocsButton.textContent = 'Save locs';
  saveLocsButton.title = 'Click to save the location of the markers';
  saveLocsButton.type = 'button';

  // Setup the click event listener
  saveLocsButton.addEventListener('click', () => {
    let markerLocData: markerLoc[] = [];
      for (let i = 0; i < markers.length; i++)
    { 
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
  });

  return saveLocsButton;
}

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
            loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, 3));
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
            loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, 3));
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
            loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding, 3));
            //placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Route 2");
            markers[0].content.textContent = "Highways " + numb + "0-" + numb + "9";
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
                
                loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding2, "Fg", "ref", -1, colll));
                removeAllMarkers();
                loadMarkerLayer(countryMenu.value, "Ex");
                //markers[0].content.textContent = "European Highways";
            }
            else if (numb == 0) {
                const geopath = 'Layers/Norway/H .geojson';
                loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding2, "Fg", "ref", 0));
                removeAllMarkers();
                loadMarkerLayer(countryMenu.value, "0x");
                //markers[0].content.textContent = "Highways  2-9";
            }
            else {
                const geopath = 'Layers/Norway/H' + numb + '.geojson';
                loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCoding2, "Fg", "ref", 1));
                //markers[0].content.textContent = "Highways " + numb + "0-" + numb + "9";
                removeAllMarkers();
                loadMarkerLayer(countryMenu.value, numb + "x");
            }
        }
    });
    return auxButton;
}

function showAuxButton(name) {
    const buttons = map.controls[google.maps.ControlPosition.TOP_CENTER];
    if (buttons.length == 3) buttons.pop();
    auxButton.textContent = name;
    buttons.push(auxButton);
}

function hideAuxButton() {
    const buttons = map.controls[google.maps.ControlPosition.TOP_CENTER];
    if (buttons.length == 3) buttons.pop();
}

function getTransform(marker) {
    let sc = 1;
    let fszl = Number(marker.getAttribute("fszl"));
    let mtype = marker.getAttribute("ggmmtype");
    let isImage = mtype == "image";
    if (fszl >= 0) {
        let zoom = map.getZoom() - fszl;
        if ((!isImage) && (zoom > 0)) sc = 1;
        else {
            sc = Math.pow(2, zoom); // Math.cos(lat * Math.PI / 180);
            if (sc < layerMin) sc = 0.1;
        }
        //let isName = marker.getAttribute("ggmmtype") == "name";
        //if ((mtype == "name") && (sc > 1)) sc = 1;
    }
    let transform = "scale(" + sc + "," + sc + ")";
    if (isImage) transform = 'translateY(50%) ' + transform;
    return transform;
}

function placeNewMarker(map, position, content = "00", imagepath, type = "area-code", fszl = -1, draggable = true) {
    colog("New marker " + markers.length);
    let zIndex = 0;
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
    marker.addListener('click', () => {
        if (editMode && event.shiftKey && event.metaKey) { // Shift-Command-Click = Increase size
            let fszl = Number(marker.getAttribute("fszl"));
            if (fszl == -1) console.log("Should not happen fszl=-1");
            else {
                fszl--;
                marker.setAttribute("fszl", fszl);
                marker.content.style.transform = getTransform(marker);
            }
        } else if (editMode && event.shiftKey && event.altKey) { // Shift-Option-Click = Decrease size
            let fszl = Number(marker.getAttribute("fszl"));
            if (fszl == -1) console.log("Should not happen fszl=-1");
            else {
                fszl++;
                marker.setAttribute("fszl", fszl);
                marker.content.style.transform = getTransform(marker);
            }
        } else if (editMode && event.shiftKey) { // Option-Click = DELETE
            colog(markers.length);
            marker.setMap(null);
            const index = markers.indexOf(marker);
            if (index > -1) { // only splice array when item is found
                markers.splice(index, 1); // 2nd parameter means remove one item only
            }
            colog(markers.length);
        } else if (editMode && event.altKey) { // Ctrl-Click = Cycle through colours
            if (marker.content.className == "area-code")
                marker.content.className = "transp";
            else if (marker.content.className == "transp")
                marker.content.className = "area-code";
        } else { // Default Operation
            colog(position);
            if (type == "image") {
                infoWindow.close();
                const img = document.createElement('img');
                img.src = imagepath;
                img.onload = function () {
                    // Once the image is loaded, get its dimensions
                    var width = this.naturalWidth;
                    var height = this.naturalHeight;
                    //console.log(window.screen.height);
                    //console.log(window.screen.width);
                    const maxh = Math.floor(window.screen.height * 0.9);
                    // Set max height
                    if (height > maxh) {                        
                        img.style.setProperty('--iwmh', maxh.toString());
                    }
                    else {
                        img.style.setProperty('--iwmh', height.toString());
                    }
                    const maxw = Math.floor(window.screen.width * 0.9);
                    if (width > maxw) {
                        // Set max width
                        infoWindow.setOptions({
                            maxWidth: maxw
                        });
                    }
                    else {
                        infoWindow.setOptions({
                            maxWidth: Math.floor(width * 1.1)
                        });
                    }
                    infoWindow.setContent(img);
                    infoWindow.class = "custom-infowindow";

                    const bounds = map.getBounds();
                    const northLat = bounds.getNorthEast().lat();
                    const southLat = bounds.getSouthWest().lat();
                    const latDifference = northLat - southLat;
                    const mapHeight = map.getDiv().offsetHeight;
                    const cen = map.getCenter();
                    const goDown = (height / 2) * latDifference / mapHeight;
                    const newLat = cen.lat() - goDown;
                    infoWindow.setPosition({ lat: newLat, lng: cen.lng() });
                    infoWindow.open(map);
                };
            }
            else if (editMode) {
                var result = prompt("Enter new value for marker:", marker.content.textContent);
                let thistype = marker.getAttribute("ggmmtype");
                if (result) setMarkerContent(marker, result, marker.content.src, marker.getAttribute("ggmmtype"), fszl);
            }
        } 
    });
    markers.push(marker);
}

async function initMap(): void {

    //@ts-ignore
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    const { StreetViewCoverageLayer } = await google.maps.importLibrary("streetView");
    streetViewLayer = new google.maps.StreetViewCoverageLayer();
  
  map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
    center: new google.maps.LatLng(0, 0),
    zoom: 2,
    mapId: 'DEMO_MAP_ID',
    zoomControl: false,
    scaleControl: true,
    streetViewControl: true,
    disableDoubleClickZoom: true,
    mapTypeControl: true,
    mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        mapTypeIds: ["roadmap", "terrain"],
    },
  });

    boundaryLayer = new google.maps.Data();
    boundaryLayer.setMap(map);
    boundaryLayer.setStyle({
        fillOpacity: '0',
        strokeOpacity: '1'
    });
    secondaryLayer = new google.maps.Data();
    secondaryLayer.setMap(map);
    secondaryLayer.setStyle({
        fillOpacity: '0',
        strokeOpacity: '1',
        strokeColor: 'black'
    });

    map.addListener('dblclick', function(e) {
        placeNewMarker(map, e.latLng);
    });

    map.addListener('click', function (e) {
        infoWindow.close();
    });

    boundaryLayer.addListener('click', function (e) {
        infoWindow.close();
    });

  boundaryLayer.addListener('dblclick',function(e){
    console.log(e);
    placeNewMarker(map, e.latLng);
  });

    map.addListener('zoom_changed', function () {
        console.log(map.getZoom());
        for (let i = 0; i < markers.length; i++) {
            //let fszl = Number(markers[i].getAttribute("fszl"));
            markers[i].content.style.transform = getTransform(markers[i]);
            // if (markers[i].content instanceof google.maps.LatLng)
        }
    });

    const maxw = Math.floor(window.screen.width * 0.9);
    infoWindow = new google.maps.InfoWindow({
        maxWidth: maxw // Set a maximum width for the InfoWindow
        // maxHeight: 1800 // No such option
    });

  // Create the Save Locs button.
  //const saveLocsDiv = document.createElement('div');
  saveLocsButton = createSaveLocsControl(map);
  //saveLocsDiv.appendChild(saveLocs);
    //map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(saveLocsDiv);

    // Create the Edit Mode button.
    const editModeDiv = document.createElement('div');
    const editModeButton = createEditModeButton(map);
    editModeDiv.appendChild(editModeButton);
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(editModeDiv);

    // Create the Coverage button.
    const coverageDiv = document.createElement('div');
    const coverageButton = createCoverageButton(map);
    coverageDiv.appendChild(coverageButton);
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(coverageDiv);

  // Create the country drop down menu
  const countrySelectDiv = document.createElement('div');
  countryMenu = createCountryChooser(map);
  countrySelectDiv.appendChild(countryMenu);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(countryMenu);

  // Create the layer drop down menu
  const layerSelectDiv = document.createElement('div');
  layerMenu = createLayerChooser(map);
  layerSelectDiv.appendChild(layerMenu);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(layerMenu);

    // Create the aux button
    //const auxDiv = document.createElement('div');
    auxButton = createAuxButton();
    //auxDiv.appendChild(auxButton);
    //map.controls[google.maps.ControlPosition.TOP_CENTER].push(auxButton);

    
}

function setMarkerContent(marker, text, imagepath, type, fszl) {

    if (type == "image") {
        const img = document.createElement('img');
        img.src = imagepath;
        img.onload = function () {
            var height = this.height;
            let zoomReduction = 0;
            while (height > 200) {
                zoomReduction++;
                height = height / 2.0;
            }
            if (fszl == -1) fszl = map.getZoom() + zoomReduction;
            marker.setAttribute("fszl", fszl.toString());
            img.style.transform = getTransform(marker);
            img.alt = text;
            marker.content = img;
        }; 
    }
    else { // We are dealing with a text marker
        const markerDiv = document.createElement('div');
        markerDiv.className = "area-code"; // Also applies to type == name
        if (type == "city-code") {
            markerDiv.style.setProperty('--marker-color', '#4285F4');
        }
        else if (type == "digit2") {
            let ch = text[colourDigit];
            if (!isNaN(ch)) {
                //console.log(ch);
                markerDiv.style.setProperty('--marker-color', colors[ch]);
            }
        }
        markerDiv.textContent = text.toString();
        marker.content = markerDiv;
        marker.content.style.transform = getTransform(marker);
    }
}

async function loadMarkers(path:string, imagepathdir:string): void {

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
                placeNewMarker(map, position, text, imagepath, markerLoc.type, markerLoc.fszl, false);
            }
        }
    }
}
        
function loadMarkersBootStrap(): void {

  const infoWindow = new google.maps.InfoWindow();

for (let i = 0; i<70; i++) {

  const phoneCode = document.createElement('div');
  phoneCode.className = 'area-code';
  let code = 20 + i;
  phoneCode.textContent = code.toString();

  let marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: 40 + i/9.9, lng: 25 },
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

function clearSecondaryLayer() {
    secondaryLayer.forEach(function (feature) {
        secondaryLayer.remove(feature);
    });
}

function loadGeoJsonString(geoString: string, layer = "boundaryLayer", postProcess) {
  try {
    const geojson = JSON.parse(geoString) as any;
      if (layer == "boundaryLayer") {
          let newFeatures = boundaryLayer.addGeoJson(geojson);
          if (postProcess) postProcess(newFeatures);
          zoom(map);
      }
      else if (layer.startsWith("secondaryLayer")) {
          if (layer == "secondaryLayerClear") clearSecondaryLayer();
          let newFeatures = secondaryLayer.addGeoJson(geojson);
          if (postProcess) postProcess(newFeatures);
      }
      else console.log("Unknown layer");
  } catch (e) {
      console.log(e);
    alert("Not a GeoJSON file!");
  }
}

/**
 * Update a map's viewport to fit each geometry in a dataset
 */
function zoom(map: google.maps.Map, layer = "boundaryLayer") {
    const bounds = new google.maps.LatLngBounds();
    if (layer == "boundaryLayer") {
        boundaryLayer.forEach((feature) => {
            const geometry = feature.getGeometry();
            if (geometry) {
                processPoints(geometry, bounds.extend, bounds);
            }
        });
    }
    else if (layer == "secondaryLayer") {
        secondaryLayer.forEach((feature) => {
            const geometry = feature.getGeometry();
            if (geometry) {
                processPoints(geometry, bounds.extend, bounds);
            }
        });
    }
    else console.log("Weird 001");
    map.fitBounds(bounds);
}

//function locWhat(loc, geometry) {
//    loc.lat += 0.01;
//}
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

function processPoints2(
    geometry: google.maps.LatLng | google.maps.Data.Geometry,
    arr: any,
    callback: any
) {
    if (geometry instanceof google.maps.LatLng) {
        callback(geometry,arr);
    } else if (geometry instanceof google.maps.Data.Point) {
        callback(geometry.get(),arr);
    } else {
        // @ts-ignore
        geometry.getArray().forEach((g) => {
            processPoints2(g,arr,callback);
        });
    }
}

async function loadGeoJSONFile(path: string, layer, postProcess) {
  let response = await fetch(path);
  let contents = await response.text();
  if (contents) {
    loadGeoJsonString(contents, layer, postProcess);
  }
}

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

function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    removeClassFromDropTarget(e);

    const files = (e.dataTransfer as DataTransfer).files;

    if (files.length) {
        // process file(s) being dropped
        // grab the file data from each file
        for (let i = 0, file; (file = files[i]); i++) {
            
            if (file.type == 'application/geo+json') {
                const reader = new FileReader();

                reader.onload = function (e) {
                    loadGeoJsonString(reader.result as string);
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

function separateLines(str) {
    // Split the string into an array of lines
    const lines = str.split(/\r?\n/);
    return lines;
}

function initialize() {
    const currentURL = window.location.href;
    if (currentURL.startsWith("http://localhost")) {
        debugMode = true;
        localMode = true;
    }
    window.addEventListener('beforeunload', function (event) {
        if (askToSave) {
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
export {};
