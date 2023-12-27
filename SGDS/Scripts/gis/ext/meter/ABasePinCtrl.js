var ABasePinCtrl = function (ctrl, initcallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.settings = ctrl.settings;
    this.pinctrlid = ctrl.settings.layerid + "_" + new Date().getTime();
    this.graphics = [];
    this.labelgraphics = [];

    this.isShowLabel = false;

    //this.toolbar = undefined, this.dgraphics = [];

    var current = this;
    require(["esri/layers/GraphicsLayer", "esri/graphic", "esri/geometry/Point", "esri/symbols/PictureMarkerSymbol", "esri/symbols/TextSymbol", "esri/InfoTemplate"],
    function (GraphicsLayer, Graphic, Point, PictureMarkerSymbol, TextSymbol, InfoTemplate) {
        initcallback();
        setTimeout(function () {
            if (current.map && current.onMapZoomEnd) {
                current.hasListenZoomEnd = true;
                current.onMapZoomEnd(current.map.getZoom());
                current.map.on('zoom-end', function (ev) {
                    current.onMapZoomEnd(current.map.getZoom());
                });
            }
        },500);
    });
    return this;
};

ABasePinCtrl.prototype.reDraw = function (_datas) {
    var current = this;
    var cLayer = current.getPinLayer();

    $.each(current.graphics, function (idx, g) {
        cLayer.remove(g);
    });
    $.each(current.labelgraphics, function (idx, g) {
        cLayer.remove(g);
    });
    //cLayer.clear();
    current.graphics = [];
    current.labelgraphics = [];
    var __isshowlabel = this.isShowLabel;// current.mainctrl.isShowLabel();
    var rindex = 0;
    if (_datas.length !== 0) {
        var _cZoomPinsize = current.zoomPinsize();

        $.each(_datas, function () {
            var _cdata=this;
            try {
                this.rindex = rindex++;

                var _pinstatus = current.settings.checkDataStatus.call(current.mainctrl, this);
                if (!_pinstatus) {
                    console.log("checkDataStatus查無對應icon:" + JSON.stringify(this));
                    return;
                }
                //叢集infowindow
                //var g = new esri.Graphic(new esri.geometry.Point(this.X, this.Y), new esri.symbol.PictureMarkerSymbol(_pinstatus.url, _cZoomPinsize.x, _cZoomPinsize.y).setOffset(_cZoomPinsize.offsetx, _cZoomPinsize.offsety),
                //    this);//, infoTemplate);
                //g.pinctrl = current.mainctrl;
                //無叢集infowindow
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
                if (!_pinstatus.iconAbsoluteUrl) //改用對路徑為了出圖用
                    _pinstatus.iconAbsoluteUrl = helper.misc.getAbsoluteUrl(_pinstatus.url);
                var g = new esri.Graphic(new esri.geometry.Point(this.X, this.Y), new esri.symbol.PictureMarkerSymbol(_pinstatus.url, _cZoomPinsize.x, _cZoomPinsize.y).setOffset(_cZoomPinsize.offsetx, _cZoomPinsize.offsety),
                    this,current.settings.clickable? infoTemplate:undefined);


                g.pinctrlid = current.pinctrlid;
                g.rindex = this.rindex;
                g.pinsize = current.settings.pinsize;

                cLayer.add(g);

                g.pin = true;
                //this.graphic = g;
                current.graphics.push(g);

                var lg = new esri.Graphic(new esri.geometry.Point(this.X, this.Y),
                   new esri.symbol.TextSymbol(current.settings.stTitle(this)).setOffset(_cZoomPinsize.offsetx, _cZoomPinsize.y / 2 + _cZoomPinsize.offsety + 4));

                if (!__isshowlabel)
                    lg.hide();
                cLayer.add(lg);
                lg.pin = false;
                lg._pinstatus = _pinstatus;
                current.labelgraphics.push(lg);
                // g.pinlabel = lg;
                lg.rindex = this.rindex;
                lg.pinctrlid = current.pinctrlid;
            } catch (ex) {
                console.log("資料錯誤!!" + JSON.stringify(_cdata));
            }

        });
        if (this.isShowLabel)
            this.showLabel(this.isShowLabel);
    }
 
    //if (this.map && this.onMapZoomEnd && !this.hasListenZoomEnd) {
    //    this.hasListenZoomEnd = true;
    //    this.onMapZoomEnd(this.map.getZoom());
    //    this.map.on('zoom-end', function (ev) {
    //        current.onMapZoomEnd(current.map.getZoom());
    //    });
    //}
};
ABasePinCtrl.prototype.getCurrentZoomlevel = function () {
    return this.map.getZoom();
};
ABasePinCtrl.prototype.showInfoWindow = function (g) {
    this.map.infoWindow.setContent(g.getContent());
    this.map.infoWindow.setTitle(g.getTitle());
    this.map.infoWindow.show(g.geometry);
    this.map.centerAt(g.geometry);
};
ABasePinCtrl.prototype.closeInfoWindow = function () {
    this.map.infoWindow.hide();
}
//pinlabel show or hide
ABasePinCtrl.prototype.showLabel = function (b) {
    this.isShowLabel = b;
    $.each(this.labelgraphics, function () {
        if (b) {
            this.show();
        }
        else
            this.hide()
    });
};

