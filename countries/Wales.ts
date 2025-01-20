import { markers, countryMenu, layerMenu, flags, settings, getGlobals } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile, downloadGeoJson } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { markerInMiddle, colorCodingBasedOnField, colorCodingFixed } from '../postprocess';
import { Country } from './Country';
import { Layer } from './Layer';
import { partial, colog } from '../utilities';
import { length } from '@turf/turf';

export class Wales extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Wales/Level3.geojson';
    this.layers.push(new Counties());
    this.layers.push(new Bins());
    this.layers.push(new MostUsefulHighwayMeta());
    this.layers.push(new AHighways());
    this.layers.push(new BHighways());
    this.layers.push(new MainBikeRoutes());
    this.layers.push(new AllBikeRoutes());
    settings.popupPropertyName = "name:en";
  }

  public static override getInstance(): Wales {
    return this.instance ? this.instance : (this.instance = new Wales());
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/Wales/Level3.geojson', "boundaryLayer", partial(markerInMiddle, "name"));
    getGlobals().boundaryLayer.forEach((feature) => {
      colog(feature);
      let id = feature["Fg"]["@id"].toString();
      if (id.startsWith("node")) {
        getGlobals().boundaryLayer.remove(feature);
      }
      if (id.startsWith("relation")) {
        let name = feature["Fg"]["name"].toString();
        //colog(name);
        if (name.startsWith("City")) {
          getGlobals().boundaryLayer.remove(feature);
        }
      }
    });
    // Save data layer as GeoJSON
    getGlobals().boundaryLayer.toGeoJson(function (geoJson) {
      const geoJsonString = JSON.stringify(geoJson);
      downloadGeoJson(geoJsonString, "features.geojson");
    });
  }

}

class Counties extends Layer {

  public constructor() {
    super();
    this.displayName = "Counties";
  }

  public show(): void {
    loadMarkerLayer(countryMenu.value, layerMenu.value);
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}

class Bins extends Layer {

  public constructor() {
    super();
    this.displayName = "Bins";
  }

  public show(): void {
    loadMarkerLayer(countryMenu.value, "Bins");
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}

class MostUsefulHighwayMeta extends Layer {

  public constructor() {
    super();
    this.displayName = "Most Useful Highway Meta";
  }

  public show(): void {
    showAuxButton("Next set of highways", this.auxBehaviour);
    const geopath = 'Layers/Wales/A5x.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
    placeNewMarker(getGlobals().map, { lat: 52.5, lng: -4.8 }, "A5xxx");
  }

  public sandbox(): void { }
  public auxBehaviour(): void {
    clearSecondaryLayer();
    let hnames = ["A5x", "B5x", "A46", "A49", "B42"];
    let index: number = findNextIndex(hnames);
    const geopath = 'Layers/Wales/' + hnames[index] + '.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
    if (markers[0].content) markers[0].content.textContent = hnames[index] + "xx";
  }
}

class AHighways extends Layer {

  public constructor() {
    super();
    this.displayName = "A Highways";
  }

  public show(): void {
    showAuxButton("Next set of highways", this.auxBehaviour);
    const geopath = 'Layers/Wales/A40.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3, 7));
    placeNewMarker(getGlobals().map, { lat: 52.5, lng: -4.8 }, "A40xx");
  }

  public sandbox(): void { }
  public auxBehaviour(): void {
    clearSecondaryLayer();
    let hnames = ["A40", "A41", "A42", "A46", "A47", "A48", "A49", "A5x", "A50", "A51", "A52", "A53", "A54", "A55"];
    let index: number = findNextIndex(hnames);
    const geopath = 'Layers/Wales/' + hnames[index] + '.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3, 3));
    if (markers[0].content) markers[0].content.textContent = hnames[index] + "xx";
  }
}

class BHighways extends Layer {

  public constructor() {
    super();
    this.displayName = "B Highways";
  }

  public show(): void {
    showAuxButton("Next set of highways", this.auxBehaviour);
    const geopath = 'Layers/Wales/B42.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3, 7));
    placeNewMarker(getGlobals().map, { lat: 52.5, lng: -4.8 }, "B42xx");
  }

  public sandbox(): void { }
  public auxBehaviour(): void {
    clearSecondaryLayer();
    let hnames = ["B42", "B43", "B44", "B45", "B46", "B48", "B5x", "B50", "B51", "B53", "B54"];
    let index: number = findNextIndex(hnames);
    const geopath = 'Layers/Wales/' + hnames[index] + '.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3, 3));
    if (markers[0].content) markers[0].content.textContent = hnames[index] + "xx";
  }
}

class MainBikeRoutes extends Layer {

  public constructor() {
    super();
    this.displayName = "Main Bike Routes";
  }

  public show(): void {
    const geopath = 'Layers/Wales/Bike458.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "ref"));
    loadMarkerLayer(countryMenu.value, "Bike458");
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}

class AllBikeRoutes extends Layer {

  public constructor() {
    super();
    this.displayName = "All Bike Routes";
  }

  public show(): void {
    const geopath = 'Layers/Wales/BikeAll.geojson';
    loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "ref"));
    loadMarkerLayer(countryMenu.value, "BikeAll");
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}

function findNextIndex(hnames: string[]) {
  let prefix = markers[0].content?.textContent?.substring(0, 3);
  let index: number = 0;
  if (prefix) index = hnames.indexOf(prefix);
  else colog("Weird Error in findNextIndex");
  index++;
  if (index == hnames.length) index = 0;
  return index;
}
