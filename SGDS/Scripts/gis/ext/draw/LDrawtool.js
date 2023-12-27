
var LDrawtool = function (ctrl, initcallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.drawingManager = undefined, this.dgraphics = [];
    this.drawGeo = undefined;
    this.drawingLayer = L.featureGroup().addTo(this.map);;
    var current = this;
    this.currentDrawingType;
   
    var djs = ['Leaflet.draw.min.js', 'Leaflet.Draw.Event.min.js', 'Toolbar.min.js', 'Tooltip.min.js',
        'ext/bundle.min.js', //bundle已包含後面的script //'ext/GeometryUtil.js', 'ext/LatLngUtil.js', 'ext/LineUtil.Intersect.js', 'ext/Polygon.Intersect.js', 'ext/Polyline.Intersect.js', 'ext/TouchEvents.js',
        'draw/DrawToolbar.js','draw/handler/Draw.Feature.js', 'draw/handler/Draw.SimpleShape.js', 'draw/handler/Draw.Polyline.js', 'draw/handler/Draw.Marker.js', 'draw/handler/Draw.Circle.js', 'draw/handler/Draw.CircleMarker.js', 'draw/handler/Draw.Polygon.js', 'draw/handler/Draw.Rectangle.js',
        'Control.Draw.min.js',//'edit/EditToolbar.js', 'edit/handler/EditToolbar.Edit.js', 'edit/handler/EditToolbar.Delete.js', 
    ];
   
    var gjs = [];
    if (!L.Draw) {
        $.each(djs, function () {
            gjs.push($.AppConfigOptions.script.gispath + '/leaflet/draw/' + this);
        });
    }
    if (!L.DrawExt || !L.DrawExt.Freeline)
        gjs.push($.AppConfigOptions.script.gispath+'/ext/leaflet/Draw.Freeline.js');
    var idx = 0;
    var getjs = function () {
        helper.misc.getJavaScripts( gjs[idx], function () {
            if (idx == gjs.length - 1) {
                current._initDraw();
                initcallback();
            }
            else {
                idx++;
                getjs();
            }
        });
    }
    if (gjs.length > 0)
        getjs();
    else {
        current._initDraw();
        setTimeout(function () {
            initcallback();
        }.bind(this));
    }
   
    return this;
};

LDrawtool.prototype._initDraw = function () {
    this._drawLocal();
    //同時用2個Drawtool要設guid區別
    this.guid = this.mainctrl.settings.guid;//'//|| helper.misc.geguid();
    console.log('this.guid:' + this.guid);
    var that = this;
    this.drawGeo = {};
    this.drawGeo[$.gisdrawtool.types.POLYLINE.type] = new L.Draw.Polyline(this.map, {
        error: '<strong>Error:</strong> shape edges cannot cross!',
        tooltip: {
            start: 'Click to start drawing line.',
            cont: 'Click to continue drawing line.',
            end: 'Click last point to finish line.'
        },
        pasticon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon'
        }),
        shapeOptions: {
            stroke: true,
            color: this.strokeColor,
            weight: this.strokeWeight,
            opacity: .8,
            fill: false,
            clickable: true,
            guid: this.guid
        },
        repeatMode: this.mainctrl.settings.mutiDraw,
        maxPoints: 0//// Once this number of points are placed, finish shape,預設0:無限點
    });
    
    this.drawGeo[$.gisdrawtool.types.FREEHAND_POLYLINE.type] = new L.DrawExt.Freeline(this.map, {
        shapeOptions: {
            stroke: true,
            color: this.strokeColor,
            weight: this.strokeWeight,
            opacity: .8,
            fill: false,
            clickable: true,
            guid: this.guid 
        },
        repeatMode: this.mainctrl.settings.mutiDraw
    });
    this.drawGeo[$.gisdrawtool.types.POLYGON.type] = new L.Draw.Polygon(this.map, {
        showArea: true,
        showLength: true,
        pasticon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon'
        }),
        shapeOptions: {
            stroke: true,
            color: this.strokeColor,
            weight: this.strokeWeight,
            opacity: .8,
            fill: true,
            fillColor: this.fillColor, //same as color by default
            fillOpacity: this.fillOpacity,
            clickable: false,
            guid: this.guid
        },
        repeatMode: this.mainctrl.settings.mutiDraw
    });
    this.drawGeo[$.gisdrawtool.types.RECTANGLE.type] = new L.Draw.Rectangle(this.map, {
        showArea: true,
        showLength: true,
        shapeOptions: {
            stroke: true,
            color: this.strokeColor,
            weight: this.strokeWeight,
            opacity:.8,
            fill: true,
            fillColor: this.fillColor, 
            fillOpacity: this.fillOpacity,
            clickable: true,
            guid: this.guid
        },
        repeatMode: this.mainctrl.settings.mutiDraw
    });
    this.drawGeo[$.gisdrawtool.types.CIRCLE.type.toUpperCase()] = new L.Draw.Circle(this.map, {
        shapeOptions: {
            stroke: true,
            color: this.strokeColor,
            weight: this.strokeWeight,
            opacity: .8,
            fill: true,
            fillColor: this.fillColor,
            fillOpacity: this.fillOpacity,
            clickable: true,
            guid: this.guid
        },
        repeatMode: this.mainctrl.settings.mutiDraw
    });
    this.drawGeo[$.gisdrawtool.types.POINT.type] = new L.Draw.Marker(this.map, {
        icon: L.icon({
            iconUrl: $.AppConfigOptions.script.gispath + '/images/blue-pushpin.png', iconSize: [24, 24],
            iconAnchor: [7, 24],
            guid: this.guid
        }),
        repeatMode: this.mainctrl.settings.mutiDraw
    });
    this.drawGeo["CIRCLEMAKER"] = new L.Draw.CircleMarker(this.map, {
        stroke: true,
        color: '#ff0000',
        radius: 10,
        weight: this.strokeWeight,
        opacity: 0.5,
        fill: true,
        fillColor: null, //same as color by default
        fillOpacity: 0.2,
        clickable: true,
        guid: this.guid ,
        repeatMode: this.mainctrl.settings.mutiDraw
    });
    //this.drawGeo[$.gisdrawtool.types.POLYLINE.type].setOptions(  { shapeOptions: { weight: 10 } });
    
    this.map.on('draw:created', function (e) {
        var type = e.layerType,
            layer = e.layer;
        //20201130guid屬性，為了處裡同時用2個2以上Drawtool
        if (layer.options.guid == that.guid || (layer.options.icon && layer.options.icon.options.guid == that.guid)) {
            that.drawingLayer.addLayer(layer);
            //console.log('this.guid:' + that.guid);
            that._afterAddGraphic(layer);
        }
    });
    
}