//pin show or hide
ABasePinCtrl.prototype.show = function (b) {
    $.each(this.graphics, function () {
        if(b)
            this.show();
        else
            this.hide();
    });
};

//給index取graphic
//index是在reDraw給
ABasePinCtrl.prototype.getGraphicByRindex = function (ridx) {
    var g;
    $.each(this.graphics, function () {
        if (ridx == this.attributes["rindex"]) {
            //current.___onFocusGraphic(this, true);
            g = this;
            return false;
        }
    });
    return g;
};

//pin lose foucus
ABasePinCtrl.prototype.offFocusGraphic = function (g, fromlist) {
    var current = this;
    if (!g)
        return;
    this.map.setMapCursor("default");
    if (g.geometry.type === "point" && g.pin) {
        var currentctrl = this;// g.pinctrl;
        g.symbol.setWidth(currentctrl.zoomPinsize(g.pinsize).x);
        g.symbol.setHeight(currentctrl.zoomPinsize(g.pinsize).y);
        g.draw();
        var plabel = $.grep(this.labelgraphics, function (lg) {
            return lg.rindex == g.rindex;
        });
        plabel = plabel.length > 0 ? plabel[0] : undefined;
        if (plabel && !plabel.tempvisible) {
            plabel.tempvisible = undefined;
            plabel.hide();
        }
        //if (g.pinlabel && !g.pinlabel.tempvisible) {
        //    g.pinlabel.tempvisible = undefined;
        //    g.pinlabel.hide();
        //}
        if (currentctrl.offFocusRowIndex && !fromlist)
            currentctrl.offFocusRowIndex(g.attributes["rindex"]);
    }
};

//pin focus event
ABasePinCtrl.prototype.onFocusRowIndex;
ABasePinCtrl.prototype.offFocusRowIndex;
ABasePinCtrl.prototype.onMapZoomEnd;
ABasePinCtrl.prototype.click;

//pin foucus
ABasePinCtrl.prototype.onFocusGraphic = function (g, fromlist) {//pin mouse over
    if (!g)
        return;
    this.map.setMapCursor("pointer");
    var plabel = undefined;
    if (g.geometry.type === "point" && g.pin) { //只針對pin，label不zoom

        var currentctrl = this;// g.pinctrl;
        g.symbol.setWidth(currentctrl.zoomPinsize(g.pinsize).x * 1.1);
        g.symbol.setHeight(currentctrl.zoomPinsize(g.pinsize).y * 1.1);
        g.draw();

        plabel = $.grep(this.labelgraphics, function (lg) {
            return lg.rindex == g.rindex;
        });
        plabel = plabel.length > 0 ? plabel[0] : undefined;
        if (plabel ) {
            plabel.tempvisible = plabel.visible;
            plabel.show();
        }
        //if (g.pinlabel) {
        //    g.pinlabel.tempvisible = g.pinlabel.visible;
        //    g.pinlabel.show();
        //}
        if (currentctrl.onFocusRowIndex && !fromlist)
            currentctrl.onFocusRowIndex(g.attributes["rindex"]);
    }
    if (!dojo.isIE && g.pin)//會造成IE mouse-out 失效
    {
        if (plabel && plabel.visible && plabel.getDojoShape()) {
            plabel.getDojoShape().moveToFront();
        }
        if (g.getDojoShape())
            g.getDojoShape().moveToFront();
    }
};

