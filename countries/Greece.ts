import { markers, countryMenu, layerMenu, flags, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { markerInMiddle } from '../postprocess';
import { Country } from './Country';
import { partial } from '../utilities';

export class Greece extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): Greece {
    return this.instance ? this.instance : (this.instance = new Greece());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/Greece/Level3.geojson');
    layerMenu.appendChild(new Option("Municipalities", "Municipalities"));
    layerMenu.onchange = () => {
      if (!newLayerReset(1)) return;
      loadMarkerLayer(countryMenu.value, layerMenu.value);
    };
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/Greece/Level3.geojson', "boundaryLayer", partial(markerInMiddle, "NL_NAME_3", true));
  }
}