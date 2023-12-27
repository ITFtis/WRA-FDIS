//change rain 2
var fdsfsdf = "";
(function ($) {
    'use strict';
    var pluginName = 'rain';
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = { map: undefined, autoShow: true };
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);
            var that = this;
            if (this.settings.autoShow)
                that.initUi();
            else
                this.$element.on($.menuctrl.eventKeys.popu_init_before, function () {
                    that.initUi();
                });
        },
        initUi: function () {
            var that = this;

            var hasFirstRepaintPinCompleted = false;
            var $pinctrl = $('<div>').appendTo(this.$element).on($.BasePinCtrl.eventKeys.initUICompleted, function () {
                $pinctrl.find('.pinswitch').prop('checked', true).trigger('change');
                $pinctrl.find('.pinlist').prop('checked', true).trigger('change');
                $pinctrl.find('.ctrl').hide();
                $filterContainer.insertBefore(that.$element.find('.legend'));
                $('.search', that.$element).appendTo($('<div class="col-4">').appendTo($filterContainer));
            }).on($.BasePinCtrl.eventKeys.afterSetdata, function (e, ds, dds) {
                that.$element.trigger('get-data-complete', [ds]);
            });

            var $filterContainer = $('<div class="row filter-container">').appendTo(this.$element);
            var $basinSelect = $('<div class="col-4">').appendTo($filterContainer).basinSelect().on($.basinSelect.eventKeys.change, function () {
                setFilter();
            });

            var $countySelect = $('<div class="col-4">').appendTo($filterContainer).countySelect({ containerTW: true, autoFitBounds:false, showLabel: false}).on($.countySelect.eventKeys.change, function () {
                setFilter();
            });

            var filtercache = "-1_-1";
            var setFilter = function () {
                helper.misc.showBusyIndicator(that.$element);
                setTimeout(function () {
                    var _county = $countySelect.countySelect('getCountyName');
                    _county = _county.replace('台', '臺');
                    if ($countySelect.countySelect('getCounty') == 0)
                        _county = '-1';
                    var _basin =  $basinSelect.basinSelect('value');
                    if (filtercache != _county + "_" + _basin) {
                        filtercache = _county + "_" + _basin;
                        $pinctrl.RainCtrl('setFilter', function (d) {
                            return (_basin < 0 ? true : d.BASIN_NO == _basin) && (_county == '-1' ? true : d.ADDR_C.indexOf(_county) >= 0);
                        });
                    }
                    helper.misc.hideBusyIndicator(that.$element);
                }, 10);
            }

            //var $listcontainer = $('<div class="rain-list-container  meter-list-container">').appendTo(this.$element);
            InitWraRain($pinctrl, { pinClick: function (d) { that.$element.trigger('pin-click', [d]); } });
            //$pinctrl.on($.BasePinCtrl.eventKeys.repaintPinCompleted, function () {
            //    $('.search >input').attr('placeholder', '關鍵字搜尋');
            //})
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