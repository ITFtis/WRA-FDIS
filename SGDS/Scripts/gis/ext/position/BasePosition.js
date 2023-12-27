(function ($) {
    'use strict';
    var pluginName = 'BasePosition'
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this._mapctrl = undefined;
        this.settings = { map: undefined, server: undefined };
        this.isInitCompleted = false;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);
            var current = this;
            if (whatMap(current.settings.map) === "google") {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/position/GBasePosition.js", function () {
                    current._mapctrl = new GBasePosition(current, function () { });
                });
            }
            else if (whatMap(current.settings.map) === "leaflet") {
                if (window.LBasePosition) {
                    current._mapctrl = new LBasePosition(current, function () { });
                }
                else {
                    $.getScript($.AppConfigOptions.script.gispath + "/ext/position/LBasePosition.js", function () {
                        current._mapctrl = new LBasePosition(current, function () { });
                    });
                }
            }
            else {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/position/ABasePosition.js", function () {
                    current._mapctrl = new ABasePosition(current, function () { });
                });
            }
            this.initUI();
        },
        initUI: function () {
            var current = this;
            //var $_form = $('<form></form>').appendTo(this.$element);
            $('<div class="form-group wgs84Div"><label>WGS84</label><div><input class="form-control" style="width:calc(50% - 35px );display: inline;" placeholder="經度"></input><input class="form-control" style="width:calc(50% - 35px );display: inline;margin-left:8px;" placeholder="緯度"></input><span class="btn btn-success" style="margin:-4px 0 0 4px;">確定</span></div></div>').appendTo(this.$element);
            $('<div class="form-group twd97Div"><label>TWD97</label><div><input class="form-control" style="width:calc(50% - 35px );display: inline;" placeholder="X"></input><input class="form-control" style="width:calc(50% - 35px );display: inline;margin-left:8px;" placeholder="Y"></input><span class="btn btn-success" style="margin:-4px 0 0 4px;">確定</span></div></div>').appendTo(this.$element);
            
            $('<div class="form-group btn btn-default pull-right pull-xs-right">清除定位資料</div>').appendTo(this.$element).click(function () {
                current.$element.find("input").val("");
                current._mapctrl.clear();
            });
            //this.$element.find(".wgs84Div input:eq(0)").val(121);
            //this.$element.find(".wgs84Div input:eq(1)").val(23);
            this.$element.find(".wgs84Div .btn").click(function () {
                var x = current.$element.find(".wgs84Div input:eq(0)").val();
                var y = current.$element.find(".wgs84Div input:eq(1)").val();
                current._mapctrl.position(x,y);
            });
            this.$element.find(".twd97Div .btn").click(function () {
                var x = current.$element.find(".twd97Div input:eq(0)").val();
                var y = current.$element.find(".twd97Div input:eq(1)").val();
                var t = helper.gis.TWD97ToWGS84(x, y);
                current._mapctrl.position(t.lon, t.lat);
            });
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