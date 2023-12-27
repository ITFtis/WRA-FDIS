var ABasePosition = function (ctrl, inicallback) {
    require(["esri/layers/GraphicsLayer", "esri/graphic", "esri/geometry/Point", "esri/symbols/PictureMarkerSymbol","esri/graphicsUtils"],
       function (GraphicsLayer, Graphic, Point, PictureMarkerSymbol,graphicsUtils) {
           setTimeout(function () { inicallback(); });
       });
    this.ctrl = ctrl;
    this.map = ctrl.settings.map;
    this.clayer = undefined;
};
ABasePosition.prototype.clear = function () {
    if(this.clayer)
        this.clayer.clear();
};
ABasePosition.prototype.position = function (x, y) {
    if (!this.clayer) {
        this.clayer = new esri.layers.GraphicsLayer({ id: '___basepositionlayer' });
        this.map.addLayer(this.clayer);
    }
    this.clear();
    var g = new esri.Graphic(new esri.geometry.Point(x, y), new esri.symbol.PictureMarkerSymbol($.AppConfigOptions.script.gispath + "/images/blue-pushpin.png", 28, 28).setOffset(7, 14));
    this.clayer.add(g);
    this.map.centerAndZoom(g.geometry, this.map.getZoom() < 17 ? 17 : this.map.getZoom());
}