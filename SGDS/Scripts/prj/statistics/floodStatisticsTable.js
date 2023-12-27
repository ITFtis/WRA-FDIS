
(function ($) {
    'use strict';
    var pluginName = 'floodStatisticsTable';

    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.$titleAlertCount = undefined;
        //this.$titleFloodCount = undefined; //20200907不用
        this.$titleAffectHouseCount = undefined;
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
            var $_ctrl = $('<div class="flood-statistics-table-container">').appendTo(current.$element);
            //var $_temp = $('<div class="tilte-div">積淹水災情共通報<label></label>筆，積淹水<label></label>筆，影響<label></label>戶數<a>匯出</a></div>').appendTo($_ctrl);
            var $_temp = $('<div class="tilte-div">積淹水災情共通報<label></label>筆，影響<label></label>戶數<a>匯出</a></div>').appendTo($_ctrl);
            this.$titleAlertCount = $_temp.find('label:eq(0)');
            //this.$titleFloodCount = $_temp.find('label:eq(1)'); //20200907不用
            this.$titleAffectHouseCount = $_temp.find('label:eq(1)');
            this.$table = $('<div><table></table><div>').appendTo($_ctrl).find('table');
            $_temp.find('a').on('click', function () {
                var $_t = $("<table>").css('position', 'fixed').css('top', '-300px').css('opacity', 0).appendTo($('body'));
                current._paintTable($_t,false);
                helper.misc.tableToExcel($_t, '積淹水災情統計', '積淹水災情統計');
                setTimeout(function () {
                    $_t.remove();
                },1000);
            });
        },
        setData: function (_data) {
            var current = this;

            var _temp = {};
            var _totalAlert = 0;
            var _totalFlood = 0;
            var _totalHouse = 0;
            $.each(_data, function () {
                if (!_temp[this.NOTIFICATION_Data.COUNTY_NAME])
                    _temp[this.NOTIFICATION_Data.COUNTY_NAME] = {
                        alert: 0, flood: 0, flood_is_recession:0, house: 0, house_is_recession: 0, area: 0, area_is_recession:0,
                        house50up: 0, house50up_is_recession: 0, area50up: 0, area50up_is_recession: 0
                    };
                var _c = _temp[this.NOTIFICATION_Data.COUNTY_NAME];
                _c.alert += 1;
                if (!this._Land) { // _Land代表同一網格有2個以上通報，且this非最大深水+高程
                    //if (this.AffectHouse == 107) this.NOTIFICATION_Data.IS_RECESSION = false;

                    var _is_recession = this.NOTIFICATION_Data.IS_RECESSION;
                    _c.flood += this.GridId == 0 ? 0 : 1;
                    _c.flood_is_recession += (this.GridId != 0 && _is_recession ? 1 : 0);
                    _c.house += this.AffectHouse ? this.AffectHouse : 0;
                    _c.house_is_recession += this.AffectHouse && _is_recession ? this.AffectHouse : 0;
                    _c.area += this.AffectArea;
                    _c.area_is_recession += _is_recession? this.AffectArea:0;
                    _c.house50up += this.AffectHouse50cmUp ? this.AffectHouse50cmUp : 0;
                    _c.house50up_is_recession += this.AffectHouse50cmUp && _is_recession ? this.AffectHouse50cmUp : 0;
                    _c.area50up += this.AffectArea50cmUp ? this.AffectArea50cmUp : 0;
                    _c.area50up_is_recession += this.AffectArea50cmUp && _is_recession ? this.AffectArea50cmUp : 0;

                }

                _totalAlert += 1;
                if (!this._Land) {
                    _totalFlood += this.GridId == 0 ? 0 : 1;
                    _totalHouse += this.AffectHouse ? this.AffectHouse : 0;
                }
            });
            this.$titleAlertCount.html(helper.format.formatNumber(_totalAlert));
            //this.$titleFloodCount.html(helper.format.formatNumber(_totalFlood)); //20200907不用
            this.$titleAffectHouseCount.html(helper.format.formatNumber(_totalHouse));


            
            var _tabledata = [];
            $.each(datahelper.loadCountyXY(false), function () { //用datahelper.getEMISWATER_TYPE()順序才OK
                var _c=_temp[this.CountyName];
                _tabledata.push({
                    county: this.CountyName,
                    alert: _c ? _c.alert : undefined,
                    flood: _c ? _c.flood : undefined,
                    flood_is_recession: _c ? _c.flood_is_recession : undefined,
                    house: _c ? _c.house : undefined,
                    house_is_recession: _c ? _c.house_is_recession : undefined,
                    area: _c ? _c.area : undefined,
                    area_is_recession: _c ? _c.area_is_recession : undefined,
                    house50up: _c ? _c.house50up : undefined,
                    house50up_is_recession: _c ? _c.house50up_is_recession : undefined,
                    area50up: _c ? _c.area50up : undefined,
                    area50up_is_recession: _c ? _c.area50up_is_recession : undefined
                });
            });
            this._tabledata = _tabledata;
            this._paintTable(this.$table, true);
        },
        _paintTable: function ($_table, _isSimpale) {
            var numsubtract = function (a, b) {
                if (a == undefined && b == undefined)
                    return '-';
                return helper.format.formatNumber((a != undefined ? a : 0) - (b != undefined ? b : 0));
            }
            $_table.bootstrapTable('destroy').bootstrapTable({
                //height: 200,
                classes: 'table table-hover table-sm',
                striped: true,
                columns: [{ field: 'county', title: '縣市' },
                { field: 'alert', title: '通報筆數', align: 'right', formatter: function (v) { return v ? helper.format.formatNumber(v) : '-' } },
                    { field: 'flood', title: '推估筆數', align: 'right', visible: !_isSimpale, formatter: function (v) { return v ? helper.format.formatNumber(v) : '-' } },
                    { field: 'flood_un_recession', title: '推估筆數(未)', align: 'right', visible: !_isSimpale, formatter: function (v, r) { return numsubtract(r.flood, r.flood_is_recession) } },
                    { field: 'flood_is_recession', title: '推估筆數(退)', align: 'right', visible: !_isSimpale, formatter: function (v) { return v ? helper.format.formatNumber(v) : '-' } },
                    { field: 'house', title: '影響戶數(全)', align: 'right', visible: !_isSimpale, formatter: function (v) { return v ? helper.format.formatNumber(v) : '-' } },
                    { field: 'area', title: '影響面積(m2)(全)', align: 'right', visible: !_isSimpale, formatter: function (v) { return v ? helper.format.formatNumber(v) : '-' } },
                    { field: 'house_un_recession', title: '影響戶數(未)', align: 'right', visible: !_isSimpale, formatter: function (v, r) { return numsubtract(r.house, r.house_is_recession) } },
                    { field: 'area_un_recession', title: '影響面積(m2)(未)', align: 'right', visible: !_isSimpale, formatter: function (v, r) { return numsubtract(r.area, r.area_is_recession) } },
                    { field: 'house_is_recession', title: '影響戶數(退)', align: 'right', visible: !_isSimpale, formatter: function (v) { return v ? helper.format.formatNumber(v) : '-' } },
                    { field: 'area_is_recession', title: '影響面積(m2)(退)', align: 'right', visible: !_isSimpale, formatter: function (v) { return v ? helper.format.formatNumber(v) : '-' } },
                { field: 'house50up', title: '影響戶數(50cm↑)(全)', align: 'right', formatter: function (v) { return v ? helper.format.formatNumber(v) : '-' } },
                { field: 'area50up', title: '影響面積(m2)(50cm↑)(全)', align: 'right', formatter: function (v) { return v ? helper.format.formatNumber(v) : '-' } },
                { field: 'house50up_', title: '影響戶數(50cm↑)(未)', align: 'right', formatter: function (v, r) { return numsubtract(r.house50up, r.house50up_is_recession); } },
                { field: 'area50up_', title: '影響面積(m2)(50cm↑)(未)', align: 'right', formatter: function (v, r) { return numsubtract(r.area50up, r.area50up_is_recession); } },
                    { field: 'house50up_is_recession', title: '影響戶數(50cm↑)(退)', align: 'right', visible: !_isSimpale, formatter: function (v) { return v ? helper.format.formatNumber(v) : '-' } },
                    { field: 'area50up_is_recession', title: '影響面積(m2)(50cm↑)(退)', align: 'right', visible: !_isSimpale, formatter: function (v) { return v ? helper.format.formatNumber(v) : '-' } }
                ],
                data: this._tabledata,
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