import { markers, countryMenu, layerMenu, flags, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton, cycleLayers } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { colorCodingFixed, markerInMiddleRemoveNodes } from '../postprocess';
import { Country } from './Country';
import { partial } from '../utilities';

export class Turkey extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): Turkey {
    return this.instance ? this.instance : (this.instance = new Turkey());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/Turkey/Level1.geojson');
    for (let i = 0; i <= 9; i++) {
      const optionName = "D" + i + "xx Highway Numbers";
      layerMenu.appendChild(new Option(optionName, optionName));
    }
    let hnames: string[][] = [];
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
    layerMenu.onchange = async () => {
      if (!newLayerReset()) return;
      showAuxButton("Next option", cycleLayers);
      const group = layerMenu.value.substring(1, 2);
      hnames[group].forEach(async (name, index) => {
        const col = Number(name.substring(1, 2));
        //colog(col);
        const geopath = 'Layers/Turkey/geojson/D' + name + '.geojson';
        loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, col));
      });
      loadMarkerLayer("Turkey", "D" + group);
    };
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/Turkey/Level2.geojson', "boundaryLayer", partial(markerInMiddleRemoveNodes, "name", true));
  }
  
  public auxBehaviour(): void {

  }
}
