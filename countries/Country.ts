export abstract class Country {
  protected static instance: Country | null = null;

  protected constructor() {
    // Prevent instantiation of the abstract class directly
    if (new.target === Country) {
      throw new Error("Country cannot be instantiated directly.");
    }

    // Ensure the subclass has only one instance
    // const subclass = this.constructor as typeof Country;
    // if (subclass.instance) {
    //   throw new Error(`${subclass.name} is a singleton. Use getInstance() to access it.`);
    // }
  }

// Abstract static method to enforce subclass implementation
static getInstance(): Country {
  throw new Error("Subclasses must implement getInstance.");
}

  // Abstract method that must be implemented by subclasses
  abstract show(): void;
  abstract sandbox(): void;
  abstract auxBehaviour(): void
}

