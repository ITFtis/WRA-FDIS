var LMapBaseLayer = function (ctrl, inicallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.currentType = null;
    this.currentBaseLayer = null;
    if (this.map == null)
        alert('LMapBaseLayer: Map is NULL');
    var current = this;
    if(inicallback)
        setTimeout(function () { inicallback(); });
    $.each(this.mainctrl.settings.tiles, function () {
        if (current.mainctrl.settings.fromTWWMTS) //from TWWMTS
            return false;
        if (this.groupTiles)
            current.basemap(this[0]);
        else
            current.basemap(this);
        return false;//預設show第1個
    });
    return this;
};

LMapBaseLayer.prototype.basemap = function (_type) {
    if (this.currentType && this.currentType.id == _type.id)
        return;
    //'13619243.951739566,2817774.6107047372,13775786.985667606,2974317.6446327804'
    var c1 = window.helper.gis.TWD97ToWGS84(13619243.951739566, 2817774.6107047372);
    var c2 = window.helper.gis.TWD97ToWGS84(13775786.985667606, 2974317.6446327804);
    var c3 = c1.lon + ',' + c1.lat + c2.lon + ',' + c2.lat;
    //var sad =L.latLng(50.5, 30.5);
    //var c4 = L.Projection.SphericalMercator.unproject(L.latLng(50.5, 30.5));
    //var sdd = L.latLng(2817774.6107047372,13619243.951739566);
    //var c4 = L.Projection.SphericalMercator.unproject(L.latLng(2817774.6107047372, 13619243.951739566));
    this.remove();
    var tss = [['${subDomain}', '{s}'],
        ['${col}', '{x}'],
        ['${row}', '{y}'],
        ['${level}', '{z}']]
    if (_type.type === "WebTiledLayer") {
        $.each(tss, function () {
            _type.url = _type.url.replace(this[0], this[1]);
        });
        /*this.currentBaseLayer = L.tileLayer(_type.url, { subdomains: _type.options.subDomains, maxZoom: _type.options.maxZoom ? _type.options.maxZoom : 18 }).addTo(this.map);*/
        if (_type.id == 'g3d') {
            L.TileLayer.MyCustomLayer = L.TileLayer.extend({
                getTileUrl: function (coords) {
                    var _url = L.TileLayer.prototype.getTileUrl.call(this, coords);
                    var _si = _url.indexOf("&y=");
                    var _ei = _url.indexOf("&", _si + 3);
                    var _y = _url.substr(_si + 3, _ei - _si - 3);
                    _url = _url.replace("&y=" + _y, "&y=" + (parseInt( _y)+5518));//誤差很大
                    return _url;
                }
            });
            this.currentBaseLayer = new L.TileLayer.MyCustomLayer(_type.url, { subdomains: _type.options.subDomains, maxZoom: _type.options.maxZoom ? _type.options.maxZoom : 18 }).addTo(this.map);
        }
        else
            this.currentBaseLayer = L.tileLayer(_type.url, { subdomains: _type.options.subDomains, maxZoom: _type.options.maxZoom ? _type.options.maxZoom : 18 }).addTo(this.map);
    }
    else if (_type.type === 'WMSLayer') {
  
        var _option = $.extend({ attribution: '', crs: L.CRS.EPSG4326 }, _type.options);//預設是EPSG:3857
        this.currentBaseLayer = L.tileLayer.wms(_type.url+"", _option).addTo(this.map);
    }
    this.currentType = _type;
};
LMapBaseLayer.prototype.remove = function () {
    if (this.currentBaseLayer)
        this.currentBaseLayer.remove();
};
