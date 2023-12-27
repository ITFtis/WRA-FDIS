var GLBasePinCtrl = function (ctrl, initcallback) {
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
   
   setTimeout(function () {  initcallback(); },1000);
    var intervalflag;
    //this.map.on('zoomend', function () {
    //    var zs = current.zoomPinsize();
    //    if (intervalflag)
    //        clearTimeout(intervalflag);
    //    intervalflag = setTimeout(function () {
    //        //console.log((iii++) +">>" +this.pinctrlid+">>" + current.graphics.length);
    //        $.each(current.graphics, function (idx, g) {
    //            this.options.icon.options.iconSize = [zs.x, zs.y];
    //            this.options.icon.options.iconAnchor= [zs.x / 2- zs.offsetx, zs.y / 2 + zs.offsety];
    //            this.options.icon.options.popupAnchor= [zs.offsetx, -(zs.y / 2 + zs.offsety + 2)];
    //            this.options.icon.options.tooltipAnchor = [0, -30];// [100-zs.offsetx, -100-(zs.y / 2 + zs.offsety + 2)];
    //            if (this.options.icon.options.glyphSize) {
    //                this.options.icon.options.glyphSize = Math.floor( zs.x*2 / 5) + 'px';
    //                this.options.icon.options.glyphAnchor = [0, -Math.floor(zs.x * 2 / 10)];// -zs.y / 2 + Math.floor( zs.x / 3) - zs.offsety]
    //            }
    //            this.setIcon(this.options.icon);
    //            if (this.getTooltip() && this.isTooltipOpen()) {
    //                this.getTooltip().getElement().style.marginTop = -(this.options.icon.options.iconAnchor[1] - 2) + "px";
    //            }
    //        });
    //        current.show(current.isShowPin);
    //        current.showLabel(current.isShowLabel);
    //    }, 100);
    //    if (current.onMapZoomEnd) { //觸發onMapZoomEnd事件
    //        current.onMapZoomEnd(current.map.getZoom());
    //    }
    //});
    //var moveintervalflag;
    //this.map.on('moveend', function () {
    //    if (moveintervalflag) clearTimeout(moveintervalflag);
    //    moveintervalflag = setTimeout(function () {
    //        current.show(current.isShowPin);
    //        current.showLabel(current.isShowLabel);
    //    }, 300);
    //})
    return this;
};

if (!window.pinLeafletMaxZIndex)
    window.pinLeafletMaxZIndex = 10000;

