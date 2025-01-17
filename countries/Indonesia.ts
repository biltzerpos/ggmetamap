import { markers, countryMenu, layerMenu, flags, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { markerInMiddle } from '../postprocess';
import { Country } from './Country';
import { partial } from '../utilities';

export class Indonesia extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): Indonesia {
    return this.instance ? this.instance : (this.instance = new Indonesia());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/Indonesia/Level2.geojson');
    settings.popupPropertyName = "NAME_2";
    layerMenu.appendChild(new Option("Kabupaten", "Kabupaten"));
    //layerMenu.appendChild(new Option("Kecamatan", "Kecamatan"));
    layerMenu.onchange = () => {
      if (!newLayerReset(1)) return;
      flags.displayPopups = false;
      showAuxButton("Show Province borders");
      loadMarkerLayer(countryMenu.value, layerMenu.value);
    };
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/Indonesia/Level2.geojson', "boundaryLayer", partial(markerInMiddle, "NAME_2", true));
  }
}