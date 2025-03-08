import { markers, countryMenu, layerMenu, settings, colors } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';
import { processFeatures } from '../postprocess';
import { partial } from '../utilities';
import { Layer } from './Layer';

export class Colombia extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Colombia/Level1.geojson';
    this.layers.push(new Highways());
    this.layers.push(new DepartmentAbbreviations());
    settings.popupPropertyName = "NAME_1";
  }

  public static override getInstance(): Colombia {
    return this.instance ? this.instance : (this.instance = new Colombia());
  }

  public sandbox(): void { }

}

class Highways extends Layer {

  public constructor() {
    super();
    this.displayName = "Highways";
    this.mainGeoJSONopacity = 0.1;
  }

  public show(): void {
    loadMarkerLayer(countryMenu.value, layerMenu.value);
    //loadGeoJSONFile('Layers/Colombia/05.geojson', "secondaryLayer", partial(colorCodingFixed, 0));
    let options = { type: "specified", colour: colors[0]};
    loadGeoJSONFile('Layers/Colombia/05.geojson', "secondaryLayer", partial(processFeatures, options));

    //loadGeoJSONFile('Layers/Colombia/25.geojson', "secondaryLayer");

    //loadGeoJSONFile('Layers/Colombia/4001.geojson', "secondaryLayer", partial(colorCodingFixed, 1));
    options = { type: "specified", colour: colors[1]};
    loadGeoJSONFile('Layers/Colombia/4001.geojson', "secondaryLayer", partial(processFeatures, options));

    //loadGeoJSONFile('Layers/Colombia/4002345.geojson', "secondaryLayer", partial(colorCodingFixed, 6));
    options = { type: "specified", colour: colors[6]};
    loadGeoJSONFile('Layers/Colombia/4002345.geojson', "secondaryLayer", partial(processFeatures, options));

    //loadGeoJSONFile('Layers/Colombia/400678.geojson', "secondaryLayer", partial(colorCodingFixed, 7));
    options = { type: "specified", colour: colors[7]};
    loadGeoJSONFile('Layers/Colombia/400678.geojson', "secondaryLayer", partial(processFeatures, options));
    
    //loadGeoJSONFile('Layers/Colombia/2501A.geojson', "secondaryLayer", partial(colorCodingFixed, 2));
    options = { type: "specified", colour: colors[2]};
    loadGeoJSONFile('Layers/Colombia/2501A.geojson', "secondaryLayer", partial(processFeatures, options));

    //loadGeoJSONFile('Layers/Colombia/2501B.geojson', "secondaryLayer", partial(colorCodingFixed, 3));
    options = { type: "specified", colour: colors[3]};
    loadGeoJSONFile('Layers/Colombia/2501B.geojson', "secondaryLayer", partial(processFeatures, options));
    
    //loadGeoJSONFile('Layers/Colombia/2504A.geojson', "secondaryLayer", partial(colorCodingFixed, 4));
    options = { type: "specified", colour: colors[4]};
    loadGeoJSONFile('Layers/Colombia/2504A.geojson', "secondaryLayer", partial(processFeatures, options));
    
    //loadGeoJSONFile('Layers/Colombia/2505B.geojson', "secondaryLayer", partial(colorCodingFixed, 5));
    options = { type: "specified", colour: colors[5]};
    loadGeoJSONFile('Layers/Colombia/2505B.geojson', "secondaryLayer", partial(processFeatures, options));
}

  public sandbox(): void { }
  public auxBehaviour(): void {}
}

class DepartmentAbbreviations extends Layer {

  public constructor() {
    super();
    this.displayName = "Department Abbreviations";
  }

  public show(): void {
      loadMarkerLayer(countryMenu.value, layerMenu.value);
  }

  public sandbox(): void { }
  public auxBehaviour(): void {}
}


