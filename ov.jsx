const { OverlayView } = await google.maps.importLibrary("maps");

export default class TxtOverlay extends OverlayView {
    map;
    div;
    position;
    text;
    className;
    fszl;
    constructor(pos, txt, cls, fszl, map) {
      super();
      this.position = pos;
      this.text = txt;
        this.className = cls;
        this.fszl = fszl;
        this.map = map;
      this.div = null;
    }
    /**
     * onAdd is called when the map's panes are ready and the overlay has been
     * added to the map.
     */
    onAdd() {
      this.div = document.createElement("div");
      this.div.style.borderStyle = "none";
      this.div.style.borderWidth = "0px";
      //this.div.style.position = "absolute";
        this.div.style.transformOrigin = "top left";
      this.div.className = this.className;
        this.div.innerHTML = this.text;
        

      // Create the img element and attach it to the div.
      //const img = document.createElement("img");

      //img.src = this.image;
      //img.style.width = "100%";
      //img.style.height = "100%";
      //img.style.position = "absolute";
      //this.div.appendChild(img);

      // Add the element to the "overlayLayer" pane.
      const panes = this.getPanes();
      panes.floatPane.appendChild(this.div);
    }

    draw() {
        //const fontSize = this.map.getZoom();
        //const fontSizeValue = fontSize + 'px';
        //console.log(fontSizeValue);
        //this.div.style.setProperty('--textSize', fontSizeValue);
        //this.div.style.fontSize = fontSizeValue;
        let sc = 1;
        let zoom = this.map.getZoom() - this.fszl;
        if (zoom < 0) sc = Math.pow(2, zoom);
        //let sc = Math.pow(2, this.map.getZoom());
        //console.log("sc" + sc);
        let transform = "scale(" + sc + "," + sc + ")";
        this.div.style.transform = transform;
        var overlayProjection = this.getProjection();
        var pixelPosition = overlayProjection.fromLatLngToDivPixel(this.position);
        
        const rect = this.div.getBoundingClientRect();
        const left = Math.floor(pixelPosition.x - rect.width / 2.0);
        const top = Math.floor(pixelPosition.y - rect.height / 2.0);
        this.div.style.left = left + 'px';
        this.div.style.top = top + 'px';
        
        
    }

    /**
     * The onRemove() method will be called automatically from the API if
     * we ever set the overlay's map property to 'null'.
     */
    onRemove() {
      if (this.div) {
        this.div.parentNode.removeChild(this.div);
        delete this.div;
      }
    }

    hide() {
      if (this.div) {
        this.div.style.visibility = "hidden";
      }
    }

    show() {
      if (this.div) {
        this.div.style.visibility = "visible";
      }
    }

    toggle() {
      if (this.div) {
        if (this.div.style.visibility === "hidden") {
          this.show();
        } else {
          this.hide();
        }
      }
    }

    toggleDOM(map) {
      if (this.getMap()) {
        this.setMap(null);
      } else {
        this.setMap(map);
      }
    }
}
