var GCoordinateInfo = function (ctrl, inicallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    setTimeout(function () { inicallback(); });

    var current = this;
    google.maps.event.addListener(this.map, 'zoom_changed', function () {
        current.changeCoordinates(current.map.getCenter());
    });
    google.maps.event.addListener(this.map, 'mousemove', function (evt) {
        current.changeCoordinates(evt.latLng);
    });
    this.changeCoordinates(this.map.getCenter());

    return this;
};

GCoordinateInfo.prototype.changeCoordinates = function (_p) {
    if(_p)
        this.mainctrl.showCoordinates({ x: _p.lng(), y: _p.lat() }, 591657527.591555 / Math.pow(2, this.map.getZoom()));
};