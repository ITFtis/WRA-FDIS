
(function ($) {
    'use strict';
    $.gisdrawtool = {
        defaultSettings: {
            map: undefined,
            initEvent: undefined,
            types:undefined,
            mutiDraw: true,         //持續繪圖
            singleGraphic: false,   //只顯示一種樣式結果(切換樣式自動清除之前繪圖結果)
            colorSelector:false     //顏色樣式選擇器功能
        },
        types: { //to do func 客製化function
            FREEHAND_POLYLINE: { type: 'FREEHAND_POLYLINE', name: ' 筆 ', classid: "drawimg" },
            POINT: { type: 'POINT', name: ' 點 ', classid: "pointimg" },
            POLYLINE: { type: 'POLYLINE', name: '線', classid: "lineimg" },
            POLYGON: { type: 'POLYGON', name: '面', classid: "polygonimg" },
            CIRCLE: { type: 'Circle', name: '圓', classid: 'circleimg' },
            RECTANGLE: { type: 'RECTANGLE', name: '矩', classid: 'rectangleimg' }
        },
        event_key: {
            add_graphic: "add-graphic-event",
            graphics_change: "graphis_change",
            initUICompleted: "~initUiCompleted"//UI初始化
        }
    };
    
    var pluginName = 'gisdrawtool';
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element).addClass("gisdrawtool");
        this.settings = $.extend({}, $.gisdrawtool.defaultSettings);// {map:undefined, width:240};
        //this.dgraphics = [];

        this._mapctrl = undefined;

        this.$clear = undefined;
        this.$undo = undefined;

        this.$calresult = undefined;
    };

    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);
            var current = this;

            if (!this.settings.types) {
                this.settings.types = [];
                $.each($.gisdrawtool.types, function (f,v) {
                    current.settings.types.push({ type: v.type, name: v.name, classid: v.classid });
                });
            }
            if (this.settings.initEvent) {
                this.$element.on(this.settings.initEvent, function () {
                    if (current.isInitCompleted)
                        return;
                    current.initApi();
                });
            }
            else {
                this.initApi();
            }
        }
    };
    //載入相關API
    pluginclass.prototype.initApi = function () {
        var current = this;
        if (!this.settings.colorSelector || $.colpick) {
            current.initMap();
        }
        else {
            $('<link/>', {
                rel: 'stylesheet',
                type: 'text/css',
                href: $.AppConfigOptions.script.gispath + "/other/colpick.css"
            }).appendTo('head');
            $.getScript($.AppConfigOptions.script.gispath + "/other/colpick.js", function () {
                current.initMap();
            });
        }
    }
    //載入地圖元件
    pluginclass.prototype.initMap = function () {
        
        var current = this;
        if (whatMap(this.settings.map) === "google") {
            $.getScript($.AppConfigOptions.script.gispath + "/ext/draw/GDrawtool.js", function () {
                current._mapctrl = new GDrawtool(current, function () { current.initUI(); });
            });
        }
        else if (whatMap(this.settings.map) === "leaflet") {
            if (window.LDrawtool)
                current._mapctrl = new LDrawtool(current, function () { current.initUI(); });
            else {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/draw/LDrawtool.js", function () {
                    current._mapctrl = new LDrawtool(current, function () { current.initUI(); });
                });
            }
        }
        else {
            $.getScript($.AppConfigOptions.script.gispath + "/ext/draw/ADrawtool.js", function () {
                current._mapctrl = new ADrawtool(current, function () { current.initUI(); });
            });
        }
    };
    //初始化UI
    pluginclass.prototype.initUI = function () {

        var current = this;

        var uicontentstr = '<div>選項<hr><div class="btn-group " data-toggle="buttons">';
        $.each(this.settings.types, function (idx, val) {
            uicontentstr += '<label class="btn ' + val.classid + '" data-gtype="' + val.type + '" title="' + val.name + '">' +
                             '</label>';//  '<button type="radio" class="btn btn-primary" data-gtype="' + val.type + '" data-toggle="buttons" >' + val.name + '</button>';
        });
        uicontentstr += '</div></div>';

        uicontentstr += '<div id="draw-color-style-div" style="margin-top:.75rem;margin-bottom:1rempx;display:none">樣式<hr><div style="margin-bottom:2px;"><lable>邊線: </lable><input type="text" id="strokepicker" class="cpicker"></input></div>' +
            '<div style="display:none;"><lable>填滿: </lable><input type="text" id="fillpicker" class="cpicker"></input></div>' +
            '<div style="display:none;"><lable>透明: </lable><div id="fill-g-slider-div"></div></div></div>';

        uicontentstr += '<div style="margin-top:.75rem;margin-bottom:1rem;">操作<hr><label class="btn  undoctrl"  title="還原"></label><label class="btn btn-primary clearctrl" title="清除"></label><label class="btn btn-primary stopctrl" title="結束" ></label></div>' +
        '<div><div class="calresult" style="min-height:2rem;"></div><br><div class="ctrlinfo" strle="margin-top:.5rem;">選擇樣式選項後開始劃圖' + (!current.settings.singleGraphic ? '再次點選同一樣式後結束劃圖</div>' : '');
        current.$element.append(uicontentstr);

        /****顏色控制項*****/
        //線的顏色
        if (this.settings.colorSelector) {
            $('.cpicker:eq(0)', this.$element).colpick({
                layout: 'hex',
                submit: 0,
                //color:"#000000",
                //colorScheme: 'dark',
                onChange: function (hsb, hex, rgb, el, bySetColor) {
                    $(el).css('border-color', '#' + hex);
                    // Fill the text box just if the color was set using the picker, and not the colpickSetColor function.
                    if (!bySetColor) {
                        $(el).val('#' + hex);
                        current._mapctrl.setStrokeColor($(el).val());
                    }
                }
            }).val("#000000").keyup(function () {
                $(this).colpickSetColor(this.value);
                current._mapctrl.setStrokeColor(this.value);
            }).colpickSetColor("#000000");


            //填滿的顏色
            $('.cpicker:eq(1)', this.$element).colpick({
                layout: 'hex',
                submit: 0,
                onChange: function (hsb, hex, rgb, el, bySetColor) {
                    $(el).css('border-color', '#' + hex);
                    // Fill the text box just if the color was set using the picker, and not the colpickSetColor function.
                    if (!bySetColor) {
                        $(el).val('#' + hex);
                        current._mapctrl.setFillColor($(el).val());
                    }
                }
            }).val("#ff0000").keyup(function () {
                $(this).colpickSetColor(this.value);
                current._mapctrl.setFillColor(this.value);
            }).colpickSetColor("#ff0000");

            $(".colpick").mouseleave(function () {
                $('.cpicker', current.$element).colpickHide();
            });

            $("#fill-g-slider-div", this.$element)
            .gis_layer_opacity_slider({
                map: this.settings.map,
                range: "min",
                max: 100,
                min: 0,
                value: 60,
                setOpacity: function (_op) { current._mapctrl ? current._mapctrl.setFillOpacity(_op) : setTimeout(function () { current._mapctrl.setFillOpacity(_op) }, 1000); }
            });
            $("#draw-color-style-div", this.$element).show();
        }
        /*******************/

        current.$calresult = $(".calresult", current.$element);
        current.$undo = $('.undoctrl', current.$element);
        current.$clear = $('.clearctrl', current.$element);
        if (!current.settings.mutiDraw)
            current.$undo.hide();

        $('label[data-gtype] ', current.$element).click(function () {
            var _gType = $(this).attr('data-gtype').toUpperCase().replace(/ /g, "_");
            $("#draw-color-style-div > div", current.$element).show();
            if ("FREEHAND_POLYLINE".indexOf(_gType)>=0) 
                $("#draw-color-style-div > div:not(:eq(0))", current.$element).hide();
            else if ("POINT" == _gType)
                $("#draw-color-style-div > div:not(:eq(1))", current.$element).hide();
            $('label[data-gtype] ', current.$element).removeClass("active");
            var temp = $(this).hasClass('work');
            if (!temp && current.settings.singleGraphic) { //單一操作，每次都清空
                current.$clear.trigger("click");
            }
            $('label[data-gtype] ', current.$element).removeClass('work');
            if (temp)
                $('.stopctrl', current.$element).trigger("click");
            else {
                $(this).addClass('work');
                current._mapctrl.activate(_gType);
                $('.stopctrl', current).removeClass("unwork");
            }
        });
        current.$undo.click(function () {
            if (current.$undo.hasClass("unwork"))
                return;
            current._mapctrl.removelast();
            current.$element.trigger($.gisdrawtool.event_key.graphics_change, [current._mapctrl.currentGraphics()]);
            current.setMessage("");
        });
        current.$clear.click(function () {
            if (current.$clear.hasClass("unwork"))
                return;
            current._mapctrl.clear();
            current.$element.trigger($.gisdrawtool.event_key.graphics_change, [current._mapctrl.currentGraphics()]);
            current.setMessage("");
        });
        $('.stopctrl', current.$element).click(function () {
            current._mapctrl.stop();
            if ($('.stopctrl', current.$element).hasClass("unwork"))
                return;
            
            $('label[data-gtype] ', current.$element).removeClass('work');
            $('.stopctrl', current.$element).addClass("unwork", true);
        });
        $('.stopctrl', current.$element).addClass("unwork", true);
        current.checkButtonStatus(true);
        current.$element.trigger($.gisdrawtool.event_key.initUICompleted);
    };

    pluginclass.prototype.clear = function () {
        if (this.$clear)
            this.$clear.trigger("click");
    };
    pluginclass.prototype.setMessage = function (_msg) {
        this.$calresult.html(_msg);
    };
    pluginclass.prototype.afterAddGraphic = function (_g,_gs) {
        if (this.settings.mutiDraw) //連續操作
            this._mapctrl.activate($("label[data-gtype].work", this.$element).attr('data-gtype').toUpperCase().replace(/ /g, "_"));
        else {//單一操作
            $("label[data-gtype].work", this.$element).trigger("click");
        }
        $('.stopctrl', this.$element).removeClass("unwork");
        this.checkButtonStatus(!(_gs.length > 0));
        this.$element.trigger($.gisdrawtool.event_key.add_graphic, [_g, _gs]);
        this.$element.trigger($.gisdrawtool.event_key.graphics_change, [this._mapctrl.currentGraphics()]);
    };
    pluginclass.prototype.checkButtonStatus = function (_isEmpty) {
        if (_isEmpty) {
            this.$undo.addClass("unwork");
            this.$clear.addClass("unwork");
        }
        else {
            this.$undo.removeClass("unwork");
            this.$clear.removeClass("unwork");
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
}(jQuery));