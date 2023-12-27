(function () {
    var ABoundaryMap = function (ctrl, inicallback) {
        this.ctrl = ctrl;
        this.map = undefined;
        require(["esri/map", "esri/geometry/Extent", "esri/SpatialReference"], function (Map, Extent, SpatialReference) {
            inicallback();
        });
        this._rect = undefined;
        return this;
    };
    ABoundaryMap.prototype.initMap = function () {
        var current = this;

        var fullExtent = new esri.geometry.Extent(120.3536118307253, 21.905800144655,
                    121.5632379006578, 25.2902423231679, new esri.SpatialReference({ wkid: 4326 }));
        var _mapid =  this.ctrl.$element.attr("id");
        if(!_mapid)
            alert("BoundaryMap.$element無id屬性");
        this.map = new esri.Map(_mapid, {
            logo: false,
            autoResize: true,
            showInfoWindowOnClick: false,
            slider: false,
            smartNavigation: false,

            fadeOnZoom: true
        });
       
        this.map.on("click", function (evt, werwer, rew) {
            if(!evt.graphic)
                current.ctrl.$element.trigger("map-click", evt);
        });

        return this.map;
    };
   
    ABoundaryMap.prototype.fitBounds = function (_rect) {
        this._rect = _rect;
        this.resize();
    };
    ABoundaryMap.prototype.resize = function () {
        this.map.resize(true);
        if(this._rect)
            this.map.setExtent(new esri.geometry.Extent(this._rect.minx, this._rect.miny, this._rect.maxx, this._rect.maxy, new esri.SpatialReference({ wkid: 4326 })))
        .then(function () { });
    };
    window.ABoundaryMap = ABoundaryMap;
})(window);