//pin size at zoom
ABasePinCtrl.prototype.zoomPinsize = function (psize) { //以map zoom決定 pin size
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
    return { x: x, y: y, offsetx: offsetx, offsety:offsety};
};


//custom method
//取pin唯一的Layer
ABasePinCtrl.prototype.getPinLayer = function () {
    var current = this;//僅為做計算pin size用
    var pl = this.map.getLayer('___pinlayer')
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
        return pl;
    }
    //無叢集infowindow
    pl = new esri.layers.GraphicsLayer({ id: '___pinlayer'});

    //叢集infowindow
    //var _infoTemplate = new esri.InfoTemplate({ marginTop: 50 });
    //_infoTemplate.setTitle(function (geo) {
    //    if (geo.pinctrl)
    //        return geo.pinctrl.settings.stTitle.call(geo.pinctrl, geo.attributes);
    //    else
    //        return false;
    //});
    //_infoTemplate.setContent(function (geo) {
    //    if (geo.pinctrl)
    //        return geo.pinctrl.settings.pinInfoContent.call(geo.pinctrl, geo.attributes, geo.pinctrl.infoFields);// '<div class="meterInfoTemplateContent">' + constr + '</div>';
    //    else
    //        return false;
    //});
    //pl = new esri.layers.GraphicsLayer({ id: '___pinlayer', infoTemplate: _infoTemplate });
    //叢集infowindow

    pl.pinctrl = [current];
    this.map.addLayer(pl);

    pl.on("mouse-out", function (g) {
        $.grep(pl.pinctrl, function (c) {
            return c.pinctrlid == g.graphic.pinctrlid;
        })[0].offFocusGraphic(g.graphic);
    });
    pl.on("mouse-over", function (g) {
        var vv = $.grep(pl.pinctrl, function (c) {
            return c.pinctrlid == g.graphic.pinctrlid;
        });
        $.grep(pl.pinctrl, function (c) {
            return c.pinctrlid == g.graphic.pinctrlid;
        })[0].onFocusGraphic(g.graphic);
    });
    this.map.on('zoom-end', function (ev) {
        //current.__zoomChange();
        $.each(pl.pinctrl, function () { //不直接layer.graphics，用pl.pinctrl，為了計算_pinsize效能
            if (!this.mainctrl.settings.dynPinsize)
                return;
            var _pinsize = this.zoomPinsize(this.mainctrl.settings.pinsize);
            $.each(this.graphics, function () {
                var g = this;
                if (g.geometry.type === "point" && g.pin) { //只針對pin，label不zoom
                    g.symbol.setWidth(_pinsize.x);
                    g.symbol.setHeight(_pinsize.y);
                    g.symbol.setOffset(_pinsize.offsetx, _pinsize.offsety);
                    g.draw();
                    //g.pinlabel.symbol.setOffset(_pinsize.offsetx, _pinsize.y / 2 + _pinsize.offsety + 4);
                }
            });
            $.each(this.labelgraphics, function () {
                this.symbol.setOffset(_pinsize.offsetx, _pinsize.y / 2 + _pinsize.offsety + 4);
            });
            
        });
    });
    pl.on("graphic-draw", function (evt) { //更改label 顏色
        if (evt.graphic.pin === false) {//label layer
            var attr = $(evt.graphic.getNode()).attr("class");
            if (attr === undefined && evt.graphic.getNode()) {
                $(evt.graphic.getNode()).attr("class", "pin_label " + evt.graphic._pinstatus.classes);
            }
        }
    });
    return pl;
};