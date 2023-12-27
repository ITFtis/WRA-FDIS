//var LFeatureBasePinCtrl = function (ctrl, initcallback) {
//    this.mainctrl = ctrl;
//    this.map = ctrl.settings.map;
//    this.settings = ctrl.settings;
//    this.pointctrl = new LBasePinCtrl(ctrl, function () { });
//    this.polylinectrl = new LPolylineBasePinCtrl(ctrl, function () { });
//    this.polygonctrl = new LPolygonBasePinCtrl(ctrl, function () { });
    
//    this.isShowLabel = false;
//    setTimeout(function () { initcallback(); });
//    return this;
//};

var LFeatureBasePinCtrl = function (ctrl, initcallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.settings = ctrl.settings;
    this.pinctrlid = ctrl.settings.layerid + "_" + new Date().getTime();
    this.graphics = [];

    this.visible = false;
    this.isShowLabel = false;
    this.isShowLayer = false;
    var current = this;
    setTimeout(function () { initcallback(); });

    this._opacity = .9;
    this.zpinsize = this._zoomPinsize();
    this.map.on('zoomend', function () {
        current.zpinsize = current._zoomPinsize();
        if (current.intervalflag)
            clearTimeout(current.intervalflag);
        current.intervalflag = setTimeout(function () {
            $.each(current.graphics, function () {
                current._resetPinsize(this);
            })
            
        }, 300);

    });
    //this.map.on('zoomend ', function () {
    //    current.show(current.isShowLayer);

    //})
    return this;
};

//重新劃pin
LFeatureBasePinCtrl.prototype.reDraw = function (_datas) {
    var current = this;
    var oldgraphics = $.extend([], current.graphics);
    current.graphics = [];
    var __isshowlabel = this.isShowLabel;// current.mainctrl.isShowLabel();
    var rindex = 0;
    if (_datas.length !== 0) {
        //var _cZoomPinsize = current.zoomPinsize();

        $.each(_datas, function (idx) {
            var _cdata = this;
            try {
                //尚未實作:to do current.graphics比對新的data，用原marker reset options畫面才不會頓
                var _pinstatus = current.settings.checkDataStatus.call(current.mainctrl, this) || $.PolygonCtrl.defaultSettings.polyStyles[0];
                var _title = current.settings.stTitle.call(current.mainctrl, this);
                if (!_title)
                    console.log("title無資料，pin.stTitle:" + _title);

                if (!this.paths && !this.geojson)
                    console.log(_title + "無paths");
                var _g = L.geoJSON(this.geojson, current.settings.geometryOtherOptions);//feature 有可能包含多個polygon


                if (!_pinstatus.strokeColor) { //LocalKml polygon會有這問題
                    var _opts= _g.getLayers()[0].options;
                    _pinstatus.strokeColor = _opts.color;
                    _pinstatus.strokeWeight = _opts.weight;
                    _pinstatus.strokeOpacity =_opts.opacity;
                    _pinstatus.fillColor = _opts.fillColor;
                    _pinstatus.fillOpacity = _opts.fillOpacity;
                }
                if (!_pinstatus.classes) _pinstatus.classes = "blue_status";

                var _options = {
                    color: _pinstatus.strokeColor, weight: _pinstatus.strokeWeight, opacity: _pinstatus.strokeOpacity,
                    fillColor: _pinstatus.fillColor, fillOpacity: _pinstatus.fillOpacity
                };

                _g.setStyle(_options);
                //if (_isMarker(_g)) {
                //    var sdd = "";
                //}

                current.graphics.push(_g);

                _g.setting_strokeOpacity = _pinstatus.strokeOpacity;
                _g.setting_strokeWeight = _pinstatus.strokeWeight;
                _g.setting_fillOpacity = _pinstatus.fillOpacity;
                _g.settings_fillColor = _pinstatus.fillColor;

                _g.attributes = this;

                _g._title = _title;
                _g.pinstatus = _pinstatus;
                this.rindex = rindex++;

                if (current.settings.clickable) {
                    /****IE mouseout click有問題,但以getLayers個別listen又會造成zoom後部分polygon會消失*****/
                    _g.on('mouseover', function (evt) {
                        this.currentLatLng = evt.latlng;
                        current.onFocusGraphic(this);
                    });
                    _g.on('mouseout', function (evt) {
                        this.currentLatLng = undefined;
                        current.offFocusGraphic(this);
                    });
                    _g.on('click', function (evt) {
                        this.currentLatLng = evt.latlng;
                        if (current.settings.useInfoWindow)
                            current.showInfoWindow(this, false);
                        if (current.pinClick)
                            current.pinClick(this.attributes);
                    });
                }
                current._resetPinsize(_g);
            } catch (ex) {
                console.log(ex + "資料錯誤!!" + JSON.stringify(_cdata));
            }
        });

        this.setOpacity(this._opacity);
        var notPoints = $.grep(_datas, function (g) { return !g.geojson || !g.geojson.geometry ? true : ('Point' == g.geojson.geometry.type ? false : true) });
        if (notPoints.length == 0)
        {
            var $_opa = this.mainctrl.$element.find('.opacity-slider');
            if ($_opa.length > 0) $_opa.hide();
        }
        //this._resetPinsize();
        if (this.isShowLabel)
            this.showLabel(this.isShowLabel);
    }
    //setTimeout(function () { //減少畫面刪掉在新增的頓挫
    $.each(oldgraphics, function (idx, g) {
        this.remove();
    });
};

