var InitWraRain = function ($_container, options) {
    $_container.RainCtrl($.extend({
        map: app.map,
        enabledStatusFilter: true,
        canFullInfowindow: true,
        listContainer: 'inner',
        listTheme: 'none',
        autoReload: true,
        legendIcons: [
            { 'name': '正常', 'url': app.siteRoot+'images/pin/雨量站-b.png', 'classes': 'rain_normal', disabled: true },
            { 'name': '大雨', 'url': app.siteRoot +'images/pin/雨量站-g.png', 'classes': 'rain_heavy' },
            { 'name': '豪雨', 'url': app.siteRoot +'images/pin/雨量站-y.png', 'classes': 'rain_extremely' },
            { 'name': '大豪雨', 'url': app.siteRoot +'images/pin/雨量站-o.png', 'classes': 'rain_torrential' },
            { 'name': '超大豪雨', 'url': app.siteRoot +'images/pin/雨量站-r.png', 'classes': 'rain_exttorrential' },
            { 'name': '無資料', 'url': app.siteRoot +'images/pin/雨量站-gr.png', 'classes': 'rain_nodata', disabled: true }
        ],
        //infoFields: [
        //    {
        //        field: 'CName', title: '站 名', formatter: function (v, data) {
        //            return v;//+ '(' + data.StationID + ')';
        //        }
        //    },
        //    {
        //        field: 'Datetime', title: '時 間', formatter: function (value, row, source) {
        //            return value ? value.DateFormat("dd HH:mm") : '---';
        //        }
        //    },
        //    { field: 'R1H', title: '時雨量', formatter: $.rainFormatter.float, unit: "毫米", sortable: true, align: 'right' },
        //    { field: 'R3H', title: '3小時', formatter: $.rainFormatter.float, unit: "毫米", sortable: true, align: 'right' },
        //    { field: 'R24H', title: '24小時', formatter: $.rainFormatter.float, unit: "毫米", sortable: true, align: 'right' }
        //]
    }, options));
}

var InitWraWater = function ($_container, options) {
    $_container.WaterCtrl($.extend({
        name: "水位站",
        map: app.map,
        enabledStatusFilter: true,
        canFullInfowindow:true,
        autoReload:true,
        listContainer: 'inner',
        listTheme: 'none',
        legendIcons: [
            { name: '正常', url: app.siteRoot +'images/pin/水位站-g.png', classes: 'green_status', disabled:true },
            { name: '一級', url: app.siteRoot +'images/pin/水位站-r.png', classes: 'red_status' },
            { name: '二級', url: app.siteRoot +'images/pin/水位站-o.png', classes: 'orange_status' },
            { name: '三級', url: app.siteRoot +'images/pin/水位站-y.png', classes: 'yellow_status' },
            { name: '無資料', url: app.siteRoot +'images/pin/水位站-gr.png', classes: 'gray_status', disabled: true }],
    }, options));
}
var InitFloodSensor = function ($_container, options) {
    FloodSensorOptions.map = FloodSensorOptions.map || app.map;
    $_container.PinCtrl($.extend(FloodSensorOptions, options));
}

var InitReportDisaster = function ($_container, options) {
   
    $_container.PinCtrl($.extend(floodPinOptions, { map: app.map, enabledStatusFilter: true, autoReload: true, listContainer: 'inner', listTheme:'none'}, options));
}

