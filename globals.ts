let boundaryLayer: google.maps.Data;
let secondaryLayer: google.maps.Data;
let map: google.maps.Map;
let infoWindow: google.maps.InfoWindow;
export let markers: google.maps.marker.AdvancedMarkerElement[] = [];
export let overlays: google.maps.GroundOverlay[] = [];
export let countryMenu: HTMLSelectElement = document.createElement('select');
export let layerMenu: HTMLSelectElement = document.createElement('select');
export let auxButton: HTMLButtonElement = document.createElement('button');
export const flags = {
    editMode: false, 
    debugMode: false,
    localMode: false,
    terrainMode: false,
    coverageMode: false,
    askToSave: false,
    displayPopups: true,
    showAreas: true,
    showBorders: false
};
export const settings = {
    layerMin: 0,
    colourDigit: 1,
    popupPropertyName: "Not yet defined"
};

export const colors = ["#000000", "#CD66FF", "#FF6599", "#FF0000", "#FF8E00", "#9B870C", "#008E00", "#00C0C0", "#400098", "#8E008E"];



// globals.ts

let libraryLoaded = false;

// Asynchronous function to load the library and initialize globals
export async function initializeGlobals() {
  // Dynamically import the library
  //const { someLibrary } = await import('some-library');
  //@ts-ignore
  const { Map } = await google.maps.importLibrary("maps");
  // Initialize the global variable with the library
  map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
    center: new google.maps.LatLng(0, 0),
    zoom: 2,
    mapId: 'DEMO_MAP_ID',
    zoomControl: false,
    scaleControl: true,
    streetViewControl: true,
    disableDoubleClickZoom: true,
    mapTypeControl: false,
    // mapTypeControlOptions: {
    //     style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
    //     mapTypeIds: ["roadmap", "terrain"],
    // },
});
  //someGlobal = new someLibrary.SomeClass();
  boundaryLayer = new google.maps.Data();
  secondaryLayer = new google.maps.Data();
  const maxw = Math.floor(window.screen.width * 0.9);
    infoWindow = new google.maps.InfoWindow({
        maxWidth: maxw // Set a maximum width for the InfoWindow
        // maxHeight: 1800 // No such option
    });
  libraryLoaded = true;

  console.log('Library loaded and globals initialized!');
}

// Export the globals with a getter method to ensure they are accessed only after initialization
export function getGlobals() {
  if (!libraryLoaded) {
    throw new Error('Globals are not initialized yet!');
  }
  return {
    map, boundaryLayer, secondaryLayer, infoWindow
  };
}