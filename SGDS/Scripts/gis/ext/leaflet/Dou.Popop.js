(function () {
    var DynamicMapLayerAutoPopup = function (options) {
        var that = this;
        this.options = {
            popup: L.dou.popup.popupGeoJson({ map: app.map, closeOnClick: true, autoClose: true, className: 'leaflet-infowindow', minWidth: 250 }),
            singleWindowInfo: true, layerOptions: {}
        };

        $.extend(true, this.options, options);
        this.layerinfo = undefined;
        this.map = options.map;
        //this.options
        //options;
        this.dynamicMapLayer = L.esri.dynamicMapLayer(options.layerOptions)
            .bindPopup(function (err, featureCollection, response) {
                return that.genPopoWindowInfoContent(err, featureCollection, response)
            }, $.extend({ closeOnClick: true, autoClose: true, className: 'leaflet-infowindow', minWidth: 200 }, options.popupOptions));
        
        //點擊地圖所有的dynamicMapLayer都會bindPopup，為了Popupu一次呈現所有dynamicMapLayer的request結果
        this.geoJsonData = undefined;//bindPopup data
        this.point = undefined;//bindPopup point
        
        var _server = (this.options.layerOptions.proxy && !this.options.layerOptions.url.startsWith(this.options.layerOptions.proxy) ? this.options.layerOptions.proxy+'?':'')+ this.options.layerOptions.url;
        L.dou.popup.getLayerInfo(_server, function (_i) {
            that.layerinfo = _i;
        });

        window.allDynamicMapLayer = window.allDynamicMapLayer || [];
        this.dynamicMapLayer.on('add', function () {
            window.allDynamicMapLayer.push(that);
        });
        this.dynamicMapLayer.on('remove', function () {
            window.allDynamicMapLayer.splice(window.allDynamicMapLayer.indexOf(that), 1);

        });
        this.dynamicMapLayer.on('requeststart', function (ev) {
            if (ev.params.returnGeometry) {
                that.geoJsonData = undefined;
                that.point = [ev.params.geometry.y, ev.params.geometry.x];
            };
        });
        return this;
    }

    DynamicMapLayerAutoPopup.prototype = {
        constructor: DynamicMapLayerAutoPopup,
        _doPopu: function () {
            if (window.allDynamicMapLayer.length == 0)
                return;
            $(this.options.map.getContainer()).addClass('wait');
            if ($.grep(window.allDynamicMapLayer, function (l) {
                return !l.geoJsonData;
            }).length == 0) {
                var _featrues = [];
                $.each(window.allDynamicMapLayer, function () {
                    _featrues = _featrues.concat(this.geoJsonData);
                });
                this.options.popup.openPopup(_featrues, window.allDynamicMapLayer[0].point);
                $(this.options.map.getContainer()).removeClass('wait');
            }
        },
        genPopoWindowInfoContent: function (err, featureCollection, response) {
            var that = this;
            $.each(featureCollection.features, function (idx, f) {
                f.layerinfo = that.layerinfo[f.layerId];
            });
            this.geoJsonData = featureCollection.features;
            this._doPopu();
        },
        genPopoWindowInfoContent_old: function (err, featureCollection, response) {
            var that = this;
            this.clearGeoJSON();

            if (featureCollection.features.length == 0)
                return false;
            var html = '<div class="leaflet-infowindow-title water_normal">title</div>';
            var _contents = [], _caps = [];
            $.each(featureCollection.features, function (idx, f) {
                var pinfo = f.properties;
                var li = that.layerinfo[f.layerId];
                var constr = '<label style="display:none;" data-layerId="' + f.layerId + '" data-id="' + f.id +
                    '" data-index="' + (featureCollection.features.length > 1 ? ((idx + 1) + '/' + featureCollection.features.length) : ' ') + '">' +
                    li.name + (li.displayField ? '(' + li.displayField + ':' + pinfo[li.displayField] + ')' : '') + '</label>';
                constr += "<table>";
                for (var key in pinfo) {
                    if (key == 'X' || key == 'Y' || key == 'geojson' || key == 'Shape')
                        continue;
                    constr += '<tr><td><span  ><b>' + key + '</b></span></td><td>' +
                        '<span>' + pinfo[key] + "</span></td></tr>";
                }
                constr += "</table>";
                _contents.push(constr);
                _caps.push('');
            });
            var $_c = window.helper.bootstrap.genBootstrapCarousel(undefined, undefined, 'meterInfoTemplateContent rete-info-content sewer-info-content' + (featureCollection.features.length == 1 ? ' only-one-data' : ''), _contents, _caps);
            $_c.find('.carousel-item').attr('data-interval', '99999999');
            html += $_c[0].outerHTML;
            this.map.once('popupopen', function (e) {
                //setTimeout(function () {
                var $_pop = $(e.popup.getElement());

                $_pop.find('.carousel').on('slid.bs.carousel', function () {
                    that.clearGeoJSON();

                    var $geodata = $(this).find('.carousel-inner .item.active > label');
                    var id = $geodata.attr('data-id');
                    var layerId = $geodata.attr('data-layerId');
                    var index = $geodata.attr('data-index');
                    var li = that.layerinfo[layerId];

                    var f = $.grep(featureCollection.features, function (_g) {
                        return _g.id == id && _g.layerId == layerId;
                    })[0];

                    //change color
                    var r = li.drawingInfo.renderer;
                    var field1 = li.drawingInfo.renderer.field1
                    var symbol;
                    if (r.type == 'uniqueValue') {
                        var temps = $.grep(li.drawingInfo.renderer.uniqueValueInfos, function (vi) { return vi.value == f.properties[field1] });
                        if (temps.length > 0)
                            symbol = temps[0].symbol;
                        else
                            symbol = r.defaultSymbol
                    } else symbol = r.symbol;

                    symbol = JSON.parse(JSON.stringify(symbol));

                    //[].join()
                    var color = 'rgb(' + symbol.color.splice(0, 3).join(',') + ')';
                    var outlinecolor = symbol.outline ? 'rgb(' + symbol.outline.color.splice(0, 3).join(',') + ')' : color;
                    var lineWidth = symbol.outline ? symbol.outline.width : symbol.width;

                    var _statusstyle = window.getComputedStyle($_pop.find('.leaflet-infowindow-title')[0]);
                    var $_title = $_pop.find('.leaflet-infowindow-title');
                    var _cbtn = $_pop.find('.leaflet-popup-close-button')[0];
                    var _content = $_pop.find('.leaflet-popup-content')[0];
                    //$_title.css('box-shadow', $_title.css('box-shadow').replace('#999', color).replace('rgb(153, 153, 153)', color));
                    $_title[0].style.backgroundColor = _content.style.borderColor = _cbtn.style.borderColor = _cbtn.style.color = color;
                    $_pop.find('.leaflet-popup-tip')[0].style.boxShadow = " 3px 3px 15px " + color;


                    $_title.html($geodata.text() + '<label style="position:absolute;top:.9em;right:.2em;">' + index + '</label>');
                    var gj = L.geoJSON([f], {
                        pointToLayer: function (geoJsonPoint, latlng) {
                            return L.circleMarker(latlng, { radius: symbol.size });
                        },
                        style: function (geoJsonFeature) {
                            return { color: outlinecolor, fillColor: color, fillOpacity: 1, weight: lineWidth + (li.geometryType == 'esriGeometryPoint' ? 0 : 3) };
                        }
                    }).addTo(that.map);
                    that.options.singleWindowInfo ? window.geoJSON = gj : that.geoJSON = gj;
                }).trigger('slid.bs.carousel');
            });

            return html;
        },
        clearGeoJSON: function () {
            var geoJSON = this.options.singleWindowInfo ? window.geoJSON : this.geoJSON;
            if (geoJSON) //移除前次GEO
                geoJSON.remove();
        }
    }


    var PopupGeoJson = L.Class.extend({
        initialize: function (options) {
            this.options = $.extend(true, {
                closeOnClick: true, autoClose: true, className: 'leaflet-infowindow', minWidth: 220,
                geoJSONoptions: { removeOnPopupClose:true, pointToLayer: $.proxy(this._pointToLayer, this), style: $.proxy(this._style, this) }
            }, options);
            this.geoJSON = L.geoJSON([], this.options.geoJSONoptions);// { pointToLayer: this.options.geoJSONoptions.pointToLayer, style: this.options.geoJSONoptions.style });
            this.popup = L.popup(this.options);
            //this.data;
            if (this.options.map == undefined)
                alert('popupGeoJson options map is null error');
        },
        //constructor: popupGeoJson,
        openPopup: function (data, latlng) {
            var that = this;
            if (!data || data.length == 0)
                return;
            var emptyarray = $.grep(data, function () { return '-' });
            var $_c = window.helper.bootstrap.genBootstrapCarousel(undefined, undefined, 'meterInfoTemplateContent rete-info-content popupGeoJson-info-content' + (data.length == 1 ? ' only-one-data' : ''), emptyarray, undefined);
            $_c.find('.carousel-item').attr('data-interval', '99999999');

            var html = '<div class="leaflet-infowindow-title water_normal">title</div>';
            html += $_c[0].outerHTML;

            if (this.popup.isOpen())
                this.options.map.closePopup(this.popup);
            this.popup.setLatLng(latlng);
            this.popup.setContent(html);
            this.options.map.once('popupopen', function (e) {
                var $_pop = $(e.popup.getElement());
                var $_title = $_pop.find('.leaflet-infowindow-title');
                var _cbtn = $_pop.find('.leaflet-popup-close-button')[0];
                var _content = $_pop.find('.leaflet-popup-content')[0];

                $_pop.find('.carousel').on('slide.bs.carousel', function (ev) {
                    var idx = ev.to == undefined ? 0 : ev.to;
                    var d = data[idx];
                    //title                    
                    $_title.html(that._itemtitle(d) + (data.length > 1 ? '<label style="position:absolute;top:.9em;right:.2em;">' + (idx + 1 + '/' + data.length) + '</label>' : ''));
                    var $_item = $_pop.find('.carousel').find('>.carousel-inner>.item').eq(idx);
                    //itemcontent
                    if (!$_item.html()) {
                        $_item.html(that._itemcontent(d));
                    }
                    //style
                    var symbol = that._getSymbol(d);
                    var color = 'rgb(0,0,0)';
                    if (symbol && symbol.color)
                        color = 'rgb(' + symbol.color.splice(0, 3).join(',') + ')';

                    $_title[0].style.backgroundColor = _content.style.borderColor = _cbtn.style.borderColor = _cbtn.style.color = color;
                    $_pop.find('.leaflet-popup-tip')[0].style.boxShadow = " 3px 3px 15px " + color;
                    //that.geoJSON.clearLayers().addData(d).addTo(that.options.map);
                    that.paintGeodataToMap(d, true);
                }).trigger('slide.bs.carousel');
            }).once('popupclose', function (e) {
                if (that.options.geoJSONoptions.removeOnPopupClose)
                    that.geoJSON.clearLayers();
            });
            this.options.map.openPopup(this.popup);
        },
        paintGeodataToMap: function (d, clearother) {
            if (clearother)
                this.geoJSON.clearLayers();
            this.geoJSON.addData(d).addTo(this.options.map);
        },
        clear: function () {
            if (this.popup.isOpen())
                this.options.map.closePopup(this.popup);
            this.geoJSON.clearLayers();
        },
        _pointToLayer: function (geoJsonPoint, latlng) {
            var symbol = this._getSymbol(geoJsonPoint);
            return L.circleMarker(latlng, { radius: symbol.size });
        },
        _style: function (geoJsonPoint, latlng) {
            var symbol = this._getSymbol(geoJsonPoint);
            var color = 'rgb(0,0,0)';
            if (symbol && symbol.color)
               color= 'rgb(' + symbol.color.splice(0, 3).join(',') + ')';
            var outlinecolor = symbol.outline ? 'rgb(' + symbol.outline.color.splice(0, 3).join(',') + ')' : color;
            var lineWidth = symbol.outline ? symbol.outline.width : symbol.width;
            return { color: outlinecolor, fillColor: color, fillOpacity: 1, weight: lineWidth + (geoJsonPoint.layerinfo.geometryType == 'esriGeometryPoint' ? 0 : 3) };
        },
        _itemtitle: function (d) {
            return d.layerinfo.name + (d.layerinfo.displayField ? '(' + d.layerinfo.displayField + ':' + d.properties[d.layerinfo.displayField] + ')' : '');
        },
        _itemcontent: function (d) {
            var itemhtml = "<table>";
            for (var key in d.properties) {
                if (key == 'X' || key == 'Y' || key == 'geojson' || key == 'Shape')
                    continue;
                itemhtml += '<tr><td><span  ><b>' + key + '</b></span></td><td>' +
                    '<span>' + d.properties[key] + "</span></td></tr>";
            }
            itemhtml += "</table>";
            return itemhtml;
        },
        _getSymbol: function (d) {
            var li = d.layerinfo;
            var r = li.drawingInfo.renderer;
            var field1 = li.drawingInfo.renderer.field1
            var symbol;
            if (r.type == 'uniqueValue') {
                var temps = $.grep(li.drawingInfo.renderer.uniqueValueInfos, function (vi) { return vi.value == d.properties[field1] });
                if (temps.length > 0)
                    symbol = temps[0].symbol;
                else
                    symbol = r.defaultSymbol
            } else symbol = r.symbol;

            symbol = JSON.parse(JSON.stringify(symbol));

            return symbol;

        }
    });

    var getLayerInfo = function (_server,callback) {
        dou.helper.data.get((_server.substr(_server.length - 1) == '/' ? _server : _server + '/') + 'layers?f=pjson', function (d) {
            var _layerinfo = {};
            $.each(JSON.parse(d).layers, function () {
                _layerinfo[this.id] = this;
            });
            callback(_layerinfo);
        }, {}, true);
    }

    L.dou = L.dou || {};
    L.dou.popup = L.dou.popup || {};
    L.dou.popup.esri = L.dou.popup.esri || {};
    L.dou.popup.esri.DynamicMapLayerAutoPopup = DynamicMapLayerAutoPopup;//要new
    L.dou.popup.esri.dynamicMapLayerAutoPopup = function (options) { return new DynamicMapLayerAutoPopup(options) };//不用new
    L.dou.popup.PopupGeoJson = PopupGeoJson;     //要new
    L.dou.popup.popupGeoJson = function (options) { return new PopupGeoJson(options) };//不用new
    L.dou.popup.getLayerInfo = getLayerInfo;
})(window);