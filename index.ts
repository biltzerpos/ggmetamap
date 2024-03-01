/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

//import * as TxtOverlay from './txtOverlay.js'

let map: google.maps.Map;
var markers: google.maps.marker.AdvancedMarkerElement[] = [];
let countryMenu, layerMenu: HTMLSelectElement;
interface markerLoc {
  text: string;
  type: string;
  lat: number;
  lng: number;
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
  countryMenu.appendChild(new Option("Romania", "Romania"));
  countryMenu.onchange = () => {
      console.log(countryMenu.value);
      removeAllFeatures();
      removeAllMarkers();
      for (var i = layerMenu.length - 1; i > 0; i--)
          layerMenu.remove(i);
      layerMenu.options[0].selected = true;
      if (countryMenu.value == "Bulgaria") {
          loadBoundaries('Layers/Bulgaria/Provinces.geojson');
          const newtop = new Option("Phone Codes", "Phone Codes");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              loadMarkerLayer(countryMenu.value, layerMenu.value);
          };
      }
      if (countryMenu.value == "France") {
          loadBoundaries('Layers/France/Level2.geojson');
          const newtop = new Option("Department Names", "NamesLevel2");
          layerMenu.appendChild(newtop);
          const clusters = new Option("Placename Clusters", "Clusters");
          layerMenu.appendChild(clusters);
          layerMenu.onchange = () => {
              //console.log("NEW " + layerMenu.value);
              if (layerMenu.value == "Clusters") {
                  removeAllFeatures();
                  removeAllMarkers();
                  loadBoundaries("Layers/France/Brie.geojson");
              }
              else {
                  removeAllFeatures();
                  loadBoundaries('Layers/France/Level2.geojson');
                  loadMarkerLayer(countryMenu.value, layerMenu.value);
              }
          };
      }
      if (countryMenu.value == "Chile") {
          loadBoundaries('Layers/Chile/Level1.geojson');
          const newtop = new Option("Phone Codes", "Phone Codes");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              loadMarkerLayer(countryMenu.value, layerMenu.value);
          };
      }
      if (countryMenu.value == "Romania") {
          loadBoundaries('Layers/Romania/Counties.geojson');
          const newtop = new Option("Phone Codes", "Phone Codes");
          layerMenu.appendChild(newtop);
          layerMenu.onchange = () => {
              loadMarkerLayer(countryMenu.value, layerMenu.value);
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
    const path = 'Layers/' + country + '/' + layer + '.json';
    console.log(path);
    loadMarkers(path);
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
    for (var marker of markers)
    { 
      console.log(marker.content.textContent + " " + marker.position.lat);
      markerLocData.push({text:marker.content.textContent, type:marker.content.className, lat:marker.position.lat, lng: marker.position.lng})
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

function placeNewMarker(map, position, content = "00", type = "area-code") {
            console.log("START " + markers.length);
  const infoWindow = new google.maps.InfoWindow();
    var marker = new google.maps.marker.AdvancedMarkerElement({
        map: map,
        position: position,
        gmpDraggable: true,
    });
    setMarkerContent(marker, content, type);
    marker.addListener('click', function() {
      var result = prompt("Enter a value of comment for Marker.");
      if (result) {
        if (result == "delete") {
            console.log(markers.length);
            marker.setMap(null);
            const index = markers.indexOf(marker);
            if (index > -1) { // only splice array when item is found
              markers.splice(index, 1); // 2nd parameter means remove one item only
            }      
            console.log(markers.length);
          }
        else if (result == "city") {
           marker.content.className = "city-code";
        }
        else
          setMarkerContent(marker, result, marker.content.className);
      }
    });
  //marker.addListener('dragend', (event) => {
        //const position = marker.position as google.maps.LatLng;
        //infoWindow.close();
        //infoWindow.setContent(`Pin dropped at: ${position.lat}, ${position.lng}`);
        //infoWindow.open(marker.map, marker);
    //});
  markers.push(marker);
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

function setMarkerContent(marker, content, type) {

  const phoneCode = document.createElement('div');
  phoneCode.className = type;
  let code = content;
  phoneCode.textContent = code.toString();
  marker.content = phoneCode;
}

async function loadMarkers(path:string): void {

  let response = await fetch(path);
  let markerLocData = await response.json();

  for (let markerLoc of markerLocData) {
    let position = { lat: markerLoc.lat, lng: markerLoc.lng };
    placeNewMarker(map, position, markerLoc.text.toString(), markerLoc.type);
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

function initialize() {
    initMap();
    //var latlng = new google.maps.LatLng(37.9069, -122.0792);
    //const customTxt = "<div>Blah blah sdfsddddddddddddddd ddddddddddddddddddddd<ul><li>Blah 1<li>blah 2 </ul></div>"
    //txt = new TxtOverlay(latlng, customTxt, "customBox", map);
  //loadBoundaries();
  //loadMarkers();
}

declare global {
  interface Window {
    initialize: () => void;
  }
}

window.initialize = initialize;
export {};