//目前 map zoom level
LFeatureBasePinCtrl.prototype.getCurrentZoomlevel = function () {
    return this.map.getZoom();
};

LFeatureBasePinCtrl.prototype.showInfoWindow = function (g, viewcenter) {
    if (g.isPopupOpen())
        return;
    var popup = g.unbindPopup().bindPopup('<div class="leaflet-infowindow-title ' + g.pinstatus.classes + '">' + g._title + '</div>' + this.settings.pinInfoContent.call(this.mainctrl, g.attributes, this.settings.infoFields),
        { closeOnClick: this.settings.singleInfoWindow, autoClose: this.settings.singleInfoWindow, className: 'leaflet-infowindow', minWidth: 250 })
    .openPopup(g.currentLatLng || this._getCenter(g)).getPopup();
    g.currentLatLng = undefined;
    var $_pop = $(popup.getElement()).addClass("infowindow-" + this.settings.name);
    if (this.mainctrl.settings.infoWindowAnimation) {

        var ot = $_pop[0].style.transform;
        $_pop[0].style.transform = ot + " scale(.3)";
        $_pop.addClass('leaflet-infow-animation');
        setTimeout(function () {
            $_pop.one('transitionend oTransitionEnd otransitionend MSTransitionEnd',
                    function (evt) {
                        $(this).removeClass('leaflet-infow-animation showing');
                        //popup.getElement().style.transform = ot + "scale(1)"
                    });

            $_pop[0].style.transform = ot + " scale(1)"
            $_pop.addClass('showing');
        });
    }
    var _statusstyle = window.getComputedStyle($_pop.find('.leaflet-infowindow-title')[0]);
    var $_title = $_pop.find('.leaflet-infowindow-title');
    var _cbtn = $_pop.find('.leaflet-popup-close-button')[0];
    var _content = $_pop.find('.leaflet-popup-content')[0];
    $_title.css('box-shadow', $_title.css('box-shadow').replace('#999', _statusstyle.backgroundColor).replace('rgb(153, 153, 153)', _statusstyle.backgroundColor));
    _content.style.borderColor = _cbtn.style.borderColor = _cbtn.style.color = _statusstyle.backgroundColor;
    return;

    //放大
    var $_full_modal;
    $_c.find('.zoom-in-ctrl').click(function () {
        $_cc.toggleClass('full-zoom-in');
        if ($_cc.hasClass("full-zoom-in")) {
            //canFullInfowindow bool or {width:XX, max-width:XXX}
            $_full_modal = helper.jspanel.jspAlertMsg($(g.getMap().getDiv()), { autoclose: 9999999, size: that.settings.canFullInfowindow == true ? undefined : that.settings.canFullInfowindow }, function () {
                that.showInfoWindow(g, viewcenter);
            });//
            $_cc.appendTo($_full_modal.find(".modal-content").empty());
            $_c.hide();
        }
        else {
            $_full_modal.hide();
            $_full_modal.modal('hide');//.trigger('hidden.bs.modal');
        }
    });
};

