window.app = window.app || {};
//var app = { map: undefined, taiwancenter: undefined, siteRoot: undefined, taiwancenter: [23.7, 121] };
$.extend(app, { map: undefined, taiwancenter: undefined, taiwancenter: [23.7, 121] });
var dff = app;
(function (window) {
    //debu要將專案Web>>除錯工具>>Silverlight取消勾選

    var createMap = function (mapType, callback) {
        $.AppConfigOptions.require.all(function () {
            setTimeout(function () {
                window.datahelper.preInitData();
            }, 1000);
            var $_menuctrl = $("#mainmenu");
            if ($_menuctrl.length > 0) {
                $_menuctrl.on($.menuctrl.eventKeys.init_ctrl_menu_completed, function () {
                    var $_mctrl = $_menuctrl.find('.nav .popu-ctrl-menu[href="#main-ctrl"]')
                    if ($_mctrl.length > 0 && !$_mctrl.hasClass('selected'))
                        $_mctrl.trigger('setActive', [true]);
                })
            }
            //GOOGLE MAP
            if (mapType == window.mapHelper.mapType.google) {
                app.taiwancenter = new google.maps.LatLng(23.8, 121);
                var mapOptions = {
                    center: app.taiwancenter,
                    mapTypeControl: false,
                    scaleControl: true,
                    scaleControlOptions: { position: google.maps.ControlPosition.LEFT_BOTTOM },
                    zoom: 8,
                    zoomControl: false,
                    streetViewControlOptions: { position: google.maps.ControlPosition.LEFT_BOTTOM },
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                app.mapmap = new google.maps.Map(document.getElementById("map"),
                    mapOptions);

                setTimeout(function () {
                    var panorama = map.getStreetView()
                    google.maps.event.addListener(panorama, 'pano_changed', function () { //街圖
                        $("body>*:not(#map):not(script)").addClass("offdisplay");
                    });
                    google.maps.event.addListener(panorama, 'closeclick', function () {
                        $("body>*:not(#map)").removeClass("offdisplay");
                    });
                });
                
            }
            //ArcGis MAP
            else {
                app.map = L.map('map', { zoomControl: false, trackResize: true });
                L.Control.Scale.prototype._updateMetric = function (maxMeters) {
                    var meters = this._getRoundNum(maxMeters),
                        label = (meters >= 1000 ? meters / 1000 : meters) + (meters >= 1000 ? ' 公里' : ' 公尺');

                    this._updateScale(this._mScale, label, meters / maxMeters);
                };
                L.control.scale().addTo(app.map);
                //改以比例尺leaflet scale
                var _tf = setInterval(function () {
                    var _scale = $(".leaflet-control-scale");//.css('left', 0).css('right', 'none');
                    if (_scale.length == 0)
                        return;
                    clearInterval(_tf);
                    _scale.hide();
                    //_scale.parent().hide(); //於css設定

                    var repaint_scale = function () {
                        var $_td = $('<span rowspan="2" valign="middle">').insertAfter($('.coordinateInfoPanel')).css('font-weight', 'bold');// tr:first'));
                        _scale.find('>div:eq(0)').appendTo($_td).css('position', 'absolute').css('top', '1rem').css('right', '20px')
                            .css('color', 'white').css('border-color', '#ccc').css('background-color', 'transparent')
                            .css('padding-bottom', '.4em').css('line-height', '0').css('overflow', 'inherit');
                        $("#_scaleinfo").hide();
                    }
                    if ($('.coordinateInfoPanel').length > 0) {
                        repaint_scale();
                    }
                    else {
                        $('#coordinateInfoDiv').on($.menuctrl.eventKeys.popu_init_before, function () {
                            setTimeout(function () {
                                repaint_scale();
                            }, 600)
                        });
                    }
                }, 100);
            }

            //底圖
            var baseoptions = { map: app.map};
            $.extend(baseoptions, $.MapBaseLayerDefaultSettings);
            baseoptions.tiles.other1 = {
                id: "other2",
                name: "其他",
                groupTiles: [
                    $.MapBaseLayerDefaultSettings.ext.Google.silver,
                    $.MapBaseLayerDefaultSettings.ext.Google.gray,
                    $.MapBaseLayerDefaultSettings.ext.Google.retro,
                    $.MapBaseLayerDefaultSettings.ext.Google.dark,
                    //$.MapBaseLayerDefaultSettings.ext.Google.night_mode,
                    $.MapBaseLayerDefaultSettings.ext.Google.hide_featires,
                    $.MapBaseLayerDefaultSettings.ext.TGOS.通用版電子地圖
                ]
            }
            $('#basemapDiv').MapBaseLayer(baseoptions);

            app.map.setView(app.taiwancenter, 8);
            //座標資訊
            $('#coordinateInfoDiv').CoordinateInfo({ map: app.map, display: $.CoordinateInfo.display.WGS84_TWD97, content_padding: 1, initEvent: $.menuctrl.eventKeys.popu_init_before });

            $("#_twfullext").click(function () {
                app.map.setView(app.taiwancenter, 8);
                //app.map.setZoom(8);
                //if (app.map.setCenter)
                //    app.map.setCenter(app.taiwancenter);
                //else {
                //    /*app.map.setExtent(app.fullExtent);*/
                //    var dd = "";
                //}
            });

            $("#_zoomin").click(function () {
                if (app.map.getMaxZoom) {
                    if (app.map.getZoom() != app.map.getMaxZoom())
                        app.map.setZoom(app.map.getZoom() + 1);
                }
                else
                    app.map.setZoom(app.map.getZoom() + 1);

            });
            $("#_zoomout").click(function () {
                if (app.map.getMinZoom) {
                    if (app.map.getZoom() != app.map.getMinZoom())
                        app.map.setZoom(app.map.getZoom() - 1);
                } else
                    app.map.setZoom(app.map.getZoom() - 1);

            });

            var $_cw = $('.dou-action-controller');
            if ($_cw.length > 0)
                $('#mainmenu a[href="#main-ctrl"] .main-ctrl-desc').text($_cw.text());

            $.initGisMenu('mainmenu'); //初始化menu
            callback(app.map);

            if ($('').floodPreventionPoint)
                $('#other-ctrl').floodPreventionPoint();
            else {
                setTimeout(function () {
                    $('.nav-item > a[href="#other-ctrl"]').hide().trigger('setActive', false);
                }, 802);
            }

            //災情訊息查詢
            if ($('#main-ctrl').length > 0 && window.FLOOD_QUERY_EVENT) {
                $('#main-ctrl').
                    on(FLOOD_QUERY_EVENT.SHOW_積淹水災情統計表, function (evt, isshow) {
                        $('.tools-group-panel a[href="#FloodStatisticsPanel"]').trigger('setActive', isshow);
                    }).
                    on(FLOOD_QUERY_EVENT.SHOW_水利設施統計表, function (evt, isshow) {
                        $('.tools-group-panel a[href="#FacilityStatisticsPanel"]').trigger('setActive', isshow);
                    }).
                    on(FLOOD_QUERY_EVENT.SHOW_土地使用區分統計表, function (evt, isshow) {
                        $('.tools-group-panel a[href="#LandUseDistrictStatisticsPanel"]').trigger('setActive', isshow);
                    }).
                    on(FLOOD_QUERY_EVENT.CHANGE_積淹水災情統計表, function (evt, data) {
                        if ($('#FloodStatisticsPanel').length > 0)
                            $('#FloodStatisticsPanel').floodStatisticsTable('setData', data);
                    }).
                    on(FLOOD_QUERY_EVENT.CHANGE_水利設施統計表, function (evt, data) {
                        if ($('#FacilityStatisticsPanel').length > 0)
                            $('#FacilityStatisticsPanel').facilityStatisticsTable('setData', data);
                    }).
                    on(FLOOD_QUERY_EVENT.CHANGE_土地使用區分統計表, function (evt, data) {
                        if ($('#LandUseDistrictStatisticsPanel').length > 0)
                            $('#LandUseDistrictStatisticsPanel').landUseDistrictStatisticsTable('setData', data);
                    });

                //統計資料
                if ($("#FloodStatisticsPanel").length > 0 && $.fn.floodStatisticsTable)
                    $('#FloodStatisticsPanel').floodStatisticsTable({});
                if ($("#FacilityStatisticsPanel").length > 0 && $.fn.facilityStatisticsTable)
                    $('#FacilityStatisticsPanel').facilityStatisticsTable({});
                if ($("#LandUseDistrictStatisticsPanel").length > 0 && $.fn.landUseDistrictStatisticsTable)
                    $('#LandUseDistrictStatisticsPanel').landUseDistrictStatisticsTable({});
                var _setCacheShowtoFalse = function (_key) {
                    var _cache = helper.misc.localCache.get(_key);
                    if (_cache) {
                        _cache.show = false;
                        helper.misc.localCache.set(_key, _cache);
                    }
                }
                _setCacheShowtoFalse(FLOOD_QUERY_EVENT.SHOW_積淹水災情統計表);
                _setCacheShowtoFalse(FLOOD_QUERY_EVENT.SHOW_水利設施統計表);
                _setCacheShowtoFalse(FLOOD_QUERY_EVENT.SHOW_土地使用區分統計表);
            }
        })
    };
    window.mapHelper = {
        createMap: createMap,
        mapType: {
            google: "google",
            leaflet: "leaflet"
        }
    };
})(window);