/*人工圈劃*/
$(document).ready(function () {
    mapHelper.createMap('leaflet', function () {
        setTimeout(function () {
            $("#main-ctrl").handDrawFlood({ map: app.map }).trigger($.menuctrl.eventKeys.popu_init_before);
        }, 1000);
    });
})