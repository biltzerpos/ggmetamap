import { countryMenu, layerMenu } from '../globals';
import { loadMarkerLayer } from '../markerFacilities';
import { Country } from './Country';
import { Layer } from './Layer';

export class Chile extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Chile/Level1.geojson';
    this.layers.push(new PhoneCodes());
  }

  public static override getInstance(): Chile {
    return this.instance ? this.instance : (this.instance = new Chile());
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

