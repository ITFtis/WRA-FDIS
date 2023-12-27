/*****Coordinate Info *****/
(function ($) {
    'use strict';
    $.CoordinateInfo = {
        display: { WGS84: "WGS84", TWD97: "TWD97", WGS84_TWD97: "WGS84_TWD97" },
        defaultSettings: { map: undefined, width: 376, display: "WGS84", content_padding: 5, initEvent: null },
        eventKeys: {
            initUICompleted: "~initUiCompleted",//UI初始化，尚未抓資料,
        }
    }
    var pluginName = 'CoordinateInfo'
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = $.extend({}, $.CoordinateInfo.defaultSettings);// {map:undefined, width:240};

        this.$___displayElement = undefined;
        this.arc_webMercatorUtils = undefined;
        //Expose public methods
        //this.arc_WebTiledLayer = undefined;
        this.isInitCompleted = false;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);
            var current = this;
            if (this.settings.initEvent) {
                this.$element.on(this.settings.initEvent, function () {
                    if (current.isInitCompleted)
                        return;
                    current.initUI();
                });
            }
            else
                this.initUI();
        },
        initUI: function () {
            var current = this;
            var uicontentstr = ' <div class="coordinateInfoPanel" ><div  ><table ><tr><td id="_wgs84info"></td><td id="_scaleinfo" rowspan="2" valign="middle"></td></tr><tr><td id="_twd97info"></td></tr></table></div></div>';

            //$(this).append(uicontentstr);

            this.$element.append(uicontentstr);

            $("div:eq(0)", this.$element).width(this.settings.width);

            this.$___displayElement = $("> div > div", this.$element);
            this.$___displayElement.css("padding", this.settings.content_padding + "px");

            if (whatMap(current.settings.map) === "google") {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/info/GCoordinateInfo.js", function () {
                    current._mapctrl = new GCoordinateInfo(current, jQuery.proxy(current._InitCompleted, current) );
                });
            }
            else if (whatMap(current.settings.map) === "leaflet") {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/info/LCoordinateInfo.js", function () {
                    current._mapctrl = new LCoordinateInfo(current, jQuery.proxy(current._InitCompleted, current));
                });
            }
            else {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/info/ACoordinateInfo.js", function () {
                    current._mapctrl = new ACoordinateInfo(current, jQuery.proxy(current._InitCompleted, current));
                });
            }

        },
        _InitCompleted: function () {
            this.isInitCompleted = true;
            this.$element.trigger($.CoordinateInfo.eventKeys.initUICompleted);
        },
        showCoordinates: function (_mp, _scale){// evt) {
            var current = this;
           
            var isShowLabel = this.settings.display == $.CoordinateInfo.display.WGS84_TWD97;
            if (this.settings.display.indexOf($.CoordinateInfo.display.WGS84) >= 0)    //WGS84
                $("#_wgs84info", this.$___displayElement).html((isShowLabel ? "WGS84: " : "") + _mp.x.toFixed(5) + ", " + _mp.y.toFixed(5));

            if (_scale)
                $("#_scaleinfo", this.$___displayElement).html("比例尺:1/" + _scale.toFixed(0)); //Zoom
            else
                $("#_scaleinfo", this.$___displayElement).hide();

            if (this.settings.display.indexOf($.CoordinateInfo.display.TWD97) >= 0) {  //TWD97
                var twd97 = $.WGS84ToTWD97(_mp.x, _mp.y);
                $("#_twd97info", this.$___displayElement).html((isShowLabel ? "TWD97: " : "") + twd97.x.toFixed(0) + ", " + twd97.y.toFixed(0));
            }

            //setTimeout(function () {
            //    current.$___displayElement.css("border-radius", current.$___displayElement.height() + "px");
            //}, 10);
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