var LCloud = function (ctrl, inicallback) {
    this.ctrl = ctrl;
    this.map = ctrl.map;
    this.currentOverlay = undefined;
    this.currentOpacity = 0.9;
    setTimeout(function () { inicallback(); });
    this.map.createPane('cloudimage').style.zIndex = 350;
    return this;
};

LCloud.prototype.initLayer = function () {
};
LCloud.prototype.show = function () {
    if (this.currentOverlay)
        this.currentOverlay.addTo(this.map);
};
LCloud.prototype.hide = function () {
    if (this.currentOverlay)
        this.currentOverlay.remove();
};
LCloud.prototype.removeAllImages = function () {
    if (this.currentOverlay)
        this.currentOverlay.remove();
};
LCloud.prototype.addImages = function (_displayCloud, url) {
    var current = this;
    var imageBounds = [[_displayCloud.ymin, _displayCloud.xmin],[_displayCloud.ymax, _displayCloud.xmax]];

    //var newOverlay = new google.maps.GroundOverlay(url, imageBounds, { map: this.map, opacity: this.currentOpacity }); //1.東南亞imageBounds對不齊??;2.GroundOverlay zoom in out會卡卡的
    var newOverlay = L.imageOverlay(url, imageBounds, { opacity: this.currentOpacity, pane:'cloudimage' }).addTo(this.map);

    //var newOverlay = new USGSOverlay(imageBounds, url, this.map, this.currentOpacity); //無法將zindex一至最下層

    setTimeout(function () {
        current.removeAllImages();
        current.currentOverlay = newOverlay;
    }, this.ctrl.settings.activeInterval / 10);
};
LCloud.prototype.setOpacity = function (_opacity) {
    if (this.currentOverlay)
        this.currentOverlay.setOpacity(_opacity);
    this.currentOpacity = _opacity;
};
