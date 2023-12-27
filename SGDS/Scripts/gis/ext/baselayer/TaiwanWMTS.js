/*****google WebTileLayer*****/
//呼叫前要設map.basemap或給一個WebTile
//WMSLayer 和 WebTiledLayer 共存，要先加入WebTiledLayeru要放在下層才能work
(function ($) {
    'use strict';


    var pluginName = 'TaiwanWMTS'
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this._mapctrl = undefined;
        this.settings = {
            layerid: 'TWWMTS', tiles: {
                other : {id: "TWWMTSG",name: "TWWMTS",groupTiles: []
                }
            }
        };
        
        //Expose public methods
        //this.arc_WebTiledLayer = undefined;
        this.isInitCompleted = false;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            
            $.extend(this.settings, options);
            //if (!this.settings.ctrlMode) this.settings.ctrlMode = "radio";
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
            
            $.ajax({
                method:'GET',
                type: "xml",
                url: "Other/proxy.ashx?https://wmts.nlsc.gov.tw/wmts"
            })
            .done(function (data) {
                var $_layers = $(data).find('Contents > Layer');
                $.each($_layers, function () {
                    var $_this = $(this);
                    var s = {
                        title: $_this.find('> ows\\:Title').text(),
                        Identifier: $_this.find('> ows\\:Identifier').text(),
                        style: $_this.find('> Style > ows\\:Identifier').text(),
                        tileMatrixSet: $_this.find('> TileMatrixSetLink > TileMatrixSet').text(),
                        urltemp: $_this.find('> ResourceURL').attr('template')
                    }
                    current.settings.tiles.other.groupTiles.push({
                        id: s.Identifier,
                        name: s.title,
                        type: "WebTiledLayer",
                        url: s.urltemp.replace('{Style}', s.style).replace('{TileMatrixSet}', s.tileMatrixSet).replace('{TileMatrix}', '${level}').replace('{TileRow}', '${row}').replace('{TileCol}', '${col}'),
                        options: { "subDomains": [""] }
                    });
                });
                current.settings.initEvent = undefined;
                current.settings.fromTWWMTS = true;
                current.settings.classes = 'TWWMTSLater';
                current.$element[0].twwmts = true; //MapBaseLayer.pluginclass用
                current.$element.MapBaseLayer(current.settings);
            })
            .fail(function (xhr, status) {
                    /* handle error here */
                    $("#show_table").html(status);
            });

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