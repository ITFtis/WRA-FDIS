$(document).ready(function () {
    var currentevent = undefined;
    mapHelper.createMap('leaflet', function () {
        setTimeout(function () {
            $('#basemapDiv').on($.MapBaseLayer.events.initUICompleted, function () {
                $('#basemapDiv').MapBaseLayer('setDisplayLayer', '黑階');
            });
        });

        var $_mainContainer = $('#main-ctrl');
        var isshownearcctv = false; //是否show鄰近cctv
        var shownearcctvcenter = undefined; //鄰近cctv中心點
        $('#_nearcctv').on('click', function () {
            $(this).toggleClass('selected');
            isshownearcctv = $(this).hasClass('selected');
            shownearcctv();
        })
        //組tab
        var $_tab = helper.bootstrap.genBootstrapTabpanel($_mainContainer, undefined, undefined,
            ['綜整資訊', '雨量站', '水位站', '淹水感測', '通報災情'],
            ['<div class="fsta-c">', '<div class="rain-c meter">', '<div class="water-c meter">', '<div class="fsensor-c meter">', '<div class="rdisaster-c meter">']
        );
        $_tab.appendTo($_mainContainer).find('.nav').addClass('nav-fill');

        //統計
        var $_fsta= $_tab.find('.fsta-c').fsta().on('change-tab-index', function (e, i) {
            $_tab.find('.nav-item>.nav-link:eq('+i+')').tab("show");
        });

        //雨量
        $_tab.find('.rain-c').rain({ map: app.map }).on('get-data-complete', function (e, ds) {
            $_fsta.fsta('setRainData', ds); //get-data-complete取雨量資料完 , 計算雨量統計資料
        }).on('pin-click', function (e, d) {
            shownearcctvcenter = [d.X, d.Y];
            shownearcctv();
        });
        //水位
        $_tab.find('.water-c').water({ map: app.map }).on('get-data-complete', function (e, ds) {
            $_fsta.fsta('setWaterData', ds);
        }).on('pin-click', function (e, d) {
            shownearcctvcenter = [d.X, d.Y];
            shownearcctv();
        });
        //淹水感測
        $_tab.find('.fsensor-c').fsensor({ map: app.map }).on('get-data-complete', function (e, ds) {
            $_fsta.fsta('setFloorData', ds);
        }).on('pin-click', function (e,d) {
            shownearcctvcenter = [d.X, d.Y];
            shownearcctv();
        });
        //通報災情
        $_tab.find('.rdisaster-c').rdisaster({ map: app.map }).on('get-data-complete', function (e, ds) {
            $_fsta.fsta('setDisasterData', ds);
        }).on('pin-click', function (e, d) {
            shownearcctvcenter = [d.X, d.Y];
            shownearcctv();
        });

        var $_cctv =$('<div>').appendTo($('body')).cctv({ map: app.map });

        var shownearcctv = function () {
            if (isshownearcctv && shownearcctvcenter) {
                $_cctv.cctv('shownear', shownearcctvcenter[0], shownearcctvcenter[1]);
            }
            else
                $_cctv.cctv('hide');
        }

        var initCurrentEvent = function () {
            if (!currentevent)
                return;
            //$_ceventname.text(currentevent.EventName);
            $_tab.find('.fsta-c').fsta('setEvent', currentevent);
            $_tab.find('.rdisaster-c').rdisaster('setEvent', currentevent);
        }
        //取水利署事件
        window.datahelper.loadWraEvents(function (d) {
            var _eventid = helper.misc.getRequestParas()['eventid'];
            //_eventid = 'T2004';
            //_eventid = 'R00443';// 'T2004';
            if (_eventid) {
                currentevent = $.grep(d, function (d) { return d.EventNo == _eventid; })[0];
                currentevent.Enabled = true;
            }
            else
                currentevent = d[0];
            if (currentevent.Enabled) {
                initCurrentEvent();
            }
        });
    });
})