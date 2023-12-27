var GBasePinCtrl = function (ctrl, initcallback) {
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

    this.markerCluster = undefined;
    this.clusterMaxZoom = 18;

    var current = this;
    setTimeout(function () { initcallback(); });
    
    if (this.map) {
        var zommChangeTimeoutIdtemp=0;
        google.maps.event.addListener(this.map, 'zoom_changed', function () {
            if (zommChangeTimeoutIdtemp != 0) {
                clearTimeout(zommChangeTimeoutIdtemp); // doesn't matter if it's 0
            }

            //重新設定pin icon大小
            zommChangeTimeoutIdtemp = setTimeout(function () {
                if (current.graphics.length !== 0 && current.mainctrl.settings.dynPinsize) {//最好(效能)current.mainctrl.settings.dynPinsize=false
                    var _cZoomPinsize = current.zoomPinsize();
                    if (current.markerCluster)
                        current.markerCluster.clearMarkers();
                    
                    $.each(current.graphics, function (idx, g) {
                        current._resetPinsize(this, _cZoomPinsize);
                    });
                    current._createMarkerCluster()
                }
                if (current.onMapZoomEnd) { //觸發onMapZoomEnd事件
                    current.onMapZoomEnd(current.map.getZoom());
                }
            }, 600);
        });
    }
    return this;
};
GBasePinCtrl.prototype.setOpacity = function (_opacity) {
};
//重新劃pin
GBasePinCtrl.prototype.reDraw = function (_datas) {
    var current = this;
    var oldgraphics = $.extend([], current.graphics);
    //$.each(current.graphics, function (idx, g) {
    //    this.setMap(null);
    //});
    
    current.graphics = [];
    
    var __isshowlabel = this.isShowLabel;// current.mainctrl.isShowLabel();
    var rindex = 0;
    if (_datas.length !== 0) {
        var _cZoomPinsize = current.zoomPinsize();
      
        $.each(_datas, function (_idx) {
            var _cdata=this;
            try {
                current.graphics.push(current._createPin.call(current, this, _cZoomPinsize, true));
                this.rindex = rindex++;
            } catch (ex) {
                console.log("資料錯誤!!"+JSON.stringify(_cdata));
            }
        });
        
        this._createMarkerCluster();
        if (this.isShowLabel)
            this.showLabel(this.isShowLabel);
    }
    setTimeout(function () { //減少畫面刪掉在新增的頓挫
        $.each(oldgraphics, function (idx, g) {
            if (this.listeners__) {
                for (i = 0; i < this.listeners__.length; i++) {
                    google.maps.event.removeListener(this.listeners__[i]);
                }
            }
            this.setMap(null);
        });
    }, 300);
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

//新增一筆
GBasePinCtrl.prototype.add = function (_data) {
    var _cZoomPinsize = this.zoomPinsize();
    this.graphics.push(this._createPin.call(this, _data, _cZoomPinsize, true));
    _data.rindex = this.graphics.length;
    
    if (this.visible)
        this.graphics[this.graphics.length - 1].setMap(this.map);
    if (this.isShowLabel)
        this._gmMarkerToMarkerWithLabel.call(this, this.graphics[this.graphics.length-1], _cZoomPinsize).setOptions({ labelVisible: true });
    
    this._createMarkerCluster();
}
//移除一筆
GBasePinCtrl.prototype.remove = function (_data) {
    var _cZoomPinsize = this.zoomPinsize();
    var _ridx;
    $.each(this.graphics, function (_idx, g) {
        if (g.attributes == _data)
            _ridx = _idx;
    });
    
    if (_ridx != undefined)
    {
        this.graphics[_ridx].setMap(null);
        this.graphics.splice(_ridx, 1);
    }
    this._createMarkerCluster();
}

//目前 map zoom level
GBasePinCtrl.prototype.getCurrentZoomlevel = function () {
    return this.map.getZoom();
};
var iii = 0;
GBasePinCtrl.prototype.showInfoWindow = function (g, viewcenter) {
    var $_cc;
    var that = this;
    var _id = 'iw-id-' + helper.misc.geguid();

    var _infowindow = this.infowindow;
    if (this.settings.singleInfoWindow !== true && g) {
        if (!g._infowindow)
            g._infowindow = new google.maps.InfoWindow({});
        _infowindow = g._infowindow;
        setTimeout(function () {
            if($_cc)
                $_cc.on('mouseover', function () {
                    g._infowindow.setZIndex(pinGoogleMaxZIndex++);
                });
        });
    }
   
    var _zoomin = "";
    if (this.settings.canFullInfowindow )
        _zoomin = "<div class='zoom-in-ctrl'><span class=' glyphicon glyphicon-zoom-in'></div>";

    _infowindow.setZIndex(pinGoogleMaxZIndex);
    _infowindow.setContent("<div id='" + _id + "' class='googleContentFix' >" + _zoomin + "<div align='center' class='title " + g._pinstatus.classes + "'>" + this.settings.stTitle.call(this.mainctrl, g.attributes) + "</div>" + this.settings.pinInfoContent.call(this.mainctrl, g.attributes, this.settings.infoFields) + "</div>");
    if(this.markerCluster)
        _infowindow.setPosition(g.getPosition());

    _infowindow.infoid = _id;
    _infowindow.fromShowInfoWindow = true; //zoom change也會觸發infowindow domready
    //listen domready
    if (!_infowindow.hasdomready) {
        _infowindow.hasdomready = true;
        google.maps.event.addListener(_infowindow, 'domready', function (evt, err, wewe) {
            _afterInfowindow();
        });
    }
    _infowindow.open(this.map, g);
    if (viewcenter) {
        this.map.setCenter(g.getPosition());
    }
    //改變infoWindow外觀]
    var _afterInfowindow = function () {
        var $_c = $('#' + _infowindow.infoid).parents('.gm-style-iw-a:first').parent().addClass('gm-pin-iw-container').addClass('gm-pin-iw-' + that.settings.name);//.css('opacity', 0.3);;

        $_cc = $_c.find('#' + _infowindow.infoid);
       
        var $_title = $_cc.find('> .title');
        if (!g._pinstatus.classes)
            $_title[0].style.backgroundColor = '#b8b8b8';

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
        //放大
        var $_full_modal;
        $_c.find('.zoom-in-ctrl').off('click').on('click',function () {
            $_cc.toggleClass('full-zoom-in');
            if ($_cc.hasClass("full-zoom-in")) {
                //canFullInfowindow bool or {width:XX, max-width:XXX}
                $_full_modal = helper.jspanel.jspAlertMsg($(g.getMap().getDiv()), { autoclose: 9999999, size: that.settings.canFullInfowindow == true ? undefined : that.settings.canFullInfowindow, classes: "modal-lg modal-dialog-full-window modal-dialog-" + that.settings.name + "-full-window" }, function () {
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

GBasePinCtrl.prototype.closeInfoWindow = function (g) {
    if (g && g._infowindow)
        g._infowindow.close();
    else
        this.infowindow.close();
}

//pinlabel show or hide
GBasePinCtrl.prototype.showLabel = function (b) {
    var current = this;
    this.isShowLabel = b;
    var _cZoomPinsize = current.zoomPinsize();
    $.each(this.graphics, function () {
        current._gmMarkerToMarkerWithLabel.call(current, this, _cZoomPinsize).setOptions({ labelVisible: b });
    });
    current._createMarkerCluster();
};

//pin show or hide
GBasePinCtrl.prototype.show = function (b) {
    var current = this
    this.visible = b;
    $.each(this.graphics, function () {
        if (b)
            this.setMap(current.map);
        else
            this.setMap(null);
    });
    if (current.markerCluster) { //最好(效能)current.mainctrl.settings.dynPinsize=false
        //current.markerCluster.setMap(b?current.map:null);
        if (b)
            current._createMarkerCluster();
        else {
            current.markerCluster.clearMarkers();
        }
    }
};

GBasePinCtrl.prototype.fitBounds = function (options) {
var bounds = new google.maps.LatLngBounds();
for (var i = 0; i < this.graphics.length; i++) {
    bounds.extend(this.graphics[i].position);
}
this.map.fitBounds(bounds)
}
//給index取graphic
//index是在reDraw給
GBasePinCtrl.prototype.getGraphicByRindex = function (ridx) {
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
GBasePinCtrl.prototype.offFocusGraphic = function (g, fromlist) {
    var current = this;
    if (!g)
        return;

    this._resetPinsize(g, this.zoomPinsize());
    
    if (!this.isShowLabel) {
        if (g._MarkerWithLabel) //marker第一次mouseenter時會變成MarkerWithLabel，但還是會觸發mouse leave一次
            g._MarkerWithLabel.setOptions({ labelVisible: false, opacity: 0.9 });
        else
            g.setOptions({ labelVisible: false, opacity: 0.9 });
    }
    else
    {
        g.setOptions({ opacity: 0.9 });
    }
    
    //_MarkerWithLabel

    if (this.markerCluster && g.removeFormCluster == true) {
        this.markerCluster.addMarker(g);
        delete g.removeFormCluster;
    }

    if (this.offFocusRowIndex && !fromlist)
        this.offFocusRowIndex(g.attributes["rindex"]);
};

//pin focus event
GBasePinCtrl.prototype.onFocusRowIndex;
GBasePinCtrl.prototype.offFocusRowIndex;
GBasePinCtrl.prototype.onMapZoomEnd;
GBasePinCtrl.prototype.pinClick;

if (!window.pinGoogleMaxZIndex)
    window.pinGoogleMaxZIndex = google.maps.Marker.MAX_ZINDEX;
//pin foucus
GBasePinCtrl.prototype.onFocusGraphic = function (g, fromlist, scale) {//pin mouse over
    if (!g)
        return;
    scale = scale || { x: 1.1, y: 1.1 };
    var that = this;

    var _cZoomPinsize = this.zoomPinsize();

    _cZoomPinsize.offsetx = _cZoomPinsize.offsetx * scale.x;
    _cZoomPinsize.offsety = _cZoomPinsize.offsety * scale.y;
    _cZoomPinsize.x = _cZoomPinsize.x * scale.x;
    _cZoomPinsize.y = _cZoomPinsize.y * scale.y;


    var _removeFormCluster = false;
    if (this.markerCluster && fromlist && g.getMap() == null) { //pin在cluster裡，cluster移除該pin(offFocusGraphic再加回來)，
        _removeFormCluster = true;
        this.markerCluster.removeMarker(g);
    }

    g = this._gmMarkerToMarkerWithLabel.call(this, g, _cZoomPinsize);
    
    this._resetPinsize(g, _cZoomPinsize);
    g.setOptions({ labelVisible: true, zIndex: pinGoogleMaxZIndex++, opacity: 1 }); //顯示label及pin放置最上層
    //console.log('pinGoogleMaxZIndex:' + pinGoogleMaxZIndex);
    if (_removeFormCluster) { //處理cluster已移除pin，加removeFormCluster屬性，offFocusGraphic用
        g.setMap(this.map);
        g.removeFormCluster = true;
    }
   
    if (this.onFocusRowIndex && !fromlist)
        this.onFocusRowIndex(g.attributes["rindex"]);
};

//pin size at zoom
GBasePinCtrl.prototype.zoomPinsize = function (psize) { //以map zoom決定 pin size
    var csize = psize ? psize : this.settings.pinsize;
    var x, y;
    if (this.mainctrl.settings.dynPinsize) {
        var cstepx = (csize.step * csize.x) / csize.y;
        x = csize.x + (this.map.getZoom() - 7) * cstepx;
        y = csize.y + (this.map.getZoom() - 7) * csize.step;
        if (x < csize.minx) x = csize.minx;
        if (x > csize.maxx) x = csize.maxx;
        if (y < csize.miny) y = csize.miny;
        if (y > csize.maxy) y = csize.maxy;
    } else {
        x = csize.x;
        y = csize.y
    }
    var offsety =  Math.floor( y / 2);
    var offsetx = Math.floor( x / 2);
    if (csize.anchor && csize.anchor.indexOf("bottom") >= 0) offsety = y ;
    if (csize.anchor && csize.anchor.indexOf("left") >= 0) offsetx = 0;
    //console.log('csize.anchor:' + csize.anchor);
    return { x: x, y: y, offsetx: offsetx, offsety: offsety };
};

GBasePinCtrl.prototype._resetPinsize = function (_marker, _cpinsize) {
    var _titlelength = _marker.labelContent.length;
    _marker.setOptions({
        //icon: new google.maps.MarkerImage(
        //            _marker.getIcon().url,
        //            null, /* size is determined at runtime */
        //            null,//new google.maps.Point(_cpinsize.offsetx, _cpinsize.offsety), /* origin is 0,0 */
        //            null, /* anchor is bottom center of the scaled image */
        //            new google.maps.Size(_cpinsize.x, _cpinsize.y)
        //        ),
        icon:{
            url: _marker.getIcon().url,
            anchor: new google.maps.Point(_cpinsize.offsetx, _cpinsize.offsety),
            scaledSize: new google.maps.Size(_cpinsize.x, _cpinsize.y)
        },
        labelAnchor: new google.maps.Point(_titlelength * 5.5, _cpinsize.y / 2 + _cpinsize.offsety + 4),
    });
    //console.log(JSON.stringify(_cpinsize));
};

GBasePinCtrl.prototype._createPin = function (_data,_cZoomPinsize, _isGmMaker) {
    var current = this;
    //尚未實作:to do current.graphics比對新的data，用原marker reset options畫面才不會頓
    var _pinstatus = current.settings.checkDataStatus.call(current.mainctrl, _data);
    var _title = current.settings.stTitle.call(current.mainctrl, _data);
    
    if (_title == undefined)
        console.log("title無資料，pin.stTitle:" + _title);
    var _titlelength = _title.length;
    //var marker = new google.maps.Marker({// new MarkerWithLabel({
    var _options = {
        position: new google.maps.LatLng(_data.Y, _data.X),
        //icon: new google.maps.MarkerImage(
        //            _pinstatus.url,
        //            null, /* size is determined at runtime */
        //            null, /* origin is 0,0 */
        //            null, /* anchor is bottom center of the scaled image */
        //            new google.maps.Size(_cZoomPinsize.x, _cZoomPinsize.y)
        //        ),//{ url: _pinstatus.url,  size: new google.maps.Size(30,30) },
        icon: {
            url: _pinstatus.url,
            anchor: new google.maps.Point(_cZoomPinsize.offsetx, _cZoomPinsize.offsety),
            scaledSize: new google.maps.Size(_cZoomPinsize.x, _cZoomPinsize.y)
        },
        //draggable: true,
        //animation:google.maps.Animation.DROP,
        cursor: "pointer",
        raiseOnDrag: true,
        //map: current.map,
        labelContent: _title,
        labelAnchor: new google.maps.Point(_titlelength * 5.5, _cZoomPinsize.y / 2+ _cZoomPinsize.offsety + 4),
        labelClass: "pin_label " + _pinstatus.classes,// "labels", // the CSS class for the label
        labelStyle: { opacity: 0.99 },
        opacity: 0.9,
        labelInBackground: true,
        optimized: true,
        labelVisible: false
        //zIndex: _idx
    };
    if (_data.pinZIndex)
        _options.zIndex = _data.pinZIndex;
    var marker = null;
    if (_isGmMaker)
        marker = new google.maps.Marker(_options);
    else
        marker = new MarkerWithLabel(_options);
    marker.attributes = _data;
    marker._pinstatus = _pinstatus;
    if (current.settings.clickable) {
        var isdraging = false;
        var _position = undefined;
        var _dynPositionMarker = undefined;
        marker.listeners__ = [
             //google.maps.event.addListener(marker, 'dragstart', function () {
             //    isdraging = true;
             //    console.log('dragstart..');
             //    _dynPositionMarker = current._createPin(marker.attributes, _cZoomPinsize, true);
             //    current.offFocusGraphic(_dynPositionMarker);

             //    _position = marker.getPosition();
             //    current._resetPinsize(marker, {x:0,y:0});
             //}),
             // google.maps.event.addListener(marker, 'dragend', function () {
             //     isdraging = false;
             //     marker.setPosition(_position);
             //     current.offFocusGraphic(marker);
             // }),
            google.maps.event.addListener(marker, 'mouseover', function () {
                if (isdraging)
                    return;
                current.onFocusGraphic(marker);
            }),

            // assuming you also want to hide the infowindow when user mouses-out
            google.maps.event.addListener(marker, 'mouseout', function () {
                if (isdraging)
                    return;
                current.offFocusGraphic(marker);
            }),
            google.maps.event.addListener(marker, 'click', function () {
                if (current.settings.useInfoWindow)
                    current.showInfoWindow(marker, false);
                if (current.pinClick)
                    current.pinClick(marker.attributes);
            })
        ]
    }
    _data.graphic = marker;

    return marker;
};

GBasePinCtrl.prototype._createMarkerCluster = function () {
    if (this.markerCluster) //最好(效能)current.mainctrl.settings.dynPinsize=false
        this.markerCluster.clearMarkers();
    if (this.settings.cluster && this.visible)
        this.markerCluster = new MarkerClusterer(this.map, this.graphics, typeof this.settings.cluster === 'boolean' ?
                            {
                                imagePath: $.AppConfigOptions.script.gispath + '/google/markerclusterimage/m',//'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
                                maxZoom: this.clusterMaxZoom,
                                gridSize: 50
                            } : this.settings.cluster);
};

GBasePinCtrl.prototype._gmMarkerToMarkerWithLabel = function (g, _cZoomPinsize) {
    if (this.settings.pinLabel && !g.label && g.getMap() != null) {
        var gg = g;
        var gidx = this.graphics.indexOf(gg);
        gg.setMap(null);
        g = this._createPin.call(this, gg.attributes, _cZoomPinsize, false);
        g.setMap(this.map);
        this.graphics.splice(gidx, 1, g);
        gg._MarkerWithLabel = g;
    }
    return g;
}


