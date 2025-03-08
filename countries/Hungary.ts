import { markers, getGlobals, layerMenu, auxButton, flags, settings } from '../globals';
import { zoom, clearBoundaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { showAuxButton, showInfoButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { markerInMiddle, thickBlue } from '../postprocess';
import { Country } from './Country';
import { Layer } from './Layer';
import { partial, loadZipLayer, colog, createButtonContainer } from '../utilities';
import { CustomOverlay } from '../CustomOverlay';

export class Hungary extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Hungary/Level6.geojson';
    this.layers.push(new BusStopLabels());
  }

  public static override getInstance(): Hungary {
    return this.instance ? this.instance : (this.instance = new Hungary());
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/Hungary/Level2.geojson', "boundaryLayer", partial(markerInMiddle, "NAME_2", true));
  }
}

class BusStopLabels extends Layer {

  public constructor() {
    super();
    this.displayName = "Bus Stop Labels";
    this.mainGeoJSONopacity = 0;
  }

  private showBorders: boolean = false;

  public show(): void {
    flags.displayPopups = false;
    showAuxButton("Show County borders", this.auxBehaviour);
    //loadMarkerLayer(countryMenu.value, layerMenu.value);
    loadZipLayer('/Layers/Hungary/Bus Stop Labels.zip');
    showInfoButton("Click for more info", this.showInfo);
  }

  private showInfo() {
    getGlobals().infoWindow.setOptions({ maxWidth: 340 });
    getGlobals().infoWindow.setContent(`
      <p>The bus stop label shown below can be found all over Hungary.
      In Veszprém, the town name in the yellow section will be in lower case.</p>
      <img src="/Layers/Hungary/info.jpeg" alt="Standard bus stop label" width="309">
      `);
    const cen = getGlobals().map.getCenter();
    if (cen) getGlobals().infoWindow.setPosition({ lat: cen.lat(), lng: cen.lng() });
    getGlobals().infoWindow.open(getGlobals().map);
  }

  public sandbox(): void { }

  public auxBehaviour(): void {
    this.showBorders = !this.showBorders;
    if (this.showBorders) {
      auxButton.textContent = "Hide County Borders";
      loadGeoJSONFile('/Layers/Hungary/Level6.geojson', "secondaryLayer", thickBlue);
    }
    else {
      getGlobals().secondaryLayer.forEach(function (feature) {
        if (feature.getProperty("ggmmLayer") == "thickBlue")
          getGlobals().secondaryLayer.remove(feature);
      });
      auxButton.textContent = "Show County Borders";
    }
  }
}
