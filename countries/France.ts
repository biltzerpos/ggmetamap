import { markers, countryMenu, layerMenu, flags, settings, getGlobals } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset, showAuxButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { markerInMiddle } from '../postprocess';
import { Country } from './Country';
import { partial } from '../utilities';

export class France extends Country {

  private constructor() {
    super();
  }

  public static override getInstance(): France {
    return this.instance ? this.instance : (this.instance = new France());
  }

  public show(): void {
    loadGeoJSONFile('/Layers/France/Level2.geojson');
                const newtop = new Option("Department Names", "NamesLevel2");
                layerMenu.appendChild(newtop);
                const clusters = new Option("Placename Clusters", "Clusters");
                layerMenu.appendChild(clusters);
                const bigR = new Option("Major Rivers", "Major Rivers");
                layerMenu.appendChild(bigR);
                const smallR = new Option("Smaller Rivers", "Smaller Rivers");
                layerMenu.appendChild(smallR);
                layerMenu.onchange = () => {
                    if (!newLayerReset()) return;
                    if (layerMenu.value == "Clusters") {
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
                    else if (layerMenu.value == "Major Rivers") {
                        loadMarkerLayer("France", "MajorRivers");
                    }
                    else if (layerMenu.value == "Smaller Rivers") {
                        loadMarkerLayer("France", "MinorRivers");
                    }
                    else {
                        getGlobals().boundaryLayer.setStyle({ strokeOpacity: 1, fillOpacity: 0, zIndex: 1 });
                        loadGeoJSONFile('/Layers/France/Level2.geojson');
                        loadMarkerLayer(countryMenu.value, layerMenu.value);
                    }
                };
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/France/Level2.geojson', "boundaryLayer", partial(markerInMiddle, "NAME_2"));
  }
public auxBehaviour(): void {

  }
}
