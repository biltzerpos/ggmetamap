import { markers, countryMenu, layerMenu } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { processFeatures } from '../postprocess';
import { loadMarkerLayer, removeAllMarkers } from '../markerFacilities';
import { Country } from './Country';
import { Layer } from './Layer';
import { partial } from '../utilities';

let colll: { [key: string]: number } = {
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
    this.mainGeoJSONpath = '/Layers/Norway/Level1.geojson';
    this.layers.push(new Highways());
  }

  public static override getInstance(): Norway {
    return this.instance ? this.instance : (this.instance = new Norway());
  }

  public sandbox(): void { }

}

class Highways extends Layer {

  public constructor() {
    super();
    this.displayName = "Highways";
    this.mainGeoJSONopacity = 0;
  }

  public show(): void {
    showAuxButton("Next set of highways", this.auxBehaviour);
    const geopath = 'Layers/Norway/HE.geojson';
    //loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "ref", -1, colll));
    const options = { type: "array-based", field: "ref", colArray: colll };
    loadGeoJSONFile(geopath, "secondaryLayer", partial(processFeatures, options));
    loadMarkerLayer(countryMenu.value, "Ex");
  }

  public sandbox(): void { }

  public auxBehaviour(): void {
    if (layerMenu.value == "Highways") {
      clearSecondaryLayer();
      let spornum = markers[0].content?.textContent?.substring(9, 10);
      let numb;
      if (spornum == "H") numb = 0;
      else if (spornum == " ") numb = 1;
      else {
        numb = Number(spornum);
        numb++;
      }
      if (numb == 10) {
        const geopath = 'Layers/Norway/HE.geojson';
        //loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "ref", -1, colll));
        const options = { type: "array-based", field: "ref", colArray: colll };
        loadGeoJSONFile(geopath, "secondaryLayer", partial(processFeatures, options));
        removeAllMarkers();
        loadMarkerLayer(countryMenu.value, "Ex");
        //markers[0].content.textContent = "European Highways";
      }
      else if (numb == 0) {
        const geopath = 'Layers/Norway/H .geojson';
        //loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "ref", 0));
        const options = { type: "field-based", field: "ref", digit: 0 };
        loadGeoJSONFile(geopath, "secondaryLayer", partial(processFeatures, options));
        removeAllMarkers();
        loadMarkerLayer(countryMenu.value, "0x");
        //markers[0].content.textContent = "Highways  2-9";
      }
      else {
        const geopath = 'Layers/Norway/H' + numb + '.geojson';
        //loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "ref", 1));
        const options = { type: "field-based", field: "ref", digit: 1 };
        loadGeoJSONFile(geopath, "secondaryLayer", partial(processFeatures, options));
        //markers[0].content.textContent = "Highways " + numb + "0-" + numb + "9";
        removeAllMarkers();
        loadMarkerLayer(countryMenu.value, numb + "x");
      }
    }
  }
}
