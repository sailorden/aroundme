angular.module('starter.controllers', ['starter.services','jett.ionic.filter.bar','ngCordova'])

.controller('PlacesController', function($cordovaGeolocation, $ionicFilterBar, $ionicLoading, 
	$ionicPlatform, $scope, PlacesService) {

	$scope.showFilterBar = function(){
		$ionicFilterBar.show({
			items: $scope.places,
			update: function(filteredData) {
				$scope.places = filteredData;
			},
			filterProperties: $scope.places.name
		});
	};

    $ionicPlatform.ready(function() {
		
		$ionicLoading.show({
	      content: 'Getting current location...',
	      showBackdrop: false
	    });
	    
    	var posOptions = {
       		enableHighAccuracy: true,
        	timeout: 20000,
        	maximumAge: 0
        };

        $cordovaGeolocation.getCurrentPosition(posOptions).then(function (pos) {

			var coords = pos.coords.latitude + ',' + pos.coords.longitude;
	      	console.log('Got pos', coords);
			
			// Sample coordinates : "-33.8670522,151.1957362"
			PlacesService.getPlaces(coords).then(function(places){
				console.log(places);

				for(var x=0; x<places.length; x++){
					if(places[x].opening_hours && places[x].opening_hours.open_now){
						places[x].open = true;
					} else {
						places[x].open = false;
					}
				}

				$scope.places = places;
			});

	      	$ionicLoading.hide();

	    }, function (error) {
	      alert('Unable to get location: ' + error.message);
	    });
	});
})

.controller('PlaceController', function($ionicSlideBoxDelegate, $scope, $stateParams, PlacesService) {
	PlacesService.getPlace($stateParams.placeId).then(function(place){
		console.log(place);
		
		if(place.photos){
			$scope.hasPhotos = true;

			for(var x=0;x<place.photos.length; x++) {
				place.photos[x].url = PlacesService.getPhoto(place.photos[x].photo_reference);
			}
			
		}
		$ionicSlideBoxDelegate.update();
		
		$scope.place = place;	

	});
});