(function () {
    if (!$.AppConfigOptions || !$.AppConfigOptions.script || !$.AppConfigOptions.script.gispath) {
        alert("尚未設定(boundary)$.AppConfigOptions.script.gispath");
    }

    /***************GetBoundaryData 取邊界資料*****************/
    var GetBoundaryData = function (data, callback) {
        if (typeof data === "string") {
            //    $.BasePinCtrl.helper.ajaxDotnetWebserviceEmptyParas.call(this, this.settings.loadBase, this.__loadBaseCompleted)
            //}
           
            if (window.boundary[data])
                callback(window.boundary[data]);
            else {
                var _wait = "wait_" + data; //同時間只抓一次, 用wait callback
                if (!window.boundary[_wait]) {
                    window.boundary[_wait] = [];
                    $.get(data, function (xml) {
                        $xml = $(xml);
                        var datas = [];
                        $.each($xml.find("Data"), function () {
                            var $this = $(this);
                            var d = { ID: $this.find("ID").text(), Name: $this.find("NAME").text(), coors: [], Other: $this.find("Other").text() };//google polygon 可[[latlon,...]],line只能[latlon,...]
                            for (var i = 1; i <= 12; i++) {
                                var _cstr = $this.find("BoundaryPart" + i).text();
                                if (_cstr !== "") {
                                    var _oneBoundaryCoors = [];
                                    d.coors.push(_oneBoundaryCoors);
                                    var _cs = _cstr.split(";");
                                    $.each(_cs, function () {
                                        if (this.trim() !== "") {
                                            var _oc = this.split("|");
                                            _oneBoundaryCoors.push([parseFloat(_oc[0]), parseFloat(_oc[1])]);
                                        }
                                    });
                                }
                            };
                            datas.push(d);
                        });
                        window.boundary[data] = datas;
                        $.each(window.boundary[_wait], function () {
                            this(datas);//callback
                        });
                        delete window.boundary[_wait];
                        var sdfdsf = "";
                    }).fail(function () {
                        console.log("error");
                    });
                }
                window.boundary[_wait].push(callback);
            }
        }
        else if ($.isArray(data)) { //[ID:xx,NAME:xx,Other:xx,coors:[[x,y],.....],....]
            callback(data);
        }
        else if (typeof data === 'object') {
            //$.BasePinCtrl.helper.ajaxGeneralRequest.call(this, this.settings.loadBase, this.__loadBaseCompleted);
            //ajax options ,to do get data
        }
    };
    var GetBoundaryDataRect = function (data, ids, callback) {
        FindUseBoundary(data,ids,function(boundarys){
            var minx = 180, miny = 180, maxx = -180, maxy = -180;
            $.each(boundarys, function () {
                $.each(this.coors, function () {
                    $.each(this, function () {
                        if (minx > this[0])
                            minx = this[0];
                        if (miny > this[1])
                            miny = this[1];
                        if (maxx < this[0])
                            maxx = this[0];
                        if (maxy < this[1])
                            maxy = this[1];
                    });
                })
            });
            callback({minx:minx, miny:miny, maxx:maxx, maxy:maxy});
        });
    }

    var FindUseBoundary = function (data, ids, callback) {
       
        GetBoundaryData(data, function (allboundarys) {
            var useBoundarys = [];
            $.each(allboundarys, function () { //依options.ids篩選資料
                if (ids) {
                    if (Array.isArray(ids)) {
                        if ($.inArray(this.ID, ids) < 0 && $.inArray(this.Name, ids) < 0)
                            return;
                    }
                    else if (typeof ids === "function") {
                        if (!ids(this))
                            return;
                    }
                }
                useBoundarys.push(this);
            });
            callback(useBoundarys);
        });
    }
    /***************PolygonBoundary 畫Polygon邊界資料 Class*****************/

    /*  範例
        var _boundary = new window.boundary.PolygonBoundary(
        {
            map: app.map,
            data: window.boundary.data.County,
            style: { fillOpacity: .1, mouseOver: { enable: true, cursor: "pointer", fillOpacity: .1 } },
            click:function(data, graphic, evt){
                to do ....
            },
            ids: function (b) { return b.Name=="南投縣" || b.Name=="新北市"}// ["基隆市", "10008"]
        }, function (boundarys) {
            console.log("completed...");
        });

        options:{
            data:xml url string 或 [{coors:[oneBoundaryCoordinates], ID, Name,Other}]
        }
     */
    var PolygonBoundary = function (options, completed_callback) {// completed_callback畫完後回call
        this._mapctrl = undefined;
        this.options = options;
        var current = this;
        this.useBoundarys = undefined;
        this.rect = undefined;
        if (completed_callback)//暫存callback,_paint後再移除
            this.completed_callback = completed_callback;
        if (!this.options.data)
            this.options.data = boundary.data.County;
        //取邊界資料
        window.boundary.helper.GetBoundaryData(this.options.data, $.proxy(this._paint, this));
    };

    //focus polygon
    PolygonBoundary.prototype.setOnFocus = function (g) {
        this._mapctrl.setOnFocus(g);
    };
    //lose focus polygon
    PolygonBoundary.prototype.setLoseFocus = function (g) {
        this._mapctrl.setLoseFocus(g);
    };
    //lose focus polygon
    PolygonBoundary.prototype.clear = function () {
        if (this._mapctrl)
            this._mapctrl.clear();
    };
    PolygonBoundary.prototype.fitBounds = function (_rect) { //{minx:,miny:,maxx:,maxy:}
        if (!_rect)
            _rect = this.rect;
        this._mapctrl.fitBounds(_rect);
    };
    //畫geometry
    PolygonBoundary.prototype._paint = function () {
        var current = this;
       
        FindUseBoundary(this.options.data, current.options.ids, function (useBoundarys) {
            current.useBoundarys = useBoundarys;
            var _settings = current._initSettings(current.options);
            current._initMapCtrl(_settings, useBoundarys);
          
        });
    };
    //初始google or arcgis 控制項及畫底圖geometry
    PolygonBoundary.prototype._initMapCtrl = function (settings, datas) {
        var current = this;
        if (whatMap(settings.map) === "google") {
            if (window.GooglePolygonBoundary) {
                current._mapctrl = new GooglePolygonBoundary(settings, datas, function (_gs) {
                    current._afterInitMapCtrl(_gs);
                });
            }
            else {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/boundary/GBoundary.js", function () {
                    current._mapctrl = new GooglePolygonBoundary(settings, datas, function (_gs) {
                        current._afterInitMapCtrl(_gs);
                    });
                });
            }
        }
        else if (whatMap(settings.map) === "leaflet") {
            if (window.LeafletPolygonBoundary) {
                current._mapctrl = new LeafletPolygonBoundary(settings, datas, function (_gs) {
                    current._afterInitMapCtrl(_gs);
                });
            }
            else {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/boundary/LBoundary.js", function () {
                    current._mapctrl = new LeafletPolygonBoundary(settings, datas, function (_gs) {
                        current._afterInitMapCtrl(_gs);
                    });
                });
            }
        }
        else {
            $.getScript($.AppConfigOptions.script.gispath + "/ext/boundary/ABoundary.js", function () {
                current._mapctrl = new ArcGisPolygonBoundary(settings, datas, function (_gs) {
                    current._afterInitMapCtrl(_gs);
                });
            });
        }
    };
    //初始化map後
    PolygonBoundary.prototype._afterInitMapCtrl = function (_geometry) {
        var current = this;
        setTimeout(function () {  //
            if (current.options.autoFitBounds) {
                boundary.helper.GetBoundaryDataRect(current.useBoundarys, null, function (_rect) {
                    current.rect = _rect;
                    current.fitBounds(_rect);
                });
            }
            if (current.completed_callback) { //移除暫存的callback
                current.completed_callback(current.useBoundarys, _geometry);
                delete current.completed_callback;
            }
        });
    };
    //初始化setting(依options)
    PolygonBoundary.prototype._initSettings = function (options) {
        return $.extend(true, JSON.parse(JSON.stringify(window.boundary.polygonOptions)), options);
    };
    /***************PolygonBoundary 畫Line邊界資料 Class*****************/
    var LineBoundary = function (options, completed_callback) {
        PolygonBoundary.call(this, options,completed_callback);
    };
    LineBoundary.prototype = Object.create(PolygonBoundary.prototype);
    LineBoundary.prototype.constructor = LineBoundary;
    LineBoundary.prototype._initMapCtrl = function (settings, datas) {
        var current = this;
        if (whatMap(settings.map) === "google") {
            $.getScript($.AppConfigOptions.script.gispath + "/ext/boundary/GBoundary.js", function () {
                current._mapctrl = new GoogleLineBoundary(settings, datas, function (_gs) {
                    current._afterInitMapCtrl(_gs);
                });
            });
        }
        else if (whatMap(settings.map) === "leaflet") {
            if (window.LeafletLineBoundary) {
                current._mapctrl = new LeafletLineBoundary(settings, datas, function (_gs) {
                    current._afterInitMapCtrl(_gs);
                });
            }
            else {
                $.getScript($.AppConfigOptions.script.gispath + "/ext/boundary/LBoundary.js", function () {
                    current._mapctrl = new LeafletLineBoundary(settings, datas, function (_gs) {
                        current._afterInitMapCtrl(_gs);
                    });
                });
            }
        }
        else {
            $.getScript($.AppConfigOptions.script.gispath + "/ext/boundary/ABoundary.js", function () {
                current._mapctrl = new ArcGisLineBoundary(settings, datas, function (_gs) {
                    current._afterInitMapCtrl(_gs);
                });
            });
        }
    };
    LineBoundary.prototype._initSettings = function (options) {
        return $.extend(true, JSON.parse(JSON.stringify(window.boundary.lineOptions)), options);
    };


    window.boundary = {
        helper:{
            GetBoundaryData: GetBoundaryData, //Method
            GetBoundaryDataRect: GetBoundaryDataRect, //Method
            FindUseBoundary: FindUseBoundary
        },
        PolygonBoundary: PolygonBoundary,//Class
        polygonOptions: {
            map: undefined, data: undefined, style: {
                strokeWeight: 1, fillOpacity: .75, strokeColor: "#222222", fillColor: "#ffffff", lineStyle: "solid",
                mouseOver: { enable: false, cursor: "default", strokeWeight: 2, fillOpacity: .9, strokeColor: "#222222", fillColor: "#ffffff" }
            }, click: undefined, mouseOver: undefined, mouseOut: undefined, ids: undefined,autoFitBounds:true
        },
        LineBoundary: LineBoundary,     //Class
        lineOptions: {
            map: undefined, data: undefined, style: {
                strokeWeight: 1, strokeColor: "#222222", strokeOpacity: .9, lineStyle: "solid",
                mouseOver: { enable: false, cursor: "default", strokeWeight: 2, fillOpacity: .2, strokeColor: "#222222", strokeOpacity: 1}
            }, click: undefined, ids: undefined, autoFitBounds: true
        },
        data: {
            County: $.AppConfigOptions.script.gispath + "/resource/County.xml",
            Town: $.AppConfigOptions.script.gispath + "/resource/TOWNSHIP.xml",
            Basin: $.AppConfigOptions.script.gispath + "/resource/Basin.xml",
            RVB: $.AppConfigOptions.script.gispath + "/resource/RVB.xml"
        }
    };
})(window);