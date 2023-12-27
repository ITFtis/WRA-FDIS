/*歷史災情查詢*/
window.loadVillagePolygon = true;
$(document).ready(function () {
    mapHelper.createMap('leaflet', function () {

        //L.marker([23, 121]).addTo(app.map).bindTooltip("my tooltip text").openTooltip();
        var $_mainContainer = $('#main-ctrl');
        var $_tab = helper.bootstrap.genBootstrapTabpanel(undefined, undefined, undefined,
            ['災情查詢', '災害履歷', '歷年淹水調查範圍', '淹水潛勢圖'],
            ['<div class="fquery">', '<div class="dreocrd use-village-polygon">', '<div class="hfarea">', '<div class="fpotential">']
        );
        $_tab.appendTo($_mainContainer).find('.nav').addClass('nav-fill');
        //災情查詢
        $_tab.find('.fquery').floodQuery({ map: app.map, useRiver: true, packagekmz: window.packagekmz != undefined ? window.packagekmz : true });//.trigger($.menuctrl.eventKeys.popu_init_before);
        //災害履歷
        $_tab.find('.dreocrd').disasterRecord({ map: app.map });
        //歷年淹水範圍
        $_tab.find('.hfarea').historyFloodArea();
        //第三代「淹水潛勢圖」
        $_tab.find('.fpotential').the3rdFloodPotential({ map: app.map, initEvent: $.menuctrl.eventKeys.popu_init_before });
        //$_tab.find('.nav-item>.nav-link:eq(10)').tab("show"); //為了觸發shown.bs.tab先不選第一個
        $_tab.find('.nav-tabs .nav-link').on('shown.bs.tab', function (e, ere) {
            var $_this = $(this);
            if (!$_this.attr('data-isinit')) {
                //為了觸發$.menuctrl.eventKeys.popu_init_before
                $($(this).attr("href") + ' div').trigger($.menuctrl.eventKeys.popu_init_before);
                $_this.attr('data-isinit', true);
            }
        });
        //setTimeout(function () {
            $_tab.find('.nav-item>.nav-link:first').tab("show");//為了觸發shown.bs.tab
        //}, 4300);
    });
})