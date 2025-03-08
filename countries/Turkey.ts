import { markers, countryMenu, layerMenu, flags, settings, colors } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton, cycleLayers } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { processFeatures, markerInMiddleRemoveNodes } from '../postprocess';
import { Country } from './Country';
import { Layer } from './Layer';
import { partial } from '../utilities';

let hnames: string[][] = [];

export class Turkey extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/Turkey/Level1.geojson';
    for (let i = 0; i <= 9; i++) {
      const optionName = "D" + i + "xx Highway Numbers";
      this.layers.push(new Highways(optionName));
    }
    hnames.push(["010", "014", "016", "020", "030", "040", "050", "060", "062", "070", "080"]);
    hnames.push(["100", "110", "120", "130", "140", "150", "160", "170", "180", "190"]);
    hnames.push(["200", "210", "230", "240", "250", "260", "270", "280", "290"]);
    hnames.push(["300", "302", "310", "320", "330", "340", "350", "360", "370", "380", "390"]);
    hnames.push(["400", "410", "420", "430"]);
    hnames.push(["505", "515", "525", "535", "550", "555", "565", "567", "569", "573", "575", "585", "587", "595"]);
    hnames.push(["605", "615", "625", "635", "650", "655", "665", "675", "685", "687", "695", "696"]);
    hnames.push(["705", "715", "750", "753", "755", "757", "759", "765", "775", "785", "795"]);
    hnames.push(["805", "815", "817", "825", "827", "835", "850", "851", "855", "865", "875", "877", "883", "885", "887"]);
    hnames.push(["905", "915", "925", "950", "955", "957", "959", "965", "975", "977"]);
  }

  public static override getInstance(): Turkey {
    return this.instance ? this.instance : (this.instance = new Turkey());
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/Turkey/Level2.geojson', "boundaryLayer", partial(markerInMiddleRemoveNodes, "name", true));
  }

}

class Highways extends Layer {

  public constructor(name:string) {
    super();
    this.displayName = name;
    this.mainGeoJSONopacity = 0.1;
  }

  public show(): void {
    showAuxButton("Next option", cycleLayers);
    const group = this.displayName.substring(1, 2);
      hnames[group].forEach(async (name, index) => {
        const col = Number(name.substring(1, 2));
        const fileName = 'D' + name + '.geojson';
        const geopath = 'Layers/Turkey/geojson/' + fileName;
        // loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, col));
        const options = { type: "specified", colour: colors[col], fileName: fileName};
        loadGeoJSONFile(geopath, "secondaryLayer", partial(processFeatures, options));
      });
      loadMarkerLayer("Turkey", "D" + group);
  }

  public sandbox(): void { }
  public auxBehaviour(): void { }
}
