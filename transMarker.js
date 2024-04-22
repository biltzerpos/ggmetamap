const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
class TransMarker extends google.maps.marker.AdvancedMarkerElement {
  createMarker() {
    // Create a custom marker with a transparent background and text
    const marker = super.createMarker();
    
    marker.innerHTML = 'Your Text Here'; // Set the text content

    // Style the marker to have a transparent background and only text displayed
    marker.style.background = 'none';
    marker.style.color = 'black'; // Set the text color
    marker.style.fontSize = '12px'; // Set the font size
    marker.style.fontWeight = 'bold'; // Set the font weight

    return marker;
  }
}

export default TransMarker;
