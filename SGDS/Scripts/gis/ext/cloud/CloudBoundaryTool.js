/****************cloud plugin****************/
(function ($) {
    'use strict';
    var pluginName = 'cloudBoundaryTool';
   
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.setDatetime = pluginclass.prototype.setDatetime;
        this.onCloudTypeChange = pluginclass.prototype.onCloudTypeChange;
        this.$element = $(element);
        this.settings = $.extend({xmin:90, xmax:160, ymin:10, ymax:36}, $.cloud.defaultSettings);

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
            this._displayCloud = this.settings.cloud;
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
            //try {
            //    $.each(this.settings.clouds, function (idx, item) {
            //        var gdom = $('<div class="cloud-group col-xs-12 row auto-append-header" data-header=' + item.name + '></div>');//ie color會被override掉(所以加style),hover也不work
            //        $.each(item.items, function (idx, citem) {

            //            if (!citem)
            //                return;
            //            if (item.items.length === 4)
            //                var sdfsdf = "";
            //            var dom;
            //            if (citem.minIcon)
            //                dom = $('<div class="col-xs-' + (item.items.length === 1 ? 12 : 6) + ' col-' + (item.items.length === 1 ? 12 : 6) + '" title="' + citem.name + '" ><div  class="cloud color-base " data-name="' + citem.name + '" >' +
            //                    ' <img src="' + citem.minIcon + '" class="cloud" style="width:' + current.settings.iconWidth + 'px;height:' + current.settings.iconHeight + 'px;" ><span class="cloud-name">' + citem.display + '</span></img></div></div>');
            //            else
            //                dom = $('<div class="col-xs-' + (item.items.length === 1 ? 12 : 6) + '  col" ><label class="color-base" style="margin-top:0px;margin-bottom:4px;cursor:pointer;" ><input name="cloudgroup" type="radio" value="' + citem.name + '"/>' + citem.display + '</label></div>');
            //            gdom.append(dom);
            //        });
            //        current.$element.append(gdom);
            //    });
            //} catch (ex) {
            //    var sdfsd = "";
            //}
            var _timeflag;
            var genslider = function ($c, $v, v, vmax, vmin) {
                var chv = function () {
                    $v.val($c.slider("value") / 10000);
                    if (_timeflag)
                        clearTimeout(_timeflag);
                    _timeflag = setTimeout(function () {
                        current.$resetBtn.trigger('click');
                        //current.setDatetime(new Date(), true);
                    }, 100);
                }

                $c.slider({
                    range: 'min',
                    step:100,
                    max: vmax*10000,
                    min: vmin*10000,
                    value: v*10000,
                    slide: chv,
                    change: chv
                });
                chv();
                //$v.val($c.slider("value") / 10000);
            }

            this._topleftXDom = $('<div class ="col-xs-12 col-sm-12 msgDom" style="color:gray;">左上X:<input type="text" class="coors-input form-control"></div>').appendTo(this.$element).find('input').val(this._displayCloud.xmin);
            genslider($('<div class ="col-xs-12 col-sm-12"></div>').appendTo(this.$element), this._topleftXDom, this._displayCloud.xmin, this.settings.xmax, this.settings.xmin);
            this._topleftYDom = $('<div class ="col-xs-12 col-sm-12 msgDom" style="color:gray;">左上Y:<input type="text" class="coors-input form-control"></div>').appendTo(this.$element).find('input').val(this._displayCloud.ymax);
            genslider($('<div class ="col-xs-12 col-sm-12"></div>').appendTo(this.$element), this._topleftYDom, this._displayCloud.ymax, this.settings.ymax, this.settings.ymin);
            this._bottomrightXDom = $('<div class ="col-xs-12 col-sm-12 msgDom" style="color:gray;">右下X:<input type="text" class="coors-input form-control"></div>').appendTo(this.$element).find('input').val(this._displayCloud.xmax);
            genslider($('<div class ="col-xs-12 col-sm-12"></div>').appendTo(this.$element), this._bottomrightXDom, this._displayCloud.xmax, this.settings.xmax, this.settings.xmin);
            this._bottomrightYDom = $('<div class ="col-xs-12 col-sm-12 msgDom" style="color:gray;">右下Y:<input type="text" class="coors-input form-control"></div>').appendTo(this.$element).find('input').val(this._displayCloud.ymin);
            genslider($('<div class ="col-xs-12 col-sm-12"></div>').appendTo(this.$element), this._bottomrightYDom, this._displayCloud.ymin, this.settings.ymax, this.settings.ymin);

            this.$resetBtn = $('<div class ="col-xs-12 col-sm-12 btn btn-info" >重劃右下Y</div>').appendTo(this.$element);

            //this.$element.find('.coors-input').on('change', function () {
            this.$resetBtn.on('click', function () {
                current._displayCloud.xmin = parseFloat(current._topleftXDom.val());
                current._displayCloud.ymax = parseFloat(current._topleftYDom.val());
                current._displayCloud.xmax = parseFloat(current._bottomrightXDom.val());
                current._displayCloud.ymin = parseFloat(current._bottomrightYDom.val());
                _msjjjsgDom.text(JSON.stringify(current._displayCloud));
                current.setDatetime(new Date(), true);
            });


            this._msgDom = $('<div class ="col-xs-12 col-sm-12 msgDom" style="color:gray;"></div>');
            this.$element.append(this._msgDom);

            var _ctrlDom = $('<div class="col-xs-12 col-sm-12 auto-append-header" data-header="圖層控制"></div>')
            var _oslider = $('<div class="col-xs-12 col-sm-12" style="padding-left:30px;"></div>');
            _ctrlDom.append(_oslider);
            _oslider.gis_layer_opacity_slider({
                map: this.map, layerid: this.settings.layerId, value: 90, setOpacity: function (_opcity) {
                    if (current._mapctrl.setOpacity) current._mapctrl.setOpacity(_opcity);
                }
            });

            this.$element.append(_ctrlDom);

            var _msjjjsgDom = $('<div class ="col-xs-12"></div>');
            this.$element.append(_msjjjsgDom);
        },

        initCloud: function () {
            this.initUi();
            var current = this;

            current._mapctrl.initLayer();

            //this.setDatetime(new Date(), true);

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
                    current._displayCloud = current.settings.getDynamicCloudItem(_coludTemp);;
                    current.showCloud(current.getDatetime(), new Date(current.getDatetime() + ""));


                } else
                    current._mapctrl.hide();

                current.$element.trigger($.cloud.eventKeys.type_change, [_coludTemp, $(this).hasClass("checked")]);
                current.fireEvent($.cloud.eventKeys.type_change, [_coludTemp, $(this).hasClass("checked")]);
            });
            //this.$resetBtn.trigger('click');
            //this.$element.find(".real_time_ctrl").click(function (evt) {
                //current.setDatetime(new Date(),true);
            //});
        },
        setDatetime: function (dt, isRealtime) {
            var current = this;
            clearTimeout(this._cloud_timer_flag);
            this._displayDatetime = isRealtime ? new Date() : new Date(dt + "");
            this.$element.find(".real_time_ctrl").prop("checked", isRealtime ? true : false);
            if (!isRealtime) {
                this.$element.find(".real_time_ctrl").parent().show();
            }
            else {
                this._cloud_timer_flag = setTimeout(function () {
                    current.setDatetime(new Date(), true);
                }, 5 * 60 * 1000);
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

            if (this._displayCloud === undefined) {
                this._mapctrl.removeAllImages();
                return;
            }
            var diff = (orgdt - displaydt);

            if (diff > 1000 * 60 * 60 * this.settings.noDataMaxHours) { //大於6小時沒資料

                this.$element.hide_busyIndicator();
                var saada = $('.msgDom', this.$element);
                this._msgDom.html(this.settings.noDataMaxHours + '小時內都無' + this._displayCloud.name + '資料!!');

                this._mapctrl.removeAllImages();
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
            //if (url == this._displayCloud.url) {
            //    url += (url.indexOf("?") >= 0 ? "&" : "?") + helper.misc.geguid();
            //}

            var img = new Image();
            img.onload = function (res) {
                current._mapctrl.addImages(current._displayCloud, url);


                current.$element.hide_busyIndicator();
                current._msgDom.html('');

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