var FloodSensorOptions = {
    stTitle: function (d) { return d.SensorName },
    useTimeSeriesData: true, enabledStatusFilter: true, autoReload: true,
    listContainer: 'inner',
    listTheme: 'none', 
    pinInfoLabelMinWidth: '78px;vertical-align: top',
    name: '淹水感測設備', infoFields: [
        //{ field: 'SensorUUID', title: 'ID' },
        { field: 'SensorName', title: '站名' },
        { field: 'SourceTime', title: '時間', formatter: function (v, r) { return v ? JsonDateStr2Datetime(v).DateFormat('MM/dd HH:mm') : '-' } },
        { field: 'Depth', title: '淹水深度', formatter: function (v, r) { return (v != undefined ? v.toFixed(0) : '-') + '公分'; } },
        {
            field: 'Operator', title: '單位', formatter: function (v, r) {
                var r = '--';
                if (v != undefined) {
                    var _us = $.grep(AllUnitCodes, function (u) {
                        return u.id == v;
                    });
                    if (_us.length > 0) r = _us[0].name;
                }
                return r;
            }
        },
        {
            field: 'Address', title: '地點', formatter: function (v, r) {
                var td = $.grep(window.alltown, function (t) {
                    return t.TownCode == r.TownCode;
                });
                if (td.length > 0)
                    return td[0].CityName + td[0].Town + v;
                else
                    return v;
            }
        },
        { field: 'Sensitivity', title: '高關注因子', showInList: false, showInInfo: function (d) { return d.Sensitivity != null; } },
    ],
    legendIcons: [{ name: '正常', url: app.siteRoot + 'images/pin/Flood_b_7.png', classes: 'blue_status', disabled: true },
        { name: '淹水', url: app.siteRoot + 'images/pin/Flood_r_7.png', classes: 'red_status' },
        { name: '淹水10↑', url: app.siteRoot + 'images/pin/fsensor_10.png', classes: 'red_status' },
        { name: '淹水30↑', url: app.siteRoot + 'images/pin/fsensor_30.png', classes: 'red_status' },
        { name: '淹水50↑', url: app.siteRoot + 'images/pin/fsensor_50.png', classes: 'red_status' },
        { name: '待檢核', url: app.siteRoot + 'images/pin/Flood_y_7.png', classes: 'yellow_status', disabled: true  },
        { name: '無資料', url: app.siteRoot + 'images/pin/Flood_g_7.png', classes: 'gray_status', disabled: true  }],
    checkDataStatus: function (data, index) {
        var _i = 0;
        if (!data.SourceTime)// || (Date.now() - JsonDateStr2Datetime(data.SourceTime).getTime()) >= 24 * 60 * 60 * 1000)
            _i = 6;
        else if (data.ToBeConfirm == true)
            _i = 5;
        else if (data.Depth && data.Depth >= 50)
            _i = 4;
        else if (data.Depth && data.Depth >= 30)
            _i = 3;
        else if (data.Depth && data.Depth > 10)
            _i = 2;
        else if (data.Depth && data.Depth >= 0)
            _i = 1;
        return this.settings.legendIcons[_i];
    },
    loadBase: window.datahelper.getFHYFloodSensorStation,
    loadInfo: window.datahelper.getFHYFloodSensorInfoRt,
    transformData: function (_base, _info) {
        var that = this;
        var datas = [];
        $.each(_base, function () {
            var _i = JSON.parse(JSON.stringify(this));
            if (this.Point && this.Point.Latitude != undefined) {
                _i.X = this.Point.Longitude;
                _i.Y = this.Point.Latitude;
            }
            var _if = $.grep(_info, function (_in) { return _in.SensorUUID == _i.SensorUUID });
            if (_if.length > 0)
                _i = $.extend(_i, _if[0]);
            datas.push(_i);
        });
        datas.sort(function (a, b) {
            var av = a.Depth, bv = b.Depth;
            if (!a.SourceTime || (Date.now() - JsonDateStr2Datetime(a.SourceTime).getTime()) >= 24 * 60 * 60 * 1000)
                av = -999;
            if (!b.SourceTime || (Date.now() - JsonDateStr2Datetime(b.SourceTime).getTime()) >= 24 * 60 * 60 * 1000)
                bv = -999;
            return bv - av; //清單淹水的在前面
        });
        window.pinLeafletMaxZIndex += datas.length;
        $.each(datas, function (idx, d) { //淹水的pin pinZIndex越大，才會在上面
            d.pinZIndex = window.pinLeafletMaxZIndex - idx;
        });
        window.ALLDATAS = datas;//選鄉鎮select filter
        return datas;
    },
    pinInfoContent: function (data) {
        //data.Depth = 30;
        var that = this;
        var $_c = $($.BasePinCtrl.defaultSettings.pinInfoContent.call(this, data));
        var eurl = encodeURI(app.CSgdsRoot+ 'FDashboard.html?sensoruuid=' + data.SensorUUID);
        console.log("eurl:" + eurl);
        var $_info = $('<div style="font-size:1.4rem;padding:0px 8px 0 6px;text-align:end;"></div>').appendTo($_c);
        $('<a href="' + eurl + '" target="_FDashboard"><sapn class="glyphicon glyphicon-info-sign" title="淹水感測整合資訊"></a>').appendTo($_info);
        if (data.Depth && data.Depth >= 10 && !data.floodarea) {
            var _gid = 'cal-' + helper.misc.geguid();
            $('<sapn id="' + _gid + '" style="font-size:1.2rem;margin-right:1rem;cursor:pointer" class="glyphicon glyphicon-alert" title="淹水範圍推估"></span>').prependTo($_info);
            setTimeout(function () {
                if (_gid) {
                    $('#' + _gid).on('click', function () {
                        var $_this = $(this);
                        $_this.off('click').css('opacity', .3)[0].style.cursor = 'not-allowed';//.addClass('btn disabled');

                        helper.misc.showBusyIndicator($_this.closest('.meterInfoTemplateContent'), { content: '演算中...' });
                        datahelper.estimateFloodingComputeForLightweightDatas([{
                            PK_ID: data.SensorUUID + Date.now(),
                            X: data.Point.Longitude,
                            Y: data.Point.Latitude,
                            DATE: helper.format.JsonDateStr2Datetime(data.SourceTime),
                            CREATE_DATE: helper.format.JsonDateStr2Datetime(data.SourceTime),
                            Sources: "淹水感測器即時推估_SGDS",
                            EMISTYPE: '淹水感測器',
                            DEPTH: data.Depth,
                            SourceCode: 7,
                            TOWN_NAME: data.TownCode,
                            LOCATION_DESCRIPTION: data.Address,
                            Described:'-'
                        }], function (fds) {
                            helper.misc.hideBusyIndicator($_this.closest('.meterInfoTemplateContent'));
                            if (fds && fds.floodarea.length > 0) {
                                //console.log(fds.floodarea[0]);
                                if (fds.floodarea == undefined || fds.floodarea.length == 0 || fds.floodarea[0].Image_Data == undefined)
                                    return;
                                data.floodarea = fds.floodarea[0];
                                that.$element.trigger('add-floodarea', [data]);
                                return;
                                var fa = fds.floodarea[0];

                                data._floodImageOverlay = L.imageOverlay(app.CSgdsRoot + fa.Image_Data.Url, [[fa.Image_Data.MaxY, fa.Image_Data.MaxX], [fa.Image_Data.MinY, fa.Image_Data.MinX]], { interactive: true, zIndex: 201 }).addTo(app.map);
                                data._floodImageOverlay.on('click', function (e) {
                                    var popup = data._floodImageOverlay.unbindPopup().bindPopup('<div class="leaflet-infowindow-title  status-blue">' + data.SensorName + '</div>' + "<div>" + floodPinOptions.pinInfoContent.call({ settings: floodPinOptions }, fa) + "</div>",
                                        $.extend({ closeOnClick: true, autoClose: true, className: 'leaflet-infowindow', minWidth: 250 },
                                            {}))
                                        .openPopup(e.latlng).getPopup();

                                    var _color = '#0000FF';
                                    var $_pop = $(popup.getElement());
                                    var _statusstyle = window.getComputedStyle($_pop.find('.leaflet-infowindow-title')[0]);
                                    var $_title = $_pop.find('.leaflet-infowindow-title');
                                    var _cbtn = $_pop.find('.leaflet-popup-close-button')[0];
                                    var _content = $_pop.find('.leaflet-popup-content')[0];
                                    $_title.css('background-color', _color).css('color', '#fff').css('box-shadow', $_title.css('box-shadow').replace('#999', _color).replace('rgb(153, 153, 153)', _color));
                                    _content.style.borderColor = _cbtn.style.borderColor = _cbtn.style.color = _color;
                                    $_pop.find('.leaflet-popup-tip')[0].style.boxShadow = " 3px 3px 15px " + _color;
                                });
                            }
                        });
                    })
                }
            });
        }
        //$('<form style="font-size:1.75em;padding:0px 8px 0 6px;text-align:end;" action="FDashboard.html" target="_FDashboard"  method="post"><a href="javascript:;" onclick="parentNode.submit();"><sapn class="glyphicon glyphicon-info-sign" title="淹水感測整合資訊"></span></a><input type="hidden" name="sensoruuid" value="' + data.SensorUUID + '"/></form>').appendTo($_c);
        return $_c[0].outerHTML;
    }
};


