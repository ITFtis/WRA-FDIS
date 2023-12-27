/*歷年淹水範圍*/
(function ($) {
    'use strict';
    var pluginName = 'historyFloodArea';

    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element).addClass('history-flood-area');
        this.settings = { map: undefined, pinOptions: undefined, showCount: true };
        this.polygonPinCtrl = [];
        this.colors = ['#8B0000', '#9932CC', '#556B2F', '#2F4F4F', '#FFFAF0', '#228B22', '#FF00FF', '#DAA520', '#4B0082', '#FFF0F5', '#FFFACD', '#F08080', '#FFA07A','#B0C4DE'];
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {

            var that = this;

            $.extend(this.settings, options);

            this.$element.on($.menuctrl.eventKeys.popu_init_before, function (evt) {
                that.initUi();
            });

        },
        initUi: function () {
            var that = this;//.$element;
            helper.misc.showBusyIndicator(that.$element);
            that.groupDatas = {};
            that.eventyears = []; //排序用
            that.eventcolors = {}; //同一事件顏色一樣
            var afterParser = function (layers) {
                //window._rivers = [];
                var cidx = 0;
                var _geojson = layers.toGeoJSON();
                $.each(_geojson.features, function () {
                    var descstr = this.properties.description;
                    if (!that.eventcolors.hasOwnProperty(descstr)) {
                        that.eventcolors[descstr] = that.colors[cidx];
                        cidx++;
                        if (cidx >= that.colors.length) cidx = 0;
                    }
                    var c = that.eventcolors[descstr];
                    var d = $.parserStringToObject(descstr, ";", ":");
                    d.event = d.name;
                    d.year = d.YEAR || d.year;
                    d.geojson = this;
                    //this.paths = this.polygon.getPaths().getArray();
                    //this.geojson = 

                    d.kmlStatus = {
                        strokeOpacity: 1, strokeWeight: 0, fillOpacity: 1,
                        strokeColor: c, fillColor: c
                    };

                    ////new....
                    if (!that.groupDatas.hasOwnProperty(d.year)) {
                        that.groupDatas[d.year] = {};
                        that.eventyears.push(parseInt(d.year));
                    }
                    if (!that.groupDatas[d.year].hasOwnProperty(d.event))
                        that.groupDatas[d.year][d.event] = [];
                    that.groupDatas[d.year][d.event].push(d);
                })

                $('<div style="font-size:1.2em;font-weight:bold;">事件清單</div>').appendTo(that.$element);

                ////new
                var _heads = [], _contents = [];
                //var uidata = {};
                //$.each(doc[0].placemarks, function (idx, _p) {
                //    if (!uidata.hasOwnProperty(_p.year))
                //        uidata[_p.year] = [];
                //    uidata[_p.year].push(_p);
                //});
                var $_eventctrl = $('<div class="accordion-container"></div>').appendTo(that.$element);;
                that.eventyears.sort(function (a, b) { return b - a });
                for (var _i = 0; _i < that.eventyears.length; _i++) {//  _y in that.eventyears) {
                    var _y = that.eventyears[_i];
                    _heads.push(_y);
                    var _eventsstr = []

                    _contents = '<div class="meter"></div>';
                    //_contents.push(_eventsstr.join("<br>"));
                    var $_acc = helper.bootstrap.genBootstrapAccordion($_eventctrl, undefined, undefined, [_y + "年"], ['<div class="meter"></div>']); //每年產一accotdion，避免只能show一年度
                    if (_i != 0)
                        $_acc.find('.panel-collapse.show').removeClass('show');
                    var $_onemeter = $_acc.find('.meter');
                    for (var _desc in that.groupDatas[_y]) {
                        var _ename = _desc;
                        var $_event = $('<div class="row"><div class="col-md-12"></div></div>').appendTo($_onemeter);
                        $_event.PolygonCtrl({
                            map: app.map, name: _ename, useLabel: false, useList: false, clickable: false, year: _y,
                            stTitle: function (d) { return d.event },
                            polyStyles: [],
                            //legendIcons:[],
                            checkDataStatus: function (d) {
                                return d.kmlStatus;
                            },
                            loadInfo: function (dt, callback) {
                                var $_temp = this.$element;
                                var _ds = that.groupDatas[this.settings.year][this.settings.name];
                                if (_ds.length > 1000) { //大量資料，增加等待訊息
                                    helper.misc.showBusyIndicator($_temp);
                                    setTimeout(function () {
                                        callback(_ds);
                                        helper.misc.hideBusyIndicator($_temp);
                                        $_temp.PolygonCtrl('fitBounds');
                                        $_temp[0]._ds = _ds;
                                    });
                                } else {
                                    callback(_ds);
                                    $_temp[0]._ds = _ds;
                                }
                            },
                            loadBase: function (callback) { callback([]) },
                        }).on($.BasePinCtrl.eventKeys.displayLayer, function (evt, s) {
                            if (s && this._ds)
                                $(this).PolygonCtrl('fitBounds');
                        });
                        that.polygonPinCtrl.push($_event);
                    }
                    //_eventsstr.push(_desc + "(" + that.groupDatas[_y][_desc].length + ")");
                }


                $('<div class="btn btn-default glyphicon glyphicon-trash pull-right">清除</div>').appendTo(that.$element).on('click', function () {
                    that.$element.find('.pinswitch:checked').trigger('click');
                });
                var _setOpacity = function (_opacity) {
                    $.each(that.polygonPinCtrl, function () {
                        this.PolygonCtrl('setOpacity', _opacity);
                    });
                };
                var $slider = $('<div style="clear:both;"><div class="col-md-4" style="padding:0;width:50px;">透明度</div><div class="col-md-8 opacity-slider " title="透明度" style="margin-top:6px;width:calc( 100% - 80px );"></div></div>').appendTo(that.$element).find('.opacity-slider').slider({
                    range: "min",
                    max: 100,
                    min: 5,
                    value: 100,
                    slide: function () { _setOpacity($slider.slider("value") / 100); },
                    change: function () { _setOpacity($slider.slider("value") / 100); }
                });

                helper.misc.hideBusyIndicator(that.$element);
            }

            JSZipUtils.getBinaryContent(app.siteRoot + 'kml/歷年淹水範圍.kmz',
                {
                    callback: function (e, data) {
                        try {
                            JSZip.loadAsync(data).then(function (zip) {
                                zip.forEach(function (path, file) {
                                    file.async('string').then(function (ks) {
                                        if (ks.indexOf('<?xml') > 0) {
                                            var s = ks.indexOf('>') + 1;
                                            ks = ks.substr(s);
                                        }

                                        st = Date.now();
                                        afterParser(omnivore.kml.parse(ks));
                                        //var p = omnivore.kml.parse(ks).addTo(app.map).toGeoJSON();
                                    });
                                    return; //預設只處裡一個檔案
                                });
                            });
                        } catch (e) {
                            alert(e);
                        }
                    }
                }
            );

            //var lay = omnivore.kml(app.siteRoot + 'kml/歷年淹水範圍.kmz').on('ready', function () {
            //    afterParser(lay);
            //});
            //geoXml.parse("kml/歷年淹水範圍.kmz");
            //geoXml.parse("kml/1.kml");
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