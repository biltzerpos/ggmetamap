import { markers, countryMenu, layerMenu, flags, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { markerInMiddle } from '../postprocess';
import { Country } from './Country';
import { partial } from '../utilities';

export class Thailand extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): Thailand {
    return this.instance ? this.instance : (this.instance = new Thailand());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/Thailand/Level2.geojson', "boundaryLayer");
    layerMenu.appendChild(new Option("Districts", "Districts"));
    layerMenu.onchange = () => {
      if (!newLayerReset(1)) return;
      //showAuxButton("Show Province borders");
      loadMarkerLayer(countryMenu.value, layerMenu.value);
    };
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/Thailand/Level2.geojson', "boundaryLayer", partial(markerInMiddle, "NAME_2", true));
  }
public auxBehaviour(): void {

  }
}
