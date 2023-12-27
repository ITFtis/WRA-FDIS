var APolygonBasePinCtrl = function (ctrl, initcallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.settings = ctrl.settings;
    this.pinctrlid = ctrl.settings.layerid + "_" + new Date().getTime();
    this.graphics = [];
    this.labelgraphics = [];

    this.visible = false;
    this.isShowLabel = false;

    //this.infowindow = new google.maps.InfoWindow({ // custom infoWindow http://artandlogic.com/2014/02/custom-google-maps-info-windows/
    //    //content: "ooooooooooooooooooooooooooooo"
    //});

    var current = this;

    this._opacity = .9;
    require(["esri/layers/GraphicsLayer", "esri/graphic", "esri/geometry/Point", "esri/geometry/Polygon", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/symbols/TextSymbol", "esri/InfoTemplate"],
    function () {
        setTimeout(function () {
            initcallback();
        });
    });
    return this;
};

//custom method
//取polygon唯一的Layer
APolygonBasePinCtrl.prototype.getPinLayer = function () {
    var current = this;//僅為做計算pin size用
    var pl = this.map.getLayer('___polygonlayer')
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
        pl = new esri.layers.GraphicsLayer({ id: '___polygonlayer' });



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
    return pl;
};

//重新劃polygon
APolygonBasePinCtrl.prototype.reDraw = function (_datas) {
    var current = this;
    var cLayer = current.getPinLayer();

    var oldgraphics = $.extend([], current.graphics);
   
    current.graphics = [];

    //$.each(oldgraphics, function (idx, g) {
    //    cLayer.remove(g);
    //});
    $.each(current.labelgraphics, function (idx, g) {
        cLayer.remove(g);
    });
    current.labelgraphics = [];

    var __isshowlabel = this.isShowLabel;// current.mainctrl.isShowLabel();
    var rindex = 0;
    if (_datas.length !== 0) {

        $.each(_datas, function () {
            var _cdata = this;
            try {
                //尚未實作:to do current.graphics比對新的data，用原marker reset options畫面才不會頓
                var _pinstatus = current.settings.checkDataStatus.call(current.mainctrl, this);
                var _title = current.settings.stTitle.call(current.mainctrl, this);//|| this.placemarkName; //placemarkName來致KmlCtrl

                if (!_title)
                    console.log("title無資料，pin.stTitle:" + _title);
                
                if (!this.paths && !this.arc_graphic)
                    console.log(_title + "無paths");

                var _options = $.extend({ path: [this.paths] }, _pinstatus);

                function createPolyline(geometryOptions, _data) {
                    var _g = undefined;
                    var _linesymbol = new esri.symbol.SimpleLineSymbol().setColor(new esri.Color(geometryOptions.strokeColor)).setWidth(geometryOptions.strokeWeight);
                    var _symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, _linesymbol, new esri.Color(geometryOptions.fillColor));//.setColor(new esri.Color(geometryOptions.strokeColor)).setWidth(geometryOptions.strokeWeight);

                    if (_data.arc_graphic && _data.arc_graphic.declaredClass == 'esri.Graphic') {//來至KML
                        _g = _data.arc_graphic;
                    }
                    else {
                        var _points = [];
                        //$.each(_data.paths[0].b, function () {  //為什麼.b???????20191015
                        //    _points.push(new esri.geometry.Point(this.lng(), this.lat()));
                        //});
                        $.each(_data.paths[0], function () {
                            if (this.lng)
                                _points.push(new esri.geometry.Point(this.lng(), this.lat()));
                            else if ($.isArray(this))
                                _points.push(new esri.geometry.Point(this[0], this[1]));

                        });
                        var _polygon = new esri.geometry.Polygon();
                        _polygon.addRing(_points);


                        _g = new esri.Graphic(_polygon, _symbol, this,  undefined)
                       
                    }
                    if (_pinstatus && _pinstatus.fillColor)
                        _g.setSymbol(_symbol);

                    if (current.settings.clickable) {
                        var infoTemplate = new esri.InfoTemplate({ marginTop: 50 });
                        infoTemplate.setTitle(function (geo) {
                            return current.settings.stTitle.call(current.mainctrl, geo.attributes);
                        });
                        infoTemplate.setContent(function (geo) {
                            if (current.pinClick)
                                current.pinClick(geo.attributes);
                            return current.settings.pinInfoContent.call(current.mainctrl, geo.attributes, current.settings.infoFields);// '<div class="meterInfoTemplateContent">' + constr + '</div>';
                        });
                        _g.setInfoTemplate(infoTemplate)
                    }
                    _g.setting_strokeOpacity = geometryOptions.strokeOpacity;
                    _g.setting_strokeWeight = geometryOptions.strokeWeight;
                    _g.setting_fillOpacity = geometryOptions.fillOpacity;
                    _g.settings_fillColor = geometryOptions.fillColor;

                    _g.attributes = _data;

                    _g.clickable = current.settings.clickable;


                    _g._title = _title;
                    _g._pinstatus = _pinstatus;
                    cLayer.add(_g);
                    _g.pinctrlid = current.pinctrlid;
                    var sada = current._getCenter(_g);
                    var lg = new esri.Graphic(new esri.geometry.Point(current._getCenter(_g)[0], current._getCenter(_g)[1]),
                        new esri.symbol.TextSymbol(_title));

                    if (!__isshowlabel)
                        lg.hide();
                    cLayer.add(lg);
                    lg.pin = false;
                    lg._pinstatus = _pinstatus;
                    current.labelgraphics.push(lg);
                    lg.rindex = this.rindex;
                    lg.pinctrlid = current.pinctrlid;

                    _g.labelpin = lg;
                    return _g;
                }
                var _ng = createPolyline(_options, this);
                current.graphics.push(_ng);
                var oidx = oldgraphics.indexOf(_ng);
                if (oidx >= 0) //如來自KmlCtrl，呼叫serFiltery做第二次以上reDraw，因都是同一實體所以要先remove掉，以免後面layer移除oldgraphics會將_ng有移掉
                    oldgraphics.splice(oidx,1);
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
APolygonBasePinCtrl.prototype.getCurrentZoomlevel = function () {
    return this.map.getZoom();
};

APolygonBasePinCtrl.prototype.showInfoWindow = function (g, viewcenter) {
    this.map.infoWindow.setContent(g.getContent());
    this.map.infoWindow.setTitle(g.getTitle());
    var _pc = this._getCenter(g);
    var _p = new esri.geometry.Point(_pc[0], _pc[1]);
    this.map.infoWindow.show(_p, this.map.getInfoWindowAnchor(_p));
};

APolygonBasePinCtrl.prototype.closeInfoWindow = function (g) {
    this.map.infoWindow.hide();
}

//pinlabel show or hide
APolygonBasePinCtrl.prototype.showLabel = function (b) {
    var that = this;
    this.isShowLabel = b;
    $.each(this.graphics, function () {
        that._showOneLabel(b, this);
    });
};
APolygonBasePinCtrl.prototype._showOneLabel = function (b, _g) {
    if (!this.settings.pinLabel || !this._getCenter(_g)) {
        return;
    }
    if (b) {
        _g.labelpin.show();
        var attr = $(_g.labelpin.getNode()).attr("class");
        if (attr === undefined && _g.labelpin.getNode()) {
            $(_g.labelpin.getNode()).attr("class", "pin_label " + _g.labelpin._pinstatus.classes);
        }
    }
    else
        _g.labelpin.hide();
    _g.labelpin.draw();
}
//pin show or hide
APolygonBasePinCtrl.prototype.show = function (b) {
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
APolygonBasePinCtrl.prototype.getGraphicByRindex = function (ridx) {
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
APolygonBasePinCtrl.prototype.offFocusGraphic = function (g, fromlist) {
    if (!g)
        return;

    var _ridx = g.attributes.rindex;
    for (var i = 0; i < this.graphics.length; i++) {//考慮MultiGeometry polyline
        if (this.graphics[i].attributes.rindex == _ridx) {
            this.graphics[i].symbol.outline.setWidth(g.setting_strokeWeight);
            this.graphics[i].draw();
            if (!this.isShowLabel)
                this._showOneLabel(false, this.graphics[i]);
        }
    }

    if (this.offFocusRowIndex && !fromlist)
        this.offFocusRowIndex(g.attributes["rindex"]);
};

//pin focus event
APolygonBasePinCtrl.prototype.onFocusRowIndex;
APolygonBasePinCtrl.prototype.offFocusRowIndex;
APolygonBasePinCtrl.prototype.onMapZoomEnd;
APolygonBasePinCtrl.prototype.pinClick;


//pin foucus
APolygonBasePinCtrl.prototype.onFocusGraphic = function (g, fromlist) {//pin mouse over
    if (!g)
        return;
    var w = parseFloat(g.setting_strokeWeight) * 1.5;
    w = Math.ceil(w);

    var _ridx = g.attributes.rindex;
    for (var i = 0; i < this.graphics.length; i++) {//考慮MultiGeometry polyline
        if (this.graphics[i].attributes.rindex == _ridx) {
            this.graphics[i].symbol.outline.setWidth(w);
            this.graphics[i].draw();
            this._showOneLabel(true, this.graphics[i]);
        }
    }
    if (this.onFocusRowIndex && !fromlist)
        this.onFocusRowIndex(g.attributes["rindex"]);
};

APolygonBasePinCtrl.prototype.setOpacity = function (_opacity) {
    this._opacity = _opacity;
    var that = this;
    $.each(this.graphics, function (idx) {
        if (!this.setting_strokeOpacity && !this.symbol.outline)
            this.symbol.outline = this.symbol;
        
        var setting_strokeOpacity = this.setting_strokeOpacity == undefined ?this.symbol.color.a : this.setting_strokeOpacity;
        var setting_fillOpacity = this.setting_fillOpacity == undefined ? this.symbol.color.a : this.setting_fillOpacity;
        var fillOpacity = _opacity - (setting_strokeOpacity - setting_fillOpacity) < 0 ? 0 : _opacity - (setting_strokeOpacity - setting_fillOpacity);
        var c = this.symbol.color.a = fillOpacity;
        var oc = this.symbol.outline.color.a = _opacity;
        this.symbol.setColor(this.symbol.color);
        this.symbol.outline.setColor(this.symbol.outline.color);
        this.draw();
        if (that.isShowLabel && this.labelpin) {
            this.labelpin.symbol.color.a = _opacity;
            this.labelpin.draw();
        }
    });
};
APolygonBasePinCtrl.prototype._getCenter = function (g) {
    var pcenter = g.pcenter;
    if (!pcenter) {
        var bounds = g._extent;
        pcenter = [(bounds.xmax + bounds.xmin) / 2, (bounds.ymax + bounds.ymin) / 2];
    }
    return pcenter;
};
