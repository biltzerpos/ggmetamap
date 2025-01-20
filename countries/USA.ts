import { markers, countryMenu, layerMenu, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';
import { Layer } from './Layer';



export class USA extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/USA/States.geojson';
    this.layers.push(new LicensePlates());
  }

  public static override getInstance(): USA {
    return this.instance ? this.instance : (this.instance = new USA());
  }

  public sandbox(): void { }

}

class LicensePlates extends Layer {

  public constructor() {
    super();
    this.displayName = "License Plates";
    this.mainGeoJSONopacity = 0.1;
  }

  public show(): void {
    settings.layerMin = 0; // Images can get arbitrarily small
    loadMarkerLayer(countryMenu.value, layerMenu.value);
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}