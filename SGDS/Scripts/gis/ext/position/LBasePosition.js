var LBasePosition = function (ctrl, inicallback) {
    this.ctrl = ctrl;
    this.map = ctrl.settings.map;
    this.marker = undefined;
    setTimeout(function () { inicallback(); });
    return this;
};
LBasePosition.prototype.clear = function () {
    if (this.marker)
        this.marker.remove();
};
LBasePosition.prototype.position = function (x, y) {

    this.clear();
    var _options = {
        icon: L.icon({
            iconUrl: $.AppConfigOptions.script.gispath + "/images/blue-pushpin.png",
            iconSize: [28,28],
            iconAnchor: [14,28],// _cZoomPinsize.y / 2 + _cZoomPinsize.offsety],
        })
    };
    this.marker = L.marker([y, x], _options).addTo(this.map);
    this.map.setView([y,x],this.map.getZoom() < 17 ? 17 : this.map.getZoom());// panTo(this.marker.position);
}