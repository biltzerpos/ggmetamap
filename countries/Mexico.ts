import { markers, countryMenu, layerMenu, auxButton, flags, settings, getGlobals } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';

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
  }

  public static override getInstance(): Mexico {
    return this.instance ? this.instance : (this.instance = new Mexico());
  }

  public show(): void {
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
      settings.colourDigit = 0;
      flags.showAreas = true;
      if (layerMenu.value == "License Plates") {
        loadMarkerLayer(countryMenu.value, layerMenu.value);
      }
      else if (layerMenu.value == "Phone Codesall") {
        showAuxButton("Hide Area Boundaries", this.auxBehaviour);
        showAllAreas();
        for (let i = 2; i <= 9; i++) {
          let layerName = "Phone Codes" + i + "00";
          loadMarkerLayer(countryMenu.value, layerName);
        }
        zoom(getGlobals().map);
      }
      else {
        showAuxButton("Hide Area Boundaries", this.auxBehaviour);
        settings.colourDigit = 1;
        loadMarkerLayer(countryMenu.value, layerMenu.value);
        await loadGeoJSONFile('Layers/Mexico/' + layerMenu.value + '.geojson', "secondaryLayerClear");
        zoom(getGlobals().map, "secondaryLayer");
      }
    };
  }

  public sandbox(): void { }

  public auxBehaviour(): void {
    flags.showAreas = !flags.showAreas;
    if (flags.showAreas) {
      auxButton.textContent = "Hide Area Boundaries";
      if (layerMenu.value == "Phone Codesall") showAllAreas();
      else loadGeoJSONFile('Layers/Mexico/' + layerMenu.value + '.geojson', "secondaryLayerClear");
    }
    else {
      clearSecondaryLayer();
      auxButton.textContent = "Show Area Boundaries";
    }
  }

}