var InitFmgCctv = function ($_container, options) {
    $_container.CctvCtrl($.extend({
        map: app.map,
        stTitle: function (data) { return data.name },
        canFullInfowindow: true,
        loadBase: datahelper.getAllCctv,
        loadInfo: function (dt, callback) { callback([]) },
        legendIcons: [{ name: '正常', url: app.siteRoot + 'images/pin/CCTV_near.png', classes: 'blue_status' }],
        //transformData: function (_base, _info) {
        //    //$.each(_base, function () {
        //    //    var coor = helper.gis.TWD97ToWGS84(this.x_tm97, this.y_tm97);
        //    //    this.X = coor.lon;
        //    //    this.Y = coor.lat;
        //    //    this.urls = [];
        //    //});
        //    return _base;
        //},
        pinInfoContent: function (d, infofields) {
            if (d.urls.length == 0) {
                var r = datahelper.getCctvCameras(d.id, d.sourceid);
                if (r) {
                    var _cameras = $.grep(r.cameras, function (_c) {
                        return _c.images && _c.images.length > 0;
                    });
                    d.urls = $.map(_cameras, function (_c) {
                        var _u = _c.images[_c.images.length - 1];
                        var _si = _u.lastIndexOf('/');
                        var _ei = _u.lastIndexOf('.');
                        var _ts = _u.substr(_si + 1, _ei - _si - 1);
                        return {id:_c.id,name:_c.cctv_name,url: _u.replace(_ts, 'new') };//_c.images[_c.images.length - 1];
                    });
                }
            }
            return $.CctvCtrl.defaultSettings.pinInfoContent.call(this,d, infofields);
        }
    }, options));
}

var InitResourceKmlCtrl = function ($_container, options, name, clustername) {
    return $_container.KmlCtrl($.extend({
        map: app.map, useSearch: true, cluster: true,
        name: name,
        legendIcons: [{ 'name': name, 'url': app.siteRoot +'Images/pin/' + name + '.png', classes: 'blue_status' }],
        url: 'kml/' + name + '.kmz',
        checkDataStatus: function (data, index) { return this.settings.legendIcons[0] },
        type: $.BasePinCtrl.type.point,
        cluster: {
            //imagePath: 'http://localhost:1928/images/cluster/'+clustername,
            maxZoom: 18,
            styles: [
                {
                    //textColor: 'white',
                    url: 'images/cluster/' + clustername + '.png',
                    //url:'Scripts/gis/google/markerclusterimage/m1.png',
                    height: 40,
                    width: 40,
                },
                {
                    //textColor: 'white',
                    url: 'images/cluster/' + clustername + '.png',
                    height: 46,
                    width: 46
                },
                {
                    //textColor: 'white',
                    url: 'images/cluster/' + clustername + '.png',
                    height: 52,
                    width: 52,
                },
                {
                    //textColor: 'white',
                    url: 'images/cluster/' + clustername + '.png',
                    height: 58,
                    width: 58,
                },
                {
                    //textColor: 'white',
                    url: 'images/cluster/' + clustername + '.png',
                    height: 64,
                    width: 64,
                }
            ],
            gridSize: 50
        }
    }, options))
        .on($.BasePinCtrl.eventKeys.initUICompleted, function () {
            $_container.instance.__pinctrl.instance._mapctrl._defaultIconCreateFunction = function (markerClusterGroup, mg) { //複寫 for leaflet markerCluster
                var divIcon = markerClusterGroup._defaultIconCreateFunction(mg);
                //var _class = $.BasePinCtrl.pinIcons.rain.noData.classes;
                //if ($.grep(mg.getAllChildMarkers(), function (r) { return r.pinstatus.classes == $.BasePinCtrl.pinIcons.rain.extremely_torrential.classes }).length > 0)
                //    _class = $.BasePinCtrl.pinIcons.rain.extremely_torrential.classes;
                //else if ($.grep(mg.getAllChildMarkers(), function (r) { return r.pinstatus.classes == $.BasePinCtrl.pinIcons.rain.torrential.classes }).length > 0)
                //    _class = $.BasePinCtrl.pinIcons.rain.torrential.classes;
                //else if ($.grep(mg.getAllChildMarkers(), function (r) { return r.pinstatus.classes == $.BasePinCtrl.pinIcons.rain.extremely.classes }).length > 0)
                //    _class = $.BasePinCtrl.pinIcons.rain.extremely.classes;
                //else if ($.grep(mg.getAllChildMarkers(), function (r) { return r.pinstatus.classes == $.BasePinCtrl.pinIcons.rain.heavy.classes }).length > 0)
                //    _class = $.BasePinCtrl.pinIcons.rain.heavy.classes;
                //else if ($.grep(mg.getAllChildMarkers(), function (r) { return r.pinstatus.classes == $.BasePinCtrl.pinIcons.rain.normal.classes }).length > 0)
                //    _class = $.BasePinCtrl.pinIcons.rain.normal.classes;
                divIcon.options.html = '<div><span>' + name[0]+ mg.getAllChildMarkers().length+'<span></div>';
                divIcon.options.className += " custer-" + name + " ";
                return divIcon;
            }
        });
}

