/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

//import Popup from './popup.js'

let map: google.maps.Map;
let boundaryLayer, secondaryLayer, auxButton;
var markers: google.maps.marker.AdvancedMarkerElement[] = [];
let countryMenu, layerMenu: HTMLSelectElement;
let layerMin = 0;
let infoWindow;
let clickBehaviour = 0;
let showAreas = true;
let colourDigit = 1; // which digit is used for area code colouring
interface markerLoc {
    text: string;
    type: string;
    lat: number;
    lng: number;
    scale: number;
}

function showAllAreas() {
    loadGeoJSONFile('Layers/Mexico/' + "Phone Codes200" + '.geojson', "secondaryLayerClear");
    for (let i = 3; i <= 9; i++) {
        let layerName = "Phone Codes" + i + "00";
        loadGeoJSONFile('Layers/Mexico/' + layerName + '.geojson', "secondaryLayer");
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
  countryMenu.appendChild(new Option("France", "France"));
  countryMenu.appendChild(new Option("Jordan", "Jordan"));
  countryMenu.appendChild(new Option("Mexico", "Mexico"));
  countryMenu.appendChild(new Option("Romania", "Romania"));
    countryMenu.appendChild(new Option("Sweden", "Sweden"));
    countryMenu.appendChild(new Option("South Africa", "South Africa"));
    countryMenu.appendChild(new Option("USA", "USA"));

  countryMenu.onchange = () => {
      console.log(countryMenu.value);
      removeAllFeatures();
      removeAllMarkers();
      for (var i = layerMenu.length - 1; i > 0; i--)
          layerMenu.remove(i);
      layerMenu.options[0].selected = true;
      if (countryMenu.value == "Bulgaria") {
          hideAuxButton();
          loadGeoJSONFile('/Layers/Bulgaria/Provinces.geojson');
          const newtop = new Option("Phone Codes", "Phone Codes");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              loadMarkerLayer(countryMenu.value, layerMenu.value);
          };
      }
      if (countryMenu.value == "France") {
          hideAuxButton();
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
              //console.log("NEW " + layerMenu.value);
              if (layerMenu.value == "Clusters") {
                  removeAllFeatures();
                  removeAllMarkers();
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
                  removeAllFeatures();
                  removeAllMarkers();
                  loadMarkerLayer("France", "MajorRivers");
              }
              else if (layerMenu.value == "Smaller Rivers") {
                  removeAllFeatures();
                  removeAllMarkers();
                  loadMarkerLayer("France", "MinorRivers");
              }
              else {
                  removeAllFeatures();
                  removeAllMarkers();
                  loadGeoJSONFile('/Layers/France/Level2.geojson');
                  loadMarkerLayer(countryMenu.value, layerMenu.value);
              }
          };
      }
      if (countryMenu.value == "Chile") {
          hideAuxButton();
          loadGeoJSONFile('/Layers/Chile/Level1.geojson');
          const newtop = new Option("Phone Codes", "Phone Codes");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              loadMarkerLayer(countryMenu.value, layerMenu.value);
          };
      }
      if (countryMenu.value == "Jordan") {
          hideAuxButton();
          loadGeoJSONFile('/Layers/Jordan/Level0.geojson');          
          const newtop = new Option("Misc Meta", "Misc Meta");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
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
              removeAllMarkers();
              colourDigit = 0;
              boundaryLayer.setStyle({ strokeOpacity: '0.2', fillOpacity: '0' });    
              
              showAreas = true;
              if (layerMenu.value == "License Plates") {
                  hideAuxButton();
                  loadMarkerLayer(countryMenu.value, layerMenu.value);
              } 
              else if (layerMenu.value == "Phone Codesall") {
                  showAuxButton("Hide Area Boundaries");
                  //auxButton.textContent = "Hide Area Boundaries";
                  showAllAreas();
                  
                  for (let i = 2; i <= 9; i++) {
                      let layerName = "Phone Codes" + i + "00";
                      loadMarkerLayer(countryMenu.value, layerName);
                  }
                  zoom(map);
              }
              else {
                  showAuxButton("Hide Area Boundaries");
                  //auxButton.textContent = "Hide Area Boundaries";
                  colourDigit = 1;
                  loadMarkerLayer(countryMenu.value, layerMenu.value);
                  await loadGeoJSONFile('Layers/Mexico/' + layerMenu.value + '.geojson', "secondaryLayerClear");
                  zoom(map, "secondaryLayer");
              }
              
          };
      } if (countryMenu.value == "Romania") {
          hideAuxButton();
          loadGeoJSONFile('/Layers/Romania/Counties.geojson');
          const newtop = new Option("Phone Codes", "Phone Codes");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              loadMarkerLayer(countryMenu.value, layerMenu.value);
          };
      }
      if (countryMenu.value == "Sweden") {
          hideAuxButton();
          loadGeoJSONFile('/Layers/Sweden/Level1.geojson');
          const newtop = new Option("Bus Stop Signs", "Bus Stop Signs");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              loadMarkerLayer(countryMenu.value, layerMenu.value);
              layerMin = 0; // Images can get arbitrarily small
          };
      }
      if (countryMenu.value == "South Africa") {
          hideAuxButton();
          loadGeoJSONFile('/Layers/South Africa/Level1.geojson');
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
              removeAllMarkers();
              boundaryLayer.setStyle({ strokeOpacity: '0.1', fillOpacity: '0' });
              showAuxButton("Next group");
              //auxButton.textContent = "Next group";
              const styleOptions = {
                  strokeColor: 'black',
                  strokeOpacity: '1',
                  strokeWeight: '5'
              }
              const group = layerMenu.value.substring(0, 2).replace(/\s/g, '');
              clearSecondaryLayer();
              const geopath = 'Layers/South Africa/geojson/' + group + 'x.geojson';
              loadGeoJSONFile(geopath, "secondaryLayer", styleOptions);
              loadMarkerLayer("South Africa", "markers/" + group);
          };
      }
      if (countryMenu.value == "USA") {
          hideAuxButton();
          loadGeoJSONFile('/Layers/USA/States.geojson');
          const newtop = new Option("License Plates", "License Plates");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              loadMarkerLayer(countryMenu.value, layerMenu.value);
              layerMin = 0; // Images can get arbitrarily small
          };
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

