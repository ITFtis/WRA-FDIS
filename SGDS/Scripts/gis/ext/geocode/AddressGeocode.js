
(function ($) {
    'use strict';

    $.addressGeocode = {
        eventKeys: { select_change: "address-select-change", double_click_function_change: "double_click_function_change", ui_init_completed: "ui_init_completed" }
    };


    var pluginName = 'addressGeocode';

    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);


        this.settings = { map: undefined };
        this.map = undefined;

        this.$_addressInput = undefined;
        this.$_queryBtn = undefined;
        this.$_addressSelect = undefined;
        this.$_doubleClickCB = undefined;

        this._mapctrl = null;
        //this.geocoder = new google.maps.Geocoder();
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {

            var current = this;

            $.extend(this.settings, options);
            this.map = this.settings.map;

            if (whatMap(current.settings.map) === "google") {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/geocode/GAddressGeocode.js", function () {
                    current._mapctrl = new GAddressGeocode(current, function () { current.initUi(); });
                });
            }
            else if (whatMap(current.settings.map) === "leaflet") {
                if (window.LAddressGeocode)
                    current._mapctrl = new LAddressGeocode(current, function () { current.initUi(); });
                else {
                    $.getScript($.AppConfigOptions.script.gispath + "/ext/geocode/LAddressGeocode.js", function () {
                        current._mapctrl = new LAddressGeocode(current, function () { current.initUi(); });
                    });
                }
            }
            else {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/geocode/AAddressGeocode.js", function () {
                    current._mapctrl = new AAddressGeocode(current, function () { current.initUi(); });
                });
            }

        },
        initUi: function () {
            var current = this;//.$element;
            var $_ctrl = $('<div class="address-geocode google-geocode-ext">').appendTo(current.$element);
            var _guid = helper.misc.geguid();
            this.$_addressInput = $('<div class="input-group "><input type="text" class="form-control" placeholder="輸入地址"/><span class="input-group-addon btn">' +
                '<span class="glyphicon glyphicon-map-marker " title="定位"></span></span></div>').appendTo($_ctrl).find('input');
            this.$_queryBtn = this.$_addressInput.find('+ span ');

            this.$_addressSelect = $('<select id="c_' + _guid + '" class="form-control collapse form-select">').appendTo($_ctrl);

            this.$_doubleClickCB = $('<label class="double-click-position"><input type="checkbox">開啟地圖上雙擊左鍵自動地址定位功能</label>').appendTo($_ctrl).find('input');

            this.$_queryBtn.on('click', function () {
                if (current.$_doubleClickCB.is(':checked'))
                    return;
                if (!current.$_addressInput.val().trim()) {
                    alert('地址不能為空!!');
                    return;
                }
                helper.misc.showBusyIndicator(current.$element);
                current._mapctrl.findAddressGeocode(current.$_addressInput.val().trim(), function (results, status) {
                    current._initAddressSelect({ results: results, status: status });
                    helper.misc.hideBusyIndicator(current.$element);
                });
                current.setMarkerDraggable(true);
            });
            var _isFromChangeLocaltion = false;
            current.$_addressSelect.on('change', function () {
                var _geocode = current.$_addressSelect.find('option:selected')[0].geocode;
                current.$_addressInput.val(_geocode.formatted_address);
                //console.log(JSON.stringify(_geocode));
                if (_geocode.geometry) {
                    current.$element.trigger($.addressGeocode.eventKeys.select_change, [_geocode.geometry.location, _geocode]);
                    var _lng = $.isFunction(_geocode.geometry.location.lng) ? _geocode.geometry.location.lng() : _geocode.geometry.location.lng;
                    var _lat = $.isFunction(_geocode.geometry.location.lat) ? _geocode.geometry.location.lat() : _geocode.geometry.location.lat;
                    current._mapctrl.setlocation(_lng, _lat, _geocode.formatted_address);
                    if (!_isFromChangeLocaltion)
                        current._mapctrl.panTo(_lng, _lat, current.map.getZoom() < 16 ? 16 : current.map.getZoom());
                    _isFromChangeLocaltion = false;
                }
                else {
                    current._mapctrl.findAddressGeocode(_geocode, function (_result) { //leaflet _geocode has magicKey
                        current.$element.trigger($.addressGeocode.eventKeys.select_change, [_geocode.geometry.location, _geocode]);
                        var _lng = $.isFunction(_geocode.geometry.location.lng) ? _geocode.geometry.location.lng() : _geocode.geometry.location.lng;
                        var _lat = $.isFunction(_geocode.geometry.location.lat) ? _geocode.geometry.location.lat() : _geocode.geometry.location.lat;
                        current._mapctrl.setlocation(_lng, _lat, _geocode.formatted_address);
                        if (!_isFromChangeLocaltion)
                            current._mapctrl.panTo(_lng, _lat, current.map.getZoom() < 16 ? 16 : current.map.getZoom());
                        _isFromChangeLocaltion = false;
                    });
                }
                
            });

            //change location
            current.$element.on('_change_localtion', function (ev, x, y) {
                _isFromChangeLocaltion = true;
                //current._showAddressSelect(false);
                //current.$_addressSelect.removeClass('offdisplay');
                //console.log('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + y + ',' + x + '&language=zh-TW&region=tss');
                helper.misc.showBusyIndicator(current.$element);
                //$.ajax({
                //    url: encodeURI('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + y + ',' + x + '&language=zh-TW'),
                //}).done(function (dat, status) {
                //    _isFromChangeLocaltion = true;
                //    //console.log(JSON.stringify(dat));
                //    current._initAddressSelect(dat, x, y);
                   
                //    helper.misc.hideBusyIndicator(current.$element);
                //}).fail(function (dat, status) {
                //    alert("定位失敗!");
                //    helper.misc.hideBusyIndicator(current.$element);
                //});

                current._mapctrl.reverseGeocode(x, y, function (results, status) {
                    if (status == 'OK')
                        current._initAddressSelect({ results: results, status: status }, x, y);
                    else
                        alert("定位失敗: " + status);
                    helper.misc.hideBusyIndicator(current.$element);
                })

                ////////////current.geocoder.geocode({ 'location':{lat: y, lng: x}, region: 'zh-TW' }, function (results, status) {
                ////////////    if (status == google.maps.GeocoderStatus.OK) {
                ////////////        current._initAddressSelect({ results: results, status: status }, x,y);
                ////////////        helper.misc.hideBusyIndicator(current.$element);
                ////////////    } else {
                ////////////        alert("定位失敗: " + status);
                ////////////    }
                ////////////});
            });
            //啟動雙擊功能
            this.$_doubleClickCB.change(function () {
                var _ckecked = current.$_doubleClickCB.is(':checked');
                current.$_addressInput.attr('disabled', _ckecked?true:false);
                current.$_queryBtn.attr('disabled', _ckecked ? true : false);

                current._mapctrl.setDoubleClick(_ckecked);
                
                current._showAddressSelect(false);

                current.setMarkerDraggable(true);
                current.$element.trigger($.addressGeocode.eventKeys.double_click_function_change, [_ckecked])
            });

            //input enter keydown
            this.$_addressInput.keydown(function (e) {
                if (e.keyCode == 13)
                    current.$_queryBtn.trigger("click");
                current._mapctrl.clear();
                current._showAddressSelect(false);
            });
            this.$element.trigger($.addressGeocode.eventKeys.ui_init_completed);
        },
        disableMapDoubleClick: function () {
            if (this.$_doubleClickCB.is(':checked'))
                this.$_doubleClickCB.prop('checked', false).trigger('change');
        },
        setMarkerDraggable: function (_draggable) {
            this._mapctrl.setMarkerDraggable(_draggable);
        },
        clear: function () {
            if (this._mapctrl) {
                this._mapctrl.clear();
                this.$_addressInput.val('');
            }
        },
        _initAddressSelect: function (_georesult, _ox,_oy) {
            var current = this;
            if (_georesult.status == 'OK') {
                this.$_addressSelect.empty();
                var _address = [];
                $.each(_georesult.results, function () {
                    //console.log(this.formatted_address.indexOf('日本') + '<>' + (this.formatted_address.length - 2));
                    if (this.formatted_address.length > 2 && this.formatted_address.indexOf('日本') == this.formatted_address.length - 2) {
                        //console.log('日本');
                        return;
                    }
                    if (_address.indexOf(this.formatted_address) >= 0)
                        return;
                    _address.push(this.formatted_address);
                    var $_op = $('<option value="' + this.place_id + '">' + this.formatted_address + '</option>').appendTo(current.$_addressSelect);
                    $_op[0].geocode = this;
                    if (_ox) { //反向地理編碼查詢，點位並非查詢原始_ox、_oy，所以避免點擊點位有移動以_ox、_oy取代
                        this.geometry.location.lng = _ox;
                        this.geometry.location.lat = _oy;
                        return false;
                    }
                });

                this._showAddressSelect(_address.length>1);

                this.$_addressSelect[0].selectedIndex = 0;
                if (this.$_addressSelect.find('option').length>0)
                    this.$_addressSelect.trigger('change');
            } else if (_georesult.status == 'ZERO_RESULTS') {
                alert('查無地址資料!');
            }
            else
                alert(_georesult.status);
        },
        _showAddressSelect: function (_show) {
            if(_show)
                this.$_addressSelect.addClass('in show');//.collapse('show');
            else
                this.$_addressSelect.removeClass('in show');//.collapse('hide');
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