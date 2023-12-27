(function ($) {

    var Host_Site = window.location.host;

    $.BoundaryFeatureLayer = {
        defaultSettings: {
            defaultZise: { w: 250, h: 250 },
            focusFillColor: [238, 210, 250, 1],
            focusLineWidth: 1,
            focusLineColor: [255, 255, 255, 0.8],
            defaultFillColor: [238, 210, 250, 0.8],
            defaultLineWidth: 0.5,
            defaultLineColor: [255, 255, 255, 0.5],
            defaultLayerIndex:0,
            featureLayerConfig: [
                {
                    url: "https://water.tainan.gov.tw/tnwrbarcgis/rest/services/WRB/TNWRB_VectorMap/MapServer/0"+ (window.getTokenPara? getTokenPara("?"):""),
                    query: function (pg) {
                        return { where: "1=1", outFields: ["nCity", "CITYNAME"] };
                    },
                    nameField: "CITYNAME",
                    mouseenter: function () {
                    },
                    mouseleave: function () {
                    },
                    click: function (g) {
                    },
                    load: undefined
                },
                {
                    url: "https://water.tainan.gov.tw/tnwrbarcgis/rest/services/WRB/TNWRB_VectorMap/MapServer/1" + (window.getTokenPara ? getTokenPara("?") : ""),
                    query: function (pg) {
                        if (pg.attributes.nCity == 67000) {
                            return { where: "nCity='" + pg.attributes.nCity + "'", outFields: ["TOWNNAME", "nTown", "nCity", "CITYNAME"] };
                        }
                        else {
                            console.log(pg.attributes.CITYNAME);
                            return false;
                        }
                    },
                    nameField: "TOWNNAME",
                    mouseenter: function () {
                    },
                    mouseleave: function () {
                    },
                    click: function () {

                    },
                    load: function (layer, parentGriphic) {

                    }
                },
                {
                    url: "https://water.tainan.gov.tw/tnwrbarcgis/rest/services/WRB/TNWRB_VectorMap/MapServer/2" + (window.getTokenPara ? getTokenPara("?") : ""),
                    query: function (pg) {

                        return { where: "nTown='" + pg.attributes.nTown + "'", outFields: ["FULL_", "VillName", "nTown", "nCity"] };
                    },
                    nameField: "VillName",
                    mouseenter: function () {
                    },
                    mouseleave: function () {
                    },
                    click: function () {

                    }
                }]
        }
        , customFilleColor: { TownId: "", Color: "red" }
    };
    var pluginName = 'BoundaryFeatureLayer';
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = $.extend({}, $.BoundaryFeatureLayer.defaultSettings);// {map:undefined, width:240};
        this.$__MapDiv = undefined;
        this.__boundarymap = undefined;
        this.__dialog = undefined;
        this.__guid = undefined;
        this.__clickFromLayer = false;
        this.__onFocusGraphicSymbol = undefined;
        this.__loseFocusGraphicSymbol = undefined;
        this.__currentConfig = undefined;
        this.isInitCompleted = false;
        this.graphicsUtils = undefined;
        this.webMercatorUtils = undefined;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            var current = this;
            $.extend(this.settings, options);
            this.$element.empty();
            this.$element.css("height", "100%");
            this.__guid = geguid();
            this.$__MapDiv = $('<div id="map_' + this.__guid + '" style="width: 200px;height: 200px; padding: 0px; margin: 0px;"></div>');
            this.$element.append(this.$__MapDiv);
            this.$element.append('<label style="" class="btn  btn-sm prelayerincon" title="點擊或任意點擊邊界外可回上一層"><span class="glyphicon glyphicon-arrow-left" ></span></label>');

            $(".prelayerincon", this.$element).click(function () {
                current.__backToUplayer();
            });
            this.__showBackToUpLayerButton(this.settings.defaultLayerIndex !==0);

            if (current.$element.is(":visible"))
                current.__initMap();
            else {
                var timertemp = setInterval(function () {
                    if (current.$element.is(":visible")) {
                        clearInterval(timertemp);
                        current.__initMap();
                    }
                }, 500);
            }
        },
        __initMap: function () {
            this.$element.show_busyIndicator();
            var current = this;
            //主程式開始點
            require([
             "esri/map", "esri/layers/GraphicsLayer", "esri/layers/FeatureLayer", "esri/graphic", "esri/geometry/Polygon", "esri/symbols/SimpleFillSymbol",
             "esri/symbols/SimpleLineSymbol", "esri/tasks/query", "esri/geometry/webMercatorUtils", "esri/graphicsUtils", "esri/Color"
            , "dijit/TooltipDialog"], function (Map, GraphicsLayer, FeatureLayer, Graphic, Polygon, SimpleFillSymbol, SimpleLineSymbol, query, webMercatorUtils, graphicsUtils, Color) {
                current.$element.hide_busyIndicator();
                current.graphicsUtils = graphicsUtils;
                current.webMercatorUtils = webMercatorUtils;
                current.__boundarymap = new esri.Map("map_" + current.__guid, {
                    logo: false,
                    //extent: current.__fullScreenExtent,
                    autoResize: false,
                    showInfoWindowOnClick: false,
                    slider: false,
                    smartNavigation: false,

                    fadeOnZoom: true
                });

                current.__boundarymap.spatialReference = current.settings.spatialReference;
                current.__boundarymap.on('load', $.proxy(current.__boundarymapLoaded, current));
                current.__onFocusGraphicSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                                 new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new esri.Color(current.settings.focusLineColor), current.settings.focusLineWidth),
                                 new esri.Color(current.settings.focusFillColor)
                              );
                current.__loseFocusGraphicSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                            new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new esri.Color(current.settings.defaultLineColor), current.settings.defaultLineWidth),
                            new esri.Color(current.settings.defaultFillColor)
                        );

                current.__currentConfig = current.settings.featureLayerConfig[current.settings.defaultLayerIndex];
                current.__initCurrentLayer();

                setTimeout(function () { //要用timer，不然有時current.$element.parents(".jsPanel").length===0
                    //resize
                    if (current.$element.parents(".jsPanel").length > 0) {
                        $(current.$element.parents(".jsPanel")[0]).on('resizestop', function () {
                            current.__resizeMap();
                        });
                    }
                });
            });
        },
        __initCurrentLayer: function (parentGriphic) {
            var current = this;
            var clayer = undefined;
            if (parentGriphic) {
                var pname = current.__getParentConfig(current.__currentConfig) ? parentGriphic.attributes[current.__getParentConfig(current.__currentConfig).nameField] : undefined;
                if (pname && current.__currentConfig.layers) {
                    $.each(current.__currentConfig.layers, function () {
                        if (this.id === pname) {
                            clayer = this;
                            console.log("from cache layer ...." + pname);
                            return false;
                        }
                    });

                }
            }
            if (!clayer) {
                current.$element.show_busyIndicator();
                if (!current.__currentConfig.layers)
                    current.__currentConfig.layers = [];
                clayer = new esri.layers.GraphicsLayer(pname ? { id: pname } : {});
                current.__currentConfig.layers.push(clayer);
                current.__boundarymap.addLayer(clayer);

                var _qpara = current.__currentConfig.query(parentGriphic);
                var _query = new esri.tasks.Query();
                _query.where = _qpara.where;
                _query.outFields = _qpara.outFields;
                var featrue = new esri.layers.FeatureLayer(current.__currentConfig.url, { outFields: ["*"], mode: esri.layers.FeatureLayer.MODE_SNAPSHOT });
                featrue.queryFeatures(_query, function (featureSet) {

                    clayer.hide();
                    //畫boundary
                    $.each(featureSet.features, function () {
                        current.__boundarymap.spatialReference = this.geometry.spatialReference; //定義要這邊給
                        var g = new esri.Graphic(this.geometry, this.symbol, this.attributes);
                        clayer.add(g);
                        current.__loseFocusGraphic({ graphic: g }, g);
                    });
                    clayer.extent = current.graphicsUtils.graphicsExtent(clayer.graphics);

                    clayer.on('mouse-over', function (evt) {
                        if (current.__currentConfig.mouseenter)
                            current.__currentConfig.mouseenter(evt.graphic);
                        current.__onFocusGraphic(evt, evt.graphic, current.__currentConfig.nameField);
                    });
                    clayer.on('mouse-out', function (evt) {
                        if (current.__currentConfig.mouseleave)
                            current.__currentConfig.mouseleave(evt.graphic);
                        current.__loseFocusGraphic(evt, evt.graphic);
                    });
                    clayer.on('click', function (evt) {   //點選county
                        current.__clickFromLayer = true;
                        var _childconfig = current.__getChildConfig(current.__currentConfig);
                        if (current.__currentConfig.click)
                            current.__currentConfig.click(evt.graphic);
                        if (_childconfig && _childconfig.query(evt.graphic)) {

                            clayer.hide();
                            current.__currentConfig = _childconfig;
                            current.__initCurrentLayer(evt.graphic);
                            current.__showBackToUpLayerButton(true);
                        }
                    });
                    current.__currentConfig.currentlayer = clayer;
                    current.__resizeMap(true);
                    if (current.__currentConfig.load)
                        current.__currentConfig.load(clayer, parentGriphic);
                    if (current.__currentConfig.focus)
                        current.__currentConfig.focus();
                });
            }
            else {
                current.__currentConfig.currentlayer = clayer;
                current.__resizeMap(true);
                if (current.__currentConfig.load)
                    current.__currentConfig.load(clayer, parentGriphic);
                if (current.__currentConfig.focus)
                    current.__currentConfig.focus();
            }


        },
        __resizeMap: function (hidebusy) {
            if (!this.$element.is(":visible"))
                return;
            var current = this;
            current.$__MapDiv.width("100%").height("100%");
            current.__boundarymap.resize(true);

            current.__boundarymap.setExtent(current.__currentConfig.currentlayer.extent).then(function () {
                current.__currentConfig.currentlayer.show();
                if (hidebusy)
                    setTimeout(function () {
                        current.$element.hide_busyIndicator();
                    }, 100);
            });
        },
        __showBackToUpLayerButton: function (show) {
            if (show)
                $(".prelayerincon", this.$element).show();
            else
                $(".prelayerincon", this.$element).hide();
        },
        //回上一層
        __backToUplayer: function () {
            var current = this;
            var _pconfig = this.__getParentConfig(this.__currentConfig);
            if (_pconfig) {
                if (_pconfig.focus)
                    _pconfig.focus();
                this.$element.show_busyIndicator();
                this.__currentConfig.currentlayer.hide();
                this.__currentConfig = _pconfig;
                if (_pconfig.currentlayer) {
                    this.__boundarymap.setExtent(_pconfig.currentlayer.extent).then(function () {
                        current.__currentConfig.currentlayer.show();
                        setTimeout(function () {
                            current.$element.hide_busyIndicator();
                        }, 100);
                    });
                } else {
                    current.$element.hide_busyIndicator();
                    current.__initCurrentLayer();
                }

                if (this.settings.featureLayerConfig[0].url === this.__currentConfig.url)
                    this.__showBackToUpLayerButton(false);
            }
        },
        //map load 初始參數
        __boundarymapLoaded: function (evt) {
            var current = this;
            this.__boundarymap.disableDoubleClickZoom();
            this.__boundarymap.disablePan();
            this.__boundarymap.disableScrollWheelZoom();

            this.__boundarymap.on('click', function (evt) { //boundarymap click 全景，clear Town
                if (!current.__clickFromLayer) { //show 回上一層
                    current.__backToUplayer();
                    console.log("map click");
                }
                current.__clickFromLayer = false;

            });

            this.__dialog = new dijit.TooltipDialog({
                style: 'position:absolute; width:auto;opacity:0.5;'
            });
            dojo.style(this.__dialog.connectorNode, 'display', 'none'); //矩形的箭頭
            this.__dialog.startup();
        },
        __getChildConfig: function (config) {
            var current = this;
            var cconfig = undefined;
            $.each(current.settings.featureLayerConfig, function (idx) {
                if (this.url === config.url) {
                    if (idx != current.settings.featureLayerConfig.length - 1)
                        cconfig = current.settings.featureLayerConfig[idx + 1];
                    return false;
                }
            });
            return cconfig;
        },
        __getParentConfig: function (config) {
            var current = this;
            var pconfig = undefined;
            $.each(current.settings.featureLayerConfig, function (idx) {
                if (this.url === config.url) {
                    if (idx != 0)
                        pconfig = current.settings.featureLayerConfig[idx - 1];
                    return false;
                }
            });
            return pconfig;
        },
        // focus graphic
        __onFocusGraphic: function (evt, graphic, nf) {
            if (!this.__dialog)
                return;
            this.__boundarymap.setMapCursor("pointer");
            if (!evt.graphic.customSymbol)
                evt.graphic.symbol = this.__onFocusGraphicSymbol;
            else
                evt.graphic.symbol.outline.width = evt.graphic.symbol.outline.width * 2; //customSymbol
            evt.graphic.draw();

            if (nf)
                this.__dialog.setContent(evt.graphic.attributes[nf]);//evt.graphic.attributes.name);
            else
                this.__dialog.setContent(evt.graphic.attributes.name);
            if (!dojo.isIE && evt.graphic)//會造成IE mouse-out 失效
                evt.graphic.getDojoShape().moveToFront();

            dijit.popup.open({
                popup: this.__dialog,
                around: this.domNode,
                orient: ["below-centered", "above-centered"],
                x: evt.pageX + 3,
                y: evt.pageY
            });
        },
        // lose focus graphic
        __loseFocusGraphic: function (evt, graphic) {
            if (!this.__dialog)
                return;

            if (!evt.graphic.customSymbol) {
                if (evt.graphic.customsymbol)
                    evt.graphic.symbol = evt.graphic.customsymbol; //外部警戒資訊用
                else
                    evt.graphic.symbol = this.__loseFocusGraphicSymbol;
            }
            else
                evt.graphic.symbol.outline.width = evt.graphic.symbol.outline.width / 2; //customSymbol
            evt.graphic.draw();

            this.__boundarymap.setMapCursor("default");
            dijit.popup.close(this.__dialog);
        }

    };


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