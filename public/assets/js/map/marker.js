function Waypoint(wpIndex){

    this.wpIndex = wpIndex;
    this.lat = 0;
    this.lng = 0;
    this.location;
}

Waypoint.prototype.setGeoByLatLng = function(){
    let curWp = this;
    let latlgn = new google.maps.LatLng(curWp.lat, curWp.lng);
    geoCodeur.geocode( {location : latlgn},
        function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                curWp.location = results[0].formatted_address;
            } else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                setTimeout(function() {
                    curWp.setGeoByLatLng();
                }, 400);
            } else {
                alert("Impossible de géocaliser : [" + curWp.geoName + "] pour la raison suivante : ["+ status +"].");
            }
        }
    );
}

Waypoint.prototype.placeMarkerAndPanTo = function() {
    let markerLatLng = new google.maps.LatLng(this.lat,this.lng);
    let marker = new google.maps.Marker({
        position: markerLatLng,
        title: this.wpIndex.toString(),
        map: map
    });
}