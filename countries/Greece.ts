import { markers, countryMenu, layerMenu, flags, getGlobals, auxButton, quizBehaviour } from '../globals';
import { zoom, removeAllFeatures, loadGeoJSONFile } from '../geojsonFacilities';
import { runQuiz } from '../quizFacilities';
import { loadMarkerLayer, hideAllMarkers, showAllMarkers } from '../markerFacilities';
import { markerInMiddle } from '../postprocess';
import { showAuxButton } from '../index';
import { Country } from './Country';
import { Layer } from './Layer';
import { colog, partial } from '../utilities.js';

export class Greece extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Greece/Level3.geojson';
    this.layers.push(new Municipalities());
  }

  public static override getInstance(): Greece {
    return this.instance ? this.instance : (this.instance = new Greece());
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/Greece/Level3.geojson', "boundaryLayer", partial(markerInMiddle, "name", true));
  }

}

class Municipalities extends Layer {

  public constructor() {
    super();
    this.displayName = "Municipalities";
  }

  public show(): void {
    loadMarkerLayer(countryMenu.value, layerMenu.value);
    showAuxButton("Start quiz", this.auxBehaviour);
  }

  public sandbox(): void { }

  private tearDownQuiz = (): void => {
    showAuxButton("Start quiz", this.auxBehaviour);
    loadGeoJSONFile('/Layers/Greece/Level3.geojson');
    showAllMarkers();
  }

  public auxBehaviour = (): void => {
    runQuiz(markers, "name", "ΔΗΜΟΣ ", this.tearDownQuiz);
  }
}
