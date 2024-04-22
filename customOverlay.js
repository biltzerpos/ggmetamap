// custom-overlay.js
function CustomOverlay(map, position) {
  this.map = map;
  //this.position = position;
  this.position = { lat: -34.397, lng: 150.644 };
  this.div = document.createElement('div');
  this.div.className = 'labeloverlay';
  this.div.textContent = 'Your Text Here';

  // Add overlay to the map
  this.setMap(map);
}

CustomOverlay.prototype = new google.maps.OverlayView();

CustomOverlay.prototype.onAdd = function () {
  this.getPanes().floatPane.appendChild(this.div);
};

CustomOverlay.prototype.draw = function () {
  var overlayProjection = this.getProjection();
  var pixelPosition = overlayProjection.fromLatLngToDivPixel(this.position);
  this.div.style.left = pixelPosition.x + 'px';
  this.div.style.top = pixelPosition.y + 'px';
};

CustomOverlay.prototype.onRemove = function () {
  this.div.parentNode.removeChild(this.div);
};

