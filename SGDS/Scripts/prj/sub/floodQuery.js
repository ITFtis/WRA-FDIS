
FLOOD_QUERY_EVENT = {
    SHOW_積淹水災情統計表: '積淹水災情統計表',
    SHOW_水利設施統計表: '水利設施統計表',
    SHOW_土地使用區分統計表: '土地使用區分統計表',
    CHANGE_積淹水災情統計表: 'C積淹水災情統計表',
    CHANGE_水利設施統計表: 'C水利設施統計表',
    CHANGE_土地使用區分統計表: 'C土地使用區分統計表'
};

(function ($) {
    'use strict';
    var pluginName = 'floodQuery';

    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = { map: undefined, useRiver: false }; //useRiver是否用流域篩選條件
        this.map = undefined;
        this.$dtStart = undefined;
        this.$dtEnd = undefined;
        this.$countySelect = undefined;

        this.$affectSelect = undefined;
        this.$affectHouseInput = undefined;
        this.$affectAreaInput = undefined;

        this.$confirm = undefined;
        this.currentFloodData = [];     //淹水點位資料
        this.currentFacilityData = [];  //淹水設施資料
        this.currentFloodAreaData = [];     //淹水範圍
        this.currentHandDrawFloodData = [];    //人工圈畫
        this.currentStatisticsData = [];       //統計資料

        this._floodAreaImageGroundOverlay = []; //淹水範圍Image
        this._currentOpacity = .9;

        this.$_floodpin, this.$_facilitypin;
        var current=this;
        this.$element.on('flood-boundary-change', function (e, bs) { //及時災情需求RtDisaster
            //console.log('flood-boundary-change');
            current.$_floodpin.PinCtrl('setBoundary', bs);
            current.$_facilitypin.PinCtrl('setBoundary', bs);
        });
        this.$element.on('flood-county-change', function (e, c) { //及時災情需求RtDisaster
            var a = datahelper.AllTW == c;
            current.$_floodpin.PinCtrl('setFilter', function (d) {
                return a || c == d.COUNTY_NAME || c.replace("台", "臺") == d.COUNTY_NAME
            });
            current.$_facilitypin.PinCtrl('setFilter', function (d) {
                return a || c == d.COUNTY_NAME || c.replace("台", "臺") == d.COUNTY_NAME
            });
        });
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
            //datahelper.getVillageFloodAlertDatas(function (ds) {
            //    console.log('預抓資料完成datahelper.getVillageFloodAlertDatas');
            //});
            this.isInitUiCompleted = false;
            this.loadWraEvents = false;
        },
        initUi: function () {
            var current = this;//.$element;
            window.floodQueryObj = this;
            var checkInitUiCompleted = function () {
                if (current.loadWraEvents && current.isInitUiCompleted)
                    current.$element.trigger('initUiCompleted');
            };
            //current.$element.empty();

            //ui-only class僅給"整備階段"用
            var $_ctrl = $('<div class="flood-query "></div>').appendTo(current.$element);//.find('.flood-query');
            //////條件UI
            $('<div class="item-title ui-only">積淹水範圍查詢</div>').appendTo($_ctrl);

            //時間
            var $_temp = $('<div class="row col-md-12"><label class="col-3" style="padding-right: 0;"> 時間起</label></div>').appendTo($_ctrl);
            $.edittable_defaultEdit.datetime.editContent.call({ field: 'dtStart'}, $_temp);
            this.$dtStart = $_temp.find('.datetimeul').addClass('f-dt col-9');
            $_temp = $('<div class="row col-md-12"><label class="col-3">迄</label></div>').appendTo($_ctrl);
            $.edittable_defaultEdit.datetime.editContent.call({ field: 'dtEnd'}, $_temp);
            this.$dtEnd = $_temp.find('.datetimeul').addClass('f-dt col-9');
            //時間操作選項
            var $floodquerytimertypegroup = $('<div class="row col-md-12"><div class="col-3"></div><div class="floodquerytimer-typegroup col-9"></div>').appendTo($_ctrl).find('.floodquerytimer-typegroup');
            $('<label><input type="radio" name="floodquerytimertypegroup" value="first" checked/>當日</label>').appendTo($floodquerytimertypegroup).on('click', function () {
                datetimepickerFormatter('YYYY/MM/DD');
                current.$dtStart.datetimepicker("date", new Date());
                current.$dtStart.datetimepicker("disable");
                current.$dtEnd.datetimepicker("date", new Date());
                current.$dtEnd.datetimepicker("disable");
                $wraeventsdiv.collapse('hide');
                
            });
            $('<label><input type="radio" name="floodquerytimertypegroup" value="first1" />依事件</label>').appendTo($floodquerytimertypegroup).on('click', function () {
                datetimepickerFormatter('YYYY/MM/DD HH:mm');
                current.$dtStart.datetimepicker("date", new Date());
                current.$dtStart.datetimepicker('disable');
                current.$dtEnd.datetimepicker("date", new Date());
                current.$dtEnd.datetimepicker('disable');
                $eventSelect.trigger('change');
                $wraeventsdiv.collapse('show');
                
            });
            $('<label><input type="radio" name="floodquerytimertypegroup" value="first3" />近半年</label>').appendTo($floodquerytimertypegroup).on('click', function () {
                datetimepickerFormatter('YYYY/MM/DD');
                current.$dtStart.datetimepicker("date", new Date().addHours(-app.nearFloodDuration * 24)).disable();

                current.$dtEnd.datetimepicker("date", new Date()).disable();
                $wraeventsdiv.collapse('hide');
                
            }).hide();//僅給"整備階段"用

            $('<label><input type="radio" name="floodquerytimertypegroup" value="first2" />自訂</label>').appendTo($floodquerytimertypegroup).on('click', function () {
                datetimepickerFormatter('YYYY/MM/DD HH:mm');
                current.$dtStart.datetimepicker("enable", true);
                current.$dtEnd.datetimepicker("enable", true);
                //current.$dtStart.data("DateTimePicker").enable();
                //current.$dtStart.data("DateTimePicker").date(new Date('2019/08/08'));
                //current.$dtEnd.data("DateTimePicker").date(new Date('2019/08/08'));
                $wraeventsdiv.collapse('hide');
                
            });

            var datetimepickerFormatter = function (_format) { //20210809備而不用
                current.$dtStart.datetimepicker('options', {
                    locale: 'zh-tw', format: _format
                });
                current.$dtEnd.datetimepicker('options', {
                    locale: 'zh-tw', format: _format
                });
            };

            //事件
            var $wraeventsdiv = $('<div class="row col-md-12"><div class="col-3"></div></div>').appendTo($_ctrl);
            var $eventYearSelect = $('<div class="col-3"><select class="form-control wra-event-year"></div>').appendTo($wraeventsdiv).find('.wra-event-year');
            var $eventSelect = $('<div class="col-6"><select class="form-control col-5 wra-events"></div>').appendTo($wraeventsdiv).find('.wra-events');

            //縣市
            if (this.settings.useRiver) {
                var $sbc = $('<div class="row col-md-12 select-boundary-container"><div class="col-12"><label>依</label></div></div>').appendTo($_ctrl).find('>div');
                $('<label><input type="radio" name="selectboundarygroup" value="c" checked/>縣市</label>').appendTo($sbc).on('click', function () {
                    $riverContainer.rvbRiverSelect('setRvb', undefined);
                    current.$countySelect.closest('.county-select-container').show();
                    current.$rvbriverSelect.hide();
                });
                $('<label><input type="radio" name="selectboundarygroup" value="r" disabled/>流域</label>').appendTo($sbc).on('click', function () {
                    current.$countySelect[0].selectedIndex = 0;
                    current.$countySelect.closest('.county-select-container').hide();
                    current.$rvbriverSelect.show();
                });
                this.$element.on('initUiCompleted', function () {
                    $('input[value="r"]').attr('disabled', false);
                });
            }
            this.$countySelect = $('<div class="row col-md-12 ui-only county-select-container"><label class="col-3">縣&nbsp;&nbsp;市</label><div class="col-9"><select class="form-control"></select></div></div>').appendTo($_ctrl).find('select');
            if (this.settings.useRiver) {
                this.$rvbriverSelect = $('<div class="row col-md-12 ui-only river-select-container"><label class="col-3">流&nbsp;&nbsp;域</label></div>').appendTo($_ctrl).hide();
                var $riverContainer = this.$rvbriverSelect.rvbRiverSelect({ map: app.map, showLabel: false });
                
                this.$rvbriverSelect.rvbRiverSelect('initUi');
                $riverContainer.find('.rvb-river-select-container').removeClass('col-12').addClass("col-9");
            }
            //資料類型
            var $floodquerydatatypegroup = $('<div class="row col-md-12 ui-only"><label class="col-3">資&nbsp;&nbsp;料</label><div class="col-9 data-type-group"></div></div>').appendTo($_ctrl).find('> div');
            $('<label><input type="radio" name="floodquerydatatypegroup" value="0" checked/>非測試</label>').appendTo($floodquerydatatypegroup);
            $('<label><input type="radio" name="floodquerydatatypegroup" value="1" />測試</label>').appendTo($floodquerydatatypegroup);
            $('<label><input type="radio" name="floodquerydatatypegroup" value="2" />全部</label>').appendTo($floodquerydatatypegroup);

            if (this.settings.useRiver) {
                this.$depthSelect = $('<div class="row col-md-12"><label class="col-5" style="padding-right: 0;">水深條件</label><div class="col-7" style="padding-left: 0;padding-right: 0;"><select class="form-control" ></select></div></div>').appendTo($_ctrl).find('select')
                this.$affectHouseInput =$('<div class="row col-md-12"><label class="col-5" style="padding-right: 0;">影響戶數大於</label><div class="col-7" style="padding-left: 0;padding-right: 0;"><input type="number" class="form-control" /></div></div>').appendTo($_ctrl).find('input')
                this.$affectAreaInput = $('<div class="row col-md-12"><label class="col-5" style="padding-right: 0;">影響面積大於</label><div class="col-7" style="padding-left: 0;padding-right: 0;"><input type="number" class="form-control" /></div></div>').appendTo($_ctrl).find('input')
                $('<option value="0">全部</option>').appendTo(this.$depthSelect);
                $('<option value="30">30cm以上</option>').appendTo(this.$depthSelect);
                $('<option value="50">50cm以上</option>').appendTo(this.$depthSelect);
            }

            //this.$confirm = $('<div class="row col-md-12 query-confirm-container"><div class="col-md-12"><span class="btn btn-success form-control " data-loading-text="資料查詢中...">確 定</span></div></div></div>').appendTo($_ctrl).find(' .btn');
            this.$confirm = $('<div class="col-md-12"><div class=" btn btn-success col-md-12"><span class="spinner"><span class="spinner-border spinner-grow-sm" role="status" aria-hidden="true"></span>資查詢中...</span><span class="no-spinner">確 定</span></div></div>').appendTo($_ctrl).find('> .btn');

            //圖層UI
            $('<div class="item-title col-md-12 ui-only ui-estimate">圖層資訊</div>').appendTo($_ctrl);
            var $_metercontainer = $('<div class="col-md-12 meter ui-only ui-estimate">').appendTo($_ctrl);
            var $_floodpin = this.$_floodpin = $('<div class="col-md-12 floodpin-dom">').appendTo($_metercontainer);
            var $_facilitypin = this.$_facilitypin = $('<div class="col-md-12">').appendTo($_metercontainer);
            var $_floodarea = $('<div class="col-md-12 floodarea-dom">').appendTo($_metercontainer);
            var $_handdrawfloodpin = $('<div class="col-md-12 handdrawfloodpin-dom">').appendTo($_metercontainer);

            var $_silder = $('<div class="row col-md-12 ui-only ui-estimate"><label class="col-3 opacity-label">透明度</label><div class="col-9"></div></div>').appendTo($_ctrl).find('> div').slider({
                range: "min",
                max: 100,
                min: 5,
                value: 90,
                slide: function () { current.setOpacity($(this).slider("value") / 100); },
                change: function () { current.setOpacity($(this).slider("value") / 100); }
            });

            if (this.settings.packagekmz) {
                $('<div class="item-title col-md-12 ui-only ui-estimate ">推估積淹水範圍下載</div>').appendTo($_ctrl);
                $('<div class="col-md-4 col-4 package-kmz-container"> <img src="'+app.siteRoot+'images/All_kmz.png" class="package-kmz" data-depth="0">全部 </div>').appendTo($_ctrl);
                $('<div class="col-md-4 col-4 package-kmz-container"> <img src="' + app.siteRoot +'images/30_kmz.png" class="package-kmz"  data-depth="30">30cm↑</div>').appendTo($_ctrl);
                $('<div class="col-md-4 col-4 package-kmz-container"> <img src="' + app.siteRoot +'images/50_kmz.png" class="package-kmz"  data-depth="50">50cm↑</div>').appendTo($_ctrl);
            }

            //統計UI
            $('<div class="item-title col-md-12 ui-only ui-estimate">災情統計</div>').appendTo($_ctrl);
            $('<div class="col-md-12 pinctrl ui-only ui-estimate"><label><input type="checkbox" data-trigger="FloodStatisticsPanel"><span class="checkbox-glyphicon base-background  btn-sm  glyphicon " style="margin-left: 1em;"></span>  ' + FLOOD_QUERY_EVENT.SHOW_積淹水災情統計表 + '</label></div>').appendTo($_ctrl).find('  input').on('change', function () {
                current.$element.trigger(FLOOD_QUERY_EVENT.SHOW_積淹水災情統計表, [$(this).is(':checked')]);
            });
            $('<div class="col-md-12 pinctrl ui-only"><label><input type="checkbox" data-trigger="FacilityStatisticsPanel"><span class="checkbox-glyphicon base-background  btn-sm  glyphicon " style="margin-left: 1em;"></span> ' + FLOOD_QUERY_EVENT.SHOW_水利設施統計表 + '</label></div>').appendTo($_ctrl).find('  input').on('change', function () {
                current.$element.trigger(FLOOD_QUERY_EVENT.SHOW_水利設施統計表, [$(this).is(':checked')]);
            });
            $('<div class="col-md-12 pinctrl clearfix ui-only ui-estimate"><label><input type="checkbox" data-trigger="LandUseDistrictStatisticsPanel"><span class="checkbox-glyphicon base-background  btn-sm  glyphicon " style="margin-left: 1em;"></span> ' + FLOOD_QUERY_EVENT.SHOW_土地使用區分統計表 + '</label></div>').appendTo($_ctrl).find(' input').on('change', function () {
                current.$element.trigger(FLOOD_QUERY_EVENT.SHOW_土地使用區分統計表, [$(this).is(':checked')]);
            });

            //淹水範圍圖例
            var $_parents = this.$element.parents('.popu-ctrl-container');
            var $_lcontainer = $_parents.length > 0 ? $_parents.first() : $('body');
            var $_lengend = $('<img src="' + app.siteRoot + 'images/ColorLegend_w.png"/>').appendTo($_lcontainer).css('position', 'fixed').css('z-index', '9999').css('right', 6).css('bottom', 40);//.hide();
            $_lengend.css('right', - 100);

            //tooltip
            this.$tooltip = $('<i  data-toggle="tooltip" data-html="true" data-placement="right" data-animation="false" data-trigger="manual" style="position:absolute !important;" />').appendTo('body');

            //初始化
            this.$element.on('initUiCompleted')
            //helper.misc.showBusyIndicator($floodquerytimertypegroup, {content:'初始化中...'});

            //初始時間UI
            datetimepickerFormatter('YYYY/MM/DD');
            this.$dtStart.datetimepicker("date", new Date());
            this.$dtStart.datetimepicker("disable");
            this.$dtEnd.datetimepicker("date", new Date());
            this.$dtEnd.datetimepicker("disable");
            //初始縣市UI
            $.each(datahelper.getCountyXYContains0(), function () {
                $('<option value="' + this.PK_ID + '">' + this.CountyName + '</option>').appendTo(current.$countySelect);
            });
 
            //初始事件
            $wraeventsdiv.collapse({ toggle: true });//.removeClass('show');//.addClass('collapse');//.collapse('hide');
            setTimeout(function () {
                $wraeventsdiv.removeClass('show')
            },450);
            datahelper.loadWraEvents(function (events) {
                //helper.misc.hideBusyIndicator($floodquerytimertypegroup);

                events.sort(function (_a, _b) { return JsonDateStr2Datetime(_b.BeginDate).getTime() - JsonDateStr2Datetime(_a.BeginDate).getTime(); })
                var _changeEventYear = function (_y) {
                    $eventSelect.empty();
                    $.each(events, function () {
                        if (JsonDateStr2Datetime(this.BeginDate).getFullYear() == _y) {
                            var $_p = $('<option value="' + this.EventNo + '">' + this.EventName + '</option>').appendTo($eventSelect);
                            $_p[0].BeginDate =JsonDateStr2Datetime( this.BeginDate);
                            $_p[0].EndDate = JsonDateStr2Datetime(this.EndDate);
                        }
                    });
                };

                var evyears = [];
                $.each(events, function () {
                    var _by = JsonDateStr2Datetime( this.BeginDate);
                    if (evyears.indexOf(_by.getFullYear()) < 0) {
                        evyears.push(_by.getFullYear());
                    }
                });

                for (var _yidx =0;_yidx< evyears.length ; _yidx ++) {
                    $('<option value="' + evyears[_yidx] + '">' + evyears[_yidx] + '</option>').appendTo($eventYearSelect);
                }
                $eventYearSelect.on('change', function () {
                    _changeEventYear($eventYearSelect.val());
                    $eventSelect.trigger('change');
                });
                $eventSelect.on('change', function () {
                    var _sp = $eventSelect.find('>option:selected');
                    current.$dtStart.datetimepicker("date", _sp[0].BeginDate);
                    current.$dtEnd.datetimepicker("date", _sp[0].EndDate);
                });
                _changeEventYear(evyears[0]);
                
                //setTimeout(function () {
                //    current.$element.trigger('loadWraEventsComplete');
                //});
                current.loadWraEvents = true;
                checkInitUiCompleted();
            });

           
            //meter
            //積淹水點位初始
            var _floodPinOptions = $.extend({ map: this.map }, floodPinOptions);
            //_floodPinOptions.useExportCsv = true;
            _floodPinOptions.useExport = function ($_t) {
                var wb = XLSX.utils.table_to_book($_t[0], { raw: false });
                //XLSX.writeFile(wb, '災情清單.ods', { cellStyles: true, compression: true }); //download
                XLSX.writeFile(wb, '災情清單.xlsx', { cellStyles: true, compression: true }); //download
            };
            _floodPinOptions.enabledStatusFilter = true;
            _floodPinOptions.loadInfo = function (dt, callback) {
                return callback(current.currentFloodData);
            };
            $_floodpin.PinCtrl(_floodPinOptions).on($.BasePinCtrl.eventKeys.initUICompleted, function () {
                $('<div class="col-12 col-12"><label>備註:<span class="color-blue">藍色-已退水</span>;<span class="color-red">紅色-未退水</span></label></div>').appendTo($_floodpin);
            });
           
            //積淹水設施初始
            var _facilityPinOptions = $.extend({ map: this.map }, facilityPinOptions);
            _facilityPinOptions.useExportCsv = true;
            _facilityPinOptions.loadInfo = function (dt, callback) {
                return callback(current.currentFacilityData);
            };
            $_facilitypin.PinCtrl(_facilityPinOptions);

            //積淹水區域
            var _floodareaPolygonOption = $.extend({ map: this.map }, floodareaPolygonOption);
            _floodareaPolygonOption.loadInfo = function (dt, callback) {
                window.paintFloodAreaImageGroundOverlay(current._floodAreaImageGroundOverlay, current.currentFloodAreaData, current._currentOpacity, current.$tooltip);
                return callback([]);
            };
            
            $_floodarea.PolygonCtrl(_floodareaPolygonOption).
            on($.BasePinCtrl.eventKeys.pinShowChange, function (evt, _isshow) {
                $.each(current._floodAreaImageGroundOverlay, function () {
                    if (_isshow)
                        this.addTo(current.map);
                    else
                        this.remove();
                });
                //if (_isshow) $_lengend.show(); else $_lengend.hide();
                $_lengend.animate({'right':_isshow ? 6 : -$_lengend.width()}, 400);
            });

            //人工圈繪範圍
            var $_handdrawfloodpinOptions = $.extend({ map: this.map }, floodPinOptions);
            $_handdrawfloodpinOptions.legendIcons= [{ name: NAME.人工圈繪範圍, url:app.siteRoot+ 'images/pin/Flood_r.png', classes: 'red_status' }];
            $_handdrawfloodpinOptions.checkDataStatus=undefined;
            $_handdrawfloodpinOptions.loadInfo = function (dt, callback) {
                return callback(current.currentHandDrawFloodData);
            };
            $_handdrawfloodpin.PinCtrl($_handdrawfloodpinOptions);

            var pinFilterBoundary;
            var paintPinFilterBoundary = function (data, ids, color1,color2) {
                return new window.boundary.LineBoundary({
                    map: current.map, data: data, ids: ids,
                    style: {
                        strokeWeight: 3,
                        strokeColor: color1,
                        icons: [{
                            icon: {
                                path: 'M 0,-1 0,1',
                                strokeOpacity: .8,
                                scale: 1,
                                strokeColor: color2,
                            },
                            offset: '0',
                            repeat: '1px'
                        }]
                    }, autoFitBounds: true
                });
            }
            //確認查詢
            var queryParas = null;
            this.$confirm.on('click', function () {
                //helper.misc.showBusyIndicator(current.$element);
                //current.$confirm.button('loading');
                current.$confirm.addClass('disabled');

                var onlyD = current.$dtStart.datetimepicker('options').format.indexOf('HH:mm') < 0;
                var st = current.$dtStart.datetimepicker("date")._d.DateFormat(onlyD ? "yyyy/MM/dd 00:00:00" : "yyyy/MM/dd HH:mm:00");
                var et = current.$dtEnd.datetimepicker("date")._d.DateFormat(onlyD ? "yyyy/MM/dd 23:59:59" : "yyyy/MM/dd HH:mm:00");
                //var st = current.$dtStart.data("DateTimePicker").date()._d.DateFormat(onlyD?"yyyy/MM/dd 00:00:00":"yyyy/MM/dd HH:mm:00");
                //var et = current.$dtEnd.data("DateTimePicker").date()._d.DateFormat(onlyD ? "yyyy/MM/dd 23:59:59" : "yyyy/MM/dd HH:mm:59");
                //console.log(st);
                //console.log(et);
                //return;
                //st = new Date('2015/09/27');
                //et = new Date('2015/09/29 23:59:59');
                var cid = current.$countySelect.val();
                var datatype = $floodquerydatatypegroup.find('input[name="floodquerydatatypegroup"]:checked').val();

                queryParas = {};
                queryParas.sdt = st;
                queryParas.edt = et;
                queryParas.datatype = datatype;
                queryParas.cid = cid;
                if (queryParas.cid != 0) queryParas.cname = current.$countySelect.find('> option:selected').text();
                queryParas.rvb = current.$rvbriverSelect.rvbRiverSelect('getRvb');
                queryParas.river = current.$rvbriverSelect.rvbRiverSelect('getRiver');

                if ($wraeventsdiv.hasClass('in')) queryParas.eventname = $eventSelect.find('> option:selected').text();



                datahelper.loadFloodComputeForLightweightDatas(st, et, cid, datatype, function (_d) {
                    if (pinFilterBoundary)
                        pinFilterBoundary.clear();
                    pinFilterBoundary = null;
                    if (cid != 0 && cid !=23) { //畫縣市邊界
                        pinFilterBoundary = paintPinFilterBoundary(boundary.data.County, [current.$countySelect.find('option:selected').text()], "#ff0000", "#ff0000");
                    }
                    //helper.misc.hideBusyIndicator(current.$element);
                    //current.$confirm.button('reset');
                    current.$confirm.removeClass('disabled');
                    if (current.$depthSelect) {
                        var _depth = parseInt(current.$depthSelect.val());
                        var _ahouse = current.$affectHouseInput.val()==""?0: parseInt(current.$affectHouseInput.val());
                        var _aarea = current.$affectAreaInput.val() == "" ? 0 : parseInt(current.$affectAreaInput.val());
                        if (_depth != 0) {
                            _d.flood = $.grep(_d.flood, function (f) {return f.DEPTH>=_depth;});
                            _d.floodarea = $.grep(_d.floodarea, function (f) { return f.DEPTH >= _depth; });
                            _d.handdrawflood = $.grep(_d.handdrawflood, function (f) { return f.DEPTH >= _depth; });
                            _d.statistics = $.grep(_d.statistics, function (f) { return f.DEPTH >= _depth;});
                        }
                        if (_ahouse != 0) {
                            var _field = 'AffectHouse';
                            if (_depth == 30)
                                _field = 'AffectHouse30cmUp';
                            else if (_depth == 50)
                                _field = 'AffectHouse50cmUp';
                            _d.flood = $.grep(_d.flood, function (f) { return f[_field] != undefined && f[_field] >= _ahouse; });
                            _d.floodarea = $.grep(_d.floodarea, function (f) { return f[_field] != undefined && f[_field] >= _ahouse; });
                            _d.handdrawflood = $.grep(_d.handdrawflood, function (f) { return f[_field] != undefined && f[_field] >= _ahouse; });
                            _d.statistics = $.grep(_d.statistics, function (f) { return f[_field] != undefined && f[_field] >= _ahouse; });
                        }
                        if (_ahouse != 0) {
                            var _field = 'AffectArea';
                            if (_depth == 30)
                                _field = 'AffectArea30cmUp';
                            else if (_depth == 50)
                                _field = 'AffectArea50cmUp';
                            _d.flood = $.grep(_d.flood, function (f) { return f[_field] != undefined && f[_field] >= _aarea; });
                            _d.floodarea = $.grep(_d.floodarea, function (f) { return f[_field] != undefined && f[_field] >= _aarea; });
                            _d.handdrawflood = $.grep(_d.handdrawflood, function (f) { return f[_field] != undefined && f[_field] >= _aarea; });
                            _d.statistics = $.grep(_d.statistics, function (f) { return f[_field] != undefined && f[_field] >= _aarea; });
                        }
                    }
                  
                    if (current.settings.useRiver && current.$rvbriverSelect.rvbRiverSelect('getSelectBoundPaths')) {
                        var _rp = current.$rvbriverSelect.rvbRiverSelect('getSelectBoundPaths');
                        if (_rp) {
                            _d.flood = $.grep(_d.flood, function (f) {
                                return helper.gis.pointInPolygon([f.X, f.Y], _rp);
                            });
                            _d.floodarea = $.grep(_d.floodarea, function (f) { return helper.gis.pointInPolygon([f.X, f.Y], _rp); });
                            _d.handdrawflood = $.grep(_d.handdrawflood, function (f) { return helper.gis.pointInPolygon([f.X, f.Y], _rp); });
                            _d.statistics = $.grep(_d.statistics, function (f) { return helper.gis.pointInPolygon([f.X, f.Y], _rp); });

                            //畫流域邊界
                            pinFilterBoundary = paintPinFilterBoundary([{ ID: "1", NAME: "XX", Other: "XX", coors: [_rp] }], undefined, "#ff0000", "#ff0000");
                        }
                    }
                    
                    if (cid >= 23) //金門縣
                    {
                        var lnglat = undefined;
                        if (cid == 23)//金門
                            lnglat = new google.maps.LatLng(24.4586, 118.372);
                        else if (cid == 24)
                            lnglat = new google.maps.LatLng(23.6, 119.588);
                        else if (cid == 25)
                            lnglat = new google.maps.LatLng(26.183, 119.964)
                        app.map.setZoom(12);
                        app.map.setCenter(lnglat);
                        //app.map.setZoom(12);
                        //app.map.setCenter(new google.maps.LatLng(24.4586, 118.372));//金門
                        //app.map.setCenter(new google.maps.LatLng(23.6, 119.588)); //澎湖
                        //app.map.setCenter(new google.maps.LatLng(26.183, 119.964)); //馬祖
                    }
                    else if (pinFilterBoundary == null && $("#_twfullext").length > 0) //沒選縣市或流域則全景
                        $("#_twfullext").trigger('click');

                    current.resetFloodData(_d);//20200709

                    //current.currentFloodData = _d.flood;
                    //current.currentFloodAreaData = _d.floodarea;
                    //current.currentHandDrawFloodData = _d.handdrawflood;
                    //current.currentStatisticsData = _d.statistics;

                    //if ($_floodpin.find('.pinswitch').is(':checked'))
                    //    $_floodpin.PinCtrl('reload');
                    //else
                    //    $_floodpin.find('.pinswitch').prop('checked', true).trigger('change');
                    
                    //$_floodarea.PolygonCtrl('reload');
                    //$_handdrawfloodpin.PinCtrl('reload');
                    //current.$element.trigger(FLOOD_QUERY_EVENT.CHANGE_積淹水災情統計表, [current.currentFloodData]).
                    //    trigger(FLOOD_QUERY_EVENT.CHANGE_土地使用區分統計表, [current.currentStatisticsData]);
                });

                datahelper.loadEMISFacilitys(st, et, cid, datatype, function (_d) {
                    console.log('淹水設施點:' + _d.length);
                    current.currentFacilityData = _d;
                    if (current.settings.useRiver && current.$rvbriverSelect.rvbRiverSelect('getSelectBoundPaths')) {
                        var _rp = current.$rvbriverSelect.rvbRiverSelect('getSelectBoundPaths');
                        if (_rp) {
                            current.currentFacilityData = $.grep(current.currentFacilityData, function (f) { return helper.gis.pointInPolygon([f.X, f.Y], _rp); });
                        }
                    }
                    $_facilitypin.PinCtrl('reload');
                    current.$element.trigger(FLOOD_QUERY_EVENT.CHANGE_水利設施統計表, [current.currentFacilityData]);
                });
                current.$element.trigger('query-confirm');
            });


            ////下載整包kmz
            $_ctrl.find('.package-kmz').on('click', function () {
                if (!window.fromEstimateFlood && !queryParas) {
                    alert(' 請先做查詢!!');
                    return;
                }
                var imgs = [];
                $.each(window.floodQueryObj.currentFloodAreaData, function () {
                    if (this.Image_Data) imgs.push(this.Image_Data.Url.replace("/images/", "/data/").replace(".png", ".kmz"));
                });
                var _d = $(this).attr('data-depth');
                var _fname = '';
                if (!window.fromEstimateFlood) {
                    if (queryParas.cname) _fname = queryParas.cname + '-';
                    if (queryParas.rvb) {
                        _fname = queryParas.rvb + '-';
                        if (queryParas.river)
                            _fname += queryParas.river + '-';
                    }
                    if (queryParas.eventname) _fname += queryParas.eventname;
                    else _fname += queryParas.sdt + '-' + queryParas.edt;
                }
                else
                    _fname = '人工災情推估範圍';
                _fname += '-' + _d;

                var $_f = $('<form method="post" action="'+app.CSgdsRoot+'WS/DownloadFloodKml.ashx" class="inline">').appendTo(current.$element);
                $(' <input type="hidden" name="type" value="kmz">').appendTo($_f);
                $(' <input type="hidden" name="fname" value="' + _fname + '">').appendTo($_f);
                $(' <input type="hidden" name="file" value="' + imgs.join(';')+'">').appendTo($_f);
                $(' <input type="hidden" name="depth" value="' + _d + '">').appendTo($_f);
                $_f.submit().remove();
                //var $_a = $('<a href="' + _kmzurl + '">').appendTo(current.$element);
                //$_a[0].click();
                //$_a.remove();
            });

            this.isInitUiCompleted = true;
            checkInitUiCompleted();

            $(document).on('click', '.jsPanel-FloodStatisticsPanel .jsPanel-hdr-r-btn-close,.jsPanel-FacilityStatisticsPanel .jsPanel-hdr-r-btn-close, .jsPanel-LandUseDistrictStatisticsPanel .jsPanel-hdr-r-btn-close', function (e, s) {
                var _id = $(this).closest('.jsPanel').find('.popu-ctrl-content').attr('id');
                current.$element.find('.pinctrl input[data-trigger="' + _id + '"]').prop('checked', false);
            });
            //current.$element.trigger('initUiCompleted');
        },
        resetFloodData: function (_d) { //可於人工批次匯入用呼叫
            var current = this;
            current.currentFloodData = [];
            current.currentFloodAreaData = [];
            current.currentHandDrawFloodData = [];
            current.currentStatisticsData = [];
            if (_d) {
                current.currentFloodData = _d.flood;
                current.currentFloodAreaData = _d.floodarea;
                current.currentHandDrawFloodData = _d.handdrawflood;
                current.currentStatisticsData = _d.statistics;
            }

            var $_floodpin = this.$element.find('.floodpin-dom');
            var $_floodarea = this.$element.find('.floodarea-dom');
            var $_handdrawfloodpin = this.$element.find('.handdrawfloodpin-dom');

            if ($_floodpin.find('.pinswitch').is(':checked'))
                $_floodpin.PinCtrl('reload');
            else
                $_floodpin.find('.pinswitch').prop('checked', true).trigger('change');

            $_floodarea.PolygonCtrl('reload');
            $_handdrawfloodpin.PinCtrl('reload');
            current.$element.trigger(FLOOD_QUERY_EVENT.CHANGE_積淹水災情統計表, [current.currentFloodData]).
                trigger(FLOOD_QUERY_EVENT.CHANGE_土地使用區分統計表, [current.currentStatisticsData]);
        },
        show: function (_isshow) {
            $.each(this.villageLayer, function () {
                this.setMap(_isshow ? app.map : null);
            });
        },
        setOpacity: function (_opacity) {
            this._currentOpacity = _opacity;
            $.each(this._floodAreaImageGroundOverlay, function () {
                this.setOpacity(_opacity);
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

var NAME = {
    積淹水點位: '積淹水點位',
    積淹水設施: '水利設施',
    積淹水區域: '推估積淹水範圍',
    人工圈繪範圍: '人工圈繪範圍',

};

var floodPinOptions = {
    //map: this.map,
    stTitle: function (d) { return d.NOTIFICATION_Data.LOCATION_DESCRIPTION ? d.NOTIFICATION_Data.LOCATION_DESCRIPTION : '-' },
    name: NAME.積淹水點位, useLabel: false, useList: true,
    pinInfoLabelMinWidth:'66px',
    /**{field:'',title:'',formatter: function (value, row) {return value},showInInfo:true,showInList:true},  //map infoWindow及清單欄位資訊**/
    infoFields: [
        //{ field: 'PK_ID', title: '序號', showInInfo: false },
        { field: 'Org_Name', title: '災點分區', align: 'center', class:'text-nowrap'},
        { field: 'COUNTY_NAME', title: '縣市', showInInfo: false, align: 'center', class: 'text-nowrap' },
        { field: 'TOWN_NAME', title: '行政區', showInInfo: false, showInList: !window.floodPinSimpleInfo, align: 'center', class: 'text-nowrap'},
        { field: 'GridId', title: '行政區', showInList: false, formatter: function (v, row) { return row.COUNTY_NAME + row.TOWN_NAME } },
        { field: 'DEPTH', title: '淹水深度', showInList: true, unit: '公分', align:'center', formatter: function (v, row) { return v == undefined || v < 0 ? '---' : v } },
        { field: 'DATE', title: '通報時間', formatter: function (v, row) { return JsonDateStr2Datetime(v).DateFormat('yyyy/MM/dd HH:mm:ss') } },
        { field: 'LOCATION_DESCRIPTION', title: '災害地點', showInList: false },
        { field: 'Described', title: '描述' },
        { field: 'X', title: 'X座標', showInInfo: false, showInList: !window.floodPinSimpleInfo },
        { field: 'Y', title: 'Y座標', showInInfo: false, showInList: !window.floodPinSimpleInfo },
        { field: 'IS_RECESSION', title: '狀況', showInList: false, formatter: function (v, row) { return v ? '已退水' : '未退水' } },
        { field: 'AffectHouse', title: '影響戶數', showInInfo: false, showInList: !window.floodPinSimpleInfo, align: 'center', formatter: function (v, row) { return helper.format.formatNumber(v, 0); } },
        { field: 'AffectArea', title: '影響面積(平方公尺)', showInInfo: false, align: 'right', showInList: !window.floodPinSimpleInfo, formatter: function (v, row) { return helper.format.formatNumber(v, 0); } },
        { field: 'AffectHouse30cmUp', title: '影響戶數(30cm↑)', showInInfo: false, align: 'right', showInList: !window.floodPinSimpleInfo, formatter: function (v, row) { return helper.format.formatNumber(v, 0); } },
        { field: 'AffectArea30cmUp', title: '影響面積(30cm↑)', showInInfo: false, align: 'right', showInList: !window.floodPinSimpleInfo, formatter: function (v, row) { return helper.format.formatNumber(v, 0); } },
        { field: 'AffectHouse50cmUp', title: '影響戶數(50cm↑)', showInInfo: false, align: 'right', showInList: !window.floodPinSimpleInfo, formatter: function (v, row) { return helper.format.formatNumber(v, 0); } },
        { field: 'AffectArea50cmUp', title: '影響面積(50cm↑)', showInInfo: false, align: 'right', showInList: !window.floodPinSimpleInfo, formatter: function (v, row) { return helper.format.formatNumber(v, 0); } }
    ],
    loadBase: function (callback) { callback([]) },
    pinInfoContent: function (data) {
        var current = this;
        var _gencontent = function (_contents) {
            var constr = '';
            constr = "<table>";
            $.each(_contents, function () {
                constr += '<tr><td ' + (current.settings.pinInfoLabelMinWidth ? 'style="min-width: ' + current.settings.pinInfoLabelMinWidth + ';"' : "") + '><span  ><b>' + this[0] + '</b></span></td><td>' +
                    '<span>' + this[1] + "</span></td></tr>";
            });
            constr += "</table>";
            return '<div class="meterInfoTemplateContent">' + constr + '</div>';
        };
        //console.log(JSON.stringify(data));
        var gid = helper.misc.geguid();
        var $_root = $('<div><div id="id_' + gid + '" class="flood-query-infowindow tabs-below"></div></div>').find('> .flood-query-infowindow');


        var $_content = $('<div class="tab-content">').appendTo($_root);
        var $_base = $('<div role="tabpanel" class="tab-pane  show active" id="base_' + gid + '"></div>').appendTo($_content);
        var $_affect = $('<div role="tabpanel" class="tab-pane affect-container" id="affect_' + gid + '"></div>').appendTo($_content);
        var $_land = $('<div role="tabpanel" class="tab-pane " id="land_' + gid + '"></div>').appendTo($_content);

        var $_ul = $('<ul class="nav nav-tabs" role="tablist">').appendTo($_root);
        if (window.rtdisaster)//僅及時災情RtDisaster.html
            $_ul.hide();
        $('<li role="presentation" class="rt-temp nav-item"><a class="nav-link active" href="#base_' + gid + '" role="tab" data-toggle="tab" data-bs-toggle="tab">災點資訊</a></li>').appendTo($_ul);
        $('<li role="presentation" class="nav-item"><a class="nav-link" href="#affect_' + gid + '" role="tab" data-toggle="tab" data-bs-toggle="tab">影響戶數</a></li>').appendTo($_ul);
        $('<li role="presentation" class="nav-item"><a class="nav-link" href="#land_' + gid + '" role="tab" data-toggle="tab" data-bs-toggle="tab">土地利用</a></li>').appendTo($_ul);

        //setTimeout(function () {
        //    alert($('#id_' + gid + ' .nav-tabs > li:first-child>a').length);
        //    alert('#id_' + gid + ' .nav-tabs > li:first-child>a');
        //    $('#id_' + gid + ' .nav-tabs > li:first-child>a').trigger('click');
        //    bootstrap.Tab.getInstance($('#id_' + gid + ' .nav-tabs > li:first-child>a')[0]).show();
        //},400)

        var $_sensor;
        if (window.rtdisaster && data.NOTIFICATION_Data.SourceCode && data.NOTIFICATION_Data.SourceCode == 7) {//僅及時災情RtDisaster.html
            $_sensor = $('<div role="tabpanel" class="tab-pane " id="sensor_' + gid + '"></div>').appendTo($_content);
            $('<li role="presentation" class="rt-temp"><a href="#sensor_' + gid + '" role="tab" data-toggle="tab">感測歷線</a></li>').appendTo($_ul);
            $_ul.find('li').hide();
            $_ul.find('li.rt-temp').removeClass('rt-temp').show();
            $_ul.show();
            setTimeout(function () {
                var $_t = $('#id_' + gid);
                var __tmep = false;
                $_t.on('shown.bs.tab', function () {
                    var $_p = $_t.find('#sensor_' + gid + '.active').height('152px');
                    if ($_p.length == 1 && !__tmep) {
                        __tmep = true;
                        helper.misc.showBusyIndicator($_p);
                        datahelper.getFHYFloodSensorInfoLast24Hours_Address(data.NOTIFICATION_Data.LOCATION_DESCRIPTION, function (_ds) {
                            if (_ds) {
                                _ds = _ds.sort(function (a, b) { return JsonDateStr2Datetime(a.SourceTime).getTime() - JsonDateStr2Datetime(b.SourceTime).getTime(); });
                            }
                            helper.misc.hideBusyIndicator($_p);
                            var seriesdef = {
                                level: {
                                    name: '水深', color: '#0000FF', type: 'line', dt: 'SourceTime', info: 'Depth', unit: 'cm'
                                }, warn: [{ name: '警戒', color: '#FF0000', info: 10 }], wave: { enabled: true }
                            }
                            charthelper.showMeterChart($_p, undefined, _ds, '', '水深(cm)', 0, seriesdef, function (chartoptions) {
                                chartoptions.legend.enabled = false;
                            });
                        });
                    }
                });
            });
        }
        $_href_flood_data = $('<div class="href-flood-data">').appendTo($_root);


        $('<img id="' + gid+'_pegman"  src="'+app.siteRoot+'images/pegman_gray.png" class="pegman-icon" style="width:16px;height:16px;cursor:pointer;" title="街景">').appendTo($_href_flood_data);
        setTimeout(function () {
            $('#' + gid +'_pegman').on('click', function () {
                var _w = 460, _h = 360;
                var _left = (document.body.clientWidth - _w) / 2 + window.screenLeft + document.body.scrollLeft;
                var _top = (document.body.clientHeight - _h) / 2 + window.screenTop + document.body.scrollTop;
                window.open(app.CSgdsRoot + 'GoogleStreetView.html?v=' + Date.now() + '&lat=' + data.Y + '&lng=' + data.X
                    , 'streetview', 'width = ' + _w + ', height = ' + _h + ', directories = no, location = no, menubar = no, scrollbars = no, status = no, toolbar = no, addressbar = no, location = no, resizable = no, screenX = ' + _left + ', screenY = ' + _top);
                return false;
            });
        });

        if (data.NOTIFICATION_Data.Image || data.NOTIFICATION_Data.Movie) {
            var $_imageHref = $('<div class="glyphicon glyphicon-picture" title="圖片、影像"></div>').appendTo($_href_flood_data);
            setTimeout(function () {
                /*$('.googleContentFix  > .flood-query-infowindow > .href-flood-data > .glyphicon-picture').off('click').on('click',function(){*/
                $('#id_' + gid +' > .flood-query-infowindow > .href-flood-data > .glyphicon-picture').off('click').on('click', function () {
                    var _tabpanel_headers = [];
                    var _tabpanel_contents = [];
                    if(data.NOTIFICATION_Data.Image){
                        var _images = data.NOTIFICATION_Data.Image.split(',');
                        var _imgDoms = $.map(_images, function (_img, _idx) {
                            return '<img src="https://fhy.wra.gov.tw/ReservoirPage_2011' + _img + '" style="margin: 0 auto;max-width:80%">';
                        });
                        var _imgCaptions = $.map(_images, function (_img, _idx) {
                            return _idx + "";
                        });
                        var $_carousel = helper.bootstrap.genBootstrapCarousel(null, null, null, _imgDoms, _imgCaptions);
                        _tabpanel_headers.push("災情圖片");
                        _tabpanel_contents.push($_carousel.wrapAll('<div>').parent().html());
                    }


                    if (data.NOTIFICATION_Data.Movie) {
                        var _movie = data.NOTIFICATION_Data.Movie.split(',');
                        var _hrefs = $.map(_movie, function (_m, _idx) {
                            return '<div style="text-align: center;"><a href="https://fhy.wra.gov.tw/ReservoirPage_2011' + _m + '">災情影片_' + _idx + '</a></div>';
                        });
                        _tabpanel_headers.push('災情影片');
                        _tabpanel_contents.push("<br>" + _hrefs.join("<br>")+'<br>');
                    }

                    var $_tabpanel = helper.bootstrap.genBootstrapTabpanel(null, null, null, _tabpanel_headers, _tabpanel_contents);
                    helper.jspanel.jspAlertMsg(null, { title: current.settings.stTitle(data), autoclose: 9999999, theme: 'info', content: $_tabpanel.html() });
                });
            });
        }

        if (data.Image_Data != null)
        {
            var uriStr = data.Image_Data.Url.replace("/images/", "/data/").replace(".png", ".kmz");

            $('<img src="'+app.siteRoot+'images/All_kmz.png" class="kmz-export glyphicon-export"" data-depth="0" title="kmz下載">').appendTo($_href_flood_data);
            $('<img src="' + app.siteRoot +'images/30_kmz.png" class="kmz-export glyphicon-export"" data-depth="30" title="kmz下載30cm以上">').appendTo($_href_flood_data);
            $('<img src="' + app.siteRoot +'images/50_kmz.png" class="kmz-export glyphicon-export"" data-depth="50" title="kmz下載50cm以上">').appendTo($_href_flood_data);
            //var $_dowloapkml = $('<a class="dowloap-kmz" href="' + uriStr + '">kmz下載</a>').appendTo($_href_flood_data);
            var rfn = current.settings.stTitle(data);
            if (rfn == '-') rfn = '下載';
            if (rfn.length > 36) rfn = rfn.substr(0, 36);
            var _kmz = app.CSgdsRoot+'WS/DownloadFloodKml.ashx?type=kmz&file=' + uriStr ;
            var $_dowloapkml = $('<a class="dowloap-kmz" href="' + _kmz + '">kmz下載</a>').appendTo($_href_flood_data);
           //WS/DownloadFloodKml.ashx?type=kml
            setTimeout(function () {
                $('.flood-query-infowindow > .href-flood-data > .kmz-export').off('click').on('click', function () {
                    var _d = $(this).attr("data-depth");
                    var sdsad=$(this).parent().find('a');
                    $(this).parent().find('a').attr('href', _kmz + '&depth='+_d+'&fname=' + rfn + '_'+_d) [0].click();
                });
            });
        }
       
        $($.BasePinCtrl.defaultSettings.pinInfoContent.call(this, data, this.infofields)).appendTo($_base);
        var _affect = [['積淹水計算基礎(水深/高程)', (data.NOTIFICATION_Data.DEPTH == -999 ? '-' : data.NOTIFICATION_Data.DEPTH / 100) + '公尺/' + helper.format.formatNumber( (data.Z_D - (data.NOTIFICATION_Data.DEPTH == -999 ? 0 : data.NOTIFICATION_Data.DEPTH/100)),2)+"公尺"],
            ['積淹水範圍', !data.AffectStat ? '-' : (helper.format.formatNumber(data.AffectStat.TotalArea, 0) + '平方公尺(' + helper.format.formatNumber(data.AffectStat.TotalArea / 10000, 2) + '公頃)')],
            ['積淹水戶數', !data.AffectStat ? '-' : (data.AffectStat.TotalHouse + '戶')],
            ['30公分以上積淹水範圍', !data.AffectStat ? '-' : (helper.format.formatNumber(data.AffectStat.TotalArea30cmUp, 0) + '平方公尺(' + helper.format.formatNumber(data.AffectStat.TotalArea30cmUp / 10000, 2) + '公頃)')],
            ['30公分以上積淹水戶數', !data.AffectStat ? '-' : (data.AffectStat.TotalHouse30cmUp + '戶')],
            ['50公分以上積淹水範圍', !data.AffectStat ? '-' : (helper.format.formatNumber(data.AffectStat.TotalArea50cmUp, 0) + '平方公尺(' + helper.format.formatNumber(data.AffectStat.TotalArea50cmUp / 10000, 2) + '公頃)')],
            ['50公分以上積淹水戶數', !data.AffectStat ? '-' : (data.AffectStat.TotalHouse50cmUp + '戶')]];
        $(_gencontent(_affect)).appendTo($_affect);
        var _land = [];
        $.each(datahelper.getLandUseType(), function (_idx, _ld) {
            var _r = '-';
            if (data.Land) {
                var _ls = $.grep(data.Land, function (_l) {
                    return _ld.Id == _l.Id;
                });
                if (_ls.length > 0) {
                    _r = _ls[0].Area;
                    _r = helper.format.formatNumber(_r, 0) + '平方公尺(' + helper.format.formatNumber(_r/10000,2) + '公頃)';
                }
            }
            _land.push([this.Name, _r]);
        });
        $(_gencontent(_land)).appendTo($_land);
       
        return $_root.parent().html();
    },
    checkDataStatus: function (data, index) {
        if (data.NOTIFICATION_Data.SourceCode && data.NOTIFICATION_Data.SourceCode == 7)
            return data.NOTIFICATION_Data.IS_RECESSION ? this.settings.legendIcons[2] : this.settings.legendIcons[3];
        else
            return data.NOTIFICATION_Data.IS_RECESSION ? this.settings.legendIcons[0]:this.settings.legendIcons[1];
    },
    /** { 'name': '一級', 'url': 'Images/水位站-r.png',classes:'' }**/
    //legendIcons: [{ name: '已退水', url: app.CSgdsRoot + 'images/Flood_b.png', classes: 'blue_status' }, { name: '未退水', url: app.siteRoot + 'images/Flood_p.png', classes: 'red_status' }],
    legendIcons: [
        { name: '<span class="offdisplay">通報災點-已退水</span>', url: app.siteRoot + 'images/pin/Flood_b.png', classes: 'blue_status' },
        { name: '通報災點', url: app.siteRoot + 'images/pin/Flood_p.png', classes: 'red_status' },
        { name: '<span class="offdisplay">淹水感測-已退水</span>', url: app.siteRoot + 'images/pin/Flood_b_7.png', classes: 'blue_status' },
        { name: '淹水感測', url: app.siteRoot + 'images/pin/Flood_r_7.png', classes: 'red_status' }],
    transformData: function (_base, _info) {
       
        _info.sort(function (a, b) {
            var av = a.IS_RECESSION ? 0 : 1, bv = b.IS_RECESSION?0:1;
            return bv - av; //清單淹水的在前面
        });
        window.pinGoogleMaxZIndex += _info.length;
        $.each(_info, function (idx, d) { //淹水的pin pinZIndex越大，才會在上面
            d.pinZIndex = window.pinGoogleMaxZIndex - idx;
        });
        return _info;
    },
};

var floodPinStageLegendIcons = [
    { name: '30cm↓', url: app.siteRoot + 'images/stagefloodpin/黃.png', classes: 'yellow_status' },
    { name: '30~50cm', url: app.siteRoot + 'images/stagefloodpin/橘.png', classes: 'orange_status' },
    { name: '50cm↑', url: app.siteRoot + 'images/stagefloodpin/紅.png', classes: 'red_status' }];

var floodPinStagecheckDataStatus = function (data, index) {
    var r = floodPinStageLegendIcons[0];
    if (data.NOTIFICATION_Data.DEPTH) {
        if (data.NOTIFICATION_Data.DEPTH >= 50)
            r = floodPinStageLegendIcons[2];
        else if (data.NOTIFICATION_Data.DEPTH >= 30)
            r = floodPinStageLegendIcons[1];
    }
    return r;
};

var facilityPinOptions = {
    stTitle: function (d) { return d.SITUATION_NOTE ? d.SITUATION_NOTE : '-' },
    name: NAME.積淹水設施, useLabel: false, useList: true,
    /**{field:'',title:'',formatter: function (value, row) {return value},showInInfo:true,showInList:true},  //map infoWindow及清單欄位資訊**/
    infoFields: [
        { field: 'Org_Name', title: '所屬機關' },
        { field: 'TOWN_NAME', title: '鄉鎮' },
        { field: 'EMISTYPE', title: '類別' },
        { field: 'DATE', title: '日期' },
        { field: 'SITUATION_NOTE', title: '災情描述' },
        { field: 'EMISSTATUS', title: '狀況' }
    ],
    loadBase: function (callback) { callback([]) },
    legendIcons: [{ name: '搶修險完成', url: app.siteRoot + 'images/pin/搶修險完成.png', classes: 'red_status' }, { name: '搶修險中', url: app.siteRoot + 'images/pin/搶修險中.png', classes: 'blue_status' }],
    checkDataStatus: function (data, index) {
        return data.EMISSTATUS == '搶修險完成' ? this.settings.legendIcons[0] : this.settings.legendIcons[1];
    }
};

var floodareaPolygonOption = {
    stTitle: function (d) { return '-' },
    name: NAME.積淹水區域, useLabel: false, useList: false,
    loadBase: function (callback) { callback([]) },
};




(function (window) {
    var paintFloodAreaImageGroundOverlay = function (_floodAreaImageGroundOverlay, _currentFloodAreaData, _currentOpacity, $_tooltip) {

        if (window.google) {
            $.each(_floodAreaImageGroundOverlay, function () {
                for (var i = 0; i < this.listeners__.length; i++) {
                    google.maps.event.removeListener(this.listeners__[i]);
                }
                this.setMap(null);
            });
            _floodAreaImageGroundOverlay.splice(0, _floodAreaImageGroundOverlay.length);

            $.each(_currentFloodAreaData, function () {
                var _calcData = this;
                if (this.Image_Data && this.Image_Data.Url) {
                    var _url = app.CSgdsRoot + this.Image_Data.Url;
                    var _imageBounds = { north: this.Image_Data.MaxY, south: this.Image_Data.MinY, west: this.Image_Data.MinX, east: this.Image_Data.MaxX };
                    var _newOverlay = new google.maps.GroundOverlay(_url, _imageBounds, { map: app.map, opacity: _currentOpacity });
                    _floodAreaImageGroundOverlay.push(_newOverlay);
                    _newOverlay.listeners__ = [
                        google.maps.event.addListener(_newOverlay, "mouseover", function (e) {
                            if (!_newOverlay._DEM_load) {
                                _newOverlay._DEM_load = true;
                                var _d = $.extend({}, _calcData.NOTIFICATION_Data);
                                if (_d.CREATE_DATE) _d.CREATE_DATE = JsonDateStr2Datetime(_d.CREATE_DATE);
                                datahelper.loadDEMCalculateData(_d, function (_d) {
                                    var _dems = [];
                                    var _strs = _d.split(';');
                                    $.each(_strs, function () {
                                        var _dds = this.split(',');
                                        _dems.push({ lng: parseFloat(_dds[0]), lat: parseFloat(_dds[1]), z: parseFloat(_dds[2]), d: parseFloat(_dds[3]) });
                                    });
                                    _newOverlay._DEM = _dems;
                                    if (_newOverlay.latLng__)
                                        _showDemToolTipbyLatLng($_tooltip, _newOverlay._DEM, _newOverlay.latLng__);
                                });
                            }
                        }),
                        google.maps.event.addListener(_newOverlay, "mousemove", function (mEvent) {
                            if (_newOverlay._DEM) {
                                _showDemToolTipbyLatLng($_tooltip, _newOverlay._DEM, mEvent.latLng);
                            }
                            else {
                                _showDemToolTip($_tooltip, getScreenPixelPoint(app.map, mEvent.latLng), '載入DEM...', true);
                                _newOverlay.latLng__ = mEvent.latLng;//紀錄點位，抓完DEM及時show
                            }

                        }),
                        google.maps.event.addListener(_newOverlay, "mouseout", function (mEvent) {
                            _showDemToolTip($_tooltip, null, null, false);
                            _newOverlay.latLng__ = undefined;
                        })
                    ];

                }
            });
        } else { //leaflet
            var removeImageGroundOverlay = _floodAreaImageGroundOverlay.slice(0);
            //if (!_currentFloodAreaData) { //空值，直接清除所有ImageGroundOverlay
                $.each(removeImageGroundOverlay, function () {
                    this.remove();
                });
            //}

            var fds = $.isArray(_currentFloodAreaData) ? _currentFloodAreaData : [_currentFloodAreaData];
            //console.log(fds);
            _floodAreaImageGroundOverlay.splice(0, _floodAreaImageGroundOverlay.length);
            var _loadcount = 0;
            $.each(fds, function () {
                var _calcData = this;
                //console.log(JSON.stringify(_calcData));
                if (this.Image_Data && this.Image_Data.Url) {
                    var _url = app.CSgdsRoot + this.Image_Data.Url;
                    var _imageBounds = L.latLngBounds(L.latLng(this.Image_Data.MaxY, this.Image_Data.MaxX), L.latLng(this.Image_Data.MinY, this.Image_Data.MinX))// { north: this.FloodAreaImage.Maxy, south: this.FloodAreaImage.Miny, west: this.FloodAreaImage.Minx, east: this.FloodAreaImage.Maxx };
                    var _newOverlay = L.imageOverlay(_url, _imageBounds, { interactive: true, zIndex:201}).addTo(app.map).on('load', function () {
                        _loadcount++;
                        if (_loadcount == fds.length) {
                            $.each(removeImageGroundOverlay, function () {
                                this.remove();
                            });
                        }
                    });
                    _newOverlay.fdata = this;
                    _newOverlay.on('mouseover', function (evt) {
                        if (!_newOverlay._DEM_load) {
                            _newOverlay._DEM_load = true;
                            var _d = $.extend({}, _calcData.NOTIFICATION_Data);
                            if (_d.CREATE_DATE) _d.CREATE_DATE = JsonDateStr2Datetime(_d.CREATE_DATE);
                            console.log(JSON.stringify(_d));
                            datahelper.loadDEMCalculateData(_d, function (_d) {
                                var _dems = [];
                                var _strs = _d.split(';');
                                $.each(_strs, function () {
                                    var _dds = this.split(',');
                                    _dems.push({ lng: parseFloat(_dds[0]), lat: parseFloat(_dds[1]), z: parseFloat(_dds[2]), d: parseFloat(_dds[3]) });
                                });
                                _newOverlay._DEM = _dems;
                                if (_newOverlay.latLng__)
                                    _showDemToolTipbyLatLng($_tooltip, _newOverlay._DEM, _newOverlay.latLng__);
                            });
                        }
                    });
                    _newOverlay.on("mousemove", function (mEvent) {
                        if (_newOverlay._DEM) {
                            //_showDemToolTipbyLatLngPixelPoint($_tooltip, _newOverlay._DEM, { lng: mEvent.latlng.lng, lat: mEvent.latlng.lat, x: mEvent.originalEvent.screenX, y: mEvent.originalEvent.screenY });
                            _showDemToolTipbyLatLng($_tooltip, _newOverlay._DEM, mEvent.latlng);
                        }
                        else {
                            _showDemToolTip($_tooltip, getScreenPixelPoint(app.map, mEvent.latlng), '載入DEM...', true);
                            //_showDemToolTip($_tooltip, { x: mEvent.originalEvent.screenX, yx: mEvent.originalEvent.screenY }, '載入DEM...', true);
                            _newOverlay.latLng__ = mEvent.latlng;//紀錄點位，抓完DEM及時show
                        }

                    })
                    _newOverlay.on('mouseout', function (evt) {
                        _showDemToolTip($_tooltip, null, null, false);
                    });
                    _floodAreaImageGroundOverlay.push(_newOverlay);
                }
            });
        }
        //return callback([]);
    };
    //呈現座標所屬DEM資訊
    var xdis = 0.000052925 * 5 / 10;   //0.000052925原10m的值
    var ydis = 0.00004865 * 5 / 10;        //0.00004865原10m的值
    var _showDemToolTipbyLatLng = function ($_tooltip, _dem, _latlng) {
        var _x = _latlng.lng || _latlng.lng();
        var _y = _latlng.lat || _latlng.lat();
        var _inarea = false;
        $.each(_dem, function () {
            if (this.lng - xdis <= _x && this.lng + xdis >= _x && this.lat - ydis <= _y && this.lat + ydis >= _y) {
                _showDemToolTip($_tooltip, getScreenPixelPoint(app.map, _latlng), '經度:' + this.lng + '<br>緯度:' + this.lat +
                    '<br>高程:' + this.z.toFixed(2) + '<br>水深:' + this.d.toFixed(2)+"M", true);
                _inarea = true;
                return false;
            }
        });
        if (!_inarea) _showDemToolTip($_tooltip, null, null, false);
    }

    var _showDemToolTiptimer;
    //show tooltip
    var _showDemToolTip = function ($_tooltip, _point, _msg, _isshow) {
        clearTimeout(_showDemToolTiptimer);
        _showDemToolTiptimer = setTimeout(function () {
            if (_isshow) {
                var wiw = window.innerWidth;

                var p = wiw - _point.x > 120 ? "right" : "left";
                $_tooltip.attr("title", _msg);
                $_tooltip.css({ top: _point.y, left: _point.x + (p == "right" ? 14 : 0) }).tooltip('dispose').tooltip({
                    customClass: 'deminfo',
                    html: true,
                    //offset: [_point.x, _point.y],
                    placement: function (mdom, tdom) {
                        return p;
                    }
                }).tooltip('show');
            }
            else
                $_tooltip.tooltip('hide');
        }, 10);
    };

    var getScreenPixelPoint = function (_map, _latLng) {
        if (whatMap(_map) == "leaflet") {
            var _p = _map.latLngToContainerPoint(_latLng);
            _p.y += 63;
            return _p;
        }
        var numTiles = 1 << _map.getZoom();
        var projection = _map.getProjection();
        var worldCoordinate = projection.fromLatLngToPoint(_latLng);
        var pixelCoordinate = new google.maps.Point(
                worldCoordinate.x * numTiles,
                worldCoordinate.y * numTiles);

        var topLeft = new google.maps.LatLng(
            _map.getBounds().getNorthEast().lat(),
            _map.getBounds().getSouthWest().lng()
        );

        var topLeftWorldCoordinate = projection.fromLatLngToPoint(topLeft);
        var topLeftPixelCoordinate = new google.maps.Point(
                topLeftWorldCoordinate.x * numTiles,
                topLeftWorldCoordinate.y * numTiles);

        return new google.maps.Point(
                pixelCoordinate.x - topLeftPixelCoordinate.x,
                pixelCoordinate.y - topLeftPixelCoordinate.y
        )
    }
    window.paintFloodAreaImageGroundOverlay=paintFloodAreaImageGroundOverlay;

})(window);