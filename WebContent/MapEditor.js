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
  this.startSearchBarWrapper = document.getElementById("start-search-bar-wrapper");
  this.endSearchBarWrapper = document.getElementById("end-search-bar-wrapper");
  this.startPanelContainer = document.getElementById("start-panel");
  this.endPanelContainer = document.getElementById("end-panel");

  this.searchResultMarkers = [];
}

MapEditor.prototype.init = function () {
  this.initMap();
  this.initSearchBars();
  this.data = {};

  this.directionsDisplay = new google.maps.DirectionsRenderer();
  this.directionsDisplay.setMap(this.map);
  this.directionsService = new google.maps.DirectionsService();

  this.routeBounds = [];
  this.placesService = new google.maps.places.PlacesService(this.map);

  this.stops = new Map();
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
  });

  this.map.addListener("idle", () => {
    this.activeBounds = [];
    let mapBounds = this.map.getBounds();
    for (let i = 0; i < this.routeBounds.length; i++) {
      if (mapBounds.contains(this.routeBounds[i].getCenter())) {
        this.activeBounds.push(this.routeBounds[i]);
      }
    }
    /*
    if (this.activeBounds.length < 10) {
      $("#search-button").prop("disabled", false);
    } else {
      $("#search-button").prop("disabled", true);
    }
    */
    console.log("active bounds are", this.activeBounds);
    //this.routeSearch();
  });
}

MapEditor.prototype.routeSearch = function () {
  // Clear previous search results
  this.searchResults = [];
  this.searchResultMarkers.forEach((marker) => {
    marker.setMap(null);
  });
  this.activeBounds.forEach((bounds, index) => {
    this.searchWithDelay(bounds, index * 400);
  });
}

MapEditor.prototype.searchWithDelay = function (bounds, delay) {
  let request = {
    bounds: bounds,
    radius: getSearchRadius(),
    rankBy: google.maps.places.RankBy.PROMINENCE,
    name: "attraction"
  };
  setTimeout(() => {
    this.placesService.nearbySearch(request, (data, status) => {
      console.log("Status is", status);
      if (status !== "OK") return;
      data.forEach((place) => {
        if (!place.types.includes("point_of_interest")) return;
        let marker = new google.maps.Marker({
          map: this.map,
          // title: place.name,
          position: place.geometry.location,
          //optimized: false,
          place: {
            location: place.geometry.location,
            placeId: place.place_id
          }
        });

        marker.addListener("click", function () {
          this.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(() => {this.setAnimation(null); }, 750);
        });

        // Click listener to add stop
        let self = this;
        marker.addListener("click", function () {
          self.addStop(this.getPlace());
        })

        let contentString = `
          <div class="infowindow-main-wrapper">
            <div class="infowindow-img-wrapper">
              ${place.photos ?
                `<img class="infowindow-img" src="${place.photos[0].getUrl({
                    maxWidth: 100,
                    maxWidth: 100
                })}"/ >`
                :
                ""
              }
            </div>
            <div class="infowindow-content-wrapper">
              <h3>${place.name}</h3>
              ${place.vicinity ? `<p>${place.vicinity}</p>` : ""}
              ${place.rating ? `<p>${place.rating}</p>` : ""}
            </div>
          </div>
        `;

        let infoWindow = new google.maps.InfoWindow({
          content: contentString
        });

        marker.addListener("mouseover", function (event) {
          infoWindow.open(self.map, this);
        });

        marker.addListener("mouseout", function () {
          infoWindow.close();
        });

        this.searchResultMarkers.push(marker);
      });
      this.searchResults = this.searchResults.concat(data);
      console.log(this.searchResults);
    })
  } , delay);
}

MapEditor.prototype.addStop = function (place) {
  console.log("Adding new stop", place);
  this.stops.set(place.placeId, place);
  if (this.stops.size === 1) {
    // show Stops panel
    $("#stops-panel").slideDown();
  }
}

MapEditor.prototype.showActiveBounds = function () {
  this.routeBounds.forEach((bound) => {
    let marker = new google.maps.Marker({
      map: this.map,
      title: "bounds marker",
      position: bound.getCenter(),
      optimized: false,
      animation: google.maps.Animation.DROP,
    });
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
    <p>
      ${name}<br />
      ${address}
    </p>
  `);
  $(this.startPanelContainer).find(".panel-img-wrapper").empty();
  if (photos) {
    let imgUrl = photos[0].getUrl({
        maxWidth: 120,
        maxWidth: 120
    });
    $(this.startPanelContainer).find(".panel-img-wrapper").append(`<img src="${imgUrl}">`)
  }
  $(this.startSearchBarWrapper).slideUp("fast");
  $("#start-panel-content").click(function () {
    $("#start-search-bar-wrapper").slideDown("fast");
  });
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
    <p>
      ${name}<br />
      ${address}
    </p>
  `);
  $(this.endPanelContainer).find(".panel-img-wrapper").empty();
  if (photos) {
    let imgUrl = photos[0].getUrl({
        maxWidth: 120,
        maxWidth: 120
    });
    $(this.endPanelContainer).find(".panel-img-wrapper").append(`<img src="${imgUrl}">`)
  }
  $(this.endSearchBarWrapper).slideUp("fast");
  $("#end-panel-content").click(function () {
    $("#end-search-bar-wrapper").slideDown("fast");
  });
  this.drawRoute();
}

MapEditor.prototype.drawRoute = function () {
  if (typeof(this.data.start) === "undefined" ||
      typeof(this.data.end) === "undefined") {
    return;
  }
  this.clearMarkers();
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
    this.routeBounds = rb.box(result.routes[0].overview_path, getSearchRadius());
    //this.routeSearch();
  });
}

MapEditor.prototype.getPlaceInfo = function (placeId, callback) {
  let request = {placeId: placeId};
  this.placesService.getDetails(request, callback);
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
