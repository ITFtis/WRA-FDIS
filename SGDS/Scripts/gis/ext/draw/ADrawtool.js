var ADrawtool = function (ctrl, inicallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.toolbar = undefined, this.dgraphics = [];
    this.arcgis = {
        Draw: undefined, webMercatorUtils: undefined, SimpleMarkerSymbol: undefined, SimpleLineSymbol: undefined, Graphic: undefined,
        Color: undefined, geodesicUtils: undefined, Units: undefined
    };
    var current = this;
    require(["esri/toolbars/draw", "esri/graphic", "esri/symbols/SimpleMarkerSymbol",
              "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/geometry/geodesicUtils", "esri/units", "esri/geometry/webMercatorUtils"],
              function (Draw, Graphic, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, geodesicUtils, Units, webMercatorUtils) {

                  current.arcgis.Draw = Draw;
                  current.arcgis.webMercatorUtils = webMercatorUtils;
                  current.arcgis.SimpleMarkerSymbol = SimpleMarkerSymbol;
                  current.arcgis.SimpleLineSymbol = SimpleLineSymbol;
                  current.arcgis.SimpleFillSymbol = SimpleFillSymbol;
                  current.arcgis.geodesicUtils = geodesicUtils;
                  current.arcgis.Graphic = Graphic;
                  current.arcgis.Color = Color;
                  current.arcgis.Units = Units;

                  current.toolbar = new Draw(current.map);
                  current.toolbar.on("draw-end", addToMap);
                  inicallback();

              });

    function addToMap(evt) {
        var symbol;
        current.toolbar.deactivate();
        current.map.showZoomSlider();
        switch (evt.geometry.type) {
            case "point":
                symbol = new current.arcgis.SimpleMarkerSymbol().setColor(new current.arcgis.Color(current.fillColor))
                //.setOutline(new current.arcgis.SimpleLineSymbol("solid", new current.arcgis.Color(current.strokeColor), current.strokeWeight));
                    //.setOutline(new current.arcgis.SimpleLineSymbol("solid", new current.arcgis.Color(current.strokeColor), current.strokeWeight));
                console.log(current.strokeColor);
                
                var mp = evt.geometry;
                if (evt.geometry.spatialReference.wkid == 102100)
                    mp = current.arcgis.webMercatorUtils.webMercatorToGeographic(mp);
                var mp97 = $.WGS84ToTWD97(mp.x, mp.y);
                current.mainctrl.setMessage("座標:<br>" +
                    "WGS84 X:" + mp.x.toFixed(5) + " Y:" + mp.y.toFixed(5) + "<br>" +
                    "TWD97 X:" + mp97.x.toFixed(0) + " Y:" + mp97.y.toFixed(0));
                break;
            case "multipoint":
                symbol = new current.arcgis.SimpleMarkerSymbol().setColor(new current.arcgis.Color(current.fillColor));
                break;
            case "polyline":
                //symbol = new current.arcgis.SimpleLineSymbol("solid", new current.arcgis.Color([255, 128, 0]), current.strokeWeight);
                symbol = new current.arcgis.SimpleLineSymbol("solid", new current.arcgis.Color(current.strokeColor), current.strokeWeight);
                var wgsgeo = evt.geometry;
                if (evt.geometry.spatialReference.wkid == 102100)
                    wgsgeo = current.arcgis.webMercatorUtils.webMercatorToGeographic(wgsgeo);
                current.mainctrl.setMessage("長度:" + formatNumber(current.arcgis.geodesicUtils.geodesicLengths([wgsgeo], current.arcgis.Units.METERS)[0], 0) + "公尺");
                break;
            default:
                var _fillColor = new current.arcgis.Color(current.fillColor);
                _fillColor = new current.arcgis.Color([_fillColor.toRgb()[0], _fillColor.toRgb()[1], _fillColor.toRgb()[2],current.fillOpacity ]);
                symbol = new current.arcgis.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, 
                    new current.arcgis.SimpleLineSymbol("solid", new current.arcgis.Color(current.strokeColor), current.strokeWeight),
                    new current.arcgis.Color(_fillColor));
                var wgsgeo = current.arcgis.webMercatorUtils.webMercatorToGeographic(evt.geometry);
                current.mainctrl.setMessage("面積:" + formatNumber(current.arcgis.geodesicUtils.geodesicAreas([wgsgeo], current.arcgis.Units.SQUARE_METERS)[0], 0) + "平方公尺");
                break;
        }
        var graphic = new current.arcgis.Graphic(evt.geometry, symbol);
        current.map.graphics.add(graphic);
        current.dgraphics.push(graphic);

        current.mainctrl.afterAddGraphic(graphic,current.dgraphics);
        //current.mainctrl.checkButtonStatus(false);


    }

    return this;
};

ADrawtool.prototype.strokeWeight = 2;
ADrawtool.prototype.fillOpacity = 0.6;
ADrawtool.prototype.strokeColor = "#000000";
ADrawtool.prototype.fillColor = "#ff0000";
ADrawtool.prototype.setStrokeWeight = function (_weight) {
    this.strokeWeight = _weight;
};
ADrawtool.prototype.setFillOpacity = function (_opacity) {
    this.fillOpacity = _opacity;
};
ADrawtool.prototype.setFillColor = function (_color) {
    this.fillColor = _color;
};
ADrawtool.prototype.setStrokeColor = function (_color) {
    this.strokeColor = _color;
    console.log("setStrokeColor:" + _color);
};

ADrawtool.prototype.currentGraphics = function () {
    return this.dgraphics;
};

ADrawtool.prototype.activate = function (_type) {
    this.toolbar.activate(this.arcgis.Draw[_type]);
    this.map.hideZoomSlider();
};
ADrawtool.prototype.stop = function () {
    this.toolbar.deactivate();
    this.map.showZoomSlider();
};
ADrawtool.prototype.removelast = function (_type) {
    this.map.graphics.remove(this.dgraphics[this.dgraphics.length - 1]);
    this.dgraphics.pop();
    this.mainctrl.checkButtonStatus(this.dgraphics.length === 0);
};
ADrawtool.prototype.clear = function () {
    var current = this;
    //this.toolbar.deactivate();
    $.each(this.dgraphics, function () {
        current.map.graphics.remove(this);
    });
    current.dgraphics = [];
    this.mainctrl.checkButtonStatus(true);
};


