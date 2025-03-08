import { markers, countryMenu, layerMenu, auxButton, flags, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { showAuxButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { markerInMiddle, thickBlue } from '../postprocess';
import { Country } from './Country';
import { Layer } from './Layer';
import { partial } from '../utilities';

export class Indonesia extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Indonesia/Level2.geojson';
    this.layers.push(new Kabupaten());
    settings.popupPropertyName = "NAME_2";
  }

  public static override getInstance(): Indonesia {
    return this.instance ? this.instance : (this.instance = new Indonesia());
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/Indonesia/Level2.geojson', "boundaryLayer", partial(markerInMiddle, "NAME_2", true));
  }
}

class Kabupaten extends Layer {

  public constructor() {
    super();
    this.displayName = "Kabupaten";
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
      loadGeoJSONFile('/Layers/Indonesia/Level1.geojson', "secondaryLayer", thickBlue);
    }
    else {
      clearSecondaryLayer();
      auxButton.textContent = "Show Province Borders";
    }
  }
}