var Init護理機構 = function ($_meter) {
    return InitResourceKmlCtrl($('<div class="row"><div class="col-md-12"></div></div>').appendTo($_meter), {}, '護理機構', 'a');
}

var Init兒少安養機構 = function ($_meter) {
    return InitResourceKmlCtrl($('<div class="row"><div class="col-md-12"></div></div>').appendTo($_meter), {}, '兒少安養機構', 'b');
}

var Init老年福利機構 = function ($_meter) {
    return InitResourceKmlCtrl($('<div class="row"><div class="col-md-12"></div></div>').appendTo($_meter), {}, '老年福利機構', 'c');
}

var Init身心障礙福利機構 = function ($_meter) {
    return InitResourceKmlCtrl($('<div class="row"><div class="col-md-12"></div></div>').appendTo($_meter), {}, '身心障礙福利機構', 'd');
}

var Init區排水位 = function ($_meter) {
    return $('<div class="row"><div class="col-md-12"></div></div>').appendTo($_meter).PinCtrl({
        map: app.map, useSearch: true,
        name: "區排水位站",
        stTitle: function (data) { return data.StationName },
        loadBase: function (callback) { callback([]) },
        loadInfo: "WS/ObsWs.asmx/GetDWaterRt",
        infoFields: [
            { field: 'StationName', title: '站名' },
            { field: 'InfoTime', title: '時間', formatter: function (r, d) { return r ? helper.format.JsonDateStr2Datetime(r).DateFormat('yyyy/MM/dd HH:mm') : '--' } },
            { field: 'WaterLevel', title: '水位' },
            { field: 'TopLine', title: '堤頂', showInList: false, formatter: function (r, d) { return r != undefined ? r : '--' } },
            { field: 'WarningLevel', title: '警戒值', showInList: false, formatter: function (r, d) { return r != undefined && r != -999 ? r : '--' } }
        ],
        legendIcons: [{ 'name': '正常', 'url': 'Images/區排_正常.png', 'classes': 'water_normal' }, { 'name': '警戒', 'url': 'Images/區排_警戒.png', 'classes': 'water_warnleve1' }, { 'name': '無資料', 'url': 'Images/區排_無資料.png', 'classes': 'water_nodata' }],
        checkDataStatus: function (data, index) {
            var sidx = 0;
            if (!data.InfoTime)
                sidx = 2;
            else if (data.WaterLevel != undefined && data.WarningLevel != undefined && data.WarningLevel != -999 && data.WaterLevel >= data.WarningLevel)
                sidx = 1;
            return this.settings.legendIcons[sidx];
        }
    });
}
var Init雷達迴波圖 = function ($_meter) {
    var _layer = undefined;
    var $_silder = undefined;
    var _timer = Date.now();
    var $_legend = $('#rader-legend');
    var $_p = $('<div class="row"><div class="col-md-12"></div></div>').appendTo($_meter);
    $_p.PinCtrl({
        map: app.map, name: '雷達迴波圖', useLabel: false, useList: false, autoReload: { auto: false, interval: 10 * 1000 }
    }).on($.BasePinCtrl.eventKeys.initUICompleted, function () {
        var _timerflag = undefined;
        var timerreload = function () {
            clearInterval(_timerflag);
            _timerflag = setInterval(function () {
                $_p.find('.pinswitch').trigger('change');
            }, 5*60 * 1000);
        }
        $_p.find('.pinswitch').off('change').on('change', function () {
            var s = $(this).is(':checked');
            if (Date.now() - _timer >= 60 * 1000) {
                if (_layer) {
                    _layer.remove();
                    _layer = null;
                    $_silder.remove();
                }
                _timer = Date.now();
            }
            if (!_layer && s) {
                helper.misc.showBusyIndicator();
                //$.getJSON('https://cwbopendata.s3.ap-northeast-1.amazonaws.com/MSC/O-A0058-005.json', function (r) {
                //    helper.misc.hideBusyIndicator();
                //    var url = r.cwbopendata.dataset.resource.uri;
                //    var time = r.cwbopendata.dataset.time.obsTime;
                //    var x1 = parseFloat(r.cwbopendata.dataset.datasetInfo.parameterSet.parameter[1].parameterValue.split('-')[0]);
                //    var x2 = parseFloat(r.cwbopendata.dataset.datasetInfo.parameterSet.parameter[1].parameterValue.split('-')[1]);
                //    var y1 = parseFloat(r.cwbopendata.dataset.datasetInfo.parameterSet.parameter[2].parameterValue.split('-')[0]);
                //    var y2 = parseFloat(r.cwbopendata.dataset.datasetInfo.parameterSet.parameter[2].parameterValue.split('-')[1]);

                //    var imageBounds = [[y1, x1], [y2, x2]];
                //    app.map.createPane('cloudimage1').style.zIndex = 350;
                //    //var newOverlay = new google.maps.GroundOverlay(url, imageBounds, { map: this.map, opacity: this.currentOpacity }); //1.東南亞imageBounds對不齊??;2.GroundOverlay zoom in out會卡卡的
                //    _layer = L.imageOverlay(url, imageBounds, { opacity: 1, pane: 'cloudimage1' }).addTo(app.map);
                //    $_silder = bindSilder($_p, _layer);
                //    $("#other-layer-info .rader-layer").removeClass('offdisplay');
                //    $("#other-layer-info .rader-layer-time").text(helper.format.JsonDateStr2Datetime(time).DateFormat('MM/dd HH:mm:ss') );
                //});
                var gparas = JSON.parse(JSON.stringify(L.DouLayer.Qqesums.DefaulParas));
                gparas.url = app.siteRoot + 'api/rad/rt';
                gparas.parser = L.DouLayer.Qqesums.Parser.sqpe;
                $.getJSON(gparas.url, function (r) {
                    helper.misc.hideBusyIndicator();
                    if (!r) {
                        $("#other-layer-info .rader-layer").removeClass('offdisplay');//.text(_linfo);
                        $("#other-layer-info .rader-layer-time").text('-無資料');
                        return;
                    }
                    gparas.parser(gparas, r.Content);

                    _layer = L.DouLayer.gridRectCanvas({ 'opacity': 1, ycellsize: gparas.ycellsize, xcellsize: gparas.xcellsize, noMask: true });//.addTo(app.map);
                    _layer.on('mousemove', function (evt) {
                        if (!L.Browser.mobile)
                            _layer.bindTooltip('dBZ:' + evt.griddata.val, { className: "qpesums_tooltip" }).openTooltip(evt.latlng);
                    }).on('mouseout', function (evt) {
                        if (!L.Browser.mobile && _layer.getTooltip() != null)
                            _layer.closeTooltip();
                    });
                    //用$.map 資料太大會有Maximum call stack size exceeded
                    var gs = L.DouLayer.Qqesums.gridData2cellData(gparas.datas, gparas.colorDef);//$.map(gdata.datas, function (val, i) {return { lng: val[0], lat: val[1], color: getcolor(gdata.colorDef, val[2]) }});

                    $_legend.empty().show();
                    L.DouLayer.Qqesums.genLegend($_legend, gparas.colorDef, 24, 16, 'dBZ', '雷達迴波');
                    _layer.setData(gs);
                    $_silder = bindSilder($_p, _layer);

                    $("#other-layer-info .rader-layer").removeClass('offdisplay');//.text(_linfo);
                    $("#other-layer-info .rader-layer-time").text(helper.format.JsonDateStr2Datetime(r.Datetime).DateFormat('MM/dd HH:mm:ss'));
                    _layer.addTo(app.map);
                });
                timerreload();
            } else {
                if (_layer) {
                    if (s) {
                        _layer.addTo(app.map);
                        $_silder.removeClass('offdisplay');
                        $("#other-layer-info .rader-layer").removeClass('offdisplay');
                    }
                    else {
                        _layer.remove();
                        $_silder.addClass('offdisplay');
                        $("#other-layer-info .rader-layer").addClass('offdisplay');
                    }
                }
                else
                    $("#other-layer-info .rader-layer").addClass('offdisplay');
            }
          
        });
    });
   

    return $_p;
}
var Init累積雨量圖 = function ($_meter) {
    //https://cwbopendata.s3.ap-northeast-1.amazonaws.com/DIV2/O-A0040-003.kmz
    var _layer = undefined;
    var $_silder = undefined;
    var _timer = Date.now();
    var $_legend = $('#dayrainfall-legend');
    var _legendColorDef = [{ min: 300, max: 5000, color: "#FFD6FE" }, { min: 200, max: 300, color: "#FE38FB" },
        { min: 150, max: 200, color: "#DB2DD2" }, { min: 130, max: 150, color: "#AB1FA2" },
        { min: 110, max: 130, color: "#AA1801" }, { min: 90, max: 110, color: "#D92203" },
        { min: 70, max: 90, color: "#FF2A06" }, { min: 50, max: 70, color: "#FFA81D" },
        { min: 40, max: 50, color: "#FFD328" }, { min: 30, max: 40, color: "#FEFD31" },
        { min: 20, max: 30, color: "#00FB30" }, { min: 15, max: 20, color: "#26A31B" },
        { min: 10, max: 15, color: "#0177FC" }, { min: 6, max: 10, color: "#00A5FE" },
        { min: 2, max: 6, color: "#01D2FD" }, { min: 1, max: 2, color: "#9EFDFF" }, { min: 0, max: 1, color: "#EDEDE6" }    ];
    var $_p = $('<div class="row"><div class="col-md-12"></div></div>').appendTo($_meter);
    $_p.PinCtrl({
        map: app.map, name: '累積雨量圖', useLabel: false, useList: false
    }).on($.BasePinCtrl.eventKeys.initUICompleted, function () {
        var _timerflag = undefined;
        var timerreload = function () {
            clearInterval(_timerflag);
            _timerflag = setInterval(function () {
                $_p.find('.pinswitch').trigger('change');
            }, 5*60 * 1000);
        }
        $_p.find('.pinswitch').off('change').on('change', function () {
            var s = $(this).is(':checked');
            if (Date.now() - _timer >= 60 * 1000) {
                if (_layer) {
                    _layer.remove();
                    _layer = null;
                    $_silder.remove();
                }
                _timer = Date.now();
            }
            if (!_layer && s) {
                helper.misc.showBusyIndicator();
                $.getJSON(app.siteRoot + 'api/rain/dayrainfall', function (r) {
                    helper.misc.hideBusyIndicator();
                    var url = r.Url;
                    //var time = r.cwbopendata.dataset.time.obsTime;
                    var x1 = r.MaxX;
                    var x2 = r.MinX;
                    var y1 = r.MaxY;
                    var y2 = r.MinY;
                    var _linfo = (r.Time ? helper.format.JsonDateStr2Datetime(r.Time).DateFormat('MM/dd HH:mm:ss') : '');

                    var imageBounds = [[y1, x1], [y2, x2]];
                    app.map.createPane('cloudimage1').style.zIndex = 350;
                    //var newOverlay = new google.maps.GroundOverlay(url, imageBounds, { map: this.map, opacity: this.currentOpacity }); //1.東南亞imageBounds對不齊??;2.GroundOverlay zoom in out會卡卡的
                    _layer = L.imageOverlay(url, imageBounds, { opacity: 1, pane: 'cloudimage1' }).addTo(app.map);
                    $_silder = bindSilder($_p, _layer);
                    $("#other-layer-info .sum-rainfall-layer").removeClass('offdisplay');//.text(_linfo);
                    $("#other-layer-info .sum-rainfall-layer-time").text(_linfo);
                    $_legend.empty().show();

                    L.DouLayer.Qqesums.genLegend($_legend, _legendColorDef, 24, 16, '毫米(mm)', '累積雨量');
                });
                timerreload();
            } else {
                if (_layer) {
                    if (s) {
                        _layer.addTo(app.map);
                        $_silder.removeClass('offdisplay');
                        $("#other-layer-info .sum-rainfall-layer").removeClass('offdisplay');
                    }
                    else {
                        _layer.remove();
                        $_silder.addClass('offdisplay');
                        $("#other-layer-info .sum-rainfall-layer").addClass('offdisplay');
                    }
                }
                else
                    $("#other-layer-info .sum-rainfall-layer").addClass('offdisplay');
            }
            if ($("#other-layer-info .sum-rainfall-layer").hasClass('offdisplay'))
                $_legend.hide();
            else
                $_legend.show();
        });
    });

    return $_p;
}

