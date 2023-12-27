if (!$.BasePinCtrl) {
    alert("未引用(PolygonCtrl)BasePinCtrl");
}

(function ($) {

    $.PolygonCtrl = {

        defaultSettings: {
            name: "PolygonCtrl",
            layerid: "PolygonCtrl_", map: undefined,

            stTitle: function (data) { return data[0] },
            useLabel: true,
            useList: true,
            useCardview: true,
            useSearch: true,
            useSilder: false,
            styleSelector:  false,//顯示poly的邊線、線寬、填滿編輯
            polyStyles: [{ name: '圖例', strokeColor: '#FF0000', strokeOpacity: 1, strokeWeight: 1, fillColor: '#FF0000', fillOpacity: .7, classes: 'water_normal' }],
            legendIcons: [],
            infoFields: [],
            checkDataStatus: function (data, index) {return  this.settings.polyStyles.length > 0 ? this.settings.polyStyles[0] : $.PolygonCtrl.defaultSettings.polyStyles[0];},
            baseInfoMerge: $.BasePinCtrl.defaultSettings.baseInfoMerge,
            transformData: $.BasePinCtrl.defaultSettings.transformData,
            pinInfoContent: function (data, infofields) { return $.BasePinCtrl.defaultSettings.pinInfoContent.call(this, data, infofields); },
            loadBase: undefined,
            loadInfo: undefined,
            type: $.BasePinCtrl.type.polygon
        },
        defaultData: { CName: '', Datetime: undefined, WaterLevel: -998, Voltage: undefined, X: 0, Y: 0 },
        eventKeys: { opacity_change: "opacity_change" }
    }
    var pluginName = 'PolygonCtrl'
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = $.extend({}, $.PolygonCtrl.defaultSettings);// {map:undefined, width:240};
        //this.settings.legendIcons = this.settings.polyStyles;

        this.__pinctrl = undefined;
        this.__baseData = undefined;
        this.__infoData = undefined;
        this.currentDatetime = new Date();

        this.isInitCompleted = false;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);
            if (!this.settings.legendIcons || this.settings.legendIcons.length==0)
                this.settings.legendIcons = this.settings.polyStyles;
            var current = this;
            //this.__pinctrl = $("#" + this.$element[0].id).BasePinCtrl(this.settings).on($.BasePinCtrl.eventKeys.initLayer, function (ss) {
            this.__pinctrl = this.$element.BasePinCtrl(this.settings).on($.BasePinCtrl.eventKeys.initLayer, function (ss) {
                current.isInitCompleted = true;
                current.reload(current.currentDatetime);
            });
            this.$element.on($.BasePinCtrl.eventKeys.displayLayer, function (evt, _display) {
                current.__initCtrlStryleUI(_display);
            });
        },
        reload: function (dt) { //觸發loadBase , loadInfo
            var current = this;
            this.currentDatetime = dt;
            if (!this.isInitCompleted)
                return;
            $.BasePinCtrl.helper.reload.call(this, dt);
        },
        setFilter: function (filter) {
            this.__pinctrl.instance.setFilter(filter);
        },
        setOpacity: function (_opacity) {
            this.__pinctrl.instance.setOpacity(_opacity);
            this.$element.trigger($.PolygonCtrl.eventKeys.opacity_change, [_opacity]);
        },
        fitBounds: function () {
            this.__pinctrl.instance.fitBounds();
        },
        //setBoundary: function (inBoundary) {
        //    this.__pinctrl.instance.setBoundary(inBoundary);
        //},
        __loadBaseCompleted: function (results) {
            this.__baseData = results;
            this.refreshData();
        },
        __loadInfoCompleted: function (results) {
            this.__infoData = results;
            this.refreshData();
        },
        refreshData: function () {
            var current = this;
            if (this.__baseData && this.__infoData) {
                current.__pinctrl.instance.setData(this.settings.transformData(this.__baseData, this.__infoData));
            }
        },
        setData: function (datas) {
            this.__pinctrl.instance.setData(datas);
        },
        __initCtrlStryleUI: function (_display) {
            var current = this;
            var changeStyle = function (f, v) {
                current.settings.polyStyles[0][f] = v;
                //current.settings.legendIcons 及current.__pinctrl.instance.setting因同一參考，所以上述給值會一併改變值;
                current.refreshData();
                current.__pinctrl.instance.repaintLegendUI(current.settings.polyStyles);
            }
            
            var $_stylectrl = this.$element.find('.poly-style');
            var $slider = this.$element.find('.opacity-slider');
            if ($_stylectrl.length == 0 && this.settings.styleSelector) {
                if (this.settings.polyStyles.length > 1) {
                    alert("styleSelector僅能有一個polyStyleslength==1");
                }
                var _pstyle = this.settings.polyStyles[0];
                $_stylectrl = $('<div class="style-ctrl">').appendTo(current.$element);
                //顏色
                var $_c = $('<div class="poly-style" ><div ><lable>邊線:</lable><input type="text" class="strokepicker cpicker"></input></div>' +
                    '<div class="fill-ctrl"><lable>填滿:</lable><input type="text" class="fillpicker cpicker"></input></div>' +
                    '<div ><lable>線寬:</lable><select></select></div></div>').appendTo($_stylectrl);

                var $_lwselect = $_c.find('select')
                for (var i = 0; i < 11; i++)
                    $('<option value="' + i + '">' + i + '</option>').appendTo($_lwselect);
                $_lwselect.val(_pstyle.strokeWeight);
                $_lwselect.on('change', function () {
                    var v = $_lwselect.val();
                    changeStyle('strokeWeight', v);
                });

                //線的顏色
                $('.strokepicker', $_c).colpick({
                    layout: 'hex',
                    submit: 0,
                    onChange: function (hsb, hex, rgb, el, bySetColor) {
                        $(el).css('border-color', '#' + hex);
                        // Fill the text box just if the color was set using the picker, and not the colpickSetColor function.
                        if (!bySetColor) {
                            var strokecolor = '#' + hex;
                            $(el).val(strokecolor);
                            changeStyle('strokeColor', strokecolor);
                        }
                    }
                }).val(_pstyle.strokeColor).keyup(function () {
                    var strokecolor = this.value;
                    $(this).colpickSetColor(strokecolor);
                    changeStyle('strokeColor', strokecolor);
                }).colpickSetColor(_pstyle.strokeColor);
                //填滿的顏色
                $('.fill-ctrl', $_stylectrl).hide();
                //if (this.settings.type == $.BasePinCtrl.type.polygon) {
                $('.fillpicker', $_stylectrl).colpick({
                        layout: 'hex',
                        submit: 0,
                        onChange: function (hsb, hex, rgb, el, bySetColor) {
                            $(el).css('border-color', '#' + hex);
                            // Fill the text box just if the color was set using the picker, and not the colpickSetColor function.
                            if (!bySetColor) {
                                var fillcolor = '#' + hex;
                                $(el).val(fillcolor);
                                changeStyle('fillColor', fillcolor);

                            }
                        }
                    }).val(_pstyle.fillColor).keyup(function () {
                        var fillcolor = this.value;
                        $(this).colpickSetColor(fillcolor);
                        changeStyle('fillColor', fillcolor);
                    }).colpickSetColor(_pstyle.fillColor);//.show();

                    //無填顏色
                    if (_pstyle.fillOpacity != 0)
                        $('.fill-ctrl', $_stylectrl).show();

                $(".colpick").mouseleave(function (e) {
                    $('.cpicker', current.$element).colpickHide();
                });
            }
            if ($slider.length == 0 && this.settings.useSilder) {
                
                    $slider = $('<div class="col-xs-12"><div class="opacity-slider" title="透明度"></div></div>').appendTo(this.$element).find('.opacity-slider')
                        .gis_layer_opacity_slider({
                            map: this.settings.map,
                            range: "min",
                            max: 100,
                            min: 5,
                            value: 90,
                            setOpacity: $.proxy(current.setOpacity, current)// function (_op) { current.setOpacity(_op); }
                        });
                
            }
            if (_display) {
                if ($_stylectrl) $_stylectrl.show();
                if ($slider) $slider.show();
            }
            else {
                if ($_stylectrl) $_stylectrl.hide();
                if ($slider) $slider.hide();
            }
        }
    }


    $.fn[pluginName] = function (arg) {

        var args, instance;

        if (!(this.data(pluginName) instanceof pluginclass)) {

            this.data(pluginName, new pluginclass(this[0]));
        }

        instance = this.data(pluginName);
        if (!instance)
            console.log("請確認selector(" + this.selector + ")是否有問題");


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