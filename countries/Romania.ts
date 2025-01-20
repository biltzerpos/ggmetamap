import { markers, countryMenu, layerMenu } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';
import { Layer } from './Layer';


export class Romania extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Romania/Counties.geojson';
    this.layers.push(new PhoneCodes());
  }

  public static override getInstance(): Romania {
    return this.instance ? this.instance : (this.instance = new Romania());
  }

  public sandbox(): void { }

}

class PhoneCodes extends Layer {

  public constructor() {
    super();
    this.displayName = "Phone Codes";
  }

  public show(): void {
      loadMarkerLayer(countryMenu.value, layerMenu.value);
  }

  public sandbox(): void { }
  public auxBehaviour(): void {}
}

