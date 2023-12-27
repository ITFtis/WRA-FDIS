//change rain 2
var fdsfsdf = "";
(function ($) {
    'use strict';
    var pluginName = 'cctv';
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.allcctvs = [];
        this.settings = { map: undefined, autoShow: true };
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);
            this.$pinctrl = undefined;
            this.initUi();
        },
        initUi: function () {
            var that = this;

            this.$pinctrl = $('<div>').appendTo(this.$element).on($.BasePinCtrl.eventKeys.initUICompleted, function () {
                that.$pinctrl.find('.pinswitch').prop('checked', true).trigger('change');
            }).on($.BasePinCtrl.eventKeys.afterSetdata, function (e, ds) {
                that.allcctvs = ds;
                that.$element.trigger('get-data-complete', [ds]);
            }).hide(); 

            InitFmgCctv(this.$pinctrl, { filter: function () { return false;}});
        },
        shownear: function (x, y) {
            var maxshowcount = 9999;//範圍內最多限制前n數量 
            var nearmeter = 5000; //範圍內(公尺)
            $.each(this.allcctvs, function () {
                if (!this)
                    return;
                this.distance = helper.gis.pointDistance([this.X, this.Y], [x, y]);
            });
            if (this.allcctvs.length > maxshowcount) { //有限制範圍內最大數量，排序後，取第maxshowcount的距離用於決定nearmeter範圍
                this.allcctvs.sort(function (a, b) { return a.distance - b.distance });
                var _lastmeter = this.allcctvs[maxshowcount - 1].distance;
                nearmeter = nearmeter < _lastmeter ? nearmeter : _lastmeter;
            }
            this.$pinctrl.CctvCtrl('setFilter', function (d) {
                return d.distance <= nearmeter;
            });
        },
        hide: function () {
            this.$pinctrl.CctvCtrl('setFilter', function (d) {
                return false;
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