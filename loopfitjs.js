var myKey = 'AIzaSyDE5qnbWnKo48mH5G-2o1X8Au8XSAuAS7c';
var map;
var markers = [];
var homeMarker;
var routeCentre;
var directionsDisplay;
var firstGen = true;
var loopnum = 1;

//--------------------------------------------------------------------------

function initialise() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: -43.5321, lng: 172.6362},
		zoom: 13,
		mapTypeId: 'roadmap'
	});

	// Create the search box and link it to the UI element.
	var input = document.getElementById('pac-input');
	var searchBox = new google.maps.places.SearchBox(input);
	

	// Bias the SearchBox results towards current map's viewport.
	map.addListener('bounds_changed', function() {
	  searchBox.setBounds(map.getBounds());
	});

	
	// Listen for the event fired when the user selects a prediction and retrieve
	// more details for that place.
	searchBox.addListener('places_changed', function() {
	var places = searchBox.getPlaces();

	if (places.length == 0) {
	return;
	}

	// Clear out the old markers.
	markers.forEach(function(marker) {
		marker.setMap(null);
	});
	markers = [];

	// For each place, get the name and location.
	var bounds = new google.maps.LatLngBounds();
	places.forEach(function(place) {
	if (!place.geometry) {
	  console.log("Returned place contains no geometry");
	  return;
	}

	// Create a marker for each place.
	if (homeMarker){
		homeMarker.setMap(null);
	};

	homeMarker = new google.maps.Marker({
	  map: map,
	  title: place.name,
	  position: place.geometry.location
	});

	routeCentre = place.geometry.location;
	
	if (place.geometry.viewport) {
	  // Only geocodes have viewport.
	  bounds.union(place.geometry.viewport);
	} else {
	  bounds.extend(place.geometry.location);
	}
	  });
	  map.fitBounds(bounds);
	});

	
}

//-------------------------------------------------------------------------

function getLocation(){

	navigator.geolocation.getCurrentPosition(success, failure);

	function success(position){

		//get coords
		var myLat = position.coords.latitude;
		var myLong = position.coords.longitude;

		var latLng = new google.maps.LatLng(myLat, myLong);

		map.panTo(latLng);
		routeCentre = latLng;
		
		if (homeMarker){
			homeMarker.setMap(null);
		};

		homeMarker = new google.maps.Marker({
			map: map,
			position: latLng
		});

	}

	function failure(){
		$('#error').html = "<p>Cannot get position, please enter manually</p>";
	}
}

//------------------------------------------------------------------------

function createRoute(){
	if (firstGen != true){
		directionsDisplay.setMap(null);
	}

	var distance = document.getElementById('distanceField').value;

	if (distance > 5 & distance <= 10){
		var max = 3;
	}
	else if (distance > 10){
		var max = 4;
	}
	else {
		var max = 2;
	}

	var shape = pickShape(max);
	distance = (distance * 1000) * 0.85


	if (shape === 0){
		rectangle(distance);
	}
	else if (shape === 1){
		triangle(distance);
	}
	else if (shape === 2){
		circle(distance);
	}
	else if (shape === 3){
		fig8(distance);
	}


}

//------------------------------------------------------------------------

function pickShape(max){
	//shapes: 0 = rect, 1 = circle, 2 = triangle, 3 = fig8
	
	var min = Math.ceil(0);
	var max = Math.floor(max);

	var choice;
	choice = Math.floor(Math.random() * (max - min)) + min; 

	return choice;
}

//------------------------------------------------------------------------

function pickStart(numVertices){
	//get random starting point in shape
	
	var min = Math.ceil(1);
	var max = Math.floor(numVertices + 1);

	var choice;
	choice = Math.floor(Math.random() * (max - min)) + min; 

	return choice;
}

//------------------------------------------------------------------------

function havDist(lat1, lon1, lat2, lon2){

	function toRad(x){
	   return x * Math.PI / 180;
	}

	var R = 6371; // km 
	var x1 = lat2-lat1;
	var dLat = toRad(x1);  
	var x2 = lon2-lon1;
	var dLon = toRad(x2);  
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
	                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
	                Math.sin(dLon/2) * Math.sin(dLon/2);  
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c; 

	return d;

}
//------------------------------------------------------------------------
function findPointB(from, distance, theta){
	// distance in metres, theta bearing from North - ie north = 0, east = 90, south = 180, west = 270
	direction = (theta * Math.PI) / 180;

	var dx = distance * Math.sin(direction);  
	var dy = distance * Math.cos(direction);
	
	var dLat = dy / 110540; 
	var dLng = dx / (111320 * Math.cos(routeCentre.lng()));

	if (from.lng() > 0){
		dLng = -1 * dLng;
	}
	
	var originLat = from.lat();
	var originLng = from.lng();

	var bLat = originLat + dLat;
	var bLng = originLng + dLng;

	var bLatLng = new google.maps.LatLng({lat: bLat, lng: bLng});

	return bLatLng;

}
//------------------------------------------------------------------------

