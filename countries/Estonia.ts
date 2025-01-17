import { markers, countryMenu, layerMenu, getGlobals } from '../globals';
//import { BulgariaPhoneCodes } from './BulgariaPhoneCodes';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { colorCodingFixed } from '../postprocess';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { Country } from './Country';
import { partial } from '../utilities';

export class Estonia extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): Estonia {
    return this.instance ? this.instance : (this.instance = new Estonia());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/Estonia/Level1.geojson');
    layerMenu.appendChild(new Option("Phone Codes", "Phone Codes"));
    layerMenu.appendChild(new Option("Bike routes 1-16", "Bike routes 1-16"));
    layerMenu.appendChild(new Option("3-digit bike routes", "3-digit bike routes"));
    layerMenu.appendChild(new Option("Highways", "Highways"));
    layerMenu.appendChild(new Option("Rivers", "Rivers"));
    layerMenu.onchange = () => {
      if (!newLayerReset(1)) return;
      if (layerMenu.value == "Phone Codes") {
        loadMarkerLayer(countryMenu.value, layerMenu.value);
      }
      else if (layerMenu.value == "Bike routes 1-16") {
        showAuxButton("Next route", this.auxBehaviour);
        const geopath = 'Layers/Estonia/geojson/B1.geojson';
        loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
        placeNewMarker(getGlobals().map, { lat: 59.3, lng: 22.7 }, "Bike Route 1");
      }
      else if (layerMenu.value == "3-digit bike routes") {
        showAuxButton("Next set of routes", this.auxBehaviour);
        const geopath = 'Layers/Estonia/geojson/B14x.geojson';
        loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
        placeNewMarker(getGlobals().map, { lat: 59.3, lng: 22.7 }, "Bike Routes 140-149");
      }
      else if (layerMenu.value == "Highways") {
        showAuxButton("Next set of highways", this.auxBehaviour);
        const geopath = 'Layers/Estonia/geojson/H1.geojson';
        loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
        placeNewMarker(getGlobals().map, { lat: 59.3, lng: 22.7 }, "Highways 12-19");
      }
      else if (layerMenu.value == "Rivers") {
        //showAuxButton("Next set of highways");
        const geopath = 'Layers/Estonia/Rivers.geojson';
        loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 7, 7));
        loadMarkerLayer(countryMenu.value, layerMenu.value);
      }
    };
  }

  public sandbox(): void { }

  public auxBehaviour(): void {
    if (layerMenu.value == "Bike routes 1-16") {
      clearSecondaryLayer();
      let numb = Number(markers[0].content.textContent.substring(11));
      numb++;
      if (numb == 7) numb = 11;
      if (numb == 17) numb = 1;
      const geopath = 'Layers/Estonia/geojson/B' + numb + '.geojson';
      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
      //placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Route 2");
      markers[0].content.textContent = "Bike Route " + numb;
    }
    else if (layerMenu.value == "3-digit bike routes") {
      clearSecondaryLayer();
      let numb = Number(markers[0].content.textContent.substring(12, 14));
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
      markers[0].content.textContent = "Bike Routes " + numb + "0-" + numb + "9";
    }
    else if (layerMenu.value == "Highways") {
      clearSecondaryLayer();
      let numb = Number(markers[0].content.textContent.substring(9, 10));
      numb++;
      if (numb == 10) numb = 1;
      const geopath = 'Layers/Estonia/geojson/H' + numb + '.geojson';
      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
      //placeNewMarker(map, { lat: 59.3, lng: 22.7 }, "Bike Route 2");
      markers[0].content.textContent = "Highways " + numb + "0-" + numb + "9";
    }
  }
}

