import { getGlobals, countryMenu, layerMenu, auxButton, flags, settings } from '../globals';
import { zoom, clearSecondaryLayer, loadGeoJsonString, loadGeoJSONFile } from '../geojsonFacilities';
import { showAuxButton } from '../index';
import { loadMarkerLayer, placeNewMarker } from '../markerFacilities';
import { markerInMiddle, thickBlue } from '../postprocess';
import { Country } from './Country';
import { Layer } from './Layer';
import { partial, colog, calculateDistance } from '../utilities';
//import { TxtOverlay } from '../TxtOverlay';

export class SouthKorea extends Country {

  private constructor() {
    super();
    this.mainGeoJSONpath = '/Layers/South Korea/Level1.geojson';
    this.layers.push(new Grid());
  }

  public static override getInstance(): SouthKorea {
    return this.instance ? this.instance : (this.instance = new SouthKorea());
  }

  public sandbox(): void {
    loadGeoJSONFile('/Layers/South Korea/Level2.geojson', "boundaryLayer", partial(markerInMiddle, "NAME_2", true));
  }
}

class Grid extends Layer {

  // private originLat = 35.3;
  // private originLng = 129;
  private originLat = 33.496;
  private middleLat = 35.919544; // correspond to grid 35
  private middleLng = 127.971095; // corresponds to grid 44
  private recs: google.maps.Rectangle[] = [];
  //private allTxtOverlays: TxtOverlay[][] = [];

  public constructor() {
    super();
    this.displayName = "Grid";
  }

  private showBorders: boolean = false;

  public show(): void {
    // const p1 = this.getPoint(new google.maps.LatLng(this.originLat, this.originLng), 200, "south");
    // const p2 = this.getPoint(p1, 400, "west");
    // colog(p2);
    //flags.displayPopups = false;
    //showAuxButton("Show Province borders", this.auxBehaviour);
    //loadMarkerLayer(countryMenu.value, layerMenu.value);
    const startLat = 35.5;
    const startLng = 128;
    const start = new google.maps.LatLng(startLat, startLng);
    const start2 = this.getPoint(this.getPoint(start, 30, "north"), 30, "east");
    const boundsCenter = new google.maps.LatLngBounds(start, start2);

    for (let i = 0; i < 9; i++) {

      const rectangleCenter = new google.maps.Rectangle({
        bounds: boundsCenter,
        map: getGlobals().map,
        editable: true,
        draggable: true,
        zIndex: 5,
        fillOpacity: 0,
        strokeColor: 'red'
      });
      this.recs.push(rectangleCenter);
      //this.allTxtOverlays.push([]);
      for (let j = 0; j < 8; j++) {
        //const txtOverlay = new TxtOverlay(new google.maps.LatLng(0, 0), "", null);
        //this.allTxtOverlays[i].push(txtOverlay);
      }
    }
    this.drawrecs(start, start2);
    this.recs[0].addListener("bounds_changed", () => {
      const bounds = this.recs[0].getBounds();
      if (bounds) {
        this.drawrecs(bounds.getSouthWest(), bounds.getNorthEast());
      }
    });
  }

  private drawrecs(midSW: google.maps.LatLng, midNE: google.maps.LatLng) {
    //this.drawtxtOverlays(this.allTxtOverlays[0], new google.maps.LatLngBounds(midSW, midNE));
    const rec1bounds = new google.maps.LatLngBounds(
      this.getPoint(midSW, 200, "north"),
      this.getPoint(midNE, 200, "north")
    );
    this.recs[1].setBounds(rec1bounds);
    //this.drawtxtOverlays(this.allTxtOverlays[1], rec1bounds);
    this.recs[2].setBounds(new google.maps.LatLngBounds(
      this.getPoint(midSW, 200, "south"),
      this.getPoint(midNE, 200, "south")
    ));
    this.recs[3].setBounds(new google.maps.LatLngBounds(
      this.getPoint(midSW, 200, "east"),
      this.getPoint(midNE, 200, "east")
    ));
    this.recs[4].setBounds(new google.maps.LatLngBounds(
      this.getPoint(midSW, 200, "west"),
      this.getPoint(midNE, 200, "west")
    ));
    this.recs[5].setBounds(new google.maps.LatLngBounds(
      this.getPoint(this.getPoint(midSW, 200, "north"), 200, "east"),
      this.getPoint(this.getPoint(midNE, 200, "north"), 200, "east")
    ));
    this.recs[6].setBounds(new google.maps.LatLngBounds(
      this.getPoint(this.getPoint(midSW, 200, "north"), 200, "west"),
      this.getPoint(this.getPoint(midNE, 200, "north"), 200, "west")
    ));
    this.recs[7].setBounds(new google.maps.LatLngBounds(
      this.getPoint(this.getPoint(midSW, 200, "south"), 200, "east"),
      this.getPoint(this.getPoint(midNE, 200, "south"), 200, "east")
    ));
    this.recs[8].setBounds(new google.maps.LatLngBounds(
      this.getPoint(this.getPoint(midSW, 200, "south"), 200, "west"),
      this.getPoint(this.getPoint(midNE, 200, "south"), 200, "west")
    ));
  }

