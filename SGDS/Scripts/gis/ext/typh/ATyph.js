var ATyph = function (ctrl, inicallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.map;
    
    this.arcApi = {
        InfoTemplate: null, GraphicsLayer: null, Graphic: null, Point: null, Polyline: null, Circle: null,
        SimpleMarkerSymbol: null, SimpleLineSymbol: null, SimpleFillSymbol: null, Color: null, connect: null
    };
    this._pointlayer =undefined;
    this._linelayer = undefined;
    this._radiusLayer = undefined;

    var current = this;
    require(["esri/InfoTemplate", "esri/layers/GraphicsLayer", "esri/graphic", "esri/geometry/Point", "esri/geometry/Polyline", "esri/geometry/Circle", "esri/symbols/SimpleMarkerSymbol",
              "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "dojo/_base/connect"],
    function (InfoTemplate, GraphicsLayer, Graphic, Point, Polyline, Circle, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, connect) {
        current.arcApi.InfoTemplate = InfoTemplate;
        current.arcApi.GraphicsLayer = GraphicsLayer;
        current.arcApi.Graphic = Graphic;
        current.arcApi.Point = Point;
        current.arcApi.Polyline = Polyline;
        current.arcApi.Circle = Circle;
        current.arcApi.SimpleMarkerSymbol = SimpleMarkerSymbol;
        current.arcApi.SimpleLineSymbol = SimpleLineSymbol;
        current.arcApi.SimpleFillSymbol = SimpleFillSymbol;
        current.arcApi.Color = Color;
        current.arcApi.connect = connect;

        var infoTemplate = new current.arcApi.InfoTemplate();

        infoTemplate.setTitle(function (geo) {
            return JsonDateStr2Datetime(geo.attributes.DateTime).DateFormat($.typh.date_time_format_string);
            //"${DateTime}");
        });

        infoTemplate.setContent("<b>位置: </b>${CurrPlace}<br/>");
        //infoTemplate.setTitle("####");
        //infoTemplate.setContent("<b>2000 Population: </b>rrrrrrrrrrr<br/>");

        current._pointlayer = new GraphicsLayer({ id: $.typh.layerid.typh_pointlayer });
        current._pointlayer.setInfoTemplate(infoTemplate);
        current._linelayer = new GraphicsLayer({ id: $.typh.layerid.typh_linelayer });
        current._radiusLayer = new GraphicsLayer({ id: $.typh.layerid.typh_radiusLayer });
        //current._radiusLayer.visibleAtMapScale = true;
        //current._pointlayer.showAttribution = true;
        connect.connect(current._pointlayer, 'onMouseOver', function (g) {
            current.mainctrl.changeWarntime(g.graphic.attributes);
            current.map.infoWindow.setContent(g.graphic.getContent());
            current.map.infoWindow.setTitle(g.graphic.getTitle());
            //current.map.infoWindow.show(g.graphic.geometry, current.map.getInfoWindowAnchor(g.graphic.geometry));
            current.map.infoWindow.show(g.mapPoint);
        });
        connect.connect(current._pointlayer, 'onMouseOut', function (g) {
            current.map.infoWindow.hide();
        });



        current.map.addLayer(current._radiusLayer, 0);
        current.map.addLayer(current._linelayer);
        current.map.addLayer(current._pointlayer);
       
        inicallback();
    });
    return this;
};

ATyph.prototype.show = function () {
    this._pointlayer.show();
    this._linelayer.show();
    this._radiusLayer.show();
};
ATyph.prototype.hide = function () {
    this._pointlayer.hide();
    this._linelayer.hide();
    this._radiusLayer.hide();
};
ATyph.prototype.clearTrace = function () {
    if (this._pointlayer) {
        this._pointlayer.clear();
        this._linelayer.clear();
        this._radiusLayer.clear();
    }
};
ATyph.prototype.paintTyphTrace = function (_warns) {
    var current = this;
    current.clearTrace();
    var lpath = [];
    var plpath = [];
    $.each(_warns, function (idx, item) {
        //infobox.append('<li class="list-group-item" data-typhinfo="' + item.DateTime + '" style="cursor:pointer;">' + item.DateTime + '</li>');

        var symbol = new current.arcApi.SimpleMarkerSymbol();
        var p = new current.arcApi.Graphic(new current.arcApi.Point(item.Long, item.Lat), new current.arcApi.SimpleMarkerSymbol().setSize(10).setColor(new current.arcApi.Color([255, 0, 0, 1])));

        p.setAttributes(item);
        //console.log('spatialreference wkid:' + evt.geometry.spatialReference.wkid);
        current._pointlayer.add(p);
        lpath.push([item.Long, item.Lat]);

        if (0 === idx) {
            plpath.push([item.Long, item.Lat]);
            $.each(item.PredDatas, function (pidx, pitem) {
                var pp = new current.arcApi.Graphic(new current.arcApi.Point(pitem.Long, pitem.Lat),
                    new current.arcApi.SimpleMarkerSymbol().setSize(10).setColor(new current.arcApi.Color([255, 255, 255, 1])));
                pp.setAttributes(pitem);
                //pp.typh_data = pitem;
                current._pointlayer.add(pp);
                plpath.push([pitem.Long, pitem.Lat]);
            });
            ////暴風半徑
            //changeWarntime(item);
        }
    });
    current._linelayer.add(new current.arcApi.Graphic(new current.arcApi.Polyline(lpath),
        new current.arcApi.SimpleLineSymbol(current.arcApi.SimpleLineSymbol.STYLE_SOLID, new current.arcApi.Color([0, 0, 0]), 2)));
    current._linelayer.add(new current.arcApi.Graphic(new current.arcApi.Polyline(plpath),
        new current.arcApi.SimpleLineSymbol(current.arcApi.SimpleLineSymbol.STYLE_DASHDOT, new current.arcApi.Color([80, 80, 80]), 2)));

    //SimpleRenderer 只有在Graphic的symbol是undefined有用
    //require(["esri/renderers/SimpleRenderer", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/Color"], function (SimpleRenderer, SimpleMarkerSymbol, SimpleLineSymbol, Color) {
    //    var _SimpleSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CROSS, 12,
    //            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
    //        new Color([255, 0, 0]), 2), new Color([0, 255, 0, 0.25]));
    //    var renderer = new SimpleRenderer(_SimpleSymbol);
    //    current._pointlayer.setRenderer(renderer);
    //});
};
ATyph.prototype.paintTyphRadius = function (_warn) {
    this._radiusLayer.clear();
    if (!_warn) {
        return;
    }
    this._radiusLayer.add(new this.arcApi.Graphic(new this.arcApi.Point(_warn.Long, _warn.Lat), new this.arcApi.SimpleMarkerSymbol().setSize(14).setColor(new this.arcApi.Color([255, 255, 255, 0.6])).
        setOutline(new this.arcApi.SimpleLineSymbol(this.arcApi.SimpleLineSymbol.STYLE_SOLID, new this.arcApi.Color([255, 0, 0]), 4))));
    //7級
    if (_warn.Radius7 !== undefined && _warn.Radius7 !== 0) {
        this._radiusLayer.add(new this.arcApi.Graphic(new this.arcApi.Circle(new this.arcApi.Point([_warn.Long, _warn.Lat]), { 'radius': _warn.Radius7 * 1000 }),
            new this.arcApi.SimpleFillSymbol(this.arcApi.SimpleFillSymbol.STYLE_SOLID,
                new this.arcApi.SimpleLineSymbol(this.arcApi.SimpleLineSymbol.STYLE_SOLID, new this.arcApi.Color([255, 0, 0]), 2),
                new this.arcApi.Color([255, 0, 0, 0.25])
        )));
    }
    //10級
    if (_warn.Radius10 !== undefined && _warn.Radius10 !== 0) {
        this._radiusLayer.add(new this.arcApi.Graphic(new this.arcApi.Circle(new this.arcApi.Point([_warn.Long, _warn.Lat]), { 'radius': _warn.Radius10 * 1000 }),
           new this.arcApi.SimpleFillSymbol(this.arcApi.SimpleFillSymbol.STYLE_SOLID,
               new this.arcApi.SimpleLineSymbol(this.arcApi.SimpleLineSymbol.STYLE_SOLID, new this.arcApi.Color([255, 0, 0]), 2),
               new this.arcApi.Color([255, 0, 0, 0.25])
       )));
    }
};