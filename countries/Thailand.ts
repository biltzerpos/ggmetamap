import { markers, countryMenu, layerMenu, flags, auxButton } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { markerInMiddle, thickBlue } from '../postprocess';
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

  private showBorders: boolean = false;

  public show(): void {
    flags.displayPopups = false;
    showAuxButton("Show Province borders", this.auxBehaviour);
    loadMarkerLayer(countryMenu.value, layerMenu.value);
  }

  public sandbox(): void { }

  public auxBehaviour(): void {
    this.showBorders = !this.showBorders;
    if (this.showBorders) {
      auxButton.textContent = "Hide Province Borders";
      loadGeoJSONFile('/Layers/Thailand/Level1.geojson', "secondaryLayer", thickBlue);
    }
    else {
      clearSecondaryLayer();
      auxButton.textContent = "Show Province Borders";
    }
  }
}

