const API_KEY = "AIzaSyAMNN3WNSG_h7EX8RXhI3s9ux7Q6Hyqg1s";
const MARKER_ICON_URL = "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png";
const USC_COORDS = {lat: 34.021707, lng: -118.288242};
const SIDEBAR_WIDTH = 400;
const PHOTO_WIDTH = 200;

var m = new MapEditor();

function MapEditor () {
  this.mapContainer = document.getElementById("map");
  this.startSearchBarContainer = document.getElementById("start-search-bar");
  this.endSearchBarContainer = document.getElementById("end-search-bar");
  this.startPanelContainer = document.getElementById("start-panel");
  this.endPanelContainer = document.getElementById("end-panel");
}

MapEditor.prototype.init = function () {
  this.initMap();
  this.initSearchBars();
  this.data = {};

  this.directionsDisplay = new google.maps.DirectionsRenderer();
  this.directionsDisplay.setMap(this.map);
  this.directionsService = new google.maps.DirectionsService();
}

MapEditor.prototype.initMap = function () {
  this.map = new google.maps.Map(this.mapContainer, {
    center: USC_COORDS,
    zoom: 13,
    mapTypeId: "roadmap"
  });
}

MapEditor.prototype.initSearchBars = function () {
  this.startSearchBar = new google.maps.places.SearchBox(
    this.startSearchBarContainer
  );
  this.startSearchBar.addListener("places_changed", this.updateSearchStart.bind(this));

  this.endSearchBar = new google.maps.places.SearchBox(
    this.endSearchBarContainer
  );
  this.endSearchBar.addListener("places_changed", this.updateSearchEnd.bind(this));
  this.markers = [];

  this.map.addListener("bounds_changed", () => {
    this.startSearchBar.setBounds(this.map.getBounds());
    this.endSearchBar.setBounds(this.map.getBounds());
    this.activeBounds = [];
    let mapBounds = this.map.getBounds();
    for (let i = 0; i < this.routeBounds.length; i++) {
      if (mapBounds.contains(this.routeBounds[i].getCenter())) {
        this.activeBounds.push(this.routeBounds[i]);
      }
    }
    console.log(this.routeBounds);
  });
}

MapEditor.prototype.updateSearchStart = function () {
  let places = this.startSearchBar.getPlaces();
  console.log(places);
  if (places.length === 0) return;
  this.clearMarkers();
  this.searchBounds = new google.maps.LatLngBounds();
  if (places.length === 1) {
    this.addMarker(false, places[0]);
    this.addStart(places[0]);
  } else {
    places.forEach(this.addMarker.bind(this, this.addStart));
  }
  this.map.fitBounds(this.searchBounds);
}

MapEditor.prototype.updateSearchEnd = function () {
  let places = this.endSearchBar.getPlaces();
  if (places.length === 0) return;
  this.clearMarkers();
  this.searchBounds = new google.maps.LatLngBounds();
  if (places.length === 1) {
    this.addMarker(false, places[0]);
    this.addEnd(places[0]);
  } else {
    places.forEach(this.addMarker.bind(this, this.addEnd));
  }
  this.map.fitBounds(this.searchBounds);
}

