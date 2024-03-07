/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

//import * as TxtOverlay from './txtOverlay.js'

let map: google.maps.Map;
var markers: google.maps.marker.AdvancedMarkerElement[] = [];
var fszlArray: number[] = []; // Parallel array with markers
let countryMenu, layerMenu: HTMLSelectElement;
let layerMin = 0;
let infoWindow; 
interface markerLoc {
    text: string;
    type: string;
    lat: number;
    lng: number;
    scale: number;
}

function createCountryChooser(map) {
  countryMenu = document.createElement('select');

  // Set CSS for the control.
  countryMenu.style.backgroundColor = '#fff';
  countryMenu.style.border = '2px solid #fff';
  countryMenu.style.borderRadius = '3px';
  countryMenu.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  countryMenu.style.color = 'rgb(25,25,25)';
  countryMenu.style.cursor = 'pointer';
  countryMenu.style.fontFamily = 'Roboto,Arial,sans-serif';
  countryMenu.style.fontSize = '16px';
  countryMenu.style.lineHeight = '38px';
  countryMenu.style.margin = '8px 0 22px';
  countryMenu.style.padding = '0 5px';
  countryMenu.style.textAlign = 'center';

  const top = new Option("Choose Country", "0");
  top.selected = true;
  top.disabled = true;
  countryMenu.appendChild(top);
  countryMenu.appendChild(new Option("Bulgaria", "Bulgaria"));
  countryMenu.appendChild(new Option("Chile", "Chile"));
    countryMenu.appendChild(new Option("France", "France"));
    countryMenu.appendChild(new Option("Jordan", "Jordan"));
  countryMenu.appendChild(new Option("Romania", "Romania"));
  countryMenu.appendChild(new Option("Sweden", "Sweden"));

  countryMenu.onchange = () => {
      console.log(countryMenu.value);
      removeAllFeatures();
      removeAllMarkers();
      for (var i = layerMenu.length - 1; i > 0; i--)
          layerMenu.remove(i);
      layerMenu.options[0].selected = true;
      if (countryMenu.value == "Bulgaria") {
          loadBoundaries('./Layers/Bulgaria/Provinces.geojson');
          const newtop = new Option("Phone Codes", "Phone Codes");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              loadMarkerLayer(countryMenu.value, layerMenu.value);
          };
      }
      if (countryMenu.value == "France") {
          loadBoundaries('./Layers/France/Level2.geojson');
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
                  loadBoundaries('./Layers/France/Level2.geojson');
                  loadMarkerLayer(countryMenu.value, layerMenu.value);
              }
          };
      }
      if (countryMenu.value == "Chile") {
          loadBoundaries('./Layers/Chile/Level1.geojson');
          const newtop = new Option("Phone Codes", "Phone Codes");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              loadMarkerLayer(countryMenu.value, layerMenu.value);
          };
      }
      if (countryMenu.value == "Jordan") {
          loadBoundaries('./Layers/Jordan/Level0.geojson');          
          const newtop = new Option("Misc Meta", "Misc Meta");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              loadMarkerLayer(countryMenu.value, layerMenu.value);
              layerMin = 0.1; // So images do not get too small
          };
      }
      if (countryMenu.value == "Romania") {
          loadBoundaries('./Layers/Romania/Counties.geojson');
          const newtop = new Option("Phone Codes", "Phone Codes");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              loadMarkerLayer(countryMenu.value, layerMenu.value);
          };
      }
      if (countryMenu.value == "Sweden") {
          loadBoundaries('./Layers/Sweden/Level1.geojson');
          const newtop = new Option("Bus Stop Signs", "Bus Stop Signs");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              loadMarkerLayer(countryMenu.value, layerMenu.value);
              layerMin = 0.1; // Images can get arbitrarily small
              //const img = document.createElement('img');
              //img.src = './Layers/Sweden/BusStopSigns/Norrbotten.jpg';
              //img.style.transform = getTransform(0.6, 5);
              //const marker = new google.maps.marker.AdvancedMarkerElement({
              //    map,
              //    position: { lat: 66.868003323504, lng: 20.102020566463448 },
              //    gmpDraggable: true,
              //    content: img,
              //    title: 'huh',                  
              //});
              //markers.push(marker);
          };
      }
  };

  return countryMenu;
}

function removeAllFeatures() {
    map.data.forEach(function (feature) {
        map.data.remove(feature);
    });
}

