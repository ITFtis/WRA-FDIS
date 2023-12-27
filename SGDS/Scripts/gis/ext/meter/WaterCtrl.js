//$(document).ready(function () {
//setTimeout(function () {

//    }, 1000);
//});
if (!$.BasePinCtrl) {
    alert("未引用(WaterCtrl)BasePinCtrl");
}

(function ($) {
    var watersource = {
        basefunc: function (callback) {
            $.BasePinCtrl.helper.getWraFhyApi('WaterLevel/Station', null, function (ds) {
                var datas = $.map(ds.Data, function (val, idx) {
                    if (!val.Point) { console.log("水位基本資料" + val.StationName + "無座標"); }
                    return $.extend({ Station: val}, {
                        ST_NO: val.StationNo, NAME_C: val.StationName, BASIN_NO: val.BasinCode, COUN_ID: val.CityCode, ADDR_C: val.Address, TopLine: val.TopLevel,
                        WarningLine1: val.WarningLevel1, WarningLine2: val.WarningLevel2, WarningLine3: val.WarningLevel3, Long: val.Point.Longitude, Lat: val.Point.Latitude
                    });
                });
                callback(datas);
            });
            //抓meter
            //$.BasePinCtrl.helper.getWraMeterData('WaterStations', undefined, 'ArrayOfWaterStationBase.WaterStationBase', undefined, function (ds) {
            //    callback( $.grep(ds, function (d) { return d.Exist==1 }));
            //});
        },
        infofunc: function (dt, callback) {
            $.BasePinCtrl.helper.getWraFhyApi('WaterLevel/Info/RealTime', null, function (ds) {
                var datas = $.map(ds.Data, function (val, idx) {
                    var r = {Station:val, ST_NO: val.StationNo, DATE: val.Time, Info: val.WaterLevel};//, WaterWarnInfo: $.BasePinCtrl.pinIcons.water.normal.name };
                    return r;
                });
                callback(datas);
            });
            //$.BasePinCtrl.helper.getWraMeterData('wsCwbNewestWater', undefined, 'ArrayOfNewestWater.NewestWater', undefined, callback);
        },
        hourlyInfofunc: function (data, callback) {
            if (!data["Datetime"] )
                callback([]);
            else {
                var startdt = new Date(data["Datetime"]).addHours(-24).DateFormat('yyyy/MM/dd HH:mm:ss');
                var enddt = new Date(data["Datetime"]).DateFormat('yyyy/MM/dd HH:mm:ss');

                $.BasePinCtrl.helper.getWraFhyApi('WaterLevel/Info/Last24Hours/StationNo/' + data.ST_NO, null, function (ds) {
                    var datas = [];
                    if (ds.Data && ds.Data.length > 0 && ds.Data[0].Hours) {
                        var bdt = helper.format.JsonDateStr2Datetime(ds.Data[0].Time);
                        var datas = $.map(ds.Data[0].Hours, function (val, idx) {
                            var dt = new Date(bdt.getFullYear(), bdt.getMonth(), bdt.getDate(), val);
                            if (dt > bdt) dt = dt.addHours(-24);
                            var d = { ST_NO: data.ST_NO, DATE: dt, Info: ds.Data[0].WaterLevels[idx] };
                            return d;
                        });
                    }
                    datas.sort(function (a, b) { return a.DATE - b.DATE });
                    callback(datas);
                });
                //抓meter
                //$.BasePinCtrl.helper.getWraMeterData('WaterHistoryStage', { 'stationNo': data["StationID"], 'startDate': startdt, 'endDate': enddt }, 'ArrayOfNewestWater.NewestWater', undefined, function (ds) {
                //    ds.sort(function (a, b) {
                //        return JsonDateStr2Datetime(a.DATE).getTime() - JsonDateStr2Datetime(b.DATE).getTime();
                //    });
                //    callback(ds);
                //});
            }
        }
    };

    $.waterFormatter = {
        float: function (value, row) {
            if (value ===undefined || value ===null || value ==="" || parseFloat(value) < -99)
                return '---'
            else return parseFloat(value).toFixed(2);
        },
        datetime: function (value, row, source) {
            if (value) {
                var d = value.getMonth ? value : helper.format.JsonDateStr2Datetime(value);
                return (source === undefined || source != "InfoWindow") ? d.DateFormat("dd HH:mm") : d.DateFormat("yyyy/MM/dd HH:mm");
            }
            else
                return '---';
        }
    }
    $.WaterCtrl = {

        defaultSettings: {
            name: "水位站",
            layerid: "water_", map: undefined,
            stTitle: function (data) { return data.CName },
            loadBase: "https://140.124.60.39/Map/WS/Meter.asmx/WaterStations",
            loadInfo: "https://140.124.60.39/Map/WS/Meter.asmx/wsCwbNewestWater",
            loadHourlyInfo: "https://140.124.60.39/Map/WS/Meter.asmx/WaterHistoryStage",
            loadBase: watersource.basefunc,
            loadInfo: watersource.infofunc,
            loadHourlyInfo: watersource.hourlyInfofunc,
            hourlyFieldsInfo: { DateTime: "DATE", WaterLevel: "Info" },
            useTimeSeriesData :true,
            infoFields: [
                { field: 'CName', title: '站名' },
                { field: 'Datetime', title: '時間', formatter: $.waterFormatter.datetime },
                { field: 'WaterLevel', title: '水位', halign:'center', align: 'right', formatter: $.waterFormatter.float, unit: "公尺", sortable: true },
                { field: 'TopLine', title: '堤頂', visible: false, halign: 'center', align: 'right', formatter: $.waterFormatter.float, unit: "公尺", showInList: false },
                { field: 'WarningLine1', title: '一級', visible: false, formatter: $.waterFormatter.float, unit: "公尺", showInList: false },
                { field: 'WarningLine2', title: '二級', visible: false, halign: 'center', align: 'right', formatter: $.waterFormatter.float, unit: "公尺", showInList: false },
                { field: 'WarningLine3', title: '三級', visible: false, formatter: $.waterFormatter.float, unit: "公尺", showInList: false },
                ],
            legendIcons: [$.BasePinCtrl.pinIcons.water.normal, $.BasePinCtrl.pinIcons.water.warnLevel1, $.BasePinCtrl.pinIcons.water.warnLevel2, $.BasePinCtrl.pinIcons.water.warnLevel3, $.BasePinCtrl.pinIcons.water.noData],
            checkDataStatus: function (data, index) {
                var stas = '無資料';
                if (data.Status)
                    stas = data.Status;
               
                return $.BasePinCtrl.helper.getDataStatusLegendIcon(this.settings.legendIcons, stas);
                //return stas;
            },
            baseInfoMerge: {
                basekey: 'ST_NO', infokey: 'ST_NO', xfield: 'Long', yfield: 'Lat', aftermerge: function (d) {
                    d.StationID = d.ST_NO;
                    d.CName = d.NAME_C;
                    d.Status = $.BasePinCtrl.pinIcons.water.noData.name;
                    d.Datetime = JsonDateStr2Datetime(d.DATE);
                    d.WaterLevel = d.Info;
                    if (d.WaterLevel != undefined && d.WaterLevel != null) {
                        d.Status = $.BasePinCtrl.pinIcons.water.normal.name;
                        if (d.WarningLine1 != undefined && d.WaterLevel >= d.WarningLine1)
                            d.Status = $.BasePinCtrl.pinIcons.water.warnLevel1.name;
                        else if (d.WarningLine2 != undefined && d.WaterLevel >= d.WarningLine2)
                            d.Status = $.BasePinCtrl.pinIcons.water.warnLevel2.name;
                        else if (d.WarningLine3 != undefined && d.WaterLevel >= d.WarningLine3)
                            d.Status = $.BasePinCtrl.pinIcons.water.warnLevel3.name;
                    }
                }
            },//自動做transformData,basekey基本資料key,infokey資料key,xfield經度欄位,yfield緯度欄位
            transformData: $.BasePinCtrl.defaultSettings.transformData,
            transformData2: function (_base, _info) {//已由baseInfoMerge及新transformData取代
                var _that = this;
                if (this.baseInfoMerge && this.baseInfoMerge.basekey && _base && _base.length > 0) {
                    var ps = this.baseInfoMerge;
                    var rs = JSON.parse(JSON.stringify(_base));

                    $.each(rs, function () {
                        var b = this;
                        var bk = this[ps.basekey];
                        if (_info) {
                            var ifs = $.grep(_info, function (s) {
                                return bk == s[ps.infokey];
                            });
                            if (ifs.length > 0)
                                $.extend(b, ifs[0]);
                        }
                        if (ps.xfield)
                            b.X = helper.misc.getValueByPath(b, ps.xfield);
                        if (ps.yfield)
                            b.Y = helper.misc.getValueByPath(b, ps.yfield);
                        if (ps.aftermerge)
                            ps.aftermerge.call(_that, b);
                    });
                    return rs;
                }
                else
                    return _base && _base.length > 0 ? _base : _info;
            },
            transformData1: function (_base, _info) {
                var datas = [];
                $.each(_base, function (idxb, b) {
                    //var d = $.extend({}, $.WaterCtrl.defaultData);
                    var d = $.extend(JSON.parse(JSON.stringify(b)), $.WaterCtrl.defaultData);
                    d.CName = b.NAME_C;
                    d.StationID = b.ST_NO;
                    d.TopLine = b.TopLine;
                    d.WarningLine1 = b.WarningLine1;
                    d.WarningLine2 = b.WarningLine2;
                    d.WarningLine3 = b.WarningLine3;
                    d.X = b.Long;
                    d.Y = b.Lat;
                    d.Status = $.BasePinCtrl.pinIcons.water.noData.name;
                    d.Datetime = undefined;
                    $.each(_info, function (idxi, i) {
                        if (d.StationID == i.ST_NO) {
                            d.Datetime = JsonDateStr2Datetime(i.DATE);
                            d.WaterLevel = i.Info;
                            //d.Voltage = i.Voltage;
                            d.Status = $.BasePinCtrl.pinIcons.water.normal.name;
                            if (d.WarningLine1 != undefined && d.WaterLevel >= d.WarningLine1)
                                d.Status = $.BasePinCtrl.pinIcons.water.warnLevel1.name;
                            else if (d.WarningLine2 != undefined && d.WaterLevel >= d.WarningLine2)
                                d.Status = $.BasePinCtrl.pinIcons.water.warnLevel2.name;
                            else if (d.WarningLine3 != undefined && d.WaterLevel >= d.WarningLine3)
                                d.Status = $.BasePinCtrl.pinIcons.water.warnLevel3.name;
                            return false;
                        }
                    });
                    datas.push(d);
                });
                //console.log(JSON.stringify(datas));
                return datas;
            },
            pinInfoContent: function (data, infofields) {
                var current = this;
                var currentsetting = this.settings;
                var chartOptionsTemp, $chartdiv;
                infofields = this.infoFields;
                var constr = $.BasePinCtrl.defaultSettings.pinInfoContent.call(this, data);
                var iid = geguid();// sid + "_" + new Date().getTime();

                /*************/
                //carousel
                var $div = $('<div id="carousel_' + iid + '" class="carousel slide meterinfo carousel-dark" data-ride="carousel" data-interval="99999999"  data-bs-ride="carousel" data-bs-interval="99999999" style="width:100%;">');// style="width:' + this.cctvSize.width + 'px;height:' + this.cctvSize.height + 'px">');
                var $ol = $('<ol class="carousel-indicators">');
                var $sdiv = $('<div class="carousel-inner">');

                $ol.append(' <li data-target="#carousel_' + iid + '" data-slide-to="0" data-bs-slide-to="0"  class="active"></li>');
                $ol.append(' <li data-target="#carousel_' + iid + '" data-slide-to="1" data-bs-slide-to="1" class=""></li>');

                $sdiv.append('<div class="carousel-item item active" style="min-height:160px;">' + constr + '</div>');
                $sdiv.append('<div class="carousel-item item" style="min-height:160px;"><div id="chart_' + iid + '" style="min-height:160px;min-width:1px;width:100%; "></div><div>');
                
                $div.append($ol);
                $div.append($sdiv);

                $div.append('<a class="left carousel-control carousel-control-prev" href="#carousel_' + iid + '" role="button" data-slide="prev" data-bs-slide="prev">' +
                        '<span class="glyphicon glyphicon-chevron-left"></span>' +
                    '</a>' +
                    '<a class="right carousel-control carousel-control-next" href="#carousel_' + iid + '" role="button" data-slide="next" data-bs-slide="next">' +
                        '<span class="glyphicon glyphicon-chevron-right"></span>' +
                    '</a>');
                if (!this.settings.useTimeSeriesData)
                    $div.find('.carousel-control').hide();
                else $div.addClass('full-window-min-height-350');
                //else
                //    $('<div class="carouse-ctrl-container">-M</div>').appendTo($div);
                $ol.hide();

                //chart
                setTimeout(function () {
                    var chart;
                    var chartdatas;

                    var customoptions = currentsetting.getDurationOptions
                        .call(current, data);

                    var chartOptions = $.extend({}, chartOptionsTemp, customoptions);

                    current.$element.on($.BasePinCtrl.eventKeys.fullInfowindowChange, function () {
                        if ($chartdiv) {
                            var activechart = $(".active #" + $chartdiv[0].id).length > 0;
                            if (chartdatas && activechart)
                                setTimeout(function () { resetChart(chartdatas); }, 201);
                        }
                    });
                    var resetChart = function (infos) {
                        var gjs = [];
                        if (!window.Highcharts)
                            gjs.push($.AppConfigOptions.script.gispath + '/other/highcharts.js');
                        if (!window.charthelper)
                            gjs.push($.AppConfigOptions.script.gispath + '/charthelper.js');
                        helper.misc.getJavaScripts(gjs, function () {
                            painChart(infos);
                        });
                    }
                    var painChart = function (infos) {
                        helper.misc.hideBusyIndicator($chartdiv);
                        chartdatas = infos;
                        var _displayChartDatas = currentsetting.displayChartDatas.call(current, infos);
                        chart = charthelper.showMeterChart($chartdiv, data, _displayChartDatas, "", '水位m', 0, customoptions.seriespara,
                            function (chartoptions) {
                                chartoptions.yAxis.title.margin = 0;
                                chartoptions.yAxis.title.tickPixelInterval = 40;
                                chartoptions.xAxis.labels.formatter = function () {
                                    var ff = function (s) {
                                        return helper.format.paddingLeft(s, '0', 2);
                                    }
                                    var _date = new Date(this.value);
                                    return ff(_date.getHours()) + ':' + ff(_date.getMinutes());
                                }

                                chartoptions.chart.backgroundColor = undefined;
                                chartoptions.shared = false;
                                chartoptions.crosshairs = false;

                                chartoptions.legend.itemMarginBottom = 3;
                                chartoptions.legend.itemMarginTop = 1;
                                /*chartoptions.legend.itemWidth= 50;*/

                                var _ymax = -9999, _ymin = 99999, _adjust = false;
                                $.each(chartoptions.series, function (_i, _s) {
                                    if (_s.data) {
                                        if (!_s.mainseries)
                                            _adjust = true;
                                        $.each(_s.data, function () {
                                            _ymax = this.y > _ymax ? this.y : _ymax;
                                            _ymin = this.y < _ymin ? this.y : _ymin;
                                        });
                                    }
                                });
                                if (_adjust && _ymax != -9999 && _ymax != _ymin) {
                                    chartoptions.yAxis.max = _ymax + Math.abs(_ymax - _ymin) * 0.08;
                                    chartoptions.yAxis.min = _ymin - Math.abs(_ymax - _ymin) * 0.05;
                                }
                                //chartoptions.yAxis.min = 340;
                                if (customoptions.chartoptions)
                                    customoptions.chartoptions(chartoptions);
                            }, function (idx) {
                                //charthelper.setTableChartFocus(idx, [], [$_t]);
                            });
                    }

                    $("#carousel_" + iid).on("slide.bs.carousel", function () {
                        if (!$chartdiv)
                            $chartdiv = $("#chart_" + iid, this);
                    });

                    var _displayTimeFlag;
                    $("#carousel_" + iid).on('slid.bs.carousel', function (df, rwr, qwe) {
                        var activechart = $(".active #" + $chartdiv[0].id).length > 0;
                        if (!activechart)
                            return;
                      

                        //GMT+0800 chart 會變成UTC時間，所以先加8在讓chart減，這樣呈現的時間才會正確
                        //var st = new Date(customoptions.startdt.setHours(customoptions.startdt.getHours()+8)).DateFormat("yyyy/MM/dd HH:mm:ss");
                        //var et = new Date(customoptions.enddt.setHours(customoptions.enddt.getHours() + 8)).DateFormat("yyyy/MM/dd HH:mm:ss");

                        //if (st + et == _displayTimeFlag) { //同時間區間資料不重Load
                        //    //if (chart)
                        //    //    chart.reflow();
                        //    if (chartdatas)
                        //        resetChart(chartdatas);
                        //    return;
                        //}
                        //_displayTimeFlag = st + et; 
                        //$chartdiv.show_busyIndicator();

                             
                        helper.misc.showBusyIndicator($chartdiv);
                        if (typeof customoptions.getDurationData === 'function')
                        {
                            customoptions.getDurationData(data, jQuery.proxy(resetChart, current));
                        }
                        else if (typeof customoptions.getDurationData === 'object') {
                            $.ajax(customoptions.getDurationData).done(function (result, status) {
                                resetChart(result.d);
                            }).fail(function (data, status) {
                                console.log(data);
                                $chartdiv.hide_busyIndicator();
                            });
                        }

                    });
                },300);

                return $div[0].outerHTML;
            },
            chartOption:{

            },
            getDurationOptions: function (data) { //{hourlyFieldsInfo:{DateTime:"DATE", WaterLevel:"Info"},}
                //this指的是 current
                var result = {
                    //hourlyFieldsInfo: {
                    //    DateTime: "DATE",
                    //    WaterLevel: "Info",
                    //},
                    seriespara:
                    {
                        level: {
                            name: '水位', color: '#0000FF', type: 'line', dt: this.settings.hourlyFieldsInfo.DateTime, info: this.settings.hourlyFieldsInfo.WaterLevel, unit: 'm'
                        },
                        warn: [
                            { name: '一級', color: '#FF0000', info: 'WarningLine1' },
                            { name: '二級', color: '#FFA500', info: 'WarningLine2' },
                            { name: '三級', color: '#FFFF00', info: 'WarningLine3' },
                            { name: '堤頂', color: '#000000', info: 'TopLine' }
                        ],
                        wave: { enabled: false }
                    },
                    chartoptions: function (_options) { }
                };

                result.startdt = new Date(data["Datetime"]).addHours(-24);
                result.enddt = new Date(data["Datetime"]);
                result.stationNo = data["StationID"]
                if (typeof this.settings.loadHourlyInfo === "function") {
                    result.getDurationData = this.settings.loadHourlyInfo;
                } else {
                    result.getDurationData = {
                        //url: "https://water.tainan.gov.tw/WebServices/WaterService.asmx/GetHourInfos",
                        url: this.settings.loadHourlyInfo,
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        type: "POST",
                        data: "{ 'stationNo':'" + data["StationID"] + "', 'startDate':'" + result.startdt.DateFormat("yyyy/MM/dd HH:mm:ss") + "', 'endDate':'" + result.enddt.DateFormat("yyyy/MM/dd HH:mm:ss") + "' }"
                    };
                }
                return result;
            },
            displayChartDatas: function (datas) {
                return datas;
            },
            filterChartInfo: function (info, customoptions) {
                var dtd = JsonDateStr2Datetime(info[this.settings.hourlyFieldsInfo.DateTime]);
                var v = parseFloat(info[this.settings.hourlyFieldsInfo.WaterLevel]);
                var hhh = dtd.getMinutes();
                if (dtd.getMinutes() != 0 || v < -99)
                    return false;
                else return true;
            }
        },
        defaultData: { CName: '', Datetime: undefined, WaterLevel: -998, Voltage: undefined, X: 0, Y: 0 },
        leaflet: {
            markerCluster_defaultIconCreateFunction: function (markerClusterGroup, mg) { //複寫 for leaflet markerCluster
                var divIcon = markerClusterGroup._defaultIconCreateFunction(mg);
                var _class = $.BasePinCtrl.pinIcons.water.noData.classes;
                if ($.grep(mg.getAllChildMarkers(), function (r) {return r.pinstatus.classes == $.BasePinCtrl.pinIcons.water.warnLevel1.classes}).length > 0)
                    _class = $.BasePinCtrl.pinIcons.water.warnLevel1.classes;
                else if ($.grep(mg.getAllChildMarkers(), function (r) { return r.pinstatus.classes == $.BasePinCtrl.pinIcons.water.warnLevel2.classes }).length > 0)
                    _class = $.BasePinCtrl.pinIcons.water.warnLevel2.classes;
                else if ($.grep(mg.getAllChildMarkers(), function (r) { return r.pinstatus.classes == $.BasePinCtrl.pinIcons.water.warnLevel3.classes }).length > 0)
                    _class = $.BasePinCtrl.pinIcons.water.warnLevel3.classes;
                else if ($.grep(mg.getAllChildMarkers(), function (r) { return r.pinstatus.classes == $.BasePinCtrl.pinIcons.water.normal.classes }).length > 0)
                    _class = $.BasePinCtrl.pinIcons.water.normal.classes;
                divIcon.options.className += " water " + _class;
                return divIcon;
            }
        }
    }
    var pluginName = 'WaterCtrl'
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = $.extend({}, $.WaterCtrl.defaultSettings);// {map:undefined, width:240};
        this.__pinctrl = undefined;
        this.__baseData = undefined;
        this.__infoData = undefined;
        this.currentDatetime = new Date();
        this.isInitCompleted = false;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);
            var current = this;
            this.__pinctrl = this.$element.BasePinCtrl(this.settings).on($.BasePinCtrl.eventKeys.initLayer, function (ss) {
                current.isInitCompleted = true;
                current.__pinctrl.instance._mapctrl._defaultIconCreateFunction = $.WaterCtrl.leaflet.markerCluster_defaultIconCreateFunction; //複寫 for leaflet markerCluster
                current.reload(current.currentDatetime);
            });

        },
        reload: function (dt) {
            this.currentDatetime = this.__pinctrl.instance.currentDatetime = dt;
            if (!this.isInitCompleted)
                return;
            $.BasePinCtrl.helper.reload.call(this, dt);
        },
        setFilter: function (filter) {
            this.__pinctrl.instance.setFilter(filter);
        },
        fitBounds: function () {
            this.__pinctrl.instance.fitBounds();
        },
        setBoundary: function (inBoundary) {
            this.__pinctrl.instance.setBoundary(inBoundary);
        },
        __loadBaseCompleted: function (results) {
            this.__baseData = results;
            this.refreshData();
        },
        __loadInfoCompleted: function (results) {
            this.__infoData = results;
            this.refreshData();
        },
        refreshData: function () {
            var current = this;
            if (this.__baseData && this.__infoData) {
                current.__pinctrl.instance.setData(this.settings.transformData(this.__baseData, this.__infoData));
            }
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