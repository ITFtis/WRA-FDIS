/****人工匯入淹水災情評估*****/
window.fromEstimateFlood = true;//floodquery package-kmz用
(function ($) {
    'use strict';
    var pluginName = 'estimateFlood';

    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = { map: undefined };
        this.map = undefined;

        this.$describedInput = undefined;
        this.$dethInput = undefined;


        this.$addressGeocode = undefined;
        this.$addBtn = undefined;

        this.$areaMsg = undefined;
        this.$coorMsg = undefined;
        this.$errorMsg = undefined;

        this.disasterInfo = undefined;

        this.$floodquery = undefined;

        this.$tooltip = undefined;
        this.$loadfloodfile = undefined; //載入資料
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
            var $_ctrl = $('<div class="flood-query flood-query-ef">').appendTo(current.$element);

            var $_c = $('<div class="col-md-12"><div class="col-md-3"></div><div class="col-md-12"></div></div>').appendTo($_ctrl);
            this.$addressGeocode = $('<div class="row col-md-12"><label class="' + filed_length + ' col-field">發生地點</label><div class="col-value ' + value_length + '"></div></div>').appendTo($_ctrl).find('.col-value');
          
            this.$describedInput =$('<div class="row col-md-12"><label class="' + filed_length + ' col-field">災情描述</label><div class="col-value ' + value_length + '"><input type="text"  class="form-control"></div></div>').appendTo($_ctrl).find('input');
            this.$dethInput =$('<div class="row col-md-12 col-large-field"><label class="' + filed_length + ' col-field">淹水深度(公分)</label><div class="col-value ' + value_length + '"><input type="text"  class="form-control"></div></div>').appendTo($_ctrl).find('input');

            
            this.$errorMsg = $('<div class="row col-md-12">').appendTo($_ctrl).css('color', 'red').css('margin-left',0);
            this.$coorMsg = $('<div class="row col-md-12">').appendTo($_ctrl).css('margin-left',0);

            var $_metercontainer = $('<div class="col-md-12 meter offdisplay">').appendTo($_ctrl);
            this.$floodpin = $('<div class="row col-md-12">').appendTo($_metercontainer);

            this.$tooltip = $('<i data-toggle="tooltip" data-html="true" data-placement="right" data-animation="false" data-trigger="manual" style="position:absolute !important;" />').appendTo('body');

            var $_ftemp = $('<div class="col-md-12"></div>').appendTo($_ctrl);
            this.$importfile = $('<span class="glyphicon glyphicon-import btn btn-info">匯入</span>').appendTo($_ftemp);
            $('<a href="' + app.siteRoot +'Data/importFloodTemplate.csv" download="Template.csv" style="vertical-align: bottom;margin-left: 4px;">範例下載</a>').appendTo($_ftemp);
            this.$loadfloodfile = $('<input type="file" accept=".csv,.xlsx">').appendTo($_ftemp).hide();//.find('input');
            //this.$addBtn = $('<div class="row col-md-12 btn-ctrl"><span class="glyphicon glyphicon-plus btn btn-primary pull-right">新增</span></div>').appendTo($_ctrl).find('.btn');
            this.$addBtn = $('<span class="glyphicon glyphicon-plus btn btn-primary pull-right">新增</span>').appendTo($_ftemp);


            this.$floodtable = $('<div class="col-md-12 estimate-flood-data-container"><table style="width:100% !important;"></table></div>').appendTo($_ctrl).find('table');

            var $btnCtrl = $('<div class="row col-md-12 btn-ctrl"><div class="col-xs-6 col-6"><span class="glyphicon glyphicon-ok btn btn-success">送出災情</span></div><div class="col-xs-6 col-6"><span class=" glyphicon glyphicon-remove btn btn-warning">取 消</span></div></div>').appendTo($_ctrl);

            this.$confirmBtn = $btnCtrl.find('.glyphicon-ok');
            this.$cancelBtn = $btnCtrl.find('.glyphicon-remove');

            this.$floodquery = $('<div class="row col-md-12">').appendTo($_ctrl);

            //初始載入功能
            this.$importfile.on('click', function () {
                current.$loadfloodfile.trigger('click');
            });
           
            this.$loadfloodfile.on('change', function (e) {
                var files = e.target.files, f = files[0], isCsv = f.name.split(".").reverse()[0].toUpperCase() == "CSV";
                var reader = new FileReader();
                reader.onload = function (e) {
                    var workbook = undefined;
                    if (isCsv)
                        workbook = XLSX.read(e.target.result, { type: 'string', raw: true, cellStyles: true });
                    else {
                        var data = new Uint8Array(e.target.result);
                        var workbook = XLSX.read(data, { type: 'array', raw: true, cellStyles: true });
                    }
                    var datas = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                    appendTableDataAndSelect(datas);
                    //var wb = XLSX.utils.table_to_book(current.$floodtable[0], { raw: false });
                    //var wb = {
                    //    SheetNames: ['Sheet1'],
                    //    Sheets: { Sheet1: XLSX.utils.json_to_sheet(current.$floodtable.bootstrapTable('getSelections')) },
                    //    Props: {}
                    //};
                    //var sh2 = XLSX.utils.sheet_add_json(wb.Sheets.Sheet1, current.$floodtable.bootstrapTable('getSelections'), { skipHeader: true, origin: "A8" });
                    //XLSX.writeFile(wb, 'tempwb.xlsx', { cellStyles: true, compression: true });
                    //console.log(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]));
                    //var asdd = XLSX.writeFile;
                    //XLSX.writeFile(workbook, 'teml.xlsx', { cellStyles: true, compression:true} ); //download
                    //XLSX.writeFile(workbook, 'teml.ods', { cellStyles: true, compression: true }); //download
                    /* DO SOMETHING WITH workbook HERE */
                };
                if(isCsv)
                    reader.readAsText(f, 'big5'); //解決編碼問題(ANSI、UTF8、Unicode)，但IE UTF8、Unicode有問題,但如要讀excel還是要用readAsArrayBuffer
                else
                    reader.readAsArrayBuffer(f);
            });

            //初始匯入table
            this.$floodtable.bootstrapTable('destroy').bootstrapTable({
                height: 160,
                striped: true,
                classes:'table table-bordered table-hover table-sm',
                columns: [
                    {checkbox:true},
                    { field: '發生地點', title: '發生地點' },
                    { field: '淹水深度(cm)', title: '深度' },
                    { field: '災情描述', title: '災情描述' },
                    { field: 'WGS84_X', title: '經度' },
                    { field: 'WGS84_Y', title: '緯度' }
                ],
                data: [],
                formatNoMatches: function () {
                    return '無資料!!';
                },
                onCheck: function () {
                    appendTableDataAndSelect([]);
                },
                onUncheck: function () {
                    appendTableDataAndSelect([]);
                },
                onCheckAll: function () {
                    appendTableDataAndSelect([]);
                },
                onUncheckAll: function () {
                    appendTableDataAndSelect([]);
                }
            });
            setTimeout(function () {
                current.$floodtable.bootstrapTable('refresh');
                setTimeout(function () {
                    current.$floodtable.bootstrapTable('refresh');
                }, 500);
            }, 500);

            //初始floodquery
            var resetFloodPinOptionsField = function (fn, _ops) {
                var fs=$.grep(floodPinOptions.infoFields, function (d) {
                    return d.field == fn;
                });
                if (fs.length > 0)
                    $.extend(fs[0], _ops);
            }
            resetFloodPinOptionsField('Org_Name', { showInInfo: false, showInList:false });
            resetFloodPinOptionsField('COUNTY_NAME', { showInInfo: false, showInList: false });
            resetFloodPinOptionsField('TOWN_NAME', { showInInfo: false, showInList: false });
            resetFloodPinOptionsField('GridId', { showInInfo: false, showInList: false });
            resetFloodPinOptionsField('DATE', { showInInfo: false, showInList: false });
            resetFloodPinOptionsField('IS_RECESSION', { showInInfo: false, showInList: false });
            this.$floodquery.floodQuery({ map: app.map, useRiver: false, packagekmz:true }).css('opacity',0); //先隱藏
            this.$floodquery.on('initUiCompleted', function () {
                var $fdoms = current.$floodquery.css('opacity', 1).find('>.flood-query').find('>*:not(.ui-estimate)').hide();
            })
            .on(FLOOD_QUERY_EVENT.SHOW_積淹水災情統計表, function (evt, isshow) {
            $('body > .popu-ctrl-container > .tools-group-panel a[href="#FloodStatisticsPanel"]').trigger('setActive', isshow);
                }).
            on(FLOOD_QUERY_EVENT.SHOW_土地使用區分統計表, function (evt, isshow) {
                $('body > .popu-ctrl-container > .tools-group-panel a[href="#LandUseDistrictStatisticsPanel"]').trigger('setActive', isshow);
            }).
            on(FLOOD_QUERY_EVENT.CHANGE_積淹水災情統計表, function (evt, data) {
                if ($('#FloodStatisticsPanel').length > 0)
                    $('#FloodStatisticsPanel').floodStatisticsTable('setData', data);
            }).
            on(FLOOD_QUERY_EVENT.CHANGE_土地使用區分統計表, function (evt, data) {
                        if ($('#LandUseDistrictStatisticsPanel').length > 0)
                            $('#LandUseDistrictStatisticsPanel').landUseDistrictStatisticsTable('setData', data);
                    });

            this.$element.off($.menuctrl.eventKeys.popu_init_before); //current.$floodquery.trigger($.menuctrl.eventKeys.popu_init_before)也會觸發至上層會無窮迴圈
            setTimeout(function () {
                current.$floodquery.trigger($.menuctrl.eventKeys.popu_init_before);
            });
            
            //初始地址定位
            this.$addressGeocode.addressGeocode({ map: app.map }).on($.addressGeocode.eventKeys.select_change, function (evt, _location, _geocode) {

                current.disasterInfo.COUNTY_NAME = current.disasterInfo.TOWN_NAME = undefined;
                current.disasterInfo.X = _location.lng;
                current.disasterInfo.Y = _location.lat;
                current.disasterInfo.LOCATION_DESCRIPTION = _geocode.formatted_address;
                current.disasterInfo.COUNTY_NAME = _geocode.address.Region;
                current.disasterInfo.TOWN_NAME = _geocode.address.City;

                var _twd97 = helper.gis.WGS84ToTWD97(_location.lng, _location.lat);
                current.$coorMsg.html('WGS84 經度:' + _location.lng + '<br>WGS84 緯度:' + _location.lat + '<br>TWD97    X:' + _twd97.x + '<br>TWD97    Y:' + _twd97.y);

                
            }).on($.addressGeocode.eventKeys.double_click_function_change, function (evt, _w) {
                
            });

            this.$addBtn.on('click', function () {
                current._checkDisasterInfoCompletedAndSave();
                if (current.$errorMsg.html() == '') {
                    var n = {
                        '發生地點': current.disasterInfo.LOCATION_DESCRIPTION, '淹水深度(cm)': current.disasterInfo.DEPTH,
                        '災情描述': current.disasterInfo.Described, WGS84_X: current.disasterInfo.X, WGS84_Y: current.disasterInfo.Y
                    };
                    appendTableDataAndSelect([n]);
                    //current.$floodtable.bootstrapTable('append', [n]);
                    //var sddd =current.$floodtable.bootstrapTable('getData');
                    //current.$floodtable.bootstrapTable('check', current.$floodtable.bootstrapTable('getData').length-1);
                    current._initDisasterInfo();
                }
            });

            var appendTableDataAndSelect= function (ds) {
                current.$floodtable.bootstrapTable('append', ds);
                var allds = current.$floodtable.bootstrapTable('getData');
                ds.forEach(function (d,i) {
                    current.$floodtable.bootstrapTable('check', allds.length-i-1);
                });
                var alls = current.$floodtable.bootstrapTable('getSelections');
                $.each(alls, function () {
                    this.X = this.WGS84_X;
                    this.Y = this.WGS84_Y;
                });
                current.$floodpin.PinCtrl('setData', alls);
                current.$floodquery.floodQuery('resetFloodData', undefined);
                current.$confirmBtn.attr('disabled', false);
            }

            //送出、取消
            this.$confirmBtn.on('click', function () {
                var sds = current.$floodtable.bootstrapTable('getSelections');
                if (sds.length == 0) {
                    helper.jspanel.jspAlertMsg(undefined, { content: '無災情資料!!', autoclose: 5000, size: {width:'200px'} });
                    return;
                }
                var ts = Date.now();
                var dinfos = $.map(sds, function (d, i) {
                    var dt = $.extend({}, DefaultDisasterInfo);
                    dt.LOCATION_DESCRIPTION = d['發生地點'];
                    dt.DEPTH = d['淹水深度(cm)'];
                    dt.Described = d['災情描述'];
                    dt.X = d['WGS84_X'];
                    dt.Y = d['WGS84_Y'];
                    dt.PK_ID = ts + i;
                    dt.DATE = dt.CREATE_DATE = new Date(); 
                    return dt;
                });
                helper.misc.showBusyIndicator(current.$element);
                datahelper.estimateFloodingComputeForLightweightDatas(dinfos, function (fds) {
                    helper.misc.hideBusyIndicator(current.$element);

                    current.$floodquery.floodQuery('resetFloodData', fds);
                    current.$floodquery.instance.$_floodpin.PinCtrl('fitBounds');
                    current.$floodpin.PinCtrl('setData', []);
                    current.$confirmBtn.attr('disabled', true);
                });
            });
            this.$cancelBtn.on('click', function () {
                current.$floodquery.floodQuery('resetFloodData', undefined);
                current.$floodtable.bootstrapTable('removeAll');
                current.$loadfloodfile.val('');
                
            });
            this._initDisasterInfo();
            this.$confirmBtn.attr('disabled', true);
            //結果pinctrl
            this.$floodpin.PinCtrl({
                map: app.map, clickable: false, pinLabel:false,
                legendIcons: [{ name: NAME.人工圈繪範圍, url: 'images/Flood_b.png', classes: 'red_status' }],
                loadInfo: function (dt, callback) { callback([]) },
                loadBase: function ( callback) { callback([]) }
            }).on($.BasePinCtrl.eventKeys.initUICompleted, function () {
                current.$floodpin.find('.pinswitch').prop('checked', true).trigger('change');
            });

        },
        _checkDisasterInfoCompletedAndSave:function(){
            var current = this;
            this.$errorMsg.html('');
            
            this.disasterInfo.CREATE_DATE = new Date();



            this.disasterInfo.DEPTH = this.$dethInput.val();
            this.disasterInfo.Described = this.$describedInput.val();


            var _errors = [];
            if (this.disasterInfo.X == 0)
                _errors.push('尚未輸入發生地點');

            //if (!this.disasterInfo.COUNTY_NAME || !this.disasterInfo.TOWN_NAME)
            //    _errors.push('點位資料無縣市鄉鎮資料');
            
            //console.log( JSON.stringify(this.disasterInfo));
            if (_errors.length > 0) {
                this.$errorMsg.html(_errors.join('<br>'));
            }
        },
        _initDisasterInfo: function () {
            this.disasterInfo = $.extend({}, DefaultDisasterInfo);
            this.disasterInfo.PK_ID = new Date().DateFormat("yyyyMMddHHmmss");

            this.$describedInput.val(this.disasterInfo.Described);
            this.$dethInput.val(this.disasterInfo.DEPTH);

            this.$coorMsg.html('');
            this._clearGeometry();

        },
        _clearGeometry: function () {
            //if (this.floodAreaPolygon)
            //    this.floodAreaPolygon.setMap(null);
            //this.floodAreaMarker.forEach(function (m) {
            //    m.setMap(null);
            //});
            //this.floodAreaMarker.splice(0, this.floodAreaMarker.length);
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
        PK_ID:undefined,
        COUNTY_NAME : undefined,
        TOWN_NAME: undefined,
        LOCATION_DESCRIPTION: undefined,
        X: 0,
        Y: 0,
        Described:undefined,
        IsTest: false,
        DATE : undefined,
        CREATE_DATE: undefined,
        IsFromWraEMIS: true,
        Sources: "淹水預估",
        EMISTYPE: '其他',
        DEPTH: 0,
        SourceCode:3,
        REMARK: undefined,//備註
    };

})(jQuery);