function rectangle(distance){

	/*
			1-----------------2
			|				  |
			|				  |
			|				  |
			3-----------------4
	*/

	var start = pickStart(4); // pick start point randomly out of vertices

	var min = Math.ceil(3);
	var max = Math.floor(8);
	var ratio = Math.floor(Math.random() * (max - min)) + min; 

	var heightRatio = ratio / 10;
	var widthRatio = (10 - ratio) / 10;

	var height = (distance * heightRatio) / 2;
	var width = (width * widthRatio) / 2;

	min = Math.ceil(-45);
	max = Math.floor(46);
	var randomOffset = Math.floor(Math.random() * (max - min)) + min;

	var route = [];

	if (start === 1) {
		route.push(routeCentre);
		var pt2 = findPointB(routeCentre, (0.5*(widthRatio * distance)), 90 + randomOffset);
		var pt3 = findPointB(routeCentre, (0.5*(heightRatio * distance)), 180 + randomOffset);
		var pt4 = findPointB(pt3, (0.5*(widthRatio * distance)), 90 + randomOffset);
		route.push(pt2);
		route.push(pt4);
		route.push(pt3);
	}

	else if (start === 2) {
		route.push(routeCentre);
		var pt1 = findPointB(routeCentre, (0.5*(widthRatio * distance)), 270 + randomOffset);
		var pt4 = findPointB(routeCentre, (0.5*(heightRatio * distance)), 180 + randomOffset);
		var pt3 = findPointB(pt4, (0.5*(widthRatio * distance)), 270 + randomOffset);
		route.push(pt4);
		route.push(pt3);
		route.push(pt1);
	}

	else if (start === 3) {
		route.push(routeCentre);
		var pt4 = findPointB(routeCentre, (0.5*(widthRatio * distance)), 90 + randomOffset);
		var pt1 = findPointB(routeCentre, (0.5*(heightRatio * distance)), 0 + randomOffset);
		var pt2 = findPointB(pt1, (0.5*(widthRatio * distance)), 90 + randomOffset);
		route.push(pt1);
		route.push(pt2);
		route.push(pt4);
	}

	else if (start === 4) {
		route.push(routeCentre);
		var pt3 = findPointB(routeCentre, (0.5*(widthRatio * distance)), 270 + randomOffset);
		var pt2 = findPointB(routeCentre, (0.5*(heightRatio * distance)), 0 + randomOffset);
		var pt1 = findPointB(pt2, (0.5*(widthRatio * distance)), 270 + randomOffset);
		route.push(pt3);
		route.push(pt1);
		route.push(pt2);
	} 

	drawRoute(route, distance);
}

//------------------------------------------------------------------------

function circle(distance){ 

	/*          1
			  /   \
			 /     \
			/		\
		   5	     2
			\       /
			 \     /
			  4---3
	*/
	
	var start = pickStart(5);	 // pick start point randomly out of vertices

	min = Math.ceil(-45);
	max = Math.floor(46);
	var randomOffset = Math.floor(Math.random() * (max - min)) + min;

	var route = [];
 
	if (start === 1) {
		route.push(routeCentre);
		var pt2 = findPointB(routeCentre, (0.2 * distance), 126 + randomOffset);
		var pt3 = findPointB(pt2, (0.2 * distance), 198 + randomOffset );
		var pt5 = findPointB(routeCentre, (0.2 * distance), 234 + randomOffset );
		var pt4 = findPointB(pt5, (0.2 * distance), 162 + randomOffset );
		route.push(pt2);
		route.push(pt3);
		route.push(pt4);
		route.push(pt5);

	}
	else if (start === 2) {														//here
		route.push(routeCentre);
		var pt1 = findPointB(routeCentre, (0.2 * distance), 306 + randomOffset);
		var pt3 = findPointB(routeCentre, (0.2 * distance), 198 + randomOffset);
		var pt5 = findPointB(pt1, (0.2 * distance), 234 + randomOffset);
		var pt4 = findPointB(pt5, (0.2 * distance), 162 + randomOffset);
		route.push(pt3);
		route.push(pt4);
		route.push(pt5);
		route.push(pt1);

	}
	else if (start === 3) {
		route.push(routeCentre);
		var pt2 = findPointB(routeCentre, (0.2 * distance), 18 + randomOffset);
		var pt1 = findPointB(pt2, (0.2 * distance), 306 + randomOffset);
		var pt5 = findPointB(pt1, (0.2 * distance), 234 + randomOffset);
		var pt4 = findPointB(pt5, (0.2 * distance), 162 + randomOffset);
		route.push(pt4);
		route.push(pt5);
		route.push(pt1);
		route.push(pt2);

	}
	else if (start === 4) {
		route.push(routeCentre);
		var pt5 = findPointB(routeCentre, (0.2 * distance), 342 + randomOffset);
		var pt1 = findPointB(pt5, (0.2 * distance), 54 + randomOffset);
		var pt2 = findPointB(pt1, (0.2 * distance), 126 + randomOffset);
		var pt3 = findPointB(pt2, (0.2 * distance), 198 + randomOffset);
		route.push(pt5);
		route.push(pt1);
		route.push(pt2);
		route.push(pt3);

	}
	else if (start === 5) {
		route.push(routeCentre);
		var pt1 = findPointB(routeCentre, (0.2 * distance), 54 + randomOffset);
		var pt4 = findPointB(routeCentre, (0.2 * distance), 162 + randomOffset);
		var pt2 = findPointB(pt1, (0.2 * distance), 126 + randomOffset);
		var pt3 = findPointB(pt2, (0.2 * distance), 198 + randomOffset);
		route.push(pt1);
		route.push(pt2);
		route.push(pt3);
		route.push(pt4);

	}


	drawRoute(route, distance);

}

