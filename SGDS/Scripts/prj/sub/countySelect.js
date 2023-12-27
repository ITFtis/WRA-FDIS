
(function ($) {
    'use strict';
    var pluginName = 'countySelect';
    $.countySelect = {
        eventKeys: { change: 'county-selectd-change', init_complete: 'init_complete' }
    };
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = { containerTW: false, autoFitBounds: true, showLabel: true };
       
        this.$countySelect = undefined;

        this.lineboundary = undefined;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {

            var current = this;

            $.extend(this.settings, options);
            if (!$.isArray(this.settings.map))
                this.settings.map = [this.settings.map];
            current.initUi();

        },
        initUi: function () {
            var that = this;//.$element;
            if (this.settings.showLabel)
                this.$countySelect = $('<div class="col-md-12"><div class="col-xs-2 pre-label">縣市</div><div class="col-xs-10"><select class="form-control"></select></div></div>').appendTo(this.$element).find('select');
            else
                this.$countySelect = $('<select class="form-control"></select>').appendTo(this.$element);
            //this.$countySelect.on('change', function () {
            //    that.$element.trigger($.countySelect.eventKeys.change, $(this).val());
            //});

            var $_metercontainer = $('<div class="col-md-12 meter">').appendTo(this.$element);
            this.$villagePolygonPin = $('<div class="col-md-12">').appendTo($_metercontainer);
            //初始UI資料
            //
            var _countys = undefined;
            if (app.county) {
                _countys = $.grep(datahelper.loadCountyXY(false), function (_c) {
                    return [app.county].indexOf(_c.CountyName) >= 0 || [app.county].indexOf(_c.PK_ID+"") >= 0;
                });
            }
            if(!_countys) {
                _countys =this.settings.containerTW === true?datahelper.getCountyXYContains0():datahelper.loadCountyXY(false);
            }
            $.each(_countys, function () {
                $('<option value="' + this.PK_ID + '">' + this.CountyName + '</option>').appendTo(that.$countySelect);
            });

            this.$countySelect.change(function () {
                that.$element.trigger($.countySelect.eventKeys.change);
                if (that.settings.autoFitBounds) {
                    //if (that.lineboundary) {
                    //    $.each(that.lineboundary, function () {
                    //        this.clear();
                    //    });
                    //}
                    that.clear();
                    //that.lineboundary = [];
                   
                    $.each(that.settings.map, function () {
                        if (that.$countySelect.val() == 0) {
                            if (this.setOptions) {
                                this.setOptions({
                                    center: app.taiwancenter,
                                    zoom: 8,
                                });
                            } else

                                this.setView(app.taiwancenter, 8)
                        }
                        else {
                            that.lineboundary.push( new window.boundary.LineBoundary({
                                map: this, data: boundary.data.County, ids: [that.$countySelect.find('option:selected').text()],
                                style: {
                                    strokeWeight: 3,
                                    strokeColor: "#ff0000",
                                    icons: [{
                                        icon: {
                                            path: 'M 0,-1 0,1',
                                            strokeOpacity: .8,
                                            scale: 1,
                                            strokeColor: "#ffff00",
                                        },
                                        offset: '0',
                                        repeat: '1px'
                                    }]
                                }, autoFitBounds: true
                            }, function (_boundarydata, _polylines) {

                            }));
                        }
                    });
                }
            });
            if (app.county) this.$countySelect.trigger("change");
        },
        setCounty: function (c) {
            this.$countySelect.val(c);
        },
        getCounty: function () {
            return this.$countySelect.val();
        },
        getCountyName: function () {
            var sd = this.$countySelect.val();
            return this.$countySelect.find('option:selected').text();
        },
        clear: function () {
            if (this.lineboundary) {
                $.each(this.lineboundary, function () {
                    this.clear();
                });
            }
            this.lineboundary = [];
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