var InitQpf060minRt = function ($_meter) {
    //https://cwbopendata.s3.ap-northeast-1.amazonaws.com/DIV2/O-A0040-003.kmz
    var _layer = undefined;
    var $_silder = undefined;
    var _timer = Date.now();
    var $_legend = $('#qpesums-legend');
    var $_p = $('<div class="row"><div class="col-md-12"></div></div>').appendTo($_meter);
    $_p.PinCtrl({
        map: app.map, name: '預報1小時降雨', useLabel: false, useList: false
    }).on($.BasePinCtrl.eventKeys.initUICompleted, function () {
        var _timerflag = undefined;
        var timerreload = function () {
            clearInterval(_timerflag);
            _timerflag = setInterval(function () {
                $_p.find('.pinswitch').trigger('change');
            }, 5 * 60 * 1000);
        }
        $_p.find('.pinswitch').off('change').on('change', function () {
            var s = $(this).is(':checked');
            if (Date.now() - _timer >= 60 * 1000) {
                if (_layer) {
                    _layer.remove();
                    _layer = null;
                    $_silder.remove();
                }
                _timer = Date.now();
            }
            if (!_layer && s) {
                helper.misc.showBusyIndicator();
                var gparas = JSON.parse(JSON.stringify(L.DouLayer.Qqesums.DefaulParas));
                gparas.url = app.siteRoot + 'api/qpesums/qpf060min/rt';
                gparas.parser = L.DouLayer.Qqesums.Parser.sqpe;
                $.getJSON(gparas.url, function (r) {
                    helper.misc.hideBusyIndicator();
                    if (!r) {
                        $("#other-layer-info .qpfqpe60-layer").removeClass('offdisplay');//.text(_linfo);
                        $("#other-layer-info .qpfqpe60-layer-time").text('-無資料');
                        return;
                    }
                    gparas.parser(gparas, r.Content);

                    _layer = L.DouLayer.gridRectCanvas({ 'opacity': 1, ycellsize: gparas.ycellsize, xcellsize: gparas.xcellsize, noMask: true });//.addTo(app.map);
                    _layer.on('mousemove', function (evt) {
                        if (!L.Browser.mobile)
                            _layer.bindTooltip('降雨量:' + evt.griddata.val, { className: "qpesums_tooltip" }).openTooltip(evt.latlng);
                        //_layer.bindTooltip(JSON.stringify(evt.latlng) + "<br>" + JSON.stringify(evt.griddata)).openTooltip(evt.latlng);
                    }).on('mouseout', function (evt) {
                        if (!L.Browser.mobile && _layer.getTooltip() != null)
                            _layer.closeTooltip();
                    });
                    //用$.map 資料太大會有Maximum call stack size exceeded
                    var gs = L.DouLayer.Qqesums.gridData2cellData(gparas.datas, gparas.colorDef);//$.map(gdata.datas, function (val, i) {return { lng: val[0], lat: val[1], color: getcolor(gdata.colorDef, val[2]) }});
                    //_layer._map = app.map;
                    //_layer.addTo(app.map);

                    $_legend.empty().show();
                    L.DouLayer.Qqesums.genLegend($_legend, gparas.colorDef, 24, 16, '毫米(mm)', '預報雨量');
                    _layer.setData(gs);
                    
                    $_silder = bindSilder($_p, _layer);

                    $("#other-layer-info .qpfqpe60-layer").removeClass('offdisplay');//.text(_linfo);
                    $("#other-layer-info .qpfqpe60-layer-time").text(helper.format.JsonDateStr2Datetime(r.Datetime).DateFormat('MM/dd HH:mm:ss'));
                    _layer.addTo(app.map);
                });

                timerreload();
            } else {
                if (_layer) {
                    if (s) {
                        _layer.addTo(app.map);
                        $_silder.removeClass('offdisplay');
                        //$_legend.removeClass('offdisplay');
                        $("#other-layer-info .qpfqpe60-layer").removeClass('offdisplay');
                    }
                    else {
                        _layer.remove();
                        $_silder.addClass('offdisplay');
                        //$_legend.addClass('offdisplay');
                        $("#other-layer-info .qpfqpe60-layer").addClass('offdisplay');
                    }
                }
                else
                    $("#other-layer-info .qpfqpe60-layer").addClass('offdisplay');
            }
            if ($("#other-layer-info .qpfqpe60-layer").hasClass('offdisplay'))
                $_legend.hide();
            else
                $_legend.show();
        });
    });

    return $_p;
}

