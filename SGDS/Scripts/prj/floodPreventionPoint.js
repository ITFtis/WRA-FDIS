//防汛點位
(function ($) {
    'use strict';
    var pluginName = 'floodPreventionPoint';

    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = { map:undefined };

        this.$countySelect = undefined;

        this.$_護理機構 = undefined;
        this.$_兒少安養機構 = undefined;
        this.$_老年福利機構 = undefined;
        this.$_身心障礙福利機構 = undefined;

        this.$_區排水位 = undefined;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {

            var current = this;

            $.extend(this.settings, options);
            current.initUi();

        },
        initUi: function () {
            this.$countySelect = this.$element.countySelect({ map: app.map, containerTW: true, autoFitBounds:false, showLabel:false}).find('select').hide();

            $('<div class="item-title">氣象圖資</div>').appendTo(this.$element);
            Init雷達迴波圖(this.$element).on($.BasePinCtrl.eventKeys.initUICompleted, function () {
                $(this).find('.pinswitch').prop('checked', true).trigger('change');
            });
            Init累積雨量圖(this.$element).on($.BasePinCtrl.eventKeys.initUICompleted, function () {
                //$(this).find('.pinswitch').prop('checked', true).trigger('change');
            });

            InitQpf060minRt(this.$element);

            $('<div class="item-title">防災點位</div>').appendTo(this.$element);
            this.$_護理機構=  Init護理機構(this.$element);
            this.$_兒少安養機構 = Init兒少安養機構(this.$element);
            this.$_老年福利機構 = Init老年福利機構(this.$element);
            this.$_身心障礙福利機構 = Init身心障礙福利機構(this.$element);
            //this.$_區排水位 = Init區排水位(this.$element);

            var currentCountyName = undefined;
            var tw = this.$countySelect.find('option').first().text();
            this.$countySelect.on('change', function () {
                currentCountyName = this.$element.countySelect('getCountyName');
                var __filter = function (d) {
                    if (d.kmlDescription || d.CountyName) { //d.CountyName來至區排
                        var nd = d.kmlDescription ? d.kmlDescription.replace('臺', '台') : d.CountyName;
                        return tw == currentCountyName || nd.indexOf(currentCountyName) >= 0;
                    } else
                        return tw == currentCountyName;
                }
                
                this.$_護理機構.KmlCtrl('setFilter', __filter); //this 因用bind(this)
                this.$_兒少安養機構.KmlCtrl('setFilter', __filter);
                this.$_老年福利機構.KmlCtrl('setFilter', __filter);
                this.$_身心障礙福利機構.KmlCtrl('setFilter', __filter);
                //this.$_區排水位.PinCtrl('setFilter', __filter);
            }.bind(this));
           
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