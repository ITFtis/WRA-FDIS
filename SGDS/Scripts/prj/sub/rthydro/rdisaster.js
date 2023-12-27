(function ($) {
    'use strict';
    var pluginName = 'rdisaster';
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = { map: undefined, autoShow: true };
        this.currentevent = undefined;
        this.$pinctrl = undefined;
        this.$areactrl = undefined;
        this._floodAreaImageGroundOverlay = [];
        this.currentAllFloodAreaData = [];
        this.currentDisplayFloodAreaData = [];
        this.isShowArea = false;
        this.$tooltip = $('<i  data-toggle="tooltip" data-html="true" data-placement="right" data-animation="false" data-trigger="manual" style="position:absolute !important;" />').appendTo('body');
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
            this.$pinctrl = $('<div>').appendTo(this.$element).on($.BasePinCtrl.eventKeys.initUICompleted, function () {
                that.$pinctrl.find('.pinswitch').prop('checked', true).trigger('change');
                that.$pinctrl.find('.pinlist').prop('checked', true).trigger('change');
                that.$pinctrl.find('.ctrl').hide();
                //$filterContainer.insertBefore(that.$pinctrl.find('.legend'));
                var $filterContainer = $('<div class="row filter-container">').insertBefore(that.$pinctrl.find('.legend'));

                //縣市、鄉鎮篩選
                var $countySelect = $('<div class="col-4">').appendTo($filterContainer).countySelect({ containerTW: true, autoFitBounds: false, showLabel: false }).on($.countySelect.eventKeys.change, function () {

                    var _c = $countySelect.countySelect('getCountyName');
                    var _cityCode = _c == datahelper.AllTW ? undefined : $.grep(window.fhyCity, function (c) {
                        return c.Name.zh_TW == _c || c.Name.zh_TW == _c.replace('台', '臺');
                    })[0];
                    that.$pinctrl.PinCtrl('setFilter', function (d) {
                        return _c == datahelper.AllTW || _c == d.COUNTY_NAME;
                    });

                    //鄉鎮區市
                    $townSelect.empty();
                    $('<option value="0">--</option>').appendTo($townSelect);
                    $townSelect.off('change');

                    if (_cityCode != undefined) {
                        window.datahelper.getFHYTown(_cityCode.Code, function (ts) {
                            $.each(ts, function () {
                                var t = this;
                                $('<option value="' + t.Name.zh_TW + '">' + t.Name.zh_TW + '</option>').appendTo($townSelect);
                            });
                            $townSelect.on('change', function () {
                                var tc = $townSelect.val();
                                if (tc == 0)
                                    $countySelect.trigger($.countySelect.eventKeys.change);
                                else {
                                    that.$pinctrl.PinCtrl('setFilter', function (d) {
                                        return (_c == 0 || _c == d.COUNTY_NAME) && (tc == 0 || tc == d.TOWN_NAME);
                                    });
                                }
                            });
                        });
                    }
                });
                var $townSelect = $('<div class="col-4"><select class="form-control"></select></div>').appendTo($filterContainer).find('select');
                $('<option value="0">--</option>').appendTo($townSelect);


                $('.search', that.$element).appendTo($('<div class="col-4">').appendTo($filterContainer));
            }).on($.BasePinCtrl.eventKeys.afterSetdata, function (e, ds, dds) {
                that.$element.trigger('get-data-complete', [ds]);
            }).on($.BasePinCtrl.eventKeys.repaintPinCompleted, function (e, ds) {
                //重劃淹水推估
                that.currentDisplayFloodAreaData = [];
                $.each(that.currentAllFloodAreaData, function () {
                    var _a = this;
                    if ($.grep(ds, function (_d) { return _a.PK_ID == _d.PK_ID; }).length > 0)
                        that.currentDisplayFloodAreaData.push(_a);
                });
                that.$areactrl.PolygonCtrl('reload');
            });

           


            //客製淹水點位options
            var ops = {
                legendIcons: [
                    { name: '<span>已退水</span>', url: app.siteRoot + 'images/pin/flood_OK.png', classes: 'blue_status', disabled: true  },
                    { name: '災點', url: app.siteRoot + 'images/pin/flood_5.png', classes: 'red_status'},
                    { name: '災點10', url: app.siteRoot + 'images/pin/flood_10.png', classes: 'red_status' },
                    { name: '災點30', url: app.siteRoot + 'images/pin/flood_30.png', classes: 'red_status' },
                    { name: '災點50', url: app.siteRoot + 'images/pin/flood_50.png', classes: 'red_status' }],
                checkDataStatus: function (data, index) {
                    var _i = 0;
                    if (!data.IS_RECESSION && data.DEPTH != undefined && data.DEPTH >= 50)
                        _i = 4;
                    else if (!data.IS_RECESSION && data.DEPTH != undefined && data.DEPTH >= 30)
                        _i = 3;
                    else if (!data.IS_RECESSION && data.DEPTH != undefined && data.DEPTH > 10)
                        _i = 2;
                    else if (!data.IS_RECESSION)
                        _i = 1;
                    return this.settings.legendIcons[_i];
                },
                loadInfo : function (dt, callback) {
                    if (!that.currentevent)
                        return callback([]);
                    else {
                        datahelper.loadFloodComputeForLightweightDatas(JsonDateStr2Datetime(that.currentevent.BeginDate),
                            JsonDateStr2Datetime(that.currentevent.EndDate), 0, 0, function (ds) {
                                var rs = $.grep(ds.flood, function (f) { //排除淹水感測器
                                    return f.SourceCode == undefined || f.SourceCode != 7;
                                });
                                that.currentAllFloodAreaData = $.grep(ds.floodarea, function (f) { //排除淹水感測器
                                    return f.SourceCode == undefined || f.SourceCode != 7;
                                });
                                callback(rs);
                            }
                        );
                    }
                },
                pinClick: function (d) { that.$element.trigger('pin-click', [d]); } 
            }
            InitReportDisaster(this.$pinctrl, ops);
            
            //淹水推估
            var _floodareaPolygonOption = $.extend({ map: app.map, minZoom:13 }, floodareaPolygonOption); //13比例尺1公里
            _floodareaPolygonOption.loadInfo = function (dt, callback) {
                //疊淹水範圍
                window.paintFloodAreaImageGroundOverlay(that._floodAreaImageGroundOverlay, that.currentDisplayFloodAreaData, .95, that.$tooltip);
                that._showArea(that.isShowArea); 
                return callback([]);
            };
            this.$areactrl = $('<div>').appendTo(this.$element).PolygonCtrl(_floodareaPolygonOption)
                .on($.BasePinCtrl.eventKeys.initUICompleted, function () {
                    that.$areactrl.find('.pinswitch').prop('checked', true).trigger('change');
                })
                .on($.BasePinCtrl.eventKeys.pinShowChange, function (evt, _isshow) { //開關、或zoom改變
                    if (that.isShowArea != _isshow) { //相同情況不處裡
                        that.isShowArea = _isshow;
                        that._showArea(that.isShowArea);
                    }
                }).hide();

        },
        setEvent: function (ev) {
            this.currentevent = ev;
            this.$pinctrl.PinCtrl('reload');
        },
        _showArea: function (_s) { //因有設minZoom，需處理是否呈現
            $.each(this._floodAreaImageGroundOverlay, function () {
                if (_s)
                    this.addTo(app.map);
                else
                    this.remove();
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