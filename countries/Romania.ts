import { markers, countryMenu, layerMenu } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';


export class Romania extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): Romania {
    return this.instance ? this.instance : (this.instance = new Romania());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/Romania/Counties.geojson');
    const newtop = new Option("Phone Codes", "Phone Codes");
    layerMenu.appendChild(newtop);
    layerMenu.onchange = () => {
      if (!newLayerReset(1)) return;
      loadMarkerLayer(countryMenu.value, layerMenu.value);
    };
  }

  public sandbox(): void { }
public auxBehaviour(): void {

  }
}

