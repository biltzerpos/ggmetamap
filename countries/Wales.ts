import { markers, countryMenu, layerMenu, flags, settings, getGlobals } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile, downloadGeoJson } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { markerInMiddle, colorCodingBasedOnField, colorCodingFixed } from '../postprocess';
import { Country } from './Country';
import { partial, colog } from '../utilities';

export class Wales extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): Wales {
    return this.instance ? this.instance : (this.instance = new Wales());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/Wales/Level3.geojson');
    settings.popupPropertyName = "name:en";
    layerMenu.appendChild(new Option("Counties", "Counties"));
    layerMenu.appendChild(new Option("Bins", "Bins"));
    layerMenu.appendChild(new Option("Most useful highway meta", "Most useful highway meta"));
    layerMenu.appendChild(new Option("A Highways", "A Highways"));
    layerMenu.appendChild(new Option("B Highways", "B Highways"));
    layerMenu.appendChild(new Option("Main bike routes", "Main bike routes"));
    layerMenu.appendChild(new Option("All bike routes", "All bike routes"));

    layerMenu.onchange = () => {
      if (!newLayerReset(1)) return;
      if (layerMenu.value == "Counties") {
        loadMarkerLayer(countryMenu.value, layerMenu.value);
      }
      else if (layerMenu.value == "Bins") {
        //showAuxButton("Next route");
        loadMarkerLayer(countryMenu.value, "Bins");
      } else if (layerMenu.value == "Main bike routes") {
        //showAuxButton("Next route");
        const geopath = 'Layers/Wales/Bike458.geojson';
        loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "ref"));
        loadMarkerLayer(countryMenu.value, "Bike458");
      }
      else if (layerMenu.value == "All bike routes") {
        //showAuxButton("Next set of routes");
        const geopath = 'Layers/Wales/BikeAll.geojson';
        loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingBasedOnField, "ref"));
        loadMarkerLayer(countryMenu.value, "BikeAll");
      }
      else if (layerMenu.value == "Most useful highway meta") {
        showAuxButton("Next set of highways", this.auxBehaviour);
        const geopath = 'Layers/Wales/A5x.geojson';
        loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
        placeNewMarker(getGlobals().map, { lat: 52.5, lng: -4.8 }, "A5xxx");

      }
      else if (layerMenu.value == "A Highways") {
        showAuxButton("Next set of highways", this.auxBehaviour);
        const geopath = 'Layers/Wales/A40.geojson';
        loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3, 7));
        placeNewMarker(getGlobals().map, { lat: 52.5, lng: -4.8 }, "A40xx");
        //placeNewMarker(map, { lat: 53.5, lng: -4.42 }, "All A408x are up here except for A4081");
        //placeNewMarker(map, { lat: 52.36, lng: -3.4 }, "A4081");
      }
      else if (layerMenu.value == "B Highways") {
        showAuxButton("Next set of highways", this.auxBehaviour);
        const geopath = 'Layers/Wales/B42.geojson';
        loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3, 7));
        placeNewMarker(getGlobals().map, { lat: 52.5, lng: -4.8 }, "B42xx");
      }
    };
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

  public auxBehaviour(): void {
    if (layerMenu.value == "Most useful highway meta") {
      clearSecondaryLayer();
      let hnames = ["A5x", "B5x", "A46", "A49", "B42"];
      let numb = markers[0].content.textContent.substring(0, 3);
      colog(numb);
      let index = hnames.indexOf(numb);
      index++;
      if (index == 5) index = 0;
      const geopath = 'Layers/Wales/' + hnames[index] + '.geojson';
      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3));
      markers[0].content.textContent = hnames[index] + "xx";
    } else if (layerMenu.value == "A Highways") {
      clearSecondaryLayer();
      let hnames = ["A40", "A41", "A42", "A46", "A47", "A48", "A49", "A5x", "A50", "A51", "A52", "A53", "A54", "A55"];
      let numb = markers[0].content.textContent.substring(0, 3);
      colog(numb);
      let index = hnames.indexOf(numb);
      index++;
      if (index == 14) index = 0;
      const geopath = 'Layers/Wales/' + hnames[index] + '.geojson';
      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3, 3));
      markers[0].content.textContent = hnames[index] + "xx";
    }
    else if (layerMenu.value == "B Highways") {
      clearSecondaryLayer();
      let hnames = ["B42", "B43", "B44", "B45", "B46", "B48", "B5x", "B50", "B51", "B53", "B54"];
      let numb = markers[0].content.textContent.substring(0, 3);
      colog(numb);
      let index = hnames.indexOf(numb);
      index++;
      if (index == 11) index = 0;
      const geopath = 'Layers/Wales/' + hnames[index] + '.geojson';
      loadGeoJSONFile(geopath, "secondaryLayer", partial(colorCodingFixed, 3, 3));
      markers[0].content.textContent = hnames[index] + "xx";
    }
  }
}
