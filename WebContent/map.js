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
  $("#search-button").click(function () {
    m.routeSearch();
  });
});

function getSearchRadius() {
  return $('input[name=search-radius]:checked').val();
}
