var LPolygonBasePinCtrl = function (ctrl, initcallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.settings = ctrl.settings;
    this.pinctrlid = ctrl.settings.layerid + "_" + new Date().getTime();
    this.graphics = [];

    this.visible = false;
    this.isShowLabel = false;
    this.isShowLayer = false;

    this.currentFocusGraphic;
    var current = this;

    setTimeout(function () { initcallback(); });

    this._opacity = .9;
    var _zoomendtimerflag;
    this.map.on('zoomend ', function () { //20211125為什要呼叫show
        //current.show(current.isShowLayer);
        if (current.onMapZoomEnd) { //觸發onMapZoomEnd事件
            current.onMapZoomEnd(current.map.getZoom());
        }
    })
    return this;
};

//重新劃pin
LPolygonBasePinCtrl.prototype.reDraw = function (_datas) {
    var current = this;
    var oldgraphics = $.extend([], current.graphics);
    current.graphics = [];
    var __isshowlabel = this.isShowLabel;
    var rindex = 0;
    if (_datas.length !== 0) {
        $.each(_datas, function () {
            var _cdata = this;
            try {
                //尚未實作:to do current.graphics比對新的data，用原marker reset options畫面才不會頓
                var _pinstatus = current.settings.checkDataStatus.call(current.mainctrl, this) || $.PolygonCtrl.defaultSettings.polyStyles[0];
                var _title = current.settings.stTitle.call(current.mainctrl, this);
                if (!_title)
                    console.log("title無資料，pin.stTitle:" + _title);

                if (!this.paths && !this.geojson)
                    console.log(_title + "無paths");
                if (_title == '七股區')
                    var sss = this.geojson;
                var g;
                if (this.geojson) {
                    g = L.geoJSON(this.geojson, current.settings.geometryOtherOptions);//feature 有可能包含多個polygon
                }
                else if (this.paths) {
                    var latlngs = [];
                    $.each(this.paths, function () {
                        var lls = [];
                        if ($.isArray(this[0])) {
                            $.each(this, function () {
                                lls.push([this[1], this[0]]);
                            });
                        }
                        else
                            lls = [this[1], this[0]];
                        latlngs.push(lls);
                    });
                   
                    //console.log(JSON.stringify(_options));
                    g = L.polygon(latlngs, current.settings.geometryOtherOptions);//, { color: '#123456',weight:_pinstatus.strokeWeight fillColor: '#444', fillOpacity: 0.8 });//.addTo(current.map);//, _options);
                }
                var _options = $.extend({
                        color: _pinstatus.strokeColor, weight: _pinstatus.strokeWeight, opacity: _pinstatus.strokeOpacity,
                    fillColor: _pinstatus.fillColor, fillOpacity: _pinstatus.fillOpacity
                    }, _pinstatus);
                
                if (_options.zIndex == undefined)
                    _options.zIndex = polygonMaxZIndex++;

                g.setStyle(_options);

                current.graphics.push(g);

                g.setting_strokeOpacity = _pinstatus.strokeOpacity;
                g.setting_strokeWeight = _pinstatus.strokeWeight;
                g.setting_fillOpacity = _pinstatus.fillOpacity;
                g.settings_fillColor = _pinstatus.fillColor;

                g.attributes = this;
                
                g._title = _title;
                g.pinstatus = _pinstatus;
                this.rindex = rindex++;
                //console.log('draw:' + g._title + '>>' + g.getLayers().length);

            /****IE mouseout click有問題,但以getLayers個別listen又會造成zoom後部分polygon會消失*****/
                if (current.settings.clickable) {
                    g.on('mouseover', function (evt) {
                        this.currentLatLng = evt.latlng;
                        current.onFocusGraphic(this);
                    });
                    g.on('mouseout', function (evt) {
                        this.currentLatLng = undefined;
                        current.offFocusGraphic(this);
                    });
                    g.on('click', function (evt) {
                        this.currentLatLng = evt.latlng;
                        if (current.settings.useInfoWindow)
                            current.showInfoWindow(this, false);
                        if (current.pinClick)
                            current.pinClick(this.attributes);
                    });
                }
                return;
                //_layers[0].getLayers多個polygon ,以getLayers個別listen會造成zoom後部分polygon會消失
                var _layers = g.getLayers();
                _layers = _layers[0].getLayers ? _layers[0].getLayers() : [g];//_layers[0].getLayers多個polygon
                //_layers = _layers.length == 0 ? [g] : _layers;
                if (g._title == '屏東縣')
                    var dfdf = "";
                $.each(_layers, function () {
                    if (this != g) {
                        this.attributes = g.attributes;
                        this._title = g._title;
                        this.pinstatus = g.pinstatus;
                        this.polygonGroupLayer = g;
                    }
                    var _g = this;
                    this.on('mouseover', function (evt) {
                        //L.DomEvent.stop(evt);//不再向上觸發map event
                        this.currentLatLng = evt.latlng;

                        current.onFocusGraphic(_g);
                    });
                    this.on('mouseout', function (evt) {
                        //L.DomEvent.stop(evt);//不再向上觸發map event
                        this.currentLatLng = undefined;
                        current.offFocusGraphic(_g);
                    });
                    this.on('click', function (evt) {
                        this.currentLatLng = evt.latlng;
                        if (current.settings.useInfoWindow)
                            current.showInfoWindow(_g, false);
                        if (current.pinClick)
                            current.pinClick(_g.attributes);
                    });
                });
            } catch (ex) {
                console.log(ex+"資料錯誤!!" + JSON.stringify(_cdata));
            }
        });
     
        this.setOpacity(this._opacity);

        if (this.isShowLabel)
            this.showLabel(this.isShowLabel);
    }
    //setTimeout(function () { //減少畫面刪掉在新增的頓挫
        $.each(oldgraphics, function (idx, g) {
            this.remove();
            //if (this.maplabel)
            //    this.maplabel.setMap(null);
        });
    //}, 300);
};

