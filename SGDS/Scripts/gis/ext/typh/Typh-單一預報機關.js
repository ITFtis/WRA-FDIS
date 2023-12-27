/****************typh plugin****************/
(function ($) {
    'use strict';
    var pluginName = 'typh';
    $.typh = {
        eventKeys: { warn_time_change: "warn_time_change", typh_infos_change: "typh_infos_change", load_typh_list_completed: "load_typh_list_completed", ui_init_completed: "ui_init_completed" },
        layerid: {
            typh_pointlayer: "typh_pointlayer",
            typh_linelayer: "typh_linelayer",
            typh_radiusLayer: "typh_radiusLayer"
        },
        date_time_format_string: "yyyy/MM/dd HH",
        forecastOrgs: {
            CWB: "CWB",
            JMA: "JMA",
            JTWC: "JTWC",
        },
        defaultSettings: {
            map: undefined, activeInterval: 1000, source: undefined, url: "http://140.112.76.195/Map/WS/Typh.asmx", initEvent: null, showAlertMessage: true, container: ".popu-ctrl-container",
            forecastOrgs:["CWB"]
        }
        //defaultSettings: { map: undefined, activeInterval: 1000, url: "http://fhy.wra.gov.tw/Typh_New/Typh.asmx", initEvent: null }
    };

    
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }


        this.typhListDatas = pluginclass.prototype.typhListDatas;
        this.typhWarnDatas = pluginclass.prototype.typhWarnDatas;

        this.$element = $(element);
        this.settings = $.extend({}, $.typh.defaultSettings);
        this.map = null;

        this._mapctrl = undefined;
        
        this._current_typhlists = null;
        this._current_warns = null;
        this._current_warn_obj = null;

        this._listbox = null;
        this._infobox = null;
        //Expose public methods
        this._typh_timer_flag = undefined;
        this._newstInfo = undefined;
        this._checkNewstCB = undefined;

        this.isInitCompleted = false;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);
            if (!this.settings.source)
                this.settings.source = this.settings.url; //改以source取代url
            this.map = this.settings.map;
            var current = this;
            if (this.settings.initEvent) {
                this.$element.on(this.settings.initEvent, function () {
                    if (current.isInitCompleted)
                        return;
                    current.isInitCompleted = true;
                    //current.loadArcgisApi();
                    current.resetTyph();
                });
            }
            else
                this.resetTyph();
        },
        resetTyph: function () {
            var current = this;

            if (whatMap(current.settings.map) === "google") {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/typh/GTyph.js", function () {
                    current._mapctrl = new GTyph(current, function () {current.beforeInitUi();});
                });
            }
            else {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/typh/ATyph.js", function () {
                    current._mapctrl = new ATyph(current, function () { current.beforeInitUi(); });
                });
            }
        },
        beforeInitUi: function () {
            var current = this;
            if ($.fn.selectpicker)
                current.initUi();
            else
                $.getScript($.AppConfigOptions.script.gispath + "/select/bselect/bootstrap-select.js", function () {
                    current.initUi();
                });
        },
     
        //初始化UI
        initUi: function () {
            var current = this;
            var accgroup = $('<div></div>');// class="panel-group" id="typh-accordion"></div>');

            var $_orgs = $('<div class="col-xs-12">發佈機關</div>').appendTo(this.$element);
            $.each(this.settings.forecastOrgs, function () {
                $('<label class="color-base" style="cursor:pointer;"><input type="checkbox" data-fhgfh '+(this=='CWB'?'disabled':'')+'>'+this+'</label>').appendTo($_orgs);
            });

            if (this.settings.forecastOrgs.length == 1)
                $_orgs.hide();

            //data-container內容是list的parent
            accgroup.append('<select class="auto-append-header selectpicker col-xs-12" data-typhlist  data-container="' + this.settings.container + '"  data-style="btn-hotel" data-width="100%" data-header="颱風清單" ></select>');
            accgroup.append('<select class="auto-append-header selectpicker col-xs-12" data-typhwarn  data-container="' + this.settings.container + '"  data-style="btn-hotel" data-width="100%" data-header="警報清單"></select>');

            
            this.$element.append(accgroup);
            console.log("this.settings.showAlertMessage:" + this.settings.showAlertMessage);
            if (this.settings.showAlertMessage) //show警報單詳細內容
                this.$element.append('<div class="col-xs-12"><span class="glyphicon glyphicon-info-sign typhinfoctrl" aria-hidden="true"></span><div></div></div>');

            this.$element.append('<div class="col-xs-12"><label class="color-base" style="cursor:pointer;"><input type="checkbox" checked data-autoLoadNewstData>自動更新最新颱風資訊</label></div>');

            this.$element.append('<div class="col-xs-5"><label class="color-base" style="cursor:pointer;"><input type="checkbox" data-timerid>輪播</label></div>');
            this.$element.append('<div class="col-xs-7"><label class="color-base" style="cursor:pointer;"><input type="checkbox" checked data-dispalylayer>顯示圖層</label></div>');

            var $activeRunCB = $('[type=checkbox][data-timerid]', this.$element);

            var $atvIntervaldiv = $('<div class="col-xs-12 auto-append-header" data-header="輪播頻率(快<-->慢)" ></div>').slider({
                range: "min",
                max: 2000,
                min: 100,
                value: this.settings.activeInterval,
                slide: function () { current.resetAactiveRuninterval($(this).slider("value")); },
                change: function () { current.resetAactiveRuninterval($(this).slider("value")); }
            });
            this.$element.append($atvIntervaldiv);

            
            this._checkNewstCB = $('[data-autoLoadNewstData]', this.$element);
            
            this._listbox = $('[data-typhlist]', accgroup);
            this._infobox = $('[data-typhwarn]', accgroup);

            var lheader = this._listbox.attr('data-header');
            var iheader = this._infobox.attr('data-header');
            this._listbox.removeAttr('data-header');
            this._infobox.removeAttr('data-header');
            this._listbox.selectpicker({}); //除加class外，另需呼叫selectpicker，事後重給item option需呼叫refresh
            this._infobox.selectpicker();
            this._listbox.next().attr('data-header', lheader);
            this._infobox.next().attr('data-header', iheader);

            $('.bootstrap-select button', accgroup).attr('title', '無資料').find('span.filter-option').html('無資料');
            
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
                this._listbox.selectpicker('mobile');
                this._infobox.selectpicker('mobile');
            }
            //輪播
            $activeRunCB.click(function () {
                current.activeRun();
                current._checkNewstCB.prop("checked", false);
                current._checkNewstCB.attr('disabled', $activeRunCB.is(":checked"));
            });
            this._checkNewstCB.change(function ()
            {
                if (current._checkNewstCB.is(":checked")) {
                    current._newstInfo = undefined;
                    current.startLoadData();
                }
            });
            
            //顯示、隱存圖層
            $('[type=checkbox][data-dispalylayer]', this.$element).click(function () {
                console.log("$(this).is(':checked'):" + $(this).is(':checked'));
                if ($(this).is(':checked')) {
                    current._mapctrl.show();
                }
                else {
                    current._mapctrl.hide();
                }
            });
            //颱風資訊
            $('.typhinfoctrl', this.$element).click(function (evt) {
                $(evt.target).toggleClass("displaytyphinfo");
            });
            if(this.settings.showAlertMessage)
                this.$element.parents(".jsPanel:first").height(""); //因颱風資訊內容不一，會有高度不一至問題，故不用height cache

            this.$element.trigger($.typh.eventKeys.ui_init_completed);
            this.startLoadData();
        },
        showBusyIndicator: function (msg) {
            this.$element.show_busyIndicator();
        },
        hideBusyIndicator: function (msg) {
            this.$element.hide_busyIndicator();
        },
        startLoadData: function () {
            var current = this;
            clearTimeout(current._typh_timer_flag);
            if (current._checkNewstCB.is(":checked")) {
                $.ajax({
                    url: current.settings.source + "/wsCwbNewestTyphReport",
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    type: "POST"
                }).done(function (data, dfsd) {
                    if (current._newstInfo == undefined || current._newstInfo.DateTime != data.d.DateTime)
                        current.loadTyphListData();
                    current._newstInfo = data.d;
                    current._typh_timer_flag= setTimeout($.proxy(current.startLoadData, current), 5*60 * 1000);
                }).fail(function () {
                    current._typh_timer_flag = setTimeout($.proxy(current.startLoadData, current), 20 * 1000);
                });
            }
            else
                current._typh_timer_flag = setTimeout($.proxy(current.startLoadData, current), 10 * 1000);
        },
        //載入清單
        loadTyphListData: function () {
            var current = this;

            current.showBusyIndicator();
            if (typeof current.settings.source === "string") {
                $.ajax({
                    url: current.settings.source + "/GetTyphBase",
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    type: "POST"
                }).done(function (data, dfsd) {
                    current._paintTyphListCtrlUI(data.d);

                }).fail(
                    function (et, ddf, sdf) {
                        var dsff = "";
                        console.log(et.error);
                    }
                );
            }
            else {
                current.settings.source.basefunc.call(current, function (data) {
                    current._paintTyphListCtrlUI.call(current,data);
                });
            }
        },
        _paintTyphListCtrlUI: function (data) {
            var current = this;

            current.hideBusyIndicator();

            //$('[data-typhid]', accgroup).click(function () {
            current._listbox.change(function () {
                var typhid = $('option:selected', current._listbox).attr('data-typhid');
                console.log("颱風編號:" + typhid );
                $('[data-typhid]', current._listbox).removeClass('ctrl-ui-select');
               
                if (typhid == undefined) {
                    current._current_warns = [];
                    current.paintTyphTrace();
                    current._mapctrl.paintTyphRadius(undefined);
                }
                else {
                    $(this).addClass('ctrl-ui-select');
                    current.loadTyphWarnData(typhid);

                }

            });
            current._infobox.change(function () {
                var typhwarninfo = $('option:selected', current._infobox).attr('data-typhinfo');
                $.each(current._current_warns, function (idx, item) {
                    //if ((new Date(typhwarninfo) + "") === (new Date(item.DateTime) + "")) {
                    if (typhwarninfo === item.DateTime) {
                        current.changeWarntime(item);
                        return;
                    }
                });
            });
            current._current_typhlists = data.reverse();// $.parseJSON(data);
            var _firstflag = true;
            $.each(current._current_typhlists, function (idx, item) {
                if ($.isNumeric(item.No) && (item.No+'').length==4) { //排除一些測試資料
                    current._listbox.append('<option  data-typhid="' + item.No + '">' + item.No + item.CName + '</option>');

                    if (_firstflag)
                        current._listbox.selectpicker('val', item.No + item.CName);
                    _firstflag = false;
                }
            });
            current._listbox.selectpicker('refresh');
            this.$element.trigger($.typh.eventKeys.load_typh_list_completed, [current._current_typhlists]);
        },
        //載入警報單
        loadTyphWarnData: function (typhid) {
            var current = this;
            current.showBusyIndicator();
            if (typeof current.settings.source === "string") {
                $.ajax({
                    //url: 'http://210.59.250.187/SGDS/chart/WS/typh.ashx?typhid=' + typhid
                    url: current.settings.source + "/GetTyphCWBInfo",
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    type: "POST",
                    data: "{inTyphId:'" + typhid + "'}"
                }).done(function (warns) {
                    current._paintTyphWarnCtrlUI(warns.d);
                });
            }
            else {
                current.settings.source.infofunc.call(current, typhid, function (data) {
                    current._paintTyphWarnCtrlUI.call(current,data);
                });
            }
        },
        _paintTyphWarnCtrlUI: function(warns){
            var current=this;
            current._current_warns = warns ? warns.reverse() : warns;// $.parseJSON(warns);
            this.$element.trigger($.typh.eventKeys.typh_infos_change, [current._current_warns]);

            current._infobox.empty();
            current._mapctrl.clearTrace();
            if (warns.length != 0) {
                if (warns.length > 0 && warns[0].Long != 0) {
                    //infobox.destroy();
                    current.paintTyphTrace();
                    $.each(current._current_warns, function (idx, item) {
                        //var warnbox = $('<li class="list-group-item" data-typhinfo="' + item.DateTime + '" style="cursor:pointer;">' + item.DateTime + '</li>');
                        //current._infobox.append('<option  data-typhinfo="' + item.DateTime + '">' + new Date(item.DateTime).DateFormat($.typh.date_time_format_string) + '</option>');
                        var dts = JsonDateStr2Datetime(item.DateTime);
                        current._infobox.append('<option  data-typhinfo="' + item.DateTime + '">' + dts.DateFormat($.typh.date_time_format_string) + '</option>');
                        if (idx == 0)
                            current._infobox.selectpicker('val', dts.DateFormat($.typh.date_time_format_string));
                    });
                }
                current._infobox.selectpicker('refresh');//呼叫refresh新資料才能OK

                if (warns.length == 0 || ( warns.length == 1 && warns[0].Long == 0)) {
                    $("+ div button", current._infobox).attr('title', '無資料').find('span.filter-option').html('無資料');
                    current._showWarnMessage(warns[0]);
                }
            }
            else
                console.log($('option:selected', current._listbox).attr('data-typhid') + "無警報清單!");
            current.hideBusyIndicator();
        },
        //畫颱風軌跡
        paintTyphTrace: function () {
            this._mapctrl.paintTyphTrace(this._current_warns);
            
        },
        //時間改變
        changeWarntime: function (warn) {


            if (warn === undefined || warn === this._current_warn_obj)
                return;
            //
            if (this._newstInfo.DateTime != warn.DateTime)
                this._checkNewstCB.prop("checked", false);

            this._current_warn_obj = warn;
            //this._radiusLayer.clear();
            ////this._radiusLayer.current_warn = warn;

            ////中心點

            ////this._radiusLayer.add(new this.arcApi.Graphic(new this.arcApi.Point(warn.Long, warn.Lat),
            ////                 new this.arcApi.SimpleFillSymbol(this.arcApi.SimpleFillSymbol.STYLE_SOLID,
            ////                    new this.arcApi.SimpleLineSymbol(this.arcApi.SimpleLineSymbol.STYLE_SOLID, new this.arcApi.Color([255, 255, 255]), 3),
            ////                    new this.arcApi.Color([255, 0, 0, 1])
            //// )));
            //this._radiusLayer.add(new this.arcApi.Graphic(new this.arcApi.Point(warn.Long, warn.Lat), new this.arcApi.SimpleMarkerSymbol().setSize(14).setColor(new this.arcApi.Color([255, 255, 255, 0.6])).
            //    setOutline(new this.arcApi.SimpleLineSymbol(this.arcApi.SimpleLineSymbol.STYLE_SOLID, new this.arcApi.Color([255, 0, 0]), 4))));
            ////7級
            //if (warn.Radius7 !== undefined && warn.Radius7 !== 0) {
            //    this._radiusLayer.add(new this.arcApi.Graphic(new this.arcApi.Circle(new this.arcApi.Point([warn.Long, warn.Lat]), { 'radius': warn.Radius7 * 1000 }),
            //        new this.arcApi.SimpleFillSymbol(this.arcApi.SimpleFillSymbol.STYLE_SOLID,
            //            new this.arcApi.SimpleLineSymbol(this.arcApi.SimpleLineSymbol.STYLE_SOLID, new this.arcApi.Color([255, 0, 0]), 2),
            //            new this.arcApi.Color([255, 0, 0, 0.25])
            //    )));
            //}
            ////10級
            //if (warn.Radius10 !== undefined && warn.Radius10 !== 0) {
            //    this._radiusLayer.add(new this.arcApi.Graphic(new this.arcApi.Circle(new this.arcApi.Point([warn.Long, warn.Lat]), { 'radius': warn.Radius10 * 1000 }),
            //       new this.arcApi.SimpleFillSymbol(this.arcApi.SimpleFillSymbol.STYLE_SOLID,
            //           new this.arcApi.SimpleLineSymbol(this.arcApi.SimpleLineSymbol.STYLE_SOLID, new this.arcApi.Color([255, 0, 0]), 2),
            //           new this.arcApi.Color([255, 0, 0, 0.25])
            //   )));
            //}
            this._mapctrl.paintTyphRadius(warn);
            //警報單
            this._infobox.selectpicker('val', JsonDateStr2Datetime(warn.DateTime).DateFormat($.typh.date_time_format_string));
            this._infobox.selectpicker('render');
            //$('[data-typhwarn]', accgroup).selectpicker('render');
            this.$element.trigger($.typh.eventKeys.warn_time_change, [warn,this._checkNewstCB.is(":checked")]);

            //颱風警報單資訊
            this._showWarnMessage(warn);

        },
        _showWarnMessage: function (warn) { //颱風警報單資訊
            if (!this.settings.showAlertMessage)
                return;
            var _msg = "";
            _msg += "<table>";
            _msg += "<tr><td>強風強度:</td><td>" + warn.CIntensity + "</td></tr>";
            _msg += "<tr><td>最大風速:</td><td>" + warn.MaxWind + " 公尺/秒</td></tr>";
            _msg += "<tr><td>七級半徑:</td><td>" + warn.Radius7 + " 公里</td></tr>";
            _msg += "<tr><td>十級半徑:</td><td>" + warn.Radius10 + " 公里</td></tr>";
            _msg += "<tr><td>目前位置:</td><td>" + warn.CurrPlace + "</td></tr>";
            _msg += "<tr><td>移動方向:</td><td>" + warn.MoveV + "</td></tr>";
            _msg += "<tr><td>目前位置:</td><td>" + warn.MoveV + "</td></tr>";
            _msg += "<tr><td>預估座標:</td><td>經-" + warn.PredLat + " 緯-" + warn.PredLong + "</td></tr>";
            _msg += "<tr><td>預估位置:</td><td>" + warn.PredPlace + "</td></tr>";
            _msg += "</table>";
            $('.typhinfoctrl + div', this.$element).html(_msg);
            this.$element.parents(".jsPanel:first").height("");
        },
        //輪播
        activeRun: function (timerid) {
            var current = this;
            var $activeRunCB = $('[type=checkbox][data-timerid]', this.$element);
            var timerid = $activeRunCB.attr('data-timerid');
            if (timerid !== undefined)
                clearInterval(timerid)
            if ($activeRunCB.is(':checked')) {
                //$(this).attr('data-timerid', current.activeRun());
                $activeRunCB.attr('data-timerid',
                    setInterval(function () {
                        var wl = current._current_warns.length;
                        $.each(current._current_warns, function (idx, item) {
                            if ((current._current_warn_obj.DateTime + "") === (item.DateTime + "")) {

                                var didx = idx - 1;
                                if (didx < 0)
                                    didx = current._current_warns.length - 1;

                                current.changeWarntime(current._current_warns[didx]);
                                return false;
                            }
                        });
                    }, current.settings.activeInterval)
                );
            }
        },
        resetAactiveRuninterval: function (interval) {
            this.settings.activeInterval = interval;
            this.activeRun();
        },
        typhListDatas: function () {
            return this._current_typhlists;
        },
        typhWarnDatas: function () {
            return this._current_warns;
        }
    }

    //plugin
    //$('#typh').typh({ map: map });
    //取颱風清單$('#typh').typh("typhListDatas");
    //取颱風警報單$('#typh').typh("typhWarnDatas");
    //$('#typh').typh().on($.typh.eventKeys.warn_time_change, function (evt, warn) {});
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
