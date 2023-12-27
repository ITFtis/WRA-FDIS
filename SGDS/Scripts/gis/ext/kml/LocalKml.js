/*****google WebTileLayer*****/
//呼叫前要設map.basemap或給一個WebTile
//WMSLayer 和 WebTiledLayer 共存，要先加入WebTiledLayeru要放在下層才能work
(function ($) {
    'use strict';

    $.LocalKml = {
        eventKeys: {
            addLayer: "~~addLayer"    //匯入新增一個layer
        }
    }

    var pluginName = 'LocalKml'
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.$listDiv = undefined;
        this._mapctrl = undefined;
        this._KmlCtrls = [];
        //this.settings = { map: app.map, server: location.href.indexOf("localhost") >= 0 ? "https://wrbweb.tainan.gov.tw/TNCM/WS/KmlUpload.ashx" : "WS/KmlUpload.ashx" };
        this.settings = { map: undefined, server: "https://pj.ftis.org.tw/Sample/Map/WS/KmlUpload.ashx", maxSize: 2, useKmlCtrl:false };//maxSize:M
        //this.settings = { map: undefined, server: "WS/KmlUpload.ashx", maxSize: 2, useKmlCtrl:false };//maxSize:M
        this.isInitCompleted = false;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);
            var current = this;
            if (whatMap(current.settings.map) === "google") {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/kml/GLocalKml.js", function () {
                    current._mapctrl = new GLocalKml(current, function () { });
                });
            }
            else if (whatMap(current.settings.map) === "leaflet") {
                if (window.LLocalKml) {
                    current._mapctrl = new LLocalKml(current, function () { });
                }
                else {
                    $.getScript($.AppConfigOptions.script.gispath + "/ext/kml/LLocalKml.js", function () {
                        current._mapctrl = new LLocalKml(current, function () { });
                    });
                }
            }
            else {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/kml/ALocalKml.js", function () {
                    current._mapctrl = new ALocalKml(current, function () { });
                });
            }
            this.initUI();
        },
        initUI: function () {
            var current = this;
            var $_form = $('<form class="form-horizontal kml-upload-form"  action="" method="POST" enctype="multipart/form-data"></form>').appendTo(this.$element);
            $('<div class="form-group"><label for="page_name" class="col-sm-1 control-label">檔案</label><div class="col-sm-11"><input type="file" class="form-control" name="local_kml_file" id="local_kml_file" accept=".kml,.kmz"></div></div>').appendTo($_form);
            $('<div class="form-group"><label for="file_size" class="col-sm-offset-1 col-sm-4 control-label ">檔案限制'+current.settings.maxSize+'M</label><label for="file_size" class=" col-sm-7 control-label local-file-size"></label></div>').appendTo($_form);
            $('<div class="form-group"><span class="col-sm-6 col-sm-offset-1 btn btn-success">匯 入</span><span class="col-sm-4 col-sm-offset-2 offset-sm-1 btn btn-danger">清除圖層</span></div>').appendTo($_form);
           
            this.$listDiv = $('<div class="local_kml_upload_list">').appendTo(this.$element);

            var $_sizeTxt = current.$element.find(".local-file-size");
            $('input[type=file]', this.$element).change(function (evt) {//選擇檔案後
                if (typeof FileReader !== "undefined") {
                    try {
                        if ((evt.target.files[0].size / 1024) / 1024 > current.settings.maxSize) {
                            alert("檔案太大，請重選");
                            $_sizeTxt.html(" (太大[" + (evt.target.files[0].size / 1024).toFixed(2) + "KB]，請重選)");
                            $('#local_kml_file', current.$element).replaceWith($('#local_kml_file', current.$element).val('').clone(true));
                        }
                        else
                            $_sizeTxt.html(" (大小" + (evt.target.files[0].size / 1024).toFixed(2) + "KB)");
                    } catch (ex) { console.log(ex); }
                }
            });
            this.$element.find(".btn-success").click(function () { //上傳
                var localfile = $('#local_kml_file', current.$element).val();
                if (localfile != "") {
                    window.helper.misc.showBusyIndicator(current.$element);
                    if (XMLHttpRequest) { //支援XMLHttpRequest
                        var formElement = current.$element.find("form")[0];// document.querySelector("form");
                        var xhttp = new XMLHttpRequest();
                        var _msg = $_sizeTxt.html();
                        xhttp.upload.onprogress = function (e) {
                            if (e.lengthComputable) {
                                $_sizeTxt.html( Math.floor((e.loaded / e.total) * 100) + '%')
                            }
                        }
                        xhttp.onload = function () {
                            $_sizeTxt.html(_msg)
                        };
                        xhttp.onreadystatechange = function () {
                            if (xhttp.readyState == 4 && xhttp.status == 200) {
                                window.helper.misc.hideBusyIndicator(current.$element);
                                current.add(JSON.parse(xhttp.responseText));
                            }
                            else if (xhttp.status == 404) {
                                window.helper.misc.hideBusyIndicator(current.$element);
                                console.log("找不到伺服器:"+current.settings.server);
                            }
                        }
                        xhttp.open("POST", current.settings.server);
                        xhttp.send(new FormData(formElement));
                    } else { //無支援XMLHttpRequest
                        var fileUpload = function () {
                            
                            $.ajaxFileUpload({
                                url: current.settings.server,// uploadserver,//"WS/KmlUpload.ashx",// ,// RootUrl() + '/Other/UploadFile.ashx',
                                secureuri: false,
                                fileElementId: "local_kml_file",
                                dataType: 'json',
                                data: { name: "paras" },
                                success: function (data, status) {
                                    window.helper.misc.hideBusyIndicator(current.$element);
                                    current.add(data);
                                }
                            });
                        };

                        if ($.ajaxFileUpload) {
                            fileUpload();
                        } else {
                            $.getScript($.AppConfigOptions.script.gispath + "/other/ajaxfileupload.js", function () {
                                fileUpload();
                            });
                        }
                    }
                }
                else
                    alert("尚未選擇檔案!");
            });
            this.$element.find(".btn-danger").click(function () { //移除圖層
                current.removeAll();
            });
        },
        add: function (data) {
            var current = this;
            console.log("KML資料" + JSON.stringify(data));
            if (this.settings.useKmlCtrl) {
                this.$listDiv.addClass('meter');
                for (var i = 0; i < data.Kmls.length; i++) {
                    this._KmlCtrls.push($('<div class="row"><div class="col-md-12"></div></div>').appendTo(this.$listDiv).find('>div').KmlCtrl({
                        map: current.settings.map, useSearch: true, useLabel: false, useList: false,
                        name: data.Kmls[i].Name,
                        url: data.Kmls[i].Url,
                        type: $.BasePinCtrl.type.feature,
                        geometryOtherOptions: this._mapctrl.defaultGeometryOtherOptions
                    }).on($.BasePinCtrl.eventKeys.initUICompleted, function () {
                        $(this).find('.pinswitch').prop("checked", true).trigger('change');
                    })
                    .on($.BasePinCtrl.eventKeys.repaintPinCompleted, function (evt, datas) {
                        $(this).KmlCtrl('fitBounds');
                        current.$element.trigger($.LocalKml.eventKeys.addLayer, [datas]);
                    })
                    );
                }
            }
            else {
                for (var i = 0; i < data.Kmls.length; i++) {
                    $('<div><label class="col-xs-12"><input type="checkbox"><span>' + data.Kmls[i].Name + '</span></div>').appendTo(this.$listDiv).find("input").prop("checked", true).change(function (ev) {
                        current.show($(ev.target).parent().text(), $(ev.target).is(":checked"));
                    });
                }
                this._mapctrl.add(data);
            }
        },
        show:function(_name, _show){
            this._mapctrl.show(_name, _show);
        },
        removeAll: function () {
            this._mapctrl.removeAll();
            if (this._KmlCtrls && this._KmlCtrls.length>0)
                $.each(this._KmlCtrls, function () {
                    $(this).find('.pinswitch').prop("checked", false).trigger('change');
                });
            //this.$listDiv.empty();
        }
    }
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
})(jQuery);