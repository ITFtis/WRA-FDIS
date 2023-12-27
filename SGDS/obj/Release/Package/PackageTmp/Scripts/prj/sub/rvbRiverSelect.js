
(function ($) {
    'use strict';
    var pluginName = 'rvbRiverSelect';

    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = {  autoFitBounds: true, showLabel: true };
        this.$_container = undefined;
        this.$rvbSelect = undefined;
        this.$riverSelect = undefined;

        this.lineboundary = undefined;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {

            var current = this;

            $.extend(this.settings, options);
            if (!$.isArray(this.settings.map))
                this.settings.map = [this.settings.map];
            //current.initUi();

        },
        initUi: function () {
          
            var that = this;//.$element;
            this.$_container = $('<div class="rvb-river-select-container col-12 row"></div>').appendTo(this.$element); ;
            //if (this.settings.showLabel)
            //    $_temp = $('<div class="col-md-12"><div class="col-xs-2 pre-label">流域</div><div class="col-xs-4"><select class="form-control"></select></div><div class="col-xs-4"><select class="form-control"></select></div></div>').appendTo(this.$element);//.find('select');
            //else
            //    $_temp = $('<select class="form-control col-xs-5"></select><select class="form-control col-xs-7"></select>').appendTo(this.$element);
            if (this.settings.showLabel) {
                this.$_container.addClass('showLabel');
                $('<div class="pre-label">流域</div>').appendTo(this.$_container);
            }
            this.$rvbSelect = $('<div class="col-5"><select class="rvb-select form-control"></div>').appendTo(this.$_container).find('.rvb-select');
            this.$riverSelect = $('<div class="col-7"><select class="river-select form-control"></select></div>').appendTo(this.$_container).find('.river-select');

            //初始UI資料
            //
            this._loadInitRiverSelect();
            return;
            var _countys = undefined;
            if (app.county) {
                _countys = $.grep(datahelper.loadCountyXY(false), function (_c) {
                    return [app.county].indexOf(_c.CountyName) >= 0 || [app.county].indexOf(_c.PK_ID + "") >= 0;
                });
            }
            if (!_countys) {
                _countys = this.settings.containerTW === true ? datahelper.getCountyXYContains0() : datahelper.loadCountyXY(false);
            }
            $.each(_countys, function () {
                $('<option value="' + this.PK_ID + '">' + this.CountyName + '</option>').appendTo(that.$countySelect);
            });

            this.$countySelect.change(function () {
                that.$element.trigger('county-selectd-change');
                if (that.settings.autoFitBounds) {
                    if (that.lineboundary) {
                        $.each(that.lineboundary, function () {
                            this.clear();
                        });
                    }
                    that.lineboundary = [];

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
                            that.lineboundary.push(new window.boundary.LineBoundary({
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
        setVisible: function (b) {
            b ? this.$_container.show() : this.$_container.hide();
        },
        setRvb: function (rvb) {
            rvb = rvb || '全河川局';
            this.$rvbSelect.val(rvb).trigger('change');
        },
        getRvb: function (c) {
            return this.$rvbSelect.val() == '全河川局' ? undefined : this.$rvbSelect.val();
        },
        getRiver: function () {
            return this.$rvbSelect.val() == '全流域' ? undefined : this.$riverSelect.val();
        },
        getSelectBoundPaths: function () {
            return this.getRiver() ? this.$riverSelect.find('>option:selected')[0]._paths : (this.getRvb() ? this.$rvbSelect.find('>option:selected')[0]._rvb.coors:undefined);
        },
        _loadInitRiverSelect : function () {
            var that = this;
            var initRiverUI = function () {
                $.each(window._rvbs, function () {
                    var rvb = this;
                    $('<option>' + this.Name + '</option>').appendTo(that.$rvbSelect)[0]._rvb = rvb;
                });

                that.$rvbSelect.on('change', function () {
                    var rvb = that.$rvbSelect.find('>option:selected')[0]._rvb;
                    that.$riverSelect.empty();
                    $('<option>全流域</option>').appendTo(that.$riverSelect)[0]._paths = rvb.coors ? rvb.coors[0] : undefined;
                    if (rvb.rivers)
                        $.each(rvb.rivers, function () {
                            $('<option>' + this.name + '</option>').appendTo(that.$riverSelect)[0]._paths = this.paths;
                        });
                });
                that.$rvbSelect.trigger("change");
            };
            if (window._rivers) {
                initRiverUI();
            } else {
                window.boundary.helper.GetBoundaryData(boundary.data.RVB, function (bs, sdfc) {
                    //$('<option>' + this.Name + '</option>').appendTo(current.$rvbSelect)[0]._paths = this.paths;
                    window._rvbs = JSON.parse(JSON.stringify(bs));
                    window._rvbs.sort(function (a, b) {
                        return parseInt(a.ID) - parseInt(b.ID);
                    });
                    var afterParser = function (layers) {
                        window._rivers = [];
                        var _geojson = layers.toGeoJSON();
                        $.each(_geojson.features, function () {
                            var _d = $.parserStringToObject(this.properties.description, ";", ":");
                            var _ps = [];
                            if (this.geometry.geometries) { //多polygon
                                $.each(this.geometry.geometries, function () {
                                    _ps.push(this.coordinates[0]);
                                })
                            }
                            else
                                _ps = this.geometry.coordinates[0];
                            //$.each(this.geometry.coordinates[0], function () {
                            //    _ps.push(this);
                            //});
                            window._rivers.push({ rvb: _d.RVB, name: _d.rivername, paths: _ps });
                        });
                        window._rivers.sort(function (a, b) { //排序
                            var xx = a.name - b.name;
                            var xxa = a.name > b.name;
                            return a.name.localeCompare(b.name, "zh-Hant");//IE要用 "zh-TW"
                        });
                        
                        window._rvbs.splice(0, 0, { Name: '全河川局' });
                        $.each(window._rvbs, function () {
                            var rvb = this;
                            if (rvb.coors)
                                rvb['rivers'] = $.grep(window._rivers, function (r) {
                                    return rvb.Name.indexOf(r.rvb[0]) >= 0;
                                });
                        });
                        initRiverUI();
                    }
                    var lay = omnivore.kml(app.siteRoot + 'kml/流域.kml').on('ready', function () {
                        afterParser(lay);
                    });
                });
            }
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