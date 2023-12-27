var ACoordinateInfo = function (ctrl, inicallback) {
    var current = this;
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.webMercatorUtils = undefined;
    require(["esri/geometry/webMercatorUtils"], function (webMercatorUtils) {
        current.webMercatorUtils = webMercatorUtils;
        current.map.on('mouse-move', function (evt) {
            current.changeCoordinates(evt.mapPoint);
        });
        current.map.on('mouse-drag', function (evt) {
            current.changeCoordinates(evt.mapPoint);
        })
        current.map.on('zoom-end', function (evt) {
            current.changeCoordinates(evt.extent.getCenter());
        });
        current.changeCoordinates(current.map.extent.getCenter());
        inicallback();
    });
   

    return this;
};

ACoordinateInfo.prototype.changeCoordinates = function (_p) {
    var canProjectWGS84toWebMercator = this.webMercatorUtils.canProject(esri.SpatialReference.WGS84, esri.SpatialReference.WebMercator);
    //console.log("1." + JSON.stringify(_p) + ">>" + canProjectWGS84toWebMercator + ">>" + JSON.stringify(this.map.spatialReference));
    //console.log("2." + JSON.stringify(this.webMercatorUtils.geographicToWebMercator(_p)));
    //console.log("2." + JSON.stringify(window.helper.gis.TWD97ToWGS84(_p.x, _p.y)));
    //console.log("3." + JSON.stringify(this.webMercatorUtils.webMercatorToGeographic(_p)));
    ////console.log("4." + JSON.stringify(this.webMercatorUtils.webMercatorToGeographic(this.webMercatorUtils.geographicToWebMercator(_p))));
    if (_p.spatialReference && _p.spatialReference.wkid == 4326)
        this.mainctrl.showCoordinates(_p, this.map.getScale());
    else if (_p.spatialReference && _p.spatialReference.wkid == 102443)// && _p.spatialReference.latestWkid == 3826) //五河局
    {
        var np = window.helper.gis.TWD97ToWGS84(_p.x, _p.y);
        this.mainctrl.showCoordinates({x:np.lon, y:np.lat}, this.map.getScale());
    }
    else
        this.mainctrl.showCoordinates(this.webMercatorUtils.webMercatorToGeographic(_p), this.map.getScale());

    //console.log(this.map.toScreen(_p).x + " " + this.map.toScreen(_p).y);
};