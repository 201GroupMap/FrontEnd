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

var parseItin = function(itin_json) {
	var itins = JSON.parse(itin_json);
	var myitin = itins.myitin;
	var publicitin = itins.publicitin;
	var tempitin;
	for(tempitin in myitin) {
		$("#myitin").append(
			renderItin(tempitin.imagelink, tempitin.itin_name, 
				tempitin.star_num, tempitin.itin_href));
	}
	for(tempitin in publicitin) {
		$("#publicitin").append(
			renderItin(tempitin.imagelink, tempitin.itin_name, 
				tempitin.star_num, tempitin.itin_href));
	}
}

for(var i=0;i<10;++i) {
	$("#myitin").append(
		renderItin("http://www.herl.pitt.edu/sites/default/files/images/map-close.jpg",
		 "itin_1", 3, "http://www.google.com"));
}

