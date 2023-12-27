(function ($) {
    'use strict';
    window.boundaryMap = {
        event: {
            init_map_completed: "init_map_completed",
            load_boundary_completed: "load_boundary_completed",
            boundary_click: "boundary_click"
    }};
    var pluginName = 'BoundaryMap';
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = {};//$.extend({}, $.BoundaryLayer.defaultSettings);// {map:undefined, width:240};
        this.whatmap = "google";
        this.map = undefined; // 目前API自行產生的地圖
        this.$_boundary_name_txt = undefined;
        this._mapctrl = undefined;
        this.current_boundary_options = undefined;
        this._is_init_map_completed = false;
        this._current_boundary_ctrl = undefined;//Boundary.js
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            
            var current = this;
            $.extend(this.settings, options);
            this.current_boundary_options = this.settings.boundary ? this.settings.boundary : window.boundary.data.County;
            this.$element.addClass("boundary-map");
            if (typeof this.settings.map === "string")
                this.whatmap = this.settings.map;
            else
                this.whatmap = whatMap(this.settings.map);
            if (this.whatmap === "google") {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/boundary/GBoundaryMap.js", function () {
                    current._mapctrl = new GBoundaryMap(current, function () { current._checkInitMap(); });
                });
            }
            else if (this.whatmap === "leaflet") {
                if (window.LBoundaryMap) {
                    current._mapctrl = new LBoundaryMap(current, function () { current._checkInitMap(); });
                }
                else {
                    $.getScript($.AppConfigOptions.script.gispath + "/ext/boundary/LBoundaryMap.js", function () {
                        current._mapctrl = new LBoundaryMap(current, function () { current._checkInitMap(); });
                    });
                }
            }
            else {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/boundary/ABoundaryMap.js", function () {
                    current._mapctrl = new ABoundaryMap(current, function () { current._checkInitMap(); });
                });
            }
            this.$element.on("map-click", function (sdas, evt) {
                current.$element.trigger(boundaryMap.event.boundary_click, null);
            });
        },
        //設定地圖邊界圖層
        setBoundary: function (_boundary_options, _pant_completed_callback) {
            var current = this;
            if (typeof _boundary_options === "string") {
                this.current_boundary_options = $.extend(true, { data: _boundary_options }, boundary.polygonOptions);
            }
            else {
                this.current_boundary_options = $.extend(true,JSON.parse(JSON.stringify(boundary.polygonOptions)), _boundary_options);
            }
            //click
            this.current_boundary_options.clickOption = this.current_boundary_options.click;
            this.current_boundary_options.click = function (_data, _geometry, _evt) {
                current.$element.trigger(boundaryMap.event.boundary_click,[ _data, _geometry, _evt]);
                if (current.current_boundary_options.clickOption) current.current_boundary_options.clickOption(_data, _geometry, _evt);
            }

            this.current_boundary_options.style.mouseOver.enable = true;
            //mouse over out
            this.current_boundary_options.mouseOverOption = this.current_boundary_options.mouseOver; 
            this.current_boundary_options.mouseOutOption = this.current_boundary_options.mouseOut;
            this.current_boundary_options.mouseOver = function (_data, _g, _evt) {
                current.$_boundary_name_txt.html(_data.Name); //取代原mouseOver以顯示區域名稱
                if (current.current_boundary_options.mouseOutOption) current.current_boundary_options.mouseOutOption(_data, _g, _evt);
            };
            this.current_boundary_options.mouseOut = function (_data, _g, _evt) {
                current.$_boundary_name_txt.html("");
                if (current.current_boundary_options.mouseOverOption) current.current_boundary_options.mouseOverOption(_data, _g, _evt);
            };

            if (this._is_init_map_completed) {
                this.current_boundary_options.map = this.map;

                var oldBoundaryCtrl = undefined;
                if (this._current_boundary_ctrl)
                    oldBoundaryCtrl = this._current_boundary_ctrl;
                    //this._current_boundary_ctrl.clear();
                this._current_boundary_ctrl = new window.boundary.PolygonBoundary(this.current_boundary_options, function () {
                    window.boundary.helper.GetBoundaryDataRect(current.current_boundary_options.data,
                        current.current_boundary_options.ids, function (rect) {
                            if (whatMap(current.map) == "google" || whatMap(current.map) == "leaflet")
                                current.fitBounds(rect); //依autoFitBounds為準

                        current.$element.trigger(boundaryMap.event.load_boundary_completed);
                        current.$element.hide_busyIndicator();
                        if (oldBoundaryCtrl) {
                            oldBoundaryCtrl.clear();
                        }
                    });
                });
            }
        },
        //取map物件
        getMap: function () {
            if (this._is_init_map_completed)
                return this.map;
            else {
                console.log("BoundaryMap尚未初始化!");
                return undefined;
            }
        },
        //fit視窗
        fitBounds: function (rect) {
            this._mapctrl.fitBounds(rect);
        },

        //先偵測視窗在visible及height>0下再呼叫_initMap
        _checkInitMap : function(){
            var current = this;
            var _timerflag = setInterval(function () {
                //var _visible = current.$element.is(":visible") //visual stadio 會一直 0x800a139e - JavaScript 執行階段錯誤: SyntaxError;
                var _h = current.$element.height();
                //console.log("current.$element.width():" + _h);
                if (_h != 0){// && _visible) {
                    clearInterval(_timerflag);
                    current._initMap();
                    current.$element.trigger(boundaryMap.event.init_map_completed);
                    current._is_init_map_completed = true;
                    current.setBoundary(current.current_boundary_options);
                    current.$element.append("<label class='boundary-name-txt' ><label>");
                    current.$_boundary_name_txt = current.$element.find(".boundary-name-txt");
                }
            }, 500);
        },
        //初始Map
        _initMap: function () {
            var current = this;
            this.map = current._mapctrl.initMap();

            var resizeflag = undefined;
            current.$element.listenResize(function () {
                clearTimeout(resizeflag);
                resizeflag = setTimeout(function () {
                    current._mapctrl.resize();
                },200);
            });
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
