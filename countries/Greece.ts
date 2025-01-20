import { markers, countryMenu, layerMenu, flags, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { markerInMiddle } from '../postprocess';
import { Country } from './Country';
import { Layer } from './Layer';
import { partial } from '../utilities';

export class Greece extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Greece/Level3.geojson';
    this.layers.push(new Municipalities());
  }

  public static override getInstance(): Greece {
    return this.instance ? this.instance : (this.instance = new Greece());
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/Greece/Level3.geojson', "boundaryLayer", partial(markerInMiddle, "NL_NAME_3", true));
  }

}

class Municipalities extends Layer {

  public constructor() {
    super();
    this.displayName = "Municipalities";
  }

  public show(): void {
      loadMarkerLayer(countryMenu.value, layerMenu.value);
  }

  public sandbox(): void { }
  public auxBehaviour(): void {}
}
