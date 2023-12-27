
(function ($) {
    'use strict';
    var pluginName = 'landUseDistrictStatisticsTable';

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
            var $_ctrl = $('<div class="land-use-district-statistics-table-container">').appendTo(current.$element);
            var $_temp  = $('<div class="tilte-div">積淹水土地利用面積統計<label></label><a>匯出</a></div>').appendTo($_ctrl);
            this.$titleContent = $_temp.find('label');

            this.$table = $('<div><table></table><div>').appendTo($_ctrl).find('table');

            $_temp.find('a').on('click', function () {
                helper.misc.tableToExcel(current.$table, '積淹水土地利用面積統計', '積淹水土地利用面積統計');
            });
        },
        setData: function (_data) {
            var current = this;
            //this.$titleContent.html(_data.length);
            var _flag = {};
            $.each(_data, function () {
                if (this.Land) {
                    if (!_flag[this.NOTIFICATION_Data.COUNTY_NAME]) {
                        _flag[this.NOTIFICATION_Data.COUNTY_NAME] = [];
                    }
                    _flag[this.NOTIFICATION_Data.COUNTY_NAME] = _flag[this.NOTIFICATION_Data.COUNTY_NAME].concat(this.Land);
                    //_flag[this.NOTIFICATION_Data.COUNTY_NAME].push(this.Land);
                }
            });

            var _temp = {};
            var _tabledata = [];
            var _head = ' ';
            var _sumdata = { ' ': '面積合計(M2)' };
            $.each(datahelper.getLandUseType(), function () {
                var _lid = this.Id;
                var _d = { ' ': this.Id + ' ' + this.Name };
                $.each(_flag, function (_cn, _ulands) {
                    var _total =0;
                    $.each(_ulands, function () {
                        if (_lid == this.Id) {
                            _total += this.Area;
                        }

                    });
                    _d[_cn] = _total;//.toFixed(2);
                    _sumdata[_cn] = (_sumdata[_cn] ? _sumdata[_cn] : 0) + _total;
                });
                _tabledata.push(_d);
            });
            _tabledata.push(_sumdata);
          
            var _columns = [];
            $.each(_tabledata[0], function (_f, _d) {
                _columns.push({
                    field: _f, title: _f + ( _f == _head ? '':'(%)'), align: _f == _head ? undefined : 'right',
                    
                    formatter: _f == _head ? undefined : function (v) { return v == 0 ? "-" : helper.format.formatNumber(v, 2) + ' (' + helper.format.paddingLeft( ((v / _sumdata[_f]) * 100).toFixed(1),' ', 4 )+ ')' }
                });
            });
            this.$table.bootstrapTable('destroy').bootstrapTable({
                //height: 200,
                classes: 'table table-hover table-sm',
                striped: true,
                //columns: [{ field: 'name', title: '項目' },
                //    { field: 'count', title: '次數' }
                //],
                columns: _columns,
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