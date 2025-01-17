import { markers, countryMenu, layerMenu } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { colorCodingBasedOnField } from '../postprocess';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';
import { partial } from '../utilities';

let colll = {
  "E 6": 0,
  "E 12": 1,
  "E 14": 2,
  "E 16": 3,
  "E 18": 4,
  "E 39": 5,
  "E 69": 9,
  "E 134": 7,
  "E 136": 8,
  "E 8": 1,
  "E 10": 2,
  "E 45": 3,
  "E 75": 4,
  "E 105": 5
};

export class Norway extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): Norway {
    return this.instance ? this.instance : (this.instance = new Norway());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/Norway/Level1.geojson');
    layerMenu.appendChild(new Option("Highways", "Highways"));
    layerMenu.onchange = () => {
      if (!newLayerReset(0)) return;
      if (layerMenu.value == "Highways") {
        showAuxButton("Next set of highways");
        const geopath = 'Layers/Norway/HE.geojson';
        loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "ref", -1, colll));
        loadMarkerLayer(countryMenu.value, "Ex");
      }
    };
  }

  public sandbox(): void { }
}

