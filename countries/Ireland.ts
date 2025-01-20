import { markers, countryMenu, layerMenu, settings, getGlobals, overlays } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';
import { Layer } from './Layer';

export class Ireland extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Ireland/Level1.geojson';
    this.layers.push(new PhoneCodes());
    this.layers.push(new Flags());
    settings.popupPropertyName = "NAME_1";
  }

  public static override getInstance(): Ireland {
    return this.instance ? this.instance : (this.instance = new Ireland());
  }

  public sandbox(): void { }
}

class PhoneCodes extends Layer {

  public constructor() {
    super();
    this.displayName = "Phone Codes";
    this.mainGeoJSONopacity = 0;
  }

  public show(): void {
    loadMarkerLayer(countryMenu.value, layerMenu.value);
    const imageBounds = {
      north: 55.39670541542703,
      south: 51.39515298809492,
      east: -5.794921399305524,
      west: -10.724657727430525,
    };

    const overlay = new google.maps.GroundOverlay(
      "/Layers/Ireland/Codes.png",
      imageBounds,
    );
    overlay.setMap(getGlobals().map);
    overlays.push(overlay);
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}

class Flags extends Layer {

  public constructor() {
    super();
    this.displayName = "Flags";
  }

  public show(): void {
    loadMarkerLayer(countryMenu.value, layerMenu.value);
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}


