import { markers, countryMenu, layerMenu, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';
import { Layer } from './Layer';


export class Jordan extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Jordan/Level0.geojson';
    this.layers.push(new MiscMeta());
  }

  public static override getInstance(): Jordan {
    return this.instance ? this.instance : (this.instance = new Jordan());
  }

  public sandbox(): void { }
}

class MiscMeta extends Layer {

  public constructor() {
    super();
    this.displayName = "Misc Meta";
  }

  public show(): void {
    settings.layerMin = 0.1; // So images do not get too small
    loadMarkerLayer(countryMenu.value, layerMenu.value);
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}
