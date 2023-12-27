var GMapBaseLayer = function (ctrl, inicallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;

    var current = this;
    this.basemapTypes(this.mainctrl.settings.tiles);
    setTimeout(function () { inicallback(); });
    return this;
};

GMapBaseLayer.prototype.basemapTypes = function (_types) {
    var current = this;
    $.each(_types, function () {
        if (this.groupTiles) {
            $.each(this.groupTiles, function () {
                if (this.id && this.id.indexOf("google_") < 0) {
                    current.setGoogleMapTypes(this);
                }
            });
        } else {
            if (this.id && this.id.indexOf("google_") < 0) {
                current.setGoogleMapTypes(this);
            }
        }
    });
};
GMapBaseLayer.prototype.setGoogleMapTypes = function (_type) {
    var current = this;
    var _customMapTypeOptions = {
        tileSize: new google.maps.Size(256, 256),
        maxZoom: 19,
        minZoom: 0,
        //radius: 1738000,
        name: _type.id
    };
    if (_type.type === "WebTiledLayer") {
        _customMapTypeOptions.getTileUrl = function (coord, zoom) {
            var normalizedCoord = getNormalizedCoord(coord, zoom);
            if (!normalizedCoord) {
                return null;
            }
            var bound = Math.pow(2, zoom);
            return _type.url.replace(/\${subDomain}/g, _type.options.subDomains[0]).replace(/\${level}/g, zoom).replace(/\${col}/g, normalizedCoord.x).replace(/\${row}/g, normalizedCoord.y);
        };
    }
    else if (_type.type === "WMSLayer") {
        _customMapTypeOptions.getTileUrl = function (coord, zoom) {
            var proj = current.map.getProjection();
            var zfactor = Math.pow(2, zoom);
            // get Long Lat coordinates
            var top = proj.fromPointToLatLng(new google.maps.Point(coord.x * 256 / zfactor, coord.y * 256 / zfactor));
            var bot = proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * 256 / zfactor, (coord.y + 1) * 256 / zfactor));

            //corrections for the slight shift of the SLP (mapserver)
            var deltaX = 0;// 0.0013;
            var deltaY = 0;//0.00058;

            //create the Bounding box string
            var bbox = (top.lng() + deltaX) + "," +
                           (bot.lat() + deltaY) + "," +
                           (bot.lng() + deltaX) + "," +
                           (top.lat() + deltaY);

            //base WMS URL
            var url = _type.url + "?";
            url += "BBOX=" + bbox;      // set bounding box
            url += "&WIDTH=256";         //tile size in google
            url += "&HEIGHT=256";
            if (_type.options) {
                $.each(_type.options, function (f, v) {
                    url += "&"+f + "=" + v;
                });
            }
            //url += "REQUEST=GetMap"; //WMS operation
            //url += "&SERVICE=WMS";    //WMS service
            //url += "&VERSION=1.1.1";  //WMS version  
            //url += "&LAYERS=[1]"; //WMS layers
            //url += "&FORMAT=image/png"; //WMS format
            //url += "&BGCOLOR=0xFFFFFF";
            //url += "&TRANSPARENT=TRUE";
            //url += "&SRS=EPSG:4326";     //set WGS84 
            //url += "&BBOX=" + bbox;      // set bounding box
            //url += "&WIDTH=256";         //tile size in google
            //url += "&HEIGHT=256";
            console.log(url);
            return url;                 // return URL for the tile
        };
    }
    var _customMapType = new google.maps.ImageMapType(_customMapTypeOptions);
    this.map.mapTypes.set(_type.id, _customMapType);

    function getNormalizedCoord(coord, zoom) {
        var y = coord.y;
        var x = coord.x;

        // tile range in one direction range is dependent on zoom level
        // 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
        var tileRange = 1 << zoom;

        // don't repeat across y-axis (vertically)
        if (y < 0 || y >= tileRange) {
            return null;
        }

        // repeat across x-axis
        if (x < 0 || x >= tileRange) {
            x = (x % tileRange + tileRange) % tileRange;
        }

        return {
            x: x,
            y: y
        };
    }
};
GMapBaseLayer.prototype.basemap = function (_type) {
    var current = this;
    var _maptypeid = _type.id;
    if (_type.id && _type.id.indexOf("google_") >= 0)
        _maptypeid = _maptypeid.replace("google_", "");
    if (this.map.getMapTypeId() === _maptypeid)
        return;

    this.map.setMapTypeId(_maptypeid);

};
GMapBaseLayer.prototype.remove = function () {
};