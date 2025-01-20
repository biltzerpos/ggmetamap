import { markers, countryMenu, layerMenu, flags, settings, getGlobals } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { markerInMiddle } from '../postprocess';
import { Country } from './Country';
import { Layer } from './Layer';
import { partial } from '../utilities';

export class France extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/France/Level2.geojson';
    this.layers.push(new DepartmentNames());
    this.layers.push(new PlacenameClusters());
    this.layers.push(new MajorRivers());
    this.layers.push(new SmallerRivers());
  }

  public static override getInstance(): France {
    return this.instance ? this.instance : (this.instance = new France());
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/France/Level2.geojson', "boundaryLayer", partial(markerInMiddle, "NAME_2"));
  }

}

class DepartmentNames extends Layer {

  public constructor() {
    super();
    this.displayName = "Department Names";
  }

  public show(): void {
    loadMarkerLayer(countryMenu.value, layerMenu.value);
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}

class PlacenameClusters extends Layer {

  public constructor() {
    super();
    this.displayName = "Placename Clusters";
    this.mainGeoJSONopacity = 0.1;
  }

  public show(): void {
    loadMarkerLayer("France", "Brie");
    loadMarkerLayer("France", "Vexin");
    loadMarkerLayer("France", "Auge");
    loadMarkerLayer("France", "Argonne");
    loadMarkerLayer("France", "Bresse");
    loadMarkerLayer("France", "Bray");
    loadMarkerLayer("France", "Beauce");
    loadMarkerLayer("France", "Woevre");
    loadMarkerLayer("France", "Morvan");
    loadMarkerLayer("France", "Caux");
    loadMarkerLayer("France", "Gatinais");
    loadMarkerLayer("France", "Bessin");
    loadMarkerLayer("France", "Othe");
    loadMarkerLayer("France", "Diois");
    loadMarkerLayer("France", "Santerre");
    loadMarkerLayer("France", "Mauges");
    loadMarkerLayer("France", "Vercors");
    loadMarkerLayer("France", "Royans");
    loadMarkerLayer("France", "Cambresis");
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}

class MajorRivers extends Layer {

  public constructor() {
    super();
    this.displayName = "Major Rivers";
    this.mainGeoJSONopacity = 0.1;
  }

  public show(): void {
    loadMarkerLayer("France", "MajorRivers");
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}

class SmallerRivers extends Layer {

  public constructor() {
    super();
    this.displayName = "Smaller Rivers";
    this.mainGeoJSONopacity = 0.1;
  }

  public show(): void {
    loadMarkerLayer("France", "MinorRivers");
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}