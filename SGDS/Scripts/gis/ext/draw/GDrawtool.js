var GDrawtool = function (ctrl, initcallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.drawingManager = undefined, this.dgraphics = [];

    var current = this;
    //require(["esri/geometry/Circle", "esri/geometry/Polygon", "esri/geometry/Polyline", "esri/geometry/geodesicUtils", "esri/units"],
    //    function (Circle, Polygon, Polyline, geodesicUtils, Units) {
        current.drawingManager = new google.maps.drawing.DrawingManager({
            drawingMode: undefined,// google.maps.drawing.OverlayType.MARKER,
            drawingControl: false,
            //drawingControlOptions: {
            //    position: google.maps.ControlPosition.TOP_CENTER,
            //    drawingModes: [
            //      google.maps.drawing.OverlayType.MARKER,
            //      google.maps.drawing.OverlayType.CIRCLE,
            //      google.maps.drawing.OverlayType.POLYGON,
            //      google.maps.drawing.OverlayType.POLYLINE,
            //      google.maps.drawing.OverlayType.RECTANGLE
            //    ]
            //},
            //markerOptions: {
            //    icon: {
            //        path: google.maps.SymbolPath.CIRCLE,
            //        fillColor: "#000000",
            //        strokeColor: "#000000",
            //        scale: 6,
            //        strokeWeight: 2
            //    }
            //},
            //circleOptions: {
            //    //fillColor: '#888888',
            //    //fillOpacity: 0.6,
            //    strokeWeight: 2,
            //    //clickable: false,
            //    //editable: false,
            //    //zIndex: 1
            //},
            //rectangleOptions: {
            //    strokeWeight: 2
            //},
            //polygonOptions: {
            //    strokeWeight: 2
            //},
            //polylineOptions: {
            //    strokeWeight: 2
            //}
        });
        current._resetDrawingManagerOptions();
        current.drawingManager.setMap(current.map);
        //current.setStrokeWeight(6);
        //current.setFillOpacity(0.1);
        google.maps.event.addListener(current.drawingManager, 'circlecomplete', function (circle) {
            var radius = circle.getRadius();
        });

        google.maps.event.addListener(current.drawingManager, 'overlaycomplete', function (event) {
            current._afterAddGraphic(event);
        });

        initcallback();
    //});
    return this;
};
GDrawtool.prototype.strokeWeight = 2;
GDrawtool.prototype.fillOpacity = 0.6;
GDrawtool.prototype.strokeColor = "#000000";
GDrawtool.prototype.fillColor = "#ff0000";
GDrawtool.prototype.setStrokeWeight = function (_weight) {
    this.strokeWeight = _weight;
    this._resetDrawingManagerOptions();
};
GDrawtool.prototype.setFillOpacity = function (_opacity) {
    this.fillOpacity = _opacity;
    this._resetDrawingManagerOptions();
};
GDrawtool.prototype.setFillColor = function (_color) {
    this.fillColor = _color;
    this._resetDrawingManagerOptions();
};
GDrawtool.prototype.setStrokeColor = function (_color) {
    this.strokeColor = _color;
    this._resetDrawingManagerOptions();
};

GDrawtool.prototype.activate = function (_type) {
    //this.map.setOptions({  scrollwheel: false,draggable:false });
    if (this._mousedownevent) //刪除freepolyline mouse event event
        google.maps.event.removeListener(this._mousedownevent);
    var _mode = undefined;
    this.map.setOptions({ draggable: true });
    
    switch (_type) {
        case "POINT":
            _mode = google.maps.drawing.OverlayType.MARKER;
            break;
        case "FREEHAND_POLYLINE":
            this.stop();
            this._freePolyline();
            return;
            break;
        case "POLYLINE":
            _mode = google.maps.drawing.OverlayType.POLYLINE;
            break;
        case "POLYGON":
            
        case "FREEHAND_POLYGON":
            _mode = google.maps.drawing.OverlayType.POLYGON;
            break;
        case "CIRCLE":
            _mode = google.maps.drawing.OverlayType.CIRCLE;
            break;
        case "RECTANGLE":
            _mode = google.maps.drawing.OverlayType.RECTANGLE;
            break;
        default:
            _mode = google.maps.drawing.OverlayType.MARKER;
            break;
    }
    this.drawingManager.setMap(this.map);
    this.drawingManager.setDrawingMode(_mode);

};

GDrawtool.prototype.currentGraphics = function () {
    return this.dgraphics;
};

GDrawtool.prototype.stop = function () {
    this.map.setOptions({ draggableCursor: '', draggable: true });
    this.drawingManager.setMap(null);
};
GDrawtool.prototype.removelast = function (_type) {
    if (this.dgraphics.length > 0)
        this.dgraphics[this.dgraphics.length - 1].setMap(null);
    this.dgraphics.pop();
    this.mainctrl.checkButtonStatus(this.dgraphics.length === 0);
};
GDrawtool.prototype.clear = function () {
    var current = this;
    $.each(this.dgraphics, function () {
        this.setMap(null);
    });
    current.dgraphics = [];
    this.mainctrl.checkButtonStatus(true);
};