  // private drawtxtOverlays(txtOverlays: TxtOverlay[], bounds: google.maps.LatLngBounds) {
  //   colog(txtOverlays);
  //   colog(txtOverlays[0]);
  //   colog(bounds);
  //   // 0-1:north
  //   txtOverlays[0].setMap(null);
  //   txtOverlays[1].setMap(null);
  //   const gridNorth = Math.trunc((this.latitudeDistanceKm(bounds.getNorthEast().lat(), this.originLat) / 2) % 100);
  //   let gridNorthText = gridNorth.toString();
  //   if (gridNorthText.length == 1) gridNorthText = "0" + gridNorthText;
  //   txtOverlays[0].setText(gridNorthText);
  //   txtOverlays[1].setText(gridNorthText);
  //   txtOverlays[0].setPosition(new google.maps.LatLng(
  //     bounds.getNorthEast().lat(),
  //     (3 * bounds.getNorthEast().lng() + bounds.getSouthWest().lng()) / 4
  //   ));
  //   txtOverlays[1].setPosition(new google.maps.LatLng(
  //     bounds.getNorthEast().lat(),
  //     (bounds.getNorthEast().lng() + 3 * bounds.getSouthWest().lng()) / 4
  //   ));
  //   txtOverlays[0].setMap(getGlobals().map);
  //   txtOverlays[1].setMap(getGlobals().map);
  //   // 2-3:south
  //   txtOverlays[2].setMap(null);
  //   txtOverlays[3].setMap(null);
  //   const gridSouth = Math.trunc((this.latitudeDistanceKm(bounds.getSouthWest().lat(), this.originLat) / 2) % 100);
  //   let gridSouthText = gridSouth.toString();
  //   if (gridSouthText.length == 1) gridSouthText = "0" + gridSouthText;
  //   txtOverlays[2].setText(gridSouthText);
  //   txtOverlays[3].setText(gridSouthText);
  //   txtOverlays[2].setPosition(new google.maps.LatLng(
  //     bounds.getSouthWest().lat(),
  //     (3 * bounds.getNorthEast().lng() + bounds.getSouthWest().lng()) / 4
  //   ));
  //   txtOverlays[3].setPosition(new google.maps.LatLng(
  //     bounds.getSouthWest().lat(),
  //     (bounds.getNorthEast().lng() + 3 * bounds.getSouthWest().lng()) / 4
  //   ));
  //   txtOverlays[2].setMap(getGlobals().map);
  //   txtOverlays[3].setMap(getGlobals().map);
  //   // 4-5:west
  //   txtOverlays[4].setMap(null);
  //   txtOverlays[5].setMap(null);
  //   const distToMiddle = this.preciseLongitudeDistanceKm(bounds.getSouthWest().lng(), this.middleLng, this.middleLat);
  //   const gridPointsOff = Math.trunc((distToMiddle / 2));
  //   let gridWest = 0;
  //   if (bounds.getSouthWest().lng() < this.middleLng) {
  //     gridWest = 44 - gridPointsOff;
  //     while (gridWest < 0) gridWest += 100;
  //   } else {
  //     gridWest = 44 + gridPointsOff;
  //     while (gridWest > 99) gridWest -= 100;
  //   }
  //   let gridWestText = gridWest.toString();
  //   if (gridWestText.length == 1) gridWestText = "0" + gridWestText;
  //   txtOverlays[4].setText(gridWestText);
  //   txtOverlays[5].setText(gridWestText);
  //   txtOverlays[4].setPosition(new google.maps.LatLng(
  //     (3 * bounds.getNorthEast().lat() + bounds.getSouthWest().lat()) / 4,
  //     bounds.getSouthWest().lng()
  //   ));
  //   txtOverlays[5].setPosition(new google.maps.LatLng(
  //     (bounds.getNorthEast().lat() + 3 * bounds.getSouthWest().lat()) / 4,
  //     bounds.getSouthWest().lng()
  //   ));
  //   txtOverlays[4].setMap(getGlobals().map);
  //   txtOverlays[5].setMap(getGlobals().map);
  //   // 6-7:west
  //   txtOverlays[6].setMap(null);
  //   txtOverlays[7].setMap(null);
  //   const distToMiddle2 = this.preciseLongitudeDistanceKm(bounds.getNorthEast().lng(), this.middleLng, this.middleLat);
  //   const gridPointsOff2 = Math.trunc((distToMiddle2 / 2));
  //   let gridEast = 0;
  //   if (bounds.getNorthEast().lng() < this.middleLng) {
  //     gridEast = 44 - gridPointsOff2;
  //     while (gridEast < 0) gridEast += 100;
  //   } else {
  //     gridEast = 44 + gridPointsOff2;
  //     while (gridEast > 99) gridEast -= 100;
  //   }
  //   let gridEastText = gridEast.toString();
  //   if (gridEastText.length == 1) gridEastText = "0" + gridEastText;
  //   txtOverlays[6].setText(gridEastText);
  //   txtOverlays[7].setText(gridEastText);
  //   txtOverlays[6].setPosition(new google.maps.LatLng(
  //     (3 * bounds.getNorthEast().lat() + bounds.getSouthWest().lat()) / 4,
  //     bounds.getNorthEast().lng()
  //   ));
  //   txtOverlays[7].setPosition(new google.maps.LatLng(
  //     (bounds.getNorthEast().lat() + 3 * bounds.getSouthWest().lat()) / 4,
  //     bounds.getNorthEast().lng()
  //   ));
  //   txtOverlays[6].setMap(getGlobals().map);
  //   txtOverlays[7].setMap(getGlobals().map);
  // }