LFeatureBasePinCtrl.prototype.closeInfoWindow = function (g) {
    return;
    if (g && g._infowindow)
        g._infowindow.close();
    else
        this.infowindow.close();
}

//pinlabel show or hide
LFeatureBasePinCtrl.prototype.showLabel = function (b) {
    var current = this;
    this.isShowLabel = b;

    $.each(this.graphics, function () {
        current._showOneLabel(b, this);
    });
};
LFeatureBasePinCtrl.prototype._showOneLabel = function (b, g) {
    //return;
    if (!this.settings.pinLabel)
        return;
    var that = this;
    var _layers = g.getLayers ? g.getLayers() : [g];
    _layers = _layers[0].getLayers ? _layers[0].getLayers() : _layers;
    $.each(_layers, function () {
        if (b || that.isShowLabel) {
            if (!this.getTooltip()) {
                this.bindTooltip('<div class="pin_label feature-label ' + g.pinstatus.classes + '">' + g._title + '</div>',
                    { direction: 'top', sticky: true, permanent: true, className: 'leaflet-tooltip-label ' });

            }
            //if (!this.isTooltipOpen()) {
            //    this.openTooltip();//g.currentLatLng || that._getCenter(this));//.getPopup();
            g.currentLatLng = undefined;
            if (g.pinstatus.classes) {
                var $_tooltip_label = $(this.getTooltip().getElement()).find('.' + g.pinstatus.classes);
                if ($_tooltip_label.length > 0) {
                    var _statusstyle = window.getComputedStyle($_tooltip_label[0]);//.find('.' + g.pinstatus.classes)[0]);
                    $_tooltip_label[0].style.backgroundColor = 'transparent';
                    $_tooltip_label[0].style.color = _statusstyle.fill;
                }
            }
            
            if (that._isMarker(this))
                this.getTooltip().getElement().style.marginTop = -(this.options.icon.options.iconAnchor[1] - 2) + "px";// (-that.zpinsize.y / 2 - that.zpinsize.offsety + 2) + 'px';
        }
        else if (!b && !that.isShowLabel) {
            this.closeTooltip();
            this.unbindTooltip();//移除Tooltip，不然如呼叫addTo會自動open
        }
    });
}
//pin show or hide
LFeatureBasePinCtrl.prototype.show = function (b) {
    var current = this;
    this.isShowLayer = b;
    if (b) {
       
        //將Point、LineString放上面
        $.each(this.graphics, function () {
            if (this.attributes.geojson.geometry.type == 'GeometryCollection' || this.attributes.geojson.geometry.type == 'Polygon') {
                this.addTo(current.map);
                //if (this.attributes.geojson.geometry.type == 'GeometryCollection') {
                //    var sd = this.getLayers()[0].getLayers();
                //}
            }
        });
        $.each(this.graphics, function () {
            if (this.attributes.geojson.geometry.type != 'GeometryCollection' && this.attributes.geojson.geometry.type != 'Polygon') {
                this.addTo(current.map);
            }
        });
    } else {
        $.each(this.graphics, function () {
            this.remove();
        });
    }

};

//給index取graphic
//index是在reDraw給
LFeatureBasePinCtrl.prototype.getGraphicByRindex = function (ridx) {
    var g;
    $.each(this.graphics, function () {
        if (ridx == this.attributes["rindex"]) {
            g = this;
            return false;
        }
    });
    return g;
};

