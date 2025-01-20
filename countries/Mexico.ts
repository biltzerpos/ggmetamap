import { markers, countryMenu, layerMenu, auxButton, flags, settings, getGlobals } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';
import { Layer } from './Layer';
import { colog } from '../utilities.js';

function showAllAreas() {
  loadGeoJSONFile('Layers/Mexico/' + "Phone Codes200" + '.geojson', "secondaryLayerClear");
  for (let i = 3; i <= 9; i++) {
    let layerName = "Phone Codes" + i + "00";
    loadGeoJSONFile('Layers/Mexico/' + layerName + '.geojson', "secondaryLayer");
  }
}

export class Mexico extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Mexico/States.geojson';
    this.layers.push(new LicensePlates());
    this.layers.push(new PhoneCodes("200"));
    this.layers.push(new PhoneCodes("300"));
    this.layers.push(new PhoneCodes("400"));
    this.layers.push(new PhoneCodes("500"));
    this.layers.push(new PhoneCodes("600"));
    this.layers.push(new PhoneCodes("700"));
    this.layers.push(new PhoneCodes("800"));
    this.layers.push(new PhoneCodes("900"));
    this.layers.push(new PhoneCodes("all"));
  }

  public static override getInstance(): Mexico {
    return this.instance ? this.instance : (this.instance = new Mexico());
  }

  public sandbox(): void { }

}

class LicensePlates extends Layer {

  public constructor() {
    super();
    this.displayName = "License Plates";
  }

  public show(): void {
    //settings.layerMin = 0.1; // So images do not get too small
    loadMarkerLayer(countryMenu.value, layerMenu.value);
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}

class PhoneCodes extends Layer {

  private area: string;

  public constructor(area: string) {
    super();
    this.mainGeoJSONopacity = 0.1;
    flags.showAreas = true;
    this.displayName = "Phone Codes (" + area + ")";
    this.area = area;
  }

  public async show(): Promise<void> {
    if (this.area === "all") {
      settings.colourDigit = 0;
      showAuxButton("Hide Area Boundaries", this.auxBehaviour.bind(this));
      showAllAreas();
      for (let i = 2; i <= 9; i++) {
        const layerName = "Phone Codes" + i + "00";
        loadMarkerLayer(countryMenu.value, layerName);
      }
      zoom(getGlobals().map);
    } else {
      settings.colourDigit = 1;
      showAuxButton("Hide Area Boundaries", this.auxBehaviour.bind(this));
      const layerName = "Phone Codes" + this.area;
      loadMarkerLayer(countryMenu.value, layerName);
      await loadGeoJSONFile('Layers/Mexico/' + layerName + '.geojson', "secondaryLayerClear");
      zoom(getGlobals().map, "secondaryLayer");
    }
  }

  public sandbox(): void { }
  
  public auxBehaviour(): void {
    flags.showAreas = !flags.showAreas;
    if (flags.showAreas) {
      auxButton.textContent = "Hide Area Boundaries";
      if (this.area === "all") showAllAreas();
      else {
        const layerName = "Phone Codes" + this.area;
        loadGeoJSONFile('Layers/Mexico/' + layerName + '.geojson', "secondaryLayerClear");
      }
    }
    else {
      clearSecondaryLayer();
      auxButton.textContent = "Show Area Boundaries";
    }
  }

}