import { markers, countryMenu, layerMenu, flags, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';
import { Layer } from './Layer';



export class Sweden extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Sweden/Level1.geojson';
    this.layers.push(new BusStopSigns());
  }

  public static override getInstance(): Sweden {
    return this.instance ? this.instance : (this.instance = new Sweden());
  }

  public sandbox(): void { }

}

class BusStopSigns extends Layer {

  public constructor() {
    super();
    this.displayName = "Bus Stop Signs";
  }

  public show(): void {
    flags.displayPopups = false;
    settings.layerMin = 0; // Images can get arbitrarily small
    loadMarkerLayer(countryMenu.value, layerMenu.value);
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}
