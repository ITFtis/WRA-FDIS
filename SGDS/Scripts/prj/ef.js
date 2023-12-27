/* 人工匯入災情controller */
$(document).ready(function () {
    mapHelper.createMap('leaflet', function () {
        setTimeout(function () {
            $("#main-ctrl").estimateFlood({ map: app.map }).trigger($.menuctrl.eventKeys.popu_init_before);
        }, 1000);
    });
})