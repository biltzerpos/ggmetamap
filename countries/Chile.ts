import { markers, countryMenu, layerMenu } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';

export class Chile extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): Chile {
    return this.instance ? this.instance : (this.instance = new Chile());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/Chile/Level1.geojson');
    const newtop = new Option("Phone Codes", "Phone Codes");
    layerMenu.appendChild(newtop);
    layerMenu.onchange = () => {
      if (!newLayerReset(1)) return;
      loadMarkerLayer(countryMenu.value, layerMenu.value);
    };
  }

  public sandbox(): void { }
}

