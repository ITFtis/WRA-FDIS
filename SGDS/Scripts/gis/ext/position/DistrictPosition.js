(function ($) {
    'use strict';


    $.DistrictPosition = {
        eventKeys: { ui_init_completed: "ui_init_completed" },
        defaultOptions: { map: undefined, defaultCounty: '台北市', positionStype: {} }//用County的ID，xml資料對Town有問題(如台北市63000，各區是630XX)
    };

    var pluginName = 'DistrictPosition'
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this._mapctrl = undefined;
        //positionStype參考boundary.lineOptions.style
        this.settings = $.extend({}, $.DistrictPosition.defaultOptions),
        this.currentBoundaryCtrl;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);
            var current = this;
          
            this.initUI();
        },
        initUI: function () {
            var current = this;
            $('<div class="form-group ">縣市:<select class="form-control" style="width:calc(50% - 60px );display: inline;"></select> 鄉鎮:<select class="form-control" style="width:calc(50% - 60px );display: inline;"></select><span class="btn btn-success" style="margin:-4px 0 0 4px;">確定</span></div>').appendTo(this.$element);
            var $countyS = this.$element.find('select:eq(0)');
            var $townS = this.$element.find('select:eq(1)');

            if (!boundary) {
                alert('尚未引入Boundary.js');
                return;
            }

            $countyS.on('change', function () {

                var cval = $countyS.val();
                $townS.empty();
                $('<option></option>').appendTo($townS);
                boundary.helper.GetBoundaryData(boundary.data.Town, function (tds) {
                    var ids = [];
                    $.each(tds, function () {
                        if (this.Other.indexOf('|' + cval ) >= 0 && ids.indexOf(this.ID) < 0) {
                            $('<option value="' + this.ID + '">' + this.Name + '</option>').appendTo($townS);
                            ids.push(this.ID);
                        }
                    });
                });
            });

            boundary.helper.GetBoundaryData(boundary.data.County, function (cds) {
                $.each(cds, function () {
                    //用County的ID，xml資料對Town有問題
                    $('<option value="' + this.Name + '" ' + (this.ID == current.settings.defaultCounty || this.Name == current.settings.defaultCounty ? 'selected' : '') + '>' + this.Name + '</option>').appendTo($countyS);
                });
                $countyS.trigger('change');
            });
           

            this.$element.find('.btn').click(function () {
                var _data = boundary.data.County;
                var _id = $countyS.val();
                if (current.currentBoundaryCtrl)
                    current.currentBoundaryCtrl.clear();
                
                if ($townS.val()) {
                    _data = boundary.data.Town;
                    _id = $townS.val();
                }
                current.currentBoundaryCtrl = new window.boundary.LineBoundary({ map: current.settings.map, data: _data, ids: [_id], style: current.settings.positionStype, autoFitBounds: true }, function () {
                });
            });
            this.$element.trigger($.DistrictPosition.eventKeys.ui_init_completed);
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