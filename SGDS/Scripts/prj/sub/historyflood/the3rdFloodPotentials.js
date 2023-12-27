/*第三代「淹水潛勢圖」*/
(function ($) {
    'use strict';
    var pluginName = 'the3rdFloodPotential';
   
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = {};
        this.map;
        this.groundOverlay = null;
        this.opacity = .9;
    };

    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {

            var that = this;

            $.extend(this.settings, options);
            this.map = this.settings.map;

            if (this.settings.initEvent) {
                this.$element.on(this.settings.initEvent, function () {
                    that.initUi();
                });
            }
            else {
                that.initUi();
            }
        },
        initUi: function () {
            var that = this;
            that.$element.empty();
            
            $('<div class="item-title">縣市</div>').appendTo(that.$element);
            that.$element.countySelect({ map: that.map, containerTW: false, showLabel: false, autoFitBounds:false }).on('county-selectd-change', function () {
                //alert("YAYA");
            });
            setTimeout(function () {
                //that.$element.find('option[value=6]').text('新竹縣市');
                //that.$element.find('option[value=7]').remove();
                that.$element.find('option[value=10004]').text('新竹縣市');//20190806
                that.$element.find('option[value=10018]').remove();
            }, 1000);
            $('<div class="item-title">24小時定量降雨</div>').appendTo(that.$element);
            var $_typeSelect = $('<select class="form-control"></select>').appendTo(that.$element);
            $('<option value="0">---</option>').appendTo($_typeSelect);
            $('<option value="200">200mm</option>').appendTo($_typeSelect);
            $('<option value="350">350mm</option>').appendTo($_typeSelect);
            $('<option value="500">500mm</option>').appendTo($_typeSelect);

            var $confirm = $('<div class=" btn btn-success form-control" data-loading-text="資料載入中..." style="margin-top:12px;">確 定</div></div>').appendTo(that.$element);

            var $_opacityContainer=$('<div style="margin:12px 0;" class="row"></div>').appendTo(that.$element);
            $('<div class="col-md-2" style="padding:0">透明度</div>').appendTo($_opacityContainer);
            $('<div class="col-md-10" style="padding-left:0;margin-top:4px;"></div>').appendTo($_opacityContainer).gis_layer_opacity_slider({
                map: that.map, layerid: helper.misc.geguid(), value: that.opacity*100, setOpacity: function (_opcity) {
                    that.opacity = _opcity;
                    if (that.groundOverlay)
                        that.groundOverlay.setOpacity(that.opacity);
                }
            });;

            $('<div class="col-md-12" style="padding:0;margin-top:16px;"><img  src="' + app.CSgdsRoot + 'WS/3rdflood/淹水圖例.png" style="width:120px;"></div>').appendTo(that.$element);
            $confirm.click(function () {
                if (that.groundOverlay)
                    that.groundOverlay.remove();
                if($_typeSelect.val()==0)
                    return;
                var _cid =that.$element.countySelect('getCounty');
                var _fd = $.grep(the3rdFloodPotentials, function (f) { return f.CountyId == _cid; })[0];
                that.groundOverlay = L.imageOverlay(
                    app.CSgdsRoot+_fd['H24L' + $_typeSelect.val()],
                    [[_fd.MaxY, _fd.MaxX], [_fd.MinY, _fd.MinX] ]
                    , { opacity: that.opacity}).addTo(app.map);
                that.map.fitBounds(that.groundOverlay.getBounds());
            });

            var the3rdFloodPotentials;
            datahelper.getThe3rdFloodPotentials(function (fs) {
                the3rdFloodPotentials = fs;
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