GLBasePinCtrl.prototype.reDraw = function (_datas) {
    var current = this;
    //if (this.settings.cluster)
    //    this._createMarkerCluster();
    $.each(current.graphics, function (idx, g) {
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
                this.rindex = rindex++;

                var _pinstatus = current.settings.checkDataStatus.call(current.mainctrl, this);
                if (!_pinstatus) {
                    console.log("checkDataStatus查無對應icon:" + JSON.stringify(this));
                    return;
                }
                var _iconoptions = $.extend({
                    className: _pinstatus ?  "icon_"+_pinstatus.classes:"",
                    iconUrl: helper.misc.getAbsoluteUrl(_pinstatus.url),
                    iconSize: [_cZoomPinsize.x, _cZoomPinsize.y],
                    iconAnchor: [_cZoomPinsize.x / 2 - _cZoomPinsize.offsetx, _cZoomPinsize.y / 2 + _cZoomPinsize.offsety],
                    popupAnchor: [_cZoomPinsize.offsetx, -(_cZoomPinsize.y / 2 + _cZoomPinsize.offsety + 2)],
                    tooltipAnchor: [0, -30]//[100-_cZoomPinsize.offsetx,-100-(_cZoomPinsize.y / 2 + _cZoomPinsize.offsety + 2)] //沒作用
                }, _pinstatus);
                //console.log(_iconoptions.className + ">>" + _pinstatus.classes);
                if (_iconoptions.glyph) {
                    _iconoptions.glyphSize =Math.floor(  _cZoomPinsize.x*2 / 5) + 'px';
                    _iconoptions.glyphAnchor = [0, -Math.floor(_cZoomPinsize.x * 2 / 10)];// -_cZoomPinsize.y / 2 + Math.floor(  _cZoomPinsize.x/ 3) - _cZoomPinsize.offsety]
                }
                var _options = $.extend({}, current.settings.geometryOtherOptions, {
                    //icon: L.icon.glyph && _iconoptions.prefix && _iconoptions.glyph ? L.icon.glyph(_iconoptions) : L.icon(_iconoptions),
                    opacity:0.9,
                    flag: current.settings.stTitle.call(current.mainctrl, _cdata)
                    //title: current.settings.stTitle.call(current.mainctrl, _cdata), //不給值，不然移入會自動有tooltip
                    //alt: current.settings.stTitle.call(current.mainctrl, _cdata) + "_alt",
                });
                var g = new gomp.Marker({ icon: { image: _pinstatus.url }});
                g.setLngLat([this.X, this.Y]).addTo(current.map);
                //$(g.getElement()).append($('<img src="'+_pinstatus.url+'">'));

                current.graphics.push(g);
                return;
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

                //L.circleMarker([this.Y, this.X], {
                //    className: 'shadow'
                //}).addTo(current.map);
                //return false;]
                if (current.markerClusterGroup)
                    current.markerClusterGroup.addLayer(g);
                
            } catch (ex) {
                console.log("資料錯誤!!" + JSON.stringify(_cdata));
            }

        });
        if (this.isShowLabel)
            this.showLabel(this.isShowLabel);
        //L.control.layers(current.graphics).addTo(this.map);
    }
};
GLBasePinCtrl.prototype.getCurrentZoomlevel = function () {
    return this.map.getZoom();
};
GLBasePinCtrl.prototype.showInfoWindow = function (g, c) {
    return;
    var that = this;
    if (g.isPopupOpen())
        return;
    if (c) {
        this.map.panTo(g.getLatLng());
    }
    

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
    $_pop.find('.leaflet-popup-tip')[0].style.boxShadow = " 3px 3px 15px " + _statusstyle.backgroundColor;
    

    //放大
    var $_full_modal;
    var $_cc = $_pop.find(".leaflet-popup-content");
    $_pop.find('.zoom-in-ctrl').click(function () {
        $_cc.toggleClass('full-zoom-in');
        if ($_cc.hasClass("full-zoom-in")) {
            $_full_modal = helper.jspanel.jspAlertMsg($(that.map.getContainer()), { autoclose: 9999999, size: that.settings.canFullInfowindow == true ? undefined : that.settings.canFullInfowindow, classes: "modal-lg modal-dialog-full-window modal-dialog-" + that.settings.name + "-full-window" }, function () {
                that.showInfoWindow(g, c);
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


GLBasePinCtrl.prototype.closeInfoWindow = function (g) {
    return;
    g.closePopup();
}
//pinlabel show or hide
GLBasePinCtrl.prototype.showLabel = function (b) {
    return;
    this.isShowLabel = b;
    var that = this;
    if (this.graphics.length > 0) {
        var bs = this.map.getBounds();
        $.each(this.graphics, function () {
            that._showOneLabel(this, b && bs.contains(this.getLatLng()));
        });
    }
};
GLBasePinCtrl.prototype._showOneLabel = function (g, b) {
    return;
    if (g._map && (b || this.isShowLabel)) {
        if (!g.getTooltip()) {
            g.bindTooltip('<div class="pin_label ' + g.pinstatus.classes + '">' + g.options.flag + '</div>',
                { direction: 'top', sticky: true, permanent: true, className: 'leaflet-tooltip-label ' });
           
        }
        var $_tooltip_label = $(g.getTooltip().getElement()).find('.' + g.pinstatus.classes);
        var _statusstyle = window.getComputedStyle($_tooltip_label[0]);//.find('.' + g.pinstatus.classes)[0]);
        $_tooltip_label[0].style.backgroundColor = 'transparent';
        $_tooltip_label[0].style.color = _statusstyle.fill;
        if (!g.isTooltipOpen()) {
            g.openTooltip();//.getPopup();
           
        }

        g.getTooltip().getElement().style.marginTop = -(g.options.icon.options.iconAnchor[1] - 2) + "px";
    }
    else if (!b && !this.isShowLabel)
        g.unbindTooltip();
            //g.closeTooltip(); //colse 後label會被remove，所以每次openTooltip需從設style
}

GLBasePinCtrl.prototype.displayPin = function (g, b) {
    if (b && !g._map) {
        g.addTo(this.map);
    }
    else if (!b) {
        g.remove();
    }
}
//pin show or hide
GLBasePinCtrl.prototype.show = function (b) {
    this.isShowPin = b;
    if (this.markerClusterGroup) {
        b ? this.markerClusterGroup.addTo(this.map) : this.markerClusterGroup.remove();
    }
    else {
        if (this.graphics.length > 0) {
            var bs = this.map.getBounds();
            var that = this;
            $.each(this.graphics, function () {
                that.displayPin(this, b );//&& bs.contains(this.getLatLng()));
            });
        }
    }
};

//給index取graphic
//index是在reDraw給
GLBasePinCtrl.prototype.getGraphicByRindex = function (ridx) {
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
GLBasePinCtrl.prototype.offFocusGraphic = function (g, fromlist) {
    return;
    var that = this;
    if (!g)
        return;
    var zs = this.zoomPinsize(g.pinsize);
    g.options.icon.options.iconSize = [zs.x, zs.y];
    g.setIcon(g.options.icon);
    g.setOpacity(0.9);
    if (this.offFocusRowIndex && !fromlist)
        this.offFocusRowIndex(g.attributes["rindex"]);
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
GLBasePinCtrl.prototype.onFocusRowIndex;
GLBasePinCtrl.prototype.offFocusRowIndex;
GLBasePinCtrl.prototype.onMapZoomEnd;
GLBasePinCtrl.prototype.click;

//pin foucus
GLBasePinCtrl.prototype.onFocusGraphic = function (g, fromlist) {//pin mouse over
    return;
    if (!g)
        return;

    if (this.markerClusterGroup && this.markerClusterGroup.hasLayer(g) && !g._map)
    {
        this.markerClusterGroup.removeLayer(g);
        this.displayPin(g, true);
    }

    var zs = this.zoomPinsize(g.pinsize);
    g.options.icon.options.iconSize = [zs.x*1.1, zs.y*1.1];
    g.setIcon(g.options.icon);
    g.setOpacity(1);
    if (this.onFocusRowIndex && !fromlist)
        this.onFocusRowIndex(g.attributes["rindex"]);
    g.setZIndexOffset(window.pinLeafletMaxZIndex++);
    this._showOneLabel(g, true);
   

};

//pin size at zoom
GLBasePinCtrl.prototype.zoomPinsize = function (psize) { //以map zoom決定 pin size
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

GLBasePinCtrl.prototype._createMarkerCluster = function () {
    var that = this;
    if (this.settings.cluster) {
        if (!L.markerClusterGroup)
            console.log("尚未引入https://unpkg.com/leaflet.markercluster@1.0.4/dist/leaflet.markercluster.js");
        if (!this.markerClusterGroup) {
            this.markerClusterGroup = L.markerClusterGroup({
                maxClusterRadius: this.settings.clusterRadius, //0可將重疊的用group顯示，如有需要可overwite _createMarkerCluster
                iconCreateFunction: function (mg) { return that._defaultIconCreateFunction(that.markerClusterGroup, mg); }
            });
            this.markerClusterGroup.on('clustermouseover', function (c) {
                var g = c.layer.getAllChildMarkers()[0];
                if (that.onFocusRowIndex)
                    that.onFocusRowIndex(g.attributes["rindex"]);
                //L.DomUtil.toFront(c.layer.getElement());//只會改變位置，不會改變z-index
                window.pinLeafleClusterZIndex = window.pinLeafleClusterZIndex || 999;
                c.layer.getElement().style.zIndex = window.pinLeafleClusterZIndex++;
                //$(c.layer.getElement()).css('z-index', window.pinLeafleClusterZIndex++);
            });
        }
        else
            this.markerClusterGroup.clearLayers();
    }
};
//可override _createMarkerCluster裡的iconCreateFunction已達每一markergroup的divIcon
//例 $xx.instance.__pinctrl.instance._mainctrl._defaultIconCreateFunction = function(markerClusterGroup, mg){....}
//RainCtrl、WaterCtrlm已overwrite
GLBasePinCtrl.prototype._defaultIconCreateFunction = function (_markerClusterGroup, mg) {
    var divIcon = _markerClusterGroup._defaultIconCreateFunction(mg);
    //divIcon.options.className += " " + mg.getAllChildMarkers()[0].pinstatus.classes;
    return divIcon;
}

