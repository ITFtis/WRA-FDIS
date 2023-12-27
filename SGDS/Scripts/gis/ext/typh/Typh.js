/****************typh plugin****************/
(function ($) {
    'use strict';
    var pluginName = 'typh';

    var typhsource = {
        basefunc: function (callback) {
            getWraTyphData('GetTyphBase', undefined, 'ArrayOfTyphBase.TyphBase',  undefined, callback);
        },
        infofunc: function (typhid, callback) {
            getWraTyphData('GetTyphCWBInfo', { inTyphId: typhid }, 'ArrayOfTyphInfo.TyphInfo', {'PredDatas':'PredDatas.TyphInfoBase'}, callback);
        },
        newestReportfunc: function (callback) {
            getWraTyphData('wsCwbNewestTyphReport', undefined, 'TyphInfo',{ 'PredDatas': 'PredDatas.TyphInfoBase' }, callback);
        }
    };
    
    var getWraTyphData = function (method, args, dataPath, arrayfileds , callback) {
        $.ajax({
                //url: (window.WraTyphSource ? window.WraTyphSource : 'https://fhy.wra.gov.tw/Typh_New/Typh.asmx/') + method,
            url: (window.WraTyphSource ? window.WraTyphSource : 'https://www.dprcflood.org.tw/SGDS/WS/TyphExt.asmx/') + method,
            //headers: { apiKey: 'c2VQEw4tWdY7CNDXqcOdHgkKoK7kaMBG' },
            dataType: "text",
            dataFilter: function (data, type) {
                data = data.replace(/\r\n/g, '');
                var pds = helper.format.xmlToJson.parseString(data);
                //var datapart = eval('pds' + (dataPath ? '.' : '') + dataPath);//不能直接用eval，如javascript 壓縮(minify)因變數命名改變會有問題 
                var datapart = pds;
                if (dataPath) {
                    var paths = dataPath.split('.');
                    for (var i = 0; i < paths.length; i++) {
                        datapart = datapart[paths[i].trim()];
                    }
                }

                datapart = $.isArray(datapart) ? datapart : [datapart]; //資料室array，如只有一筆xmlToJSON return 是object非array
                datapart = helper.format.xmlToJson.setXmlObjTextToValue(datapart, arrayfileds);
                return datapart;
            },
            data:args,
            type: "POST"
        }).done(function (data, dfsd) {
            callback(data);
        }).fail(function (data, st) {
            console.log(JSON.stringify(data) + "<br>" + JSON.stringify(st));
        });
    }

    $.typh = {
        eventKeys: { warn_time_change: "warn_time_change", typh_infos_change: "typh_infos_change", load_typh_list_completed: "load_typh_list_completed", ui_init_completed: "ui_init_completed" },
        layerid: {
            typh_pointlayer: "typh_pointlayer",
            typh_linelayer: "typh_linelayer",
            typh_radiusLayer: "typh_radiusLayer"
        },
        date_time_format_string: "yyyy/MM/dd HH",
        forecastOrgs: {
            CWB: {id:"CWB", name: "台灣", color: "#FF0000", loadInfo: undefined},// mapctrl: undefined, warns: undefined },
            JMA: { id: "JMA", name: "日本", color: "#000000", loadInfo: undefined },//, mapctrl: undefined, warns: undefined },
            JTWC: { id: "JTWC", name: "美軍", color: "#7B68EE", loadInfo: undefined },//, mapctrl: undefined, warns: undefined }
        },
        defaultSettings: {
            //url: undefined預設改抓wra原始資料20181105
            //map: undefined, activeInterval: 1000, source: undefined, url: "https://140.124.60.39/Map/WS/Typh.asmx", initEvent: null, showAlertMessage: true,
            map: undefined, activeInterval: 1000, source: undefined, url: undefined, initEvent: null, showAlertMessage: true,
            autoShowFirstData: true,//最新颱風超過12小時，是否自動show最後一場颱風
            container: ".popu-ctrl-container",
            otherForecastOrgs: []
        },
        typhsource: typhsource
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
        this._current_selected_typhid = null;
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

            //改以source取代url，預設改抓wra原始資料20181105
            this.settings.source = this.settings.source || ( this.settings.url || typhsource);
            //if (!this.settings.source)
            //    this.settings.source = this.settings.url; //改以source取代url
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
                if (window.GTyph) {
                    current._mapctrl = new GTyph(current, function () { current.beforeInitUi(); });
                    $.each(current.settings.otherForecastOrgs, function () {
                        this.mapctrl = new GTyph(current, undefined, this.color);
                    });
                }
                else {
                    $.getScript($.AppConfigOptions.script.gispath + "/ext/typh/GTyph.js", function () {
                        current._mapctrl = new GTyph(current, function () { current.beforeInitUi(); });
                        $.each(current.settings.otherForecastOrgs, function () {
                            this.mapctrl = new GTyph(current, undefined, this.color);
                        });
                    });
                }
            }
            else if (whatMap(current.settings.map) === "leaflet") {
                if (window.LTyph) {
                    current._mapctrl = new LTyph(current, function () { current.beforeInitUi(); });
                    $.each(current.settings.otherForecastOrgs, function () {
                        this.mapctrl = new LTyph(current, undefined, this.color);
                    });
                }
                else {
                    $.getScript($.AppConfigOptions.script.gispath + "/ext/typh/LTyph.js", function () {
                        current._mapctrl = new LTyph(current, function () { current.beforeInitUi(); });
                        $.each(current.settings.otherForecastOrgs, function () {
                            this.mapctrl = new LTyph(current, undefined, this.color);
                        });
                    });
                }
            }
            else {
                if (window.ATyph){
                    current._mapctrl = new ATyph(current, function () { current.beforeInitUi(); });
                    $.each(current.settings.otherForecastOrgs, function () {
                        this.mapctrl = new ATyph(current, undefined, this.color);
                    });
                }
                else {
                    $.getScript($.AppConfigOptions.script.gispath + "/ext/typh/ATyph.js", function () {
                        current._mapctrl = new ATyph(current, function () { current.beforeInitUi(); });
                        $.each(current.settings.otherForecastOrgs, function () {
                            this.mapctrl = new ATyph(current, undefined, this.color);
                        });
                    });
                }
            }
        },
        beforeInitUi: function () {
            var current = this;
            //if ($.fn.selectpicker) ////20180710取消用selectpicker
                current.initUi();
            //else
            //    $.getScript($.AppConfigOptions.script.gispath + "/select/bselect/bootstrap-select.js", function () {
            //        current.initUi();
            //    });
        },
     
        //初始化UI
        initUi: function () {
            var current = this;
            var accgroup = $('<div class="typh-select-container col-xs-12 col-sm"></div>');// class="panel-group" id="typh-accordion"></div>');

            var $_orgs = $('<div class="col-xs-12 col-sm typh-sourceorg-container">發佈機關<br></div>').appendTo(this.$element);
            $('<label class="color-base" style="cursor:pointer;"><input type="checkbox" data-organization disabled checked>' + $.typh.forecastOrgs.CWB .name+ '</label>').appendTo($_orgs).css('color', $.typh.forecastOrgs.CWB.color);
            $.each(this.settings.otherForecastOrgs, function () {
                $('<label class="color-base" style="cursor:pointer;"><input type="checkbox" data-organization="'+this.name+'" >' + this.name + '</label>').appendTo($_orgs).css('color',this.color);
            });
            if (this.settings.otherForecastOrgs.length == 0)
                $_orgs.hide();

            //data-container內容是list的parent
            accgroup.append('<div class="auto-append-header"  data-header="颱風清單"></div>');
            //accgroup.append('<select class="selectpicker form-control base-background " data-typhlist  data-container="' + this.settings.container + '"  data-style="btn-hotel" data-width="100%" data-header="颱風清單" ></select>');
            accgroup.append('<select class="form-control base-background " data-typhlist  data-container="' + this.settings.container + '"  data-style="btn-hotel" data-width="100%" data-header="颱風清單" ></select>');
            accgroup.append('<div class="auto-append-header"  data-header="警報清單"></div>');
            //accgroup.append('<select class="selectpicker form-control base-background " data-typhwarn  data-container="' + this.settings.container + '"  data-style="btn-hotel" data-width="100%" data-header="警報清單"></select>');
            accgroup.append('<select class="form-control base-background " data-typhwarn  data-container="' + this.settings.container + '"  data-style="btn-hotel" data-width="100%" data-header="警報清單"></select>');

            
            this.$element.append(accgroup);
            console.log("this.settings.showAlertMessage:" + this.settings.showAlertMessage);
            if (this.settings.showAlertMessage) //show警報單詳細內容
                this.$element.append('<div class="col-xs-12 col-sm"><span class="glyphicon glyphicon-info-sign typhinfoctrl" aria-hidden="true"></span><div></div></div>');

            this.$element.append('<div class="col-xs-12 col-sm typh-auto-refresh-container"><label class="color-base" style="cursor:pointer;"><input type="checkbox" checked data-autoLoadNewstData>自動更新最新颱風資訊</label></div>');

            this.$element.append('<div class="col-xs-5 col-sm typh-active-container"><label class="color-base" style="cursor:pointer;"><input type="checkbox" data-timerid>輪播</label></div>');
            this.$element.append('<div class="col-xs-7 col-sm typh-display-layer-container"><label class="color-base" style="cursor:pointer;"><input type="checkbox" checked data-dispalylayer>顯示圖層</label></div>');

            var $activeRunCB = $('[type=checkbox][data-timerid]', this.$element);

            var $atvIntervaldiv = $('<div class="col-xs-12 col-sm auto-append-header  typh-active-frequence-container" data-header="輪播頻率(快<-->慢)" ></div>')
                .gis_layer_opacity_slider({
                    map:this.settings.map,
                //.slider({
                    range: "min",
                    max: 2000,
                    min: 100,
                    value: this.settings.activeInterval,
                    setOpacity: function (_op) { current.resetAactiveRuninterval(_op*100); }
                    //slide: function () { current.resetAactiveRuninterval($(this).slider("value")); },
                    //change: function () { current.resetAactiveRuninterval($(this).slider("value")); }
                });
            this.$element.append($atvIntervaldiv);

            
            this._checkNewstCB = $('[data-autoLoadNewstData]', this.$element);
            
            this._listbox = $('[data-typhlist]', accgroup);
            this._infobox = $('[data-typhwarn]', accgroup);

            var lheader = this._listbox.attr('data-header');
            var iheader = this._infobox.attr('data-header');
            //this._listbox.removeAttr('data-header');//20180710取消用selectpicker
            //this._infobox.removeAttr('data-header');
            //this._listbox.selectpicker({}); //除加class外，另需呼叫selectpicker，事後重給item option需呼叫refresh
            //this._infobox.selectpicker();
            //this._listbox.next().attr('data-header', lheader);
            //this._infobox.next().attr('data-header', iheader);

            //$('.bootstrap-select button', accgroup).attr('title', '無資料').find('span.filter-option').html('無資料');
            
            //if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
            //    this._listbox.selectpicker('mobile');
            //    this._infobox.selectpicker('mobile');
            //}
            //其他發佈機關切換
            $_orgs.find('[type=checkbox][data-organization]').on('click', function () {
                var $_this = $(this);
                var _corg = $.grep(current.settings.otherForecastOrgs, function (o) {
                    return o.name == $_this.attr('data-organization');
                })[0];//.mapctrl;
                
                $_this.is(":checked") ? current.paintOtherOrganizationTyphTrace(_corg) : _corg.mapctrl.hide();
            });
            //輪播
            $activeRunCB.on('click', function () {
                current.activeRun();
                current._checkNewstCB.prop("checked", false);
                current._checkNewstCB.attr('disabled', $activeRunCB.is(":checked"));
            });
            this._checkNewstCB.on('change', function ()
            {
                if (current._checkNewstCB.is(":checked")) {
                    current._newstInfo = undefined;
                    current.startLoadData();
                }
            });
            
            //顯示、隱存圖層
            $('[type=checkbox][data-dispalylayer]', this.$element).on('click', function () {
                console.log("$(this).is(':checked'):" + $(this).is(':checked'));
                if ($(this).is(':checked')) {
                    current._mapctrl.show();
                    $.each(current.settings.otherForecastOrgs, function () {
                        this.mapctrl.show();
                    });
                }
                else {
                    current._mapctrl.hide();
                    $.each(current.settings.otherForecastOrgs, function () {
                        this.mapctrl.hide();
                    });
                }
            });
            //颱風資訊
            $('.typhinfoctrl', this.$element).on('click', function (evt) {
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
                if (typeof current.settings.source === "string") {
                    $.ajax({
                        url: current.settings.source + "/wsCwbNewestTyphReport",
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        type: "POST",
                    }).done(function (data, dfsd) {
                        if (current._newstInfo == undefined || current._newstInfo.DateTime != data.d.DateTime)
                            current.loadTyphListData();
                        current._newstInfo = data.d;
                        current._typh_timer_flag = setTimeout($.proxy(current.startLoadData, current), 5 * 60 * 1000);
                    }).fail(function () {
                        current._typh_timer_flag = setTimeout($.proxy(current.startLoadData, current), 20 * 1000);
                    });
                }
                else {
                    current.settings.source.newestReportfunc.call(current, function (data) {
                        if (current._newstInfo == undefined || current._newstInfo.DateTime != data.DateTime)
                            current.loadTyphListData();
                        current._newstInfo = data[0];
                        current._typh_timer_flag = setTimeout($.proxy(current.startLoadData, current), 5 * 60 * 1000);
                    });
                }
            }
            else
                current._typh_timer_flag = setTimeout($.proxy(current.startLoadData, current), 10 * 1000);
        },
        //載入清單
        loadTyphListData: function () {
            var current = this;

            current.showBusyIndicator();

            //typhsource.basefunc.call(current, function (data) {
            //    current._paintTyphListCtrlUI.call(current, data);
            //});
            //return;
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
            current._listbox.off('change').on('change', function () {
                current._current_selected_typhid = $('option:selected', current._listbox).attr('data-typhid');
                console.log("颱風編號:" + current._current_selected_typhid );
                //$('[data-typhid]', current._listbox).removeClass('ctrl-ui-select');
               
                if (current._current_selected_typhid == undefined || current._current_selected_typhid=='---') {
                    current._current_warns = [];
                    current.paintTyphTrace();
                    current._mapctrl.paintTyphRadius(undefined);
                    current.hideBusyIndicator();
                    current._infobox.empty();//.selectpicker('refresh');//20180710取消用selectpicker
                    //$("+ div button", current._infobox).attr('title', '無資料').find('span.filter-option').html('無資料');
                }
                else {
                    //$(this).addClass('ctrl-ui-select');
                    current.loadTyphWarnData(current._current_selected_typhid);

                }
            });
            current._infobox.on('change', function () {
                var typhwarninfo = $('option:selected', current._infobox).attr('data-typhinfo');
                $.each(current._current_warns, function (idx, item) {
                    if (typhwarninfo === item.DateTime) {
                        current.changeWarntime(item);
                        return;
                    }
                });
            });
            current._current_typhlists = $.grep(data, function (t) {
                try {
                    return t && t.CName && t.CName != 1521 && t.CName.indexOf("演練") < 0; //有問題資料
                } catch {
                    var ss = t;
                    return false;
                }
            }).reverse();// $.parseJSON(data);
            var _firstflag = true;
            current._listbox.empty();
            current._listbox.prepend('<option class="empty-option" data-typhid="---">請選擇颱風</option>');
            $.each(current._current_typhlists, function (idx, item) {
                if ($.isNumeric(item.No) && (item.No + '').length == 4) { //排除一些測試資料
                   
                    current._listbox.append('<option data-typhid="' + item.No + '">' + item.No + item.CName + '</option>');

                    //current._listbox.selectpicker('val', -1);
                    if (_firstflag) {
                        if (current.settings.autoShowFirstData) {
                            current._listbox.val(item.No + item.CName);
                            //current._listbox.find('option:eq(0)').remove();//20180710取消用selectpicker
                            //current._listbox.selectpicker('val', item.No + item.CName);
                        }
                        else {
                            if ((new Date().getTime() - JsonDateStr2Datetime(current._newstInfo.DateTime).getTime()) / (1000 * 60 * 60) < 4) {
                                current._listbox.val(current._listbox.find('option:eq(1)').text());
                                //current._listbox.find('option:eq(0)').remove();//20180710取消用selectpicker
                                //current._listbox.selectpicker('val', current._listbox.find('option:eq(0)').text());
                            }
                        }
                    }
                    _firstflag = false;
                }
            });
            current._listbox.trigger('change');
            //current._listbox.selectpicker('refresh');//20180710取消用selectpicker
            this.$element.trigger($.typh.eventKeys.load_typh_list_completed, [current._current_typhlists]);
        },
        //載入警報單
        loadTyphWarnData: function (typhid) {
            var current = this;
            current.showBusyIndicator();
            //typhsource.infofunc.call(current, typhid, function (data) {
            //    current._paintTyphWarnCtrlUI.call(current, data);
            //});
            //return;
            if (typeof current.settings.source === "string") {
                $.ajax({
                    //url: 'http://210.59.250.187/SGDS/chart/WS/typh.ashx?typhid=' + typhid
                    url: current.settings.source + "/GetTyphCWBInfo",
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    type: "POST",
                    data: "{inTyphId:'" + typhid + "'}"
                }).done(function (warns) {
                    
                    //if (warns && warns.length > 0 && warns[0].SerialNo != current._current_selected_typhid) {
                    if (typhid != current._current_selected_typhid) {
                        current.hideBusyIndicator();
                        return;
                    }
                    console.log('paint:' + typhid + '>>' + current._current_selected_typhid + ">>" + warns.length);
                    current._paintTyphWarnCtrlUI(warns.d);
                });
            }
            else {
                current.settings.source.infofunc.call(current, typhid, function (data) {
                    if (typhid != current._current_selected_typhid) {
                        current.hideBusyIndicator();
                        return;
                    }
                    current._paintTyphWarnCtrlUI.call(current,data);
                });
            }
            $.each(current.settings.otherForecastOrgs, function () {
                this.warns = undefined;
                this.mapctrl.clearTrace();
                this.typhid = typhid;
                if (current.$element.find('[type=checkbox][data-organization=' + this.name + ']').is(':checked'))
                    current.paintOtherOrganizationTyphTrace(this);
            });
        },
        _paintTyphWarnCtrlUI: function (warns) {
            var current=this;
            //current._current_warns = warns ? warns.reverse() : warns;// $.parseJSON(warns);
            current._current_warns = warns ? warns.sort(function (a, b) {
                return JsonDateStr2Datetime(b.DateTime).getTime() - JsonDateStr2Datetime(a.DateTime).getTime();
            }) : warns;// $.parseJSON(warns);
            //處理最後一報沒預報資料，加入最近有預報資料的預報(預報時間要大於最後一報時間)
            if (current._current_warns.length>0 && (!current._current_warns[0].PredDatas || current._current_warns[0].PredDatas.length == 0)) {
                current._current_warns[0].PredDatas = [];
                $.each(current._current_warns, function () {
                    if (this.PredDatas && this.PredDatas.length > 0) {
                        var ldt = JsonDateStr2Datetime(current._current_warns[0].DateTime);
                        $.each(this.PredDatas, function () {
                            if (JsonDateStr2Datetime(this.DateTime).getTime() > ldt.getTime())
                                current._current_warns[0].PredDatas.push(this);
                        });
                        return false;
                    }
                });
            }
            this.$element.trigger($.typh.eventKeys.typh_infos_change, [current._current_warns]);
            current._infobox.empty();
            current._mapctrl.clearTrace();
            if (warns.length != 0) {
                if (warns.length > 0 && warns[0].Long != 0) {
                    //infobox.destroy();
                    current.paintTyphTrace();
                    $.each(current._current_warns, function (idx, item) {
                        var dts = JsonDateStr2Datetime(item.DateTime);
                        current._infobox.append('<option  data-typhinfo="' + item.DateTime + '">' + dts.DateFormat($.typh.date_time_format_string) + '</option>');
                        
                        if (idx == 0)
                            current._infobox.val(dts.DateFormat($.typh.date_time_format_string));
                        //    current._infobox.selectpicker('val', dts.DateFormat($.typh.date_time_format_string));//20180710取消用selectpicker
                    });
                    current._infobox.trigger('change');
                }
                //current._infobox.selectpicker('refresh');//呼叫refresh新資料才能OK//20180710取消用selectpicker

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
        paintOtherOrganizationTyphTrace: function (_org) {
            var current = this;
            if (!_org.warns) {
                if (!_org.loadInfo) {
                    $.ajax({
                        url: current.settings.source + "/GetTyphInfo",
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        type: "POST",
                        data: "{inTyphId:'" + _org.typhid + "', org:'" + _org.id + "'}"
                    }).done(function (warns) {
                        if (_org.typhid != current._current_selected_typhid) {
                            return;
                        }
                        warns.d = warns ? warns.d.reverse() : warns;
                        _org.mapctrl.paintTyphTrace(warns.d);
                    });
                }
                else {
                    _org.loadInfo.call(current, _org.typhid, function (data) {
                        if (_org.typhid != current._current_selected_typhid) {
                            return;
                        }
                        _org.mapctrl.paintTyphTrace(data);
                    });
                }
            }
            else {
                _org.mapctrl.show();//.paintTyphTrace(tracetemp);
            }
        },
        //時間改變
        changeWarntime: function (warn) {


            if (warn === undefined || warn === this._current_warn_obj)
                return;
            //
            if (this._newstInfo.DateTime != warn.DateTime)
                this._checkNewstCB.prop("checked", false);

            this._current_warn_obj = warn;

            this._infobox.val(JsonDateStr2Datetime( warn.DateTime).DateFormat($.typh.date_time_format_string));//20181015

            this._mapctrl.paintTyphRadius(warn);

            this.$element.trigger($.typh.eventKeys.warn_time_change, [warn, this._checkNewstCB.is(":checked")]);

            //颱風警報單資訊
            this._showWarnMessage(warn);

        },
        setWarntime: function (dt) {
            var current = this;
            if (current._current_warns) {
                $.each(current._current_warns, function (idx, item) {
                    if (JsonDateStr2Datetime(dt).DateFormat($.typh.date_time_format_string) === JsonDateStr2Datetime(item.DateTime).DateFormat($.typh.date_time_format_string)) {
                        current.changeWarntime(item);
                        return;
                    }
                });
            }
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
            _msg += "<tr><td style='vertical-align: top;'>颱風動態:</td><td>" + (warn.CurrPlace ?warn.CurrPlace:"")  + "</td></tr>";
            //_msg += "<tr><td style='vertical-align: top;'>颱風動態:</td><td>根據最新資料顯示，第8號颱風目前中心在宜蘭東方海面，繼續向西北西移動。暴風圈逐漸進入臺灣東北部近海，對彰化以北、花蓮以北及馬祖地區將構成威脅。未來此颱風中心強度有減弱的趨勢。" + warn.CurrPlace + "</td></tr>";
            //_msg += "<tr><td>目前位置:</td><td>" + warn.CurrPlace + "</td></tr>";
            //_msg += "<tr><td>移動方向:</td><td>" + warn.MoveV + "</td></tr>";
            //_msg += "<tr><td>預估座標:</td><td>經-" + warn.PredLat + " 緯-" + warn.PredLong + "</td></tr>";
            //_msg += "<tr><td>預估位置:</td><td>" + warn.PredPlace + "</td></tr>";
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
            var that = this;
            if (this.resetAactiveRunintervalTimerflag)
                clearTimeout(this.resetAactiveRunintervalTimerflag);
            this.resetAactiveRunintervalTimerflag = setTimeout(function () {
                that.settings.activeInterval = interval;
                that.activeRun();
            }, 100);
        },
        typhListDatas: function () {
            return this._current_typhlists;
        },
        typhWarnDatas: function () {
            return this._current_warns;
        },
        showTyph: function (typhid) {
            var _v= this._listbox.find('[data-typhid="' + typhid + '"]').text();
            this._listbox.val(_v).trigger('change');
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
