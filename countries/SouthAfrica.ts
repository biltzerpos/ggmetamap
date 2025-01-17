import { markers, countryMenu, layerMenu, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';
import { partial } from '../utilities';
import { colorCodingBasedOnField } from '../postprocess';

export class SouthAfrica extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): SouthAfrica {
    return this.instance ? this.instance : (this.instance = new SouthAfrica());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/South Africa/Level1.geojson');
    settings.popupPropertyName = "NAME_1";
    layerMenu.appendChild(new Option("Most useful highway clusters", "Clusters"));
    for (let i = 2; i <= 7; i++) {
      const optionName = " " + i + "x Highway Numbers";
      layerMenu.appendChild(new Option(optionName, optionName));
    }
    layerMenu.appendChild(new Option(" 8x 9x Highway Numbers", " 8x 9x Highway Numbers"));
    layerMenu.appendChild(new Option("Parallel routes (R1xy)", "Parallel routes"));
    for (let i = 30; i <= 72; i++) {
      const optionName = i + "x Highway Numbers";
      layerMenu.appendChild(new Option(optionName, optionName));
      if (i == 41) i = 49;
      if (i == 57) i = 59;
      if (i == 62) i = 69;
    }
    layerMenu.onchange = async () => {
      if (!newLayerReset()) return;
      showAuxButton("Next option");
      //   const styleOptions = {
      //       strokeColor: 'black',
      //       strokeOpacity: '1',
      //       strokeWeight: '5'
      //   };
      //  secondaryLayer.setStyle(styleOptions);
      if (layerMenu.value == "Clusters") {
        loadGeoJSONFile('Layers/South Africa/Clusters.geojson', "secondaryLayer");
        loadMarkerLayer(countryMenu.value, layerMenu.value);
      }
      else {
        const group = layerMenu.value.substring(0, 2).replace(/\s/g, '');
        const geopath = 'Layers/South Africa/geojson/' + group + 'x.geojson';
        loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "ref", 9));
        loadMarkerLayer("South Africa", "markers/" + group);
      }
    };
  }

  public sandbox(): void { }
}

