import { markers, countryMenu, layerMenu, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';


export class USA extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): USA {
    return this.instance ? this.instance : (this.instance = new USA());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/USA/States.geojson');
    const newtop = new Option("License Plates", "License Plates");
    layerMenu.appendChild(newtop);
    layerMenu.onchange = () => {
      if (!newLayerReset()) return;
      loadMarkerLayer(countryMenu.value, layerMenu.value);
      settings.layerMin = 0; // Images can get arbitrarily small
    };
  }

  public sandbox(): void { }
public auxBehaviour(): void {

  }
}

