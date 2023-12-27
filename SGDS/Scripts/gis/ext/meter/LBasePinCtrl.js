
var LBasePinCtrl = function (ctrl, initcallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.settings = ctrl.settings;
    this.pinctrlid = ctrl.settings.layerid + "_" + new Date().getTime();
    this.graphics = [];

    this.isShowLabel = false;
    this.isShowPin = false;

    //this.toolbar = undefined, this.dgraphics = [];

    this.markerClusterGroup = null;// L.markerClusterGroup();
    
    var current = this;
    var js = [];
    if (this.settings.legendIcons) {
        $.each(this.settings.legendIcons, function () {
            if (this.prefix && this.glyph) {
                if (!L.icon.glyph)
                    js.push($.AppConfigOptions.script.gispath + '/leaflet/Leaflet.Icon.Glyph/Leaflet.Icon.Glyph.js');
                //glyph font-size width and height要一樣
                var _ps = current.settings.pinsize.x >= current.settings.pinsize.y ? current.settings.pinsize.x : current.settings.pinsize.y;
                var _pmins = current.settings.pinsize.minx >= current.settings.pinsize.miny ? current.settings.pinsize.minx : current.settings.pinsize.miny;
                var _pmaxs = current.settings.pinsize.maxx >= current.settings.pinsize.maxy ? current.settings.pinsize.maxx : current.settings.pinsize.maxy;
                current.settings.pinsize = $.extend(current.settings.pinsize, { x: _ps, y: _ps, minx: _pmins, maxx: _pmaxs, miny: _pmins, maxy: _pmaxs });
                return false;
            }
        });
    }
    if (this.settings.cluster && !L.markerClusterGroup) {
        js.push($.AppConfigOptions.script.gispath + '/leaflet/leaflet.markercluster.js');//,function(){
        //helper.misc.getJavaScripts('https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.4.1/leaflet.markercluster.js', function () {
            //initcallback();
        //});
    }
    if (js.length > 0) {
        helper.misc.getJavaScripts(js, function () {
            initcallback();
        });
    }
    else
        setTimeout(function () {  initcallback(); },1000);
    var intervalflag;
    this.map.on('zoomend', function () {
        var zs = current.zoomPinsize();
        if (intervalflag)
            clearTimeout(intervalflag);
        intervalflag = setTimeout(function () {
            if (ctrl.settings.dynPinsize) {
                $.each(current.graphics, function (idx, g) {
                    current.__resetIcon(this, zs);
                });
            }
            current.show(current.isShowPin);
            current.showLabel(current.isShowLabel);
        }, 100);
        if (current.onMapZoomEnd) { //觸發onMapZoomEnd事件
            current.onMapZoomEnd(current.map.getZoom());
        }
    });
    var moveintervalflag;
    this.map.on('moveend', function () {
        if (moveintervalflag) clearTimeout(moveintervalflag);
        moveintervalflag = setTimeout(function () {
            current.show(current.isShowPin);
            current.showLabel(current.isShowLabel);
        }, 300);
    })
    this.label_tooltip_sticky = true; //1.8.0版後tooltip.sticky =true，lable會隨滑鼠移動(目前給matgin-top無法解決)
    try {
        //var v = L.version;
        //if (v > '1.8.0')
        //    this.label_tooltip_sticky = false;
    } catch (e) { }
    return this;
};

if (!window.pinLeafletMaxZIndex)
    window.pinLeafletMaxZIndex = 10000;
