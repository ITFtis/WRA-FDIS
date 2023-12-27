var LCoordinateInfo = function (ctrl, inicallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    setTimeout(function () { inicallback(); });

    var current = this;
    this.map.on('zoomend', function () {
        //console.log('current.map.getZoom():' + current.map.getZoom());
        current.changeCoordinates(current.map.getCenter());
        
    });
    this.map.on('mousemove', function (evt) {
        current.changeCoordinates(evt.latlng);
    });
    
    this.changeCoordinates(this.map.getCenter());
    
    return this;
};

LCoordinateInfo.prototype.changeCoordinates = function (_p) {
    if (_p) {
        //console.log(JSON.stringify( L.Projection.project(_p).getLatLng()));
        this.mainctrl.showCoordinates({ x: _p.lng, y: _p.lat }, 591657527.591555 / Math.pow(2, this.map.getZoom()));
    }
};