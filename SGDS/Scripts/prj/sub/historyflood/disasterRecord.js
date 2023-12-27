/*災害履歷*/
(function ($) {
    'use strict';
    var pluginName = 'disasterRecord';

    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.$meter = undefined;
        this.$villagePolygonPinr = undefined;
        this.$countySelect = undefined;
        this.$confirm = undefined;
        this.settings = { map: undefined };

        this.villageLayer = [];
        this.currentVillageAlertDatas = [];
        this.$ctrl = undefined;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {

            var current = this;

            $.extend(this.settings, options);
            this.map = this.settings.map;
            this.$element.on($.menuctrl.eventKeys.popu_init_before, function (evt) {
                current.initUi();
            });
            datahelper.getVillageFloodAlertDatas(true,function (ds) {
                console.log('預抓資料完成datahelper.getVillageFloodAlertDatas');
            });
        },
        initUi: function () {
            var current = this;//.$element;
            //current.$element.empty();
            var $_ctrl = $('<div class="village-disaster-history use-village-polygon">').appendTo(current.$element);
            this.$ctrl = $_ctrl;

            $('<div class="item-title">查詢條件</div>').appendTo($_ctrl);
            var $yearContainer = $('<div class="col-md-12 form-inline year-container"></div>').appendTo($_ctrl);
            $('<div class="input-group"><span class="input-group-text">時間</span><select class="form-control"></select><span class="input-group-text">&nbsp;～&nbsp;&nbsp;</span><select class="form-control"></select></div>').appendTo($yearContainer);
            var $styear = $yearContainer.find('select:eq(0)');
            var $endyear = $yearContainer.find('select:eq(1)');
            for (var y = 2003; y <= new Date().getFullYear() ; y++) {
                $('<option value="' + y + '">' + y + '</option>').appendTo($styear);
                $('<option value="' + y + '">' + y + '</option>').appendTo($endyear);
            }
            $styear.val('2003');
            $endyear.val('' + new Date().getFullYear());

            var $sbc = $('<div class="row col-md-12 select-boundary-container"><div class="col-12"><label>依</label></div></div>').appendTo($_ctrl).find('>div');
            $('<label><input type="radio" name="selectboundarygroup" value="c" checked/>縣市</label>').appendTo($sbc).on('click', function () {
                //current.$rvbSelect[0].selectedIndex = 0;
                //current.$rvbSelect.trigger('change');
                $riverContainer.rvbRiverSelect('setRvb', undefined);
                $countyContainer.show();
                $riverContainer.hide();
            });
            $('<label><input type="radio" name="selectboundarygroup" value="r"/>流域</label>').appendTo($sbc).on('click', function () {
                $countyContainer.countySelect('setCounty', 0);
                $countyContainer.hide();
                $riverContainer.show();
            });



            var $countyContainer = $('<div class="col-md-12"></div>').appendTo($_ctrl);
            $countyContainer.countySelect({ map: app.map, containerTW: true, autoFitBounds: false, showLabel: false }).on('county-selectd-change', function () {
            });
            var $riverContainer = $('<div class="col-md-12"></div>').appendTo($_ctrl).rvbRiverSelect({ map: app.map, showLabel: false }).hide();
            $riverContainer.rvbRiverSelect('initUi');
            //this.$confirm = $('<div class="col-md-12"><div class=" btn btn-success col-md-12" data-loading-text="資料載入中...">確 定</div></div>').appendTo($_ctrl).find('> .btn');
            this.$confirm = $('<div class="col-md-12"><div class=" btn btn-success col-md-12" data-loading-text="資料載入中..."><span class="spinner"><span class="spinner-border spinner-grow-sm" role="status" aria-hidden="true"></span>資查詢中...</span><span class="no-spinner">確 定</span></div></div>').appendTo($_ctrl).find('> .btn');

            $('<div class="col-md-12">').appendTo($_ctrl);

            $('<div class="item-title">圖層控制</div>').appendTo($_ctrl);
            var $_listContainer = $('<div style="height:100%;">').appendTo($_ctrl);
            //var $_listContainer = $('<div style="">').appendTo($_ctrl);
            $_ctrl.villageAlertPolygon({
                map: app.map, pinOptions: {
                    name: '村里', listContainer:$_listContainer,listTheme:'gbright',
                }
            });

            $_listContainer.appendTo($_ctrl);


            this.$meter = $_ctrl.find('.meter').first();
            current.$villagePolygonPin = this.$meter.find('> div').first();
            current.$villagePolygonPin.on($.BasePinCtrl.eventKeys.pinShowChange, function (ev, _isShow) {
                current.show(_isShow);
            }).on($.BasePinCtrl.eventKeys.repaintPinCompleted, function () {
                current.$confirm.button('reset');
            });
            //$_listContainer.parentsUntil('.popu-ctrl-container').css('height', '100%');
            
            $_ctrl.on('query_completed', function () {
                current.$confirm.removeClass('disabled');
                //current.$confirm.button('reset');
                setTimeout(function () {
                    $_ctrl.find('.pinlist').prop('checked', true).trigger('change');
                });

            });
            this.$confirm.on('click', function () {
                current.$confirm.addClass('disabled');
                //current.$confirm.button('loading');
                var rvb = $riverContainer.rvbRiverSelect('getRvb');
                var river = $riverContainer.rvbRiverSelect('getRiver');
                var c = $countyContainer.countySelect('getCounty');
                setTimeout(function () {
                    $_ctrl.villageAlertPolygon("query", -1, c, false,undefined, $styear.val(), $endyear.val(), rvb, river);
                });
            });
        },
        setOpacity: function (_opacity) {
            if (this.$villagePolygonPin.instance)
                this.$villagePolygonPin.instance.setOpacity(_opacity);
        },
        show: function (_isshow) {
            $.each(this.villageLayer, function () {
                this.setMap(_isshow ? this.map : null);
            });
        },
        _isShow: function () {
            return this.$meter.find('.pinswitch ').is(':checked');
        },
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