//目前 map zoom level
LPolygonBasePinCtrl.prototype.getCurrentZoomlevel = function () {
    return this.map.getZoom();
};

LPolygonBasePinCtrl.prototype.showInfoWindow = function (g, viewcenter) {
    var that = this;
    if (g.isPopupOpen())
        return;

    var _zoomin = "";
    if (this.settings.canFullInfowindow)
        _zoomin = "<div class='zoom-in-ctrl'><span class=' glyphicon glyphicon-zoom-in'></div>";

    var popup = g.unbindPopup().bindPopup(_zoomin+'<div class="leaflet-infowindow-title ' + g.pinstatus.classes + '">' + g._title + '</div>' + this.settings.pinInfoContent.call(this.mainctrl, g.attributes, this.settings.infoFields),
        $.extend({ closeOnClick: this.settings.singleInfoWindow, autoClose: this.settings.singleInfoWindow, className: 'leaflet-infowindow', minWidth: 250 },
        typeof this.settings.useInfoWindow == 'object' ? this.settings.useInfoWindow : {}))
    .openPopup(g.currentLatLng || this._getCenter(g)).getPopup();
    g.currentLatLng = undefined;
    var $_pop = $(popup.getElement()).addClass("infowindow-" + this.settings.name);
    if (this.settings.classes)
        $_pop.addClass(this.settings.classes);
    if (this.mainctrl.settings.infoWindowAnimation) {

        var ot = $_pop[0].style.transform;
        $_pop[0].style.transform = ot + " scale(.3)";
        $_pop.addClass('leaflet-infow-animation');
        setTimeout(function () {
            $_pop.one('transitionend oTransitionEnd otransitionend MSTransitionEnd',
                    function (evt) {
                        $(this).removeClass('leaflet-infow-animation showing');
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
        
    //放大
    var $_full_modal;
    var $_cc = $_pop.find(".leaflet-popup-content");
    $_pop.find('.zoom-in-ctrl').click(function () {
        $_cc.toggleClass('full-zoom-in');
        if ($_cc.hasClass("full-zoom-in")) {
            $_full_modal = helper.jspanel.jspAlertMsg($(that.map.getContainer()), { autoclose: 9999999, size: that.settings.canFullInfowindow == true ? undefined : that.settings.canFullInfowindow, classes: "modal-lg modal-dialog-full-window modal-dialog-" + that.settings.name + "-full-window" }, function () {
                that.showInfoWindow(g, viewcenter);
            });//
            $_cc.appendTo($_full_modal.find(".modal-content").empty());
        }
        else {
            $_full_modal.hide();
            $_full_modal.modal('hide');//.trigger('hidden.bs.modal');
        }
        that.mainctrl.$element.trigger($.BasePinCtrl.eventKeys.fullInfowindowChange, [$_cc[0], $_cc.hasClass("full-zoom-in")]);
    });
};

LPolygonBasePinCtrl.prototype.closeInfoWindow = function (g) {
    return;
    if (g && g._infowindow)
        g._infowindow.close();
    else
        this.infowindow.close();
}

//pinlabel show or hide
LPolygonBasePinCtrl.prototype.showLabel = function (b) {
    var current = this;
    this.isShowLabel = b;
   
    $.each(this.graphics, function () {
        current._showOneLabel(b, this);
    });
};
LPolygonBasePinCtrl.prototype._showOneLabel = function (b, g) {
    //return;
    var that = this;
    var _layers= g.getLayers?g.getLayers():[g];
    _layers = _layers[0].getLayers ? _layers[0].getLayers() : _layers;
    //console.log(g._title + b);
    $.each(_layers, function () {
        if (b || that.isShowLabel) {
            if (!this.getTooltip()) {
                this.bindTooltip('<div class="pin_label polygon-label ' + g.pinstatus.classes + '">' + g._title + '</div>',
                    { direction: 'top', sticky: true, permanent: true, className: 'leaflet-tooltip-label ' });

            }
            //if (!this.isTooltipOpen()) 
            this.openTooltip(g.currentLatLng || that._getCenter(this));//.getPopup();
            g.currentLatLng = undefined;
            var $_tooltip_label = $(this.getTooltip().getElement()).find('.' + g.pinstatus.classes);
            if ($_tooltip_label.length > 0) {
                var _statusstyle = window.getComputedStyle($_tooltip_label[0]);//.find('.' + g.pinstatus.classes)[0]);
                $_tooltip_label[0].style.backgroundColor = 'transparent';
                $_tooltip_label[0].style.color = _statusstyle.fill;
            }
            //}
        }
        else if (!b && !that.isShowLabel) {
            this.closeTooltip();
            this.unbindTooltip();//移除Tooltip，不然如呼叫addTo會自動open
        }
    });
}
//pin show or hide
LPolygonBasePinCtrl.prototype.show = function (b) {
    var current = this;
    this.isShowLayer = b;
    $.each(this.graphics, function () {
        //if (this._title == "屏東縣"){
        //    var sad = "";
        //    this.reDraw();
        //    }
        if (b)
            this.addTo(current.map);
        else {
            this.remove();
        }
    });
};

//給index取graphic
//index是在reDraw給
LPolygonBasePinCtrl.prototype.getGraphicByRindex = function (ridx) {
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
LPolygonBasePinCtrl.prototype.offFocusGraphic = function (g, fromlist) {
    this.currentFocusGraphic = null;
    if (!g)
        return;
    var _cg = g.polygonGroupLayer || g;
    _cg = g;
    _cg.setStyle({ weight: g.setting_strokeWeight });
    if(!this.isShowLabel)
        this._showOneLabel(false, g);

    if (this.offFocusRowIndex && !fromlist)
        this.offFocusRowIndex(_cg.attributes["rindex"]);


};

//pin focus event
LPolygonBasePinCtrl.prototype.onFocusRowIndex;
LPolygonBasePinCtrl.prototype.offFocusRowIndex;
LPolygonBasePinCtrl.prototype.onMapZoomEnd;
LPolygonBasePinCtrl.prototype.pinClick;

if (!window.polygonMaxZIndex)
    var polygonMaxZIndex = 100;// google.maps.Marker.MAX_ZINDEX / 5;
//pin foucus
LPolygonBasePinCtrl.prototype.onFocusGraphic = function (g, fromlist) {//pin mouse over
    if ( L.Browser.ie && g == this.currentFocusGraphic) //IE在multipolygons 呼叫bringToFront會有問題，會多次觸發mouseover
        return;
    this.currentFocusGraphic = g;
    if (!g)
        return;
    //if (g.polygonGroupLayer)
        g.setStyle({ weight: parseFloat(g.setting_strokeWeight) + 1 });//, zIndex: pinGoogleMaxZIndex++ });
    g.bringToFront();
   
    this._showOneLabel(true, g);

    if (this.onFocusRowIndex && !fromlist)
        this.onFocusRowIndex(g.attributes["rindex"]);
};

LPolygonBasePinCtrl.prototype.setOpacity = function (_opacity) {
    this._opacity = _opacity;
    $.each(this.graphics, function () {
        var setting_strokeOpacity = this.setting_strokeOpacity == undefined ? 1 : this.setting_strokeOpacity;
        var setting_fillOpacity = this.setting_fillOpacity == undefined ? 1 : this.setting_fillOpacity;
        var fillOpacity = _opacity - (setting_strokeOpacity - setting_fillOpacity)<0?0: _opacity - (setting_strokeOpacity - setting_fillOpacity);
        this.setStyle({ opacity: _opacity, fillOpacity: fillOpacity });
    });
};
LPolygonBasePinCtrl.prototype.fitBounds = function (options) {
    var bs = L.featureGroup(this.graphics).getBounds();
    if (bs.isValid())
        this.map.fitBounds(L.featureGroup(this.graphics).getBounds(), options);
    else {
        var msg = 'LPolygonBasePinCtrl is not Valid, Bounds obj is ' + JSON.stringify(bs);
        console.log(msg);
        //console.log(bs);
        throw new Error(msg);
    }
}
LPolygonBasePinCtrl.prototype._getCenter = function (g) {
    var pcenter = g.pcenter;
    if (!pcenter && g.getBounds) {
        pcenter = g.pcenter = g.getBounds().getCenter();
    }
    return pcenter;
};
