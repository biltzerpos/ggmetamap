import { markers, countryMenu, layerMenu, getGlobals } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { colorCodingFixed } from '../postprocess';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';
import { Layer } from './Layer';
import { partial } from '../utilities';

export class Estonia extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Estonia/Level1.geojson';
    this.layers.push(new PhoneCodes());
    this.layers.push(new MainBikeRoutes());
    this.layers.push(new ThreeDigitBikeRoutes());
    this.layers.push(new Highways());
    this.layers.push(new Rivers());
  }

  public static override getInstance(): Estonia {
    return this.instance ? this.instance : (this.instance = new Estonia());
  }

  public sandbox(): void { }
}

class PhoneCodes extends Layer {

  public constructor() {
    super();
    this.displayName = "Phone Codes";
  }

  public show(): void {
    loadMarkerLayer(countryMenu.value, layerMenu.value);
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}

class MainBikeRoutes extends Layer {

  public constructor() {
    super();
    this.displayName = "Bike routes 1-16";
  }

  public show(): void {
    showAuxButton("Next route", this.auxBehaviour);
    const geopath = 'Layers/Estonia/geojson/B1.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
    placeNewMarker(getGlobals().map, { lat: 59.3, lng: 22.7 }, "Bike Route 1");
  }

  public sandbox(): void { }

  public auxBehaviour(): void {
    clearSecondaryLayer();
    let numb = Number(markers[0].content?.textContent?.substring(11));
    numb++;
    if (numb == 7) numb = 11;
    if (numb == 17) numb = 1;
    const geopath = 'Layers/Estonia/geojson/B' + numb + '.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
    if (markers[0].content) markers[0].content.textContent = "Bike Route " + numb;
  }
}

class ThreeDigitBikeRoutes extends Layer {

  public constructor() {
    super();
    this.displayName = "3-digit bike routes";
  }

  public show(): void {
    showAuxButton("Next set of routes", this.auxBehaviour);
    const geopath = 'Layers/Estonia/geojson/B14x.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
    placeNewMarker(getGlobals().map, { lat: 59.3, lng: 22.7 }, "Bike Routes 140-149");
  }

  public sandbox(): void { }

  public auxBehaviour(): void {
    clearSecondaryLayer();
    let numb = Number(markers[0].content?.textContent?.substring(12, 14));
    numb++;
    if (numb == 15) numb = 16;
    if (numb == 17) numb = 20;
    if (numb == 21) numb = 22;
    if (numb == 24) numb = 26;
    if (numb == 27) numb = 28;
    if (numb == 29) numb = 30;
    if (numb == 31) numb = 32;
    if (numb == 38) numb = 14;
    const geopath = 'Layers/Estonia/geojson/B' + numb + 'x.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
    //placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Route 2");
    if (markers[0].content) markers[0].content.textContent = "Bike Routes " + numb + "0-" + numb + "9";
  }
}

class Highways extends Layer {

  public constructor() {
    super();
    this.displayName = "Highways";
  }

  public show(): void {
    showAuxButton("Next set of highways", this.auxBehaviour);
    const geopath = 'Layers/Estonia/geojson/H1.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
    placeNewMarker(getGlobals().map, { lat: 59.3, lng: 22.7 }, "Highways 12-19");
  }

  public sandbox(): void { }

  public auxBehaviour(): void {
    clearSecondaryLayer();
    let numb = Number(markers[0].content?.textContent?.substring(9, 10));
    numb++;
    if (numb == 10) numb = 1;
    const geopath = 'Layers/Estonia/geojson/H' + numb + '.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
    //placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Route 2");
    if (markers[0].content) markers[0].content.textContent = "Highways " + numb + "0-" + numb + "9";
  }
}

class Rivers extends Layer {

  public constructor() {
    super();
    this.displayName = "Rivers";
  }

  public show(): void {
    const geopath = 'Layers/Estonia/Rivers.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 7, 7));
    loadMarkerLayer(countryMenu.value, layerMenu.value);
  }

  public sandbox(): void { }

  public auxBehaviour(): void { }
}