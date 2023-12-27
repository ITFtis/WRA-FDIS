var ALocalKml = function (ctrl, inicallback) {
    require(["esri/graphicsUtils"],
       function (graphicsUtils) {
           setTimeout(function () { inicallback(); });
       });
    this.ctrl = ctrl;
    this.map = ctrl.settings.map;
    this.kmllayers = [];
    //return this;
};
ALocalKml.prototype.add = function (data) {
    var current = this;
    if (!data.Error) {
        for (var i = 0; i < data.Kmls.length; i++) {
            window.helper.misc.showBusyIndicator(current.ctrl.$element);
            $.kmlhelper({
                map: current.map, kmlurl: data.Kmls[i].Url, layerid: "importlocalkml_" + data.Kmls[i].Name, onLoaded: function (kl) {
                    current.kmllayers.push(kl);
                    window.helper.misc.hideBusyIndicator(current.ctrl.$element);
                    var kmlExtent, layers = kl.getLayers();
                    $.each(layers, function (idx, lyr) {
                        if (lyr.graphics && lyr.graphics.length > 0) {
                            var lyrExtent = esri.graphicsExtent(lyr.graphics);
                            if (kmlExtent) {
                                kmlExtent = kmlExtent.union(lyrExtent);
                            } else {
                                kmlExtent = lyrExtent;
                            }
                        }
                    });
                    if (kmlExtent)
                        current.map.setExtent(kmlExtent);
                }, autoPolygonIndextoLower: true
            });
        }
    }
    else {
        alert(data.Error);
    }
};
ALocalKml.prototype.show = function (_name, _show) {
    if (_show)
        this.map.getLayer("importlocalkml_" + _name).show();
    else
        this.map.getLayer("importlocalkml_" + _name).hide();
};
ALocalKml.prototype.removeAll = function () {
    for (var i = 0; i < this.kmllayers.length; i++) {
        this.map.removeLayer(this.kmllayers[i]);
    }
    this.kmllayers = [];
};