LDrawtool.prototype.strokeWeight = 2;
LDrawtool.prototype.fillOpacity = 0.6;
LDrawtool.prototype.strokeColor = "#000000";
LDrawtool.prototype.fillColor = "#ff0000";
LDrawtool.prototype.setStrokeWeight = function (_weight) {
    this.strokeWeight = _weight;
    this._setShapeOptions('weight', _weight);
};
LDrawtool.prototype.setFillOpacity = function (_opacity) {
    this.fillOpacity = _opacity;
    this._setShapeOptions('fillOpacity', _opacity);
};
LDrawtool.prototype.setFillColor = function (_color) {
    this.fillColor = _color;
    this._setShapeOptions('fillColor', _color);
};
LDrawtool.prototype.setStrokeColor = function (_color) {
    this.strokeColor = _color;
    this._setShapeOptions('color', _color);
};
LDrawtool.prototype._setShapeOptions = function (_attr, _val) {
    if (this.drawGeo) {
        $.each(this.drawGeo, function () {
            if (this.options.shapeOptions) {
                this.options.shapeOptions[_attr] = _val;
                this.setOptions(this.options);
            }
            if (this.options.hasOwnProperty(_attr)) {//CIRCLEMAKER
                this.options[_attr] = _val;
                this.setOptions(this.options);
            }
        });
    }
}
LDrawtool.prototype.activate = function (_type) {
    this.stop();
    this.drawGeo[_type].enable();
    var that = this;
    this.currentDrawingType = _type;
    // Assumming you have a Leaflet map accessible
    

};

LDrawtool.prototype.currentGraphics = function () {
    return this.drawingLayer.getLayers();
};
LDrawtool.prototype.stop = function () {
if(this.drawGeo)
    $.each(this.drawGeo, function () {
        this.disable();
    });
    
};
LDrawtool.prototype.removelast = function (_type) {
    var lays =this.drawingLayer.getLayers();
    this.drawingLayer.removeLayer(lays[lays.length - 1]);
    this.mainctrl.checkButtonStatus(this.drawingLayer.getLayers().length === 0);
};
LDrawtool.prototype.clear = function () {
    //this.dgraphics.pop();
    this.drawingLayer.clearLayers();
    this.mainctrl.checkButtonStatus(true);
};