//pin lose foucus
LFeatureBasePinCtrl.prototype.offFocusGraphic = function (g, fromlist) {
    if (!g)
        return;
    var _cg = g.polygonGroupLayer || g;
    _cg = g;
    _cg.setStyle({ weight: g.setting_strokeWeight });
    if (!this.isShowLabel)
        this._showOneLabel(false, g);

    if (this.offFocusRowIndex && !fromlist)
        this.offFocusRowIndex(_cg.attributes["rindex"]);


};

//pin focus event
LFeatureBasePinCtrl.prototype.onFocusRowIndex;
LFeatureBasePinCtrl.prototype.offFocusRowIndex;
LFeatureBasePinCtrl.prototype.onMapZoomEnd;
LFeatureBasePinCtrl.prototype.pinClick;

if (!window.polygonMaxZIndex)
    var polygonMaxZIndex = 100;// google.maps.Marker.MAX_ZINDEX / 5;
//pin foucus
LFeatureBasePinCtrl.prototype.onFocusGraphic = function (g, fromlist) {//pin mouse over
    if (!g)
        return;
    var _cg = g.polygonGroupLayer || g;
    _cg = g;
    //if (g.polygonGroupLayer)
    _cg.setStyle({ weight: parseFloat(_cg.setting_strokeWeight) + 1 });//, zIndex: pinGoogleMaxZIndex++ });
    //_cg.bringToFront();
    this._showOneLabel(true, g);

    if (this.onFocusRowIndex && !fromlist)
        this.onFocusRowIndex(_cg.attributes["rindex"]);
};

LFeatureBasePinCtrl.prototype.setOpacity = function (_opacity) {
    this._opacity = _opacity;
    $.each(this.graphics, function () {
        var setting_strokeOpacity = this.setting_strokeOpacity == undefined ? 1 : this.setting_strokeOpacity;
        var setting_fillOpacity = this.setting_fillOpacity == undefined ? 1 : this.setting_fillOpacity;
        var fillOpacity = _opacity - (setting_strokeOpacity - setting_fillOpacity) < 0 ? 0 : _opacity - (setting_strokeOpacity - setting_fillOpacity);
        this.setStyle({ opacity: _opacity, fillOpacity: fillOpacity });
    });
};

LFeatureBasePinCtrl.prototype.fitBounds = function () {
    var sadd=L.featureGroup(this.graphics).getBounds();
    this.map.fitBounds(L.featureGroup(this.graphics).getBounds());
}
LFeatureBasePinCtrl.prototype._getCenter = function (g) {
    var pcenter = g.pcenter;
    if (!pcenter) {
        pcenter = g.pcenter = g.getBounds().getCenter();
    }
    return pcenter;
};
LFeatureBasePinCtrl.prototype._isMarker = function (g) {
    return g.setIcon;
}

LFeatureBasePinCtrl.prototype._resetPinsize = function (g) {
    var that = this;
    $.each(g.getLayers(), function () {
        if (this.getLayers)
             that._resetPinsize(this);
        else if (that._isMarker(this)) {
            this.options.icon.options.iconSize = this.options.icon.options.shadowSize = [that.zpinsize.x, that.zpinsize.y];
            this.options.icon.options.iconAnchor = [that.zpinsize.x / 2 - that.zpinsize.offsetx, that.zpinsize.y / 2 + that.zpinsize.offsety];
            this.options.icon.options.shadowAnchor = [that.zpinsize.x / 2 - that.zpinsize.offsetx-5, that.zpinsize.y / 2 + that.zpinsize.offsety];//[this.options.icon.options.iconAnchor.x, this.options.icon.options.iconAnchor.y]
            this.options.icon.options.popupAnchor = [that.zpinsize.offsetx, -(that.zpinsize.y / 2 + that.zpinsize.offsety + 2)];
            this.setIcon(this.options.icon);
            if (this.getTooltip() && this.isTooltipOpen()) {
                this.getTooltip().getElement().style.marginTop = -(this.options.icon.options.iconAnchor[1] - 2) + "px";
            }
        }
    });
}

