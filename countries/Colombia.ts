import { markers, countryMenu, layerMenu, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';
import { colorCodingFixed } from '../postprocess';
import { partial } from '../utilities';


export class Colombia extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): Colombia {
    return this.instance ? this.instance : (this.instance = new Colombia());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/Colombia/Level1.geojson');
    settings.popupPropertyName = "NAME_1";
    layerMenu.appendChild(new Option("Highways", "Highways"));
    layerMenu.appendChild(new Option("Department Abbreviations", "Department Abbreviations"));
    layerMenu.onchange = () => {
      let v = 0.1;
      if (layerMenu.value == "Department Abbreviations") v = 1;
      if (!newLayerReset(v)) return;
      if (layerMenu.value == "Department Abbreviations") loadMarkerLayer(countryMenu.value, layerMenu.value);
      else if (layerMenu.value == "Highways") {
        loadMarkerLayer(countryMenu.value, layerMenu.value);
        loadGeoJSONFile('Layers/Colombia/05.geojson', "secondaryLayer", partial(colorCodingFixed, 0));
        //loadGeoJSONFile('Layers/Colombia/25.geojson', "secondaryLayer");
        loadGeoJSONFile('Layers/Colombia/4001.geojson', "secondaryLayer", partial(colorCodingFixed, 1));
        loadGeoJSONFile('Layers/Colombia/4002345.geojson', "secondaryLayer", partial(colorCodingFixed, 6));
        loadGeoJSONFile('Layers/Colombia/400678.geojson', "secondaryLayer", partial(colorCodingFixed, 7));
        loadGeoJSONFile('Layers/Colombia/2501A.geojson', "secondaryLayer", partial(colorCodingFixed, 2));
        loadGeoJSONFile('Layers/Colombia/2501B.geojson', "secondaryLayer", partial(colorCodingFixed, 3));
        loadGeoJSONFile('Layers/Colombia/2504A.geojson', "secondaryLayer", partial(colorCodingFixed, 4));
        loadGeoJSONFile('Layers/Colombia/2505B.geojson', "secondaryLayer", partial(colorCodingFixed, 5));
      }
    };
  }

  public sandbox(): void { }
public auxBehaviour(): void {

  }
}

