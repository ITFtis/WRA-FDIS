var APolylineBasePinCtrl = function (ctrl, initcallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.settings = ctrl.settings;
    this.pinctrlid = ctrl.settings.layerid + "_" + new Date().getTime();
    this.graphics = [];
    this.labelgraphics = [];

    this.visible = false;
    this.isShowLabel = false;

    var current = this;

    this._opacity = .9;
    require(["esri/layers/GraphicsLayer", "esri/graphic", "esri/geometry/Point", "esri/geometry/Polyline", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/symbols/TextSymbol", "esri/InfoTemplate"],
    function () {
        setTimeout(function () {
            initcallback();
        });
    });
    return this;
};

//custom method
//取polyline唯一的Layer
APolylineBasePinCtrl.prototype.getPinLayer = function () {
    var current = this;//僅為做計算pin size用
    var pl = this.map.getLayer('___polylinelayer')
    if (pl) {   //pl.pinctrl 
        var _layerHasAddPinctrl = false;
        $.each(pl.pinctrl, function () {
            if (this.pinctrlid == current.pinctrlid) {
                _layerHasAddPinctrl = true;
                return false;
            }
        });
        if (!_layerHasAddPinctrl)
            pl.pinctrl.push(current);

    } else {
        //無叢集infowindow
        pl = new esri.layers.GraphicsLayer({ id: '___polylinelayer' });



        pl.pinctrl = [current];
        this.map.addLayer(pl);
    }
    if (!pl.has_listen_event) {
        pl.on("mouse-out", function (g) {
            if (g.graphic.clickable) {
                $.grep(pl.pinctrl, function (c) {
                    return c.pinctrlid == g.graphic.pinctrlid;
                })[0].offFocusGraphic(g.graphic);
                current.map.setMapCursor("default");
            }
        });
        pl.on("mouse-over", function (g) {
            if (g.graphic.clickable) {
                $.grep(pl.pinctrl, function (c) {
                    return c.pinctrlid == g.graphic.pinctrlid;
                })[0].onFocusGraphic(g.graphic);
                current.map.setMapCursor("pointer");
            }
        });
    }
    //pl.has_listen_event = true;
    //pl.on("graphic-draw", function (evt) { //更改label 顏色
    //    if (evt.graphic.pin === false) {//label layer
    //        var attr = $(evt.graphic.getNode()).attr("class");
    //        if (attr === undefined && evt.graphic.getNode()) {
    //            $(evt.graphic.getNode()).attr("class", "pin_label " + evt.graphic._pinstatus.classes);
    //        }
    //    }
    //});
    return pl;
};

//重新劃polyline
APolylineBasePinCtrl.prototype.reDraw = function (_datas) {
    var current = this;
    var cLayer = current.getPinLayer();

    var oldgraphics = $.extend([], current.graphics);
    //$.each(current.graphics, function (idx, g) {
    //    this.setMap(null);
    //});

    current.graphics = [];

    $.each(current.labelgraphics, function (idx, g) {
        cLayer.remove(g);
    });
    current.labelgraphics = [];

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
                //var _titlelength = _title.length;

                if (!this.paths && !this.arc_graphic)
                    console.log(_title + "無paths");

                var _options = $.extend({ path: [this.paths] }, _pinstatus);
                //_options.zIndex = polylineGoogleMaxZIndex++;
                
                function createPolyline(polylineOptions, _data) {
                    var _linesymbol = new esri.symbol.SimpleLineSymbol().setColor(new esri.Color(polylineOptions.strokeColor)).setWidth(polylineOptions.strokeWeight);

                    if (_data.arc_graphic && _data.arc_graphic.declaredClass == 'esri.Graphic') {//來至KML
                        _g = _data.arc_graphic;
                    }
                    else {
                        var _path = [[]];
                        $.each(_data.paths, function () {
                            if (this.lng)
                                _path[0].push([this.lng(), this.lat()]);
                            else if ($.isArray(this))
                                _path[0].push(this);
                        });
                        //var _linesymbol = new esri.symbol.SimpleLineSymbol().setWidth(polylineOptions.strokeWeight);
                        var _polyline = new esri.geometry.Polyline({ "paths": _path });
                       


                        var _g = new esri.Graphic(_polyline, _linesymbol, this, current.settings.clickable ? infoTemplate : undefined)
                    }
                    if (_pinstatus && _pinstatus.strokeColor)
                        _g.setSymbol(_linesymbol);
                    if (current.settings.clickable) {
                        var infoTemplate = new esri.InfoTemplate({ marginTop: 50 });
                        infoTemplate.setTitle(function (geo) {
                            return current.settings.stTitle.call(current.mainctrl, geo.attributes);
                            //"${DateTime}");
                        });
                        infoTemplate.setContent(function (geo) {
                            if (current.pinClick)
                                current.pinClick(geo.attributes);
                            return current.settings.pinInfoContent.call(current.mainctrl, geo.attributes, current.settings.infoFields);// '<div class="meterInfoTemplateContent">' + constr + '</div>';
                        });
                    }

                    _g.setting_strokeOpacity = polylineOptions.strokeOpacity;
                    _g.setting_strokeWeight = polylineOptions.strokeWeight;
                    _g.setting_strokeColor = polylineOptions.strokeColor;

                    _g.attributes = _data;
                    _g.clickable = current.settings.clickable;
                    

                    _g._title = _title;
                    _g._pinstatus = _pinstatus;
                    cLayer.add(_g);
                    _g.pinctrlid = current.pinctrlid;
                    var sada =current._getCenter(_g);
                    var lg = new esri.Graphic(new esri.geometry.Point(current._getCenter(_g)[0], current._getCenter(_g)[1]),
                        new esri.symbol.TextSymbol(current.settings.stTitle(this)));//.setOffset(_cZoomPinsize.offsetx, _cZoomPinsize.y / 2 + _cZoomPinsize.offsety + 4));

                    if (!__isshowlabel)
                        lg.hide();
                    cLayer.add(lg);
                    lg.pin = false;
                    lg._pinstatus = _pinstatus;
                    current.labelgraphics.push(lg);
                    // g.pinlabel = lg;
                    lg.rindex = this.rindex;
                    lg.pinctrlid = current.pinctrlid;

                    _g.labelpin = lg;
                    return _g;
                }
                //current.graphics.push(createPolyline(_options, this));
                var _ng = createPolyline(_options, this);
                current.graphics.push(_ng);
                var oidx = oldgraphics.indexOf(_ng);
                if (oidx >= 0) //如來自KmlCtrl，呼叫serFiltery做第二次以上reDraw，因都是同一實體所以要先remove掉，以免後面layer移除oldgraphics會將_ng有一掉
                    oldgraphics.splice(oidx, 1);
                this.rindex = rindex++;
            } catch (ex) {
                console.log("資料錯誤!!" + JSON.stringify(_cdata));
            }
        });

        this.setOpacity(this._opacity);

        if (this.isShowLabel)
            this.showLabel(this.isShowLabel);
    }
    setTimeout(function () { //減少畫面刪掉在新增的頓挫
        $.each(oldgraphics, function (idx, g) {
            cLayer.remove(g);
        });
    }, 10);
};