//pin size at zoom
LFeatureBasePinCtrl.prototype._zoomPinsize = function (psize) { //以map zoom決定 pin size
    var csize = psize ? psize : this.settings.pinsize;
    var x, y;
    if (this.mainctrl.settings.dynPinsize) {
        var cstepx = (csize.step * csize.x) / csize.y;
        var x = csize.x + (this.map.getZoom() - 8) * cstepx;
        var y = csize.y + (this.map.getZoom() - 8) * csize.step;
        if (x < csize.minx) x = csize.minx;
        if (x > csize.maxx) x = csize.maxx;
        if (y < csize.miny) y = csize.miny;
        if (y > csize.maxy) y = csize.maxy;
    } else {
        x = csize.x;
        y = csize.y;
    }
    var offsety = 0;
    var offsetx = 0;
    if (csize.anchor && csize.anchor.indexOf("bottom") >= 0) offsety = y / 2;
    if (csize.anchor && csize.anchor.indexOf("left") >= 0) offsetx = x / 2;
    return { x: x, y: y, offsetx: offsetx, offsety: offsety };
};
//(function () {/*


// Copyright 2011 Google Inc.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//*/
//    var d = "prototype"; function e(a) { this.set("fontFamily", "sans-serif"); this.set("fontSize", 12); this.set("fontColor", "#000000"); this.set("strokeWeight", 4); this.set("strokeColor", "#ffffff"); this.set("align", "center"); this.set("zIndex", 1E3); this.setValues(a) } e.prototype = new google.maps.OverlayView; window.MapLabel = e; e[d].changed = function (a) { switch (a) { case "fontFamily": case "fontSize": case "fontColor": case "strokeWeight": case "strokeColor": case "align": case "text": return h(this); case "maxZoom": case "minZoom": case "position": return this.draw() } };
//    function h(a) {
//        var b = a.a; if (b) {
//            var f = b.style; f.zIndex = a.get("zIndex"); var c = b.getContext("2d"); c.clearRect(0, 0, b.width, b.height); c.strokeStyle = a.get("strokeColor"); c.fillStyle = a.get("fontColor"); c.font = a.get("fontSize") + "px " + a.get("fontFamily"); var b = Number(a.get("strokeWeight")), g = a.get("text"); if (g) {
//                if (b) c.lineWidth = b, c.strokeText(g, b, b); c.fillText(g, b, b); a: { c = c.measureText(g).width + b; switch (a.get("align")) { case "left": a = 0; break a; case "right": a = -c; break a } a = c / -2 } f.marginLeft = a + "px"; f.marginTop =
//                "-0.4em"
//            }
//        }
//    } e[d].onAdd = function () { var a = this.a = document.createElement("canvas"); a.style.position = "absolute"; var b = a.getContext("2d"); b.lineJoin = "round"; b.textBaseline = "top"; h(this); (b = this.getPanes()) && b.mapPane.appendChild(a) }; e[d].onAdd = e[d].onAdd;
//    e[d].draw = function () { var a = this.getProjection(); if (a && this.a) { var b = this.get("position"); if (b) { b = a.fromLatLngToDivPixel(b); a = this.a.style; a.top = b.y + "px"; a.left = b.x + "px"; var b = this.get("minZoom"), f = this.get("maxZoom"); if (b === void 0 && f === void 0) b = ""; else { var c = this.getMap(); c ? (c = c.getZoom(), b = c < b || c > f ? "hidden" : "") : b = "" } a.visibility = b } } }; e[d].draw = e[d].draw; e[d].onRemove = function () { var a = this.a; a && a.parentNode && a.parentNode.removeChild(a) }; e[d].onRemove = e[d].onRemove;
//})()