//Calculates the distance between two latlng locations in m(公尺).
GDrawtool.prototype._distanceBetweenPoints = function (p1, p2) {
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
GDrawtool.prototype._afterAddGraphic = function (event) {
    //if (event.type == google.maps.drawing.OverlayType.CIRCLE) {
    //    var radius = event.overlay.getRadius();
    //}
    //console.log(event.type);

    switch (event.type) {
        case "marker":
            var mp97 = $.WGS84ToTWD97(event.overlay.position.lng(), event.overlay.position.lat());
            this.mainctrl.setMessage("座標:<br>" +
                "WGS84 X:" + event.overlay.position.lng().toFixed(5) + " Y:" + event.overlay.position.lat().toFixed(5) + "<br>" +
                "TWD97 X:" + mp97.x.toFixed(0) + " Y:" + mp97.y.toFixed(0));
            break;
        case "polyline":
            var lps = [];
            event.overlay.getPath().forEach(function (_po, _idx) {
                lps.push(_po);
            });
            if (lps.length > 1) {
                var _l = 0;
                for (var _idx = 1; _idx < lps.length; _idx++) {
                    _l += this._distanceBetweenPoints(lps[_idx], lps[_idx - 1]);
                }
                this.mainctrl.setMessage("長度:" + formatNumber(_l, 0) + "公尺" );
            }
            else
                this.mainctrl.setMessage("長度:0公尺");
            break;
        case "circle":
            this.mainctrl.setMessage("面積:" + formatNumber(Math.pow(event.overlay.radius, 2) * Math.PI, 0) + "平方公尺");
            break;
        case "rectangle":
            var x1 = event.overlay.bounds.getNorthEast().lat();
            var x2 = event.overlay.bounds.getSouthWest().lat();
            var y1 = event.overlay.bounds.getNorthEast().lng();
            var y2 = event.overlay.bounds.getSouthWest().lng();
            //var wgsgeo = new esri.geometry.Polygon([[y1, x1], [y2, x1], [y2, x2], [y1, x2], [y1, x1]]);
            var area = helper.gis.polygonArea([[y1, x1], [y2, x1], [y2, x2], [y1, x2], [y1, x1]]);
            //this.mainctrl.setMessage("面積:" + formatNumber(Math.abs(esri.geometry.geodesicAreas([wgsgeo], esri.Units.SQUARE_METERS)[0], 0)) + "平方公尺" + area+" "+area1);
            this.mainctrl.setMessage("面積:" + formatNumber(area, 0) + "平方公尺" );
            break;
        default:
            var ll = [];
            event.overlay.getPath().forEach(function (_po, _idx) {
                ll.push([_po.lng(), _po.lat()]);
            });

            //var wgsgeo = new esri.geometry.Polygon(ll);
            var area = helper.gis.polygonArea(ll);
            this.mainctrl.setMessage("面積:" + formatNumber(area, 0) + "平方公尺");
            //this.mainctrl.setMessage("面積:" + formatNumber(Math.abs(esri.geometry.geodesicAreas([wgsgeo], esri.Units.SQUARE_METERS)[0], 0)) + "平方公尺" + area + " " + area1);
            break;
    }
    this.dgraphics.push(event.overlay);
    this.mainctrl.afterAddGraphic(event.overlay, this.dgraphics);
};
GDrawtool.prototype._resetDrawingManagerOptions = function () {

    if (this.drawingManager) {
        this.drawingManager.setOptions({
            markerOptions: {
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: this.fillColor,
                    fillOpacity: 1,
                    strokeColor: this.strokeColor,
                    scale: 6,
                    strokeWeight: this.strokeWeight
                }
            },
            circleOptions: {
                fillColor: this.fillColor,
                fillOpacity: this.fillOpacity,
                strokeColor: this.strokeColor,
                strokeWeight: this.strokeWeight,
                zIndex: google.maps.Marker.MAX_ZINDEX / 5
                //clickable: false,
                //editable: false,
                //zIndex: 1
            },
            rectangleOptions: {
                fillColor: this.fillColor,
                fillOpacity: this.fillOpacity,
                strokeColor: this.strokeColor,
                strokeWeight: this.strokeWeight,
                zIndex: google.maps.Marker.MAX_ZINDEX / 5
            },
            polygonOptions: {
                fillColor: this.fillColor,
                fillOpacity: this.fillOpacity,
                strokeColor: this.strokeColor,
                strokeWeight: this.strokeWeight,
                zIndex: google.maps.Marker.MAX_ZINDEX  / 5
            },
            polylineOptions: {
                strokeColor: this.strokeColor,
                //fillOpacity: this.fillOpacity,
                strokeWeight: this.strokeWeight,
                zIndex: google.maps.Marker.MAX_ZINDEX *3/ 5
            }
        });
    }
};

GDrawtool.prototype._freePolyline = function () {
    var current = this;
    current.map.setOptions({ draggable: false, draggableCursor: 'crosshair' });

    console.log("_freePolyline");
    this._mousedownevent = google.maps.event.addDomListener(this.map.getDiv(), 'mousedown', function (e) {
        //console.log("mousedown");
        //do it with the left mouse-button only ,left:0,right:2
        if (e.button != 0) return;

        var poly = new google.maps.Polyline({
            map: current.map, clickable: false, strokeColor: current.strokeColor,
            strokeWeight: current.strokeWeight,
            zIndex: google.maps.Marker.MAX_ZINDEX * 3 / 5
        });
        //move-listener
        var _mousemoveevent = google.maps.event.addListener(current.map, 'mousemove', function (e) {
            poly.getPath().push(e.latLng);
        });
        //mouseup-listener
        google.maps.event.addListenerOnce(current.map, 'mouseup', function (e) {
            //console.log("mouseup");
            google.maps.event.removeListener(_mousemoveevent);
            google.maps.event.removeListener(current._mousedownevent);
            current._mousedownevent = undefined;
            current._afterAddGraphic({ type: "polyline", overlay: poly });            
        });
        //}, 2000);

    });
};