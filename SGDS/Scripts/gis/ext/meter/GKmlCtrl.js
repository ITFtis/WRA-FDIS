var GKmlCtrl = function (ctrl, inicallback) {
    var current = this;
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.KMLLayer;
    this.__useKmlIcons = ctrl.__useKmlIcons;
    setTimeout(function () {
        inicallback();
    });


    return this;
};

GKmlCtrl.prototype.loadKml = function (_url, callback) {
    var current = this;
    if (window.geoXML3) {
        current._initKmlCtrl(callback);
    }
    else {
        alert("請先引入 geoXML3");
        callback([]);
        return; //自動載ZipFile.complete.js IE有問題
        helper.misc.getJavaScripts($.AppConfigOptions.script.gispath + '/google/geoxml3.js', function () {
            helper.misc.getJavaScripts($.AppConfigOptions.script.gispath + '/google/ZipFile.complete.js', function () {
                current._initKmlCtrl();
            });
        });
    }
};

GKmlCtrl.prototype._initKmlCtrl = function (callback) {
    var current = this;
    //this.isInitCompleted = true;
    //this.$element.show_busyIndicator();
    if (typeof this.mainctrl.settings.url === 'function') {
        this.mainctrl.settings.url(function (doc) {
            current._afterParse.call(current, doc, callback);
        });
    }
    else {
        var geoXml = new geoXML3.parser({
            afterParse: function (doc) {
                current._afterParse.call(current, doc, callback);
            }
        });
        geoXml.parse(this.mainctrl.settings.url);
    }
}
GKmlCtrl.prototype._afterParse = function (doc, callback) {
    var current = this;
    var __fearData = [];
    var _usekmlstyle = false;
    if (current.__useKmlIcons)
        this.mainctrl.settings.legendIcons = [];
    var _iconsHrefTemp = "";
    var cc = 0;
    $.each(doc[0].placemarks, function () {
        var _d = current.mainctrl.settings.descriptionParser(this.description, "<BR>", ":");
        if (current.mainctrl.__useKmlDescription) { //infoWindow用
            _d.kmlDescription = this.description;
        }
        _d.placemarkName = this.name;
                
        _d.placemarTitle = current.mainctrl.settings.stTitle(_d);

        if (current.mainctrl.settings.type == $.BasePinCtrl.type.polygon) {
            _d.paths = this.polygon.getPaths().getArray();
                   
            _d.kmlStatus = {
                strokeOpacity: this.polygon.strokeOpacity, strokeWeight: this.polygon.strokeWeight, fillOpacity: this.polygon.fillOpacity,
                strokeColor: this.polygon.strokeColor, fillColor: this.polygon.fillColor
            };
        }
        else if (current.mainctrl.settings.type == $.BasePinCtrl.type.polyline) {
            _d.kmlStatus = {};
            //可polygon kml設定type=polyline畫polyline
            var _polyline = this.polyline || this.polygon
            //MultiGeometry多條線getPath()會是null，paths[0]如是array即MultiGeometry
            _d.paths = _polyline.paths ? _polyline.paths : _polyline.getPath().getArray(); 
            _d.kmlStatus = {
                strokeOpacity: _polyline.strokeOpacity, strokeWeight: _polyline.strokeWeight, strokeColor: _polyline.strokeColor
            };
        }
        else {
            if (!this.latlng) {
                console.log(this.description+'無座標');
                return;
            }
            _d.X = this.latlng.lng();
            _d.Y = this.latlng.lat();
            var _iconurl = this.style.href ? this.style.href : this.style.icon.href;
            if (current.__useKmlIcons) {
                if (_iconsHrefTemp.indexOf(_iconurl) < 0) {
                    current.mainctrl.settings.legendIcons.push({ 'name': '', 'url': _iconurl });
                    _iconsHrefTemp += "|" + _iconurl;
                }
            }
            _d.kmlStatus = { 'name': '', 'url': _iconurl };
        }
        __fearData.push(_d);
    });
    callback(__fearData);
    //current.__pinctrl.instance.repaintLegendUI(current.settings.legendIcons);
    //current.$element.hide_busyIndicator();
    //current.setData(__fearData);
}