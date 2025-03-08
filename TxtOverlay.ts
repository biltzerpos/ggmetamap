await google.maps.importLibrary("maps");

export class TxtOverlay extends google.maps.OverlayView {
  private pos: google.maps.LatLng;
  private text: string;
  private div: HTMLDivElement | null = null;
  private map: google.maps.Map | null;

  constructor(
    position: google.maps.LatLng,
    text: string,
    map: google.maps.Map | null
  ) {
    super();
    this.pos = position;
    this.text = text;
    this.map = map;
    this.setMap(map);
  }

  override onAdd(): void {
    this.div = document.createElement("div");
    this.div.style.position = "absolute";
    this.div.style.padding = "0px 0px";
    this.div.style.fontSize = "14px";
    this.div.style.fontFamily = "Arial, sans-serif";
    this.div.style.whiteSpace = "nowrap";
    this.div.style.color = "black"; // Set text color
    this.div.style.background = "transparent"; // Make the background transparent
    this.div.style.zIndex = "10";
    this.div.style.border = "none"; // No border
    this.div.style.textShadow = "1px 1px 2px rgba(255, 255, 255, 0.7)"; // Optional: Text shadow for better visibility
    this.div.innerText = this.text;

    // Append to overlay layer
    const panes = this.getPanes();
    if (panes) {
      panes.overlayMouseTarget.appendChild(this.div);
    }
  }

  override draw(): void {
    if (!this.div) return;

    const overlayProjection = this.getProjection();
    const point = overlayProjection.fromLatLngToDivPixel(this.pos);

    if (point) {
      // Get width and height of the text box
      const divWidth = this.div.offsetWidth;
      const divHeight = this.div.offsetHeight;

      // Center the text at the given position
      this.div.style.left = `${point.x - divWidth / 2}px`;
      this.div.style.top = `${point.y - divHeight / 2}px`;
    }
  }

  override onRemove(): void {
    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }
  }

  setText(newText: string): void {
    if (this.div) {
      this.div.innerText = newText;
    }
    this.text = newText;
  }

  setPosition(position: google.maps.LatLng): void {
    // if (this.div) {
    //   this.div.innerText = newText;
    // }
    this.pos = position;
    //this.draw();
  }
}
