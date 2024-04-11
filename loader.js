// Create the script tag, set the appropriate attributes
var script = document.createElement('script');
const apikey = process.env.API_KEY;
console.log(apikey);
script.src = 'https://maps.googleapis.com/maps/api/js?key=' + apikey + '&callback=initialize&libraries=marker&v=weekly';
script.async = true;

// Attach your callback function to the `window` object
window.initMap = function() {
  // JS API is loaded and available
};

// Append the 'script' element to 'head'
document.head.appendChild(script);
      
// src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCQjsvRjp2nExEjmdTJE-yAjS-6fWmyNrk&callback=initialize&libraries=marker&v=weekly"
