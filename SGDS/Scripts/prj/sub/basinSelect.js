
(function ($) {
    'use strict';
    var pluginName = 'basinSelect';
    $.basinSelect = {
        eventKeys: { change: 'basinSelect-change', init_complete: 'init_complete' }
    };
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.$basinSelect;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);
            this.initUi();
        },
        initUi: function () {
            var that = this;
            this.$basinSelect = $('<select class="form-control"  style="padding-left:2px">').appendTo(this.$element).on('change', function () {
                that.$element.trigger($.basinSelect.eventKeys.change, that.value());
            });

            window.datahelper.getBasin(function (bs) {
                that.$basinSelect.empty();
                //evts.sort(function (a, b) { return helper.format.JsonDateStr2Datetime(b.BeginTime) - helper.format.JsonDateStr2Datetime(a.BeginTime) });
                $('<option value="-1">全流域</option>').appendTo(that.$basinSelect);
                $.each(bs, function () {
                    //var $_p = $('<option value="' + this.BASIN_NO + '">' + this.BASIN_NAME + '</option>').appendTo(that.$basinSelect);
                    var $_p = $('<option value="' + this.Code + '">' + this.Name.zh_TW + '</option>').appendTo(that.$basinSelect);
                });
                that.$basinSelect.trigger('change');
                that.$element.trigger($.basinSelect.eventKeys.init_complete, that.value());
            });
        },
        value: function () {
            return this.$basinSelect.val();
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