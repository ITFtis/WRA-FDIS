var AKmlCtrl = function (ctrl, inicallback) {
    var current = this;
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.KMLLayer;
    require(["esri/layers/KMLLayer"], function (KMLLayer) {
        current.KMLLayer = KMLLayer;
        setTimeout(function () {
            inicallback();
        });
    });


    return this;
};

AKmlCtrl.prototype.loadKml = function (_url, callback) {
    var kml = new this.KMLLayer(_url);
    var __fearData = [];
    //current.settings.map.addLayer(kml);
    kml.on("load", function (lyr) {
        //domStyle.set("loading", "display", "none");
        var layers = lyr.layer.getLayers();
        $.each(layers, function () {
            this.setInfoTemplate(null);
            var _lsymbol = this.renderer.symbol;
            $.each(this.graphics, function () {
                this.attributes.arc_graphic = this;//symbol 是 null
                this.symbol = this.symbol || _lsymbol;
                __fearData.push(this.attributes);
            })
        });
        callback(__fearData);
    });
};