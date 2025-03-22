import { countryMenu, getGlobals, layerMenu, auxButton, flags, overlays } from '../globals';
import { getConcaveGeoJSON, clearBoundaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { showAuxButton, showInfoButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { markerInMiddle, thickBlue } from '../postprocess';
import { Country } from './Country';
import { Layer } from './Layer';
import { partial, loadZipLayer, colog, createButtonContainer } from '../utilities';

export class Hungary extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Hungary/Level6.geojson';
    this.layers.push(new BusStopLabels());
    if (flags.localMode) this.layers.push(new PhoneCodes());
    if (flags.localMode) this.layers.push(new PostalCodes());
  }

  public static override getInstance(): Hungary {
    return this.instance ? this.instance : (this.instance = new Hungary());
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/Hungary/Level2.geojson', "boundaryLayer", partial(markerInMiddle, "NAME_2", true));
  }
}

class BusStopLabels extends Layer {

  public constructor() {
    super();
    this.displayName = "Bus Stop Labels";
    this.mainGeoJSONopacity = 0;
  }

  private showBorders: boolean = false;

  public show(): void {
    flags.displayPopups = false;
    showAuxButton("Show County Borders", this.auxBehaviour);
    //loadMarkerLayer(countryMenu.value, layerMenu.value);
    loadZipLayer('/Layers/Hungary/Bus Stop Labels.zip');
    showInfoButton("Click for more info", this.showInfo);
  }

  private showInfo() {
    getGlobals().infoWindow.setOptions({ maxWidth: 340 });
    getGlobals().infoWindow.setContent(`
      <p>The bus stop label shown below can be found all over Hungary.
      In Veszprém, the town name in the yellow section will be in lower case.</p>
      <img src="/Layers/Hungary/info.jpeg" alt="Standard bus stop label" width="309">
      `);
    const cen = getGlobals().map.getCenter();
    if (cen) getGlobals().infoWindow.setPosition({ lat: cen.lat(), lng: cen.lng() });
    getGlobals().infoWindow.open(getGlobals().map);
  }

  public sandbox(): void { }

  public auxBehaviour(): void {
    this.showBorders = !this.showBorders;
    if (this.showBorders) {
      auxButton.textContent = "Hide County Borders";
      loadGeoJSONFile('/Layers/Hungary/Level6.geojson', "secondaryLayer", thickBlue);
    }
    else {
      getGlobals().secondaryLayer.forEach(function (feature) {
        if (feature.getProperty("ggmmLayer") == "thickBlue")
          getGlobals().secondaryLayer.remove(feature);
      });
      auxButton.textContent = "Show County Borders";
    }
  }
}

class PhoneCodes extends Layer {

  public constructor() {
    super();
    this.displayName = "Phone Codes";
    this.mainGeoJSONopacity = 0;
  }

  private showBorders: boolean = false;
  
  public show(): void {
    //loadMarkerLayer(countryMenu.value, layerMenu.value);
    const imageBounds = {
      north: 48.61563670541542703,
      south: 45.7139515298809492,
      east: 23.2623794921399305524,
      west: 15.63464657727430525,
    };

    const overlay = new google.maps.GroundOverlay(
      "/Layers/Hungary/PhoneCodes.png",
      imageBounds,
    );
    overlay.setMap(getGlobals().map);
    overlays.push(overlay);
    showAuxButton("Show County Borders", this.auxBehaviour);
  }

  public sandbox(): void { }
  public auxBehaviour(): void {
    this.showBorders = !this.showBorders;
    if (this.showBorders) {
      auxButton.textContent = "Hide County Borders";
      loadGeoJSONFile('/Layers/Hungary/Level6.geojson', "secondaryLayer", thickBlue);
    }
    else {
      getGlobals().secondaryLayer.forEach(function (feature) {
        if (feature.getProperty("ggmmLayer") == "thickBlue")
          getGlobals().secondaryLayer.remove(feature);
      });
      auxButton.textContent = "Show County Borders";
    }
  }
}

class PostalCodes extends Layer {

  public constructor() {
    super();
    this.displayName = "Postal Codes";
    this.mainGeoJSONopacity = 0;
  }

  private showBorders: boolean = false;
  
  public show(): void {
    //loadMarkerLayer(countryMenu.value, layerMenu.value);
    this.sandbox();
    //showAuxButton("Show County Borders", this.auxBehaviour);
  }

  private async loadLatLngArray(name: string): Promise<[number, number][]> {
    let latLngArray: [number, number][] = [];
    try {
      
      // Fetch the JSON file from the server (e.g., from 'public/latlng.json')
      const response = await fetch(name);
  
      // Check if the response is ok (status code 200-299)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
  
      // Parse the JSON data
      latLngArray = await response.json();
  
      // Log the array
      console.log(latLngArray);
      return latLngArray;
    } catch (error) {
      console.error('Error loading JSON:', error);
    }
    return latLngArray;
  }
  
  // Call the function to load the data
  
  
  public async sandbox(): Promise<void> {
    showAuxButton("Show County Borders", this.auxBehaviour);
    let a: [number, number][] = await this.loadLatLngArray('/Layers/Hungary/PostalCodeData/pc71.json');
    let gj = getConcaveGeoJSON(a);
    colog(gj);
    if (gj) loadGeoJsonString(gj, "secondaryLayer", null);
   }

  public auxBehaviour(): void {
    this.showBorders = !this.showBorders;
    if (this.showBorders) {
      auxButton.textContent = "Hide County Borders";
      loadGeoJSONFile('/Layers/Hungary/Level6.geojson', "secondaryLayer", thickBlue);
    }
    else {
      getGlobals().secondaryLayer.forEach(function (feature) {
        if (feature.getProperty("ggmmLayer") == "thickBlue")
          getGlobals().secondaryLayer.remove(feature);
      });
      auxButton.textContent = "Show County Borders";
    }
  }
}