//Calculates the distance between two latlng locations in m(公尺).
LDrawtool.prototype._distanceBetweenPoints = function (p1, p2) {
    if (!p1 || !p2) {
        return 0;
    }

    var R = 6371; // Radius of the Earth in km
    var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
    var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d*1000;
};
LDrawtool.prototype._afterAddGraphic = function (layer) {
    switch (this.currentDrawingType) {
        case $.gisdrawtool.types.POLYLINE.type :
        case $.gisdrawtool.types.FREEHAND_POLYLINE.type:
            //var ls = that.drawGeo[_type]._getTooltipText().subtext;
            var ls = this.drawGeo[this.currentDrawingType]._getMeasurementString();//第二次後會有null問題
            var iskm = ls.indexOf('km') >= 0;
            var sd = ls.substring(0, ls.length - (iskm ? 3 : 2));
            ls = parseFloat(ls.substring(0, ls.length - (iskm ? 3 : 2)));
            if (iskm)
                ls = ls * 1000;
            this.mainctrl.setMessage("長度:" + helper.format.formatNumber(ls, 0) + "公尺");
            break;
        case 'CIRCLEMAKER':
        case $.gisdrawtool.types.POINT.type:
            var mp97 = $.WGS84ToTWD97(layer.getLatLng().lng, layer.getLatLng().lat);
            this.mainctrl.setMessage("座標:<br>" +
                "WGS84 X:" + layer.getLatLng().lng.toFixed(5) + " Y:" + layer.getLatLng().lat.toFixed(5) + "<br>" +
                "TWD97 X:" + mp97.x.toFixed(0) + " Y:" + mp97.y.toFixed(0));
            break;
        case $.gisdrawtool.types.CIRCLE.type.toUpperCase():
            var _radius = layer.getRadius();
            this.mainctrl.setMessage("半徑:" + helper.format.formatNumber(_radius, 0) + "公尺<br>" +
                "面積:" + helper.format.formatNumber(Math.pow(_radius, 2) * Math.PI, 0) + "平方公尺");
            break;
        default:
            var _latLngs = layer.getLatLngs();
            var _area = L.GeometryUtil.geodesicArea(_latLngs[0]);
            this.mainctrl.setMessage("面積:" + helper.format.formatNumber(_area, 0) + "平方公尺");
            break;
    }
    this.mainctrl.afterAddGraphic(layer, this.drawingLayer.getLayers()); //this.drawingLayer.getLayers() mainctrl 判斷控制項work unwork 20190814
    //this.mainctrl.afterAddGraphic(this.drawingLayer.getLayers()); //20190621當初為麼是this.drawingLayer.getLayers()
};
LDrawtool.prototype._drawLocal = function () {
    $.extend(L.drawLocal, {
        draw: {
            toolbar: {
                // #TODO: this should be reorganized where actions are nested in actions
                // ex: actions.undo  or actions.cancel
                actions: {
                    title: 'Cancel drawing',
                    text: 'Cancel'
                },
                finish: {
                    title: 'Finish drawing',
                    text: 'Finish'
                },
                undo: {
                    title: 'Delete last point drawn',
                    text: 'Delete last point'
                },
                buttons: {
                    polyline: 'Draw a polyline',
                    polygon: 'Draw a polygon',
                    rectangle: 'Draw a rectangle',
                    circle: 'Draw a circle',
                    marker: 'Draw a marker',
                    circlemarker: 'Draw a circlemarker'
                }
            },
            handlers: {
                circle: {
                    tooltip: {
                        start: '按地圖及拖拉劃圓'//Click and drag to draw circle.'
                    },
                    radius: '半徑'
                },
                circlemarker: {
                    tooltip: {
                        start: '點擊地圖'//Click map to place circle marker.'
                    }
                },
                marker: {
                    tooltip: {
                        start: '點擊地圖'//'Click map to place marker.'
                    }
                },
                polygon: {
                    tooltip: {
                        start: '點擊地圖開始劃多邊形',//'Click to start drawing shape.',
                        cont: '繼續點擊劃其他點',//'Click to continue drawing shape.',
                        end: '點擊第一點結束'//'Click first point to close this shape.'
                    }
                },
                polyline: {
                    error: '<strong>Error:</strong> shape edges cannot cross!',
                    tooltip: {
                        start: '點擊地圖開始劃線',//'Click to start drawing linfffe.',
                        cont: '繼續點擊劃其他點',//'Click to continue drawing linddde.',
                        end: '點擊最後一點結束'//'Click last point to finish lidddne.'
                    }
                },
                freeline: {
                    error: '<strong>Error:</strong> shape edges cannot cross!',
                    tooltip: {
                        start: '按地圖開始劃筆',//'Click to start drawing linfffe.',
                        cont: '拖曳畫線',//'Click to continue drawing linddde.',
                        end: '點擊最後一點結束'//'Click last point to finish lidddne.'
                    }
                },
                rectangle: {
                    tooltip: {
                        start: '按地圖及拖拉'//'Click and drag to draw rectangle.'
                    }
                },
                simpleshape: {
                    tooltip: {
                        end: '放開滑鼠以完成'
                    }
                }
            }
        },
        edit: {
            toolbar: {
                actions: {
                    save: {
                        title: 'Save changes',
                        text: 'Save'
                    },
                    cancel: {
                        title: 'Cancel editing, discards all changes',
                        text: 'Cancel'
                    },
                    clearAll: {
                        title: 'Clear all layers',
                        text: 'Clear All'
                    }
                },
                buttons: {
                    edit: 'Edit layers',
                    editDisabled: 'No layers to edit',
                    remove: 'Delete layers',
                    removeDisabled: 'No layers to delete'
                }
            },
            handlers: {
                edit: {
                    tooltip: {
                        text: 'Drag handles or markers to edit features.',
                        subtext: 'Click cancel to undo changes.'
                    }
                },
                remove: {
                    tooltip: {
                        text: 'Click on a feature to remove.'
                    }
                }
            }
        }
    });

}
