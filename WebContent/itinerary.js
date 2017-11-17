/**
 * 
 */


var openItin = function(type) {
	$(".tabcontent").hide();
	$(".tablinks").removeClass("active");
	$("#"+type).show();
	$("#"+type+"button").addClass("active");
};

$("#myitinbutton").click();

var renderItin = function(imagelink, itin_name, star_num, itin_href) {
	var $div = $("<div>", {class:"itinerary"});
	var $container = $("<div>", {class:"container"})
	$container.append("<img src="+imagelink+">");
	$container.append("<div class='overlay'><div class='text'>View Itinerary</div></div>")
	$div.append($container);
	$div.append("<p>"+itin_name+"</p>")
	for(var i=0;i<star_num;++i) {
		$div.append("<span class='fa fa-star checked'></span>");
	}
	for(var i=0;i<5-star_num;++i) {
		$div.append("<span class='fa fa-star'></span>");
	}
	$div.append("<a href="+itin_href+"></a>");
	$div.click(function() {
		window.location = $(this).find("a").attr("href");
		return false;
	})
	return $div;
}

var parseItin = function(type, itin_json) {
	if(itin_json.length > 1) {
		for(let i=0;i<itin_json.length;++i) {
			let tempitin = JSON.parse(itin_json[i]);
			$("#"+type).append(
				renderItin(tempitin.thumbnail_url, "itin_1", 
				3, "http://www.google.com"));
		}
	}
	else {
		let tempitin = JSON.parse(itin_json);
		$("#"+type).append(
				renderItin(tempitin.thumbnail_url, "itin_1", 
				3, "http://www.google.com"));
	}
}

var noItin = function(type) {
	$("#"+type).append("<p>No itineraries available</p>");
}

var user = JSON.parse(localStorage.getItem("user"));
var user_name = user.name;
$("#profile_img").attr('src', user.picture);
let endpoint = "http://roadtrip-env.us-west-1.elasticbeanstalk.com/";
$.get(endpoint+"MyItinerary/"+user_name, function(data, status) {
		if(data.length!=0) {
			parseItin("myitin", data);
		}
		else noItin("myitin");
	});
$.get(endpoint+"PublicItinerary", function(data, status) {
		if(data.length!=0) {
			parseItin("publicitin", data);
		}
		else noItin("publicitin");
	});
