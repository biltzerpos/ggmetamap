import { markers, getGlobals, layerMenu, auxButton, flags, overlays } from '../globals';
import { getConcaveGeoJSON, clearBoundaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { showAuxButton, showInfoButton } from '../index';
import { showAllMarkers, placeNewMarker } from '../markerFacilities';
import { markerInMiddle, thickBlue } from '../postprocess';
import { Country } from './Country';
import { Layer } from './Layer';
import { partial, loadZipLayer, colog, createButtonContainer } from '../utilities';
import { runQuiz } from '../quizFacilities';

export class Peru extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Peru/Regions.geojson';
    this.layers.push(new Parties());
    if (flags.localMode) this.layers.push(new PoleMarkings());
  }

  public static override getInstance(): Peru {
    return this.instance ? this.instance : (this.instance = new Peru());
  }

  public sandbox(): void {
  }
}

class Parties extends Layer {

  public constructor() {
    super();
    this.displayName = "Regional Political Parties";
    //this.mainGeoJSONopacity = 0;
  }

  private showBorders: boolean = false;

  public show(): void {
    //showAuxButton("Show County Borders", this.auxBehaviour);
    //loadMarkerLayer(countryMenu.value, layerMenu.value);
    loadZipLayer('/Layers/Peru/Regional Political Parties.zip');
    //showInfoButton("Click for more info", this.showInfo);
    showAuxButton("Start quiz", this.auxBehaviour);
  }

  // private showInfo() {
  //   getGlobals().infoWindow.setOptions({ maxWidth: 340 });
  //   getGlobals().infoWindow.setContent(`
  //     <p>The bus stop label shown below can be found all over Hungary.
  //     In Veszprém, the town name in the yellow section will be in lower case.</p>
  //     <img src="/Layers/Hungary/info.jpeg" alt="Standard bus stop label" width="309">
  //     `);
  //   const cen = getGlobals().map.getCenter();
  //   if (cen) getGlobals().infoWindow.setPosition({ lat: cen.lat(), lng: cen.lng() });
  //   getGlobals().infoWindow.open(getGlobals().map);
  // }

  public sandbox(): void { }

  public auxBehaviour = (): void => {
    runQuiz(markers, "NAME_1", "", this.tearDownQuiz);
  }

  private tearDownQuiz = (): void => {
    showAuxButton("Start quiz", this.auxBehaviour);
    loadGeoJSONFile('/Layers/Peru/Regions.geojson');
    showAllMarkers();
  }

  //public auxBehaviour(): void {
    // this.showBorders = !this.showBorders;
    // if (this.showBorders) {
    //   auxButton.textContent = "Hide County Borders";
    //   loadGeoJSONFile('/Layers/Hungary/Level6.geojson', "secondaryLayer", thickBlue);
    // }
    // else {
    //   getGlobals().secondaryLayer.forEach(function (feature) {
    //     if (feature.getProperty("ggmmLayer") == "thickBlue")
    //       getGlobals().secondaryLayer.remove(feature);
    //   });
    //   auxButton.textContent = "Show County Borders";
    // }
  //}
}

class PoleMarkings extends Layer {

  public constructor() {
    super();
    this.displayName = "Pole Markings";
    this.mainGeoJSONopacity = 0;
  }

  private showBorders: boolean = false;
  
  public show(): void {
    loadZipLayer('/Layers/Peru/Pole Markings.zip');
  }

  
  public sandbox(): void { }
  public auxBehaviour(): void { }
}