import { markers, countryMenu, layerMenu, settings, getGlobals, overlays } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';


export class Ireland extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): Ireland {
    return this.instance ? this.instance : (this.instance = new Ireland());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/Ireland/Level1.geojson');
    settings.popupPropertyName = "NAME_1";
    layerMenu.appendChild(new Option("Phone Codes", "Phone Codes"));
    layerMenu.appendChild(new Option("Flags", "Flags"));
    layerMenu.onchange = () => {
      if (!newLayerReset(0)) return;

      loadMarkerLayer(countryMenu.value, layerMenu.value);

      if (layerMenu.value == "Phone Codes") {
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

      //layerMin = 0; // Images can get arbitrarily small
    };
  }

  public sandbox(): void { }
public auxBehaviour(): void {

  }
}


