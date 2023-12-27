(function ($) {
    'use strict';
    var pluginName = 'fsensor';
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = { map: undefined, autoShow: true };
        this.$pinctrl = undefined; //淹水感測點位ctrl
        this.$areactrl = undefined;//淹水推估範圍ctrl
        this._floodAreaImageGroundOverlay = []; //淹水推估ImageOverlay
        this.currentDisplayFlood = [];          //目前顯示淹水感測站
        this.isShowArea = false;
        this.$tooltip = $('<i  data-toggle="tooltip" data-html="true" data-placement="right" data-animation="false" data-trigger="manual" style="position:absolute !important;" />').appendTo('body');
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {

            $.extend(this.settings, options);
            var that = this;
            if (this.settings.autoShow)
                that.initUi();
            else
                this.$element.on($.menuctrl.eventKeys.popu_init_before, function () {
                    that.initUi();
                });
        },
        initUi: function () {
            var that = this;

            var hasFirstRepaintPinCompleted = false;
            this.$pinctrl = $('<div>').appendTo(this.$element).on($.BasePinCtrl.eventKeys.initUICompleted, function () {
                var setPinFilter = function () {
                    setTimeout(function () {
                        var isSensitivity = $sensitivityCk.is(":checked");
                        var _c = $countySelect.countySelect('getCountyName');
                        var _cityCode = _c == datahelper.AllTW ? undefined : $.grep(window.fhyCity, function (c) {
                            return c.Name.zh_TW == _c || c.Name.zh_TW == _c.replace('台', '臺');
                        })[0];
                        var tc = $townSelect.val();
                        that.$pinctrl.PinCtrl('setFilter', function (d) {
                            return (!isSensitivity || (isSensitivity && d.Sensitivity)) &&
                                (tc == 0 ? _cityCode == undefined || d.CityCode == _cityCode.Code : d.TownCode == tc);
                            //return _cityCode == undefined || d.CityCode == _cityCode.Code;
                        });
                    });
                }

                that.$pinctrl.find('.pinswitch').prop('checked', true).trigger('change');
                that.$pinctrl.find('.pinlist').prop('checked', true).trigger('change');
                that.$pinctrl.find('.ctrl').hide();
                //$filterContainer.insertBefore(that.$element.find('.legend'));
                var $filterContainer = $('<div class="row filter-container">').insertBefore(that.$element.find('.legend'));
                
                var $sensitivityCk = $('<div class="col-12"><label><input type="checkbox" class="sensitivity"> 僅呈現高關注因子淹水感測設施</label></div>').appendTo($filterContainer).find('input.sensitivity').on('click', setPinFilter);
                //縣市、鄉鎮篩選
                var $countySelect = $('<div class="col-4">').appendTo($filterContainer).countySelect({ containerTW: true, autoFitBounds: false, showLabel: false }).on($.countySelect.eventKeys.change, function () {
                    var _c = $countySelect.countySelect('getCountyName');
                    var _cityCode = _c == datahelper.AllTW ? undefined : $.grep(window.fhyCity, function (c) {
                        return c.Name.zh_TW == _c || c.Name.zh_TW == _c.replace('台', '臺');
                    })[0];
                    //that.$pinctrl.PinCtrl('setFilter', function (d) {
                    //    return _cityCode == undefined || d.CityCode == _cityCode.Code;
                    //});
                    setPinFilter();

                    //鄉鎮區市
                    $townSelect.empty();
                    $('<option value="0">--</option>').appendTo($townSelect);
                    $townSelect.off('change');

                    if (_cityCode != undefined) {
                        window.datahelper.getFHYTown(_cityCode.Code, function (ts) {
                            $.each(ts, function () {
                                var t = this;
                                $('<option value="' + t.Code + '">' + t.Name.zh_TW + '</option>').appendTo($townSelect);
                            });
                            $townSelect.on('change', function () {
                                setPinFilter();
                                //var tc = $townSelect.val();
                                //if (tc == 0)
                                //    $countySelect.trigger($.countySelect.eventKeys.change);
                                //else {
                                //    that.$pinctrl.PinCtrl('setFilter', function (d) {
                                //        return tc == 0 || d.TownCode == tc;
                                //    });
                                //}
                            });
                        });
                    }
                });
                var $townSelect = $('<div class="col-4"><select class="form-control"></select></div>').appendTo($filterContainer).find('select');
                $('<option value="0">--</option>').appendTo($townSelect);


                $('.search', that.$element).appendTo($('<div class="col-4">').appendTo($filterContainer));

               
            }).on($.BasePinCtrl.eventKeys.afterSetdata, function (e, ds, dds) {
                that.$element.trigger('get-data-complete', [ds]);
            }).on($.BasePinCtrl.eventKeys.repaintPinCompleted, function (e, ds) {
                //重劃淹水推估
                that.currentDisplayFlood = ds;
                that.$areactrl.PolygonCtrl('reload');
                showActivedpin();
            }).on('add-floodarea', function () { //各別淹水感測演算後event
                that.$areactrl.PolygonCtrl('reload');
            });

            var showActivedpin = function (pinctrl, s, sf, z) {
                var plusclass = ' sensitivity-pin';
                $.each(that.$pinctrl.instance.__pinctrl.instance._mapctrl.graphics, function () {
                    var _icon = this.getIcon() || this;//g.getIcon() 20220915加入， 解決_icon.options.iconSize==null(因該新版leafleft問題), pin label位置一直動
                    //_icon.shadowUrl = "http://localhost:54188/Scripts/gis/images/camera.png";
                    var cns = _icon.options.className;//.replace(plusclass);
                    var c = cns.indexOf(plusclass) >= 0;// || this.attributes[sf] == s[sf];
                    cns = cns.replace(plusclass, '');

                    if (this.attributes.Sensitivity != null) {
                        cns += plusclass;
                        //this.setZIndexOffset(window.pinLeafletMaxZIndex++);
                        this.setZIndexOffset(window.pinLeafletMaxZIndex + 100000 );
                        _icon.options.className = cns;
                        this.setIcon(_icon);
                    }
                    //if (c) {
                    //    _icon.options.className = cns;
                    //    this.setIcon(_icon);
                    //}
                })
            }
            
           

            //初始淹水感測站點位
            InitFloodSensor(this.$pinctrl, {pinClick: function (d) {that.$element.trigger('pin-click', [d]);}});

            //淹水推估
            var _floodareaPolygonOption = $.extend({ map: app.map, minZoom: 13 }, floodareaPolygonOption); //13比例尺1公里
            _floodareaPolygonOption.loadInfo = function (dt, callback) {
                var fs = [];
                $.each(that.currentDisplayFlood, function () {
                    if (this.floodarea)
                        fs.push(this.floodarea);
                });
                //疊淹水範圍
                window.paintFloodAreaImageGroundOverlay(that._floodAreaImageGroundOverlay, fs, .95, that.$tooltip);
                that._showArea(that.isShowArea);
                return callback([]);
            };
            this.$areactrl = $('<div>').appendTo(this.$element).PolygonCtrl(_floodareaPolygonOption)
                .on($.BasePinCtrl.eventKeys.initUICompleted, function () {
                    that.$areactrl.find('.pinswitch').prop('checked', true).trigger('change');
                })
                .on($.BasePinCtrl.eventKeys.pinShowChange, function (evt, _isshow) {
                    if (that.isShowArea != _isshow) { //相同情況不處裡
                        that.isShowArea = _isshow;
                        that._showArea(that.isShowArea);
                    }
                }).hide();
        },
        _showArea: function (_s) { //因有設minZoom，需處理是否呈現
            var that = this;
            $.each(this._floodAreaImageGroundOverlay, function () {
                if (_s) {
                    this.addTo(app.map);
                    this.off('click').on('click', function (e) {
                        var fa = this.fdata;
                        //PK_ID == SensorUUID+Date.now()
                        var data = $.grep(that.currentDisplayFlood, function (d) { return fa.NOTIFICATION_Data.PK_ID.indexOf(d.SensorUUID)>=0 })[0];
                            var popup = this.unbindPopup().bindPopup('<div class="leaflet-infowindow-title  status-blue">' + data.SensorName + '</div>' + "<div>" + floodPinOptions.pinInfoContent.call({ settings: floodPinOptions }, fa) + "</div>",
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
                else
                    this.remove();
            });
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