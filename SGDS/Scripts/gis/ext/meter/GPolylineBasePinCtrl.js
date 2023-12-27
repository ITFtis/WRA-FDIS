var GPolylineBasePinCtrl = function (ctrl, initcallback) {
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
GPolylineBasePinCtrl.prototype.reDraw = function (_datas) {
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
                var _title = current.settings.stTitle.call(current.mainctrl, this) ;//|| this.placemarkName; //placemarkName來致KmlCtrl

                if (!_title)
                    console.log("title無資料，pin.stTitle:" + _title);
                var _titlelength = _title.length;

                if (!this.paths)
                    console.log(_title + "無paths");

                var _options = $.extend({ path: this.paths }, _pinstatus);
                _options.zIndex = polylineGoogleMaxZIndex++;
                
                function createPolyline(polylineOptions, _data) {
                    var _line = new google.maps.Polyline(polylineOptions);
                    _line.setting_strokeOpacity = polylineOptions.strokeOpacity;
                    _line.setting_strokeWeight = polylineOptions.strokeWeight;
                    _line.setting_strokeColor = polylineOptions.strokeColor;

                    _line.attributes = _data;
                    
                    if (current.settings.clickable) {
                        google.maps.event.addListener(_line, 'mouseover', function (evt) {
                            if (evt.latLng)
                                _line.currentLatLng = evt.latLng;
                            current.onFocusGraphic(_line);
                        });

                        // assuming you also want to hide the infowindow when user mouses-out
                        google.maps.event.addListener(_line, 'mouseout', function () {
                            current.offFocusGraphic(_line);
                        });
                        google.maps.event.addListener(_line, 'click', function (evt) {
                            if (evt.latLng)
                                _line.currentLatLng = evt.latLng;
                            if (current.settings.useInfoWindow)
                                current.showInfoWindow(_line, false);
                            if (current.pinClick)
                                current.pinClick(_line.attributes);

                        });
                    }

                    _line._title = _title;
                    _line._pinstatus = _pinstatus;
                    return _line;
                }
                if ($.isArray(this.paths[0])) {//考慮MultiGeometry polyline
                    for (i = 0; i < this.paths.length; i++) {
                        var _noptions = $.extend({}, _options);
                        _noptions.path = this.paths[i];
                        current.graphics.push(createPolyline(_noptions, this));
                    }
                }
                else {
                    current.graphics.push(createPolyline(_options, this));
                }
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
GPolylineBasePinCtrl.prototype.getCurrentZoomlevel = function () {
    return this.map.getZoom();
};

GPolylineBasePinCtrl.prototype.showInfoWindow = function (g, viewcenter) {
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

    _infowindow.setZIndex(pinGoogleMaxZIndex);

    var _zoomin = "";
    if (this.settings.canFullInfowindow)
        _zoomin = "<div class='zoom-in-ctrl'><span class=' glyphicon glyphicon-zoom-in'></div>";

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

    //改變infoWindow外觀
    var _afterInfowindow = function () {
        var $_c = $('#' + _infowindow.infoid).parents('.gm-style-iw-a:first').parent().addClass('gm-pin-iw-container').addClass('gm-pin-iw-' + that.settings.name);

        $_cc = $_c.find('#' + _infowindow.infoid);
        var $_title = $_cc.find('> .title');
        if (!g._pinstatus.classes)
            $_title[0].style.backgroundColor = g.setting_strokeColor;

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
            that.map.fitBounds(that._getBounds(g));
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

GPolylineBasePinCtrl.prototype.closeInfoWindow = function () {
    if (g && g._infowindow)
        g._infowindow.close();
    else
        this.infowindow.close();
}

//pinlabel show or hide
GPolylineBasePinCtrl.prototype.showLabel = function (b) {
    var current = this;
    this.isShowLabel = b;

    $.each(this.graphics, function () {
        current._showOneLabel(b, this);
    });
};
GPolylineBasePinCtrl.prototype._showOneLabel = function (b, _line) {

    if (!_line.maplabel) {
        if (!this._getCenter(_line)) {
            return;
        }
        var mapLabel = new MarkerWithLabel({ //這裡才new 增加效能
            position: this._getCenter(_line),
            icon: new google.maps.MarkerImage(
                        ' ',//$.BasePinCtrl.pinIcons.rain.normal.url,
                        null, /* size is determined at runtime */
                        null, /* origin is 0,0 */
                        null, /* anchor is bottom center of the scaled image */
                        new google.maps.Size(0, 0)
                    ),//{ url: _pinstatus.url,  size: new google.maps.Size(30,30) },
            cursor: "pointer",
            raiseOnDrag: true,
            labelContent: _line._title,
            labelAnchor: new google.maps.Point((_line._title ? _line._title.length : 1) * 5.5, 10),
            labelClass: "pin_label " + _line._pinstatus.classes,// "labels", // the CSS class for the label
            labelStyle: { opacity: 0.9 },
            opacity: 0.9,
            labelInBackground: true,
            optimized: true,
            labelVisible: true
        });
        _line.maplabel = mapLabel;
        google.maps.event.addListener(mapLabel, 'click', function (e) {
            google.maps.event.trigger(_line, 'click', e);
        });
    }
    _line.maplabel.setMap(this.map);
    if (b) {
        _line.maplabel.setMap(this.map);
        if (_line.currentLatLng) //在尚未觸發mouseover、click前point是用this._getCenter(_pol)
            _line.maplabel.setOptions({ position: _line.currentLatLng });
    }
    else
        _line.maplabel.setMap(null);
}
//pin show or hide
GPolylineBasePinCtrl.prototype.show = function (b) {
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
GPolylineBasePinCtrl.prototype.getGraphicByRindex = function (ridx) {
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
GPolylineBasePinCtrl.prototype.offFocusGraphic = function (g, fromlist) {
    //var current = this;
    if (!g)
        return;
    //this._resetPinsize(g, this.zoomPinsize());
    //if (!this.isShowLabel) { g.setOptions({ labelVisible: false, opacity: 0.9 }); }
    //else
    
    var _ridx = g.attributes.rindex;
    for (var i = 0; i < this.graphics.length; i++) {//考慮MultiGeometry polyline
        if (this.graphics[i].attributes.rindex == _ridx) {
            this.graphics[i].setOptions({ strokeWeight: g.setting_strokeWeight });
            if (!this.isShowLabel)
                this._showOneLabel(false, this.graphics[i]);
        }
    }

    if (this.offFocusRowIndex && !fromlist)
        this.offFocusRowIndex(g.attributes["rindex"]);
};

//pin focus event
GPolylineBasePinCtrl.prototype.onFocusRowIndex;
GPolylineBasePinCtrl.prototype.offFocusRowIndex;
GPolylineBasePinCtrl.prototype.onMapZoomEnd;
GPolylineBasePinCtrl.prototype.pinClick;

if (!window.pinGoogleMaxZIndex)
    var pinGoogleMaxZIndex = google.maps.Marker.MAX_ZINDEX;
if (!window.polylineGoogleMaxZIndex)
    var polylineGoogleMaxZIndex = google.maps.Marker.MAX_ZINDEX *3/5;

//pin foucus
GPolylineBasePinCtrl.prototype.onFocusGraphic = function (g, fromlist) {//pin mouse over
    if (!g)
        return;
    var w = parseFloat(g.setting_strokeWeight) + 2;
    w = w < 4 ? 4 : w;

    var _ridx = g.attributes.rindex;
    for (var i = 0; i < this.graphics.length; i++) {//考慮MultiGeometry polyline
        if (this.graphics[i].attributes.rindex == _ridx) {
            this.graphics[i].setOptions({ strokeWeight: w });
            this._showOneLabel(true, this.graphics[i]);
        }
    }
    if (this.onFocusRowIndex && !fromlist)
        this.onFocusRowIndex(g.attributes["rindex"]);
};

GPolylineBasePinCtrl.prototype.setOpacity = function (_opacity) {
    this._opacity = _opacity;
    $.each(this.graphics, function () {
        this.setOptions({ strokeOpacity: _opacity});
    });
};
GPolylineBasePinCtrl.prototype._getCenter = function (g) {
    var pcenter = g.pcenter;
    if (!pcenter) {
        var ps = g.getPath().getArray();
        if (ps.length > 0 && ps.length != 2)
            pcenter = g.pcenter = ps[Math.floor(ps.length / 2)];
        else if (ps.length == 2)
            pcenter = this._getBounds(g).getCenter();

    }
    if (!pcenter) { //土石流MultiGeometry多條線getPath()會是[]
        pcenter = g.attributes.paths[0];
        if ($.isArray(pcenter))
            pcenter = pcenter[0];
    }
    return pcenter;
};

GPolylineBasePinCtrl.prototype._getBounds = function (g) {
    var bounds = new google.maps.LatLngBounds();
    var path = g.getPath();
    var sd = path.getLength();
    for (var ii = 0; ii < path.getLength() ; ii++) {
        bounds.extend(path.getAt(ii));
    }
    return bounds;
};

