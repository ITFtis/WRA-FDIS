/****************cloud plugin****************/
(function ($) {
    'use strict';
    var pluginName = 'cloud';
    $.cloud = {
        eventKeys: {
            type_change: "cloud_type_change",
            init_ui_completed: "init_ui_completed",
            add_Image_completed: "add_Image_completed",
            opacity_change:'cloud_opacity_change'
        },
        defaultLayerid: "cloudlayer",
        defaultSliderOptions: { value: 90, min: 10, max: 100 },
        defaultSettings: {
            activeInterval: 1000, noDataMaxHours: 6,
            map: null,
            initEvent: null,
            layerId: "cloudlayer",
            iconWidth: 56,
            iconHeight: 50,
            showDisplayDatetime:false,
            getDynamicCloudItem: function (clouditem) {
                return clouditem;
            },
            clouds: [
                {
                    name: "彩色",
                    display: "彩色",
                    items: [
                        { name: "彩色(台灣)", display: "台灣", url: "https://www.cwb.gov.tw/Data/satellite/TWI_IR1_CR_800/TWI_IR1_CR_800-{Y}-{MM}-{dd}-{HH}-{mm}.jpg", xmin: 116.02, ymin: 19.13, xmax: 125.98, ymax: 28.11, frequency: 10, minIcon: "Scripts/gis/ext/cloud/彩色.jpg" },
                        { name: "彩色(東亞)", display: "東亞", url: "https://www.cwb.gov.tw/Data/satellite/LCC_IR1_CR_2750/LCC_IR1_CR_2750-{Y}-{MM}-{dd}-{HH}-{mm}.jpg", ymax: 46.76, ymin: -0.42, xmax: 145.19, xmin: 94, frequency: 10, minIcon: "Scripts/gis/ext/cloud/彩色.jpg" }
                    ]
                },
                {
                    name: "可見光",
                    display: "可見光",
                    items: [
                        { name: "可見光(台灣)", display: "台灣", url: "https://www.cwb.gov.tw/Data/satellite/TWI_VIS_Gray_1350/TWI_VIS_Gray_1350-{Y}-{MM}-{dd}-{HH}-{mm}.jpg", xmin: 116.02, ymin: 19.13, xmax: 125.98, ymax: 28.11, frequency: 10, minIcon: "Scripts/gis/ext/cloud/可見光.jpg" },
                        { name: "可見光(東亞)", display: "東亞", url: "https://www.cwb.gov.tw/Data/satellite/LCC_VIS_Gray_2750/LCC_VIS_Gray_2750-{Y}-{MM}-{dd}-{HH}-{mm}.jpg", ymax: 46.76, ymin: -0.42, xmax: 145.19, xmin: 94, frequency: 10, minIcon: "Scripts/gis/ext/cloud/可見光.jpg" }
                    ]
                },
                {
                    name: "色調強化",
                    display: "色調強化",
                    items: [
                        { name: "色調強化(台灣)", display: "台灣", url: "https://www.cwb.gov.tw/Data/satellite/TWI_IR1_MB_800/TWI_IR1_MB_800-{Y}-{MM}-{dd}-{HH}-{mm}.jpg", xmin: 116.02, ymin: 19.13, xmax: 125.98, ymax: 28.11, frequency: 10, minIcon: "Scripts/gis/ext/cloud/色調強化(紅外線).jpg" },
                        { name: "色調強化(東亞)", display: "東亞", url: "https://www.cwb.gov.tw/Data/satellite/LCC_IR1_MB_2750/LCC_IR1_MB_2750-{Y}-{MM}-{dd}-{HH}-{mm}.jpg", ymax: 46.76, ymin: -0.42, xmax: 145.19, xmin: 94, frequency: 10, minIcon: "Scripts/gis/ext/cloud/色調強化(紅外線).jpg" }
                    ]
                },
                {
                    name: "雷達回波",
                    display: "雷達回波",
                    items: [
                        { name: "雷達回波", display: "雷達回波", url: "https://www.cwb.gov.tw/Data/radar/CV1_TW_3600_{Y}{MM}{dd}{HH}{mm}.png", ymax: 26.45, ymin: 20.48, xmax: 123.98, xmin: 118.01, frequency: 10, minIcon: "Scripts/gis/ext/cloud/雷達迴波(無地形).jpg" }
                    ]
                },
                {
                    name: "累積雨量",
                    display: "累積雨量",
                    items: [
                        //以下是中央氣象局V8版資料來源
                        { name: "今日累積", "display": "今日", "url": "https://www.cwb.gov.tw/Data/rainfall/{Y}-{MM}-{dd}_{HH}{mm}.QZJ8.jpg", "xmin": 119.17, "ymin": 21.48, "xmax": 123.64, "ymax": 25.95, "frequency": 30, minIcon: "Scripts/gis/ext/cloud/累計雨量.jpg" },
                        { name: "昨日累積", "display": "昨日", "url": "https://www.cwb.gov.tw/Data/rainfall/{Y}-{MM}-{dd}_0000.QZJ8.jpg", "xmin": 119.17, "ymin": 21.48, "xmax": 123.64, "ymax": 25.95, "frequency": 30, minIcon: "Scripts/gis/ext/cloud/累計雨量.jpg" },
                        { name: "前日累積", "display": "前日", "url": "https://www.cwb.gov.tw/Data/rainfall/{Y}-{MM}-{dd}_0000.QZJ8.jpg", "xmin": 119.17, "ymin": 21.48, "xmax": 123.64, "ymax": 25.95, "frequency": 30, minIcon: "Scripts/gis/ext/cloud/累計雨量.jpg" },
                    ]
                },
            ]
        }
    };
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.setDatetime = pluginclass.prototype.setDatetime;
        this.onCloudTypeChange = pluginclass.prototype.onCloudTypeChange;
        this.$element = $(element);
        this.settings = $.extend({}, $.cloud.defaultSettings);

        this.map = undefined;
        //Expose public methods

        this._displayDatetime = undefined;
        this._displayCloud = undefined;
        this._imglayer = undefined;
        this.arc_MapImageLayer = undefined;
        this.arc_MapImage = undefined;
        this.arc_Connect = undefined;
        this.isInitCompleted = false;
        this._mapctrl = undefined;

        this._cloud_timer_flag;
    };

    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {

            var current = this;

            $.extend(this.settings, options);
            this.map = this.settings.map;

            if (this.settings.initEvent) {
                this.$element.on(this.settings.initEvent, function () {
                    if (current.isInitCompleted)
                        return;
                    
                    current.resetCouds();
                    console.log(pluginName + ' init');
                    current.isInitCompleted = true;
                });
            }
            else {
                this.resetCouds();

            }
        },
        resetCouds: function () {
            var current = this;
            if (whatMap(current.settings.map) === "google") {
                if (window.GCloud) {
                    current._mapctrl = new GCloud(current, function () { current.initCloud(); });
                }
                else {
                    $.getScript($.AppConfigOptions.script.gispath + "/ext/cloud/GCloud.js", function () {
                        current._mapctrl = new GCloud(current, function () { current.initCloud(); });
                    });
                }
            }
            else if (whatMap(current.settings.map) === "leaflet") {
                if (window.LCloud) {
                    current._mapctrl = new LCloud(current, function () { current.initCloud(); });
                }
                else {
                    $.getScript($.AppConfigOptions.script.gispath + "/ext/cloud/LCloud.js", function () {
                        current._mapctrl = new LCloud(current, function () { current.initCloud(); });
                    });
                }
            }
            else {
                if (window.ACloud) {
                    current._mapctrl = new ACloud(current, function () { current.initCloud(); });
                }
                else {
                    $.getScript($.AppConfigOptions.script.gispath + "/ext/cloud/ACloud.js", function () {
                        current._mapctrl = new ACloud(current, function () { current.initCloud(); });
                    });
                }
            }
            console.log(pluginName + ' init');
        },
        initUi: function () {
            var current = this;
            current.$element.empty();
            try {
                $.each(this.settings.clouds, function (idx, item) {
                    var gdom = $('<div class="cloud-group col-xs-12 col-12 row auto-append-header" data-header=' + item.display + '></div>');//ie color會被override掉(所以加style),hover也不work
                    //var gdom = $('<div class="cloud-group col-xs-12 col-12 auto-append-header" data-header=' + item.name + '></div>');//ie color會被override掉(所以加style),hover也不work
                    $.each(item.items, function (idx, citem) {

                        if (!citem)
                            return;
                        if (item.items.length === 4)
                            var sdfsdf = "";
                        var dom;
                        if (citem.minIcon)
                            dom = $('<div class="col-xs-' + (item.items.length === 1 ? 12 : 6) +' col-' + (item.items.length === 1 ? 12 : 6) + '" title="' + citem.display + '" ><div  class="cloud color-base " data-name="' + citem.name + '" >' +
                                ' <img src="' + citem.minIcon + '" class="cloud" style="width:' + current.settings.iconWidth + 'px;height:' + current.settings.iconHeight + 'px;" ><span class="cloud-name">' + citem.display + '</span></img></div></div>');
                        else
                            dom = $('<div class="col-xs-' + (item.items.length === 1 ? 12 : 6) + '  col" ><label class="color-base" style="margin-top:0px;margin-bottom:4px;cursor:pointer;" ><input name="cloudgroup" type="radio" value="' + citem.name + '"/>' + citem.display + '</label></div>');
                        gdom.append(dom);
                    });
                    current.$element.append(gdom);
                });
            } catch (ex) {
                var sdfsd = "";
            }
            //this._msgDom = $('<div class ="col-xs-12 col-sm-12 msgDom" style="color:gray;"></div>');
            //this.$element.append(this._msgDom);
            
            var _ctrlDom = $('<div class="cloud-opacity-ctrl-header row col-xs-12 col-12 auto-append-header" data-header="圖層控制"></div>');
            //var _oslider = $('<div class="col-xs-12 col-12" style="padding-left:30px;"></div>');
            var _oslider = $('<div class="col-xs-12 col-12"></div>');
            _ctrlDom.append(_oslider);
            _oslider.gis_layer_opacity_slider($.extend( {
                map: this.map, layerid: this.settings.layerId, setOpacity: function (_opcity) {
                    if (current._mapctrl.setOpacity) current._mapctrl.setOpacity(_opcity);
                    current.$element.trigger($.cloud.eventKeys.opacity_change, _opcity);
                    current.fireEvent($.cloud.eventKeys.opacity_change, _opcity);
                }
            }, this.settings.defaultSliderOptions));

            this.$element.append(_ctrlDom);

            this._msgDom = $('<div class ="col-xs-12 col-12 msgDom cloud-msg" style="color:gray;"></div>').appendTo(this.$element);

            var _msjjjsgDom = $('<div class ="col-xs-12 col-12" style="display:none" ><input type="checkbox" checked="true" class="real_time_ctrl">即時資料</div>');
            this.$element.append(_msjjjsgDom);

           
        },
      
        initCloud: function () {
            this.initUi();
            var current = this;
          
            current._mapctrl.initLayer();

            this.setDatetime(new Date(), true);

            $('div.cloud', this.$element).click(function () {
                var cname = $(this).attr("data-name");
                $('div.cloud[data-name!="' + cname + '"]', current.$element).removeClass("checked");
                current._displayCloud = undefined;

                var _coludTemp = undefined;

                $.each(current.settings.clouds, function (idx, item) {
                    $.each(item.items, function (cidx, citem) {
                        if (citem.name === cname) {
                            _coludTemp = citem;// current.settings.getDynamicCloudItem(citem);
                            return;
                        }
                    });
                });

                $(this).toggleClass("checked");
                if ($(this).hasClass("checked")) {
                    current._mapctrl.show();
                   
                    current.$element.show_busyIndicator();
                    if (current.settings.getDynamicCloudItem.length == 2) {
                        current.settings.getDynamicCloudItem(_coludTemp, function (_c) {
                            current._displayCloud = _c;
                            current.showCloud(current.getDatetime(), new Date(current.getDatetime() + ""));
                        });
                    } else {
                        current._displayCloud = current.settings.getDynamicCloudItem(_coludTemp);;
                        current.showCloud(current.getDatetime(), new Date(current.getDatetime() + ""));
                    }
                    
                   
                } else
                    current._mapctrl.hide();

                current.$element.trigger($.cloud.eventKeys.type_change, [_coludTemp, $(this).hasClass("checked")]);
                current.fireEvent($.cloud.eventKeys.type_change, [_coludTemp, $(this).hasClass("checked")]);
            });
            
            this.$element.find(".real_time_ctrl").click(function (evt) {
                current.setDatetime(new Date(), $(evt.target).is( ":checked" ));
            });
            this.$element.trigger($.cloud.eventKeys.init_ui_completed);
        },
        setDatetime: function (dt, isRealtime) {
            this._displayCloud = this._displayCloud ? this.settings.getDynamicCloudItem(this._displayCloud) : undefined
            var current = this;
            clearTimeout(this._cloud_timer_flag);
            this._displayDatetime = isRealtime ? new Date() : new Date(dt + "");
            this.$element.find(".real_time_ctrl").prop("checked", isRealtime ? true : false);
            if (!isRealtime) {
                this.$element.find(".real_time_ctrl").parent().show();
            }
            else {
                this._cloud_timer_flag=setTimeout(function () {
                    current.setDatetime(new Date(), true);
                }, 5*60*1000);
            }
            this.showCloud(this._displayDatetime, new Date(this._displayDatetime + "")); //用new Date是為了複製另一實體
        },
        getDatetime: function () {
            return this._displayDatetime;
        },
        showCloud: function (orgdt, displaydt) {
            var pad = function (number, length) {
                var str = '' + number;
                while (str.length < length) {
                    str = '0' + str;
                }

                return str;

            };
            var current = this;

            if (this._displayCloud === undefined ) {
                this._mapctrl.removeAllImages();
                this.$element.hide_busyIndicator();
                return;
            }
            var diff = (orgdt - displaydt);

            if (diff > 1000 * 60 * 60 * this.settings.noDataMaxHours) { //大於6小時沒資料

                this.$element.hide_busyIndicator();
                var saada = $('.msgDom', this.$element);
                this._msgDom.html(this.settings.noDataMaxHours + '小時內都無' + this._displayCloud.display + '資料!!');

                this._mapctrl.removeAllImages();
                current.$element.trigger($.cloud.eventKeys.add_Image_completed, { sucess: false, cloud: current._displayCloud, queryDt: orgdt, displayDT: displaydt });
                return;
            }

            var _year = displaydt.getFullYear();
            var _month = displaydt.getMonth() + 1;
            var _date = displaydt.getDate();
            var _hour = displaydt.getHours();
            var _minute = displaydt.getMinutes() - (displaydt.getMinutes() % this._displayCloud.frequency);
            var url = this._displayCloud.url;
            url = url.replace(/\{Y}/g, _year);
            url = url.replace(/\{M}/g, _month);
            url = url.replace(/\{MM}/g, pad(_month, 2));
            url = url.replace(/\{d}/g, _date);
            url = url.replace(/\{dd}/g, pad(_date, 2));
            url = url.replace(/\{H}/g, _hour);
            url = url.replace(/\{HH}/g, pad(_hour, 2));
            url = url.replace(/\{m}/g, _minute);
            url = url.replace(/\{mm}/g, pad(_minute, 2));
            if (url == this._displayCloud.url) {
                    url += (url.indexOf("?")>=0? "&":"?") + helper.misc.geguid();
            }

            var img = new Image();
            img.onload = function (res) {
                current._mapctrl.addImages(current._displayCloud, url);
               

                current.$element.hide_busyIndicator();
                current._msgDom.html(current.settings.showDisplayDatetime ? "資料時間:" + displaydt.DateFormat('MM/dd HH:mm') : '');
                current.$element.trigger($.cloud.eventKeys.add_Image_completed, { sucess: true, cloud: current._displayCloud, queryDt: orgdt, displayDT: displaydt });

            };
            img.onerror = function (res) {
                console.log(url + "無資料(" + orgdt + ")");
                displaydt.setMinutes(displaydt.getMinutes() - current._displayCloud.frequency);
                current.showCloud(orgdt, displaydt);
            };
            img.src = url;
        },
        onCloudTypeChange: function (func) {
            if (this._listeners === undefined)
                this._listeners = {};

            if (this._listeners[$.cloud.eventKeys.type_change] === undefined)
                this._listeners[$.cloud.eventKeys.type_change] = [];

            this._listeners[$.cloud.eventKeys.type_change].push(func);
        },
        fireEvent: function (etype, ctype) {
            var current = this;
            if (this._listeners !== undefined && this._listeners[etype] !== undefined) {
                $.each(this._listeners[etype], function (idx, func) {
                    func.call(current, ctype);
                });
            }
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