MapEditor.prototype.addMarker = function (callback, place) {
  if (!place.geometry) return;
  console.log(place);
  let marker = new google.maps.Marker({
    map: this.map,
    title: place.name,
    position: place.geometry.location,
    optimized: false,
    animation: google.maps.Animation.DROP,
    place: {
      location: place.geometry.location,
      placeId: place.place_id
    }
  });

  let self = this;
  marker.addListener("click", function () {
    this.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => {this.setAnimation(null); }, 750);
  })
  if (callback) {
    marker.addListener('click', function (event) {
      console.log("marker context", this);
      console.log("marker click event", event);
      console.log(this.getPlace());
      $(".location-confirm-tooltip").remove();
      let mouseEvent = event.va;
      let title = this.title;
      let tooltip = $("<div></div>");
      tooltip.addClass("location-confirm-tooltip")
             .addClass("popover")
             .addClass("popover-right");
      tooltip.append(`
        <h3 class="popover-title">Select this location?</h3>
        <div class="popover-content">
          <p id="tooltip-text"></p>
          <button id="confirm" type="button" class="btn btn-success">Yes!</button>
        </div>`);
      let tooltipPosition = self.getTooltipPosition(mouseEvent);
      tooltip.css(tooltipPosition);

      let placeId = this.getPlace().placeId;
      self.getPlaceInfo(placeId, function (data) {
        let name = data.name;
        let address = data.formatted_address;
        let photos = data.photos;
        $("#tooltip-text").html(`
          ${name}<br />
          ${address}
          `)
        console.log(data);
        /*
        console.log(data.photos[0].getUrl({
            maxWidth: 640
        }));
        */
      });

      $("#tooltip-container").append(tooltip);
      $("#confirm").click(function () {
        $(".location-confirm-tooltip").remove();
        callback.call(self, place);
      });
    });
  }

    this.markers.push(marker);

    if (place.geometry.viewport) {
      this.searchBounds.union(place.geometry.viewport);
    } else {
      this.searchBounds.extend(place.geometry.location);
    }
  }

MapEditor.prototype.addStart = function (place) {
  console.log("Setting start location as", place);
  this.data.start = place;
  let name = place.name;
  let address = place.formatted_address;
  let photos = place.photos;
  $(this.startSearchBarContainer).val("");
  $(this.startSearchBarContainer).attr("placeholder", "Update Starting Point");
  $(this.startPanelContainer).find(".panel-address").html(`
    ${name}<br />
    ${address}
  `);
  this.drawRoute();
}

MapEditor.prototype.addEnd = function (place) {
  console.log("Setting end location as", place);
  this.data.end = place;
  let name = place.name;
  let address = place.formatted_address;
  let photos = place.photos;
  $(this.endSearchBarContainer).val("");
  $(this.endSearchBarContainer).attr("placeholder", "Update Destination");
  $(this.endPanelContainer).find(".panel-address").html(`
    ${name}<br />
    ${address}
  `);
  this.drawRoute();
}

MapEditor.prototype.drawRoute = function () {
  if (typeof(this.data.start) === "undefined" ||
      typeof(this.data.end) === "undefined") {
    return;
  }
  let request = {
    origin: {placeId: this.data.start.place_id},
    destination: {placeId: this.data.end.place_id},
    travelMode: "DRIVING"
  };
  this.directionsService.route(request, (result, status) => {
    console.log(result);
    this.directions = result;
    if (status === "OK") this.directionsDisplay.setDirections(result);
    let rb = new RouteBoxer();
    this.routeBounds = rb.box(result.routes[0].overview_path, 10);
    let bounds = [];
    for (let i = 0; i < this.routeBounds.length; i++) {

      let mapBounds = this.map.getBounds();
      if (mapBounds.contains(this.routeBounds[i].getCenter())) {
        bounds.push(this.routeBounds[i]);
        let marker = new google.maps.Marker({
          map: this.map,
          title: "bounds marker",
          position: this.routeBounds[i].getCenter(),
          optimized: false,
          animation: google.maps.Animation.DROP,
        });
      }
    }



    console.log("Bounds within the screen are: ", bounds);
  });
}

MapEditor.prototype.getPlaceInfo = function (placeId, callback) {
  let request = {placeId: placeId};
  let service = new google.maps.places.PlacesService(this.map);
  service.getDetails(request, callback);
}

MapEditor.prototype.getTooltipPosition = function (mouseEvent) {
  let top = mouseEvent.pageY - 15;
  let left = mouseEvent.pageX - SIDEBAR_WIDTH + 15;
  return {top: top, left: left};
}

MapEditor.prototype.clearMarkers = function () {
  this.markers.forEach((marker) => {
    marker.setMap(null);
  });
  this.markers = [];
}
