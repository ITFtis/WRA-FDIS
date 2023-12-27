
(function ($) {
    'use strict';
    var pluginName = 'handDrawFlood';

    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = { map: undefined };
        this.map = undefined;

        this.$floodDt = undefined;
        this.$describedInput = undefined;
        this.$dethInput = undefined;
        this.$contactInput = undefined;
        this.$orgNameInput = undefined;

        this.$surveyAffectHousehold = undefined;
        this.$floodingLoss = undefined;
        this.$remarkInput = undefined;

        this.$addressGeocode = undefined;
        this.$drawAreaStartBtn = undefined;
        this.$drawAreaEraseBtn = undefined;

        this.$areaMsg = undefined;
        this.$coorMsg = undefined;
        this.$errorMsg = undefined;

        this.disasterInfo = undefined;

        this.floodAreaPolygon = undefined;

        this.$tooltip = undefined;
        //結果呈現用
        this.$floodpin = undefined;
        this.calFloodImageOverlay = [];
        this.currentFloodData =[];
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

        },
        initUi: function () {
            var current = this;//.$element;
            var filed_length = 'col-xs-4 col-4';
            var value_length = 'col-xs-8 col-8';
            var $_ctrl = $('<div class="hand-draw-flood">').appendTo(current.$element);

            var $_c = $('<div class="col-md-12"><div class="col-md-3"></div><div class="col-md-12"></div></div>').appendTo($_ctrl);
            //this.$floodDt = $('<div class="row col-md-12"><label class="' + filed_length + ' col-field"">發生時間</label><div class="col-value input-group ' + value_length + '"><input type="text" class="form-control" /><span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span></div></div>').appendTo($_ctrl).find('.input-group');
            this.$floodDt = $('<div class="row col-md-12"><label class="' + filed_length + ' col-field"">發生時間</label><div id="f-dt" class="col-value ' + value_length + ' input-group date datetimeul datepick" data-target-input="nearest"><input type="text" class="form-control datetimepicker-input" data-target="#f-dt"><div class="input-group-addon input-group-append" data-target="#f-dt" data-toggle="datetimepicker"><span class="input-group-text"><i class="glyphicon glyphicon-calendar"></i></span></div></div></div>').appendTo($_ctrl).find('.input-group');
            this.$addressGeocode = $('<div class="row col-md-12"><label class="' + filed_length + ' col-field">發生地點</label><div class="col-value ' + value_length + '"></div></div>').appendTo($_ctrl).find('.col-value');
            this.$drawAreaStartBtn = $('<div class="row col-md-12"><label class="' + filed_length + ' col-field">發生範圍</label><div class="col-value ' + value_length + '"><span class="btn btn-default glyphicon glyphicon-edit"></span><span class="btn btn-default glyphicon glyphicon-erase"></span><span class="area-msg"></span></div></div>').appendTo($_ctrl).find('.glyphicon-edit');
            this.$drawAreaEraseBtn = this.$drawAreaStartBtn.siblings('.glyphicon-erase').attr('title', '清除');
            this.$areaMsg = this.$drawAreaStartBtn.siblings('.area-msg').css('display', 'block');
            this._initDrawFloodAreaPolygonCtrl();

            this.$describedInput =$('<div class="row col-md-12"><label class="' + filed_length + ' col-field">災情描述</label><div class="col-value ' + value_length + '"><input type="text"  class="form-control"></div></div>').appendTo($_ctrl).find('input');
            this.$dethInput =$('<div class="row col-md-12 col-large-field"><label class="' + filed_length + ' col-field">淹水深度<br>(公分)</label><div class="col-value ' + value_length + '"><input type="text"  class="form-control"></div></div>').appendTo($_ctrl).find('input');
            this.$surveyAffectHousehold = $('<div class="row col-md-12 col-large-field"><label class="' + filed_length + ' col-field">調查淹水戶數</label><div class="col-value ' + value_length + '"><input type="text"  class="form-control"></div></div>').appendTo($_ctrl).find('input');
            this.$floodingLoss = $('<div class="row col-md-12 col-large-field"><label class="' + filed_length + ' col-field">調查淹水損失<br>(萬)</label><div class="col-value ' + value_length + '"><input type="text"  class="form-control"></div></div>').appendTo($_ctrl).find('input');
            this.$contactInput = $('<div class="row col-md-12 col-large-field"><label class="' + filed_length + ' col-field">資料輸入人員</label><div class="col-value ' + value_length + '"><input type="text"  class="form-control"></div></div>').appendTo($_ctrl).find('input');
            this.$orgNameInput = $('<div class="row col-md-12"><label class="' + filed_length + ' col-field">所屬機關</label><div class="col-value ' + value_length + '"><input type="text"  class="form-control"></div></div>').appendTo($_ctrl).find('input');
            this.$remarkInput = $('<div class="row col-md-12"><label class="' + filed_length + ' col-field">備註</label><div class="col-value ' + value_length + '"><input type="text"  class="form-control"></div></div>').appendTo($_ctrl).find('input');

            var $floodquerydatatypegroup = $('<div class="row col-md-12"><label class="' + filed_length + ' col-field"">資料型態</label><div class="col-value data-type-group ' + value_length + '"></div></div>').appendTo($_ctrl).find('.data-type-group');
            var $btnCtrl= $('<div class="row col-md-12 btn-ctrl"><div class="col-6"><span class="glyphicon glyphicon-ok btn btn-success">送出災情</span></div><div class="col-6"><span class=" glyphicon glyphicon-remove btn btn-warning">取 消</span></div></div>').appendTo($_ctrl);

            this.$confirmBtn = $btnCtrl.find('.glyphicon-ok');
            this.$cancelBtn = $btnCtrl.find('.glyphicon-remove');

            $('<label><input type="radio" name="floodquerydatatypegroup" value="0" checked/>非測試</label>').appendTo($floodquerydatatypegroup);
            $('<label><input type="radio" name="floodquerydatatypegroup" value="1" />測試</label>').appendTo($floodquerydatatypegroup);

            this.$errorMsg = $('<div class="row col-md-12">').appendTo($_ctrl).css('color', 'red').css('margin-left',0);
            this.$coorMsg = $('<div class="row col-md-12">').appendTo($_ctrl).css('margin-left',0);

            var $_metercontainer = $('<div class="col-md-12 meter offdisplay">').appendTo($_ctrl);
            this.$floodpin = $('<div class="row col-md-12">').appendTo($_metercontainer);

            this.$tooltip = $('<i  data-toggle="tooltip" data-html="true" data-placement="right" data-animation="false" data-trigger="manual" style="position:absolute !important;" />').appendTo('body');
            //初始地址定位
            this.$addressGeocode.addressGeocode({ map: app.map }).on($.addressGeocode.eventKeys.select_change, function (evt, _location, _geocode) {

                current.disasterInfo.COUNTY_NAME = current.disasterInfo.TOWN_NAME = undefined;
                current.disasterInfo.X = _location.lng;
                current.disasterInfo.Y = _location.lat;
                current.disasterInfo.LOCATION_DESCRIPTION = _geocode.formatted_address;


                if (_geocode.address) {
                    current.disasterInfo.COUNTY_NAME = _geocode.address.Region;
                    current.disasterInfo.TOWN_NAME = _geocode.address.City;
                }
                else {
                    _geocode.address_components.forEach(function (_d, _idx) {
                        if (_d.types[0] == 'administrative_area_level_1' || _d.types[0] == 'administrative_area_level_2')
                            current.disasterInfo.COUNTY_NAME = _d.long_name;
                        else if (_d.types[0] == 'administrative_area_level_3')
                            current.disasterInfo.TOWN_NAME = _d.long_name;
                    });
                }
                

                var _twd97 = helper.gis.WGS84ToTWD97(_location.lng, _location.lat);
                current.$coorMsg.html('WGS84 經度:' + _location.lng + '<br>WGS84 緯度:' + _location.lat + '<br>TWD97    X:' + _twd97.x + '<br>TWD97    Y:' + _twd97.y);

                
            }).on($.addressGeocode.eventKeys.double_click_function_change, function (evt, _w) {
                
            });

            this.$floodDt.datetimepicker({
                locale: 'zh-tw', format: 'YYYY/MM/DD'
            });//.datetimepicker("date", new Date());//.data("DateTimePicker").date(new Date());
            this.$floodDt.datetimepicker("date", new Date());
            //啟動畫淹水範圍
            this.$drawAreaStartBtn.on('click', function () {
                

                if (!current.drawingManager) {
                    current.drawingManager = $('<div>').appendTo($('body')).hide().gisdrawtool({
                        map: current.map, colorSelector: false, singleGraphic: true, mutiDraw: false,
                        types: { //to do func 客製化function
                            POLYGON: { type: 'POLYGON', name: '面', classid: "polygonimg" },
                        }
                    }).on($.gisdrawtool.event_key.add_graphic, function () {
                    }).on($.gisdrawtool.event_key.graphics_change, function (e, gs) {
                        current.floodAreaPolygon = null;
                        //currentline = null;
                        current.$areaMsg.html('');
                        if (gs.length > 0) {
                            current.floodAreaPolygon = gs[0];
                            var coors = [];
                            $.each(current.floodAreaPolygon.getLatLngs()[0], function (c) {
                                coors.push([this.lng, this.lat]);
                            })
                            var _a = helper.gis.polygonArea(coors);
                            current.$areaMsg.html(helper.format.formatNumber(_a, 0) + ' ㎡(' + helper.format.formatNumber(_a / 10000, 2) + ' 公頃)');
                        }
                        current._initDrawFloodAreaPolygonCtrl();
                    }).on($.gisdrawtool.event_key.initUICompleted, function () {
                        current.drawingManager.find('.polygonimg').trigger('click');
                        //$_draw.instance._mapctrl.drawGeo[$.gisdrawtool.types.POLYLINE.type].options.maxPoints = 2;//預設0:無限點
                        //var $_q = $('<label class="btn btn-success queryimg" title="查詢"></label>').appendTo($('#drawDiv > div:eq(2)')).on('click', function () {
                        //    if (currentline == null) {
                        //        alert("請先劃斷面範圍!!");
                        //        return;
                        //    }
                        //    else {
                        //        var lns = $_lctrl.layerctrl('getSelectLayersName');
                        //        var err;
                        //        if (lns.length == 0)
                        //            err = "請於圖層資料選擇欲查詢圖層";
                        //        else if (lns.length > 1)
                        //            err = "僅能查詢1種圖層資料，請確認圖層資料並僅勾選1種欲查詢圖層";
                        //        if (err) {
                        //            alert(err)
                        //            return;
                        //        }
                        //        querySection(currentline.getLatLngs(), lns[0]);
                        //        //alert(JSON.stringify(lns));
                        //        //alert(JSON.stringify(currentline.getLatLngs()));
                        //    }
                        //});
                        //$_draw.find('.ctrlinfo').text("請先劃斷面2點範圍，後點擊[查詢]");
                    });
                }
                else
                    current.drawingManager.find('.polygonimg').trigger('click');
            });

            
            this.$drawAreaEraseBtn.on('click', function () {
                //this.drawingManager.find('.clearctrl ').trigger('click');
                //if (current.$drawAreaEraseBtn.hasClass('disabled'))
                //    return;
                if (current.drawingManager)
                    current.drawingManager.find('.clearctrl ').trigger('click');
                
                
            });
            current._is產一河局資料 = false;
            current.__depths = [60, 30, 20, 10];///////
            current._depthIdx = 0;///////
            //送出、取消
            this.$confirmBtn.on('click', function () {
               
                current._checkDisasterInfoCompletedAndSave();
            });
            this.$cancelBtn.on('click', function () {
                current._initDisasterInfo();

                current._clearGeometry();
            });
            this._initDisasterInfo();

            //結果pinctrl
            var _floodPinOptions = $.extend({ map: this.map }, floodPinOptions);
            _floodPinOptions.legendIcons = [{ name: NAME.人工圈繪範圍, url: app.siteRoot+'images/pin/Flood_r.png', classes: 'red_status' }];
            _floodPinOptions.checkDataStatus = undefined;
            _floodPinOptions.loadInfo = function (dt, callback) {
                return callback(current.currentFloodData);
            };
            this.$floodpin.PinCtrl(_floodPinOptions);

        },
        _initDrawFloodAreaPolygonCtrl: function () {
            if (this.floodAreaPolygon) {
                this.$drawAreaStartBtn.addClass('disabled');
                this.$drawAreaEraseBtn.removeClass('disabled');
            }
            else {
                this.$drawAreaStartBtn.removeClass('disabled');
                this.$drawAreaEraseBtn.addClass('disabled');
            }
        },
        _checkDisasterInfoCompletedAndSave:function(){
            var current = this;
            this.$errorMsg.html('');

            var coors = undefined;
            if (this.floodAreaPolygon) {
                coors = [];
                var coorsstr = [];
                $.each(this.floodAreaPolygon.getLatLngs()[0], function (c) {
                    coors.push([this.lng, this.lat]);
                    coorsstr.push(this.lng+'|'+this.lat)
                })
                this.disasterInfo.POLYGON_AREA = helper.gis.polygonArea(coors);
                this.disasterInfo.POLYGON_COORDINATES = coorsstr.join(';');
            }
            
            this.disasterInfo.IsTest = this.$element.find('input[name="floodquerydatatypegroup"]:checked').val() == '1';
            /*this.disasterInfo.DATE = this.$floodDt.data("DateTimePicker").date();*/
            this.disasterInfo.DATE = this.$floodDt.datetimepicker("date");
            this.disasterInfo.CREATE_DATE = new Date();

            if (current._is產一河局資料) {
                this.disasterInfo.PK_ID = new Date().DateFormat("yyyyMMddHHmmss");///////
                this.disasterInfo.DATE = new Date(this.disasterInfo.DATE).addHours(current._depthIdx);///////
                this.$dethInput.val(current.__depths[current._depthIdx++]);///////
            }



            this.disasterInfo.DEPTH = this.$dethInput.val();
            this.disasterInfo.Described = this.$describedInput.val();

            this.disasterInfo.Contact = this.$contactInput.val();
            this.disasterInfo.Org_Name= this.$orgNameInput.val();

            this.disasterInfo.SURVEY_AFFECT_HOUSEHOLD= this.$surveyAffectHousehold.val();//調查淹水戶數
            this.disasterInfo.FLOODING_LOSS = this.$floodingLoss.val();//調查淹水損失(萬)
            this.disasterInfo.REMARK = this.$remarkInput.val();//備註
            var _errors = [];
            if (this.disasterInfo.X == 0)
                _errors.push('尚未輸入發生地點');
            if (coors) {
                if (this.disasterInfo.POLYGON_AREA > 1000000)
                    _errors.push('淹水範圍需小於 1000000 ㎡');
                if (this.disasterInfo.X != 0) {
                    var _b = helper.gis.pointInPolygon([this.disasterInfo.X, this.disasterInfo.Y], coors);
                    if (!_b)
                        _errors.push('發生地點需在輸入範圍資料內');
                }
            }
            else
                _errors.push('尚未輸入範圍資料');
            

            if (!this.disasterInfo.COUNTY_NAME || !this.disasterInfo.TOWN_NAME)
                _errors.push('點位資料無縣市鄉鎮資料');
            if (!this.disasterInfo.Contact)
                _errors.push('資料輸入人員不能空');
            
            //console.log( JSON.stringify(this.disasterInfo));
            if (_errors.length > 0) {
                this.$errorMsg.html(_errors.join('<br>'));
            }
            else {
                helper.misc.showBusyIndicator(current.$element);
                $.BasePinCtrl.helper.ajaxGeneralRequest({
                    url: app.CSgdsRoot+"WS/FloodComputeWS.asmx/AddDrawFlooding",
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    type: "POST",
                    data: JSON.stringify( { flooding: this.disasterInfo })
                }, function (d) {
                    current.$addressGeocode.addressGeocode('clear');
                    //current.currentFloodData = [d.d];
                    var _d = d.d;
                    $.extend(_d, _d.NOTIFICATION_Data);
                    _d.AffectHouse = _d.AffectStat ? _d.AffectStat.TotalHouse : 0;
                    _d.AffectArea = _d.AffectStat ? _d.AffectStat.TotalArea : 0;
                    _d.AffectHouse30cmUp = _d.AffectStat ? _d.AffectStat.TotalHouse30cmUp : 0;
                    _d.AffectArea30cmUp = _d.AffectStat ? _d.AffectStat.TotalArea30cmUp : 0;
                    _d.AffectHouse50cmUp = _d.AffectStat ? _d.AffectStat.TotalHouse50cmUp : 0;
                    _d.AffectArea50cmUp = _d.AffectStat ? _d.AffectStat.TotalArea50cmUp : 0;

                    current.currentFloodData = [_d];
                    //if (_d.Image_Data) {
                        //floodQuery.js
                        window.paintFloodAreaImageGroundOverlay(current.calFloodImageOverlay, current.currentFloodData, .8, current.$tooltip);
                        
                    //}
                    current.floodAreaPolygon.setStyle({ fillOpacity: 0 });
                     current.floodAreaPolygon.bringToBack();
                   
                    //畫結果
                    if (current.$floodpin.find('.pinswitch').is(':checked'))
                        current.$floodpin.PinCtrl('reload');
                    else
                        current.$floodpin.find('.pinswitch').prop('checked', true).trigger('change');

                    helper.misc.hideBusyIndicator(current.$element);
                    if (!current._is產一河局資料 || current._depthIdx >= current.__depths.length) ///////
                    {
                        current._depthIdx = 0;///////
                        current._initDisasterInfo();
                    }
                    else
                        current.$confirmBtn.trigger('click');///////
                });
                
            }
        },
        _initDisasterInfo: function () {
            this.disasterInfo = $.extend({}, DefaultDisasterInfo);
            this.disasterInfo.PK_ID = new Date().DateFormat("yyyyMMddHHmmss");

            this.$describedInput.val(this.disasterInfo.Described);
            this.$dethInput.val(this.disasterInfo.DEPTH);
            this.$contactInput.val(this.disasterInfo.Contact);
            this.$orgNameInput.val(this.disasterInfo.Org_Name);

            this.$surveyAffectHousehold.val(this.disasterInfo.SURVEY_AFFECT_HOUSEHOLD);//調查淹水戶數
            this.$floodingLoss.val(this.disasterInfo.FLOODING_LOSS);//調查淹水損失(萬)
            this.$remarkInput.val(this.disasterInfo.REMARK);

            this.$areaMsg.html('');
            this.$coorMsg.html('');
            //this._clearGeometry();

        },
        _clearGeometry: function () {
            //if (this.floodAreaPolygon)
            //    this.floodAreaPolygon.setMap(null);
            this.currentFloodData = [];
            this.$floodpin.PinCtrl('reload');
            window.paintFloodAreaImageGroundOverlay(this.calFloodImageOverlay, [], .8, this.$tooltip);
            this.drawingManager.find('.clearctrl ').trigger('click');
            this.$addressGeocode.addressGeocode('clear');
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

    var DefaultDisasterInfo = {
        COUNTY_NAME : undefined,
        TOWN_NAME: undefined,
        LOCATION_DESCRIPTION: undefined,
        X: 0,
        Y: 0,
        Described:undefined,
        POLYGON_COORDINATES:undefined,
        IsTest: false,
        DATE : undefined,
        CREATE_DATE: undefined,
        IsFromWraEMIS: false,
        Sources: "淹水模擬系統",
        EMISTYPE: '其他',
        Contact: '匿名',
        Org_Name: '經濟部水利署',
        DEPTH: 0,
        SURVEY_AFFECT_HOUSEHOLD: undefined,//調查淹水戶數
        FLOODING_LOSS: undefined,//調查淹水損失(萬)
        REMARK: undefined,//備註
    };
})(jQuery);