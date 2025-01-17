import { markers, countryMenu, layerMenu, flags, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';


export class Sweden extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): Sweden {
    return this.instance ? this.instance : (this.instance = new Sweden());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/Sweden/Level1.geojson');
    const newtop = new Option("Bus Stop Signs", "Bus Stop Signs");
    layerMenu.appendChild(newtop);
    layerMenu.onchange = () => {
      if (!newLayerReset(1)) return;
      flags.displayPopups = false;
      loadMarkerLayer(countryMenu.value, layerMenu.value);
      settings.layerMin = 0; // Images can get arbitrarily small
    };
  }

  public sandbox(): void { }
public auxBehaviour(): void {

  }
}

