angular.module('starter.controllers', ['starter.services','ngCordova','ngGPlaces'])

.controller('CategoryController', function($scope) {
})

.controller('MenuController', function($cordovaGeolocation, $scope, $state, PlaceTypeService) {
 
	var messages = [
		"May your life be filled with joy and happiness and may each new day bring you moments to cherish.",
		"On this joyous day, and throughout the new year, may your life be filled with an abundance of love.",
		"Merry Christmas and may you live a long and happy life filled with goodwill and friendship.",
		"May this new year bring you peace and tranquility, and as you walk your path may it bring you contentment.",
		"On this joyous day, and throughout the coming year, may your life be filled with good luck and prosperity.",
		"May your heart be filled with the joy of giving, as it is the expression of the love in your heart and the kindness in your soul.",
		"May the light of love shine upon you, and may your life be filled with blessings in this Christmas season.",
		"On this most blessed day, I wish you love for all your kindness, and I hope the new year will bring you many days of happiness."
	];

	$scope.message = function() {
		var index =	Math.round(Math.random()*7);
		navigator.notification.alert(messages[index], null,"Merry Xmas", "Thanks");
	};

	$scope.openPage = function (type){
		PlaceTypeService.setPlaceType(type);
		$state.go('places');
	};
})

.controller('PlacesController', function($cordovaGeolocation, $ionicLoading, 
	$ionicPlatform, $scope, PlaceTypeService, ngGPlacesAPI) {
 
	$ionicLoading.show({
      content: 'Getting current location...',
      showBackdrop: false
    });


	$scope.init = function() {

		$ionicLoading.show({
	      content: 'Getting current location...',
	      showBackdrop: false
	    });

		var placeType = PlaceTypeService.getPlaceType();

		if(!placeType)
			placeType="";
	    
    	var posOptions = {
       		enableHighAccuracy: true,
        	timeout: 20000,
        	maximumAge: 0
        };

        $cordovaGeolocation.getCurrentPosition(posOptions).then(function (pos) {

        	var configs = {
        		types:[placeType],
				radius:1000,
				latitude:pos.coords.latitude, 
        	 	longitude:pos.coords.longitude,
        	 	// latitude: "40.7127",
        	 	// longitude: "-74.0059"
        	};

        	ngGPlacesAPI.nearbySearch(configs).then(function(data){
				// console.log(data);

				for(var x=0; x<data.length; x++){

					if(data[x].photos){
						data[x].icon = data[x].photos[0].getUrl({ 'maxWidth': 75, 'maxHeight': 75 });
					}

					if(data[x].opening_hours && data[x].opening_hours.open_now){
						data[x].open = true;
					} else {
						data[x].open = false;
					}

					if(data[x].price_level) {
						switch(data[x].price_level) {
						    case 1:
						    	data[x].price_level = '$';
						        break;
						    case 2:
						        data[x].price_level = '$$';
						        break;
						    case 3:
						    	data[x].price_level = '$$$';
						    	break;
						    case 4:
						    	data[x].price_level = '$$$$';
						    	break;
						    default:
						    	data[x].price_level = 0;
						}
					}
					else {
						data[x].price_level = 0;
					}

					if (data[x].rating) {
						data[x].rating = {
							iconOn: 'ion-ios-star',    			//Optional
					        iconOff: 'ion-ios-star-outline',   	//Optional
					        rating: Math.round(data[x].rating),	//Optional
					        readOnly: true, 					//Optional
					        callback: function(rating) {    	//Mandatory
					          // $scope.ratingsCallback(rating);
        					}
						};
					} else {
						data[x].rating = false;
					}
				}

				$scope.places = data;

				$ionicLoading.hide();

			}, function (error){
				$ionicLoading.hide();
				navigator.notification.alert(error, null,"Info", "OK");
			});

	    }, function (error) {
		    $ionicLoading.hide();
	      	navigator.notification.alert('Unable to get location: ' + error.message, null,"Info", "OK");

	    });
	};

	$scope.refresh = function() {
		$scope.init();

		//Stop the ion-refresher from spinning
		$scope.$broadcast('scroll.refreshComplete');
	};

    $ionicPlatform.ready(function() {
		$scope.init();
	});
})

