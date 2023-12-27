/*****google WebTileLayer*****/
//呼叫前要設map.basemap或給一個WebTile
//WMSLayer 和 WebTiledLayer 共存，要先加入WebTiledLayeru要放在下層才能work
(function ($) {
    'use strict';

    $.MapBaseLayer= {
        events: {
            initUICompleted:'~~MapBaseLayer_initUICompleted'
        }
    }

    var pluginName = 'MapBaseLayer'
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this._mapctrl = undefined;
        if (!element.twwmts) {
            this.settings = $.extend({}, $.MapBaseLayerDefaultSettings);//.defaultSettings);
        }
        else
            this.settings = {};
        //Expose public methods
        //this.arc_WebTiledLayer = undefined;
        this.isInitCompleted = false;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);
            if (!this.settings.ctrlMode) this.settings.ctrlMode = "radio";
            var current = this;
            if (this.settings.initEvent) {
                this.$element.on(this.settings.initEvent, function () {
                    if (current.isInitCompleted)
                        return;
                    current.intiMapCtrl();
                    current.isInitCompleted = true;
                });
            }
            else
                this.intiMapCtrl();
        },
        intiMapCtrl: function () {
            var current = this;
            if (whatMap(this.settings.map) === "google") {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/baselayer/GMapBaseLayer.js", function () {
                    current._mapctrl = new GMapBaseLayer(current, function () { current.initUI(); });
                });
            }
            else if (whatMap(this.settings.map) === "leaflet") {
                if (window.LMapBaseLayer)
                    current._mapctrl = new LMapBaseLayer(current, function () { current.initUI(); });
                else {
                    $.getScript($.AppConfigOptions.script.gispath + "/ext/baselayer/LMapBaseLayer.js", function () {
                        current._mapctrl = new LMapBaseLayer(current, function () { current.initUI(); });
                    });
                }
            }
            else {
                if (window.AMapBaseLayer)
                    current._mapctrl = new AMapBaseLayer(current, function () { current.initUI(); });
                else {
                    $.getScript($.AppConfigOptions.script.gispath + "/ext/baselayer/AMapBaseLayer.js", function () {
                        current._mapctrl = new AMapBaseLayer(current, function () { current.initUI(); });
                    });
                }
            }
            var asdas = this;
        },
        initUI: function () {
            var current = this;
            var uicontentstr = '<div class="mapbaselayer ' + (this.settings.classes ? this.settings.classes : +'')+'"><div class="btn-group" data-toggle="buttons">';
            //var uicontentstr = '<div class="mapbaselayer"><div class="btn-group" data-toggle="buttons">';

            //$.each($.MapBaseLayerDefaultSettings.tiles, function (k, val) {
            $.each(this.settings.tiles, function (k, val) {
                if (!this)
                    return;
                var _html;
                if (val.groupTiles) {
                    _html = '<div class="btn-group"><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" data-bs-toggle="dropdown">'+val.name+'<span class="caret"></span></button>'+
                        '<ul class="dropdown-menu" role="menu">'
                    $.each(val.groupTiles, function () {
                        _html += '<li><a href="#" class="dropdown-item" data-gtype="' + this.name + '">' + this.name + '</a></li>';
                    });
                    _html += '</ul></div>';

                } else {
                    _html = '<label class="btn btn-primary" data-gtype="' + val.name + '">' +// val.name +
                                        '<input type="' + current.settings.ctrlMode + '" name="tiles_options" > ' + val.name +
                                     '</label>';
                }
                uicontentstr += _html;
            });
            
            uicontentstr += '</div></div>';
            
            this.$element.append(uicontentstr);

            var _ctrls = $('[data-gtype]', this.$element);
            if (!this.settings.fromTWWMTS)
                _ctrls.first().addClass('active');
            if (current.settings.defaultLayer) {
                _ctrls.removeClass('active');
                $.each(_ctrls, function () {
                    if ($(this).data("gtype") == current.settings.defaultLayer)
                        $(this).addClass('active');
                });//.first().addClass('active');
                current.reset();
            }
            
            _ctrls.off('click').on('click', function (ev) {

                var _name = $(ev.target).attr("data-gtype");
                
                console.log(_name + '' + $(this).hasClass('active'));
                if (!_name)
                    return;
                if (current._getTileByName(_name).plusin )
                {
                    current._getTileByName(_name).plusin(ev);
                    return;
                }
                var bb = $(this).hasClass('active');
                if ("checkbox" != current.settings.ctrlMode && bb) {
                    return;
                }
                _ctrls.removeClass("active");
                var sdfsf = this;
                //alert(bootstrap.Button.VERSION);
                if ("checkbox" == current.settings.ctrlMode) { //checkbox
                   
                    if (this.localName == "a") {
                        if (bb)
                            $(this).removeClass('active');
                        else
                            $(this).addClass('active');
                    }
                    else {
                        if (bb)
                            $(this).addClass('active');
                    }
                } else { //radio
                    if (this.localName == "a") 
                        $(this).addClass('active');
                }
                //if(this.localName=="a")
                //    $(this).toggleClass('active');
                //else if ("checkbox" == current.settings.ctrlMode)
                //    $(this).removeClass('active');
                if (window.bootstrap && bootstrap.Button && bootstrap.Button.VERSION.indexOf('5')>=0) { //bootstrap5不會自動新增active class
                    if ("checkbox" != current.settings.ctrlMode && this.localName == 'label') {
                        $(this).addClass('active');
                    }
                }
                setTimeout(function () { current.reset(); }, 1)
                
            });

            this.$element.trigger($.MapBaseLayer.events.initUICompleted);
        },
        setDisplayLayer: function (_name) {
            $('[data-gtype=' + _name + ']', this.$element).trigger("click");
        },
        _getTileByName: function (name) {
            var _tile;
            $.each(this.settings.tiles, function (k, val) {
                if (!this)
                    return;
                if (val.groupTiles) {
                    $.each(val.groupTiles, function () {
                        if (this.name === name) {
                            _tile = this;
                            return true;
                        }
                    });
                }
                else {
                    if (val.name === name) {
                        _tile = val;
                        return true;
                    }
                }
            });
            return _tile;
        },
        reset: function () {
            var current = this,
            name = $('.active[data-gtype]', this.$element).attr("data-gtype");
            console.log("name:" + name);
            if (name) {
                //$.each($.MapBaseLayerDefaultSettings.tiles, function (k, val) {
                var _tile =this._getTileByName(name);
                if (_tile) {

                    if (_tile.beforeShow) {
                        if (_tile.beforeShow() === false) {
                            return;
                        }
                    }

                    current._mapctrl.basemap(_tile);

                    if (_tile.afterShow)
                        _tile.afterShow();
                }
                current.$element.trigger('change-base-layer');
            } else {
                current._mapctrl.remove();
            }
        }
    }
    //$.fn[pluginName] = function (arg, paras) {
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