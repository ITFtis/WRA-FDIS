var ACloud = function (ctrl, inicallback) {
    require(["esri/layers/MapImageLayer", "esri/layers/MapImage", "dojo/_base/connect"],
       function (MapImageLayer, MapImage, connect) {
           ctrl.arc_MapImageLayer = MapImageLayer;
           ctrl.arc_MapImage = MapImage;
           ctrl.arc_Connect = connect;

           setTimeout(function () {inicallback(); });
           
       });
    this.ctrl = ctrl;
    //return this;
};

ACloud.prototype.initLayer = function () {
    if (!this.ctrl._imglayer) {
        this.ctrl._imglayer = new this.ctrl.arc_MapImageLayer({ id: this.ctrl.settings.layerId });
        this.ctrl.map.addLayer(this.ctrl._imglayer);
    }
    else
        this.removeAllImages();
};
ACloud.prototype.show = function () {
    this.ctrl._imglayer.show();
};
ACloud.prototype.hide = function () {
    this.ctrl._imglayer.hide();
};
ACloud.prototype.removeAllImages = function () {
    if (this.ctrl._imglayer)
        this.ctrl._imglayer.removeAllImages();
}
ACloud.prototype.addImages = function (_displayCloud, url) {
    var ctrl = this.ctrl;
    var img = new this.ctrl.arc_MapImage({
        'href': url, 'extent': {
            'xmin': _displayCloud.xmin, 'ymin': _displayCloud.ymin,
            'xmax': _displayCloud.xmax, 'ymax': _displayCloud.ymax
        }
    });
    this.ctrl._imglayer.addImage(img);
    this.ctrl.$element.hide_busyIndicator();
    this.ctrl._msgDom.html('');
    setTimeout(function () {
        var images = ctrl._imglayer.getImages();

        if (images.length > 1)
            ctrl._imglayer.removeImage(images[0]);
    }, ctrl.settings.activeInterval / 10);
}