function createClickControl(map) {
    const clickB = document.createElement('select');
    clickB.className = "buttons";

    const def = new Option("Click: Show/change info", "0");
    def.selected = true;
    clickB.appendChild(def);
    const incImage = new Option("Click: Increase image marker size", "1");
    clickB.appendChild(incImage);
    const redImage = new Option("Click: Reduce image marker size", "2");
    clickB.appendChild(redImage);
    const del = new Option("Click: Delete marker", "3");
    clickB.appendChild(del);
    const blue = new Option("Click: Swap brown/blue colour", "4");
    clickB.appendChild(blue);
    clickB.onchange = () => {
        clickBehaviour = clickB.value;
    };
    return clickB;
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
    console.log(path);
    console.log(imagepath);
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
        else if (countryMenu.value == "South Africa") {
            // Get the currently selected index
            const currentSelection = layerMenu.selectedIndex;
            if (currentSelection < layerMenu.options.length - 1) {
                layerMenu.selectedIndex = currentSelection + 1;
            }
            else layerMenu.selectedIndex = 1;
            const event = new Event("change");
            layerMenu.dispatchEvent(event);
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
    //buttons.push(auxButton);
}


//function setAuxButton(title) {
//    const buttons = map.controls[google.maps.ControlPosition.TOP_CENTER];
//    if (!title) {
//        if (buttons.length == 3) buttons.pop();
//    }
//    else {
//        //if (!auxButton)
//        auxButton = document.createElement('button');
//        auxButton.className = "buttons";

//        auxButton.textContent = title;
//        //auxButton.title = 'Click to remove the area code boundary curves';
//        auxButton.type = 'button';

//        // Setup the click event listener
//        auxButton.addEventListener('click', auxfunc);
//        if (buttons.length == 3) buttons.pop();
//        buttons.push(auxButton);
//    }
//}
function getTransform(fszl, isImage) {
    let sc = 1;
    if (fszl >= 0) {
        let zoom = map.getZoom() - fszl;
        if ((!isImage) && (zoom > 0)) zoom = 0;
        sc = Math.pow(2, zoom); // Math.cos(lat * Math.PI / 180);
        if (sc < layerMin) sc = 0.1;//  sc = factor; // fszl * factor;
    }
    let transform = "scale(" + sc + "," + sc + ")";
    if (isImage) transform = 'translateY(50%) ' + transform;
    return transform;
}

function placeNewMarker(map, position, content = "00", imagepath, type = "area-code", fszl = -1, draggable = true) {
    console.log("New marker " + markers.length);
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
        if (clickBehaviour == 0) {
            console.log(position);
            if (type == "image") {
                infoWindow.close();
                const img = document.createElement('img');
                img.src = imagepath;
                img.onload = function () {
                    // Once the image is loaded, get its dimensions
                    var width = this.naturalWidth;
                    var height = this.naturalHeight;
                    console.log(window.screen.height);
                    console.log(window.screen.width);
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
            else {
                var result = prompt("Enter new value for marker:");
                let thistype = marker.getAttribute("ggmmtype");
                if (result) setMarkerContent(marker, result, marker.content.src, marker.getAttribute("ggmmtype"), fszl);
            }
        } else if (clickBehaviour == 1) { 
            let fszl = Number(marker.getAttribute("fszl"));
            if (fszl == -1) console.log("Should not happen fszl=-1");
            else {
                fszl--;
                marker.setAttribute("fszl", fszl);
                marker.content.style.transform = getTransform(fszl, marker.content instanceof HTMLImageElement);
            }
        } else if (clickBehaviour == 2) {
            let fszl = Number(marker.getAttribute("fszl"));
            if (fszl == -1) console.log("Should not happen fszl=-1");
            else {
                fszl++;
                marker.setAttribute("fszl", fszl);
                marker.content.style.transform = getTransform(fszl, marker.content instanceof HTMLImageElement);
            }
        } else if (clickBehaviour == 3) {
            console.log(markers.length);
            marker.setMap(null);
            const index = markers.indexOf(marker);
            if (index > -1) { // only splice array when item is found
                markers.splice(index, 1); // 2nd parameter means remove one item only
            }
            console.log(markers.length);
        } else if (clickBehaviour == 4) {
            if (marker.content.className == "area-code")
                marker.content.className = "city-code";
            else if (marker.content.className == "city-code")
                marker.content.className = "area-code";
        }
    });
    markers.push(marker);
}

function initMap(): void {
  
  map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
    center: new google.maps.LatLng(0, 0),
    zoom: 2,
    mapId: 'DEMO_MAP_ID',
    zoomControl: false,
    scaleControl: true,
    streetViewControl: false,
    disableDoubleClickZoom: true,
    mapTypeControl: true,
    mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        mapTypeIds: ["roadmap", "terrain"],
    },
  });

    boundaryLayer = new google.maps.Data();
    boundaryLayer.setMap(map);
    secondaryLayer = new google.maps.Data();
    secondaryLayer.setMap(map);

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
        //console.log(map.getZoom());
        for (let i = 0; i < markers.length; i++) {
            let fszl = Number(markers[i].getAttribute("fszl"));
            markers[i].content.style.transform = getTransform(fszl, markers[i].content instanceof HTMLImageElement);
            // if (markers[i].content instanceof google.maps.LatLng)
        }
    });

    const maxw = Math.floor(window.screen.width * 0.9);
    infoWindow = new google.maps.InfoWindow({
        maxWidth: maxw // Set a maximum width for the InfoWindow
        // maxHeight: 1800 // No such option
    });

  // Create the Save Locs button.
  const saveLocsDiv = document.createElement('div');
  const saveLocs = createSaveLocsControl(map);
  saveLocsDiv.appendChild(saveLocs);
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(saveLocsDiv);

    // Create the Click Behaviour button.
    const clickDiv = document.createElement('div');
    const clickButton = createClickControl(map);
    clickDiv.appendChild(clickButton);
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(clickDiv);

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
    const auxDiv = document.createElement('div');
    auxButton = createAuxButton();
    auxDiv.appendChild(auxButton);
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
            img.style.transform = getTransform(fszl, true);
            img.alt = text;
            //img.setAttribute("fszl", fszl.toString());
            marker.setAttribute("fszl", fszl.toString());
            marker.content = img;
        }; 
    }
    else { // We are dealing with a text marker
        const markerDiv = document.createElement('div');
        markerDiv.className = "area-code";
        if (type == "city-code") {
            markerDiv.style.setProperty('--marker-color', '#4285F4');
        }
        else if (type == "digit2") {
            const colors = ["#000000", "#CD66FF", "#FF6599", "#FF0000", "#FF8E00", "#9B870C", "#008E00", "#00C0C0", "#400098", "#8E008E"];
            let ch = text[colourDigit];
            if (!isNaN(ch)) {
                //console.log(ch);
                markerDiv.style.setProperty('--marker-color', colors[ch]);
            }
        }
        markerDiv.textContent = text.toString();
        marker.content = markerDiv;
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

function loadGeoJsonString(geoString: string, layer = "boundaryLayer", options) {
  try {
    const geojson = JSON.parse(geoString) as any;
      if (layer == "boundaryLayer") {
          boundaryLayer.addGeoJson(geojson);
          if (options) boundaryLayer.setStyle(options);
          else boundaryLayer.setStyle({
              fillOpacity: '0',
              strokeOpacity: '1'
          });
          zoom(map);
      }
      else if (layer.startsWith("secondaryLayer")) {
          if (layer == "secondaryLayerClear") clearSecondaryLayer();
          secondaryLayer.addGeoJson(geojson);
          if (options) secondaryLayer.setStyle(options);
          else secondaryLayer.setStyle({
              fillOpacity: '0',
              strokeOpacity: '1',
              strokeColor: 'black'
          });
      }
      else console.log("Unknown layer");
  } catch (e) {
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
            console.log("sdfg");
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
      //console.log("poi " + geometry.get().lat());
      //let pos = { lat: geometry.get().lat(), lng: geometry.get().lng() };
      //placeNewMarker(map, pos, ""); // Why was this here?
  } else {
    // @ts-ignore
    geometry.getArray().forEach((g) => {
      processPoints(g, callback, thisArg);
    });
  }
}

async function loadGeoJSONFile(path: string, layer, options) {
  let response = await fetch(path);
  let contents = await response.text();
  if (contents) {
    loadGeoJsonString(contents, layer, options);
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
            else if ((file.type == 'image/jpeg') || (file.type == 'image/svg+xml')) {
                
                // read the image...
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
    initMap();
    initEvents();
}

declare global {
  interface Window {
    initialize: () => void;
  }
}

window.initialize = initialize;
export {};
