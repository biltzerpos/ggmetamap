import { Layer } from './Layer';
import { layerMenu } from '../globals';
import { loadGeoJSONFile } from '../geojsonFacilities';
import { newLayerReset } from '../index';

export abstract class Country {
  protected static instance: Country | null = null;

  protected constructor() {
    // Prevent instantiation of the abstract class directly
    if (new.target === Country) {
      throw new Error("Country cannot be instantiated directly.");
    }
  }

  // Abstract static method to enforce subclass implementation
  static getInstance(): Country {
    throw new Error("Subclasses must implement getInstance.");
  }

  public show(): void {
    loadGeoJSONFile(this.mainGeoJSONpath);

    this.layers.forEach((layer) => {
      //console.log(layer.displayName);
      const menuOption = new Option(layer.displayName, layer.displayName);
      layerMenu.appendChild(menuOption);
    });

    layerMenu.onchange = () => {
      const layer = this.layers[layerMenu.selectedIndex - 1]; // -1 because there is a "Select layer" option at 0
      if (!newLayerReset(layer.mainGeoJSONopacity)) return;
      layer.show();
    };

    layerMenu.selectedIndex = 1;
    const event = new Event("change");
    layerMenu.dispatchEvent(event);
  }

  // Abstract method that must be implemented by subclasses
  abstract sandbox(): void;

  // Top-level layers
  protected layers: Layer[] = [];

  protected mainGeoJSONpath: string = "";
}

