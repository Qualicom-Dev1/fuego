function Tracer(carte){

    this.waypoints = Array();
    this.carte = carte;
    this.directionService = new google.maps.DirectionsService();
    this.directionServicePolylineOptions = {
        strokeColor: "#444444",
        strokeOpacity: 0.5,
        strokeWeight: 10,
        map: carte
    }

}

Tracer.prototype.addWaypoint = function (waypoint, adresse){

    let i = this.waypoints.length;
    this.waypoints[i] = new Waypoint(this.waypoints.length);
    this.waypoints[i].lat = waypoint.lat();
    this.waypoints[i].lng = waypoint.lng();
    if (adresse == "") {
        this.waypoints[i].setGeoByLatLng();
    }else{
        this.waypoints[i].location = adresse;
    }
    this.waypoints[i].placeMarkerAndPanTo();
}