import { markers, countryMenu, layerMenu, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton, cycleLayers } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';
import { Layer } from './Layer';
import { partial } from '../utilities';
import { processFeatures } from '../postprocess';

export class SouthAfrica extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/South Africa/Level1.geojson';
    this.layers.push(new MostUsefulHighwayClusters());
    for (let i = 2; i <= 7; i++) {
      const optionName = " " + i + "x Highway Numbers";
      //layerMenu.appendChild(new Option(optionName, optionName));
      this.layers.push(new Highways(optionName));
    }
    this.layers.push(new Highways(" 8x 9x Highway Numbers"));
    this.layers.push(new Highways("Parallel routes (R1xy)"));
    for (let i = 30; i <= 72; i++) {
      const optionName = i + "x Highway Numbers";
      this.layers.push(new Highways(optionName));
    //layerMenu.appendChild(new Option(optionName, optionName));
      if (i == 41) i = 49;
      if (i == 57) i = 59;
      if (i == 62) i = 69;
    }
  }

  public static override getInstance(): SouthAfrica {
    return this.instance ? this.instance : (this.instance = new SouthAfrica());
  }

  // public show(): void {
  //   loadGeoJSONFile('/Layers/South Africa/Level1.geojson');
  //   settings.popupPropertyName = "NAME_1";
  //   layerMenu.appendChild(new Option("Most useful highway clusters", "Clusters"));
  //   for (let i = 2; i <= 7; i++) {
  //     const optionName = " " + i + "x Highway Numbers";
  //     layerMenu.appendChild(new Option(optionName, optionName));
  //   }
  //   layerMenu.appendChild(new Option(" 8x 9x Highway Numbers", " 8x 9x Highway Numbers"));
  //   layerMenu.appendChild(new Option("Parallel routes (R1xy)", "Parallel routes"));
  //   for (let i = 30; i <= 72; i++) {
  //     const optionName = i + "x Highway Numbers";
  //     layerMenu.appendChild(new Option(optionName, optionName));
  //     if (i == 41) i = 49;
  //     if (i == 57) i = 59;
  //     if (i == 62) i = 69;
  //   }
  //   layerMenu.onchange = async () => {
  //     if (!newLayerReset()) return;
  //     showAuxButton("Next option", cycleLayers);
  //     //   const styleOptions = {
  //     //       strokeColor: 'black',
  //     //       strokeOpacity: '1',
  //     //       strokeWeight: '5'
  //     //   };
  //     //  secondaryLayer.setStyle(styleOptions);
  //     if (layerMenu.value == "Clusters") {
  //       loadGeoJSONFile('Layers/South Africa/Clusters.geojson', "secondaryLayer");
  //       loadMarkerLayer(countryMenu.value, layerMenu.value);
  //     }
  //     else {
  //       const group = layerMenu.value.substring(0, 2).replace(/\s/g, '');
  //       const geopath = 'Layers/South Africa/geojson/' + group + 'x.geojson';
  //       loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "ref", 9));
  //       loadMarkerLayer("South Africa", "markers/" + group);
  //     }
  //   };
  // }

  public sandbox(): void { }

}

class MostUsefulHighwayClusters extends Layer {

  public constructor() {
    super();
    this.displayName = "Most Useful Highway Clusters";
    this.mainGeoJSONopacity = 0.1;
  }

  public show(): void {
    showAuxButton("Next option", cycleLayers);
    loadGeoJSONFile('Layers/South Africa/Clusters.geojson', "secondaryLayer");
    loadMarkerLayer(countryMenu.value, "Clusters");
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}

class Highways extends Layer {

  //private name: string;

  public constructor(name:string) {
    super();
    this.displayName = name;
    this.mainGeoJSONopacity = 0.1;
  }

  public show(): void {
    showAuxButton("Next option", cycleLayers);
    //const group = layerMenu.value.substring(0, 2).replace(/\s/g, '');
    const group = this.displayName.substring(0, 2).replace(/\s/g, '');
    const geopath = 'Layers/South Africa/geojson/' + group + 'x.geojson';
    // loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "ref", 9));
    const options = { type: "field-based", field: "ref", digit: 9};
    loadGeoJSONFile(geopath, "secondaryLayer", partial(processFeatures, options));

    loadMarkerLayer("South Africa", "markers/" + group);
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}