  private latitudeDistanceKm(lat1: number, lat2: number): number {
    const kmPerDegree = 111.32; // Approximate distance in km per 1 degree of latitude
    return Math.abs((lat2 - lat1)) * kmPerDegree;
  }

  private longitudeDistanceKm(lon1: number, lon2: number, lat: number): number {
    const kmPerDegreeAtEquator = 111.32; // Approximate km per degree of latitude
    const latRadians = (Math.PI / 180) * lat; // Convert latitude to radians

    // Adjust longitude distance based on latitude
    const kmPerDegreeLongitude = kmPerDegreeAtEquator * Math.cos(latRadians);

    return Math.abs(lon2 - lon1) * kmPerDegreeLongitude;
  }

  private preciseLongitudeDistanceKm(lon1: number, lon2: number, lat: number): number {
    const R = 6371; // Earth's radius in km
    const latRadians = (Math.PI / 180) * lat; // Convert latitude to radians

    // Convert longitude difference to radians
    const deltaLon = Math.abs(lon2 - lon1) * (Math.PI / 180);

    // Compute the arc length at given latitude
    const distance = R * Math.cos(latRadians) * deltaLon;

    return distance;
  }

  public sandbox(): void { }

  public auxBehaviour(): void {
    this.showBorders = !this.showBorders;
    if (this.showBorders) {
      auxButton.textContent = "Hide Province Borders";
      loadGeoJSONFile('/Layers/Indonesia/Level1.geojson', "secondaryLayer", thickBlue);
    }
    else {
      clearSecondaryLayer();
      auxButton.textContent = "Show Province Borders";
    }
  }

  private getPoint(
    start: google.maps.LatLng,
    distanceKm: number,
    direction: "north" | "south" | "east" | "west"): google.maps.LatLng {

    const R = 6371; // Earth's radius in km
    const delta = distanceKm / R; // Angular distance in radians

    const latRad = (start.lat() * Math.PI) / 180;
    const lonRad = (start.lng() * Math.PI) / 180;

    let newLatRad = latRad;
    let newLonRad = lonRad;

    switch (direction) {
      case "north":
        newLatRad = latRad + delta;
        break;
      case "south":
        newLatRad = latRad - delta;
        break;
      case "east":
        newLonRad = lonRad + delta / Math.cos(latRad);
        break;
      case "west":
        newLonRad = lonRad - delta / Math.cos(latRad);
        break;
    }

    return new google.maps.LatLng((newLatRad * 180) / Math.PI, (newLonRad * 180) / Math.PI);
  }

}
