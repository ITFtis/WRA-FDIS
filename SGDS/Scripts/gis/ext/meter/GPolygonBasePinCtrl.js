var GPolygonBasePinCtrl = function (ctrl, initcallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.settings = ctrl.settings;
    this.pinctrlid = ctrl.settings.layerid + "_" + new Date().getTime();
    this.graphics = [];

    this.visible = false;
    this.isShowLabel = false;

    this.infowindow = new google.maps.InfoWindow({ // custom infoWindow https://artandlogic.com/2014/02/custom-google-maps-info-windows/
        //content: "ooooooooooooooooooooooooooooo"
    });

    var current = this;
    setTimeout(function () { initcallback(); });

    this._opacity = .9;
    return this;
};

//重新劃pin
GPolygonBasePinCtrl.prototype.reDraw = function (_datas) {
    var current = this;
    var oldgraphics = $.extend([], current.graphics);
    //$.each(current.graphics, function (idx, g) {
    //    this.setMap(null);
    //});

    current.graphics = [];

    var __isshowlabel = this.isShowLabel;// current.mainctrl.isShowLabel();
    var rindex = 0;
    if (_datas.length !== 0) {
        //var _cZoomPinsize = current.zoomPinsize();

        $.each(_datas, function () {
            var _cdata = this;
            try {
                //尚未實作:to do current.graphics比對新的data，用原marker reset options畫面才不會頓
                var _pinstatus = current.settings.checkDataStatus.call(current.mainctrl, this);
                var _title = current.settings.stTitle.call(current.mainctrl, this);
                if (!_title)
                    console.log("title無資料，pin.stTitle:" + _title);
                //var _titlelength = _title.length;

                if (!this.paths)
                    console.log(_title + "無paths");

                var _options = $.extend({ paths: this.paths }, _pinstatus);
                if (_options.zIndex == undefined)
                    _options.zIndex = polygonGoogleMaxZIndex++;
                //console.log(JSON.stringify(_options));
                var _polygon = new google.maps.Polygon(_options);

                _polygon.setting_strokeOpacity = _options.strokeOpacity;
                _polygon.setting_strokeWeight = _options.strokeWeight;
                _polygon.setting_fillOpacity = _options.fillOpacity;
                _polygon.settings_fillColor = _options.fillColor;
                _polygon.attributes = this;
                current.graphics.push(_polygon);
                if (current.settings.clickable) {
                    google.maps.event.addListener(_polygon, 'mouseover', function (evt) {
                        _polygon.currentLatLng = evt.latLng;
                        current.onFocusGraphic(_polygon);
                    });
                    
                    // assuming you also want to hide the infowindow when user mouses-out
                    google.maps.event.addListener(_polygon, 'mouseout', function (evt) {
                        current.offFocusGraphic(_polygon);
                    });
                    google.maps.event.addListener(_polygon, 'click', function (evt) {
                        _polygon.currentLatLng = evt.latLng;
                        if (current.settings.useInfoWindow)
                            current.showInfoWindow(_polygon, false);
                        if (current.pinClick)
                            current.pinClick(_polygon.attributes);

                    });
                }
               
                _polygon._title = _title;
                _polygon._pinstatus = _pinstatus;
                this.rindex = rindex++;
            } catch (ex) {
                console.log("資料錯誤!!" + JSON.stringify(_cdata));
            }
        });

        this.setOpacity(this._opacity);

        if (this.isShowLabel)
            this.showLabel(this.isShowLabel);
    }
    //setTimeout(function () { //減少畫面刪掉在新增的頓挫
        $.each(oldgraphics, function (idx, g) {
            this.setMap(null);
            if (this.maplabel)
                this.maplabel.setMap(null);
        });
    //}, 300);
        if (!this.map.hasinfowindow_iw_roow) { //僅為了在infowindow的root Dom增加class以作為animation不會閃
            this.map.hasinfowindow_iw_roow = true;
            var wid = 'idddw-id-' + helper.misc.geguid();
            var ifw = new google.maps.InfoWindow({ content: "<div id='" + wid + "' ></div>" });
            ifw.open(this.map, undefined);
            google.maps.event.addListener(ifw, 'domready', function () {
                $('#' + wid).parents('.gm-style-iw-a:first').parent().parent().addClass('gm-pin-iw-root');
                ifw.close();
            });
        }
};

//目前 map zoom level
GPolygonBasePinCtrl.prototype.getCurrentZoomlevel = function () {
    return this.map.getZoom();
};

