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
    m.routeSearch();
  });
  $("#itinerary-name-input").change(function () {
    m.setName($(this).val());
  });
  $("#itinerary-settings-button").click(function () {
    $("#settings-modal").modal("show");
  });
  $("#save-button").click(function () {
    $("#settings-modal").modal("hide");
    m.save();
  });
});

function getSearchRadius() {
  return $("#route-search-radius-select").find(":selected").val();
}
