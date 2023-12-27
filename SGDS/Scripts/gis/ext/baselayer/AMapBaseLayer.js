var AMapBaseLayer = function (ctrl, inicallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;

    var current = this;
    setTimeout(function () { inicallback(); });
    return this;
};

AMapBaseLayer.prototype.basemap = function (_type) {
    var current = this;
    var temp = this.map.getLayer(this.mainctrl.settings.layerid);

    if (temp) {
        //if (temp.urlTemplate && temp.urlTemplate === val.urlTemplate && temp.visible)
        if (temp.url && temp.url === _type.url && temp.visible)
            return;
        this.map.removeLayer(temp);
    }

    var opts = $.extend({}, _type.options);//{ "id": current.settings.layerid });
    opts.id = this.mainctrl.settings.layerid;
    require(["esri/layers/" + _type.type], function (BaseLayer) {
        //opts.spatialReference = new esri.SpatialReference({ "wkid": 102443, "latestWkid": 3826 });
        if (_type.spatialReference)
            opts.spatialReference = _type.spatialReference;
        console.log(JSON.stringify(opts));
        var basemap = new BaseLayer(_type.url, opts);// {
        if (basemap.setVisibleLayers && opts.visibleLayers) { //for ArcGISDynamicMapServiceLayer
            basemap.setVisibleLayers(opts.visibleLayers);
        }
        current.map.addLayer(basemap, 0); //WMSLayer 和 WebTiledLayer 共存，要先加入WebTiledLayeru要放在下層才能work

        $("#map_" + current.mainctrl.settings.layerid).css("opacity", 0.25);
        $("#map_" + current.mainctrl.settings.layerid).animate({
            opacity: 1,
        }, 2000, function () {
            // Animation complete.
        });
     
    })
};
AMapBaseLayer.prototype.remove = function () {
    var temp = this.map.getLayer($.MapBaseLayerDefaultSettings.layerid);

    if (temp) {
        this.map.removeLayer(temp);
    }
};