GPolygonBasePinCtrl.prototype.showInfoWindow = function (g, viewcenter) {
    var that = this;
    var _id = 'iw-id-' + helper.misc.geguid();
    var _infowindow = this.infowindow;
    if (this.settings.singleInfoWindow !== true && g) {
        if (!g._infowindow)
            g._infowindow = new google.maps.InfoWindow({});
        _infowindow = g._infowindow;
        setTimeout(function () {
            $_cc.on('mouseover', function () {
                g._infowindow.setZIndex(pinGoogleMaxZIndex++);
            });
        });
    }

    var _zoomin = "";
    
    if (this.settings.canFullInfowindow)
        _zoomin = "<div class='zoom-in-ctrl'><span class=' glyphicon glyphicon-zoom-in'></div>";

    _infowindow.setZIndex(pinGoogleMaxZIndex);
    _infowindow.setContent("<div id=" + _id + " class='scrollFix googleContentFix'>" + _zoomin + "<div align='center' class='title " + g._pinstatus.classes + "'>" + this.settings.stTitle.call(this.mainctrl, g.attributes) + "</div>" + this.settings.pinInfoContent.call(this.mainctrl, g.attributes, this.settings.infoFields) + "</div>");

    _infowindow.infoid = _id;
    _infowindow.fromShowInfoWindow = true;
    //listen domready
    if (!_infowindow.hasdomready) {
        _infowindow.hasdomready = true;
        google.maps.event.addListener(_infowindow, 'domready', function (evt, err, wewe) {
            _afterInfowindow();
        });
    }
    _infowindow.open(this.map);//, g.latLngs);
    _infowindow.setPosition(g.currentLatLng ? g.currentLatLng : this._getCenter(g));//在尚未觸發mouseover、click前point是用this._getCenter(_pol)
    
    if (viewcenter !== false) {
        this.map.setCenter(this._getCenter(g));
        console.log('viewcenter' + viewcenter);
    }
    //改變infoWindow外觀
    var _afterInfowindow = function () {
        var $_c = $('#' + _infowindow.infoid).parents('.gm-style-iw-a:first').parent().addClass('gm-pin-iw-container').addClass('gm-pin-iw-' + that.settings.name);

        $_cc = $_c.find('#' + _infowindow.infoid);
        var $_title = $_cc.find('> .title');
        if (!g._pinstatus.classes)
            $_title[0].style.backgroundColor = g.settings_fillColor;

        var _style = window.getComputedStyle($_title[0]);
        //改變 title box-shadow
        $_title.css('box-shadow', $_title.css('box-shadow').replace('#999', _style.backgroundColor).replace('rgb(153, 153, 153)', _style.backgroundColor));

        var $_gsi = $_c.find('>.gm-style-iw-a');
        var _close = $_c.find('button.gm-ui-hover-effect').addClass('info-window-close-btn')[0];
        $_gsi[0].style.borderBottomColor = $_gsi[0].style.borderLeftColor = $_gsi[0].style.borderRightColor = $_gsi[0].style.borderTopColor =
            _close.style.borderBottomColor = _close.style.borderLeftColor = _close.style.borderRightColor = _close.style.borderTopColor = _style.backgroundColor;

        //infoWindowAnimation
        if (_infowindow.fromShowInfoWindow && that.mainctrl.settings.infoWindowAnimation) {
            $_c[0].style.transformOrigin = $_gsi.css("left") + ' ' + $_gsi.css("top");
            $_c.addClass('gm-pin-iw-animation');
            $_c.one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
                function (evt) {
                    $_c.removeClass('gm-pin-iw-animation');
                });
        }
        _infowindow.fromShowInfoWindow = false;

        if (viewcenter !== false && that.settings) {
            var bounds = new google.maps.LatLngBounds();
            var paths = g.getPaths();
            var path;
            for (var i = 0; i < paths.getLength() ; i++) {
                path = paths.getAt(i);
                for (var ii = 0; ii < path.getLength() ; ii++) {
                    bounds.extend(path.getAt(ii));
                }
            }
            that.map.fitBounds(bounds);
        }

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
            that.mainctrl.$element.trigger($.BasePinCtrl.eventKeys.fullInfowindowChange, [$_cc[0], $_cc.hasClass("full-zoom-in")]);
        });
    }
};

GPolygonBasePinCtrl.prototype.closeInfoWindow = function (g) {
    if (g && g._infowindow)
        g._infowindow.close();
    else
        this.infowindow.close();
}

