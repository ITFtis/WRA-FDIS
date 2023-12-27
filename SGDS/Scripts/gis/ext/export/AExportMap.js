
/*
 * <<<<需用proxy>>>>
 * esriConfig.defaults.io.proxyUrl = "Other/proxy.ashx"
 * esriConfig.defaults.io.alwaysUseProxy = false;
 */

var AExportMap = function (ctrl, inicallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.settings.map;
    this.printserver = ctrl.settings.server ? ctrl.settings.server : "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
    this.$exportContainer = undefined;
    setTimeout(function () {
        if (window.html2canvas == undefined)
            require([$.AppConfigOptions.script.gispath + "/other/html2canvas.js"], function () { inicallback(); });
        else
            inicallback();
    });
    return this;
};
AExportMap.prototype.export = function (callback) { //尚須將Pin ctrl的PictureMarkerSymbol url要給絕對路徑或用imageData(base64)
    var current = this;
    require(["esri/dijit/Print"], function (Print) {
        if (current.$exportContainer)
            current.$exportContainer.empty();
        else
            current.$exportContainer = $('<div id="exportDiv" data-display-direction="right" style="float:left;cursor:pointer"></div>').appendTo($("body"));
        var printer = new Print({
            map: current.map,
            url: current.printserver,// "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
        }, current.$exportContainer[0]);//  dom.byId("printButton"));
        printer._printText = "匯 出";
        printer._printoutText = "連結結果";
        printer._printingText = "執行中..";
        printer.on('print-start', function () {
            console.log('print-start');
        });
        printer.on('print-complete', function () {
            console.log('print-complete');
            setTimeout(function () {
                callback( current.$exportContainer.find(" > .esriPrint > a ").attr("href"));
            },10);
        });
        
        printer.startup();
        
        setTimeout(function () {
            printer.printMap();

        });
    });

    return;

    var current = this;
    var _mapid, _transform;
    _mapid = this.map.id;
    //var divs = $("#" + _mapid + " #map_layers>div");//.css("transform");
    var divs = $("#" + _mapid + " #map_layers *");
    $.each(divs, function () {

        _transform = $(this).css("transform") ;
        if (_transform == "none")
            return;
        
        var comp = _transform.split(",") //split up the transform matrix
        var mapleft = parseFloat(comp[4]) //get left value
        var maptop = parseFloat(comp[5])  //get top value
        $(this).css({ //get the map container. not sure if stable
            "transform": "none",
            "left": mapleft,
            "top": maptop,
        })
        $(this).attr("_transform", _transform);
        if($(this).css("-webkit-transition"))
            $(this).attr("_-webkit-transition", true);
    });
   
    html2canvas($("#" + _mapid), { //google OK ，arcgis geomerty 有問題，chrome可，IE有問題(只能用 newWindow:false), 另地圖平移或zoom後會有問題
        logging: true,
        //profile: true,
        //useCORS: true,
        proxy: "https://html2canvas.appspot.com/query",
        //allowTaint: true,
        onrendered: function (canvas) {

            //setTimeout(function () {
            var uridata = canvas.toDataURL("image/png");
            //setTimeout(function () {
            //var divs = $("#" + _mapid + " #map_layers>div");//.css("transform");
            var divs = $("#" + _mapid + " #map_layers *");
            $.each(divs, function () {
                if ($(this).attr("_transform") === undefined)
                    return;
                $(this).css({
                    left: "",
                    top: "",
                    "transform": $(this).attr("_transform")
                });
                if ($(this).attr("_-webkit-transition")) {
                    $(this).removeAttr("_-webkit-transition");
                    $(this).css({ transform: "" });
                }
                $(this).removeAttr("_transform");
            });
            callback(uridata);
        }
    });
};