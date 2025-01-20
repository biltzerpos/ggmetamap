import { markers, countryMenu, layerMenu, flags, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { markerInMiddle } from '../postprocess';
import { Country } from './Country';
import { Layer } from './Layer';
import { partial } from '../utilities';

export class Thailand extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Thailand/Level2.geojson';
    this.layers.push(new Districts());
  }

  public static override getInstance(): Thailand {
    return this.instance ? this.instance : (this.instance = new Thailand());
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/Thailand/Level2.geojson', "boundaryLayer", partial(markerInMiddle, "NAME_2", true));
  }

}

class Districts extends Layer {

  public constructor() {
    super();
    this.displayName = "Districts";
  }

  public show(): void {
      loadMarkerLayer(countryMenu.value, layerMenu.value);
  }

  public sandbox(): void { }
  public auxBehaviour(): void {}
}
