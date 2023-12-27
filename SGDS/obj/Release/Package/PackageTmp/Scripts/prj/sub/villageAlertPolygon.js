
(function ($) {
    'use strict';
    var pluginName = 'villageAlertPolygon';

    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = { map: undefined, pinOptions:undefined, showCount :true };

        this.currentVillageAlertDatas = undefined;
        this.currentCounty = -1;
        this.currentRiver = undefined;
        this.currentRvb = undefined;
        this.$villagePolygonPin = undefined;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);
            this.map = this.settings.map;

            this.initUi();

        },
        initUi: function () {
            var current = this;//.$element;
            
            var $_metercontainer = $('<div class="col-md-12 meter">').appendTo(this.$element);
            this.$villagePolygonPin = $('<div class="col-md-12">').appendTo($_metercontainer);

            var $_silder = $('<div class="col-md-12">').appendTo($_metercontainer).slider({
                range: "min",
                max: 100,
                min: 5,
                value: 90,
                slide: function () { current.setOpacity($(this).slider("value") / 100); },
                change: function () { current.setOpacity($(this).slider("value") / 100); }
            });
            
            //Meter
            //積淹水村里
            var _villagePolygonPinOptions = $.extend({ map: this.map }, villageAlertOptions);

            _villagePolygonPinOptions.loadInfo = function (dt, callback) {
                this.settings.villageAlertDatas = current.currentVillageAlertDatas;
                this.settings.selectCounty = current.currentCounty;
                this.settings.rvb = current.currentRvb;
                this.settings.river = current.currentRiver;
                villageAlertOptions.loadInfo.call(this, dt, function (_vdatas) {
                    current.__showCountOnLabel();
                    //if (current.settings.showCount) //show筆數
                    //    current.$villagePolygonPin.find('.ctrl>label:eq(0) .checkbox-name').text(villageAlertOptions.name + '(' + _vdatas.length + ')');
                    
                    callback(_vdatas);
                    current.$element.trigger('query_completed',[ _vdatas]);
                });
            };
            if (this.settings.pinOptions)
                _villagePolygonPinOptions = $.extend(_villagePolygonPinOptions, this.settings.pinOptions);

            this.pinctrlInstance = current.$villagePolygonPin.PolygonCtrl(_villagePolygonPinOptions).instance.__pinctrl.instance;
            this.settings.pinOptions = _villagePolygonPinOptions;

        },
        setOpacity: function (_opacity) {
            if (this.$villagePolygonPin.instance)
                this.$villagePolygonPin.instance.setOpacity(_opacity);
        },
        setFilter: function (_filter) {
            var current = this;
            this.$villagePolygonPin.PolygonCtrl('setFilter', _filter);
            this.__showCountOnLabel();
        },
        __showCountOnLabel: function () {
            if (this.settings.showCount) {//show筆數
                var that = this;
                setTimeout(function () {
                    that.$villagePolygonPin.find('.ctrl>label:eq(0) .checkbox-name').text(that.settings.pinOptions.name + '(' + that.pinctrlInstance.___displaydatas.length + ')');
                }, 10);
            }
        },
        query:function(_typhType, _county, _onlyWarning, _alertVillageInfo, styear, endyear, rvb, river){
            var current = this;
            var _loadDataReady=function(_datas){
                current.currentVillageAlertDatas = _datas;
                current.currentCounty = _county;
                current.currentRvb = rvb;
                current.currentRiver = river;
                if (current.$villagePolygonPin.find('.pinswitch').is(':checked'))
                    current.$villagePolygonPin.PolygonCtrl('reload');
                else
                    current.$villagePolygonPin.find('.pinswitch').prop('checked', true).trigger('change');
            };
            //current.$confirm.button('loading');
            //淹水村里
            if (_alertVillageInfo) {
               
                    _loadDataReady(_alertVillageInfo);
            }
            else {
                datahelper.getVillageFloodAlertDatasByTyphtype(_typhType, _onlyWarning, function (_d) {
                        _loadDataReady(_d);
                },styear, endyear);
            }
        },
        showTable: function (_county,_villages,$_table) {
            setTimeout(function () { //pin reload >>loadInfo會給CountyName、TownName欄位值
                var vdatas = _county == 0 ? _villages : $.grep(_villages, function (d) {
                    return d.COUNID == _county;
                });
                var allcountyobj = {}, rdataArray = [];
                $.each(vdatas, function () {
                    var countyobj, townobj;
                    if (allcountyobj.hasOwnProperty(this.CountyName))
                        countyobj = allcountyobj[this.CountyName];
                    else {
                        countyobj = {};
                        allcountyobj[this.CountyName] = countyobj;
                    }
                    if (countyobj.hasOwnProperty(this.TownName))
                        countyobj[this.TownName] += 1;
                    else
                        countyobj[this.TownName] = 1;
                });
                for (var cn in allcountyobj) {
                    for (var tn in allcountyobj[cn]) {
                        rdataArray.push({ county: cn, district: tn, count: allcountyobj[cn][tn] });
                    }
                }
                $_table.bootstrapTable('destroy').bootstrapTable({
                    //height: 200,
                    classes:'table table-sm',
                    striped: true,
                    columns: [
                        { field: 'county', title: '縣市', visible: _county==0 },
                        { field: 'district', title: '行政區' },
                        { field: 'count', title: '村里數', halign: 'center', align: 'center' }
                    ],
                    data: rdataArray,
                    formatNoMatches: function () {
                        return '無資料!!';
                    },
                });
            }, 10);
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

var villagePolygonStyles = [
    { name: '1', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#51B500', fillOpacity: .95, classes: 'status_51B500' },
    { name: '2', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#6FC400', fillOpacity: .95, classes: 'status_6FC400' },
    { name: '3', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#8BD100', fillOpacity: .95, classes: 'status_8BD100' },
    { name: '4', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#B0E000', fillOpacity: .95, classes: 'status_B0E000' },
    { name: '5', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#D8F000', fillOpacity: .95, classes: 'status_D8F000' },
    { name: '6', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#FFFF00', fillOpacity: .95, classes: 'status_FFFF00' },
    { name: '7', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#FFD500', fillOpacity: .95, classes: 'status_FFD500' },
    { name: '8', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#FFAA00', fillOpacity: .95, classes: 'status_FFAA00' },
    { name: '9', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#FF8000', fillOpacity: .95, classes: 'status_FF8000' },
    { name: '10', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#FF5500', fillOpacity: .95, classes: 'status_FF5500' },
    { name: '11', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#FF2B00', fillOpacity: .95, classes: 'status_FF2B00' },
    { name: '>11', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#FF0000', fillOpacity: .95, classes: 'status_FF0000' }
];
var villagePolygonBlue3PolyStyles = [
    { name: '1', strokeColor: '#c0c0c0', strokeOpacity: 1, strokeWeight: 1, fillColor: '#ADD8E6', fillOpacity: .95, classes: 'status_ADD8E6' },
    { name: '2', strokeColor: '#c0c0c0', strokeOpacity: 1, strokeWeight: 1, fillColor: '#ADD8E6', fillOpacity: .95, classes: 'status_ADD8E6' },
    { name: '3', strokeColor: '#c0c0c0', strokeOpacity: 1, strokeWeight: 1, fillColor: '#ADD8E6', fillOpacity: .95, classes: 'status_ADD8E6' },
    { name: '4', strokeColor: '#c0c0c0', strokeOpacity: 1, strokeWeight: 1, fillColor: '#0000FF', fillOpacity: .95, classes: 'status_0000FF' },
    { name: '5', strokeColor: '#c0c0c0', strokeOpacity: 1, strokeWeight: 1, fillColor: '#0000FF', fillOpacity: .95, classes: 'status_0000FF' },
    { name: '6', strokeColor: '#c0c0c0', strokeOpacity: 1, strokeWeight: 1, fillColor: '#0000FF', fillOpacity: .95, classes: 'status_0000FF' },
    { name: '7', strokeColor: '#c0c0c0', strokeOpacity: 1, strokeWeight: 1, fillColor: '#00008B', fillOpacity: .95, classes: 'status_00008B' }
];
var villagePolygonBlue3LegendIcons = [
    { name: '1~3', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#ADD8E6', fillOpacity: .95, classes: 'status_ADD8E6' },
    { name: '4~6', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#0000FF', fillOpacity: .95, classes: 'status_0000FF' },
    { name: '7以上', strokeColor: '#aaaaaa', strokeOpacity: 1, strokeWeight: 1, fillColor: '#00008B', fillOpacity: .95, classes: 'status_00008B' }
];

var villageAlertOptions = {
    name: '歷史淹水次數', useLabel: true,
    stTitle: function (d) { return d.EVENT.length > 0 ? d.EVENT[0].VillageName : '-' },
    useInfoWindow: { minWidth: 306, maxWidth:400},
    //listContainer: $_listContainer,//'.village-disaster-history > ',
    //listTheme: 'gbright',
    infoFields: [
    { field: 'CountyName', title: '縣 市' },
        { field: 'TownName', title: '鄉鎮市區' },
        //{ field: 'VILLAGESN', title: '村里' },
    { field: 'VillageName', title: '村里' },
    { field: 'RAIN', title: '參考雨量站', showInList: false, formatter: function (v, d) { var _rs = []; $.each(d.EVENT, function () { if (_rs.indexOf(this.RainStName) < 0) _rs.push(this.RainStName); }); return _rs.join('、') } },
    { field: 'sensor', title: '參考感測站', showInList: false, formatter: function (v, d) { var _ss = []; $.each(v, function () { if (_ss.indexOf(this.name) < 0) _ss.push(this.name); }); return _ss.length==0?'-': _ss.join('、') } },
    { field: 'RAIN', title: '歷年淹水次數', showInList: false, formatter: function (v, d) { return d.EVENT.length } },
    {
        field: 'RAIN', title: '歷年成災事件', showInList: false, formatter: function (v, d) {
            d.EVENT.sort(function (a, b) { //排序(依FloodEventName前幾碼數字日期排序)
                var __ad = '0', __bd = '0';
                if (a.FloodEventName && b.FloodEventName) {
                    for (var i = 0; i < a.FloodEventName.length; i++) {
                        if (!$.isNumeric(a.FloodEventName[i]))
                            break;
                            __ad =a.FloodEventName.substr(0, i+1);
                    }
                    for (var j = 0; j < b.FloodEventName.length; j++) {
                        if (!$.isNumeric(b.FloodEventName[j]))
                            break;
                        __bd = b.FloodEventName.substr(0, j+1);
                    }
                }
                __ad = helper.format.paddingRight(__ad, '0', __ad[0] == 1 ? 8 : 7); //__ad[0]==1,民國100後
                __bd = helper.format.paddingRight(__bd, '0', __bd[0] == 1 ? 8 : 7); //__bd[0]==1,民國100後
                return parseInt(__bd) - parseInt(__ad);
            });
            
            //var _rs = []; $.each(d.EVENT, function () { if (_rs.indexOf(this.FloodEventName) < 0) _rs.push('<a class="flood-event-image" data-event-code="' + this.FloodEventCode + '">' + this.FloodEventName + '</a>'); }); return _rs.join('<br>')
            var _id = 'event_' + Date.now();
            var _es = []; $.each(d.EVENT, function () { if (_es.indexOf(this.FloodEventName) < 0) _es.push(this.FloodEventName); }); 
            var _suid = []; $.each(d.sensor, function () { if (_suid.indexOf(this.uid) < 0) _suid.push(this.uid); }); 
            setTimeout(function () {
                var $_evinf = $('#' + _id);
                var $_p = $_evinf.parent(); //<span>
                $_evinf.appendTo($_p.parent());
                $_p.remove();
                helper.misc.showBusyIndicator($_evinf);
                datahelper.getVillageFldoodEventRelInf(d.VILLAGESN, _es.join(','), _suid.join(','), function (infs) {
                    
                    helper.misc.hideBusyIndicator($_evinf);

                    $.each(infs, function () {
                        var dthat = this;
                        var $_d = $_evinf.find('.' + this.EventCode);
                        if ($_d.length > 0) {
                            if (this.VillageFloodImages && this.VillageFloodImages.length > 0) {
                                $('<a><img src="' + app.siteRoot +'images/photo.png" style="width:1rem;margin-right:.1rem;cursor: pointer;"></a>').appendTo($_d).on('click', function () {
                                    var _imgDoms = $.map(dthat.VillageFloodImages, function (_img, _idx) {
                                        return '<img src="' + app.CSgdsRoot + _img.Url + '" style="margin: 0 auto;max-width:80%">';
                                    });
                                    var _imgCaptions = $.map(dthat.VillageFloodImages, function (_img, _idx) {
                                        return _img.Name;
                                    });
                                    var $_carousel = helper.bootstrap.genBootstrapCarousel(null, null, null, _imgDoms, _imgCaptions)
                                    helper.jspanel.jspAlertMsg(null, { title: d.VILLAGESN + d.VillageName + '(' + dthat.EventCode + ')', autoclose: 9999999, theme: 'info', content: $_carousel.wrapAll('<div>').parent().html() });
                                });
                            }
                            if (this.NewsPdfUrl) {
                                $('<a href="' + app.CSgdsRoot + this.NewsPdfUrl + '" target="newpdf"><img src="' + app.siteRoot +'images/news.png" style="width:1rem;margin-right:.1rem;cursor: pointer;"></a>').appendTo($_d);
                            }
                            if (this.FloodSensorCsvUrl) {
                                $('<a href="' + app.CSgdsRoot + this.FloodSensorCsvUrl + '" target="newcvs"><img src="' + app.siteRoot +'images/pin/Flood_b_7.png" style="width:1rem;margin-right:.1rem;cursor: pointer;"></a>').appendTo($_d);
                            }
                        }
                    });
                });
            });
            
            var _r = [];
            $.each(_es, function () {
                _r.push('<div class="' + this + '">' + this + '</div>');
            });
            return '<div id="' + _id + '">' + _r.join('')+'</div>';
        }
    }
    ],
    loadBase: function (callback) { callback([]); },
    loadInfo: function (dt, callback) {
        //datahelper.getVillageFloodAlertDatas(function (_villages) {
        _villages = this.settings.villageAlertDatas;

        if (!_villages) {
            callback([]);
            return;
        }
        var vids = [];
        var cids = [];
        var cs = this.settings.selectCounty;// current.$countySelect.val();
        var rvb = this.settings.rvb;
        var river = this.settings.river == '全流域' ? undefined : this.settings.river;
        $.each(_villages, function () {
            vids.push(this.VILLAGESN);
            if (cids.indexOf(this.COUNID) < 0)
                cids.push(this.COUNID);
        });
        if (cs != 0)
            cids = [parseInt(cs)];
        //else if (rvb != undefined && river != '全流域') {

                //}
                //else if (rvb != undefined) {

                //}
                //else //依縣市(全台)
        datahelper.loadAllVillagePolygons(function (vs) {
            var _datas = [];
            $.each(vs, function (cidx, c) { //輪巡縣市
                if (cids.indexOf(c.countyId) >= 0) {
                    $.each(c.villages, function (vidx, v) { //輪巡村里
                        if (vids.indexOf(v.id) >= 0) {
                            var vdata = _villages[vids.indexOf(v.id)];
                            vdata = $.extend(vdata, v);//{ id, paths, river, riverOrg, sensor: [{name,uid}] }
                            //vdata.paths = v.paths;
                            vdata.CountyName = vdata.EVENT[0].CountyName; //為了清單裡的過濾，formatter無法過濾,DB資料還有原高雄縣、台南縣....資料
                            vdata.TownName = vdata.EVENT[0].TownName;
                            vdata.VillageName = vdata.EVENT[0].VillageName;
                            $.each(vdata.EVENT, function () {
                                var ev = this;
                                var bevs = $.grep(datahelper.getFloodEvents(), function (bev) {
                                    return ev.FloodEventCode == bev.FloodEventCode;
                                });
                                ev.FloodEventName = ev.FloodEventCode;
                                if (bevs.length > 0)
                                    ev.FloodEventName = bevs[0].FloodEventName;
                            });
                            if (river && river != vdata.river)
                                return;
                            if (rvb && rvb != vdata.riverOrg)
                                return;
                            _datas.push(vdata);
                        }
                    });
                }
            });
            callback(_datas);//不做動作
        }, app.county ? [app.county] : undefined);
        //});
    },
    checkDataStatus: function (data, index) {
        return this.settings.polyStyles[(data.EVENT.length > this.settings.polyStyles.length ? this.settings.polyStyles.length : data.EVENT.length) - 1];
    },
    pinInfoContent: function (data) {
        //console.log(JSON.stringify(data));
        var $_root = $('<div><div class="village-disaster-history-infowindow tabs-below ev-' + data.EVENT.length + ' ev-rain-' +
            (data.EVENT.length + (data.RAIN ? data.RAIN.length : 0)) + '"></div></div>').find('> .village-disaster-history-infowindow');
        var gid ="tabpanel"+ helper.misc.geguid();

        var $_content = $('<div class="tab-content">').appendTo($_root);

        var $_tab = helper.bootstrap.genBootstrapTabpanel(undefined, gid,undefined,
            ['基本資料', '歷史事件雨量', '雨量包絡線'],
            ['<div class="vinfo-base">', '<div class="vinfo-event">', '<div class="vinfo-chart">']
            , true);
        $_tab.appendTo($_root);

        //$_tab.find('.nav-item>.nav-link:first').tab("show");

        //var $_ul = $('<ul class="nav nav-tabs" role="tablist">').appendTo($_root);

        //$('<li role="presentation" class="nav-item"><a class="nav-link" href="#base_' + gid + '" role="tab" data-bs-toggle="tab">基本資料</a></li>').appendTo($_ul);
        //$('<li role="presentation" class="nav-item"><a class="nav-link" href="#event_' + gid + '" role="tab" data-bs-toggle="tab">歷史事件雨量</a></li>').appendTo($_ul);
        //$('<li role="presentation" class="nav-item"><a class="nav-link" href="#chart_' + gid + '" role="tab" data-bs-toggle="tab">雨量包絡線</a></li>').appendTo($_ul);

        //var $_base = $('<div role="tabpanel" class="tab-pane" id="base_' + gid + '"></div>').appendTo($_content);
        //var $_event = $('<div role="tabpanel" class="tab-pane event-container" id="event_' + gid + '"></div>').appendTo($_content);
        //var $_chart = $('<div role="tabpanel" class="tab-pane" id="chart_' + gid + '"></div>').appendTo($_content);
        var $_base = $_tab.find('.vinfo-base');
        $($.BasePinCtrl.defaultSettings.pinInfoContent.call(this, data, this.infofields)).appendTo($_base);

        
        //雨量及事件雨量資料
        var _raindatas = [];

        /////補data.RAIN,如有對應雨量站，但該雨量站無值，則data.RAIN會無該站資料
        if ($.grep(data.RAIN, function (r) {return '預報' == r.ST_NO; }).length == 0) { //預報不用補雨量站及值20221102
            var _rsStr = '', _rs = [];
            $.each(data.EVENT, function () {//找出雨量站
                if (_rsStr.indexOf(this.RasinStCode) >= 0)
                    return;
                _rsStr += '|' + this.RasinStCode + '|';
                _rs.push(this);
            });
            $.each(_rs, function () {
                var _that = this;
                var _temp = $.grep(data.RAIN, function (_d) {
                    return _d.ST_NO == _that.RasinStCode;
                });
                if (_temp.length == 0)
                    data.RAIN.push({ ST_NO: _that.RasinStCode, H1: -999, H3: -999, H6: -999, H12: -999, H24: -999 });
            });
        }
        ////////

        $.each(data.RAIN, function () {
            var sn = this.ST_NO;
            $.each(data.EVENT, function () {
                if (this.RasinStCode == sn)
                    sn = this.RainStName;
            });
            _raindatas.push($.extend({
                name: sn + (sn == '預報' ? '資料' : '雨量站'), type: 'column',
                data: [parseFloat(this.H1), parseFloat(this.H3), parseFloat(this.H6), parseFloat(this.H12), parseFloat(this.H24)]
            }, this));
        });
        $.each(data.EVENT, function () {
            _raindatas.push($.extend({
                name: this.FloodEventName,
                data: [parseFloat(this.H1), parseFloat(this.H3), parseFloat(this.H6), parseFloat(this.H12), parseFloat(this.H24)]
            }, this));
        });
        _raindatas.push({
            name: '最低包絡線', H1: data.LIMIT_INFO.S1時, H3: data.LIMIT_INFO.S3時, H6: data.LIMIT_INFO.S6時,
            H12: data.LIMIT_INFO.S12時, H24: data.LIMIT_INFO.S24時,
            dashStyle: 'Dash',
            color: '#FF0000',
            data: [parseFloat(data.LIMIT_INFO.S1時), parseFloat(data.LIMIT_INFO.S3時), parseFloat(data.LIMIT_INFO.S6時), parseFloat(data.LIMIT_INFO.S12時), parseFloat(data.LIMIT_INFO.S24時)]
        });

        var nodataformatter = function (v, d) { return !v || parseFloat(v) < 0 ? '-' : v.toFixed(1); };
        //if ($("").highcharts) {<!--highcharts 會有 undefined問題-->
            setTimeout(function () {
                _todoChart();
            });
        //} else {
        //    helper.misc.getJavaScripts(["https://code.highcharts.com/highcharts.js"], function () {
        //        _todoChart();
        //    });
        //}

        var _todoChart = function () {
            var $_tab = $('#' + gid + ' ');
            $_tab.find('.nav-item>.nav-link:first').tab("show");
            var $_eventContainer = $_tab.find('.vinfo-event');// $('.village-disaster-history-infowindow > .tab-content > #event_' + gid);
            var $_chartContainer = $_tab.find('.vinfo-chart');// $('.village-disaster-history-infowindow > .tab-content > #chart_' + gid);
            //歷史事件雨量
            var $eventtable = $('<table>').appendTo($_eventContainer);// $_eventContainer.empty().html('歷史事件雨量 new');
            $eventtable.bootstrapTable({
                columns: [{ field: 'name', title: '降雨延時' },
                    { field: 'H1', title: '1時', formatter: nodataformatter },
                    { field: 'H3', title: '3時', formatter: nodataformatter },
                    { field: 'H6', title: '6時', formatter: nodataformatter },
                    { field: 'H12', title: '12時', formatter: nodataformatter },
                    { field: 'H24', title: '24時', formatter: nodataformatter }
                ],
                striped: true,
                data: _raindatas
            });
            //chart
            var $_chart = $('<div class="rain-chart">').appendTo($_chartContainer);
            var _chartoptions = {
                chart: {
                    height: 240,// 220+20*(Math.ceil(_raindatas.length/2)),
                    width: 300,
                    margin: [null, null, null, 54],
                    reflow: true
                },
                credits: {
                    enabled: false
                },
                title: {
                    text: '',
                },
                xAxis: {
                    categories: ['1時', '3時', '6時', '12時', '24時'],
                    tickLength: 0
                },
                yAxis: {
                    title: {
                        text: '累計雨量mm',
                        margin: 4
                    },
                    lineWidth: 1,
                    gridLineDashStyle: 'dash',
                    min: 0
                },
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom',
                    borderWidth: 0,
                    itemDistance: 10,
                    maxHeight: 80,
                    padding: 0,
                    margin: 0,
                    //itemDistance: 0,
                    //itemWidth:60
                },
                series: _raindatas
            }
            var _chart = $_chart.highcharts(_chartoptions);

            //放大chart
            $_chartContainer.on('click', function () {
                var _jsoptins = {
                    id: 'jspanel-' + gid,
                    title: "雨量包絡線圖",
                    size: { width: window.innerWidth, height: window.innerHeight },
                    //autoclose: 3000,
                    modal: true,
                    overflow: 'hidden',
                    theme: 'info',
                    position: "center",
                    controls: { buttons: 'closeonly', iconfont: 'bootstrap' }
                };
                var jsPanel = $('body').jsPanel(_jsoptins);

                _chartoptions.chart.height = window.innerHeight - 60;
                _chartoptions.chart.width = undefined;
                $('#jspanel-' + gid + ' > .jsPanel-content').highcharts(_chartoptions);
            });
            return;
            //歷史災情圖片,舊code
            $('.googleContentFix .meterInfoTemplateContent  .flood-event-image').off('click').on('click', function () {
                helper.misc.showBusyIndicator();
                var _villageSn=data.VILLAGESN;
                var _eventCode = $(this).attr('data-event-code');
                var _eventName = $(this).text();
                //_villageSn = 630251;
                //_eventName = "104蘇迪勒颱風";
                console.log(_villageSn + "  " + _eventCode + " " + _eventName);
                datahelper.getVillageFloodImage(_villageSn, _eventName, function (images) {
                    helper.misc.hideBusyIndicator();
                    if (images.length == 0)
                        alert("無圖片資料(" + _villageSn +","+_eventName+ ")!!");
                    else {
                        var _imgDoms = $.map(images, function (_img, _idx) {
                            return '<img src="' + app.siteRoot + _img.Url + '" style="margin: 0 auto;max-width:80%">';
                        });
                        var _imgCaptions = $.map(images, function (_img, _idx) {
                            return _img.Name;
                        });
                        var $_carousel = helper.bootstrap.genBootstrapCarousel(null, null, null, _imgDoms, _imgCaptions)
                        helper.jspanel.jspAlertMsg(null, { title: data.VILLAGESN + data.VillageName + '(' + _eventName + ')', autoclose: 9999999, theme: 'info', content: $_carousel.wrapAll('<div>').parent().html() });
                    }
                });

            });
        };
        return $_root.parent().html();
    },
    polyStyles: [{ name: '圖例', strokeColor: '#FF0000', strokeOpacity: 1, strokeWeight: 1, fillColor: '#FF0000', fillOpacity: .7, classes: 'red_status' }],

};