//目前 map zoom level
APolylineBasePinCtrl.prototype.getCurrentZoomlevel = function () {
    return this.map.getZoom();
};

APolylineBasePinCtrl.prototype.showInfoWindow = function (g, viewcenter) {
    this.map.infoWindow.setContent(g.getContent());
    this.map.infoWindow.setTitle(g.getTitle());
    var _pc = this._getCenter(g);
    var _p = new esri.geometry.Point(_pc[0], _pc[1]);
    this.map.infoWindow.show(_p, this.map.getInfoWindowAnchor(_p));
};

APolylineBasePinCtrl.prototype.closeInfoWindow = function () {
    this.map.infoWindow.hide();
}

//pinlabel show or hide
APolylineBasePinCtrl.prototype.showLabel = function (b) {
    var that =this;
    this.isShowLabel = b;
    $.each(this.graphics, function () {
        that._showOneLabel(b, this);
    });
};
APolylineBasePinCtrl.prototype._showOneLabel = function (b, _g) {
    if (!this.settings.pinLabel || !this._getCenter(_g)) {
            return;
        }
        if(b)
            _g.labelpin.show();
        else
            _g.labelpin.hide();
        _g.labelpin.draw();

}
//pin show or hide
APolylineBasePinCtrl.prototype.show = function (b) {
    var current = this;
    $.each(this.graphics, function () {
        if (b)
            this.show();
        else
            this.hide();
    });
};

