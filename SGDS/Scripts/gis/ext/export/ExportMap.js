(function ($) {
    'use strict';
    $.ExportMap = {
        defaultSettings: {
            map: undefined,
            name: "出圖",
            newWindow:false
        }
    };

    var pluginName = 'ExportMap'; 
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = $.extend({}, $.ExportMap.defaultSettings);// {map:undefined, width:240};
        this._exportctrl = undefined;
       };

    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);

            var current = this;
            this.$element.click(function () {
                if (current._exportctrl === undefined) {
                    if (whatMap(current.settings.map) === "google") {
                        if (window.GExportMap)
                            current._exportctrl = new GExportMap(current, function () { current.exportM(); })
                        else {
                            $.getScript($.AppConfigOptions.script.gispath + "/ext/export/GExportMap.js", function () {
                                current._exportctrl = new GExportMap(current, function () { current.exportM(); })
                            });
                        }
                    }
                    else if (whatMap(current.settings.map) === "leaflet") {
                        if (window.LExportMap)
                            current._exportctrl = new LExportMap(current, function () { current.exportM(); })
                        else {
                            $.getScript($.AppConfigOptions.script.gispath + "/ext/export/LExportMap.js", function () {
                                current._exportctrl = new LExportMap(current, function () { current.exportM(); })
                            });
                        }
                    }
                    else {
                        if (window.AExportMap)
                            current._exportctrl = new AExportMap(current, function () { current.exportM(); })
                        else {
                            $.getScript($.AppConfigOptions.script.gispath + "/ext/export/AExportMap.js", function () {
                                current._exportctrl = new AExportMap(current, function () { current.exportM(); })
                            });
                        }
                    }
                }
                else
                    current.exportM();
            });
        },
        exportM: function () { //出圖
            var current = this;
            $('.popu-ctrl-container').css("height", "100%").show_busyIndicator();
            if (this.settings.beforeExport)//出圖前
                this.settings.beforeExport();
            this._exportctrl.export(function (imagesrc,canvas) {
                //setTimeout(function () {
                    if (!current.settings.newWindow) {
                        //Set hidden field's value to image data (base-64 string)
                        var sp = $("body").jsPanel({
                            theme: "info",
                            title: current.settings.name,
                            modal: true,
                            controls: { iconfont: 'bootstrap' },
                            content: "<img class='export-image' src='" + imagesrc + "'></img>"
                        }).addClass("export-map-jspanel");
                    }
                    else {
                        window.open(imagesrc);
                    }
                    $('.popu-ctrl-container').css("height", "").hide_busyIndicator();
                    if (current.settings.afterExport)//出圖後
                        current.settings.afterExport();

                    //if (navigator.msSaveBlob) {
                    //    console.log('this is IE');
                    //    var URL = window.URL;
                    //    var BlobBuilder = window.MSBlobBuilder;
                    //    navigator.saveBlob = navigator.msSaveBlob;
                    //    var imgBlob = canvas.msToBlob();
                    //    if (BlobBuilder && navigator.saveBlob) {
                    //        var showSave = function (data, name, mimetype) {
                    //            var builder = new BlobBuilder();
                    //            builder.append(data);
                    //            var blob = builder.getBlob(mimetype || "application/octet-stream");
                    //            if (!name)
                    //                name = "Download.bin";
                    //            navigator.saveBlob(blob, name);
                    //        };
                    //        showSave(imgBlob, 'barchart.png', "image/png");
                    //    }
                    //}
                    //alert('1');
                    //$("<a>", {
                    //    href: imagesrc,
                    //    download: "fileName.png"
                    //})
                //.on("click", function () {$(this).remove();  alert('3'); })
                    //.appendTo("body")[0].click();
                    //alert('2');
                //}, 500);
            });
           
        }
    };
   

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
}(jQuery));