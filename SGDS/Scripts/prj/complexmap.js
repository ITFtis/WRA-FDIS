window.app = window.app || {};
$.extend(app, { map_l: undefined, map_r : undefined, taiwancenter: undefined, taiwancenter: [23.7, 121] });

$.AppConfigOptions.require.all(function () {
    
    datahelper.getFhyRainstasion(function (rs) {
        window.fhyRainStations = rs;
    });
    var $_ctile = $('.container-title');
    var $_lcontainer = $('.left-container');
    var $_rcontainer = $('.right-container');

    app.map_l = L.map('map-l', { zoomControl: false, trackResize: true });
    app.map_r = L.map('map-r', { zoomControl: false, trackResize: true });
    //底圖
    var baseoptions = { map: app.map_l };

    var currentBaselayer4r; //右邊Map底圖
    $.extend(baseoptions, $.MapBaseLayerDefaultSettings);
    baseoptions.defaultLayer = $.MapBaseLayerDefaultSettings.ext.Google.silver.name;
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

    //同步底圖
    var afterChangeBaseLayer = function () {//左邊底圖改變後設定右邊底圖(同步底圖)
        if (currentBaselayer4r)
            currentBaselayer4r.remove();
        var ctype = $_bl.instance._mapctrl.currentType;
        currentBaselayer4r = L.tileLayer(ctype.url, { subdomains: ctype.options.subDomains, maxZoom: ctype.options.maxZoom ? ctype.options.maxZoom : 18 }).addTo(app.map_r);
    }
    for (var l in baseoptions.tiles) {
        baseoptions.tiles[l].afterShow = afterChangeBaseLayer;
    }
    $.each(baseoptions.tiles.other1.groupTiles, function () {
        this.afterShow = afterChangeBaseLayer;
    });

    var $_bl = $_ctile.MapBaseLayer(baseoptions).on('change-base-layer', function () {
        var sd = "";
    });

    //初始歷史資料選單
    var $eventYearSelect = $('.wra-event-year');
    var $eventSelect = $('.wra-events');
    var $timeSelect = $('.wra-time');
    var cy = new Date().getFullYear();
    for (var i = cy; i >= 2023; i--)
        $('<option value="' + i + '">' + i + '</option>').appendTo($eventYearSelect);
    $eventYearSelect[0].selectedIndex = 0;
    $eventYearSelect.on('change', function () {
        helper.misc.showBusyIndicator($_ctile);
        $eventSelect.empty();
        $.BasePinCtrl.helper.getWraFhyApi("Event/Year/" + $eventYearSelect.val(), undefined, function (d) {
            helper.misc.hideBusyIndicator($_ctile);
            var bdatat = new Date('2023/07/01'); //日期後才有資料
            if (d.Data) {
                $.each(d.Data, function () {
                    if (!this.IsActive && JsonDateStr2Datetime(this.EndTime) < bdatat)
                        return;
                    var $_p = $('<option value="' + this.EventNo + '">' + this.EventName + '</option>').appendTo($eventSelect);

                    var sdt = JsonDateStr2Datetime(this.BeginTime);
                    var edt = JsonDateStr2Datetime(this.EndTime) || new Date();//IsActive EndTime是null
                    //edt = edt.getTime() > new Date().getTime() ? new Date() : edt;
                    $_p.attr('data-BeginDate', sdt.DateFormat('yyyy/MM/dd HH:00:00'));//  new Date(sdt.getFullYear(), sdt.getMonth(), sdt.getDate(), sdt.getHours(), sdt.getMinutes()-sdt.getMinutes() % 10);
                    $_p.attr('data-EndDate', edt.DateFormat('yyyy/MM/dd HH:00:00'));// 
                });
            }
            $eventSelect[0].selectedIndex = 0;
            $eventSelect.trigger('change');
        })
    }).trigger('change');

    $eventSelect.on('change', function () {
        $timeSelect.empty();
        var $_optui = $eventSelect.find('option:selected');
        //optui.BeginDate == undefined optui.EndDate == undefined>>即時
        var nowTime = new Date(new Date().DateFormat('yyyy/MM/dd HH:') + new Date().DateFormat('mm')[0] + '0:00').getTime();// new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours(), new Date().getMinutes() - new Date().getMinutes() % 10).getTime();
        var sdt = new Date($_optui.attr('data-BeginDate'));// ? new Date(optui.BeginDate.getTime()) : new Date(nowTime - 24 * 60 * 60 * 1000);
        var edt = new Date($_optui.attr('data-EndDate'));//? new Date(optui.EndDate.getTime()) : new Date(nowTime);

        while (edt.getTime() >= sdt.getTime()) {
            //$('<option value="' + edt.getTime() + '">' + edt.DateFormat('yyyy/MM/dd HH') + '</option>').appendTo($timeSelect);
            //edt.addMinutes(-60);
            $('<option value="' + edt.DateFormat('yyyyMMddHHmm') + '">' + edt.DateFormat('yyyy/MM/dd HH:mm') + '</option>').appendTo($timeSelect);
            edt.addMinutes(-10);
        }
        $timeSelect[0].selectedIndex = 0;
        $timeSelect.trigger('change');
    });
    $timeSelect.on('change', function () {

    })
    var $_radios = $('.event-container input[type="radio"]').on('click', function () {
        $('.ctrl-part select,.ctrl-part .btn').attr('disabled', $(this).val() == '0').toggleClass('disabled');
        if ($(this).val() == '0')
            showData();
    });


    //2地圖同步操作
    app.map_l.setView(app.taiwancenter, 8);
    app.map_r.setView(app.taiwancenter, 8);
    app.map_l.sync(app.map_r);
    app.map_r.sync(app.map_l);
    

   

    //取資料及呈現，dtstr null為即時
    $('.query-btn').on('click', function () {
        var qt = $timeSelect.val();
        showData(qt);
    });
    var showData = function (dtstr) {
        //L.featureGroup(this.graphics).getBounds()
        helper.misc.showBusyIndicator($_rcontainer);
        var cbounds, fbounds;
        datahelper.getComplexData(dtstr,function (r) {
            showComplexALert(r);
            helper.misc.hideBusyIndicator($_rcontainer);
            cbounds = L.featureGroup($_ComplexVillageKmlCtrl2.instance.__pinctrl.instance._mapctrl.graphics).getBounds();
            if (cbounds && fbounds)
                fitBoundsMap(cbounds, fbounds);
        });

        helper.misc.showBusyIndicator($_lcontainer);
        datahelper.getFhyRainfallWarnning(dtstr, function (r) {
            showFhyAlert(r);
            helper.misc.hideBusyIndicator($_lcontainer);
            fbounds = L.featureGroup($_AlertTownKmlCtrl.instance.__pinctrl.instance._mapctrl.graphics).getBounds();
            if (cbounds && fbounds)
                fitBoundsMap(cbounds, fbounds);
        });
    }

    var fitBoundsMap = function (cbounds, fbounds) {
        var b = cbounds.extend(fbounds);
        if (b.isValid())
            app.map_l.fitBounds(b);
        else
            app.map_l.setView(app.taiwancenter, 8)
    }
    //複合警界呈現
    var showComplexALert = function (rs) {
        //警戒村里
        var adats = {};
        var t = '---';
        if (rs != null) {
            if (rs.length > 0)
                t = JsonDateStr2Datetime( JSON.parse( rs[0].Rain).Time).DateFormat('yyyy/MM/dd HH:mm');
            $('.right-container .map-desc .dt .t ').text(t);
            $.each(rs, function () {
                var ad = this;
                if (this.Alert  && ad.Villages) {
                    $.each(ad.Villages, function () {
                        adats[this.Code] = JSON.parse(JSON.stringify(ad));
                        adats[this.Code].VillageName = this.Name
                    });
                }
            });
        }
        //組警戒村里圖資
        var alldatas = [];
        $.each($_ComplexVillageKmlCtrls, function () {
            this.KmlCtrl('setFilter', function (p) {
                var fr = adats[p.VILLAGESN];
                if (fr != undefined) // 非null加入欲呈現圖資
                    alldatas.push( $.extend(p, adats[p.VILLAGESN]));
                //return fr != undefined;
                return false;
            });
        });
        //警界村里圖層呈現
        $_ComplexVillageKmlCtrl2.PolygonCtrl('setData',alldatas);
    }
    //fhy警界呈現
    var showFhyAlert = function (r) {
        //警戒行政區
        var adats = {};
        var t = '---';
        if (r && r.Data && r.Data.length>0) {
            t = helper.format.JsonDateStr2Datetime(r.Data[0].Time).DateFormat('yyyy/MM/dd HH:mm');
            $.each(r.Data, function () {
                adats[this.TownCode] = this;
            });
        }
        $('.left-container .map-desc .dt .t ').text(t);
        //呈現警戒圖層
        $_AlertTownKmlCtrl.PolygonCtrl('setFilter', function (p) {
            var ssss = p;
            var fr = adats[p.ID];
            if (fr != undefined)
                $.extend(p, adats[p.ID]);
            return fr != undefined;
        });
    }

    //將清單比數訊息變成清單 collapse控制向
    var setMeterList2collapse = function ( $_c) {
        var _tid = 'id_' + helper.misc.geguid();
        $_c.find('.meter-list-count').addClass('collapsed').attr('role', 'button').attr('data-bs-toggle', 'collapse').attr('href', '#' + _tid).attr('aria-expanded', false).attr('aria-controls', _tid)
            .on('click', function () { } //加這段在chrmoe的行動裝置模擬器才會正常(無加，可show不能縮)，非行動裝置模擬器沒這問題
        );
        $_c.find('.jsPanel .jsPanel-content').attr('id', _tid).addClass('collapse');//[0].style.height = "150px";//.css('height', "none");
        $_c.find('.glyphicon-search').prependTo($_c.find('.fixed-table-toolbar'));
    }

    var lready = rready = false;
    helper.misc.showBusyIndicator(); //初始載入圖資等待
    //左Map行政區圖層
    var $_AlertTownKmlCtrl = InitAlertTownKmlCtrl($('.left-container .meter'), { map: app.map_l, listContainer: 'inner', listTheme: 'none', }, "鄉鎮").on($.BasePinCtrl.eventKeys.initUICompleted, function () {
        $(this).find('.pinswitch').prop('checked', true).trigger('change');
        $(this).find('.pinlist').prop('checked', true).trigger('change');
        setMeterList2collapse( $(this));
    }).on($.BasePinCtrl.eventKeys.afterSetdata, function () {
        lready = true;
        if (lready && rready) {
            $_radios.first().trigger('click'); //觸發第一次取資料及UI disabled
            helper.misc.hideBusyIndicator();
        }
    });//.hide();

    //右Map村里圖層
    //複合式警戒村里呈現Ctrl
    var $_ComplexVillageKmlCtrl2 = InitComplexVillageKmlCtrl2($('.right-container .meter'), { map: app.map_r, listContainer: 'inner', listTheme: 'none', }, "村里").on($.BasePinCtrl.eventKeys.initUICompleted, function () {
        $(this).find('.pinswitch').prop('checked', true).trigger('change');
        $(this).find('.pinlist').prop('checked', true).trigger('change');
        setMeterList2collapse($(this));
    }).on($.BasePinCtrl.eventKeys.afterSetdata, function () {
    });
    //用於抓村里圖層KmlCtrl(不呈現(組村里圖層用) filter = return false)
    var needCountys = ["宜蘭縣", "新北市", "桃園市", "南投縣", "彰化縣", "雲林縣", "嘉義市", "嘉義縣", "臺南市", "高雄市", "屏東縣"];
    var $_ComplexVillageKmlCtrls = []; //村里圖層ctrl
    var rc = 0;
    $.each(needCountys, function () {
        var $_t = InitComplexVillageKmlCtrl($_ctile, { map: app.map_r, cluster: false, type: $.BasePinCtrl.type.polygon }, this)
            .on($.BasePinCtrl.eventKeys.initUICompleted, function () {
                $(this).find('.pinswitch').prop('checked', true).trigger('change');
            }).on($.BasePinCtrl.eventKeys.afterSetdata, function () {
                if ((++rc) == needCountys.length) {
                    rready = true;
                    if (lready && rready) {
                        $_radios.first().trigger('click'); //觸發第一次取資料及UI disabled
                        helper.misc.hideBusyIndicator();
                    }
                }
            }).hide();

        $_ComplexVillageKmlCtrls.push($_t);
    });
    
});