//pinlabel show or hide
GPolygonBasePinCtrl.prototype.showLabel = function (b) {
    var current = this;
    this.isShowLabel = b;
   
    $.each(this.graphics, function () {
        current._showOneLabel(b, this);
    });
};
GPolygonBasePinCtrl.prototype._showOneLabel = function (b, _pol) {
    //console.log('1');
    if (!_pol.maplabel) {
        var mapLabel = new MarkerWithLabel({ //這裡才new 增加效能
            position: this._getCenter(_pol),
            icon: new google.maps.MarkerImage(
                        ' ',//$.BasePinCtrl.pinIcons.rain.normal.url,
                        null, /* size is determined at runtime */
                        null, /* origin is 0,0 */
                        null, /* anchor is bottom center of the scaled image */
                        new google.maps.Size(0,0 )
                    ),//{ url: _pinstatus.url,  size: new google.maps.Size(30,30) },
            cursor: "pointer",
            raiseOnDrag: true,
            labelContent: _pol._title,
            labelAnchor: new google.maps.Point((_pol._title?_pol._title.length:1) * 5.5, 10),
            labelClass: "pin_label " + _pol._pinstatus.classes,// "labels", // the CSS class for the label
            labelStyle: { opacity: 0.9 },
            opacity: 0.9,
            labelInBackground: true,
            optimized: true,
            labelVisible: true,
            zIndex: 0////////解決如有clusterMarker會引響clusterMarker的click
        });
        _pol.maplabel = mapLabel;
        google.maps.event.addListener(mapLabel, 'click', function (e) {
            google.maps.event.trigger(_pol, 'click', e);
        });
    }
    if (b) {
        _pol.maplabel.setMap(this.map); 
        if (_pol.currentLatLng) //在尚未觸發mouseover、click前point是用this._getCenter(_pol)
            _pol.maplabel.setOptions({ position: _pol.currentLatLng });
        if (_pol.maplabel.label.listeners_) {
            setTimeout(function () {
                for (i = 0; i < _pol.maplabel.label.listeners_.length; i++) {
                    google.maps.event.removeListener(_pol.maplabel.label.listeners_[i]);
                }
            });
        }
    }
    else
        try {
            _pol.maplabel.setMap(null);
        } catch (e) { }
}
//pin show or hide
GPolygonBasePinCtrl.prototype.show = function (b) {
    var current = this;
    $.each(this.graphics, function () {
        if (b)
            this.setMap(current.map);
        else
            this.setMap(null);
    });
};

//給index取graphic
//index是在reDraw給
GPolygonBasePinCtrl.prototype.getGraphicByRindex = function (ridx) {
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
GPolygonBasePinCtrl.prototype.offFocusGraphic = function (g, fromlist) {
    //var current = this;
    if (!g)
        return;
    //this._resetPinsize(g, this.zoomPinsize());
    //if (!this.isShowLabel) { g.setOptions({ labelVisible: false, opacity: 0.9 }); }
    //else
    //{
    g.setOptions({ strokeWeight: g.setting_strokeWeight });
    if(!this.isShowLabel)
        this._showOneLabel(false, g);

    if (this.offFocusRowIndex && !fromlist)
        this.offFocusRowIndex(g.attributes["rindex"]);


};

//pin focus event
GPolygonBasePinCtrl.prototype.onFocusRowIndex;
GPolygonBasePinCtrl.prototype.offFocusRowIndex;
GPolygonBasePinCtrl.prototype.onMapZoomEnd;
GPolygonBasePinCtrl.prototype.pinClick;

if (!window.pinGoogleMaxZIndex)
    var pinGoogleMaxZIndex = google.maps.Marker.MAX_ZINDEX;
if (!window.polygonGoogleMaxZIndex)
    var polygonGoogleMaxZIndex = 100;// google.maps.Marker.MAX_ZINDEX / 5;
//pin foucus
GPolygonBasePinCtrl.prototype.onFocusGraphic = function (g, fromlist) {//pin mouse over
    if (!g)
        return;
    g.setOptions({ strokeWeight: parseFloat(g.setting_strokeWeight) + 1});//, zIndex: pinGoogleMaxZIndex++ });

    this._showOneLabel(true, g);

    if (this.onFocusRowIndex && !fromlist)
        this.onFocusRowIndex(g.attributes["rindex"]);
};

GPolygonBasePinCtrl.prototype.setOpacity = function (_opacity) {
    this._opacity = _opacity;
    $.each(this.graphics, function () {
        var setting_strokeOpacity = this.setting_strokeOpacity == undefined ? 1 : this.setting_strokeOpacity;
        var setting_fillOpacity = this.setting_fillOpacity == undefined ? 1 : this.setting_fillOpacity;
        var fillOpacity = _opacity - (setting_strokeOpacity - setting_fillOpacity)<0?0: _opacity - (setting_strokeOpacity - setting_fillOpacity);
        this.setOptions({ strokeOpacity: _opacity, fillOpacity:fillOpacity});
    });
};
GPolygonBasePinCtrl.prototype.fitBounds = function (options) {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < this.graphics.length; i++) {
        var paths = this.graphics[i].getPaths();
        paths.forEach(function (path) {
            var ar = path.getArray();
            for (var i = 0, l = ar.length; i < l; i++) {
                bounds.extend(ar[i]);
            }
        })
    }
    map.fitBounds(bounds)
}
GPolygonBasePinCtrl.prototype._getCenter = function (g) {
    var pcenter = g.pcenter;
    if (!pcenter) {
        var bounds = new google.maps.LatLngBounds();
        var adsd = g.getPaths().getArray();
        $.each(g.getPaths().getArray(), function () {
            $.each(this.getArray(), function () {
                bounds.extend(this);
            });
        });
        pcenter = g.pcenter = bounds.getCenter();
    }
    return pcenter;
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