function removeAllMarkers() {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    fszlArray = [];
}

function createLayerChooser(map) {
    layerMenu = document.createElement('select');

    // Set CSS for the control.
    layerMenu.style.backgroundColor = '#fff';
    layerMenu.style.border = '2px solid #fff';
    layerMenu.style.borderRadius = '3px';
    layerMenu.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    layerMenu.style.color = 'rgb(25,25,25)';
    layerMenu.style.cursor = 'pointer';
    layerMenu.style.fontFamily = 'Roboto,Arial,sans-serif';
    layerMenu.style.fontSize = '16px';
    layerMenu.style.lineHeight = '38px';
    layerMenu.style.margin = '8px 0 22px';
    layerMenu.style.padding = '0 5px';
    layerMenu.style.textAlign = 'center';

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
    const path = './Layers/' + country + '/' + layer + '.json';
    const imagepath = './Layers/' + country + '/' + layer + ' Images/';
    console.log(path);
    console.log(imagepath);
    loadMarkers(path, imagepath);
}

function createSaveLocsControl(map) {
  const controlButton = document.createElement('button');

  // Set CSS for the control.
  controlButton.style.backgroundColor = '#fff';
  controlButton.style.border = '2px solid #fff';
  controlButton.style.borderRadius = '3px';
  controlButton.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  controlButton.style.color = 'rgb(25,25,25)';
  controlButton.style.cursor = 'pointer';
  controlButton.style.fontFamily = 'Roboto,Arial,sans-serif';
  controlButton.style.fontSize = '16px';
  controlButton.style.lineHeight = '38px';
  controlButton.style.margin = '8px 0 22px';
  controlButton.style.padding = '0 5px';
  controlButton.style.textAlign = 'center';

  controlButton.textContent = 'Save locs';
  controlButton.title = 'Click to save the location of the markers';
  controlButton.type = 'button';

  // Setup the click event listener
  controlButton.addEventListener('click', () => {
    let markerLocData: markerLoc[] = [];
      for (let i = 0; i < markers.length; i++)
    { 
        //console.log(marker.content.textContent + " " + marker.position.lat);
        //console.log(marker.content);
        //console.log(marker.content.className);
        //console.log(marker.content.title);
        //console.log(marker.content.style);
        //console.log(marker.content.style.transform);
        let text, type;
        if (markers[i].content instanceof HTMLImageElement) {
            text = markers[i].content.alt;
            type = "image";
        }
        else {
            text = markers[i].content.textContent;
            type = markers[i].content.className;
        }
        markerLocData.push({ text: text, type: type, lat: markers[i].position.lat, lng: markers[i].position.lng, fszl: fszlArray[i] });
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

  return controlButton;
}

function getTransform(fszl, isImage) {
    let zoom = map.getZoom() - fszl;
    if ((!isImage) && (zoom > 0)) zoom = 0; 
    let sc = Math.pow(2, zoom); // Math.cos(lat * Math.PI / 180);
    if (sc < layerMin) sc = 0.1;//  sc = factor; // fszl * factor;
    let transform = "scale(" + sc + "," + sc + ")";
    if (isImage) transform = 'translateY(50%) ' + transform;
    return transform;
}

function placeNewMarker(map, position, content = "00", imagepath, type = "area-code", fszl = map.getZoom()) {
    console.log("New marker " + markers.length);
    let zIndex = 0;
    if (content == "") zIndex = -1;
    
    var marker = new google.maps.marker.AdvancedMarkerElement({
        map: map,
        position: position,
        gmpDraggable: true,
        zIndex: zIndex,
    });
    setMarkerContent(marker, content, imagepath, type, fszl);
    marker.addListener('click', () => {
        if (type = "image") {
            infoWindow.close();
            const img = document.createElement('img');
            img.src = imagepath; 
            infoWindow.setContent(img);
            infoWindow.open(map, marker);
        }
        else {
            var result = prompt("Enter a value of comment for Marker.");
            if (result) {
                if (result == "delete") {
                    console.log(markers.length);
                    marker.setMap(null);
                    const index = markers.indexOf(marker);
                    if (index > -1) { // only splice array when item is found
                        markers.splice(index, 1); // 2nd parameter means remove one item only
                        fszlArray.splice(index, 1);
                    }
                    console.log(markers.length);
                }
                else if (result == "city") {
                    marker.content.className = "city-code";
                }
                else
                    setMarkerContent(marker, result, marker.content.src, marker.content.className, fszl);
            }
        }
        });
  //marker.addListener('dragend', (event) => {
        //const position = marker.position as google.maps.LatLng;
        //infoWindow.close();
        //infoWindow.setContent(`Pin dropped at: ${position.lat}, ${position.lng}`);
        //infoWindow.open(marker.map, marker);
    //});
    markers.push(marker);
    fszlArray.push(fszl);
}

function initMap(): void {
  
  map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
    center: new google.maps.LatLng(20, 40),
    zoom: 4,
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

  map.addListener('dblclick', function(e) {
      placeNewMarker(map, e.latLng);
  });

  map.data.addListener('dblclick',function(e){
    console.log(e);
    placeNewMarker(map, e.latLng);
    //google.maps.event.trigger(this.getMap(),'dblclick',e);
  });

    map.addListener('zoom_changed', function () {
        console.log(map.getZoom());
        for (let i = 0; i < markers.length; i++) {
            markers[i].content.style.transform = getTransform(fszlArray[i], markers[i].content instanceof HTMLImageElement);
            // if (markers[i].content instanceof google.maps.LatLng)
        }
    });

  infoWindow  = new google.maps.InfoWindow();
  // Create the Save Locs button.
  const saveLocsDiv = document.createElement('div');
  const saveLocs = createSaveLocsControl(map);
  saveLocsDiv.appendChild(saveLocs);
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(saveLocsDiv);

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
}

function setMarkerContent(marker, text, imagepath, type, fszl) {

    if (type == "image") {
        const img = document.createElement('img');
        img.src = imagepath; // './Layers/Sweden/BusStopSigns/Norrbotten.jpg';
        img.style.transform = getTransform(fszl, true);
        img.alt = text;
        marker.content = img;
        
    }
    else {
        const markerDiv = document.createElement('div');
        markerDiv.className = type;
        //let text = text;
        markerDiv.textContent = text.toString();
        marker.content = markerDiv;
    }
}

async function loadMarkers(path:string, imagepathdir:string): void {

  let response = await fetch(path);
  let markerLocData = await response.json();

    for (let markerLoc of markerLocData) {
        let position = { lat: markerLoc.lat, lng: markerLoc.lng };
        let text = markerLoc.text.toString();
        let imagepath = imagepathdir + text;
      placeNewMarker(map, position, text, imagepath, markerLoc.type, markerLoc.fszl);
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

function loadGeoJsonString(geoString: string) {
  try {
    const geojson = JSON.parse(geoString) as any;

    map.data.addGeoJson(geojson);
  } catch (e) {
    alert("Not a GeoJSON file!");
  }

  map.data.setStyle({
    fillOpacity: '0'
  });

    zoom(map);
}

/**
 * Update a map's viewport to fit each geometry in a dataset
 */
function zoom(map: google.maps.Map) {
  const bounds = new google.maps.LatLngBounds();

  map.data.forEach((feature) => {
      const geometry = feature.getGeometry();
      

    if (geometry) {
      processPoints(geometry, bounds.extend, bounds);
    }
  });
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
      let pos = { lat: geometry.get().lat(), lng: geometry.get().lng() };
      placeNewMarker(map, pos, ""); 
  } else {
    // @ts-ignore
    geometry.getArray().forEach((g) => {
      processPoints(g, callback, thisArg);
    });
  }
}

async function loadBoundaries(path: string) {
  let response = await fetch(path);
  let contents = await response.text();
  if (contents) {
    loadGeoJsonString(contents);
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
            }
            else if (file.type == 'image/jpeg') {
                
                // read the image...
                var reader = new FileReader();
                reader.onload = function (e) {
                    placeNewMarker(map, map.getCenter(), file.name, e.target.result, "image");
                    console.log(file);
                    
                }
                reader.readAsDataURL(file); 
                //console.log(e.target.);
            }
            else
                alert("Unsupported file format. Only geojson and jpg supported at the moment.");
        }
    } else {
        // process non-file (e.g. text or html) content being dropped
        // grab the plain text version of the data
        const plainText = (e.dataTransfer as DataTransfer).getData("text/plain");

        console.log(plainText);

        if (plainText) {
            loadGeoJsonString(plainText);
        }
    }

    // prevent drag event from bubbling further
    return false;
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
