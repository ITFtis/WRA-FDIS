var LKmlCtrl = function (ctrl, inicallback) {
    var current = this;
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    var js = [];
    if (!window.omnivore)
        js.push($.AppConfigOptions.script.gispath + '/leaflet/leaflet-omnivore.js');
    if (!window.JSZip)
        js.push($.AppConfigOptions.script.gispath + '/other/jszip.js');
    if (!window.JSZipUtils)
        js.push($.AppConfigOptions.script.gispath + '/other/jszip-utils.js');
    if (js.length ==0) {
        setTimeout(function () {
            inicallback();
        });
    }
    else
        helper.misc.getJavaScripts(js, inicallback)
        //helper.misc.getJavaScripts([$.AppConfigOptions.script.gispath + '/leaflet/leaflet-omnivore.js'], inicallback)
    return this;
};

LKmlCtrl.prototype.loadKml = function (_url, callback) {
    //console.log('loadKml start:'+_url);
    var st = Date.now();
    var current = this;  
    var __fearData = [];
    var afterParser = function (layers) {
        //console.log(JSON.stringify(layers));
        var _geojson = layers.toGeoJSON();
        $.each(_geojson.features, function () {
            var _d = current.mainctrl.settings.descriptionParser(this.properties.description, "<BR>", ":");
            if (current.mainctrl.__useKmlDescription) { //infoWindow用
                _d.kmlDescription = this.properties.description;
            }
            _d.placemarkName = this.properties.name || _d.name;


            //_d.placemarTitle = "test";
            _d.geojson = this;
            if (_d.geojson.properties.Style) {
                var s = _d.geojson.properties.Style;
                _d.kmlStatus = JSON.parse(JSON.stringify($.PolygonCtrl.defaultSettings.polyStyles[0]));
                _d.kmlStatus.name = current.mainctrl.settings.name;
                if (s && s.IconStyle) {
                    if (s.IconStyle && s.IconStyle.Icon && s.IconStyle.Icon.href) {
                        _d.kmlStatus.url = s.IconStyle.Icon.href;
                    }
                }
                if (s.LineStyle) {
                    if (s.LineStyle.color) _d.kmlStatus.strokeColor = s.LineStyle.color;
                    if (s.LineStyle.width) _d.kmlStatus.strokeWeight = s.LineStyle.width;
                }
                if (s.PolyStyle) {
                    if (s.PolyStyle.color) _d.kmlStatus.fillColor = s.PolyStyle.color;
                    //if (s.PolyStyle.fill && s.PolyStyle.fill != 0) _d.kmlStatus.fillOpacity = s.PolyStyle.fill;
                    if (s.PolyStyle.fill) _d.kmlStatus.fillOpacity = s.PolyStyle.fill;
                    if (s.PolyStyle.outline) _d.kmlStatus.strokeWeight = s.PolyStyle.outline;
                }
            }
            if (current.mainctrl.settings.type == $.BasePinCtrl.type.polygon) {
                _d.paths = this.geometry.coordinates;//this.polygon.getPaths().getArray();
                //_d.geojson = this;
                var kmlStatus = current.mainctrl.settings.checkDataStatus.call(current.mainctrl, _d);
                kmlStatus = kmlStatus || (current.mainctrl.settings.legendIcons ? current.mainctrl.settings.legendIcons[0] : undefined); 
                _d.kmlStatus = kmlStatus || (current.mainctrl.settings.polyStyles ? current.mainctrl.settings.polyStyles[0] : undefined) || $.PolygonCtrl.defaultSettings.polyStyles[0];
                if (_d.kmlStatus.fillColor == undefined)
                    _d.kmlStatus = $.PolygonCtrl.defaultSettings.polyStyles[0];
            }
            else if (current.mainctrl.settings.type == $.BasePinCtrl.type.polyline) {
                //if (this.geometry.type !== "LineString")
                //    return;
                _d.paths = this.geometry.coordinates;//this.polygon.getPaths().getArray();
                //_d.geojson = this;
                var kmlStatus = current.mainctrl.settings.checkDataStatus.call(current.mainctrl, _d);
                kmlStatus = kmlStatus || (current.mainctrl.settings.legendIcons ? current.mainctrl.settings.legendIcons[0] : undefined); 
                _d.kmlStatus = kmlStatus || $.PolylineCtrl.defaultSettings.polyStyles[0];
                if (_d.kmlStatus.strokeColor == undefined)
                    _d.kmlStatus = $.PolylineCtrl.defaultSettings.polyStyles[0];
            }
            else if (current.mainctrl.settings.type == $.BasePinCtrl.type.point) {
                _d.X = this.geometry.coordinates[0];
                _d.Y = this.geometry.coordinates[1];
                //leaflet-omnivore.min
                var kmlStatus = current.mainctrl.settings.checkDataStatus.call(current.mainctrl, _d);
                //以下kmlStatus放後面，才能如給legendIcons才會生效
                kmlStatus = (current.mainctrl.settings.legendIcons ? current.mainctrl.settings.legendIcons[0] : undefined) || kmlStatus;
                _d.kmlStatus = kmlStatus || $.BasePinCtrl.pinIcons.defaultPin;
            }
            else if (current.mainctrl.settings.type == $.BasePinCtrl.type.feature) {
                var kmlStatus = current.mainctrl.settings.checkDataStatus.call(current.mainctrl, _d);
                kmlStatus = kmlStatus || (current.mainctrl.settings.legendIcons ? current.mainctrl.settings.legendIcons[0] : undefined);
                _d.kmlStatus = kmlStatus || (current.mainctrl.settings.polyStyles ? current.mainctrl.settings.polyStyles[0] : undefined) || $.PolygonCtrl.defaultSettings.polyStyles[0];
            }
            if (_d.kmlStatus && _d.kmlStatus.strokeWeight)
                _d.kmlStatus.strokeWeight = Math.ceil(_d.kmlStatus.strokeWeight); //線寬無條件進位
            _d.placemarTitle = current.mainctrl.settings.stTitle(_d);
            __fearData.push(_d);
        });
        //if (current.mainctrl.settings.type == $.BasePinCtrl.type.feature)
        //    __fearData.sort(function (a, b) {
        //        //if(a.)
        //    });
        console.log('loadKml end(' + (typeof _url == 'string' && _url.lastIndexOf('/') >= 0 ? _url.substr(_url.lastIndexOf('/')+1):'') +'):' + (Date.now() - st));
        callback(__fearData);
    }
    if (typeof _url === 'function') {
        _url.call(this.mainctrl,callback);
    }
    else {
        if (_url.toUpperCase().indexOf("KMZ") > 0 || this.mainctrl.settings.forceZip) {
            var $_p, $_mc;
            if (this.mainctrl && this.mainctrl.$element)
                $_p = this.mainctrl.$element;//.find('.pinctrl');
            JSZipUtils.getBinaryContent(_url,
                {
                    progress: function (event) {
                        if ($_mc == undefined && $_p != undefined && $_p.length>0)
                            $_mc = $_p.find('.msg-contont');
                        if ($_mc) {
                            if (event.percent >= 99)
                                $_mc.text('資料處理中');
                            else
                                $_mc.text('載入中 ' + event.percent.toFixed(0) + '% ');
                        }
                        //console.log(event.percent.toFixed(0) + "% of " + event.path + " loaded")
                    },
                    callback: function (e, data) {
                        try {
                            JSZip.loadAsync(data).then(function (zip) {
                                zip.forEach(function (path, file) {
                                    file.async('string').then(function (ks) {
                                        if (ks.indexOf('<?xml') > 0) {
                                            var s = ks.indexOf('>') + 1;
                                            ks = ks.substr(s);
                                        }

                                        st = Date.now();
                                        afterParser(omnivore.kml.parse(ks));
                                        //var p = omnivore.kml.parse(ks).addTo(app.map).toGeoJSON();
                                    });
                                    return; //預設只處裡一個檔案
                                });
                            });
                        } catch (e) {
                            alert(e);
                        }
                    }
                }
            );
        } else {
            var lay = omnivore.kml(_url).on('ready', function () {
                afterParser(lay);
            });
        }
    }
};