//給index取graphic
//index是在reDraw給
APolylineBasePinCtrl.prototype.getGraphicByRindex = function (ridx) {
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
APolylineBasePinCtrl.prototype.offFocusGraphic = function (g, fromlist) {
    //return;
    if (!g)
        return;
    
    var _ridx = g.attributes.rindex;
    for (var i = 0; i < this.graphics.length; i++) {//考慮MultiGeometry polyline
        if (this.graphics[i].attributes.rindex == _ridx) {
            this.graphics[i].symbol.setWidth(g.setting_strokeWeight);
            this.graphics[i].draw();
            if (!this.isShowLabel)
                this._showOneLabel(false, this.graphics[i]);
        }
    }

    if (this.offFocusRowIndex && !fromlist)
        this.offFocusRowIndex(g.attributes["rindex"]);
};

//pin focus event
APolylineBasePinCtrl.prototype.onFocusRowIndex;
APolylineBasePinCtrl.prototype.offFocusRowIndex;
APolylineBasePinCtrl.prototype.onMapZoomEnd;
APolylineBasePinCtrl.prototype.pinClick;


//pin foucus
APolylineBasePinCtrl.prototype.onFocusGraphic = function (g, fromlist) {//pin mouse over
    if (!g)
        return;
    var w = parseFloat(g.setting_strokeWeight) * 1.5;
    w = Math.ceil(w);

    var _ridx = g.attributes.rindex;
    for (var i = 0; i < this.graphics.length; i++) {//考慮MultiGeometry polyline
        if (this.graphics[i].attributes.rindex == _ridx) {
            this.graphics[i].symbol.setWidth(w);
            this.graphics[i].draw();
            this._showOneLabel(true, this.graphics[i]);
        }
    }
    if (this.onFocusRowIndex && !fromlist)
        this.onFocusRowIndex(g.attributes["rindex"]);
};

APolylineBasePinCtrl.prototype.setOpacity = function (_opacity) {
    this._opacity = _opacity;
    $.each(this.graphics, function () {
        var c = this.symbol.color.a = _opacity;;
        this.symbol.setColor(this.symbol.color);
        this.draw();
    });
};
APolylineBasePinCtrl.prototype._getCenter = function (g) {
    
    var pcenter = g.pcenter;
    if (!pcenter) {
        if (g._extent) {
            var bounds = g._extent;
            pcenter = [(bounds.xmax + bounds.xmin) / 2, (bounds.ymax + bounds.ymin) / 2];
        }
        else {
            var ps = $.isArray(g.geometry.paths) ? g.geometry.paths[0] : g.geometry.paths;
            pcenter = g.pcenter = ps[Math.floor(ps.length / 2)];
        }

    }
    //if (!pcenter) { //土石流MultiGeometry多條線getPath()會是[]
    //    pcenter = g.attributes.paths[0];
    //    if ($.isArray(pcenter))
    //        pcenter = pcenter[0];
    //}
    return pcenter;
};

APolylineBasePinCtrl.prototype._getBounds = function (g) {
    return g._extent;// getExt  new google.maps.LatLngBounds();
    //var path = g.getPath();
    //var sd = path.getLength();
    //for (var ii = 0; ii < path.getLength() ; ii++) {
    //    bounds.extend(path.getAt(ii));
    //}
    //return bounds;
};

