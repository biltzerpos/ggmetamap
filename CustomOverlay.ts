await google.maps.importLibrary("maps");

export class CustomOverlay extends google.maps.OverlayView {
    private position: google.maps.LatLng;
    private div: HTMLElement | null;
    private fixedPosition: boolean = false;
    private x: number | undefined;
    private y: number | undefined;

    constructor(position: google.maps.LatLng, div: HTMLElement, fixedPosition?: boolean, fixedX?: number, fixedY?: number) {
        super();
        this.position = position;
        this.div = div;
        if (fixedPosition && fixedX !== undefined && fixedY !== undefined) {
            this.fixedPosition = true;
            this.x = fixedX;
            this.y = fixedY;
        }
    }

    // Called when the overlay is added to the map
    onAdd() {
        // Add the overlay to the map's overlay pane
        const panes = this.getPanes();
        if (this.div) panes?.overlayMouseTarget.appendChild(this.div);
    }

    // Called when the map is drawn
    draw() {
        if (!this.div) return;

        if (this.fixedPosition) {
            this.div.style.left = this.x + "px";
            this.div.style.top = this.y + "px";
        }
        else {
            const projection = this.getProjection();
            const position = projection.fromLatLngToDivPixel(this.position);

            if (position) {
                this.div.style.left = position.x + "px";
                this.div.style.top = position.y + "px";
            }
        }
    }

    // Called when the overlay is removed
    onRemove() {
        if (this.div) {
            this.div.parentNode?.removeChild(this.div);
            this.div = null;
        }
    }
}