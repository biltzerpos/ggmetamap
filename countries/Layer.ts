export abstract class Layer {

  public constructor() { }

  // Abstract method that must be implemented by subclasses
  abstract show(): void;
  abstract sandbox(): void;
  abstract auxBehaviour(): void;

  // Sublayers
  protected layers: Layer[] = [];

  displayName: string = "Default Layer Name";
  mainGeoJSONopacity: number = 1;
}

