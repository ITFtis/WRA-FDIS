if (!$.AppConfigOptions || !$.AppConfigOptions.script || !$.AppConfigOptions.script.gispath) {
    alert("尚未設定(BasePinCtrl)$.AppConfigOptions.script.gispath");
}
/*****BasePinCtrl *****/
(function ($) {
    'use strict';
    $.BasePinCtrl = {
        defaultSettings: {
            id:undefined,//if(id==null) id = name;
            name: "XXXX",
            /**map infoWindow title**/
            stTitle: function (data) { return 'XXXX' },
            map: undefined,
            useLabel: true,
            pinLabel:true, // 永不顯示label
            useList: true,
            useExport: undefined,//預設false, bool ,function($table),object{filename,sheetname, csv}
            listContainer: ".popu-ctrl-container", //'inner'崁在$element內
            listTheme: "meter", //white、light、medium、dark、primary、success、info、warning、danger、gblue、gbright、gdark
            listOptions:{}, //清單bootstrap-table options
            useCardview: true,
            defalutCardview: false,
            useSearch: true,
            enabledStatusFilter:false,
            minZoom: 0,
            maxZoom: 19,
            classes:undefined,
            clickable:true,
            pinClick: undefined, //function(data){};
            autoReload: { auto: false, interval: 5 * 60 * 1000 }, //autoReload:bool or autoReload:{auto:bool, interval:milliseconds}
            pinsize: { x: 12, y: 12, minx: 8, maxx: 32, miny: 10, maxy: 32, step: 4, anchor: "cneter" }, //anchor cneter、bottoms、left也可以bottoms_left
            geometryOtherOptions:{},//依需要依Map api給geometry options
            dynPinsize:true,
            /** { 'name': '一級', 'url': 'Images/水位站-r.png',classes:'',disabled:false }   disabled:false>在enabledStatusFilter預設關掉 **/
            legendIcons: [],
            /**{field:'',title:'',formatter: function (value, row) {return value},showInInfo:true,showInList:true},  //map infoWindow及清單欄位資訊**/
            infoFields: [],
            //id: "rain",
            layerid:undefined,
            pinInfoLabelMinWidth: undefined,//"16%",
            boundary: undefined,//[[x1,y1],[x2,y2],...], or [[[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...]]
            filter: undefined,  //string or function
            infoWindowAnimation: true,
            useInfoWindow: true, //bool or InfoWindow object options
            canFullInfowindow: false,//for google, bool or object:{"max-width":366,...}
            singleInfoWindow:true,  //for google,leaflet
            cluster: false,// true,//only google;bool or object({gridSize,maxZoom,zoomOnClick,averageCenter,minimumClusterSize,styles}) ,最好(效能)current.mainctrl.settings.dynPinsize=false
            clusterRadius: 80,
            clusterDisableAtZoom:19,
            pinInfoContent: function (data) {
                var settings = this.settings;
                var infofields = settings.infoFields; //執執行階段是setting實體
                var constr = '';
                constr = "<table>";
                $.each(infofields, function (idxf, f) {
                    if (f.field == 'geojson')
                        return;
                    try {
                        if (f.showInInfo !== false) {

                            constr += '<tr><td ' + (settings.pinInfoLabelMinWidth ? 'style="min-width: ' + settings.pinInfoLabelMinWidth + ';"' : "") + '><span  ><b>' + f.title + '</b></span></td><td>' +
                                '<span>' + (f.formatter ? f.formatter(data[f.field.trim()], data, "InfoWindow") : data[f.field]) + (f.unit ? " " + f.unit : "") + "</span></td></tr>";
                        }
                    } catch (ex) {
                        console.log(f.title + "pinInfoContent錯誤:" + ex);
                    }
                });
                constr += "</table>";
                //return '<div class="meterInfoTemplateContent ' + this.$element.attr('id') + '-info-content ' + this.settings.name + '-info-content">' + constr + '</div>';
                return '<div class="meterInfoTemplateContent rete-info-content ' + this.settings.name + '-info-content">' + constr + '</div>';
            },
            checkDataStatus: function (data, index) { return { classes: 'blue_status' } }, //執行階段是setting實體
            baseInfoMerge: {
                basekey: undefined, infokey: undefined, xfield: undefined, yfield: undefined, aftermerge: function (d) { }},//自動做transformData,basekey基本資料key,infokey資料key,xfield經度欄位,yfield緯度欄位
            transformData: function (_base, _info) {
                var _that = this;
                var _result;
                if (this.baseInfoMerge && (this.baseInfoMerge.basekey || this.baseInfoMerge.basekey || this.baseInfoMerge.xfield)) {// && _base && _base.length > 0) {
                    var ps = this.baseInfoMerge;
                    var rs;
                    var _usebase = true;
                    if (_base && _base.length > 0)
                        rs = JSON.parse(JSON.stringify(_base));
                    else {
                        rs = JSON.parse(JSON.stringify(_info));
                        _usebase = false;
                    }
                
                    $.each(rs, function () {
                        var b = this;
                        if (_usebase) {
                            var bk = this[ps.basekey];
                            if (_info) {
                                var ifs = $.grep(_info, function (s) {
                                    return bk == s[ps.infokey];
                                });
                                if (ifs.length > 0)
                                    $.extend(b, ifs[0]);
                            }
                        }

                        

                        if(ps.xfield)
                            b.X = helper.misc.getValueByPath(b,ps.xfield);
                        if(ps.yfield)
                            b.Y = helper.misc.getValueByPath(b, ps.yfield);

                        
                        
                        if (ps.aftermerge)
                            ps.aftermerge.call(_that, b);
                    });
                    _result= rs;
                }
                else
                    _result = _base && _base.length > 0 ? _base : _info;
                $.each(_result, function (_idx, b) {
                    if (b.X == undefined)
                        b.X = b.X || b.lon || b.lng || b.Lon || b.Lng || b.longitude || b.Longitude;
                    if (b.Y == undefined)
                        b.Y = b.Y || b.lat || b.Lat || b.latitude || b.Latitude;
                })
                return _result;
            },
            appendCustomToolbarHeader: undefined, //array, {item:'',event:'',callback :function}
            type: 'point'//point,polygon,polyline
        },
        eventKeys: {
            displayLayer: "~~displayLayer",     //呈現該layer
            displayList: "~~displayList",       //呈現清單
            initLayer: "~~initLayer",           //初始化(第一次呈現該layer)，開始抓資料
            initUICompleted: "~initUiCompleted",//UI初始化，尚未抓資料,
            afterSetdata:"~afterSetdata~",
            repaintPinCompleted: "~repaintPinCompleted", //畫完pin
            pinShowChange: "~pinshowchange", //畫完pin
            //beginShowInfowindow: "~beginShowInfowindow", //呈現Infowindow前
            //afterShowInfowindow: "~afterShowInfowindow", //呈現Infowindow後
            fullInfowindowChange: "~fullInfowindowChange", //Infowindow大視窗切換 for google
        },
        type: { point: 'point', polygon: 'polygon', polyline: 'polyline', feature: '"Feature"' }, //point、polygon、polyline為單層資料;"Feature"為非固定geometry且可多層,[feature(point)、feature(linestring)、feature(polygon)、feature(GeometryCollection)]
        helper: {
            getDataStatusLegendIcon: function (legends, name) { //依名稱取legendIcon
                var result = undefined;

                if (!name)
                    return result;
                $.each(legends, function () {
                    if (this.name.trim() === name.trim()) {
                        result = this;
                        return false;
                    }
                });
                if (!result)
                    console.log('無對應圖例name:"' + name+'"');
                return result;
            },
            ajaxDotnetWebserviceEmptyParas: function (url, callback) {
                var current = this;
                $.BasePinCtrl.helper.ajaxGeneralRequest.call(this, {
                    url: url,
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    type: "POST"
                }, function (data) {
                    callback.call(current, data.d);
                });
            },
            ajaxDotnetWebserviceWithParasAsync: function (url, data) {
                var result;
                var paras = typeof data == 'string' ? data : JSON.stringify(data);
                $.ajax({
                    url: url,
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    type: "POST",
                    data: paras,
                    async: false
                }).done(function (dat, status) {
                    if (dat && dat.d)
                        result = dat.d;
                }).fail(function (dat, status) {
                    console.log(dat.responseText);
                });
                return result;
            },
            ajaxDotnetWebserviceWithParas: function (url, data, callback) {
                var result;
                var paras = typeof data == 'string' ? data : JSON.stringify(data);
                $.ajax({
                    url: url,
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    type: "POST",
                    data: paras
                }).done(function (dat, status) {
                    if (dat && dat.d)
                        result = dat.d;
                    callback(result, status);
                }).fail(function (dat, status) {
                    console.log(dat.responseText);
                    callback(dat, status);
                });
            },
            ajaxGeneralRequest: function (opts, callback) {
                var current = this;
                $.ajax(opts).done(function (data, status) {
                    if (callback)
                        callback.call(current, data);
                }).fail(function (data, status) {
                    console.log(data);
                    if (callback)
                        callback.call(current, undefined);
                });
            },
            getWraMeterData: function (method, args, dataPath, arrayfileds, callback) {
                $.ajax({
                    url: (window.WraMeterSource ? window.WraMeterSource : 'https://fhy.wra.gov.tw/Typh_New/Meter.asmx/') + method,
                    dataType: "text",
                    dataFilter: function (data, type) {
                        data = data.replace(/\r\n/g, '');

                        var pds = helper.format.xmlToJson.parseString(data);

                        //var datapart = eval('pds' + (dataPath ? '.' : '') + dataPath); //不能直接用eval，如javascript 壓縮(minify)因變數命名改變會有問題 
                        var datapart = pds;
                        if (dataPath) {
                            var paths = dataPath.split('.');
                            for (var i = 0; i < paths.length; i++) {
                                datapart = datapart[paths[i].trim()];
                            }
                        }
                        if (!datapart)
                            return [];
                        datapart = $.isArray(datapart) ? datapart : [datapart]; //資料室array，如只有一筆xmlToJSON return 是object非array
                        datapart = helper.format.xmlToJson.setXmlObjTextToValue(datapart, arrayfileds);
                        return datapart;
                    },
                    data: args,
                    type: "POST"
                }).done(function (data, dfsd) {
                    callback(data);
                }).fail(function (data, st) {
                    console.log(JSON.stringify(data) + "<br>" + JSON.stringify(st));
                });
            },
            getWraFhyApi:function(funpath, opts, callback){
                //var options = $.extend({ url: "https://fhy.wra.gov.tw/Api/v2/" + funpath, type: "GET", dataType: "json", contentType: 'application/json; charset=utf-8' }, opts);
                //var options = $.extend({ url: "https://fhy.wra.gov.tw/Api/v2/" + funpath, type: "GET", dataType: "json", headers: { apikey: 'XEzkLbaHalfdYuaV0ahvzhbWeqsmkGlg', Authorization:'XEzkLbaHalfdYuaV0ahvzhbWeqsmkGlg'}}, opts);
                var options = $.extend({
                    url: "https://fhy.wra.gov.tw/Api/v2/" + funpath, type: "GET",// dataType: "json",// crossDomain: true,
                    headers: { 'apikey': 'XEzkLbaHalfdYuaV0ahvzhbWeqsmkGlg' },
                }, opts);
                $.ajax(options).done(function (data, status) {
                    callback(data);
                }).fail(function (data, status) {
                    callback(data, status);
                });
            },
            getField: function (fields, fn) { return $.grep(fields, function (_f) { return _f.field==fn })[0]; },
            reload: function (dt) {
                this.$element.show_busyIndicator({ timeout: 40000 });
                if (!this.__baseData) { //基本資料
                    if (this.settings.loadBase === undefined)
                        console.log(this.settings.name + " 無設定取基本資料");
                    else {
                        if (typeof this.settings.loadBase === "string") {
                            $.BasePinCtrl.helper.ajaxDotnetWebserviceEmptyParas.call(this, this.settings.loadBase, this.__loadBaseCompleted)
                        }
                        else if (typeof this.settings.loadBase === 'function') {
                            this.settings.loadBase.call(this, jQuery.proxy(this.__loadBaseCompleted, this));
                        }
                        else if (typeof this.settings.loadBase === 'object') {
                            $.BasePinCtrl.helper.ajaxGeneralRequest.call(this, this.settings.loadBase, this.__loadBaseCompleted);
                        }
                    }
                }
                if (this.settings.loadInfo === undefined)
                    console.log(this.settings.name + " 無設定取即時資料");
                else {
                    if (typeof this.settings.loadInfo === "string") { //即時資料
                        $.BasePinCtrl.helper.ajaxDotnetWebserviceEmptyParas.call(this, this.settings.loadInfo, this.__loadInfoCompleted)
                    }
                    else if (typeof this.settings.loadInfo === 'function') {  //function
                        this.settings.loadInfo.call(this, dt, jQuery.proxy(this.__loadInfoCompleted, this));
                    }
                    else if (typeof this.settings.loadInfo === 'object') {
                        $.BasePinCtrl.helper.ajaxGeneralRequest.call(this, this.settings.loadInfo, this.__loadInfoCompleted);
                    }
                }
            }
        },
        pinIcons: {
            water: {
                normal:{ 'name': '正常', 'url': $.AppConfigOptions.script.gispath + '/images/meter/水位站-g.png', 'classes': 'water_normal' }, 
                warnLevel3:{ 'name': '三級', 'url': $.AppConfigOptions.script.gispath + '/images/meter/水位站-y.png', 'classes': 'water_warnleve3' },
                warnLevel2:{ 'name': '二級', 'url': $.AppConfigOptions.script.gispath + '/images/meter/水位站-o.png', 'classes': 'water_warnleve2' },
                warnLevel1:{ 'name': '一級', 'url': $.AppConfigOptions.script.gispath + '/images/meter/水位站-r.png', 'classes': 'water_warnleve1' },
                noData:{ 'name': '無資料', 'url': $.AppConfigOptions.script.gispath + '/images/meter/水位站-gr.png', 'classes': 'water_nodata' }
            },
            rain: {
                normal:{ 'name': '正常', 'url': $.AppConfigOptions.script.gispath + '/images/meter/雨量站-正常.png', 'classes': 'rain_normal' },
                heavy:{ 'name': '大雨', 'url': $.AppConfigOptions.script.gispath + '/images/meter/雨量站-大雨.png', 'classes': 'rain_heavy' }, 
                extremely:{ 'name': '豪雨', 'url': $.AppConfigOptions.script.gispath + '/images/meter/雨量站-豪雨.png', 'classes': 'rain_extremely' }, 
                torrential:{ 'name': '大豪雨', 'url': $.AppConfigOptions.script.gispath + '/images/meter/雨量站-大豪雨.png', 'classes': 'rain_torrential' },
                extremely_torrential:{ 'name': '超大豪雨', 'url': $.AppConfigOptions.script.gispath + '/images/meter/雨量站-超大豪雨.png', 'classes': 'rain_exttorrential' },
                noData:{ 'name': '無資料', 'url': $.AppConfigOptions.script.gispath + '/images/meter/雨量站-無資料.png', 'classes': 'rain_nodata' }
            },
            cctv: {
                normal: { 'name': '攝影機', 'url': $.AppConfigOptions.script.gispath + '/images/camera.png', 'classes': 'blue_status' }
            },
            defaultPin: { 'name': '圖例', 'url': $.AppConfigOptions.script.gispath + '/images/blue-pushpin.png', 'classes': 'blue_status' },
        }
    };

    var pluginName = 'BasePinCtrl'
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.$__pinswitch = undefined;
        this.$__pinlabel = undefined;
        this.$__pinlist = undefined;
        this.settings = $.extend({}, $.BasePinCtrl.defaultSettings);// {map:undefined, width:240};

        this.$___listJspanelElement = undefined;    //清單 jspanel
        this.__triggerMouseEventForListTable = true;
        this.___datas = undefined;
        this.___displaydatas = [];
        this.___customfilter = ""; //提供使用者filter
        this.___queryfilter = "";   //來源搜尋功能
        //資料
        this.isInitCompleted = false;
        this.visible = false;

        this._mainctrl = undefined;
        
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            
            var _pinsize =  $.extend({}, this.settings.pinsize);
            $.extend(this.settings, options);
            this.settings.id = this.settings.id || helper.misc.geguid();
            this.settings.pinsize = $.extend(_pinsize, options.pinsize);
            this.___customfilter = this.settings.filter;
            this.settings.useExport = this.settings.useExportCsv || this.settings.useExport || false;//因舊版本的是以useExportCsv定義
            //$.extend(this.settings.pinsize, _pinsize);

            if (this.settings.autoReload === true) this.settings.autoReload = { auto: true, interval: 5 * 60 * 1000 };

            var current = this;
            if (this.settings.initEvent) {
                this.$element.on(this.settings.initEvent, function () {
                    if (current.isInitCompleted)
                        return;
                    current.initMap();
                });
            }
            else {
                this.initMap();
            }
            this.$element.addClass((this.settings.id ? 'pin-' + this.settings.id : ''));
            this.$element.addClass((this.settings.name ? 'pin-' + this.settings.name : ''));

            this.$element.addClass((this.settings.classes ? this.settings.classes : ''));
        },
        initMap : function () {
            var current = this;
            if (whatMap(this.settings.map) === "google") {
                if (this.settings.type == $.BasePinCtrl.type.polygon) {
                    if (window.GPolygonBasePinCtrl)
                        current._mapctrl = new GPolygonBasePinCtrl(current, function () { current.initUI(); });
                    else
                        helper.misc.getJavaScripts([$.AppConfigOptions.script.gispath + "/ext/meter/GPolygonBasePinCtrl.js"], function () {
                            current._mapctrl = new GPolygonBasePinCtrl(current, function () { current.initUI(); });
                        });
                }
                else if (this.settings.type == $.BasePinCtrl.type.polyline) {
                    if (window.GPolylineBasePinCtrl)
                        current._mapctrl = new GPolylineBasePinCtrl(current, function () { current.initUI(); });
                    else
                        helper.misc.getJavaScripts([$.AppConfigOptions.script.gispath + "/ext/meter/GPolylineBasePinCtrl.js"], function () {
                            current._mapctrl = new GPolylineBasePinCtrl(current, function () { current.initUI(); });
                        });
                }
                else {
                    if (window.GBasePinCtrl)
                        current._mapctrl = new GBasePinCtrl(current, function () { current.initUI(); });
                    else
                        helper.misc.getJavaScripts([$.AppConfigOptions.script.gispath + "/ext/meter/GBasePinCtrl.js"], function () {
                            current._mapctrl = new GBasePinCtrl(current, function () { current.initUI(); });
                        });

                }
            }
            else if (whatMap(this.settings.map) === "leaflet") {
                if (this.settings.type == $.BasePinCtrl.type.feature) {
                    if (window.LFeatureBasePinCtrl)
                        current._mapctrl = new LFeatureBasePinCtrl(current, function () { current.initUI(); });
                    else
                        helper.misc.getJavaScripts([$.AppConfigOptions.script.gispath + "/ext/meter/LFeatureBasePinCtrl.js"], function () {
                            current._mapctrl = new LFeatureBasePinCtrl(current, function () { current.initUI(); });
                        });
                }
                else if (this.settings.type == $.BasePinCtrl.type.polygon) {
                    if (window.LPolygonBasePinCtrl)
                        current._mapctrl = new LPolygonBasePinCtrl(current, function () { current.initUI(); });
                    else
                        helper.misc.getJavaScripts([$.AppConfigOptions.script.gispath + "/ext/meter/LPolygonBasePinCtrl.js"], function () {
                            current._mapctrl = new LPolygonBasePinCtrl(current, function () { current.initUI(); });
                        });
                }
                else if (this.settings.type == $.BasePinCtrl.type.polyline) {
                    if (window.LPolylineBasePinCtrl)
                        current._mapctrl = new LPolylineBasePinCtrl(current, function () { current.initUI(); });
                    else
                        helper.misc.getJavaScripts([$.AppConfigOptions.script.gispath + "/ext/meter/LPolylineBasePinCtrl.js"], function () {
                            current._mapctrl = new LPolylineBasePinCtrl(current, function () { current.initUI(); });
                        });
                }
                else {
                    if (window.LBasePinCtrl)
                        current._mapctrl = new LBasePinCtrl(current, function () { current.initUI(); });
                    else
                        $.getScript($.AppConfigOptions.script.gispath + "/ext/meter/LBasePinCtrl.js", function () {
                            current._mapctrl = new LBasePinCtrl(current, function () { current.initUI(); });
                        });
                }
                
            }
            else if (whatMap(this.settings.map) === "golife") {
                if (window.GLBasePinCtrl)
                    current._mapctrl = new GLBasePinCtrl(current, function () { current.initUI(); });
                else
                    helper.misc.getJavaScripts([$.AppConfigOptions.script.gispath + "/ext/meter/GLBasePinCtrl.js"], function () {
                        current._mapctrl = new GLBasePinCtrl(current, function () { current.initUI(); });
                    });
             
            }
            else {
                if (this.settings.type == $.BasePinCtrl.type.polygon) {
                    if (window.APolygonBasePinCtrl)
                        current._mapctrl = new APolygonBasePinCtrl(current, function () { current.initUI(); });
                    else
                        helper.misc.getJavaScripts([$.AppConfigOptions.script.gispath + "/ext/meter/APolygonBasePinCtrl.js"], function () {
                            current._mapctrl = new APolygonBasePinCtrl(current, function () { current.initUI(); });
                        });
                }
                else if (this.settings.type == $.BasePinCtrl.type.polyline) {
                    if (window.APolylineBasePinCtrl)
                        current._mapctrl = new APolylineBasePinCtrl(current, function () { current.initUI(); });
                    else
                        helper.misc.getJavaScripts([$.AppConfigOptions.script.gispath + "/ext/meter/APolylineBasePinCtrl.js"], function () {
                            current._mapctrl = new APolylineBasePinCtrl(current, function () { current.initUI(); });
                        });
                }
                else {
                    if (window.ABasePinCtrl)
                        current._mapctrl = new ABasePinCtrl(current, function () { current.initUI(); });
                    else
                        $.getScript($.AppConfigOptions.script.gispath + "/ext/meter/ABasePinCtrl.js", function () {
                            current._mapctrl = new ABasePinCtrl(current, function () { current.initUI(); });
                        });
                }
            }

        },
        __checkCtrlEnableForZoomLevel: function (_z) {
            var current = this;
            var _b = current.$__pinswitch.is(":checked");

            if (current.settings.minZoom == 0 && current.settings.maxZoom == 19)
                return;

            if (_z < current.settings.minZoom || _z > current.settings.maxZoom) {
                current.$__pinswitch.attr("disabled", true);
                current.$__pinlabel.attr("disabled", true);
                current.$__pinlist.attr("disabled", true);
                if (current.$___listJspanelElement && current.$___listJspanelElement.is(":visible")) //隱藏清單
                    current.$___listJspanelElement.hide();
            } else {
                current.$__pinswitch.attr("disabled", false);
                current.$__pinlabel.attr("disabled", !_b);
                current.$__pinlist.attr("disabled", !_b);
                if (current.$___listJspanelElement && current.$__pinlist.is(":checked")) //顯示清單，如在勾選狀態trigger("change"會顯示清單
                    current.$__pinlist.trigger("change");
            }
            if (_b) {
                current.show();
                current.$__pinlabel.trigger('change');
            }
        },
        initUI: function () {
            
            var current = this;
            setTimeout(function () {
                if (current.settings.pinClick != null)
                    current._mapctrl.pinClick = current.settings.pinClick;
                var _virtualscrollchangetimerflag;
                current._mapctrl.onFocusRowIndex = function (ridx) {
                    if (current.$___listJspanelElement) {
                        var tr = $(".fixed-table-body tbody tr[data-index=" + ridx + "]:eq(0)", current.$___listJspanelElement.$listBootstrapTable);
                        if (tr && tr.length > 0) {
                            var trh = tr.height();
                            var iscardView = !current.$___listJspanelElement.$listBootstrapTable.find(".fixed-table-header>table>thead:eq(0)").is(":visible");
                            current.___scrollContenTop.call(current, tr[0].offsetTop - (iscardView ? 20 : 60));//;tr.height()*3);
                            //current.___scrollContenTop.call(current, tr.position().top);
                            tr.addClass("meter-active");
                        }
                        else if (ridx > -1 && current.settings.listOptions.virtualScroll == true) { //20200210新增for virtualScroll (large data)
                            var _top = 0;
                            var $_tr = $(".fixed-table-body tbody tr:eq(0)", current.$___listJspanelElement.$listBootstrapTable);
                            if ($_tr.hasClass('virtual-scroll-top')) {
                                _top = $_tr.height();
                                $_tr = $(".fixed-table-body tbody tr:eq(1)", current.$___listJspanelElement.$listBootstrapTable);
                                _top += $_tr.height() * (ridx - $_tr.attr("data-index"));
                            }
                            else
                                _top = ridx * $_tr.height();
                            current.___scrollContenTop.call(current, _top);
                            clearTimeout(_virtualscrollchangetimerflag);
                            _virtualscrollchangetimerflag =setTimeout(function () {
                                current.___listenTableMouseEvent();
                                current._mapctrl.onFocusRowIndex(ridx)
                            });
                        }
                    }
                };
                current._mapctrl.offFocusRowIndex = function (ridx) {
                    if (current.$___listJspanelElement) {
                        var tr = $(".fixed-table-body tbody tr[data-index]", current.$___listJspanelElement.$listBootstrapTable).removeClass("meter-active");
                    }
                };
                current._mapctrl.onMapZoomEnd = function (_z) {
                    current.__checkCtrlEnableForZoomLevel(_z);
                };
                current.__checkCtrlEnableForZoomLevel(current._mapctrl.getCurrentZoomlevel());
            });
            var _nw = (!this.settings.useLabel && !this.settings.useList) ?12: 6;
            var uicontentstr = '<div class="col-xs-12 col-12 ctrl"><label class="col-xs-' + _nw + ' col-' + _nw + '"><input type="checkbox" class="pinswitch"><span class="checkbox-glyphicon base-background  btn-sm  glyphicon "></span><span class="checkbox-name">' + this.settings.name + '</span></label>';

            if (this.settings.useLabel)
                uicontentstr += '<label class="col-xs-3 col-3"><input type="checkbox" disabled class="pinlabel"><span class="checkbox-glyphicon base-background  btn-sm glyphicon"></span><span class="checkbox-name">標籤</span></label>';
            if (this.settings.useList)
                uicontentstr += '<label class="col-xs-3 col-3"><input type="checkbox" disabled class="pinlist"><span class="checkbox-glyphicon base-background  btn-sm glyphicon"></span><span class="checkbox-name">清單</span></label>';
            uicontentstr += '</div>';

      
            this.$element.addClass("pinctrl");
            if(!this.$element.attr('id'))
                this.$element.attr("id", this.settings.id);
            this.$element.append(uicontentstr);
            this.repaintLegendUI();

            this.$__pinswitch = $("input.pinswitch", this.$element);
            this.$__pinlabel = $("input.pinlabel", this.$element);
            this.$__pinlist = $("input.pinlist", this.$element);
            
            //on off
            var _autoReloadTimerFlag;
            var _lastAutoReloadTime;
            this.$__pinswitch.on('change', function () {
                var checked = $(this).is(":checked");
                var checkessd = current.$__pinlist.is(":checked");
                if (checked) {
                    current.visible = true;
                    current._mapctrl.visible = true;
                }
                else {
                    current.visible = false;
                    current._mapctrl.visible = false;
                }
                $("input.pinlabel", current.$element).attr("disabled", !checked);
                $("input.pinlist", current.$element).attr("disabled", !checked);
                if (!current.settings.map) //無給map
                    return;
                if (!current.isInitCompleted) {
                    current.$element.show_busyIndicator({ timeout: 20000 });
                    if (current.___datas)
                        current.setData(current.___datas);
                    current.$element.trigger($.BasePinCtrl.eventKeys.initLayer, true);
                }
                current.isInitCompleted = true;
                if (checked) {
                    current.show();//___layer.show();
                }
                else {
                    current.hide();
                }
                //current.isInitCompleted = true; //20230614移至上方，在loadBase(CctvCtrl)是取同步資料(或cache資料)或在呼叫show isInitCompleted=false，造成第一次按$__pinswitch無顯示資料
                current.$element.trigger($.BasePinCtrl.eventKeys.displayLayer, checked);

                //auto reload
                var checkReload = function () {
                    if (new Date().getTime() - _lastAutoReloadTime >= current.settings.autoReload.interval) {
                        current.$element.trigger($.BasePinCtrl.eventKeys.initLayer, true); //觸發reload
                        _lastAutoReloadTime = new Date().getTime();
                    }
                    _autoReloadTimerFlag = setTimeout(checkReload, current.settings.autoReload.interval);
                }
                if (current.settings.autoReload.auto) {
                    if (current.visible) {
                        if (!_lastAutoReloadTime)
                            _lastAutoReloadTime = new Date().getTime();
                        checkReload();
                    }
                    else
                        clearTimeout(_autoReloadTimerFlag);
                }
            });
            
            //標籤
            this.$__pinlabel.on('change',function () {
                var __isShowLabel = current.isShowLabel();
               
                var _isDisabled = current.$__pinlabel.is(":disabled");
                current._mapctrl.showLabel(__isShowLabel && !_isDisabled)
            });
            
            //清單
            this.$__pinlist.on('change',function () {
                var _checked = $(this).is(":checked");
                var cid = new Date().getTime();
                
                if (_checked && !current.$___listJspanelElement) {
                    var toolbars = [];
                    if (current.settings.useSearch) //搜尋
                        toolbars.push({
                            item: '<span class="glyphicon glyphicon-search" title="搜尋"></span>',
                            event: 'click',
                            callback: function () {
                                var dsd = $(this).val();
                                //console.log(dsd);
                                $(".fixed-table-toolbar .search", current.$___listJspanelElement.$listBootstrapTable).toggleClass('active').toggle('blind', function () {
                                    current.___resizeTable();    
                                    current.___scrollContenTop.call(current, 0);
                                });
                            }
                        });
                    if (current.settings.useCardview) //cardview
                        toolbars.push({
                            item: '<span class="glyphicon glyphicon-list-alt icon-list-alt" title="檢視切換"></span>',
                            event: 'click',
                            callback: function () {
                                if (current.___displaydatas.length>200)
                                    current.$___listJspanelElement.show_busyIndicator();
                                setTimeout(function () { ///用setTimeout避免資料太大，有卡住感
                                    var tr = $("button[name=toggle]", current.$___listJspanelElement)
                                    tr.trigger("click");
                                    setTimeout(function () {
                                        $(".fixed-table-header", this.$___listJspanelElement).css("border-bottom-color", "").css("border-bottom-width", ""); //用main.css的設定
                                        current.$___listJspanelElement.hide_busyIndicator();
                                    }, 100);
                                }, 10);
                            }
                        });
                    if (current.settings.useExport) 
                        toolbars.push({
                            item: '<span class="glyphicon glyphicon-floppy-save " title="下載"></span>',
                            event: 'click',
                            callback: function () {
                                if (current.settings.useExport == true)
                                    helper.misc.tableToExcel(current.$___listJspanelElement.$table, [current.settings.name], current.settings.name);
                                else if (typeof current.settings.useExport == 'object') {
                                    current.settings.useExport.filename = current.settings.useExport.filename || current.settings.name;
                                    current.settings.useExport.sheetname = current.settings.useExport.sheetname || current.settings.name;
                                    
                                    helper.misc.tableToExcel(current.$___listJspanelElement.$table, [current.settings.useExport.sheetname], current.settings.useExport.filename, current.settings.useExport.csv);
                                }
                                else if (typeof current.settings.useExport === "function")
                                    current.settings.useExport(current.$___listJspanelElement.$table);
                                
                            }
                        });

                    if (current.settings.appendCustomToolbarHeader) {
                        $.each(current.settings.appendCustomToolbarHeader, function () {
                            toolbars.push(this);
                        });
                    }
                    toolbars.push({item: '<span class="meter-list-count"></span>'}); //筆數
                    var cache = current.___getLocalCache() || {}; //cache
                    if(cache.top && window.outerHeight - cache.top < 70) cache.top = window.outerHeight - 70;
                    if (cache.left && window.outerWidth - cache.left < 200) cache.left = window.outerWidth - 200;

                    //產清單的控制項
                    if (current.pinctrlid === undefined)
                        current.pinctrlid = current.settings.layerid + "_" + new Date().getTime();
                    current.$___listJspanelElement = (current.settings.listContainer == "inner" ?
                        current.$element : $(current.settings.listContainer)).jsPanel({
                        id: "jsp_" + current.pinctrlid + "",
                        title: current.settings.name,
                        theme: current.settings.listTheme,// 'meter',
                            classes: "pin-list-container pin-list-container-" + current.settings.name ,
                        //contentBG: { "background": "#222222", padding: "0 3px 3px 3px" },
                        size: { width: cache.width?cache.width: "250",height:cache.height?cache.height:  "300" },
                        overflow: 'hidden',
                        draggable: { stop: function (event, ui) { $(event.target).css("opacity", ""); } },//拖曳後會被設成1
                        position: { top:cache.top?cache.top+"px": '60px', left:cache.left?cache.left+"px": 'center' },
                        controls: { buttons: 'closeonly', iconfont: 'bootstrap' },
                        content: '<table id="metertable_' + current.pinctrlid + '" class="col-xs-12 col-12"></table>',
                        toolbarHeader:toolbars
                    })
                    .mouseenter(function () { current.$___listJspanelElement.front(); })
                    .on('resizestart', function () {
                        window.jspanel_resize_drag = true;
                    }).on('resizestop', function () {
                        window.jspanel_resize_drag = false;
                        current.___setLocalCache({ width: current.$___listJspanelElement.width(), height: current.$___listJspanelElement.height() }); //cache size 的狀態
                        current.___resizeTable();
                    }).on('dragstart', function () {
                        window.jspanel_resize_drag = true;
                    }).on('dragstop', function () {
                        window.jspanel_resize_drag = false;
                        //console.log(current.settings.name + " top:" + current.$___listJspanelElement.position().top);
                        current.___setLocalCache({ top: current.$___listJspanelElement.position().top, left: current.$___listJspanelElement.position().left }); //cache size 的狀態 
                    }).on('onjspanelloaded', function () {
                        var $_sp = $(this);
                        if ($_sp.position().left < 0) $_sp.css('left', 0);
                        if ($_sp.position().top < 0) $_sp.css('top', 0);
                        if (current.settings.listContainer == "inner") {
                            current.$___listJspanelElement.addClass('inner-jsPanel');
                            current.$___listJspanelElement.find('> .jsPanel-hdr > .jsPanel-hdr-l').hide();
                            current.$___listJspanelElement.find('> .jsPanel-hdr > .jsPanel-hdr-r').hide();
                            current.$___listJspanelElement.find('> .ui-resizable-handle').remove();//.removeClass('ui-resizable-handle');
                        } else {
                            current.$___listJspanelElement.front();
                            var $_p = $('.fix-popu-ctrl-toleft.fixed-show');
                            if ($_p.length > 0) {
                                if ($_sp.position().left == 0) {
                                    $_sp.css('left', $_p.width()-100);
                                }
                            }
                        }
                    });
                    current.$___meterListCount = $(".meter-list-count", current.$___listJspanelElement);
                    //重新定義click的動作，原本會將整個jspanel關掉

                    $(".jsPanel-hdr-r .jsPanel-hdr-r-btn-close", current.$___listJspanelElement).unbind("click").on('click',function () {
                        $("input.pinlist", current.$element).prop("checked", false).trigger("change");
                        //current.$___listJspanelElement.hide();
                    });
                    //重新定義search的動作，修改原search功能
                    var afterInitBootstrapTable = function () {
                        var $_search = $(".fixed-table-toolbar .search input", current.$___listJspanelElement.$listBootstrapTable);
                        var timeoutId = 0;
                        setTimeout(function () {
                            $_search.off('keyup drop blur').on('keyup drop blur', function (event) {
                                clearTimeout(timeoutId); // doesn't matter if it's 0
                                var ts = current.___datas.length * 1.5;
                                ts = ts > 1200 ? 1200 : ts;
                                ts = event.keyCode && event.keyCode == 13 ? 0 : ts;
                                timeoutId = setTimeout($.proxy(current.setFilter, current, current.___customfilter, $(event.currentTarget).val()), ts); // 500ms
                            });
                        }, 1000);
                    }


                    current.$element.show_busyIndicator();
                    if ($("").bootstrapTable)
                        current._initListTable(afterInitBootstrapTable);
                    else
                        helper.misc.getJavaScripts([$.AppConfigOptions.script.gispath + "/bootstraptable/bootstrap-table.js"], function () { //ArcGis 1.15版動態載入有問題，須於頁面設定script
                            current._initListTable(afterInitBootstrapTable);
                        });

                    //至最上層
                    setTimeout(function () {
                        current.$___listJspanelElement.front();
                    }, 100);
                    current.$___listJspanelElement.mouseenter(function () { current.$___listJspanelElement.front(); });
                }
                

                if (_checked) {
                    current.$___listJspanelElement.show();
                    current.___resizeTable();
                }
                else if (current.$___listJspanelElement)
                    current.$___listJspanelElement.hide();

               
            });

            
            this.$element.trigger($.BasePinCtrl.eventKeys.initUICompleted);
        },
        _initListTable: function (initcallback) {
            var current = this;
            //修改infoFields以符合bootstrapTable
            $.each(current.settings.infoFields, function () {
                this.visible = this.showInList;
            });
            var _onvirtualscrollchangetimerflag;
            var _options = $.extend(
                {
                    height: 200,
                    striped: false,
                    search: true,
                    showToggle: true,
                    cardView: current.settings.defalutCardview,
                    columns: current.settings.infoFields,
                    data: current.___displaydatas ? current.___displaydatas : [],
                    rowStyle: $.proxy(current.settings.checkDataStatus, current),
                    onClickRow: function (data, $element) {
                        if (!current.__triggerMouseEventForListTable)
                            return;
                        //current._mapctrl.showInfoWindow(data.graphic); //會觸發pinClick
                        if(current.settings.useInfoWindow)
                            current._mapctrl.showInfoWindow(current._mapctrl.getGraphicByRindex(data.rindex), true) //會觸發pinClick
                        
                    },
                    onSort: function (name, order) {
                        setTimeout(function () {

                            //rindex
                            var _datas = current.$___listJspanelElement.$table.bootstrapTable('getData');
                            $.each(_datas, function (idx, d) {
                                this.rindex = idx;
                            });
                        }, 10);
                        return false;
                    }
                ,
                    formatNoMatches: function () {
                        return '無資料!!';
                    },
                    formatSearch: function () {
                        return "搜尋";
                    },
                    onPostBody: function () { //initBody OK
                        current.___listenTableMouseEvent();
                    },
                    onScrollBody: function (e) {
                        if (_options.virtualScroll) { //20200210新增for virtualScroll (large data)
                            clearTimeout(_onvirtualscrollchangetimerflag);
                            _onvirtualscrollchangetimerflag = setTimeout(function () {
                                current.___listenTableMouseEvent();
                            },200);
                            //console.log("onScrollBody");
                        }
                    }
                },
                current.settings.listOptions);
            if (!_options.classes) _options.classes = "table table-hover"; //"table table-bordered table-hover";
            //產清單內容控制項


            current.$___listJspanelElement.$table = $("#metertable_" + current.pinctrlid).bootstrapTable(_options);
            current.$___listJspanelElement.$listBootstrapTable= current.$___listJspanelElement.$table.parents(".bootstrap-table").first().addClass('metertable');
            current.___resizeTable();
            current.$element.hide_busyIndicator();
            if (initcallback)
                initcallback();
        },
        setFocusPoint: function (data, _fn) {
            var current = this;
            $.each(current.___displaydatas, function () {
                if (this[_fn] === data[_fn] || this[_fn] === data) { //this[_fn] === data;data是字串20180322
                    if (current.settings.useInfoWindow)
                        current._mapctrl.showInfoWindow(current._mapctrl.getGraphicByRindex(this.rindex), true); //會觸發pinClick
                    return false;
                }
            });
        },
        removeFocusPoint: function (data, _fn) {
            var current = this;
            if (data && _fn !== undefined) {
                $.each(current.___displaydatas, function () {
                    if (this[_fn] === data[_fn]) {
                        if (current.settings.useInfoWindow)
                            current._mapctrl.closeInfoWindow(current._mapctrl.getGraphicByRindex(this.rindex)); //會觸發pinClick
                        return false;
                    }
                });
            }
            else
                current._mapctrl.closeInfoWindow();
        },
        setBoundary: function (inBoundary) {
            this.settings.boundary = inBoundary;
            this.setFilter(this.___customfilter, this.___queryfilter, true);
        },
        fitBounds: function (options){
            if(this._mapctrl.fitBounds)
                this._mapctrl.fitBounds(options);
        },
        setFilter: function (cfilter, qfilter, _always) { //cfilter:提供user filter, qfilter:介面上搜尋,_always:必定重filter
             var that = this;
              if (qfilter === undefined) //來至user制定filter
                qfilter = this.___queryfilter;
            if (typeof qfilter === 'boolean') { //提供user filter
                _always = qfilter;
                qfilter = this.___queryfilter
            }
           
            if (!_always && cfilter === this.___customfilter &&　qfilter === this.___queryfilter) {
                return;
            }
          
            this.___queryfilter = qfilter;
            this.___customfilter = cfilter;

            //$(".fixed-table-toolbar .search input", this.$___listJspanelElement).val(this.___customfilter);
            //if (cfilter) cfilter = cfilter.toLowerCase();
            if (typeof cfilter !== 'function')
                if (cfilter) cfilter = cfilter.toLowerCase();
            if(qfilter) qfilter = qfilter.toLowerCase();
            this.___displaydatas = [];
            if (this.___datas && this.___datas.length > 0) {
                //由圖例篩選
                var _filterLegendsDisabled = undefined;
                if (this.settings.enabledStatusFilter) {
                    _filterLegendsDisabled = $.map(this.$element.find('.legend-disable'), function (dom) {
                        return $(dom).text();
                    });
                }

                this.___displaydatas = $.grep(this.___datas, function (item) {
                    //由圖例篩選
                    if (_filterLegendsDisabled && _filterLegendsDisabled.length > 0) {
                        var _s = that.settings.checkDataStatus.call(that, item);
                        //$('<div>'+ _s.name+'</div>').text()>>未確認icon名稱內文(icon名稱設定可加tag，如<span class='blue'>XXX</span>)
                        if (_s != null && _filterLegendsDisabled.indexOf($('<div>' + _s.name + '</div>').text()) >= 0) 
                            return false;
                    }
                    //由邊界篩選
                    if (that.settings.boundary) {
                        var _pib = helper.gis.pointInPolygon([item.X, item.Y], that.settings.boundary);
                        if (!_pib)
                            return false;
                    }
                    //if (typeof cfilter === 'function') {
                    //    var _true = cfilter(item);
                    //    if (_true) {
                    //        for (var key in item) {
                    //            if ((!qfilter || (typeof item[key] === 'string' || typeof item[key] === 'number') && (item[key] + '').toLowerCase().indexOf(qfilter) !== -1)) {
                    //                return true;
                    //            }
                    //        }
                    //    }
                    //} else {
                    //    for (var key in item) {
                    //        if ((!cfilter || (typeof item[key] === 'string' || typeof item[key] === 'number') && (item[key] + '').toLowerCase().indexOf(cfilter) !== -1) &&
                    //            (!qfilter || (typeof item[key] === 'string' || typeof item[key] === 'number') && (item[key] + '').toLowerCase().indexOf(qfilter) !== -1)) {
                    //            return true;
                    //        }
                    //    }
                    //}
                    if (typeof cfilter === 'function') {
                        return cfilter(item) && that.___filterItemText(item, qfilter);
                    } else {
                        return that.___filterItemText(item, cfilter) && that.___filterItemText(item, qfilter);
                    }
                    return false;
                });
            }

            

            this.___repaint();

        },
        setData: function (datas) {
            var current = this;
            this.___datas = datas;
            if(datas && datas.length>0 && this.settings.infoFields.length == 0) {
                $.each(datas[0], function (f,v) {
                    current.settings.infoFields.push({ field: f, title: f });
                });
            }
            this.setFilter(this.___customfilter, this.___queryfilter, true);
            this.$element.trigger($.BasePinCtrl.eventKeys.afterSetdata, [this.___datas, this.___displaydatas]);
        },
        add: function (_data) {
            if (!this._mapctrl)
                return;
            var current = this;
            
            this.___datas = this.___datas || [];
            this.___datas.push(_data)
            current.___displaydatas.push(_data);

            if (!this._mapctrl.add) {
                alert('this._mapctrl尚未實作add');
                return;
            }
            this._mapctrl.add(_data);
            //if (current.visible)
            //    current.show();
            //else
            //    current.hide();

            if (current.$___listJspanelElement) {
                current.$___listJspanelElement.$table.bootstrapTable('load', current.___displaydatas);
            }

        },
        remove: function (_data) {
            var _idx = -1;
            _idx = this.___datas.indexOf(_data);
            if (_idx >= 0)
                this.___datas.splice(_idx, 1);
            _idx = this.___displaydatas.indexOf(_data);
            if (_idx >= 0)
                this.___displaydatas.splice(_idx, 1);

            if (!this._mapctrl.remove) {
                alert('this._mapctrl尚未實作add');
                return;
            }
            this._mapctrl.remove(_data);
            if (this.$___listJspanelElement) {
                this.$___listJspanelElement.$table.bootstrapTable('load', this.___displaydatas);
            }
        },
        setOpacity: function (_opacity) { //only for polygon，polyline
            this._mapctrl.setOpacity(_opacity);
        },
        legendContainer:undefined,//可將legend放在其他DOM
        repaintLegendUI: function (_legendIcons) {
            var current = this;
            var $_lui = undefined;
            var $_c = this.$element;
            if (this.settings.legendContainer) {
                $_c = this.settings.legendContainer;
                if (typeof this.settings.legendContainer === 'string')
                    $_c = this.settings.legendContainer = $(this.settings.legendContainer);
            }
            
            $_lui = $(".legend-" + this.settings.id, $_c);

            if ($_lui.length == 0) {
                //this.$element.append('<div class="col-xs-12 col-12 legend">'); //remark 20190904
                //this.$element.append('<div class="legend legend-' +this.settings.id+'">');
                $_lui = $('<div class="legend legend-' + this.settings.id + '">').appendTo($_c);// $(".legend", this.$element);
            }
            $_lui.empty();
            if (_legendIcons)
                this.settings.legendIcons = _legendIcons;
            if (this.settings.legendIcons) {
                $.each(this.settings.legendIcons, function (idx, icon) {
                    if (current.settings.type == $.BasePinCtrl.type.point) {
                        var cls = 'legend-icon ';
                        var $_dom = $('<div><span class="legend-name">' + icon.name + '</span></div>').addClass('legend-icon' + (icon.disabled ?' legend-disable default-disabled':'' ));
                        $_lui.append($_dom);
                        
                        $_dom[0].style.backgroundImage = "url('" + (icon.url || icon.iconUrl) + "')";
                        if (icon.prefix && icon.glyph) {
                            if (icon.iconUrl) $_dom.addClass('glyph-icon');
                            $_dom.addClass('glyph');
                            $('<span class="' + (icon.prefix + ' ' + icon.glyph + ' ' + icon.classes) + '"></span>').prependTo($_dom);
                        }
                    }
                    else if (current.settings.type == $.BasePinCtrl.type.polygon) {
                        var $_c = $('<span class="legend-icon' + (icon.disabled ? ' legend-disable default-disabled' : '')+'"><div></div><span class="legend-name">' + icon.name + '</span></span>').appendTo($_lui).find('> div').css('display', 'inline-flex').css('vertical-align', 'sub');
                        $('<svg width="26px" height="14px"><g><path></path></g></svg>').appendTo($_c).find('path').attr('stroke', this.strokeColor).attr('stroke-opacity', this.strokeOpacity).attr('stroke-width', this.strokeWeight < 2 ? 2 : this.strokeWeight)//this.strokeWeight)
                           .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round').attr('stroke-dasharray', '0').attr('fill', this.fillColor).attr('fill-opacity', this.fillOpacity)
                            .attr('d', 'M0 7 L7 2 L10 0 L23 0 L26 3 L26 11 L23 14 L3 14 L0 14 Z');
                            //.attr('d', 'M0 0L26 0L26 14L0 14 Z')
                        if (icon.disabled) $_c.addClass('legend-disable default-disabled')
                    }
                    else if (current.settings.type == $.BasePinCtrl.type.polyline) {
                        var $_c = $('<span class="legend-icon' + (icon.disabled ? ' legend-disable default-disabled' : '') +'"><div></div><span class="legend-name">' + icon.name + '</span></span>').appendTo($_lui).find('> div').css('display', 'inline-flex').css('vertical-align', 'sub');
                        $('<svg width="26px" height="14px"><g><path></path></g></svg>').appendTo($_c).find('path').attr('stroke', this.strokeColor).attr('stroke-opacity', 1).attr('stroke-width',  this.strokeWeight)
                           .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round').attr('stroke-dasharray', '0').attr('fill', 'none').attr('d', 'M0 4L9 11L18 4L26 11');
                    }
                });

                //如point是glyph，設定style
                $.each($('.glyph > span', $_lui), function () {
                    var _s = window.getComputedStyle(this);
                    if (_s.backgroundColor)
                        this.style.color = _s.backgroundColor;
                    this.style.backgroundColor ='transparent';
                });

                //使用狀態filter
                if (this.settings.legendIcons.length>1 && this.settings.enabledStatusFilter) {
                    $_lui.find('.legend-icon').addClass('legend-enabled-control').off('click').on('click', function () {
                        $(this).toggleClass('legend-disable');
                        if (current.enabledStatusFilterSetDataTime)
                            clearTimeout(current.enabledStatusFilterSetDataTime);
                        current.enabledStatusFilterSetDataTime = setTimeout(function () {
                            if (current.___datas) {
                                current.$element.show_busyIndicator();
                                setTimeout(function () {
                                    current.setData(current.___datas);
                                },10);
                            }
                        }, 10);
                    });
                }
            }

            this._legenddisplay();
        },
        ___setLocalCache: function (cvalue) { //jquerytarget是選單功能的<a>
            $.localCache.set(this.settings.name + "_list", $.extend($.localCache.get(this.settings.name + "_list"), cvalue));
        },
        ___getLocalCache: function () {
            return $.localCache.get(this.settings.name+"_list");
        },
       
        ___repaint: function () {
            if (!this._mapctrl)
                return;
            var current = this;
            this._mapctrl.reDraw(current.___displaydatas);
            if (current.visible) 
                current.show();
            else
                current.hide();
            if (this.isShowLabel) //20180111改>>reload時showLabel才會work
                current._mapctrl.showLabel(current.isShowLabel());


            
            if (current.$___listJspanelElement) {
                var reloadbootstrapTable = function () { //this.$__pinlist.on('change' 裡如剛好在載入bootstrapTable，會有這問題
                    if (current.$___listJspanelElement.$table) {
                        current.$___listJspanelElement.$table.bootstrapTable('load', current.___displaydatas);

                        current.$element.trigger($.BasePinCtrl.eventKeys.repaintPinCompleted, [current.___displaydatas]);
                    }
                    else
                        setTimeout(reloadbootstrapTable, 100);
                }
                reloadbootstrapTable();
            }
            else
                current.$element.trigger($.BasePinCtrl.eventKeys.repaintPinCompleted, [current.___displaydatas]);

            current.$element.hide_busyIndicator(true);
        },
        ___resizeTable: function () {
            var current = this;
            if (!current.$___listJspanelElement.$table)
                return;
            setTimeout(function (){ //ie沒用setTimeout bootstraptable resetHeaher會看不到
                var search = $(".fixed-table-toolbar .search.active", current.$___listJspanelElement);
                //console.log('___resizeTable:' + $(".jsPanel-content", current.$___listJspanelElement).height());
                current.$___listJspanelElement.$table.bootstrapTable("resetView", {            
                    height: $(".jsPanel-content", current.$___listJspanelElement).height()- 
                        (search.length > 0 ? 0:0)
                    //height: $(".jsPanel-content", current.$___listJspanelElement).height() + 50 - //bootstraptable1.12版後修正改上述
                    //     (search.length > 0 ? search.height() : 0)
                });
                //console.log('search.is(":visible"):' + search.is(":visible"));
                //this.$___listJspanelElement.$table.bootstrapTable("resetHeader");
                setTimeout(function () {
                    $(".fixed-table-header", current.$___listJspanelElement.$listBootstrapTable ).css("border-bottom-color", "").css("border-bottom-width", ""); //用main.css的設定
                });
            });
        },
        ___listenTableMouseEvent: function () { //list table table event to do pin scale and label display
            var fg,current = this;
            $('tbody tr', this.$___listJspanelElement.$table).off("mouseover").on('mouseover', function () {
                if (!current.__triggerMouseEventForListTable)
                    return;
                //current.
                var didx = $(this).attr("data-index");
                current._mapctrl.offFocusGraphic(fg, true);
                fg = current._mapctrl.getGraphicByRindex(didx);
                current._mapctrl.onFocusGraphic(fg, true);

            }).off('mouseleave').on('mouseleave', function () {
                var didx = $(this).attr("data-index");
                current._mapctrl.offFocusGraphic(current._mapctrl.getGraphicByRindex(didx), true); //GBasePinCtrl mouseover會Marker變成MarkerWithLabel
                //current._mapctrl.offFocusGraphic(fg, true);

            });
            $('tbody', this.$___listJspanelElement.$table).off('mouseleave').on('mouseleave', function () {
                //current.___offFocusGraphic(fg, true);
                if (!current.__triggerMouseEventForListTable)
                    return;
                current._mapctrl.offFocusGraphic(fg, true);
            });
            //$(".meter-list-count", this.$___listJspanelElement).html(this.___displaydatas.length);
            current.$___meterListCount.html(this.___displaydatas.length);
        },
        ___scrollContenTop: function (top) {
            $(".fixed-table-body", this.$___listJspanelElement.$listBootstrapTable)[0].scrollTop = top;
        },
        ___filterItemText: function (item, txt) {
            if (txt) {
                var fs = txt.toLowerCase();
                for (var key in item) {
                    if ((typeof item[key] === 'string' || typeof item[key] === 'number') && (item[key] + '').toLowerCase().indexOf(fs) !== -1) {
                        return true;
                    }
                }
                return false;
            }
            return true;
        },
        show: function () {
            if (!this.isInitCompleted)
                return;
            var _z = this.settings.map.getZoom();
            var _isDisabled = this.$__pinswitch.is(":disabled");
            this._mapctrl.show(!_isDisabled);
            this._legenddisplay();
            this.$element.trigger($.BasePinCtrl.eventKeys.pinShowChange, [!_isDisabled]);
        },
        hide: function () {
            if (!this.isInitCompleted)
                return;
            //$.each(this.graphics, function () {
            //    this.hide();
            //});
            this._mapctrl.show(false);
            if (this.$__pinlabel) {
                this.$__pinlabel.prop("checked", false);
                this.$__pinlabel.trigger('change'); //會call labelgraphics.hide
            }
            if (this.$__pinlist) {
                this.$__pinlist.prop("checked", false);
                this.$__pinlist.trigger('change');
            }
            this._legenddisplay();
            this.$element.trigger($.BasePinCtrl.eventKeys.pinShowChange, [false]);
        },
        _legenddisplay: function () {
            if (this.settings.legendContainer) { //外部放legend dom
                var s = !this.$__pinswitch?false: this.$__pinswitch.is(':checked');
                if(s)
                    this.settings.legendContainer.find('.legend-' + this.settings.id).removeClass('offdisplay');
                else
                    this.settings.legendContainer.find('.legend-' + this.settings.id).addClass('offdisplay');
            }
        },
        isShowLabel: function () { //是否呈現label
            if (this.$__pinlabel)
                return this.$__pinlabel.is(":checked");
            return false;
        }
    }

    //建構var $cloud= $('selector').cloud();
    //setDatetime 方法1:$cloud.instance.setDatetime(datetime) ;方法2:$('selector').cloud('setDatetime', datetime);
    //event cloud_type_change 方法1:$cloud.instance.onCloudTypeChange(function (ctype) {};方法2:$('select').cloud('onCloudTypeChange', function (ctype) {};方法3:$('select').on($.cloud.eventKeys.type_change, function (evt, ctype) {};
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
