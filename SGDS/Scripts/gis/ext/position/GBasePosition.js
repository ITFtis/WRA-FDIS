var GBasePosition = function (ctrl, inicallback) {
    this.ctrl = ctrl;
    this.map = ctrl.settings.map;
    this.marker = undefined;
    setTimeout(function () { inicallback(); });
    return this;
};
GBasePosition.prototype.clear = function () {
    if (this.marker)
        this.marker.setMap(null);
};
GBasePosition.prototype.position = function (x, y) {

    this.clear();
    this.marker = new google.maps.Marker({
        position:{lat: parseFloat( y), lng: parseFloat(x)},
        map: this.map,
        icon: new google.maps.MarkerImage(
                                $.AppConfigOptions.script.gispath + "/images/blue-pushpin.png",
                                null, /* size is determined at runtime */
                                null, /* origin is 0,0 */
                                null, /* anchor is bottom center of the scaled image */
                                new google.maps.Size(28,28)
                            )
    });
    this.map.setZoom(this.map.getZoom() < 17 ? 17 : this.map.getZoom());
    this.map.panTo(this.marker.position);
}