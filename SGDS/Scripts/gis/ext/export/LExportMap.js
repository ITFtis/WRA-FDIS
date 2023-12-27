var LExportMap = function (ctrl, inicallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    setTimeout(function () {
        if (window.html2canvas == undefined)
            helper.misc.getJavaScripts([$.AppConfigOptions.script.gispath + "/other/html2canvas.js", 'https://cdn.jsdelivr.net/bluebird/latest/bluebird.min.js'], function () { inicallback(); });
        else
            inicallback();
    });
    return this;
};
LExportMap.prototype.export = function (callback) {
    //this.map.setOptions({ zoomControl: false, streetViewControl: false, panControl: false });
    var current = this;
    var _mapid, _transform;
    //_mapid = this.map.getContainer().id;
    html2canvas(this.map.getContainer(), { //google OK ，arcgis geomerty 有問題，chrome可，IE有問題(只能用 newWindow:false), 另地圖平移或zoom後會有問題
        logging: false,
        //profile: true,
        useCORS: true,
        //proxy: "https://html2canvas.appspot.com/query",
        //onrendered: function (canvas) {
        //    var uridata = canvas.toDataURL("image/png");
        //    callback(uridata);
        //}
    })
    .then(function (canvas) {
        //var sad = "";
        var uridata = canvas.toDataURL("image/png");
        callback(uridata, canvas);
        });
};