LBasePinCtrl.prototype.__resetIcon = function (g, zs) {
    //if (!g.getIcon)
    //    return;
    if (g && g.getIcon) {
        var _icon = g.getIcon() || g;//g.getIcon() 20220915加入， 解決_icon.options.iconSize==null(因該新版leafleft問題), pin label位置一直動

        //if (_icon.options.iconSize && _icon.options.iconSize.x == zs.x && _icon.options.iconSize.y == zs.y)
        if (_icon.options.iconSize && _icon.options.iconSize[0] == zs.x && _icon.options.iconSize[1] == zs.y)
            return;
    }
    g.options.icon.options.iconSize = [zs.x, zs.y];
    g.options.icon.options.iconAnchor = [zs.x / 2 - zs.offsetx, zs.y / 2 + zs.offsety];
    g.options.icon.options.popupAnchor = [zs.offsetx, -(zs.y / 2 + zs.offsety + 2)];
    g.options.icon.options.tooltipAnchor = [0, -30];// [100-zs.offsetx, -100-(zs.y / 2 + zs.offsety + 2)];
    if (g.options.icon.options.glyphSize) {
        g.options.icon.options.glyphSize = Math.floor(zs.x * 2 / 5) + 'px';
        g.options.icon.options.glyphAnchor = [0, -Math.floor(zs.x * 2 / 10)];// -zs.y / 2 + Math.floor( zs.x / 3) - zs.offsety]
    }
    g.setIcon(g.options.icon);
    if (g.getTooltip() && g.isTooltipOpen()) {
        g.getTooltip().getElement().style.marginTop = -(g.options.icon.options.iconAnchor[1] - 2) + "px";
    }
}
LBasePinCtrl.prototype.reDraw = function (_datas) {
    //console.log('LBasePinCtrl.reDraw:' + _datas.length);
    var current = this;
    if (this.settings.cluster)
        this._createMarkerCluster();
    var _popupOpenGraphics = undefined;
    $.each(current.graphics, function (idx, g) {
        if (g.isPopupOpen())
            _popupOpenGraphics = g;
        g.remove();
    });
    current.graphics = [];
    var __isshowlabel = this.isShowLabel;// current.mainctrl.isShowLabel();
    var rindex = 0;
    if (_datas.length !== 0) {
        var _cZoomPinsize = current.zoomPinsize();

        $.each(_datas, function () {
            pinLeafletMaxZIndex++;
            var _cdata=this;
            try {
                if (this.Y == undefined || this.X == undefined) {
                    console.log("無座標資料:" + JSON.stringify(this));
                    return;
                }

                var _pinstatus = current.settings.checkDataStatus.call(current.mainctrl, this);
                if (!_pinstatus) {
                    console.log("checkDataStatus查無對應icon:" + JSON.stringify(this));
                    return;
                }
                this.rindex = rindex++;

                var _iconoptions = $.extend({
                    className: _pinstatus ?  _pinstatus.classes : "",
                    iconUrl: _pinstatus.url? helper.misc.getAbsoluteUrl(_pinstatus.url):'',
                }, _pinstatus);
                //console.log(_iconoptions.className + ">>" + _pinstatus.classes);
                if (_iconoptions.glyph) {
                    if (_iconoptions.iconUrl) _iconoptions.className += ' icon_url_glyph';
                }
                var _options = $.extend({}, current.settings.geometryOtherOptions, {
                    icon: L.icon.glyph && _iconoptions.prefix && _iconoptions.glyph ? L.icon.glyph(_iconoptions) : L.icon(_iconoptions),
                    opacity:window.defaultPinOpacity || 0.9,
                    flag: current.settings.stTitle.call(current.mainctrl, _cdata),
                    //title: current.settings.stTitle.call(current.mainctrl, _cdata), //不給值，不然移入會自動有tooltip
                    //alt: current.settings.stTitle.call(current.mainctrl, _cdata) + "_alt",
                });
                if (_cdata.pinZIndex != undefined)
                    _options.zIndexOffset = _cdata.pinZIndex;

                var g = L.marker([this.Y, this.X], _options);//.addTo(current.map);
                current.__resetIcon(g, _cZoomPinsize);

                current.graphics.push(g);
                if (current.settings.clickable) {
                    g.on('mouseover', function () {
                        current.onFocusGraphic(g);
                    });
                    g.on('mouseout', function () {
                        current.offFocusGraphic(g);
                    });
                    g.on('click', function () {
                        if (current.settings.useInfoWindow)
                            current.showInfoWindow(g, false);
                        if (current.pinClick)
                            current.pinClick(_cdata);
                    });
                }
                g.pinctrlid = current.pinctrlid;
                g.rindex = _cdata.rindex = this.rindex;
                g.pinsize = current.settings.pinsize;
                g.attributes = _cdata;
                g.pinstatus = _pinstatus;

                if (current.markerClusterGroup)
                    current.markerClusterGroup.addLayer(g);
                if (g.pinstatus.glyph && !g.asseccColor) {
                    g.on('add', function () {
                        current.displayGlyphPin(g);
                    });
                }
                
            } catch (ex) {
                console.log("資料錯誤!!" + JSON.stringify(_cdata));
            }

        });
        if (this.isShowLabel)
            this.showLabel(this.isShowLabel);

        if (_popupOpenGraphics) { //重劃時目前已showInfoWindow再次showInfoWindow
            var _gs = $.grep(current.graphics, function (_g) {
                return _g.attributes.X == _popupOpenGraphics.attributes.X && _g.attributes.Y == _popupOpenGraphics.attributes.Y;
            });
            if (_gs.length > 0) {
                var _tempAnimation = this.mainctrl.settings.infoWindowAnimation;
                current.mainctrl.settings.infoWindowAnimation = false;
                current.showInfoWindow(_gs[0]);
                current.mainctrl.settings.infoWindowAnimation = _tempAnimation;
            }
        }
        //console.log('LBasePinCtrl.reDraw end');
    }
};
LBasePinCtrl.prototype.getCurrentZoomlevel = function () {
    return this.map.getZoom();
};
LBasePinCtrl.prototype.showInfoWindow = function (g, c) {
    var that = this;
    if (g.isPopupOpen())
        return;
    
    

    if (this.markerClusterGroup && this.markerClusterGroup.hasLayer(g) && !g._map) { //從markerClusterGroup中移除,g._map!=null代表以zoom到g是visible
        this.markerClusterGroup.removeLayer(g);
        g.once('popupclose', function () {
            that.displayPin(g, false);
            that.markerClusterGroup.addLayer(g);//.refreshClusters(g);
        });
    }
    this.displayPin(g, true);

    var _zoomin = "";
    if (this.settings.canFullInfowindow)
        _zoomin = "<div class='zoom-in-ctrl'><span class=' glyphicon glyphicon-zoom-in'></div>";
    

    var popup = g.unbindPopup().bindPopup(_zoomin+'<div class="leaflet-infowindow-title ' + g.pinstatus.classes + '">'+g.options.flag+'</div>' + this.settings.pinInfoContent.call(this.mainctrl, g.attributes, this.settings.infoFields),
        $.extend({ closeOnClick: this.settings.singleInfoWindow, autoClose: this.settings.singleInfoWindow, className: 'leaflet-infowindow', minWidth: 250 },
        typeof this.settings.useInfoWindow == 'object' ? this.settings.useInfoWindow : {}))
    .openPopup().getPopup();
    var $_pop = $(popup.getElement()).addClass("infowindow-" + this.settings.name);
    if (this.settings.classes)
        $_pop.addClass(this.settings.classes);
    if (this.mainctrl.settings.infoWindowAnimation) {
        
        var ot = $_pop[0].style.transform;
        $_pop[0].style.transform = ot + " scale(.3)";
        $_pop.addClass('leaflet-infow-animation');
        requestAnimationFrame(function () {
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
    $_pop.find('.leaflet-popup-tip')[0].style.boxShadow = " 2px 2px 5px " + _statusstyle.backgroundColor;
    

    //放大
    var $_full_modal;
    var $_cc = $_pop.find(".leaflet-popup-content");
    $_pop.find('.zoom-in-ctrl').click(function () {
        $_cc.toggleClass('full-zoom-in');
        if ($_cc.hasClass("full-zoom-in")) {
            $_full_modal = helper.jspanel.jspAlertMsg($(that.map.getContainer()), { autoclose: 9999999, size: that.settings.canFullInfowindow == true ? undefined : that.settings.canFullInfowindow, classes: "modal-lg modal-dialog-full-window modal-dialog-" + that.settings.name + "-full-window" }, function () {
                that.showInfoWindow(g, c);
            });//
            var $_mc = $_full_modal.find(".modal-content").empty();
            $('<div class="modal-header"><button type="button" class="close pull-right float-right btn-close" data-dismiss="modal" data-bs-dismiss="modal" aria-label="Close"></button></div>').appendTo($_mc);
            $_cc.appendTo($_mc);//.empty());
            //$_cc.appendTo($_full_modal.find(".modal-content>*:not('.modal-header')").empty());
        }
        else {
            $_full_modal.hide();
            $_full_modal.modal('hide');//.trigger('hidden.bs.modal');
        }
        that.mainctrl.$element.trigger($.BasePinCtrl.eventKeys.fullInfowindowChange, [$_cc[0], $_cc.hasClass("full-zoom-in")]);
    });
    if (c) { //非點籍pin(來至清單)
        this.map.flyTo(g.getLatLng());
        if (this.pinClick)
            this.pinClick(g.attributes);
    }
};
LBasePinCtrl.prototype.closeInfoWindow = function (g) {
    if(g)
        g.closePopup();
}
//pinlabel show or hide
LBasePinCtrl.prototype.showLabel = function (b) {
    this.isShowLabel = b;
    var that = this;
    if (this.graphics.length > 0) {
        var bs = this.map.getBounds();
        $.each(this.graphics, function () {
            that._showOneLabel(this, b && bs.contains(this.getLatLng()));
        });
    }
};
LBasePinCtrl.prototype._showOneLabel = function (g, b) {
    if (g._map && (b || this.isShowLabel)) {
        
        if (!g.getTooltip()) {
            g.bindTooltip('<div class="pin_label ' + g.pinstatus.classes + '">' + g.options.flag + '</div>',
                { direction: 'top', sticky: true, permanent: true, className: 'leaflet-tooltip-label ' });
           
        }
        var cs = g.pinstatus.classes.split(' ');
        var $_tooltip_label = $(g.getTooltip().getElement()).find('.' + cs[0]);//g.pinstatus.classes);
        if ($_tooltip_label.length > 0) {
            var _statusstyle = window.getComputedStyle($_tooltip_label[0]);//.find('.' + g.pinstatus.classes)[0]);
            $_tooltip_label[0].style.backgroundColor = 'transparent';
            $_tooltip_label[0].style.color = _statusstyle.fill;
            if (!g.isTooltipOpen()) {
                g.openTooltip();//.getPopup();

            }
            g.getTooltip().getElement().style.marginTop = - (g.options.icon.options.iconAnchor[1] - 2) + "px";
        }
    }
    else if (!b && !this.isShowLabel)
        g.unbindTooltip();
            //g.closeTooltip(); //colse 後label會被remove，所以每次openTooltip需從設style

}
LBasePinCtrl.prototype.displayGlyphPin = function (g) {
    if (g.asseccColor == true)
        return;
    g.asseccColor = true;
    var dom = g.getElement();
    var s = window.getComputedStyle(dom);
    dom.style.color = s.backgroundColor;
    dom.style.backgroundColor = 'transparent';
}
LBasePinCtrl.prototype.displayPin = function (g, b) {
    if (b && !g._map) {
        g.addTo(this.map);
        if (this.markerClusterGroup && g.pinstatus.glyph && !g.asseccColor) { //尚須處理markerClusterGroup裡的marker自動展開的
                this.displayGlyphPin(g);
        }
    }
    else if (!b) {
        g.remove();
    }
}
//pin show or hide
LBasePinCtrl.prototype.show = function (b) {
    this.isShowPin = b;
    if (this.markerClusterGroup) {
        b ? this.markerClusterGroup.addTo(this.map) : this.markerClusterGroup.remove();
    }
    else {
        if (this.graphics.length > 0) {
            var bs = this.map.getBounds();
            var that = this;
            $.each(this.graphics, function () {
                that.displayPin(this, b && bs.contains(this.getLatLng()));
            });
        }
    }
};

//給index取graphic
//index是在reDraw給
LBasePinCtrl.prototype.getGraphicByRindex = function (ridx) {
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
LBasePinCtrl.prototype.offFocusGraphic = function (g, fromlist) {
    var that = this;
    if (!g)
        return;
    var zs = this.zoomPinsize(g.pinsize);
    this.__resetIcon(g, zs);
    g.setOpacity(window.defaultPinOpacity || 0.9);
    if (this.offFocusRowIndex && !fromlist)
        this.offFocusRowIndex(g.attributes["rindex"]);

    if (g.getTooltip()) //為了解決1.8.0後Tooltip會隨滑鼠移動，所以關掉Tooltip，this._showOneLabel(g, false);會在重開正確的Tooltip
        g.unbindTooltip();

    this._showOneLabel(g, false);
    if (this.markerClusterGroup && !this.markerClusterGroup.hasLayer(g) ) { //移入清單後點擊show inofwindow上未實做add to markerClusterGroup
        if (!g.isPopupOpen()) {
            this.displayPin(g, false);
            this.markerClusterGroup.addLayer(g);//.refreshClusters(g);
        } else {
            g.once('popupclose', function () {
                that.displayPin(g, false);
                that.markerClusterGroup.addLayer(g);
            });
        }
    }
};

//pin focus event
LBasePinCtrl.prototype.onFocusRowIndex;
LBasePinCtrl.prototype.offFocusRowIndex;
LBasePinCtrl.prototype.onMapZoomEnd;
LBasePinCtrl.prototype.click;

//pin foucus
LBasePinCtrl.prototype.onFocusGraphic = function (g, fromlist) {//pin mouse over
    if (!g)
        return;

    if (this.markerClusterGroup && this.markerClusterGroup.hasLayer(g) && !g._map)
    {
        this.markerClusterGroup.removeLayer(g);
        this.displayPin(g, true);
    }

    var zs = this.zoomPinsize($.extend({}, g.pinsize, { x: g.pinsize.x * 1.1, y: g.pinsize.y * 1.1, maxx: g.pinsize.maxx * 1.1, maxy: g.pinsize.maxy * 1.1}));
    this.__resetIcon(g, zs); //20221110無用
    g.setOpacity(1);
    if (this.onFocusRowIndex && !fromlist) {

        this.onFocusRowIndex(g.attributes["rindex"]);
    }
    g.setZIndexOffset(window.pinLeafletMaxZIndex++);
    this._showOneLabel(g, true);
   

};
LBasePinCtrl.prototype.fitBounds = function (options) {
    this.map.fitBounds(L.featureGroup(this.graphics).getBounds(), options);
}
//pin size at zoom
LBasePinCtrl.prototype.zoomPinsize = function (psize) { //以map zoom決定 pin size
    var csize = psize ? psize : this.settings.pinsize;
    var x, y;
    if (this.mainctrl.settings.dynPinsize) {
        var cstepx = (csize.step * csize.x) / csize.y;
        var x = csize.x  + (this.map.getZoom() - 8) * cstepx;
        var y = csize.y + (this.map.getZoom() - 8) * csize.step;
        if (x < csize.minx) x = csize.minx;
        if (x > csize.maxx) x = csize.maxx;
        if (y < csize.miny) y = csize.miny;
        if (y > csize.maxy) y = csize.maxy;
    } else {
        x = csize.x;
        y = csize.y;
    }
    x = Math.floor(x);
    y = Math.floor(y);
    var offsety = 0;
    var offsetx = 0;
    if (csize.anchor && csize.anchor.indexOf("bottom") >= 0) offsety = y / 2;
    if (csize.anchor && csize.anchor.indexOf("left") >= 0) offsetx = x / 2;
    return { x: x, y: y, offsetx: offsetx, offsety:offsety};
};

LBasePinCtrl.prototype._createMarkerCluster = function () {
    var that = this;
    if (this.settings.cluster) {
        if (!L.markerClusterGroup)
            console.log("尚未引入https://unpkg.com/leaflet.markercluster@1.0.4/dist/leaflet.markercluster.js");
        if (!this.markerClusterGroup) {
            //如map.maxZoom還是太密集(cluster含多個getChildCount), clusterDisableAtZoom要設比 map.maxZoom +1,滑鼠移入cluster才會正常展開效果
            this.markerClusterGroup = L.markerClusterGroup({
                maxClusterRadius: this.settings.clusterRadius, //0可將重疊的用group顯示，如有需要可overwite _createMarkerCluster
                iconCreateFunction: function (mg) { return that._defaultIconCreateFunction(that.markerClusterGroup, mg); },
                disableClusteringAtZoom: this.settings.clusterDisableAtZoom ? this.settings.clusterDisableAtZoom : 20
            });
            this.markerClusterGroup.on('clustermouseover', function (c) {
                var g = c.layer.getAllChildMarkers()[0];
                if (that.onFocusRowIndex)
                    that.onFocusRowIndex(g.attributes["rindex"]);
                //L.DomUtil.toFront(c.layer.getElement());//只會改變位置，不會改變z-index
                window.pinLeafleClusterZIndex = window.pinLeafleClusterZIndex || 999;
                c.layer.getElement().style.zIndex = window.pinLeafleClusterZIndex++;
            });
        }
        else
            try {
                this.markerClusterGroup.clearLayers();
            } catch (ex) {
                console.log(ex);
            }
    }
};
//可override _createMarkerCluster裡的iconCreateFunction已達每一markergroup的divIcon
//例 $xx.instance.__pinctrl.instance._mainctrl._defaultIconCreateFunction = function(markerClusterGroup, mg){....}
//RainCtrl、WaterCtrlm已overwrite
LBasePinCtrl.prototype._defaultIconCreateFunction = function (_markerClusterGroup, mg) {
    var divIcon = _markerClusterGroup._defaultIconCreateFunction(mg);
    //divIcon.options.className += " " + mg.getAllChildMarkers()[0].pinstatus.classes;
    return divIcon;
}

