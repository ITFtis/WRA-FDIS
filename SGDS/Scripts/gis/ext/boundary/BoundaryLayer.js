/*
 * Only for Arcgis
 */
(function ($) {
    
    var Host_Site = window.location.host;

    $.BoundaryLayer = {
        defaultSettings: {
            map: undefined,
            rootBoundaryArea: "台灣",
            TAIWAN: "台灣",
            clickzoom: true,
            clickZoomToLeaf: false,
            clickLeafCallback:undefined,
            defaultZise: {w:250, h:250},
            focusFillColor: [238, 210, 250, 1],
            focusLineWidth: 1,
            focusLineColor: [255, 255, 255, 0.8],
            defaultFillColor: [238, 210, 250, 0.8],
            defaultLineWidth: 0.5,
            defaultLineColor: [255, 255, 255, 0.5],
            countyConfig: { layer: Host_Site.indexOf("localhost") >= 0 ? "https://210.59.250.187/CVD/Data/county.kmz" : $.AppConfigOptions.script.gispath + "/kml/county.kmz", countyNameFiled: "COUN_NA", countyIdFiled: "COUN_ID" },
            townConfig: { layer: Host_Site.indexOf("localhost") >= 0 ? "https://210.59.250.187/CVD/Data/town.kmz" : $.AppConfigOptions.script.gispath + "/kml/town.kmz", countyNameFiled: "COUN_NA", townNameFiled: "TOWN_NA", townIdFiled: "Pkey", countyIdFiled: "COUN_ID" }
            //countyConfig: { layer: new esri.layers.FeatureLayer("https://water.tainan.gov.tw/tnwrbarcgis/rest/services/tnwrb_base/MapServer/14", { mode: esri.layers.FeatureLayer.MODE_SNAPSHOT, id: "asdfafadsfsdgwerfsdfa", outFields: ["*"] }), countyNameFiled: "CITYNAME", countyIdFiled: "nCity" },
            //townConfig: { layer: new esri.layers.FeatureLayer("https://water.tainan.gov.tw/tnwrbarcgis/rest/services/tnwrb_base/MapServer/13", { mode: esri.layers.FeatureLayer.MODE_SNAPSHOT, id: "asdfafafsdfa", outFields: ["*"] }), countyNameFiled: "CITYNAME", townNameFiled: "TOWNNAME", townIdFiled: "ZIPCODE", countyIdFiled: "nCity" }
        }
        , customFilleColor: { TownId: "", Color: "red" }
    }
    var pluginName = 'BoundaryLayer'
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = $.extend({}, $.BoundaryLayer.defaultSettings);// {map:undefined, width:240};
        this.$___MapDiv = undefined;
        this.___boundarymap = undefined;
        this.___dialog = undefined;
        this.___guid = undefined;
        this.___clickFromLayer = false;
        this.___lastExtend = undefined;
        this.___fullScreenExtent = undefined;
        this.___onFocusGraphicSymbol = undefined;
        this.___loseFocusGraphicSymbol = undefined;
        this.___countyCustomFilleColor = undefined; //自行設定每一鄉鎮的顏色
        this.___townCustomFilleColor = undefined; //自行設定每一鄉鎮的顏色
        this.___isCountyLayerFromKml = true;
        this.___isTownLayerFromKml = true;
        this.isInitCompleted = false;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            var current = this;
            $.extend(this.settings, options);
            //this.$element.height("250px");
            //this.$element.css("min-width", "210px");
            //this.$element.css("overflow", "hidden");
            this.___guid = geguid();
            this.$___MapDiv = $('<div id="map_' + this.___guid + '" style="width: 200px;height: 200px; padding: 0px; margin: 0px;"></div>');
            this.$element.append(this.$___MapDiv);
            //this.$___MapDiv.load(function () {
            //    alert('load');
            this.$element.show_busyIndicator();
            if (current.$element.is(":visible"))
                current.___initMap();
            else {
                var timertemp = setInterval(function () {
                    if (current.$element.is(":visible")) {
                        clearInterval(timertemp);
                        current.___initMap();
                    }
                }, 300);
            }
            //});
            //setTimeout(function () {
            //    alert('t');
            //}, 5000);
        },
        setCountyCustomFilleColor: function (_datas) {
            if (!_datas)
                return;

            this.___countyCustomFilleColor = _datas;
            this.___setCustomFilleColor(this.settings.countyConfig.layer, this.___countyCustomFilleColor);
        },
        setTownCustomFilleColor: function (_datas) {
            if (!_datas)
                return;
            
            this.___townCustomFilleColor = _datas;
            this.___setCustomFilleColor(this.settings.townConfig.layer, this.___townCustomFilleColor);
        },
        ___setCustomFilleColor: function (_layer, _datas) { //如警戒資訊圖顏色
            var current = this;
            if (_layer && _datas && _datas.length>0) {
                $.each(_layer.graphics, function (idx, _g) {
                    _g.symbol = $.extend({}, current.___loseFocusGraphicSymbol);
                    _g.customSymbol = undefined;
                    $.each(_datas, function () {
                        if (_g.attributes[current.settings.townConfig.townNameFiled] == this.TownId) {
                            _g.symbol.setColor(new esri.Color(this.Color));
                            _g.customSymbol = _g.symbol;
                        }
                        
                    });
                    _g.draw();
                });
            }
        },
        ___initMap: function () {
            var current = this;
            //主程式開始點
            require([
             "esri/map", "esri/layers/WebTiledLayer", "esri/layers/GraphicsLayer", "esri/layers/FeatureLayer", "esri/symbols/SimpleFillSymbol", "esri/symbols/SimpleLineSymbol", "esri/Color"
            , "dijit/TooltipDialog"], function (Map, WebTiledLayer, GraphicsLayer, FeatureLayer, SimpleFillSymbol, SimpleLineSymbol, Color) {
                current.___lastExtent = current.___fullScreenExtent = new esri.geometry.Extent(120.3536118307253, 21.905800144655,
               121.5632379006578, 25.2902423231679, new esri.SpatialReference({ wkid: 4326 }));

                current.___boundarymap = new esri.Map("map_" + current.___guid, {
                    logo: false,
                    extent: current.___fullScreenExtent,
                    autoResize: false,
                    showInfoWindowOnClick: false,
                    slider: false,
                    smartNavigation: false,
                    
                    fadeOnZoom: true
                });

                //var wt = new WebTiledLayer($.googleArc.tiles.MAP_TYPE_ROADMAP.urlTemplate, {
                //    "id": $.googleArc.layerid,
                //    "subDomains": $.googleArc.tiles.MAP_TYPE_ROADMAP.subDomains
                //    //opacity:0.1
                //})

                ////wt.hide();
                //current.___boundarymap.addLayer(wt);

                current.___boundarymap.on('load', $.proxy(current.___boundarymapLoaded, current));
                current.___onFocusGraphicSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                                 new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new esri.Color(current.settings.focusLineColor), current.settings.focusLineWidth),
                                 new esri.Color(current.settings.focusFillColor)
                              );
                current.___loseFocusGraphicSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                            new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new esri.Color(current.settings.defaultLineColor), current.settings.defaultLineWidth),
                            new esri.Color(current.settings.defaultFillColor)
                        );

                if (current.settings.TAIWAN === current.settings.rootBoundaryArea) {
                    if (typeof (current.settings.countyConfig.layer) === "string") {
                        $.loadKmllayer(current.___boundarymap, current.settings.countyConfig.layer, "county_" + current.___guid, true, 1.1, function (cl) {
                            current.settings.countyConfig.layer = cl;
                            current.___initCountyLayer();
                        });
                    } else {
                        current.___isCountyLayerFromKml = false;
                        current.settings.countyConfig.layer = current.settings.countyConfig.layer;

                        current.___boundarymap.addLayer(current.settings.countyConfig.layer);
                        var _cid = setInterval(function () { //等到有資料
                            try {
                                if (current.settings.countyConfig.layer.graphics && current.settings.countyConfig.layer.graphics.length > 0) {
                                    clearInterval(_cid);
                                    current.___initCountyLayer();
                                }
                            } catch (ex) { console.log("error:" + ex); }
                        }, 500);
                        
                    }
                }
                if (typeof (current.settings.townConfig.layer) === "string") {
                    $.loadKmllayer(current.___boundarymap, current.settings.townConfig.layer, "town_" + current.___guid, true, 1.1, function (tl) {
                        current.settings.townConfig.layer = tl;
                        if (current.settings.TAIWAN === current.settings.rootBoundaryArea) {
                            current.settings.townConfig.layer.hide();
                        }
                        current.___initTownLayer();

                        current.$___MapDiv.width("100%").height("100%");
                        current.___boundarymap.resize(true);
                        current.$element.hide_busyIndicator(); //在此結束 busyIndicator
                    });
                } else {
                    ___isTownLayerFromKml = false;
                    current.settings.townConfig.layer = current.settings.townConfig.layer;

                    current.___boundarymap.addLayer(current.settings.townConfig.layer);
                    
                    var _tid = setInterval(function () { //等到有資料
                        try {
                            if (current.settings.townConfig.layer.graphics && current.settings.townConfig.layer.graphics.length > 0) {
                                clearInterval(_tid);
                                console.log("current.settings.townConfig.layer.graphics.length:" + current.settings.townConfig.layer.graphics.length);
                                current.___initTownLayer();
                                current.$___MapDiv.width("100%").height("100%");
                                current.___boundarymap.resize(true);
                                
                            }
                        } catch (ex) { console.log("error:"+ex); }
                    },500);
                    if (current.settings.TAIWAN === current.settings.rootBoundaryArea) {
                        current.settings.townConfig.layer.hide();
                    }
                    current.$element.hide_busyIndicator(); //在此結束 busyIndicator
                }

                //resize
                if (current.$element.parents(".jsPanel").length > 0) {
                    $(current.$element.parents(".jsPanel")[0]).on('resizestop', function () {
                        //console.log("......................resize");
                        current.___boundarymap.resize(true);
                        setTimeout(function () {
                            current.___boundarymap.setExtent(current.___lastExtent);
                        }, 100);
                    });
                }

                

                
            });
        },
        //map load 初始參數
        ___boundarymapLoaded: function (evt) {
            var current = this;
            this.___boundarymap.disableDoubleClickZoom();
            this.___boundarymap.disablePan();
            this.___boundarymap.disableScrollWheelZoom();

            this.___boundarymap.on('click', function (evt) { //boundarymap click 全景，clear Town
                if (!current.___clickFromLayer) {
                    var sss = current.___boundarymap.setExtent(current.___fullScreenExtent).then(function (value) {
                        // Do something when the process completes
                        current.settings.countyConfig.layer.show();
                        current.settings.townConfig.layer.hide();
                    });
                    current.___lastExtent = current.___fullScreenExtent;
                }
                current.___clickFromLayer = false;
            });
          
            this.___dialog = new dijit.TooltipDialog({
                style: 'position:absolute; width:auto;opacity:0.5;'
            });
            dojo.style(this.___dialog.connectorNode, 'display', 'none'); //矩形的箭頭
            this.___dialog.startup();
        },
        //初始化縣市
        ___initCountyLayer: function () {
            var current = this;
            this.settings.countyConfig.layer.on('mouse-over', function (evt) {
                current.___onFocusGraphic(evt, evt.graphic, current.settings.townConfig.countyNameFiled);
            });
            this.settings.countyConfig.layer.on('mouse-out', function (evt) {
                current.___loseFocusGraphic(evt, evt.graphic);
            });
            this.settings.countyConfig.layer.on('click', function (evt) {   //點選county
                if (current.settings.clickzoom) {
                    current.___clickFromLayer = true;
                    current.___lastExtent = evt.graphic._extent;
                    current.___boundarymap.setExtent(evt.graphic._extent);
                    current.settings.countyConfig.layer.hide();
                    //var cdesc = $.parserStringToObject(evt.graphic.attributes.description, "<BR>", ":");
                    current.___dispalyTown(evt.graphic);
                   
                }
            });
            $.each(this.settings.countyConfig.layer.graphics, $.proxy(function (idx, g) {
                if (g.attributes.description)
                    $.extend(g.attributes, $.parserStringToObject(g.attributes.description, "<BR>", ":"));
                current.___loseFocusGraphic({ graphic: g }, g);
            }, current));

            this.___setCustomFilleColor(this.settings.countyConfig.layer, this.___countyCustomFilleColor);
            require(["esri/graphicsUtils"], function (graphicsUtils) {
               
                //if (!this.___isCountyLayerFromKml) { //從freurelayer 似乎須一些等待時間才能做setExtent
                    setTimeout(function () {
                        current.___lastExtent = current.___fullScreenExtent = graphicsUtils.graphicsExtent(current.settings.countyConfig.layer.graphics);
                        current.___boundarymap.setExtent(current.___fullScreenExtent);
                    }, this.___isCountyLayerFromKml ? 0 : 1000);
                //}
            });
        },
        //初始化鄉鎮
        ___initTownLayer: function () {
            var current = this;
            this.settings.townConfig.layer.on('mouse-over', function (evt) {
                current.___onFocusGraphic(evt, evt.graphic, current.settings.townConfig.townNameFiled);
            });
            this.settings.townConfig.layer.on('mouse-out', function (evt) {
                current.___loseFocusGraphic(evt, evt.graphic);
            });
            this.settings.townConfig.layer.on('click', function (evt) {   //點選county
                current.___clickFromLayer = true;
                current.___lastExtent = evt.graphic._extent;
                if (current.settings.clickZoomToLeaf) {
                    current.___boundarymap.setExtent(evt.graphic._extent);
                }
                if (current.settings.clickLeafCallback) {
                    current.settings.clickLeafCallback(evt.graphic);
                }
            });
            //current.settings.rootBoundaryArea
            var removes = [];
            var noremoves = [];
            //如rootBoundaryArea非台灣，需過濾掉其他縣市鄉鎮
            $.each(this.settings.townConfig.layer.graphics, $.proxy(function (idx, g) {
                if (!g)
                    return;

                if (g.attributes.description)
                    $.extend(g.attributes, $.parserStringToObject(g.attributes.description, "<BR>", ":"));
                
                if (current.settings.TAIWAN !== current.settings.rootBoundaryArea && g.attributes[current.settings.townConfig.countyNameFiled].trim() !== current.settings.rootBoundaryArea)
                    removes.push(g);
                else
                    noremoves.push(g);
                    
            }, current));
            $.each(removes, function () {
                current.settings.townConfig.layer.remove(this);
            });
            $.each(noremoves, function () {
                current.___loseFocusGraphic({ graphic: this }, this);
            });

            this.___setCustomFilleColor(this.settings.townConfig.layer, this.___townCustomFilleColor);

            if (current.settings.TAIWAN !== current.settings.rootBoundaryArea)
                require(["esri/graphicsUtils"], function (graphicsUtils) {
                    //current.___lastExtent = current.___fullScreenExtent = graphicsUtils.graphicsExtent(noremoves);
                    //current.___boundarymap.setExtent(current.___fullScreenExtent);
                    //if (!this.___isTownLayerFromKml) { //從freurelayer 似乎須一些等待時間才能做setExtent
                        setTimeout(function () {
                            current.___lastExtent = current.___fullScreenExtent = graphicsUtils.graphicsExtent(noremoves);
                            current.___boundarymap.setExtent(current.___fullScreenExtent);
                        }, this.___isTownLayerFromKml ? 0 : 100);
                    //}
                });
        },
        //呈現鄉鎮
        ___dispalyTown: function (cg) {
            var current = this;
            current.settings.townConfig.layer.show();
            //current.___boundarymap.graphics.clear();
            $.each(current.settings.townConfig.layer.graphics, function () {
                current.settings.townConfig.layer.show();
                if (this.attributes[current.settings.townConfig.countyIdFiled] == cg.attributes[current.settings.countyConfig.countyIdFiled]) {
                    this.show();
                }
                else
                    this.hide();
            });
        },
        // focus graphic
        ___onFocusGraphic: function (evt, graphic, nf) {
            if (!this.___dialog)
                return;
            this.___boundarymap.setMapCursor("pointer");
            if(!evt.graphic.customSymbol)
                evt.graphic.symbol = this.___onFocusGraphicSymbol;
            else
                evt.graphic.symbol.outline.width = evt.graphic.symbol.outline.width * 2; //customSymbol
            evt.graphic.draw();
            
            if (nf)

                this.___dialog.setContent(evt.graphic.attributes[nf]);//evt.graphic.attributes.name);
            else
                this.___dialog.setContent(evt.graphic.attributes.name);
            if (!dojo.isIE && evt.graphic)//會造成IE mouse-out 失效
                evt.graphic.getDojoShape().moveToFront();
                
            dijit.popup.open({
                popup: this.___dialog,
                around: this.domNode,
                orient: ["below-centered", "above-centered"],
                x: evt.pageX + 3,
                y: evt.pageY
            });
        },
        // lose focus graphic
        ___loseFocusGraphic: function (evt, graphic) {
            if (!this.___dialog)
                return;

            if (!evt.graphic.customSymbol)
                evt.graphic.symbol = this.___loseFocusGraphicSymbol;
            else
                evt.graphic.symbol.outline.width = evt.graphic.symbol.outline.width / 2; //customSymbol
            evt.graphic.draw();

            this.___boundarymap.setMapCursor("default");
            dijit.popup.close(this.___dialog);
        }

    }


    $.fn[pluginName] = function (arg) {

        var args, instance;

        if (!(this.data(pluginName) instanceof pluginclass)) {

            this.data(pluginName, new pluginclass(this[0]));
        }

        instance = this.data(pluginName);


        if (typeof arg === 'undefined' || typeof arg === 'object') {

            if (typeof instance.init === 'function') {
                instance.init(arg);
            }
            this.instance = instance;
            return this;

        } else if (typeof arg === 'string' && typeof instance[arg] === 'function') {

            args = Array.prototype.slice.call(arguments, 1);

            return instance[arg].apply(instance, args);

        } else {

            $.error('Method ' + arg + ' does not exist on jQuery.' + pluginName);

        }
    };
})(jQuery);