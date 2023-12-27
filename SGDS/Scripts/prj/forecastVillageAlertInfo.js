window.app = window.app || {};
$.extend(app, { map: undefined, taiwancenter: [23.7, 121] });

window.loadVillagePolygon = true;
$(document).ready(function () {
    setTimeout(function () {
        window.datahelper.preInitData();
    }, 1000);
    $.AppConfigOptions.require.all(function () {
        $('.body-content').addClass('row').forecastVillageAlertInfo({});
    });
});
(function ($) {
    'use strict';
    var pluginName = 'forecastVillageAlertInfo';


    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = { map: undefined };

        this.realtimeMap = undefined;
        this.forecastMap = undefined;
        this.realtimeLineboundary = undefined;
        this.forecastLineboundary = undefined;
        this.$countySelectContainer = undefined;
        this.$realtimeTable = undefined;
        this.$forecastTable = undefined;



        this.$realtimePinContainer = undefined;
        this.$forecastPinContainer = undefined;

    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {

            var current = this;

            $.extend(this.settings, options);
            this.map = this.settings.map;
            datahelper.getVillageFloodAlertDatas(true, function (ds) {
                var aa = JSON.stringify( ds);
                console.log('預抓資料完成datahelper.getVillageFloodAlertDatas for 村里即時緊戒');
            });
          
            this.initUi();
        },
        initUi: function () {
            var that = this;//.$element;
            //that.$element.empty();
            var $_realtimeContainer = $('<div class="col-sm-5 col-sm-5 result-container">').appendTo(this.$element);
            var $_forecastContainer = $('<div class="col-sm-5 col-sm-5 result-container">').appendTo(this.$element);
            var $_ctrlContainer = $('<div class="col-sm-2 col-sm-2 ctrl-container use-village-polygon">').appendTo(this.$element);

            var $_rtitle = $('<div class="realtime-tile title d-flex justify-content-center">實際雨量預警</div>').appendTo($_realtimeContainer);
            var $_ftitle = $('<div class="forecast-tile title d-flex justify-content-center">預報雨量預警</div>').appendTo($_forecastContainer);

            var $_rmap = $('<div id="realtime-map" class="map-container">').appendTo($_realtimeContainer);
            var $_fmap = $('<div id="forecast-map" class="map-container">').appendTo($_forecastContainer);
            //ctrl
            var $_ctrl = this._genPanelGroup('查詢條件設定').appendTo($_ctrlContainer).find('.panel-collapse').addClass('show').find('.panel-body');
            
            $('<div>縣市<div>').appendTo($_ctrl);
            this.$countySelectContainer = $('<div>').appendTo($_ctrl);

            var $_btn = $('<span class="btn btn-success form-control" style="margin-top:4px;">查詢</span>').appendTo($_ctrl);

            this.$realtimeTable = helper.bootstrap.genBootstrapAccordion($_ctrlContainer, undefined, 'flood-point-container', ['實際雨量警戒統計資料'], ['<table>']).find('table');// $('<table>').appendTo($_rtablec);

            this.$forecastTable = helper.bootstrap.genBootstrapAccordion($_ctrlContainer, undefined, 'flood-point-container', ['預報雨量警戒統計資料'], ['<table>']).find('table');// $('<table>').appendTo($_rtablec);

            //初始縣市UI
            this.$countySelectContainer.countySelect({ map: app.map, containerTW: false, showLabel: false, autoFitBounds: false });
            
            //map
            var _mapOptions = { zoomControl: false, trackResize: true, center:app.taiwancenter,zoom: 8 };
                
            that.realtimeMap = L.map($_rmap[0], _mapOptions).setView(app.taiwancenter, 8);;// new google.maps.Map($_rmap[0], _mapOptions);
            that.forecastMap = L.map($_fmap[0], _mapOptions).setView(app.taiwancenter, 8);// new google.maps.Map($_fmap[0], _mapOptions);
            var gwmts = 'https://mt0.googleapis.com/vt?lyrs=m@262000000&src=apiv3&hl=zh-TW&x={x}&y={y}&z={z}&style=47,37%7Csmartmaps';
            L.tileLayer(gwmts).addTo(that.realtimeMap);
            L.tileLayer(gwmts).addTo(that.forecastMap);

            that.realtimeMap.sync(that.forecastMap);
            that.forecastMap.sync(that.realtimeMap);

            datahelper.loadAllVillagePolygons(function (_vs) {
                console.log('初始村里警戒MAP');
                $_btn.click(function () {
                    that.query(that._getCounty());//, $_fselect.val());
                    if (that.realtimeLineboundary)
                        that.realtimeLineboundary.clear();
                    if (that.forecastLineboundary)
                        that.forecastLineboundary.clear();
                    if (that._getCounty() == 0) {
                        that.realtimeMap.setOptions(_mapOptions);
                        that.forecastMap.setOptions(_mapOptions);
                    }
                    else {
                        that.realtimeLineboundary = new window.boundary.LineBoundary({ map: that.realtimeMap, data: boundary.data.County, ids: [that.$countySelectContainer.find('option:selected').text()], style: {}, autoFitBounds: true }, function () {
                        });
                        that.forecastLineboundary = new window.boundary.LineBoundary({ map: that.forecastMap, data: boundary.data.County, ids: [that.$countySelectContainer.find('option:selected').text()], style: {}, autoFitBounds: true }, function () {
                        });
                    }
               
                });
            
                //init polygon pin

                that.$realtimePinContainer = $('<div  style="display:none">').appendTo($_ctrl);
                that.$realtimePinContainer.villageAlertPolygon({
                    map: that.realtimeMap, pinOptions: {
                        name: '村里', useList: false, useLabel: false
                    }
                });
                that.$realtimePinContainer.on('query_completed', function (evt, _villages) {
                    //_showdata(that._getCounty(), _villages, that.$realtimeTable);
                    that.$realtimePinContainer.villageAlertPolygon('showTable', that._getCounty(), _villages, that.$realtimeTable);
                    //var sdsss = that.$realtimeTable.closest('.panel');
                    //var sdd = that.$realtimeTable.closest('.panel').find('.panel-heading a');
                    ////that.$realtimeTable.closest('.panel').find('.panel-heading a').collapse('show');
                    //bootstrap.Collapse.getOrCreateInstance(that.$realtimeTable.closest('.panel').find('.panel-heading a')[0]).show();
                    helper.misc.hideBusyIndicator();
                });
                that.$forecastPinContainer = $('<div  style="display:none">').appendTo($_ctrl);
                that.$forecastPinContainer.villageAlertPolygon({
                    map: that.forecastMap, pinOptions: {
                        name: '村里', useList: false, useLabel: false
                    }
                });
                that.$forecastPinContainer.on('query_completed', function (evt, _villages) {
                    //_showdata(that._getCounty(), _villages, that.$forecastTable);
                    that.$forecastPinContainer.villageAlertPolygon('showTable', that._getCounty(), _villages, that.$forecastTable);
                });


                that._initMapEvent();
            });
         
            
        },
        _getCounty: function () {
            return this.$countySelectContainer.countySelect('getCounty');
        },
        query: function (_county){//, _fmode) {
            helper.misc.showBusyIndicator();
            var that = this;
          
            that.$realtimePinContainer.villageAlertPolygon("query", -1, _county, true);
            
            datahelper.getVillageForecastFloodAlertDatas( function (_villages) {
                that.$forecastPinContainer.villageAlertPolygon("query", -1, _county, true, _villages);
                
            }, true);
        },
        _genPanelGroup: function (_title) {
            var id ='panel'+ helper.misc.geguid();
            var $_panelGroup = $(' <div class="panel-group flood-point-container" id="' + id + '" role="tablist" aria-multiselectable="true">');
            var $_panel = $(' <div class="panel panel-info">').appendTo($_panelGroup);
            $('<div class="panel-heading" role="tab"><h4 class="panel-title"><a role="button" data-toggle="collapse" data-bs-toggle="collapse" data-parent="#' + id + '" href="#content-' + id + '" aria-expanded="true" aria-controls="flood-point-collapse">' + _title + '</a></h4></div>').appendTo($_panel);

            $('<div id="content-' + id + '" class="panel-collapse collapse in" role="tabpanel" aria-labelledby="content-' + id + '"><div class="panel-body"></div></div>').appendTo($_panel);
            return $_panelGroup;
        },
       
        _initMapEvent: function () {
            return;
            var that = this;
            var _triggerBoundsChanged = false;
            var _triggerInterval = 5;
            var _changeMapBounds = function (_trigger) {
                _triggerBoundsChanged = false;
                if (that.realtimeMap !== _trigger)
                    that.realtimeMap.setOptions({ center: that.forecastMap.getCenter(), zoom: that.forecastMap.getZoom() });
                else
                    that.forecastMap.setOptions({ center: that.realtimeMap.getCenter(), zoom: that.realtimeMap.getZoom() });
                _enableTrigger();
            };
            var _enableTrigger = function (interval) {
                interval = interval || _triggerInterval;
                setTimeout(function () {
                    _triggerBoundsChanged = true;
                }, interval);
            }
            var _triggerTimer;
            google.maps.event.addListener(this.realtimeMap, 'bounds_changed', function (evt) {
                clearTimeout(_triggerTimer);
                _triggerTimer = setTimeout(function () {
                    if (_triggerBoundsChanged)
                        _changeMapBounds(that.realtimeMap);
                }, _triggerInterval);
            });
            google.maps.event.addListener(this.forecastMap, 'bounds_changed', function (evt) {
                clearTimeout(_triggerTimer);
                _triggerTimer = setTimeout(function () {
                    if (_triggerBoundsChanged)
                        _changeMapBounds(that.forecastMap);
                }, _triggerInterval);
            });
            _enableTrigger(1000);
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