var bindSilder = function ($_c,g) {
    $_c.find('.opacity-container').remove();
    $_oslider = $('<div class="col-12 opacity-container"><div class="opacity-slider" title="透明度"></div></div>').appendTo($_c).find('.opacity-slider')
        .gis_layer_opacity_slider({
            map: app.map,
            range: "min",
            max: 100,
            min: 5,
            value: $_c[0].currentOpacity || 90,
            setOpacity: function (_op) {
                $_c[0].currentOpacity = _op * 100;
                g.setOpacity(_op);
            }
        });//.addClass('offdisplay');
    return $_oslider;
}

var InitComplexVillageKmlCtrl = function ($_container, options, name) {
    return $('<div>').appendTo( $_container).KmlCtrl($.extend({
        map: app.map, useSearch: true, 
        name: name, pinInfoLabelMinWidth: '60px',
        stTitle: function (d) {
            return d.County + d.District + d.VillageName;
        },
        polyStyles: [{ name: '圖例', strokeColor: '#FF0000', strokeOpacity: 1, strokeWeight: 1, fillColor: '#FF0000', fillOpacity: .85, classes: 'water_normal' }],
        url: app.siteRoot+ 'Data/Kml/' + name + '.kmz',
        type: $.BasePinCtrl.type.polygon,
        filter: function (d) {
            return false;
        },
    }, options))
        .on($.BasePinCtrl.eventKeys.initUICompleted, function () {
           
        });
}
var InitComplexVillageKmlCtrl2 = function ($_container, options, name) {
    return $('<div>').appendTo($_container).PolygonCtrl($.extend({
        map: app.map, useSearch: true, useCardview: false,
        name: name, pinInfoLabelMinWidth: '60px',
        stTitle: function (d) {
            return d.County + d.District + d.VillageName;
        },
        polyStyles: [{ name: '複合指標警戒', strokeColor: '#FF0000', strokeOpacity: 1, strokeWeight: 1, fillColor: '#FF0000', fillOpacity: .85, classes: 'red_status' }],
        type: $.BasePinCtrl.type.polygon,
        loadBase: function (callback) { callback([])},
        loadInfo: function (dt, callback) {callback([]);},
        filter: function (d) {
            return true;
        },
        transformData: function (bs, is) {
            var rs = [];
            $.each(bs.features, function () {
                rs.push($.extend({ geojson: this }, this.properties));
            });
            return rs;
        },
        checkDataStatus: function (data, index) {
            return this.settings.polyStyles[0];
        },
        infoFields: [
            //{ field: 'SensorUUID', title: 'ID' },
            {
                field: 'District', title: '村里', formatter: function (v, d) {
                    return d.County + v + d.VillageName
                }
            },
            {
                field: 'RainNo', title: '參考雨量', formatter: function (v, d) {
                    var ifo = JSON.parse(d.Rain);
                    var r = d.RainName + '(' + d.RainNo + ')<br>';
                    if (d.Remark.indexOf('1小時') >= 0)
                        r += 'H1:' + ifo.H1;
                    else if (d.Remark.indexOf('3小時') >= 0)
                        r += 'H3:' + ifo.H3;
                    else if (d.Remark.indexOf('6小時') >= 0)
                        r += 'H6:' + ifo.H6;
                    r += 'mm(' + ifo.Time.substr(5) + ')';
                    return r;
                },showInList:false
            },
            {
                field: 'RainNo', title: '參考雨量', formatter: function (v, d) {
                    var ifo = JSON.parse(d.Rain);
                    var r = d.RainName + '<br>';
                    if (d.Remark.indexOf('1小時') >= 0)
                        r += 'H1:' + ifo.H1;
                    else if (d.Remark.indexOf('3小時') >= 0)
                        r += 'H3:' + ifo.H3;
                    else if (d.Remark.indexOf('6小時') >= 0)
                        r += 'H6:' + ifo.H6;
                    r += 'mm';
                    return r;
                },showInInfo:false
            },
            {
                field: 'WaterNo', title: '參考水位', formatter: function (v, d) {
                    var wi = JSON.parse(d.Water);
                    var w1 = wi.WaterLevel == undefined ? undefined : wi.WaterLevel;
                    var w2 = wi.Value == undefined ? undefined : wi.Value
                    var w3 = wi.WATERHEIGHT_M == undefined ? undefined : wi.WATERHEIGHT_M;
                    var t = (wi.Time || wi.TimeStamp || wi.DATATIME).substr(5);
                    var _tempi = t.indexOf('+');
                    if (_tempi >= 0)
                        t = t.substr(0, _tempi);
                    var r = d.WaterName + '(' + d.WaterNo + ')<br>水位:' +
                        (w1 || w2 || w3) + 'M(' +
                        t +
                        ')';
                    return r;
                },showInList:false
            },
            {
                field: 'WaterNo', title: '參考水位', formatter: function (v, d) {
                    var wi = JSON.parse(d.Water);
                    var w1 = wi.WaterLevel == undefined ? undefined : wi.WaterLevel;
                    var w2 = wi.Value == undefined ? undefined : wi.Value
                    var w3 = wi.WATERHEIGHT_M == undefined ? undefined : wi.WATERHEIGHT_M;
                    var t = (wi.Time || wi.TimeStamp || wi.DATATIME).substr(5);
                    var _tempi = t.indexOf('+');
                    if (_tempi >= 0)
                        t = t.substr(0, _tempi);
                    var r = d.WaterName + '<br>水位:' +
                        (w1 || w2 || w3) + 'M';
                    return r;
                },showInInfo:false
            },
            {
                field: 'Villages', title: '影響範圍', formatter: function (v, d) {
                    var areas = $.map(v, function (a) { return a.Name });
                    return areas.join('、');

                },showInList:false
            },
            {
                field: 'Remark', title: '延時警戒', formatter: function (v, d) {
                    var r ='-';
                    if (d.Remark.indexOf('1小時') >= 0)
                        r = '1小時'
                    else if (d.Remark.indexOf('3小時') >= 0)
                        r = '3小時';
                    else if (d.Remark.indexOf('6小時') >= 0)
                        r = '6小時';
                    return r;
                    //return v.split(',')[0]
                }
            }
        ]

    }, options))
        .on($.BasePinCtrl.eventKeys.initUICompleted, function () {

        });
}
var InitAlertTownKmlCtrl = function ($_container, options, name) {
    return $('<div>').appendTo($_container).PolygonCtrl($.extend({
        map: app.map, useSearch: true, useCardview:false,
        name: name, pinInfoLabelMinWidth: '80px',
        stTitle: function (data) {
            return data.CountyName+data.Name;
        },
        polyStyles: [{ name: '一級警戒', strokeColor: '#FF0000', strokeOpacity: 1, strokeWeight: 1, fillColor: '#FF0000', fillOpacity: .85, classes: 'red_status' },
            { name: '二級警戒', strokeColor: '#F28500', strokeOpacity: 1, strokeWeight: 1, fillColor: '#F28500', fillOpacity: .85, classes: 'orange_status'}],
        //legendIcons: [{ 'name': name, 'url': app.siteRoot + 'Images/pin/' + name + '.png', classes: 'blue_status' }],
        //checkDataStatus: function (data, index) { return this.settings.legendIcons[0] },
        type: $.BasePinCtrl.type.polygon,
        loadBase: datahelper.loadTownGeojson,
        loadInfo: function (dt, callback) {
            callback([]);
        },
        filter: function (d) {
            return false;
        },
        transformData: function (bs, is) {
            var rs = [];
            $.each(bs.features, function () {
                rs.push($.extend({ geojson: this }, this.properties));
            });
            return rs;
        },
        checkDataStatus: function (data, index) {
            return this.settings.polyStyles[data.WarningLevel - 1];
        },
        infoFields: [
            {
                field: 'Time', title: '時間', formatter: function (v) {
                    var sdd = helper.format.JsonDateStr2Datetime(v);
                    return v ? helper.format.JsonDateStr2Datetime(v).DateFormat('MM/dd HH:mm') : '---'
                }
            },
            
            {
                field: 'Name', title: '行政區', formatter: function (v, d) {
                    return d.CountyName + v;
                }
            },
            {
                field: 'StationNo', title: '參考雨量站', formatter(v) {
                    if (window.fhyRainStations) {
                        var rs = $.grep(window.fhyRainStations, function (r) {return r.StationNo == v });
                        if (rs.length > 0)
                            return rs[0].StationName;
                        else
                            return v;
                    }
                    else
                        return v;
                }
            },
            { field: 'H1', title: 'H1', unit:'mm' },
            { field: 'H3', title: 'H3', unit: 'mm' },
            { field: 'H6', title: 'H6', unit: 'mm' },
            { field: 'H12', title: 'H12', unit: 'mm' },
            { field: 'H24', title: 'H24', unit: 'mm' },
            { field: 'AffectedArea', title: '影響範圍', showInList:false }
        ]

    }, options))
        .on($.BasePinCtrl.eventKeys.initUICompleted, function () {

        });
}