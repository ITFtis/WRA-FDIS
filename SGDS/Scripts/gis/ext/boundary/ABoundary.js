/***************ArcGisPolygonBoundary*****************/
var ArcGisPolygonBoundary = function (options, datas, callback) {
    this.layer = undefined;
    this.options = options;

    this._isClickFromBoundary = false;
    var current = this;
    require(["esri/layers/GraphicsLayer", "esri/graphic", "esri/geometry/Polygon", "esri/geometry/Polyline",
         "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/geometry/Extent", "esri/SpatialReference"],
         function (GraphicsLayer, Graphic, Polygon, Polyline, SimpleLineSymbol, SimpleFillSymbol, Color, Extent, SpatialReference) {
             current.layer = new esri.layers.GraphicsLayer({ id: '___lineboundarylayer' + new Date().getTime() });

             var normal_symbol = current._getSymbol()[0];
             var mouse_over_symbol = current._getSymbol()[1];
             $.each(datas, function () {
                 var g = new esri.Graphic(new esri.geometry.Polyline(this.coors), normal_symbol);
                 if (options.style.mouseOver.enable) {
                     g.mouse_over_symbol = mouse_over_symbol;
                     g.mouse_out_symbol = normal_symbol;
                     g.boundary_data = this;
                 }
                 current.layer.add(g);
                 g.attributes = $.extend(g.attributes, this);
             });

             options.map.addLayer(current.layer);
             if (options.style.mouseOver.enable) {
                 current.layer.on('mouse-over', function (evt) {
                     current.setOnFocus(evt.graphic);
                     options.map.setMapCursor(options.style.mouseOver.cursor);
                     if (options.mouseOver)
                         options.mouseOver(evt.graphic.boundary_data, evt.graphic, evt);
                 })
                 current.layer.on('mouse-out', function (evt) {
                     current.setLoseFocus(evt.graphic);
                     options.map.setMapCursor("default");
                     if (options.mouseOut)
                         options.mouseOut(evt.graphic.boundary_data, evt.graphic, evt);
                 });
             }
             current.layer.on('click', function (evt) {
                 if (options.click && evt.graphic.boundary_data)
                     options.click(evt.graphic.boundary_data, evt.graphic, evt);
                 _isClickFromBoundary = true;
             });
             if(callback)
                 callback(current.layer);
         });
};

//設定focus, g(string)為id,g(object)為graphic
ArcGisPolygonBoundary.prototype.setOnFocus = function (g) {
    var graphic = undefined;
    if (typeof g === "string") {
        $.each(this.layer.graphics, function () {
            if (this.boundary_data.ID === g || this.boundary_data.Name === g) {
                graphic = this;
                return false;
            }
        });
    }
    else
        graphic = g;
    
    graphic.symbol = graphic.mouse_over_symbol;
    graphic.draw();
};
//設定lose focus
ArcGisPolygonBoundary.prototype.setLoseFocus = function (g) {
    var graphic = undefined;
    if (typeof g === "string") {
        $.each(this.layer.graphics, function () {
            if (this.boundary_data.ID === g || this.boundary_data.Name === g) {
                graphic = this;
                return false;
            }
        });
    }
    else
        graphic = g;

    graphic.symbol = graphic.mouse_out_symbol;
    graphic.draw();
};
//清除layer geometry
ArcGisPolygonBoundary.prototype.clear = function () {
    this.layer.clear();
};
//設定fitBounds (extend)
ArcGisPolygonBoundary.prototype.fitBounds = function (_rect) {
    console.log(JSON.stringify(_rect));
    if (_rect)
        this.options.map.setExtent(new esri.geometry.Extent(_rect.minx, _rect.miny, _rect.maxx, _rect.maxy, new esri.SpatialReference({ wkid: 4326 })))
    .then(function () { });
};
//取nornal， mouse in的Symbol
ArcGisPolygonBoundary.prototype._getSymbol = function () {
    var normal_filll_color = new esri.Color(this.options.style.fillColor);
    normal_filll_color.a = this.options.style.fillOpacity;

    var mouse_over_fill_color = new esri.Color(this.options.style.mouseOver.fillColor);
    mouse_over_fill_color.a = this.options.style.mouseOver.fillOpacity;

    var normal_symbol = new esri.symbol.SimpleFillSymbol(this.options.style.lineStyle,
          new esri.symbol.SimpleLineSymbol(this.options.style.lineStyle, new esri.Color(this.options.style.strokeColor), this.options.style.strokeWeight),
          normal_filll_color);

    var mouse_over_symbol = new esri.symbol.SimpleFillSymbol(this.options.style.lineStyle,
          new esri.symbol.SimpleLineSymbol(this.options.style.lineStyle, new esri.Color(this.options.style.mouseOver.strokeColor), this.options.style.mouseOver.strokeWeight),
          mouse_over_fill_color);
    return [normal_symbol, mouse_over_symbol];
};
/*** line ***/
var ArcGisLineBoundary = function (options, datas, callback) {
    ArcGisPolygonBoundary.call(this, options, datas, callback);
};
ArcGisLineBoundary.prototype = Object.create(ArcGisPolygonBoundary.prototype);
ArcGisLineBoundary.prototype.constructor = ArcGisLineBoundary;
ArcGisLineBoundary.prototype._getSymbol = function () {
    var normal_line_color = new esri.Color(this.options.style.strokeColor);
    normal_line_color.a = this.options.style.strokeOpacity;

    var mouse_over_line_color = new esri.Color(this.options.style.mouseOver.strokeColor);
    mouse_over_line_color.a = this.options.style.mouseOver.strokeOpacity;

    var normal_symbol = new esri.symbol.SimpleLineSymbol(this.options.style.lineStyle, normal_line_color, this.options.style.strokeWeight);

    var mouse_over_symbol = new esri.symbol.SimpleLineSymbol(this.options.style.lineStyle, mouse_over_line_color, this.options.style.mouseOver.strokeWeight);
    return [normal_symbol, mouse_over_symbol];
};
