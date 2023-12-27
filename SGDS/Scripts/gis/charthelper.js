(function () {
    var showMeterTable = function ($_c, datas, fields, doexport) {
        var $_t = $('<table>').appendTo($_c.empty());
        if (doexport) {
            $('<span class="btn btn-default glyphicon glyphicon-export btn-sm pull-right" style="margin-bottom:4px">匯出</span>').insertBefore($_t).on('click', function () {
                helper.misc.tableToExcel($_t, undefined, undefined, 'csv');
            });
        }
        var h = $_c.height();

        $_t.bootstrapTable({
            striped: true,
            columns: fields,
            height: h,//- ph * 2 ,// - (doexport?30:0),
            data: datas,
            formatNoMatches: function () { return '查無資料!!' }
        });
        $_t.find('tr').on('mouseover', function (e) {
            var idx = $(this).attr('data-index');
            $_t.trigger('table-change-index', [idx, $_t.bootstrapTable('getScrollPosition')]);// this.offsetTop]);
        });
        return $_t;
    }
    
    var showMeterChart = function ($_c, st, ddatas, title, yAxistitle, yAxismin, serdefs, beforePainChart, mouseIndexChageCallback) {
        __setHighchartsLang();
        var datas = [];
        var _id = helper.misc.geguid();
        var $t = $('<div id="chart-' + _id + '" class="meter-chart-container">').appendTo($_c.empty());
        
        var _chartoptions = {
            accessibility: {
                enabled: false
            },
            chart: {
                //animation:false,
                renderTo: 'chart-' + _id,
                spacing: [10, 6, 0, 0],
                height: $_c.height(),
                backgroundColor: {
                    linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
                    stops: [
                        [0, 'rgb(255, 255, 255)'],
                        //[.75, 'rgb(250, 250, 250)'],
                        [1, 'rgb(230, 230, 230)']
                    ]
                }
            },
            tooltip: {
                hideDelay: 10,
                shared: true,
                crosshairs: true, //畫base line
                formatter: function (evt) {
                    var _r = ['日期:' + new Date(this.x).DateFormat('MM/dd HH:mm')];
                    $.each(this.points, function () {
                        var thisp = this;
                       
                        _r.push(this.series.name + ':' + (this.y != undefined ? (this.y).toFixed(2) + ' ' + (this.series.userOptions.unit || 'mm') : '-'));
                        //if (_alerts) { 警戒水位僅有點2邊才會出現
                        //    var _as = $.grep(_alerts, function (s) {
                        //        if (s.data.length > 0)
                        //            _r.push(s.name + ':' + (s.data[0].y + ' ' + (s.series && s.series.userOptions && s.series.userOptions.unit || 'mm') ));
                        //    });
                        //}
                    });
                    return _r.join('<br>');
                },
            },
            credits: {
                enabled: false
            },
            title: {
                margin: 0,
                text: title
            },
            xAxis: {
                type: 'datetime',
                minPadding: 0,
                maxPadding: 0,
                labels: { //未移除左右兩邊空白 ,不設定categories,設定tickInterval、minPadding、maxPadding、startOnTick、endOnTick
                    enabled: true,
                    formatter: function () {
                        var ff = function (s) {
                            return helper.format.paddingLeft(s, '0', 2);
                        }
                        var _date = new Date(this.value);
                        return ff(_date.getMonth() + 1) + '/' + ff(_date.getDate()) + '<br>' + ff(_date.getHours()) + ':' + ff(_date.getMinutes());
                    }
                },
            },
            yAxis: {
                title: {
                    text: yAxistitle,
                    margin: 4
                },
                lineWidth: 1,
                gridLineDashStyle: 'dash',
            },
            legend: {
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom',
                borderWidth: 0,
                itemDistance: 10,
                maxHeight: 80,
                padding: 0,
                margin: 0
            },
            plotOptions: {
                line: {
                    point: {
                        events: {
                            mouseOver: function () {
                                if (mouseIndexChageCallback)
                                    mouseIndexChageCallback(this.index, this.x, this.y, this);
                            }
                        }
                    }
                },
                spline: {
                    point: {
                        events: {
                            mouseOver: function () {
                                if (mouseIndexChageCallback)
                                    mouseIndexChageCallback(this.index, this.x, this.y, this);
                            }
                        }
                    }
                },
                column: {
                    point: {
                        events: {
                            mouseOver: function () {
                                if (mouseIndexChageCallback)
                                    mouseIndexChageCallback(this.index, this.x, this.y, this);
                            }
                        }
                    }
                },
                series: {
                    states: {
                        inactive: {
                            opacity: 1 //除select series，其他series的透明度
                        }
                    }
                }
            },
            series: datas
        }
        //歷線
        var _info = $.extend({ name: '', mainseries: true, color: '#0000FF', data: [], marker: { symbol: 'circle', enabled: true, width: 4 } }, serdefs.level);
        //水波#1E90FF'#ADD8E6'
        var ic = new Highcharts.Color(_info.color); //Highcharts.Color(_info.color);// 可能hightcharts更新版本有問題 20230427  ????????????????????
        var _waveinfo = $.extend({
            enabled: true, name: '水波', color: {
                linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
                stops: [
                    [0, ic.setOpacity(.3).get('rgba')],// '#1E90FF'], // start
                    [0.7, ic.setOpacity(.13).get('rgba')],//'#ADD8E6'], // middle
                    [1, ic.setOpacity(.06).get('rgba')]//'rgba(124,181,236,0.2)'] // end
                ]
            }, data: [], type: 'area', opacity: .4, fillOpacity: .4, lineWidth: 0, enableMouseTracking: false, showInLegend: false, threshold: null, animation: false, states: { hover: { enabled: false } }, tooltip: { enabled: false }, marker: { enabled: false }
        }, serdefs.wave);
        //累計歷線
        var _suminfo;
        if (serdefs.sumlevel) {
            _suminfo = $.extend({ name: '', color: '#0000FF', data: [], marker: { symbol: 'circle', enabled: true, width: 4 } }, serdefs.sumlevel);
        }
        //警戒線
        if (serdefs.warn) {
            var _alerts = $.map(serdefs.warn, function (w) {
                return $.extend({ name: "警戒", color: '#FF0000', warn: true, dashStyle: 'Dash', type: 'line', data: [], marker: { enabled: false }, animation: false, marker: { enabled: false }, states: { hover: { enabled: false } }, tooltip: { enabled: false } }, w);
            });
        }

        var _mindt, _maxdt, _sum = 0, _minv, _maxv; //_minv, _maxv水波用
        if (_info.dt) { //X軸是時間
            ddatas.sort(function (a, b) { return JsonDateStr2Datetime(a[_info.dt]).getTime() - JsonDateStr2Datetime(b[_info.dt]).getTime() });

            $.each(ddatas, function () {
                var _dt = JsonDateStr2Datetime(this[_info.dt]).getTime();
                var v = this[_info.info];
                //v = 2;
                _mindt = !_mindt || _mindt > _dt ? _dt : _mindt;
                _maxdt = !_maxdt || _maxdt < _dt ? _dt : _maxdt;
                _minv = !_minv || _minv > v ? v : _minv;
                _maxv = !_maxv || _maxv < v ? v : _maxv;
                _info.data.push({ x: _dt, y: v });
                _sum += v;
                if (_suminfo)
                    _suminfo.data.push({ x: _dt, y: _sum });
                //_displayLevel = this.WaterLevel;
            });
        }
        else if (_info.xValue) { //X軸是數值
            ddatas.sort(function (a, b) { return a - b });

            $.each(ddatas, function () {
                var xv = this[_info.xValue];
                var v = this[_info.info];
                //v = 2;
                _mindt = !_mindt || _mindt > xv ? xv : _mindt;
                _maxdt = !_maxdt || _maxdt < xv ? xv : _maxdt;
                _minv = !_minv || _minv > v ? v : _minv;
                _maxv = !_maxv || _maxv < v ? v : _maxv;
                _info.data.push({ x: xv, y: v });
                _sum += v;
                if (_suminfo)
                    _suminfo.data.push({ x: xv, y: _sum });
                //_displayLevel = this.WaterLevel;
            });
        }


        //效果用
        //var cleveltemp = [];
        var loopc = 0;
        var _requestAnimationFrame = 0;
        var redrwWaveInfo = function () {

            if (_info.data.length > 0 && _mindt != _maxdt) {
                if ($('#chart-' + _id).length > 0)
                    _requestAnimationFrame = requestAnimationFrame(redrwWaveInfo);
                var _step = 20;

                if (loopc % 20 == 0) {
                    var _steprang = (_maxdt - _mindt) / _step;
                    var ov = _info.data[_info.data.length - 1].y;
                    var _wdatas = [];
                    for (var i = 0; i <= _step; i++) {
                        _wdatas.push({ x: _mindt + i * _steprang, y: ov - Math.sin(i + loopc) * (_maxv - _minv) / 100 });//[i][1] = clevel[i][1] - Math.sin(i) * (maxvalue - minvalue) / 100;
                    }
                    _wdatas[_wdatas.length - 1] = _info.data[_info.data.length - 1]; //最後一筆同最新水位
                    $.each(chart.series, function () {
                        if (this.name == '水波')
                            this.setData(_wdatas, true);
                    });
                }
                loopc++;
            }//效果用
        }

        if (_mindt == undefined && _maxdt == undefined) { //no data
            _maxdt = Date.now();
            _mindt = _maxdt - 24 * 60 * 60 * 1000;//24HR
            _chartoptions.xAxis.tickAmount = 6;
        }
        _chartoptions.xAxis.min = _mindt;
        _chartoptions.xAxis.max = _maxdt;
        $.each(_alerts, function () {
            if (this.info != undefined) {
                var v = undefined;
                if (typeof this.info === 'number') 
                    v = this.info;
                else if ( st && st[this.info] != undefined && st[this.info] > -99) 
                    v = st[this.info];
                    
                if (v != undefined) {
                    this.data.push({ x: _mindt, y: v });
                    this.data.push({ x: _maxdt, y: v });
                    datas.push(this); //加入警戒線

                    _minv = !_minv || _minv > v ? v : _minv;
                    _maxv = !_maxv || _maxv < v ? v : _maxv;
                }
            }
        });
        if (_suminfo)
            datas.push(_suminfo);
        if (_waveinfo.enabled && _minv != _maxv) {
            datas.splice(0, 0, _waveinfo);
            setTimeout(redrwWaveInfo, 500);
        }
        datas.push(_info);

        _chartoptions.legend.enabled = datas.length > 1;

        if (beforePainChart)
            beforePainChart(_chartoptions);
        //redrwWaveInfo();
        chart = new Highcharts.Chart(_chartoptions);//
        //setTimeout(function () {

        //}, 500);
        var mps = _info.turboThreshold || 1000;
        if (_info && _info.data.length > mps )//turboThreshold預設1000，超過整個series就不會呈現
            console.log("_info.turboThreshold 最大限制"+mps+"，目前資料: " + _info.data.length+" ***************")
        return chart;
    }
    var focusrowtimerflag;
    var setTableChartFocus = function (idx, charts, $tables, offset) {
        clearTimeout(focusrowtimerflag);
        var cs = charts ? ($.isArray(charts) ? charts : [charts]) : [];
        var $ts = $tables ? ($.isArray($tables) ? $tables : [$tables]) : [];
        if (idx == undefined)
            return;
        idx = parseInt(idx);
        focusrowtimerflag = setTimeout(function () {
            if ($ts) {

                $.each($ts, function () {
                    $(this).find(' > tbody > tr.tr-focus').removeClass('tr-focus');
                    var $_tr = $(this).find(' > tbody > tr[data-index=' + idx + ']').addClass('tr-focus');
                    if ($_tr.length > 0)
                        $(this).bootstrapTable('scrollTo', { unit: 'rows', value: _idx });
                });
            }
            if (cs) {
                $.each(cs, function () {
                    var op = [];
                    $.each(this.series, function () {
                        if (this.options.showInLegend == false)
                            return;
                        //var thiss = this;
                        //var _as = $.grep(_alerts, function (s) { return thiss.name == s.name });
                        //if (_as.length > 0)
                        //    return;()
                        if (this.options.warn == true)
                            return;
                        if (this.points.length > idx)
                            op.push(this.points[idx])
                    });
                    this.tooltip.refresh(op);
                    //this.xAxis[0].drawCrosshair(null, op);
                    //}
                    $.each(this.series, function () {
                        if (this.userOptions.mainseries)
                            this.chart.xAxis[0].drawCrosshair(null, this.points[idx]);
                    });
                    //this.xAxis[0].drawCrosshair(null, this.series[1].points[idx]);
                });
            }
        }, 30);
    };
    var chartGearingtimerflag;
    var chartGearingByX = function (x, charts, offset) {
        clearTimeout(chartGearingtimerflag);
        var cs = charts ? ($.isArray(charts) ? charts : [charts]) : [];
        if (x == undefined)
            return;
        chartGearingtimerflag = setTimeout(function () {
            if (cs) {
                $.each(cs, function () {
                    if (!this)
                        return;
                    var op = [];
                    $.each(this.series, function () {
                        if (this.options.showInLegend == false)
                            return;
                        if (this.options.warn == true)
                            return;
                        if (this.userOptions)
                            this.userOptions.drawCrossIdx = undefined;

                        for (var _i = 0; _i < this.points.length; _i++) {
                            if (this.points[_i].x == x) {
                                op.push(this.points[_i])
                                if (this.userOptions && this.userOptions.mainseries)
                                    this.userOptions.drawCrossIdx = _i;
                                break;
                            }
                        }
                    });
                    if (op.length > 0) {
                        this.tooltip.refresh(op);
                        $.each(this.series, function () {
                            if (this.userOptions.mainseries && this.userOptions.drawCrossIdx)
                                this.chart.xAxis[0].drawCrosshair(null, this.points[this.userOptions.drawCrossIdx]);
                        });
                    }
                });
            }
        }, 30);
    };

    window._charthelper = window._charthelper || {};
    window._charthelper.showMeterTable = showMeterTable;
    window._charthelper.showMeterChart = showMeterChart;
    window._charthelper.setTableChartFocus = setTableChartFocus;
    window._charthelper.chartGearingByX = chartGearingByX;

    var __setHighchartsLang = function () {
        try {
            if (Highcharts && Highcharts.setOptions) {
                Highcharts.setOptions({
                    lang: {
                        resetZoom: '復原比例',
                        resetZoomTitle: '復原比例(1:1)'
                    }
                });
            }
        } catch (e) { }
    }
})();
window.charthelper = window._charthelper;
window.charthelper.showMeterTable = window.charthelper.showMeterTable;
window.charthelper.showMeterChart = window.charthelper.showMeterChart;
window.charthelper.setTableChartFocus = window.charthelper.setTableChartFocus;
window.charthelper.chartGearingByX = window.charthelper.chartGearingByX;