//------------------------------------------------------------------------

function triangle(distance){

	/*          1
			  /   \
			 /     \
			/		\
		   3---------2
	*/

	var start = pickStart(3);

	min = Math.ceil(-30);
	max = Math.floor(30);
	var randomOffset = Math.floor(Math.random() * (max - min)) + min;

	var route = [];
 
	if (start === 1) {
		route.push(routeCentre);
		var pt2 = findPointB(routeCentre, (distance / 3), 150 + randomOffset );
		var pt3 = findPointB(routeCentre, (distance / 3), 210 + randomOffset );
		route.push(pt2);
		route.push(pt3);
	}
	else if (start === 2) {
		route.push(routeCentre);
		var pt1 = findPointB(routeCentre, (distance / 3), 330 + randomOffset );
		var pt3 = findPointB(routeCentre, (distance / 3), 270 + randomOffset );
		route.push(pt1);
		route.push(pt3);
	}
	else if (start === 3) {
		route.push(routeCentre);
		var pt1 = findPointB(routeCentre, (distance / 3), 30 + randomOffset );
		var pt2 = findPointB(routeCentre, (distance / 3), 90 + randomOffset );
		route.push(pt1);
		route.push(pt2);
	}
	drawRoute(route, distance);	
}

//------------------------------------------------------------------------

function fig8(distance){
	
	/*         
			4				2
			|\__		 __/|				
			|	\__	  __/   |
			|	   ^ ^      |
			|		H       |
			|	 __^ ^__	|
			| __/		\__	|
			V/			   \V
			5				3

	*/	//start is always middle of "8"

	min = Math.ceil(-45);
	max = Math.floor(46);
	var randomOffset = Math.floor(Math.random() * (max - min)) + min;

	var route = [];
 
	var pt2 = findPointB(routeCentre, (distance / 6), 60 + randomOffset);
	var pt3 = findPointB(pt2, (distance / 6), 180 + randomOffset );
	var pt4 = findPointB(routeCentre, (distance / 6), 300 + randomOffset);
	var pt5 = findPointB(pt4, (distance / 6), 180 + randomOffset );

	route.push(routeCentre);
	route.push(pt2);
	route.push(pt3);
	route.push(pt4);
	route.push(pt5);

	drawRoute(route, distance);
	
}

//------------------------------------------------------------------------

function drawRoute(points, targetDistance){

	firstGen = false; //boolean flag to test entry on first time

	directionsDisplay = new google.maps.DirectionsRenderer({
		polylineOptions:{strokeColor:"#0bba31",strokeWeight:5},
		map: map,
		draggable: true,
		suppressMarkers: true,
	});
	var directionsService = new google.maps.DirectionsService();
	var waypoints = points.slice(1);

	var wpts = [];
  	for (var i=0; i < waypoints.length; i++){
      	wpts.push({
           	location:waypoints[i],
	   		stopover:false});
      }

	directionsService.route({
        origin: routeCentre,
        destination: routeCentre,
        waypoints: wpts,
        travelMode: 'WALKING',
        avoidHighways: true
        }, function(response, status, targetDistance) {
          	// Route the directions and pass the response to a function to create
          	// markers for each step.
          	if (status === 'OK') {
          		var distance = 0;
          		distance = computeTotalDistance(response);

          		if (distance >= targetDistance * 0.5 && distance <= targetDistance * 1.5) {
					document.getElementById('total').innerHTML = 'loop distance: '+ targetDistance + ' km';
					directionsDisplay.setDirections(response);
          		} else {
          			console.log(loopnum);
          			loopnum++;
          			createRoute();
          		}

            	//showSteps(response, markerArray, stepDisplay, map);
          	} else {
            	window.alert('Directions request failed due to ' + status);
          	}
        });
    
    
	function computeTotalDistance(result) {
  		var total = 0;
  		var loop = result.routes[0];
  		for (var i = 0; i < loop.legs.length; i++) {
    		total += loop.legs[i].distance.value;
  		}
  		total = total / 1000;
  		//document.getElementById('total').innerHTML = 'loop distance: '+ total + ' km';
  		return total;
	
	}


    function showSteps(directionResult, markerArray, stepDisplay, map) {
        // For each step, place a marker, and add the text to the marker's infowindow.
        // Also attach the marker to an array so we can keep track of it and remove it
        // when calculating new routes.
        var myRoute = directionResult.routes[0].legs[0];
        for (var i = 0; i < myRoute.steps.length; i++) {
            var marker = markerArray[i] || new google.maps.Marker;
            marker.setMap(map);
            marker.setPosition(myRoute.steps[i].start_location);
        }
    }
}

//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
//------------------------------------------------------------------------
