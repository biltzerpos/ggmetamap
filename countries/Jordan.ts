import { markers, countryMenu, layerMenu, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';


export class Jordan extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): Jordan {
    return this.instance ? this.instance : (this.instance = new Jordan());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/Jordan/Level0.geojson');
    const newtop = new Option("Misc Meta", "Misc Meta");
    layerMenu.appendChild(newtop);
    layerMenu.onchange = () => {
      if (!newLayerReset()) return;
      loadMarkerLayer(countryMenu.value, layerMenu.value);
      settings.layerMin = 0.1; // So images do not get too small
    };
  }

  public sandbox(): void { }
}