.controller('PlaceController', function($cordovaGeolocation, $cordovaSocialSharing, $ionicSlideBoxDelegate, 
	$ionicModal, $ionicPlatform, $scope, $stateParams, ngGPlacesAPI) {
 
	$ionicModal.fromTemplateUrl('reviews.html', function(modal) {
	    $scope.reviewsModal = modal;
	}, {
		  scope: $scope
	});

	$scope.openModal = function(){
		$scope.reviewsModal.show();
	};

	$scope.closeModal = function(){
		$scope.reviewsModal.hide();
	};

	$scope.navigate = function() {
		var posOptions = {
	   		enableHighAccuracy: true,
	    	timeout: 20000,
	    	maximumAge: 0
	    };

	    $cordovaGeolocation.getCurrentPosition(posOptions).then(function (pos) {
				$scope.lat = pos.coords.latitude;
				$scope.lng = pos.coords.longitude;

				var url = "http://maps.google.com/maps?saddr=" + 
					pos.coords.latitude + "," +
					pos.coords.longitude + "&daddr=" + 
					$scope.place.geometry.location.lat() + "," + 
					$scope.place.geometry.location.lng() + "&dirflg=d";

				window.open(url, '_system', 'location=yes'); 

				return false;
	    }, function (error) {
	      // alert('Unable to get location: ' + error.message);
	      navigator.notification.alert('Unable to get location: ' + error.message, null,"Info", "OK");
	    });
	};

	$scope.share = function() {
		var url = "http://maps.google.com/maps?z=18&q=" + 
			$scope.place.geometry.location.lat() + "," + 
			$scope.place.geometry.location.lng();

		// var url = "http://maps.google.com/?ll=39.774769,-74.86084";
		
        $cordovaSocialSharing.share(null, null, null, url);
	};

	$scope.openUrl = function(url) {
		window.open(url, '_system', 'location=yes'); 
		return false;
	};

	$scope.toggle = function(){
		$scope.expand = !$scope.expand;
	}

    $ionicPlatform.ready(function() {

    	$scope.expand = false;

		ngGPlacesAPI.placeDetails({placeId: $stateParams.placeId}).then(function (data) {

			if(data.photos){
				$scope.hasPhotos = true;

				for(var x=0;x<data.photos.length; x++) {
					data.photos[x].url = data.photos[x].getUrl({ 'maxWidth': 350, 'maxHeight': 300 });
				}
				
			}

			if(data.price_level) {
				switch(data.price_level) {
				    case 1:
				    	data.price_level = '$';
				        break;
				    case 2:
				        data.price_level = '$$';
				        break;
				    case 3:
				    	data.price_level = '$$$';
				    	break;
				    case 4:
				    	data.price_level = '$$$$';
				    	break;
				    default:
				    	data.price_level = 0;
				}
			}
			else {
				data.price_level = 0;
			}

			if(data.opening_hours && data.opening_hours.open_now){
				data.open = true;
			} else {
				data.open = false;
			}

			if(data.opening_hours)
			{
				for(var x=0; x<data.opening_hours.periods.length; x++)
				{
					switch (data.opening_hours.periods[x].open.day)
					{
						case 0:
							data.opening_hours.periods[x].open.day = 'Sunday';
							break;
						case 1:
							data.opening_hours.periods[x].open.day = 'Monday';
							break;
						case 2:
							data.opening_hours.periods[x].open.day = 'Tuesday';
							break;
						case 3:
							data.opening_hours.periods[x].open.day = 'Wednesday';
							break;
						case 4:
							data.opening_hours.periods[x].open.day = 'Thursday';
							break;
						case 5:
							data.opening_hours.periods[x].open.day = 'Friday';
							break;
						default:
							data.opening_hours.periods[x].open.day = 'Saturday';
							break;
					}
				}
			}

			$ionicSlideBoxDelegate.update();

			$scope.place = data;

			// console.log($scope.place);

		});

	});
});