if (!$.BasePinCtrl) {
    alert("未引用(RainCtrl)BasePinCtrl");
}

(function ($) {
    var rainsource = {
        basefunc: function (callback) {
            $.BasePinCtrl.helper.getWraFhyApi('Rainfall/Station', null, function (ds) {
                var datas = $.map(ds.Data, function (val, idx) {
                    if (!val.Point) { console.log("雨量基本資料" + val.StationName + "無座標"); }
                    return { ST_NO: val.StationNo, NAME_C: val.StationName, BASIN_NO: val.BasinCode, COUN_ID: val.CityCode, ADDR_C: val.Address, Long: val.Point.Longitude, Lat: val.Point.Latitude };
                });
                callback(datas);
            });
            //抓meter
            //$.BasePinCtrl.helper.getWraMeterData('RainStations', undefined, 'ArrayOfRainStationBase.RainStationBase', undefined, callback);
        },
        infofunc: function (dt, callback) {
            $.BasePinCtrl.helper.getWraFhyApi('Rainfall/Info/RealTime', null, function (ds) {
                var datas = $.map(ds.Data, function (val, idx) {
                    //var r = { ST_NO: val.StationNo, NAME_C: "", EventNo: "", DATE: val.Time, M10: val.M10, H1: val.H1, H3: val.H3, H6: val.H6, H12: val.H12, H24: val.H24, Status: $.BasePinCtrl.pinIcons.rain.normal.name };
                    //20221011拿掉NAME_C
                    var r = { ST_NO: val.StationNo, EventNo: "", DATE: val.Time, M10: val.M10, H1: val.H1, H3: val.H3, H6: val.H6, H12: val.H12, H24: val.H24, Status: $.BasePinCtrl.pinIcons.rain.normal.name };
                    //r.H24 = Math.random() * 600;

                    if (r.H24 && r.H24 >= 500) r.Status = $.BasePinCtrl.pinIcons.rain.extremely_torrential.name;
                    else if (r.H24 && r.H24 >= 350) r.Status = $.BasePinCtrl.pinIcons.rain.torrential.name;
                    else if ((r.H24 && r.H24 >= 200) || (r.H3 && r.H3 >= 100)) r.Status = $.BasePinCtrl.pinIcons.rain.extremely.name;
                    else if ((r.H24 && r.H24 >= 80) || (r.H1 && r.H1 >= 40)) r.Status = $.BasePinCtrl.pinIcons.rain.heavy.name;
                    return r;
                });
                callback(datas);
            });
            //抓meter
            //$.BasePinCtrl.helper.getWraMeterData('wsReportsRain', undefined, 'ArrayOfReportsRainInfo.ReportsRainInfo', undefined, callback);
        },
        hourlyInfofunc: function (data, callback) {
            $.BasePinCtrl.helper.getWraFhyApi('Rainfall/Info/Last24Hours/StationNo/' + data.ST_NO, null, function (ds) {
                var datas = [];
                if (ds.Data && ds.Data.length>0 && ds.Data[0].Hours) {
                    var bdt = helper.format.JsonDateStr2Datetime( ds.Data[0].Time);
                    var datas = $.map(ds.Data[0].Hours, function (val, idx) {
                        var dt = new Date(bdt.getFullYear(), bdt.getMonth(), bdt.getDate(), val);
                        if(dt>bdt) dt = dt.addHours(-24);
                        var d = { ST_NO: data.ST_NO, DATE: dt, H1: ds.Data[0].H1[idx] };
                        return d;
                    });
                }
                datas.sort(function (a, b) { return a.DATE -b.DATE});
                callback(datas);
            });
            //抓meter
            //var startdt = new Date(data["Datetime"]).addHours(-24).DateFormat('yyyy/MM/dd HH:mm:ss');
            //var enddt = new Date(data["Datetime"]).DateFormat('yyyy/MM/dd HH:mm:ss');
            //$.BasePinCtrl.helper.getWraMeterData('RainInfoSummaryByTime', { 'stationNo': data["StationID"], 'startDate': startdt, 'endDate': enddt }, 'ArrayOfRainStationInfo.RainStationInfo', undefined, callback);
        }
    };

    $.rainFormatter = {
        float: function (value, row) {
            if (value===undefined || parseFloat(value) < -99)
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

    $.RainCtrl = {

        defaultSettings: {
            name: "雨量站",
            layerid: "rain_", map: undefined,
            pinInfoLabelMinWidth: "75px",
            loadBase: "https://140.124.60.39/Map/WS/Meter.asmx/RainStations",
            loadInfo: "https://140.124.60.39/Map/WS/Meter.asmx/wsReportsRain",
            loadHourlyInfo: "https://140.124.60.39/Map/WS/Meter.asmx/RainInfoSummaryByTime",
            loadBase: rainsource.basefunc,
            loadInfo: rainsource.infofunc,
            loadHourlyInfo: rainsource.hourlyInfofunc,
            hourlyFieldsInfo: { DateTime: "DATE", RQ: "H1" },
            useTimeSeriesData:true,
            stTitle: function (data) { return data.CName },
            //listOptions: { virtualScroll: true},
            infoFields: [
                {
                    field: 'CName', title: '站 名', formatter: function (v, data) {
                        return v + '(' + data.StationID + ')';
                    }
                },
                { field: 'Datetime', title: '時 間', formatter: $.rainFormatter.datetime },
                { field: 'R10M', title: '最新10分鐘', formatter: $.rainFormatter.float, unit: "毫米", sortable: true },
                { field: 'R1H', title: '時 雨 量', formatter: $.rainFormatter.float, unit: "毫米", sortable: true },
                { field: 'R3H', title: '累計 3小時', formatter: $.rainFormatter.float, unit: "毫米", showInList:false },
                { field: 'R6H', title: '累計 6小時', formatter: $.rainFormatter.float, unit: "毫米", showInList: false },
                { field: 'R12H', title: '累計12小時', formatter: $.rainFormatter.float, unit: "毫米", showInList: false },
                { field: 'R24H', title: '累計24小時', formatter: $.rainFormatter.float, unit: "毫米", showInList: false },
                //{ field: 'R1D', title: '累計1日', formatter: $.rainFormatter.float, unit: "毫米", showInList: false },
                //{ field: 'R2D', title: '累計2日', formatter: $.rainFormatter.float, unit: "毫米", showInList: false },
                //{ field: 'R3D', title: '累計3日', formatter: $.rainFormatter.float, unit: "毫米", showInList: false },
                ],
            legendIcons: [$.BasePinCtrl.pinIcons.rain.normal, $.BasePinCtrl.pinIcons.rain.heavy, $.BasePinCtrl.pinIcons.rain.extremely, $.BasePinCtrl.pinIcons.rain.torrential, $.BasePinCtrl.pinIcons.rain.extremely_torrential, $.BasePinCtrl.pinIcons.rain.noData],
            checkDataStatus: function (data, index) {
                return $.BasePinCtrl.helper.getDataStatusLegendIcon(this.settings.legendIcons, data.Status);
                //return $.BasePinCtrl.helper.getDataStatusLegendIcon($.RainCtrl.defaultSettings.legendIcons, data.Status);
                //return stas;
            },
            baseInfoMerge: {
                basekey: 'ST_NO', infokey: 'ST_NO', xfield: 'Long', yfield: 'Lat', aftermerge: function (d) {
                    d.StationID = d.ST_NO;
                    d.CName = d.NAME_C;
                   
                    d.Datetime = JsonDateStr2Datetime(d.DATE);
                    d.R10M = d.M10;
                    d.R1H = d.H1;
                    d.R3H = d.H3;
                    d.R6H = d.H6;
                    d.R12H = d.H12;
                    d.R24H = d.H24;
                    d.R1D = d.D1;
                    d.R2D = d.D2;
                    d.R3D = d.D3;
                    if (d.Status == undefined)
                        d.Status = $.BasePinCtrl.pinIcons.rain.noData.name;
                }
            },//自動做transformData,basekey基本資料key,infokey資料key,xfield經度欄位,yfield緯度欄位
            transformData: $.BasePinCtrl.defaultSettings.transformData,
            transformData1: function (_base, _info) { //已由baseInfoMerge及新transformData取代
                var datas = [];
                $.each(_base, function (idxb, b) {
                    var d = $.extend(JSON.parse(JSON.stringify(b)), $.RainCtrl.defaultData);
                    d.CName = b.NAME_C;
                    d.StationID = b.ST_NO;
                    d.X = b.Long;
                    d.Y = b.Lat;
                    d.COUN_ID = b.COUN_ID;
                    d.Status = "無資料";
                    d.Datetime = undefined;
                    $.each(_info, function (idxi, i) {
                        if (d.StationID == i.ST_NO) {
                            d.Datetime = JsonDateStr2Datetime(i.DATE);
                            d.R10M = i.M10;
                            d.R1H = i.H1;
                            d.R3H = i.H3;
                            d.R6H = i.H6;
                            d.R12H = i.H12;
                            d.R24H = i.H24;
                            d.R1D = i.D1;
                            d.R2D = i.D2;
                            d.R3D = i.D3;
                            d.Status = i.Status;
                            if (!d.Status)
                                console.log("d.StationID:" + d.StationID + d.CName);
                            return false;
                        }
                    });
                    datas.push(d);
                });
                //console.log("rainctrl transformData end "+new Date());
                return datas;
            },
            pinInfoContent: function (data, infofields) {
                var current = this;
                var currentsetting = this.settings;
                infofields = this.infoFields;
                var chartOptions, $chartdiv;
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
                $ol.hide();

                //chart
                setTimeout(function () {
                    var chart;
                    var chartdatas;

                    var customoptions = currentsetting.getDurationOptions
                        .call(current, data);

                    //var chartOptions = $.extend({}, chartOptionsTemp, customoptions);

                    current.$element.on($.BasePinCtrl.eventKeys.fullInfowindowChange, function () {
                        if ($chartdiv) {
                            var activechart = $(".active #" + $chartdiv[0].id).length > 0;
                            if (chartdatas && activechart)
                                setTimeout(function () { resetChart(chartdatas); }, 201);
                        }
                    });
                    var resetChart = function (infos) {
                        var ds = infos;// $.grep(infos, function (d) { return d[current.settings.hourlyFieldsInfo.RQ] >= 0; });
                        var gjs = [];
                        if (!window.Highcharts)
                            gjs.push($.AppConfigOptions.script.gispath + '/other/highcharts.js');
                        if (!window.charthelper)
                            gjs.push($.AppConfigOptions.script.gispath + '/charthelper.js');
                        helper.misc.getJavaScripts(gjs, function () {
                            painChart(ds);
                        });
                    }
                    var painChart = function (infos) {
                        //$.each(infos, function () {
                        //    this.H1 = Math.floor(Math.random() * 10);
                        //});
                        helper.misc.hideBusyIndicator($chartdiv);
                        chartdatas = infos;
                        var _displayChartDatas = currentsetting.displayChartDatas.call(current, infos);
                        chart = charthelper.showMeterChart($chartdiv, data, _displayChartDatas, "", '雨量mm', 0, customoptions.seriespara,
                            function (chartoptions) {
                                //console.log(_displayChartDatas);
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

                                var _max1H = 0, _sum = 0;
                                $.each(_displayChartDatas, function () {
                                    var _r = this[current.settings.hourlyFieldsInfo.RQ];
                                    _max1H = _max1H < _r ? _r : _max1H;
                                    _sum += _r;
                                });
                                chartoptions.xAxis = [chartoptions.xAxis, { lineWidth: 1, opposite: true }];
                                chartoptions.yAxis = [{
                                    title: {
                                        text: '累計雨量(mm)',
                                        margin: 4
                                    },
                                    labels: {
                                        x: -4,
                                        formatter: function () {
                                            //return this.value < _sum + this.axis.tickInterval ? this.value : '';
                                            return this.value < _sum + (_sum % this.axis.tickInterval == 0 ? 0 : this.axis.tickInterval) ? this.value : '';
                                        }
                                    },
                                    max: _sum == 0 ? 1 : _sum * 2.1,
                                    min: 0,
                                    lineWidth: 1,
                                    gridLineWidth: 0,
                                    gridLineDashStyle: 'dash',
                                    startOnTick: false,
                                    endOnTick: false,
                                    //minTickInterval: 1,
                                    //tickAmount: 4,
                                },
                                {
                                    title: {
                                        text: '雨量(mm)',
                                        margin: 4
                                    },
                                    labels: {
                                        x: 4,
                                        formatter: function () {
                                            return this.value < _max1H + (_max1H % this.axis.tickInterval == 0 ? 0 : this.axis.tickInterval) ? this.value : '';
                                        }
                                    },
                                    max: _max1H == 0 ? 1 : _max1H * 2.1,
                                    min: 0,
                                    lineWidth: 1,
                                    reversed: true,
                                    gridLineWidth: 0,
                                    gridLineDashStyle: 'dash',
                                    startOnTick: false,
                                    endOnTick: false,
                                    opposite: true,
                                    //tickAmount: 12
                                }
                                ];
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
                    
                    $("#carousel_" + iid).on('slid.bs.carousel', function (df, rwr, qwe) {

                        var activechart = $(".active #" + $chartdiv[0].id).length > 0;
                        if (!activechart)
                            return;

                        helper.misc.showBusyIndicator($chartdiv);
                        if (typeof customoptions.getDurationData === 'function') {
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
                }, 300);

                return $div[0].outerHTML;
                /************/
            },
            getDurationOptions: function (data) {
                //this指的是 current
                var result = {
                    seriespara:
                    {
                        warn: [
                            
                        ],
                        level: {
                            name: '雨量', color: '#0000FF', type: 'column', yAxis: 1, dt: this.settings.hourlyFieldsInfo.DateTime, info: this.settings.hourlyFieldsInfo.RQ, unit: 'mm'
                        },
                        sumlevel: {
                            name: '累計雨量', color: '#FF0000', type: 'line', threshold: 0, unit: 'mm', marker: { enabled: true, states: { hover: { enabled: false } } }
                        },
                        wave: { enabled: false }
                    },
                    chartoptions: function (_options) { }
                };
                result.startdt = new Date(data["Datetime"]).addHours(-24);
                result.enddt = new Date(data["Datetime"]);
                if (typeof this.settings.loadHourlyInfo === "function") {
                    result.getDurationData = this.settings.loadHourlyInfo;
                } else {
                    result.getDurationData = {
                        url: this.settings.loadHourlyInfo,
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        type: "POST",
                        data: "{ 'startDate':'" + result.startdt.DateFormat("yyyy/MM/dd HH:mm:ss") + "', 'endDate':'" + result.enddt.DateFormat("yyyy/MM/dd HH:mm:ss") + "','stationNo':'" + data["StationID"] + "' }"
                    };
                }
                return result;
            },
            displayChartDatas: function (datas) {
                //return $.grep(datas, function (d) { return d[current.settings.hourlyFieldsInfo.RQ] >= 0; });
                var that = this;
                return $.grep(datas, function (d) { return d[that.settings.hourlyFieldsInfo.RQ] >= 0; });
            },
            filterChartInfo: function (info, chartoptions) {
                var dtd = JsonDateStr2Datetime(info[this.settings.hourlyFieldsInfo.DateTime]);
                var v = parseFloat(info[this.settings.hourlyFieldsInfo.RQ]);
                var hhh = dtd.getMinutes();
                if (dtd.getMinutes() != 0 || v < -99)
                    return false;
                else return true;
            }
        },
        defaultData: { CName: '', Datetime: undefined, StationID: "", R10M: -998, R1H: -998, R3H: -998, R6H: -998, R12H: -998, R24H: -998, R1D: -998, R2D: -998, R3D: -998 },
        leaflet: {
            markerCluster_defaultIconCreateFunction : function (markerClusterGroup, mg) { //複寫 for leaflet markerCluster
                var divIcon = markerClusterGroup._defaultIconCreateFunction(mg);
                var _class = $.BasePinCtrl.pinIcons.rain.noData.classes;
                if ($.grep(mg.getAllChildMarkers(), function (r) { return r.pinstatus.classes == $.BasePinCtrl.pinIcons.rain.extremely_torrential.classes }).length > 0)
                    _class = $.BasePinCtrl.pinIcons.rain.extremely_torrential.classes;
                else if ($.grep(mg.getAllChildMarkers(), function (r) { return r.pinstatus.classes == $.BasePinCtrl.pinIcons.rain.torrential.classes }).length > 0)
                    _class = $.BasePinCtrl.pinIcons.rain.torrential.classes;
                else if ($.grep(mg.getAllChildMarkers(), function (r) { return r.pinstatus.classes == $.BasePinCtrl.pinIcons.rain.extremely.classes }).length > 0)
                    _class = $.BasePinCtrl.pinIcons.rain.extremely.classes;
                else if ($.grep(mg.getAllChildMarkers(), function (r) { return r.pinstatus.classes == $.BasePinCtrl.pinIcons.rain.heavy.classes }).length > 0)
                    _class = $.BasePinCtrl.pinIcons.rain.heavy.classes;
                else if ($.grep(mg.getAllChildMarkers(), function (r) { return r.pinstatus.classes == $.BasePinCtrl.pinIcons.rain.normal.classes }).length > 0)
                    _class = $.BasePinCtrl.pinIcons.rain.normal.classes;
                divIcon.options.className += " rain " + _class;
                return divIcon;
            }
        }
    }
    var pluginName = 'RainCtrl'
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = $.extend({}, $.RainCtrl.defaultSettings);// {map:undefined, width:240};
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
            this.__pinctrl =this.$element.BasePinCtrl(this.settings).on($.BasePinCtrl.eventKeys.initLayer, function (ss) {
                current.isInitCompleted = true;
                current.__pinctrl.instance._mapctrl._defaultIconCreateFunction = $.RainCtrl.leaflet.markerCluster_defaultIconCreateFunction; //複寫 for leaflet markerCluster
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