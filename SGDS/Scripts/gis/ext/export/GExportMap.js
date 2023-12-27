var GExportMap = function (ctrl, inicallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    setTimeout(function () {
        if (window.html2canvas == undefined)
            require([$.AppConfigOptions.script.gispath + "/other/html2canvas.js"], function () { inicallback(); });
        else
            inicallback();
    });
    return this;
};
GExportMap.prototype.export = function (callback) {
    //this.map.setOptions({ zoomControl: false, streetViewControl: false, panControl: false });
    var current = this;
    var _mapid, _transform;
    _mapid = this.map.getDiv().id;
    var _transform = $(".gm-style>div:first>div").css("transform")
    var comp = _transform.split(",") //split up the transform matrix
    var mapleft = parseFloat(comp[4]) //get left value
    var maptop = parseFloat(comp[5])  //get top value
    $(".gm-style>div:first>div").css({ //get the map container. not sure if stable
        "transform": "none",
        "left": mapleft,
        "top": maptop,
    })


    html2canvas($("#" + _mapid), { //google OK ，arcgis geomerty 有問題，chrome可，IE有問題(只能用 newWindow:false), 另地圖平移或zoom後會有問題
        logging: true,
        //profile: true,
        //useCORS: true,
        proxy: "https://html2canvas.appspot.com/query",
        //allowTaint: true,
        onrendered: function (canvas) {

            //setTimeout(function () {
                var uridata = canvas.toDataURL("image/png");
                $(".gm-style>div:first>div").css({
                    left: 0,
                    top: 0,
                    "transform": _transform
                });
                callback(uridata);
            //}, 100);
        }
    });
};