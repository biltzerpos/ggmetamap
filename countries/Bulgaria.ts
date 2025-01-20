import { countryMenu, layerMenu } from '../globals';
import { loadMarkerLayer } from '../markerFacilities';
import { Country } from './Country';
import { Layer } from './Layer';

export class Bulgaria extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Bulgaria/Provinces.geojson';
    this.layers.push(new PhoneCodes());
    // Do the above for all layers
  }

  public static override getInstance(): Bulgaria {
    return this.instance ? this.instance : (this.instance = new Bulgaria());
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

