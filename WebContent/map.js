$(document).ready(function () {
  $(".route-option").click(function () {
    $(this).toggleClass("route-option-clicked");
  });
  /*
  $(".route-option").hover(function () {
    if (!$(this).hasClass("route-option-clicked")) {
      $(this).css("background-color", "#eeeeee");
    }
  }, function () {
    if (!$(this).hasClass("route-option-clicked")) {
      $(this).css("background-color", "initial");
    }
  });
  */
  $("#route-search-button").click(function () {
    console.log("go button clicked");
    m.routeSearch();
  });
  $("#itinerary-name-input").change(function () {
    m.setName($(this).val());
  });
  $("#itinerary-settings-button").click(function () {
    $("#settings-modal").modal("show");
  });

  $("#home-button").click(function () {
    window.location = "homepage.html";
  });

  $("#settings-button").click(function () {
    $("#settings-modal").modal("show");
  });

  $("#save-button").click(function () {
    m.save();
  });

  $("#shared-users-input").on("keyup", function (e) {
    if (e.keyCode == 13) {
      let username = $(this).val();
      m.addSharedUser(username);
      $(this).val("");
    }
  });
});

function getSearchRadius() {
  return $("#route-search-radius-select").find(":selected").val();
}
