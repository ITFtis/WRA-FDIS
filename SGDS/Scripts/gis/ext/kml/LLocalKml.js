var LLocalKml = function (ctrl, inicallback) {
    this.ctrl = ctrl;
    this.map = ctrl.settings.map;
    if (window.omnivore)
        setTimeout(function () { inicallback(); });
    else
        helper.misc.getJavaScripts([$.AppConfigOptions.script.gispath + '/leaflet/leaflet-omnivore.js'], inicallback);
    this.kmllayers = [];


    //L.Control.FileLayerLoad.LABEL = '<img class="icon" src="folder.svg" alt="file icon"/>';
    //var control = L.Control.fileLayerLoad({
    //    fitBounds: true,
    //    layerOptions: {
    //        //style: style,
    //        //pointToLayer: function (data, latlng) {
    //        //    return L.circleMarker(
    //        //        latlng,
    //        //        { style: style }
    //        //    );
    //        //}
    //    }
    //});
    return this;
};
LLocalKml.prototype.add = function (data) {
    var current = this;
    if (!data.Error) {
        var lay = L.geoJson(undefined,
            {
                pointToLayer: function (geoJsonPoint, latlng) {
                    var _options = {};
                    var s = geoJsonPoint.properties.Style;
                    if (s && s.IconStyle) {
                        if (s.IconStyle && s.IconStyle.Icon && s.IconStyle.Icon.href) {
                            _options.icon = L.icon({ iconUrl: s.IconStyle.Icon.href, iconSize: [24, 24] });
                        }
                    }
                    return L.marker(latlng, _options);
                },
                style: function (geoJsonPoint) {
                    var s = geoJsonPoint.properties.Style;
                    if (s) {
                        var _options = { fillOpacity: .8 };
                        if (s.LineStyle) {
                            _options.color = s.LineStyle.color;
                            _options.weight = s.LineStyle.width;
                        }
                        if (s.PolyStyle) {
                            _options.fillColor = s.PolyStyle.color;
                            _options.fill = true;
                            //_options.fillOpacity = s.PolyStyle.fill;
                            _options.weight = s.PolyStyle.outline;
                        }
                        return _options;
                    }
                    else return {};
                }
            });
        for (var i = 0; i < data.Kmls.length; i++) {
            
            if (data.Kmls[i].Url.toUpperCase().indexOf('.KMZ')) {
                JSZipUtils.getBinaryContent(_url, function (e, data) {
                    try {
                        JSZip.loadAsync(data).then(function (zip) {
                            zip.forEach(function (path, file) {
                                file.async('string').then(function (ks) {
                                    if (ks.indexOf('<?xml') > 0) {
                                        var s = ks.indexOf('>') + 1;
                                        ks = ks.substr(s);
                                    }
                                    var l = omnivore.kml.parse(ks, null, lay);
                                    l.name = data.Kmls[i].Name;
                                    current.kmllayers.push(l);
                                    //var p = omnivore.kml.parse(ks).addTo(app.map).toGeoJSON();
                                });
                                return; //預設只處裡一個檔案
                            });
                        });
                    } catch (e) {
                        alert(e);
                    }
                });
            }
            else {
                var runLayer = omnivore.kml(data.Kmls[i].Url, null, lay
                    //L.geoJson(undefined,
                    //{
                    //    pointToLayer: function (geoJsonPoint, latlng) {
                    //        var _options = {};
                    //        var s = geoJsonPoint.properties.Style;
                    //        if (s && s.IconStyle) {
                    //            if (s.IconStyle && s.IconStyle.Icon && s.IconStyle.Icon.href) {
                    //                _options.icon = L.icon({ iconUrl: s.IconStyle.Icon.href, iconSize:[24,24] });
                    //            }
                    //        }
                    //        return L.marker(latlng, _options);
                    //    },
                    //    style: function (geoJsonPoint) {
                    //        var s = geoJsonPoint.properties.Style;
                    //        if (s) {
                    //            var _options = { fillOpacity: .8 };
                    //            if (s.LineStyle) {
                    //                _options.color = s.LineStyle.color;
                    //                _options.weight = s.LineStyle.width;
                    //            }
                    //            if (s.PolyStyle) {
                    //                _options.fillColor = s.PolyStyle.color;
                    //                _options.fill =true;
                    //                //_options.fillOpacity = s.PolyStyle.fill;
                    //                _options.weight = s.PolyStyle.outline;
                    //            }
                    //            return _options;
                    //        }
                    //        else return {};
                    //    }
                    //})
                ).on('ready', function (event) { //完成所有KML資料
                    //var sd= runLayer.toGeoJSON();
                    //var sdf = runLayer.getLayers()[0].toGeoJSON();
                    //var saad = runLayer.getLayers()[0].renderer;
                    //var saad = runLayer.renderer;
                    //console.log(JSON.stringify(sd));
                    current.map.fitBounds(runLayer.getBounds());
                }).on('add', function (event) {
                    var sad = "";
                }).on('layeradd ', function (event) { //新增單一placemark

                }).addTo(current.map);
                runLayer.name = data.Kmls[i].Name;
                current.kmllayers.push(runLayer);
            }
            
        }
    }
    else {
        alert(data.Error);
    }
};
LLocalKml.prototype.show = function (_name, _show) {
    for (var i = 0; i < this.kmllayers.length; i++) {
        if (this.kmllayers[i].name == _name) {
            _show ? this.kmllayers[i].addTo(this.map) : this.kmllayers[i].remove();
            return;
        }
    }
};
LLocalKml.prototype.removeAll = function () {
    if (this.kmllayers && this.kmllayers.length>0)
        for (var i = 0; i < this.kmllayers.length; i++) {
            this.kmllayers[i].remove();
        }
    this.kmllayers = [];
};
LLocalKml.prototype.defaultGeometryOtherOptions = {
    pointToLayer: function (geoJsonPoint, latlng) {
        var _options = {};
        var s = geoJsonPoint.properties.Style;
        if (s && s.IconStyle) {
            if (s.IconStyle && s.IconStyle.Icon && s.IconStyle.Icon.href) {
                _options.icon = L.icon({ iconUrl: s.IconStyle.Icon.href, iconSize: [24, 24] });
            }
        }
        return L.marker(latlng, _options);
    },
    style: function (geoJsonPoint) {
        var s = geoJsonPoint.properties.Style;
        if (s) {
            var _options = { fillOpacity: .8 };
            if (s.LineStyle) {
                _options.color = s.LineStyle.color;
                _options.weight = s.LineStyle.width;
            }
            if (s.PolyStyle) {
                _options.fillColor = s.PolyStyle.color;
                _options.fillOpacity = s.PolyStyle.fill ? s.PolyStyle.fill : 0.8;
                _options.weight = s.PolyStyle.outline;
            }
            return _options;
        }
        else return {};
    }
}