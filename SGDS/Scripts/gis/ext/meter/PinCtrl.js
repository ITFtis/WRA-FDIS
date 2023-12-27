if (!$.BasePinCtrl) {
    alert("未引用(PinCtrl)BasePinCtrl");
}

(function ($) {

    $.PinCtrl = {

        defaultSettings: {
            name: "PinCtrl",
            layerid: "PinCtrl_", map: undefined,

            stTitle: function (data) { return data[0] },
            useLabel: true,
            useList: true,
            useCardview: true,
            useSearch: true,
            pinsize: { x: 12, y: 12, minx: 8, maxx: 32, miny: 10, maxy: 32, step: 4, anchor: "cneter" }, //anchor cneter、bottoms、left也可以bottoms_left
            /** { 'name': '一級', 'url': 'Images/水位站-r.png',classes:'' }**/
            legendIcons: [],
            infoFields: [],
            checkDataStatus: function (data, index) { return this.settings.legendIcons.length > 0 ? this.settings.legendIcons[0] : $.BasePinCtrl.pinIcons.defaultPin; },
            loadBase: function (callback) { },
            loadInfo: function (dt,callback) { },
            baseInfoMerge: $.BasePinCtrl.defaultSettings.baseInfoMerge,
            transformData: $.BasePinCtrl.defaultSettings.transformData,
            //transformData: function (_base, _info) {
            //    var _that = this;
            //    if (this.baseInfoMerge && this.baseInfoMerge.basekey && _base && _base.length > 0) {
            //        var ps = this.baseInfoMerge;
            //        var rs = JSON.parse(JSON.stringify(_base));

            //        $.each(rs, function () {
            //            var b = this;
            //            var bk = this[ps.basekey];
            //            if (_info) {
            //                var ifs = $.grep(_info, function (s) {
            //                    return bk == s[ps.infokey];
            //                });
            //                if (ifs.length > 0)
            //                    $.extend(b, ifs[0]);
            //            }
            //            if (ps.xfield)
            //                b.X = helper.misc.getValueByPath(b, ps.xfield);
            //            if (ps.yfield)
            //                b.Y = helper.misc.getValueByPath(b, ps.yfield);
            //            if (ps.aftermerge)
            //                ps.aftermerge.call(_that, b);
            //        });
            //        return rs;
            //    }
            //    else
            //        return _base && _base.length > 0 ? _base : _info;
            //},
            pinInfoContent: function (data, infofields) { return $.BasePinCtrl.defaultSettings.pinInfoContent.call(this, data, infofields); },
            loadBase: undefined,
            loadInfo: undefined
        },
        defaultData: { CName: '', Datetime: undefined, WaterLevel: -998, Voltage: undefined, X: 0, Y: 0 }
    }
    var pluginName = 'PinCtrl'
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = $.extend({}, $.PinCtrl.defaultSettings);// {map:undefined, width:240};
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
            var current = this;
            //this.__pinctrl = $("#" + this.$element[0].id).BasePinCtrl(this.settings).on($.BasePinCtrl.eventKeys.initLayer, function (ss) {
            this.__pinctrl = this.$element.BasePinCtrl(this.settings).on($.BasePinCtrl.eventKeys.initLayer, function (ss) {
                current.isInitCompleted = true;
                current.reload(current.currentDatetime);
            });

        },
        reload: function (dt) { //觸發loadBase , loadInfo
            var current = this;
            this.currentDatetime = this.__pinctrl.instance.currentDatetime = dt;
            if (!this.isInitCompleted)
                return;
            $.BasePinCtrl.helper.reload.call(this, dt);
        },
        add: function (_base, _info) {
            var _data = this.settings.transformData(_base ? [_base] : undefined, _info ? [_info] : undefined)[0];
            this.__pinctrl.instance.add(_data);
        },
        remove: function (_data) { //transformData後的data
            this.__pinctrl.instance.remove(_data);
        },
        setFilter: function (filter) {
            this.__pinctrl.instance.setFilter(filter);
        },
        fitBounds: function (options) {
            this.__pinctrl.instance.fitBounds(options);
        },
        setBoundary: function (inBoundary) {
            this.__pinctrl.instance.setBoundary(inBoundary);
        },
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