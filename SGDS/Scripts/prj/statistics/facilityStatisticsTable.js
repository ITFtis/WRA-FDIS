
(function ($) {
    'use strict';
    var pluginName = 'facilityStatisticsTable';

    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.$titleContent = undefined;
        this.$table = undefined;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {

            var current = this;

            $.extend(this.settings, options);
            this.initUi();
           
        },
        initUi: function () {
            var current = this;//.$element;
            //current.$element.empty();
            var $_ctrl = $('<div class="facility-statistics-table-container">').appendTo(current.$element);
            this.$titleContent = $('<div class="tilte-div">設施災情共<label></label>筆</div>').appendTo($_ctrl).find('label');
            this.$table = $('<div><table></table><div>').appendTo($_ctrl).find('table');

        },
        setData: function (_data) {
            var current = this;
            this.$titleContent.html(_data.length);

            var _temp = {};
            $.each(datahelper.getEMISWATER_TYPE(), function(){
                _temp[this.NAME] = 0;
            });
            $.each(_data, function () {
                _temp[this.EMISTYPE] = _temp[this.EMISTYPE] == undefined ? 0 : _temp[this.EMISTYPE] + 1;
            });
            var _tabledata = [];
            $.each(datahelper.getEMISWATER_TYPE(), function () { //用datahelper.getEMISWATER_TYPE()順序才OK
                _tabledata.push({ name: this.NAME, count: _temp[this.NAME] });
            });
            this.$table.bootstrapTable('destroy').bootstrapTable({
                //classes: 'table table-bordered table-hover table-sm',
                classes: 'table table-hover table-sm',
                //height: 200,
                striped: true,
                columns: [{ field: 'name', title: '項目' },
                    { field: 'count', title: '次數' }
                ],
                data: _tabledata,
                formatNoMatches: function () {
                    return '無資料!!';
                },
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