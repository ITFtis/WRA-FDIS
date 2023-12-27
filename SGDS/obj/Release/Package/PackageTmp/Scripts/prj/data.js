window.app = window.app || {};
//if (!app.siteRoot)
//    app.siteRoot = helper.misc.getScriptPath("Scripts/gis/Main").indexOf('localhost') >= 0 ? "http://140.116.66.35/SGDS/" : helper.misc.getScriptPath("Scripts/gis/Main");
app.CSgdsRoot = "https://www.dprcflood.org.tw/SGDS/";
//app.CSgdsRoot = "http://140.116.66.35/SGDS/";
//if ("/" != app.siteRoot) //事後要改
//    app.CSgdsRoot = app.siteRoot.replace("FDIS", "SGDS");// "http://140.116.66.35/SGDS/";
app.TpCctv = "https://heopublic.gov.taipei/taipei-heo-api/cctv_public";
//console.log("2>>>>" + app.siteRoot);
//console.log("3>>>>" + app.CSgdsRoot);
(function (window) {
    //var app.siteRoot = app.siteRoot;// helper.misc.getScriptPath("Scripts/gis/Main");
    window.wraLake = undefined;
    window.forestLake = undefined;

    window.forestEventManager = undefined;
    window.countyXY = undefined;

    var getData = function (url, paras, callback, option) {
        var _ajaxoptions = $.extend({
            url: url,
            type: "GET",
            dataType: "json",
            contentType: "application/json; charset=utf-8", //加contentType IE有問題，但放在server同一domain是OK的
            //async: _async,
            data: paras
        }, option);

        console.log(url + '參數:' + JSON.stringify(paras));
        $.ajax(_ajaxoptions)
            .done(function (dat, status) {
                var d = dat.d ? dat.d : (dat.Data ? dat.Data : dat);
                d = d.Data ? d.Data : d;
                callback(d); //dat.Data是fly v2
            }).fail(function (dat, status) {
                console.log('error:' + dat.responseText);
            });
    };

    //縣市資料
    var loadCountyXY = function (async) {
        if (!window.countyXY) {
            $.BasePinCtrl.helper.ajaxGeneralRequest({
                url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/Countys ",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                type: "POST",
                async: async
            }, function (d) {
                window.countyXY = d.d;
            });
        }
        return window.countyXY;
    }

    var countyXYContainTaiwan = undefined;
    //縣市資料(含全臺)
    var getCountyXYContains0 = function () {
        if (!countyXYContainTaiwan) {
            var cs = JSON.parse(JSON.stringify(datahelper.loadCountyXY(false)));
            cs.splice(0, 0, { PK_ID: 0, CountyName: datahelper.AllTW });
        }
        return cs;
    }

    //土地利用類型
    var getLandUseType = function () {
        if (!window.landUseType) {
            $.BasePinCtrl.helper.ajaxGeneralRequest({
                url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/LandUseType ",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                type: "POST",
                async: false
            }, function (d) {
                window.landUseType = d.d;
            });
        }
        return window.landUseType;
    };

    var getEMISWATER_TYPE = function () {
        if (!window.EMISWATER_TYPE) {
            $.BasePinCtrl.helper.ajaxGeneralRequest({
                url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/wsEMISWATER_TYPE ",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                type: "POST"
            }, function (d) {
                window.EMISWATER_TYPE = d.d;
            });
        }
        return window.EMISWATER_TYPE;
    };

    //取得事件清單資料，村里淹水災情事件
    var getFloodEvents = function (async) {
        //if (async==undefined) async = true;
        if (!window.floodEvents) {
            $.BasePinCtrl.helper.ajaxGeneralRequest({
                url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/FloodEvents ",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                type: "POST",
                //async: async
            }, function (d) {
                window.floodEvents = d.d;
            });
        }
        return window.floodEvents;
    }
    //取水利署事件清單 >>災情資訊查詢用
    var loadWraEvents = function (callback) {
        if (!window.waEvents) {
            $.BasePinCtrl.helper.ajaxGeneralRequest({
                url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/WraEvents  ",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                type: "POST"
            }, function (d) {
                window.waEvents = d.d;
                callback(window.waEvents);
            });
        }
        else
            callback(window.waEvents);
    }
    /****堰塞湖資料****/
    //水利署堰塞湖
    var loadWraLake = function (callback) {
        if (wraLake)
            callback(wraLake);
        else {
            $.BasePinCtrl.helper.ajaxDotnetWebserviceEmptyParas(app.CSgdsRoot + "WS/FloodComputeWS.asmx/QuakeLakes", function (d) {
                wraLake = d;
                callback(wraLake);
            });
        }
    }
    //林務局堰塞湖
    var loadForestLake = function (callback) {
        if (forestLake)
            callback(forestLake);
        else {
            $.BasePinCtrl.helper.ajaxDotnetWebserviceEmptyParas(app.CSgdsRoot + "WS/QLakeWs.asmx/TB_DisasterBaseData", function (d) {
                forestLake = d;
                callback(forestLake);
            });
        }
    }
    var loadForestEventManager = function (async) {
        if (!forestEventManager) {
            $.BasePinCtrl.helper.ajaxGeneralRequest({
                url: app.CSgdsRoot + "WS/QLakeWs.asmx/TB_EVENT_Disaster_Manager ",
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                type: "POST",
                async: async
            }, function (d) {
                forestEventManager = d.d;
            });
        }
        return forestEventManager;
    }

    window.allVillagePolygons = [];
    window.allVillagePolygons_WaitCallback = [];
    var istest = false;
    //抓村里KMZ資料
    var loadAllVillagePolygons = function (callcack, _countys) {
        //callcack([]);
        //return;
        if (!window.loadVillagePolygon && $('#ForecastVillageAlertInfoPanel,#TyphTypeVillageAlertPanel,#DisasterHistoryPanel,#PerHourDataPanel,#DisasterStage').length == 0)
            return;
        ////callcack(window.allVillagePolygons);
        //return;

        var needCountys = $.grep(datahelper.loadCountyXY(false), function (_c) {
            return _countys ? (_countys.indexOf(_c.CountyName) >= 0 || _countys.indexOf(_c.PK_ID + "") >= 0) : true;
        });

        if ((istest && window.allVillagePolygons.length > 0) || window.allVillagePolygons.length == needCountys.length) {
            if (callcack)
                callcack(window.allVillagePolygons);
            return window.allVillagePolygons;
        }
        window.allVillagePolygons_WaitCallback.push(callcack);

        var version = '1.5';
        var QuotaExceededError = false;

        var isChrome = (!!window.chrome && !!window.chrome.webstore) || (navigator.userAgent.indexOf("Chrome") > 0 && (navigator.userAgent.indexOf("Windows") > 0 || /(android)/i.test(navigator.userAgent)));
        //isChrome = false;
        //var pathtemp = isChrome ? 'Village/kml/' : 'Village/';
        //var exttemp = isChrome ? '.kml' : '.kmz';
        var pathtemp = 'Village/';
        var exttemp = '.kmz';

        //pathtemp = isChrome ? 'Village/kml/' : 'Village/kml/';

        //alert('isChrome:' + isChrome + "  " + navigator.userAgent);
        //return;
        if (allVillagePolygons_WaitCallback.length == 1) {
            helper.misc.showBusyIndicator('.use-village-polygon', { loading: { icon: "", size: 0 } });

            //$.each(datahelper.loadCountyXY(false), function () {
            $.each(needCountys, function () {
                var vtemp = helper.misc.localCache.get('village_' + this.CountyName);
                if (vtemp && vtemp.version == version) {
                    window.allVillagePolygons.push(vtemp);
                    console.log("從cache取 " + this.CountyName);
                    return;
                }
                else if (vtemp)
                    helper.misc.localCache.remove('village_' + this.CountyName);
                if (istest) return;

                var cn = this.CountyName
                var cid = this.PK_ID;

                console.log("抓" + cn + app.siteRoot + pathtemp + cn + exttemp);
                var _kmlurl = app.siteRoot + pathtemp + cn + exttemp;

                var afterParser = function (layers) {
                    console.log("抓 geoxml3 afterParse " + _kmlurl);

                    var cncillages = { county: cn, countyId: cid, version: version, villages: [] };
                    var tsec = 0;

                    var _geojson = layers.toGeoJSON();
                    $.each(_geojson.features, function () {
                        var vinfo = $.parserStringToObject(this.properties.description, "<BR>", ":");
                        if (vinfo.Sensor && vinfo.Sensor.trim() != "") { //解析淹水感測器
                            var stemps = vinfo.Sensor.split(';');
                            vinfo.Sensor = $.map(stemps, function (s) {
                                var dts = s.split('|');
                                return { name: dts[0], uid: dts[1] };
                            });
                        }
                        else
                            vinfo.Sensor = [];
                        var _paths = [];
                        var st = new Date().getTime();
                        $.each(this.geometry.coordinates, function () {
                            var _path = [];
                            $.each(this, function () {
                                //_path.push(this);
                                _path.push({ lat: parseFloat(this[1].toFixed(6)), lng: parseFloat(this[0].toFixed(6)) });//變小數6碼，僅多1縣市cache
                            });
                            _paths.push(_path);
                        });
                        tsec += (new Date().getTime() - st);
                        //cncillages.villages.push({ id: parseInt(vinfo.VILLAGESN), paths: _paths });// pol.getPaths() });//直接用getPaths()，重chache取出後，使用有問題
                        //var vs = parseInt(vinfo.VILLAGESN);
                        cncillages.villages.push({ id: vinfo.VILLAGESN, geojson: this, paths: _paths, river: vinfo.River, riverOrg: vinfo.RiverOrg, sensor: vinfo.Sensor });

                    });

                    window.allVillagePolygons.push(cncillages);
                    helper.misc.showBusyIndicator('.use-village-polygon', { content: "資料初始化中" + Math.round((window.allVillagePolygons.length / datahelper.loadCountyXY(false).length) * 100) + '%', loading: { icon: "", size: 0 } });
                    //if (window.allVillagePolygons.length == datahelper.loadCountyXY(false).length) {
                    if (window.allVillagePolygons.length == needCountys.length) {
                        helper.misc.hideBusyIndicator('.use-village-polygon', true);
                        $.each(window.allVillagePolygons_WaitCallback, function (_cidx, _callback) {
                            if (_callback) {
                                _callback(window.allVillagePolygons);
                            }
                        })
                        $('body').trigger('loadAllVillagePolygons-completed');
                    }

                    if (!QuotaExceededError) {
                        var err = helper.misc.localCache.set('village_' + cn, cncillages);
                        if (err)
                            QuotaExceededError = true;
                        else
                            console.log("寫入cache " + cn);
                    }

                    console.log("抓" + _kmlurl + " 完成");
                }


                if (_kmlurl.toUpperCase().indexOf("KMZ") > 0) {
                    var $_p, $_mc;
                    JSZipUtils.getBinaryContent(_kmlurl,
                        {
                            progress: function (event) {
                                if ($_mc == undefined && $_p != undefined && $_p.length > 0)
                                    $_mc = $_p.find('.msg-contont');
                                if ($_mc) {
                                    if (event.percent >= 99)
                                        $_mc.text('資料處理中');
                                    else
                                        $_mc.text('載入中 ' + event.percent.toFixed(0) + '% ');
                                }
                                //console.log(event.percent.toFixed(0) + "% of " + event.path + " loaded")
                            },
                            callback: function (e, data) {
                                try {
                                    JSZip.loadAsync(data).then(function (zip) {
                                        zip.forEach(function (path, file) {
                                            file.async('string').then(function (ks) {
                                                if (ks.indexOf('<?xml') > 0) {
                                                    var s = ks.indexOf('>') + 1;
                                                    ks = ks.substr(s);
                                                }

                                                st = Date.now();
                                                afterParser(omnivore.kml.parse(ks));
                                                //var p = omnivore.kml.parse(ks).addTo(app.map).toGeoJSON();
                                            });
                                            return; //預設只處裡一個檔案
                                        });
                                    });
                                } catch (e) {
                                    alert(e);
                                }
                            }
                        }
                    );
                } else {
                    var lay = omnivore.kml(_kmlurl).on('ready', function () {
                        afterParser(lay);
                    });
                }



                //geoXml.parse(app.siteRoot + "Village/simple/T.kmz");
                //console.log("抓台北市" + app.siteRoot + pathtemp + "台北市villageflood.kmz");
                //geoXml.parse(app.siteRoot + pathtemp + "台北市villageflood.kmz");
                //geoXml.parse(app.siteRoot + "WS/Disaster/2015051008/Village_2015051011.kmz");

                //return false;
            });
        }
    }

    var loadComplexVillagePolygons = function (_map, callback) {
        var needCountys = ["宜蘭縣", "桃園市", "臺南市", "新北市", "雲林縣", "彰化縣", "嘉義市", "嘉義縣", "高雄市", "屏東縣"];
        var tc = 0;
        var geos = [];
        $.each(needCountys, function () {
            var _ctrl = { settings: $.extend({ map: _map || app.map }, $.KmlCtrl.defaultSettings) };
            _ctrl.settings.type = $.BasePinCtrl.type.polygon;
            _ctrl.settings.descriptionParser = app.villageDescriptionParser;
            app.getVillageGeojsonData.call(_ctrl, this, function (geo) {
                geos = geos.concat(geo);
                if ((++tc) == needCountys.length) {
                    callback(geos);
                }
            })
        })
    }

    app.villageDescriptionParser = function (desc) {
        return $.parserStringToObject(desc, "<BR>", ":");
    };
    app.villageGeojsonData = {};

    app.getVillageGeojsonData = function (cityname, callback) {

        var _kmlCtrl = this;
        if (app.villageGeojsonData[cityname])
            callback(app.villageGeojsonData[cityname])
        //callback(JSON.parse(JSON.stringify(app.villageGeojsonData)));
        else {
            var _url = app.siteRoot + 'Data/Kml/' + cityname + '.kmz';
            var _kc = helper.misc.localCache.get(_url + app.kmlVersion);
            if (_kc) {
                app.villageGeojsonData[cityname] = JSON.parse(_kc);
                app.getVillageGeojsonData(cityname, callback);
            }
            else {
                console.log('抓' + cityname + '村里圖層kmz中.....');
                var kcl = new LKmlCtrl(_kmlCtrl, function () {
                    kcl.loadKml(_url, function (ds) {
                        console.log('抓' + cityname + '村里圖層kmz完成');
                        app.villageGeojsonData[cityname] = ds;
                        callback(app.villageGeojsonData[cityname]);
                    });
                });
            }
        }
    };



    var _villageForecastFloodAlertDatas;
    var _villageForecastFloodAlertDatas_WaitCallback = [];
    var _villageForecastFloodAlertDatasTimer;
    //取村里及時預報淹水資訊
    var getVillageForecastFloodAlertDatas = function (callback) {
        if (!_villageForecastFloodAlertDatasTimer) //清cache
            _villageForecastFloodAlertDatasTimer = setInterval(function () {
                _villageForecastFloodAlertDatas = undefined;
            }, 100 * 1000);

        if (_villageForecastFloodAlertDatas)
            callback(_villageForecastFloodAlertDatas);
        else {
            _villageForecastFloodAlertDatas_WaitCallback.push(callback);
            console.log('getVillageForecastFloodAlertDatas wait......' + _villageForecastFloodAlertDatas_WaitCallback.length);
            if (_villageForecastFloodAlertDatas_WaitCallback.length == 1) {
                $.BasePinCtrl.helper.ajaxDotnetWebserviceWithParas(app.CSgdsRoot + 'WS/FloodComputeWS.asmx/GetVillageForecastFloodAlertDatas', { onlyWarningData: true },
                    function (dat, status) {
                        if (dat && dat.length == 1 && dat[0].VILLAGESN == -999)
                            console.log("無預報資料或資料有問題");
                        _villageForecastFloodAlertDatas = dat;
                        $.each(_villageForecastFloodAlertDatas_WaitCallback, function (_cidx, _callback) {
                            if (_callback) {
                                _callback(_villageForecastFloodAlertDatas);
                            }
                        })
                        _villageForecastFloodAlertDatas_WaitCallback.splice(0, _villageForecastFloodAlertDatas_WaitCallback.length);
                    });
            }

        }
    };


    //取所有村里歷史淹水資訊
    var getVillageFloodAlertDatas = function (onlyWarningData, callback) {


        getVillageFloodAlertDatasByTyphtype(-1, onlyWarningData, callback);
    }

    var _villageFloodAlertDatasByTyphtype = {};
    //var _villageFloodAlertDatasByTyphtype_WaitCallback = [];
    var _villageFloodAlertDatasByTyphtypeTimer;
    //取指定颱風路徑類型所有村里歷史淹水資訊
    var getVillageFloodAlertDatasByTyphtype = function (typhtype, onlyWarningData, callback, styear, endyear) {
        //var r = JSON.parse('[{ "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000040017", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4029, "CountyName": "臺北市", "TownName": "中山區", "VillageName": "大佳里", "FloodEventCode": "R00193", "FloodEventYear": 2014, "VILLAGESN": "63000040017", "COUNID": 1, "TOWNID": 104, "RainStName": "內湖", "RasinStCode": "C0A9F0", "H1": 53.5, "H3": 87, "H6": 122, "H12": 154, "H24": 212 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7985, "CountyName": "臺北市", "TownName": "中山區", "VillageName": "大佳里", "FloodEventCode": "R00497", "FloodEventYear": 2019, "VILLAGESN": "63000040017", "COUNID": 1, "TOWNID": 104, "RainStName": "大直", "RasinStCode": "C0A9A0", "H1": 51, "H3": 54, "H6": 54, "H12": 56, "H24": 56.5 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 9.5, "H6": 14, "H12": 23.5, "H24": 61, "D1": 26.5, "D2": 77.5, "D3": 107.5, "FloodWarnInfo": "正常", "ST_NO": "C0A9F0", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 51, "S3時": 54, "S6時": 54, "S12時": 56, "S24時": 56.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000040013", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 6213, "CountyName": "臺北市", "TownName": "中山區", "VillageName": "劍潭里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "63000040013", "COUNID": 1, "TOWNID": 104, "RainStName": "劍南", "RasinStCode": "A1AD50", "H1": 154, "H3": 154, "H6": 154, "H12": 154, "H24": 154 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7734, "CountyName": "臺北市", "TownName": "中山區", "VillageName": "劍潭里", "FloodEventCode": "R00490", "FloodEventYear": 2019, "VILLAGESN": "63000040013", "COUNID": 1, "TOWNID": 104, "RainStName": "劍潭", "RasinStCode": "A1AG50", "H1": 48.5, "H3": 67.5, "H6": 72, "H12": 72, "H24": 72 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 8104, "CountyName": "臺北市", "TownName": "中山區", "VillageName": "劍潭里", "FloodEventCode": "R00517", "FloodEventYear": 2019, "VILLAGESN": "63000040013", "COUNID": 1, "TOWNID": 104, "RainStName": "劍潭", "RasinStCode": "A1AG50", "H1": 86, "H3": 111, "H6": 111, "H12": 111, "H24": 111 }], "RAIN": [{ "M10": 0, "H1": 1.5, "H2": 0, "H3": 15.5, "H6": 19, "H12": 32, "H24": 86, "D1": 36, "D2": 104, "D3": 126, "FloodWarnInfo": "正常", "ST_NO": "A1AD50", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0.5, "H2": 0, "H3": 19, "H6": 21.5, "H12": 32.5, "H24": 82, "D1": 34.5, "D2": 107, "D3": 124.5, "FloodWarnInfo": "正常", "ST_NO": "A1AG50", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 48.5, "S3時": 67.5, "S6時": 72, "S12時": 72, "S24時": 72 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000100008", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4559, "CountyName": "臺北市", "TownName": "內湖區", "VillageName": "港華里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000100008", "COUNID": 1, "TOWNID": 114, "RainStName": "金面", "RasinStCode": "A1AG80", "H1": 7.5, "H3": 7.5, "H6": 7.5, "H12": 8.5, "H24": 8.5 }], "RAIN": [{ "M10": 0, "H1": 0.5, "H2": 0, "H3": 1.5, "H6": 3.5, "H12": 14.5, "H24": 53, "D1": 16.5, "D2": 73, "D3": 98, "FloodWarnInfo": "正常", "ST_NO": "A1AG80", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 7.5, "S3時": 7.5, "S6時": 7.5, "S12時": 8.5, "S24時": 8.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000010018", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4607, "CountyName": "臺北市", "TownName": "松山區", "VillageName": "慈祐里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000010018", "COUNID": 1, "TOWNID": 105, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 47.5, "H3": 109.5, "H6": 209, "H12": 292, "H24": 297 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5481, "CountyName": "臺北市", "TownName": "松山區", "VillageName": "慈祐里", "FloodEventCode": "R00278", "FloodEventYear": 2016, "VILLAGESN": "63000010018", "COUNID": 1, "TOWNID": 105, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 1, "H3": 1, "H6": 1, "H12": 1, "H24": 1 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 6149, "CountyName": "臺北市", "TownName": "松山區", "VillageName": "慈祐里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "63000010018", "COUNID": 1, "TOWNID": 105, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 75, "H3": 144.5, "H6": 151, "H12": 178.5, "H24": 186.5 }], "RAIN": [{ "M10": 0, "H1": 2, "H2": 0, "H3": 17, "H6": 18, "H12": 26, "H24": 52, "D1": 27, "D2": 70.5, "D3": 92, "FloodWarnInfo": "正常", "ST_NO": "A1AB40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 1, "S3時": 1, "S6時": 1, "S12時": 1, "S24時": 1 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000020018", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5473, "CountyName": "臺北市", "TownName": "信義區", "VillageName": "永春里", "FloodEventCode": "R00278", "FloodEventYear": 2016, "VILLAGESN": "63000020018", "COUNID": 1, "TOWNID": 110, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 1, "H3": 1, "H6": 1, "H12": 1, "H24": 1 }], "RAIN": [{ "M10": 0, "H1": 2, "H2": 0, "H3": 17, "H6": 18, "H12": 26, "H24": 52, "D1": 27, "D2": 70.5, "D3": 92, "FloodWarnInfo": "正常", "ST_NO": "A1AB40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 1, "S3時": 1, "S6時": 1, "S12時": 1, "S24時": 1 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000020009", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5468, "CountyName": "臺北市", "TownName": "信義區", "VillageName": "安康里", "FloodEventCode": "R00278", "FloodEventYear": 2016, "VILLAGESN": "63000020009", "COUNID": 1, "TOWNID": 110, "RainStName": "四獸", "RasinStCode": "A1AG40", "H1": 1.5, "H3": 3.5, "H6": 3.5, "H12": 3.5, "H24": 3.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7306, "CountyName": "臺北市", "TownName": "信義區", "VillageName": "安康里", "FloodEventCode": "R00448", "FloodEventYear": 2018, "VILLAGESN": "63000020009", "COUNID": 1, "TOWNID": 110, "RainStName": "留公國中", "RasinStCode": "A1AA60", "H1": 69.5, "H3": 104.5, "H6": 114.5, "H12": 115, "H24": 148 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 8142, "CountyName": "臺北市", "TownName": "信義區", "VillageName": "安康里", "FloodEventCode": "T1918", "FloodEventYear": 2019, "VILLAGESN": "63000020009", "COUNID": 1, "TOWNID": 110, "RainStName": "信義", "RasinStCode": "C0AC70", "H1": 55, "H3": 82.5, "H6": 128.5, "H12": 171.5, "H24": 196 }], "RAIN": [{ "M10": 0, "H1": 1, "H2": 0, "H3": 16, "H6": 16.5, "H12": 23, "H24": 52, "D1": 25, "D2": 71, "D3": 96, "FloodWarnInfo": "正常", "ST_NO": "A1AA60", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 1, "H2": 0, "H3": 16.5, "H6": 17.5, "H12": 25, "H24": 53.5, "D1": 25.5, "D2": 76.5, "D3": 104, "FloodWarnInfo": "正常", "ST_NO": "A1AG40", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 1, "H2": 0, "H3": 13.5, "H6": 14, "H12": 21, "H24": 54, "D1": 23.5, "D2": 69.5, "D3": 97, "FloodWarnInfo": "正常", "ST_NO": "C0AC70", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 1.5, "S3時": 3.5, "S6時": 3.5, "S12時": 3.5, "S24時": 3.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000020022", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5466, "CountyName": "臺北市", "TownName": "信義區", "VillageName": "松友里", "FloodEventCode": "R00278", "FloodEventYear": 2016, "VILLAGESN": "63000020022", "COUNID": 1, "TOWNID": 110, "RainStName": "四獸", "RasinStCode": "A1AG40", "H1": 1.5, "H3": 3.5, "H6": 3.5, "H12": 3.5, "H24": 3.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 6126, "CountyName": "臺北市", "TownName": "信義區", "VillageName": "松友里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "63000020022", "COUNID": 1, "TOWNID": 110, "RainStName": "留公國", "RasinStCode": "A1AA60", "H1": 104, "H3": 142, "H6": 145, "H12": 167, "H24": 178 }], "RAIN": [{ "M10": 0, "H1": 1, "H2": 0, "H3": 16, "H6": 16.5, "H12": 23, "H24": 52, "D1": 25, "D2": 71, "D3": 96, "FloodWarnInfo": "正常", "ST_NO": "A1AA60", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 1, "H2": 0, "H3": 16.5, "H6": 17.5, "H12": 25, "H24": 53.5, "D1": 25.5, "D2": 76.5, "D3": 104, "FloodWarnInfo": "正常", "ST_NO": "A1AG40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 1.5, "S3時": 3.5, "S6時": 3.5, "S12時": 3.5, "S24時": 3.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000020015", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5471, "CountyName": "臺北市", "TownName": "信義區", "VillageName": "長春里", "FloodEventCode": "R00278", "FloodEventYear": 2016, "VILLAGESN": "63000020015", "COUNID": 1, "TOWNID": 110, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 1, "H3": 1, "H6": 1, "H12": 1, "H24": 1 }], "RAIN": [{ "M10": 0, "H1": 2, "H2": 0, "H3": 17, "H6": 18, "H12": 26, "H24": 52, "D1": 27, "D2": 70.5, "D3": 92, "FloodWarnInfo": "正常", "ST_NO": "A1AB40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 1, "S3時": 1, "S6時": 1, "S12時": 1, "S24時": 1 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000090012", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5476, "CountyName": "臺北市", "TownName": "南港區", "VillageName": "萬福里", "FloodEventCode": "R00278", "FloodEventYear": 2016, "VILLAGESN": "63000090012", "COUNID": 1, "TOWNID": 115, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 1, "H3": 1, "H6": 1, "H12": 1, "H24": 1 }], "RAIN": [{ "M10": 0, "H1": 2, "H2": 0, "H3": 17, "H6": 18, "H12": 26, "H24": 52, "D1": 27, "D2": 70.5, "D3": 92, "FloodWarnInfo": "正常", "ST_NO": "A1AB40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 1, "S3時": 1, "S6時": 1, "S12時": 1, "S24時": 1 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000090010", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4630, "CountyName": "臺北市", "TownName": "南港區", "VillageName": "合成里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000090010", "COUNID": 1, "TOWNID": 115, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 47.5, "H3": 109.5, "H6": 209, "H12": 292, "H24": 297 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5479, "CountyName": "臺北市", "TownName": "南港區", "VillageName": "合成里", "FloodEventCode": "R00278", "FloodEventYear": 2016, "VILLAGESN": "63000090010", "COUNID": 1, "TOWNID": 115, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 1, "H3": 1, "H6": 1, "H12": 1, "H24": 1 }], "RAIN": [{ "M10": 0, "H1": 2, "H2": 0, "H3": 17, "H6": 18, "H12": 26, "H24": 52, "D1": 27, "D2": 70.5, "D3": 92, "FloodWarnInfo": "正常", "ST_NO": "A1AB40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 1, "S3時": 1, "S6時": 1, "S12時": 1, "S24時": 1 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000090008", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5486, "CountyName": "臺北市", "TownName": "南港區", "VillageName": "西新里", "FloodEventCode": "R00278", "FloodEventYear": 2016, "VILLAGESN": "63000090008", "COUNID": 1, "TOWNID": 115, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 1, "H3": 1, "H6": 1, "H12": 1, "H24": 1 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 6167, "CountyName": "臺北市", "TownName": "南港區", "VillageName": "西新里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "63000090008", "COUNID": 1, "TOWNID": 115, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 75, "H3": 144.5, "H6": 151, "H12": 178.5, "H24": 186.5 }], "RAIN": [{ "M10": 0, "H1": 2, "H2": 0, "H3": 17, "H6": 18, "H12": 26, "H24": 52, "D1": 27, "D2": 70.5, "D3": 92, "FloodWarnInfo": "正常", "ST_NO": "A1AB40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 1, "S3時": 1, "S6時": 1, "S12時": 1, "S24時": 1 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000090006", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5482, "CountyName": "臺北市", "TownName": "南港區", "VillageName": "新光里", "FloodEventCode": "R00278", "FloodEventYear": 2016, "VILLAGESN": "63000090006", "COUNID": 1, "TOWNID": 115, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 1, "H3": 1, "H6": 1, "H12": 1, "H24": 1 }], "RAIN": [{ "M10": 0, "H1": 2, "H2": 0, "H3": 17, "H6": 18, "H12": 26, "H24": 52, "D1": 27, "D2": 70.5, "D3": 92, "FloodWarnInfo": "正常", "ST_NO": "A1AB40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 1, "S3時": 1, "S6時": 1, "S12時": 1, "S24時": 1 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000090015", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5478, "CountyName": "臺北市", "TownName": "南港區", "VillageName": "聯成里", "FloodEventCode": "R00278", "FloodEventYear": 2016, "VILLAGESN": "63000090015", "COUNID": 1, "TOWNID": 115, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 1, "H3": 1, "H6": 1, "H12": 1, "H24": 1 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 6143, "CountyName": "臺北市", "TownName": "南港區", "VillageName": "聯成里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "63000090015", "COUNID": 1, "TOWNID": 115, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 75, "H3": 144.5, "H6": 151, "H12": 178.5, "H24": 186.5 }], "RAIN": [{ "M10": 0, "H1": 2, "H2": 0, "H3": 17, "H6": 18, "H12": 26, "H24": 52, "D1": 27, "D2": 70.5, "D3": 92, "FloodWarnInfo": "正常", "ST_NO": "A1AB40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 1, "S3時": 1, "S6時": 1, "S12時": 1, "S24時": 1 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000090013", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5474, "CountyName": "臺北市", "TownName": "南港區", "VillageName": "鴻福里", "FloodEventCode": "R00278", "FloodEventYear": 2016, "VILLAGESN": "63000090013", "COUNID": 1, "TOWNID": 115, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 1, "H3": 1, "H6": 1, "H12": 1, "H24": 1 }], "RAIN": [{ "M10": 0, "H1": 2, "H2": 0, "H3": 17, "H6": 18, "H12": 26, "H24": 52, "D1": 27, "D2": 70.5, "D3": 92, "FloodWarnInfo": "正常", "ST_NO": "A1AB40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 1, "S3時": 1, "S6時": 1, "S12時": 1, "S24時": 1 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000110003", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 8379, "CountyName": "臺北市", "TownName": "士林區", "VillageName": "福林里", "FloodEventCode": "T2004", "FloodEventYear": 2020, "VILLAGESN": "63000110003", "COUNID": 1, "TOWNID": 111, "RainStName": "福德", "RasinStCode": "A1AB60", "H1": 92.5, "H3": 143, "H6": 164, "H12": 195.5, "H24": 198.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 8433, "CountyName": "臺北市", "TownName": "士林區", "VillageName": "福林里", "FloodEventCode": "R00576", "FloodEventYear": 2020, "VILLAGESN": "63000110003", "COUNID": 1, "TOWNID": 111, "RainStName": "福德", "RasinStCode": "A1AB60", "H1": 71.5, "H3": 122.5, "H6": 163.5, "H12": 172.5, "H24": 172.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3415, "CountyName": "臺北市", "TownName": "士林區", "VillageName": "福林里", "FloodEventCode": "T1209", "FloodEventYear": 2012, "VILLAGESN": "63000110003", "COUNID": 1, "TOWNID": 111, "RainStName": "大直", "RasinStCode": "C0A9A0", "H1": 44.5, "H3": 83.5, "H6": 140, "H12": 186, "H24": 295.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 6221, "CountyName": "臺北市", "TownName": "士林區", "VillageName": "福林里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "63000110003", "COUNID": 1, "TOWNID": 111, "RainStName": "劍南", "RasinStCode": "A1AD50", "H1": 154, "H3": 154, "H6": 154, "H12": 154, "H24": 154 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7604, "CountyName": "臺北市", "TownName": "士林區", "VillageName": "福林里", "FloodEventCode": "R00474", "FloodEventYear": 2019, "VILLAGESN": "63000110003", "COUNID": 1, "TOWNID": 111, "RainStName": "福德", "RasinStCode": "A1AB60", "H1": 47.5, "H3": 120.5, "H6": 143, "H12": 143, "H24": 143 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7736, "CountyName": "臺北市", "TownName": "士林區", "VillageName": "福林里", "FloodEventCode": "R00490", "FloodEventYear": 2019, "VILLAGESN": "63000110003", "COUNID": 1, "TOWNID": 111, "RainStName": "福德", "RasinStCode": "A1AB60", "H1": 46.5, "H3": 65.5, "H6": 70, "H12": 70, "H24": 70 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7988, "CountyName": "臺北市", "TownName": "士林區", "VillageName": "福林里", "FloodEventCode": "R00497", "FloodEventYear": 2019, "VILLAGESN": "63000110003", "COUNID": 1, "TOWNID": 111, "RainStName": "福德", "RasinStCode": "A1AB60", "H1": 50, "H3": 53, "H6": 53, "H12": 54.5, "H24": 63 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 8107, "CountyName": "臺北市", "TownName": "士林區", "VillageName": "福林里", "FloodEventCode": "R00517", "FloodEventYear": 2019, "VILLAGESN": "63000110003", "COUNID": 1, "TOWNID": 111, "RainStName": "福德", "RasinStCode": "A1AB60", "H1": 84.5, "H3": 104.5, "H6": 104.5, "H12": 104.5, "H24": 104.5 }], "RAIN": [{ "M10": 0, "H1": 1.5, "H2": 0, "H3": 15.5, "H6": 19, "H12": 32, "H24": 86, "D1": 36, "D2": 104, "D3": 126, "FloodWarnInfo": "正常", "ST_NO": "A1AD50", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 44.5, "S3時": 53, "S6時": 53, "S12時": 54.5, "S24時": 63 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000120018", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 8387, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "八仙里", "FloodEventCode": "T2004", "FloodEventYear": 2020, "VILLAGESN": "63000120018", "COUNID": 1, "TOWNID": 112, "RainStName": "奇岩", "RasinStCode": "A1AB70", "H1": 92, "H3": 142.5, "H6": 166, "H12": 197.5, "H24": 202.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 2158, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "八仙里", "FloodEventCode": "T0813", "FloodEventYear": 2008, "VILLAGESN": "63000120018", "COUNID": 1, "TOWNID": 112, "RainStName": "社子", "RasinStCode": "C0A980", "H1": 30, "H3": 60.5, "H6": 100.5, "H12": 166.5, "H24": 253.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3142, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "八仙里", "FloodEventCode": "R00119", "FloodEventYear": 2012, "VILLAGESN": "63000120018", "COUNID": 1, "TOWNID": 112, "RainStName": "石牌", "RasinStCode": "C0A9B0", "H1": 53.5, "H3": 114, "H6": 190, "H12": 280.5, "H24": 305.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4594, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "八仙里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000120018", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國中", "RasinStCode": "A1A9U0", "H1": 43.5, "H3": 120.5, "H6": 173, "H12": 18.5, "H24": 157.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4595, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "八仙里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000120018", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國中", "RasinStCode": "A1A9U0", "H1": 43.5, "H3": 120.5, "H6": 173, "H12": 18.5, "H24": 157.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4596, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "八仙里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000120018", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國中", "RasinStCode": "A1A9U0", "H1": 43.5, "H3": 120.5, "H6": 173, "H12": 18.5, "H24": 157.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4598, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "八仙里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000120018", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國中", "RasinStCode": "A1A9U0", "H1": 43.5, "H3": 120.5, "H6": 173, "H12": 18.5, "H24": 157.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4599, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "八仙里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000120018", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國中", "RasinStCode": "A1A9U0", "H1": 43.5, "H3": 120.5, "H6": 173, "H12": 18.5, "H24": 157.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 6246, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "八仙里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "63000120018", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國", "RasinStCode": "A1A9U0", "H1": 141, "H3": 175.5, "H6": 176, "H12": 180, "H24": 184 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7609, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "八仙里", "FloodEventCode": "R00474", "FloodEventYear": 2019, "VILLAGESN": "63000120018", "COUNID": 1, "TOWNID": 112, "RainStName": "奇岩", "RasinStCode": "A1AB70", "H1": 60.5, "H3": 139.5, "H6": 172, "H12": 172, "H24": 172 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 8166, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "八仙里", "FloodEventCode": "T1918", "FloodEventYear": 2019, "VILLAGESN": "63000120018", "COUNID": 1, "TOWNID": 112, "RainStName": "奇岩", "RasinStCode": "A1AB70", "H1": 42, "H3": 80.5, "H6": 99.5, "H12": 121, "H24": 138 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 10, "H6": 10.5, "H12": 20, "H24": 36.5, "D1": 20, "D2": 61, "D3": 111, "FloodWarnInfo": "正常", "ST_NO": "A1A9U0", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0.5, "H2": 0, "H3": 3, "H6": 3, "H12": 14, "H24": 35, "D1": 14, "D2": 53.5, "D3": 75.5, "FloodWarnInfo": "正常", "ST_NO": "C0A980", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 30, "S3時": 60.5, "S6時": 99.5, "S12時": 18.5, "S24時": 138 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000120037", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3030, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "一德里", "FloodEventCode": "B00276", "FloodEventYear": 2012, "VILLAGESN": "63000120037", "COUNID": 1, "TOWNID": 112, "RainStName": "關渡", "RasinStCode": "C1AC50", "H1": 47, "H3": 56.5, "H6": 61, "H12": 61, "H24": 61 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3500, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "一德里", "FloodEventCode": "T1312", "FloodEventYear": 2013, "VILLAGESN": "63000120037", "COUNID": 1, "TOWNID": 112, "RainStName": "社子", "RasinStCode": "C0A980", "H1": 38, "H3": 75, "H6": 105, "H12": 142.5, "H24": 217 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4601, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "一德里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000120037", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國中", "RasinStCode": "A1A9U0", "H1": 43.5, "H3": 120.5, "H6": 173, "H12": 18.5, "H24": 157.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4602, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "一德里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000120037", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國中", "RasinStCode": "A1A9U0", "H1": 43.5, "H3": 120.5, "H6": 173, "H12": 18.5, "H24": 157.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 6254, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "一德里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "63000120037", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國", "RasinStCode": "A1A9U0", "H1": 141, "H3": 175.5, "H6": 176, "H12": 180, "H24": 184 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7616, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "一德里", "FloodEventCode": "R00474", "FloodEventYear": 2019, "VILLAGESN": "63000120037", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國", "RasinStCode": "A1A9U0", "H1": 84.5, "H3": 177, "H6": 210, "H12": 210, "H24": 210 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 10, "H6": 10.5, "H12": 20, "H24": 36.5, "D1": 20, "D2": 61, "D3": 111, "FloodWarnInfo": "正常", "ST_NO": "A1A9U0", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0.5, "H2": 0, "H3": 3, "H6": 3, "H12": 14, "H24": 35, "D1": 14, "D2": 53.5, "D3": 75.5, "FloodWarnInfo": "正常", "ST_NO": "C0A980", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0.5, "H2": 0, "H3": 6, "H6": 6.5, "H12": 17.5, "H24": 38, "D1": 17.5, "D2": 63, "D3": 122, "FloodWarnInfo": "正常", "ST_NO": "C1AC50", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 38, "S3時": 56.5, "S6時": 61, "S12時": 18.5, "S24時": 61 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000080014", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3996, "CountyName": "臺北市", "TownName": "文山區", "VillageName": "興光里", "FloodEventCode": "R00193", "FloodEventYear": 2014, "VILLAGESN": "63000080014", "COUNID": 1, "TOWNID": 116, "RainStName": "文山", "RasinStCode": "C0AC80", "H1": 46, "H3": 85, "H6": 158.5, "H12": 195, "H24": 270.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5459, "CountyName": "臺北市", "TownName": "文山區", "VillageName": "興光里", "FloodEventCode": "R00278", "FloodEventYear": 2016, "VILLAGESN": "63000080014", "COUNID": 1, "TOWNID": 116, "RainStName": "博嘉國小", "RasinStCode": "A1AA90", "H1": 44.5, "H3": 49, "H6": 52, "H12": 52, "H24": 52 }], "RAIN": [{ "M10": 0, "H1": 4.5, "H2": 0, "H3": 6, "H6": 6.5, "H12": 24.5, "H24": 74, "D1": 27, "D2": 96.5, "D3": 130.5, "FloodWarnInfo": "正常", "ST_NO": "A1AA90", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 5.5, "H2": 0, "H3": 6.5, "H6": 7, "H12": 25, "H24": 78, "D1": 27.5, "D2": 100.5, "D3": 134.5, "FloodWarnInfo": "正常", "ST_NO": "C0AC80", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 44.5, "S3時": 49, "S6時": 52, "S12時": 52, "S24時": 52 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000110046", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4523, "CountyName": "臺北市", "TownName": "士林區", "VillageName": "陽明里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000110046", "COUNID": 1, "TOWNID": 111, "RainStName": "格致國中", "RasinStCode": "A1AA10", "H1": 4.5, "H3": 4.5, "H6": 4.5, "H12": 4.5, "H24": 4.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4524, "CountyName": "臺北市", "TownName": "士林區", "VillageName": "陽明里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000110046", "COUNID": 1, "TOWNID": 111, "RainStName": "格致國中", "RasinStCode": "A1AA10", "H1": 4.5, "H3": 4.5, "H6": 4.5, "H12": 4.5, "H24": 4.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7623, "CountyName": "臺北市", "TownName": "士林區", "VillageName": "陽明里", "FloodEventCode": "R00474", "FloodEventYear": 2019, "VILLAGESN": "63000110046", "COUNID": 1, "TOWNID": 111, "RainStName": "格致國", "RasinStCode": "A1AA10", "H1": 53, "H3": 119, "H6": 150, "H12": 150, "H24": 150 }], "RAIN": [{ "M10": 0, "H1": 0.5, "H2": 0, "H3": 7, "H6": 12, "H12": 34.5, "H24": 116, "D1": 35.5, "D2": 141.5, "D3": 164.5, "FloodWarnInfo": "正常", "ST_NO": "A1AA10", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 4.5, "S3時": 4.5, "S6時": 4.5, "S12時": 4.5, "S24時": 4.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000040042", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4537, "CountyName": "臺北市", "TownName": "中山區", "VillageName": "北安里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000040042", "COUNID": 1, "TOWNID": 104, "RainStName": "金面", "RasinStCode": "A1AG80", "H1": 7.5, "H3": 7.5, "H6": 7.5, "H12": 8.5, "H24": 8.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 6215, "CountyName": "臺北市", "TownName": "中山區", "VillageName": "北安里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "63000040042", "COUNID": 1, "TOWNID": 104, "RainStName": "劍南", "RasinStCode": "A1AD50", "H1": 154, "H3": 154, "H6": 154, "H12": 154, "H24": 154 }], "RAIN": [{ "M10": 0, "H1": 1.5, "H2": 0, "H3": 15.5, "H6": 19, "H12": 32, "H24": 86, "D1": 36, "D2": 104, "D3": 126, "FloodWarnInfo": "正常", "ST_NO": "A1AD50", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0.5, "H2": 0, "H3": 1.5, "H6": 3.5, "H12": 14.5, "H24": 53, "D1": 16.5, "D2": 73, "D3": 98, "FloodWarnInfo": "正常", "ST_NO": "A1AG80", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 7.5, "S3時": 7.5, "S6時": 7.5, "S12時": 8.5, "S24時": 8.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000120038", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4597, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "關渡里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000120038", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國中", "RasinStCode": "A1A9U0", "H1": 43.5, "H3": 120.5, "H6": 173, "H12": 18.5, "H24": 157.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4600, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "關渡里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000120038", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國中", "RasinStCode": "A1A9U0", "H1": 43.5, "H3": 120.5, "H6": 173, "H12": 18.5, "H24": 157.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7608, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "關渡里", "FloodEventCode": "R00474", "FloodEventYear": 2019, "VILLAGESN": "63000120038", "COUNID": 1, "TOWNID": 112, "RainStName": "社子", "RasinStCode": "C0A980", "H1": 61, "H3": 125, "H6": 151, "H12": 151.5, "H24": 151.5 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 10, "H6": 10.5, "H12": 20, "H24": 36.5, "D1": 20, "D2": 61, "D3": 111, "FloodWarnInfo": "正常", "ST_NO": "A1A9U0", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0.5, "H2": 0, "H3": 3, "H6": 3, "H12": 14, "H24": 35, "D1": 14, "D2": 53.5, "D3": 75.5, "FloodWarnInfo": "正常", "ST_NO": "C0A980", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 43.5, "S3時": 120.5, "S6時": 151, "S12時": 18.5, "S24時": 151.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000120036", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4603, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "桃源里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000120036", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國中", "RasinStCode": "A1A9U0", "H1": 43.5, "H3": 120.5, "H6": 173, "H12": 18.5, "H24": 157.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 6256, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "桃源里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "63000120036", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國", "RasinStCode": "A1A9U0", "H1": 141, "H3": 175.5, "H6": 176, "H12": 180, "H24": 184 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7366, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "桃源里", "FloodEventCode": "R00448", "FloodEventYear": 2018, "VILLAGESN": "63000120036", "COUNID": 1, "TOWNID": 112, "RainStName": "稻香", "RasinStCode": "A1AG30", "H1": 76, "H3": 131.5, "H6": 148.5, "H12": 179, "H24": 250 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7618, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "桃源里", "FloodEventCode": "R00474", "FloodEventYear": 2019, "VILLAGESN": "63000120036", "COUNID": 1, "TOWNID": 112, "RainStName": "桃源國", "RasinStCode": "A1A9U0", "H1": 84.5, "H3": 177, "H6": 210, "H12": 210, "H24": 210 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 10, "H6": 10.5, "H12": 20, "H24": 36.5, "D1": 20, "D2": 61, "D3": 111, "FloodWarnInfo": "正常", "ST_NO": "A1A9U0", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 1, "H2": 0, "H3": 6.5, "H6": 7.5, "H12": 14, "H24": 39.5, "D1": 14, "D2": 69.5, "D3": 146, "FloodWarnInfo": "正常", "ST_NO": "A1AG30", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 43.5, "S3時": 120.5, "S6時": 148.5, "S12時": 18.5, "S24時": 157.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000120040", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4605, "CountyName": "臺北市", "TownName": "北投區", "VillageName": "湖山里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "63000120040", "COUNID": 1, "TOWNID": 112, "RainStName": "格致國中", "RasinStCode": "A1AA10", "H1": 4.5, "H3": 4.5, "H6": 4.5, "H12": 4.5, "H24": 4.5 }], "RAIN": [{ "M10": 0, "H1": 0.5, "H2": 0, "H3": 7, "H6": 12, "H12": 34.5, "H24": 116, "D1": 35.5, "D2": 141.5, "D3": 164.5, "FloodWarnInfo": "正常", "ST_NO": "A1AA10", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 4.5, "S3時": 4.5, "S6時": 4.5, "S12時": 4.5, "S24時": 4.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000090018", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5467, "CountyName": "臺北市", "TownName": "南港區", "VillageName": "九如里", "FloodEventCode": "R00278", "FloodEventYear": 2016, "VILLAGESN": "63000090018", "COUNID": 1, "TOWNID": 115, "RainStName": "四獸", "RasinStCode": "A1AG40", "H1": 1.5, "H3": 3.5, "H6": 3.5, "H12": 3.5, "H24": 3.5 }], "RAIN": [{ "M10": 0, "H1": 1, "H2": 0, "H3": 16.5, "H6": 17.5, "H12": 25, "H24": 53.5, "D1": 25.5, "D2": 76.5, "D3": 104, "FloodWarnInfo": "正常", "ST_NO": "A1AG40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 1.5, "S3時": 3.5, "S6時": 3.5, "S12時": 3.5, "S24時": 3.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000090011", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5475, "CountyName": "臺北市", "TownName": "南港區", "VillageName": "成福里", "FloodEventCode": "R00278", "FloodEventYear": 2016, "VILLAGESN": "63000090011", "COUNID": 1, "TOWNID": 115, "RainStName": "玉成", "RasinStCode": "A1AB40", "H1": 1, "H3": 1, "H6": 1, "H12": 1, "H24": 1 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 8143, "CountyName": "臺北市", "TownName": "南港區", "VillageName": "成福里", "FloodEventCode": "T1918", "FloodEventYear": 2019, "VILLAGESN": "63000090011", "COUNID": 1, "TOWNID": 115, "RainStName": "留公國", "RasinStCode": "A1AA60", "H1": 62.5, "H3": 110.5, "H6": 162.5, "H12": 200.5, "H24": 240 }], "RAIN": [{ "M10": 0, "H1": 1, "H2": 0, "H3": 16, "H6": 16.5, "H12": 23, "H24": 52, "D1": 25, "D2": 71, "D3": 96, "FloodWarnInfo": "正常", "ST_NO": "A1AA60", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 2, "H2": 0, "H3": 17, "H6": 18, "H12": 26, "H24": 52, "D1": 27, "D2": 70.5, "D3": 92, "FloodWarnInfo": "正常", "ST_NO": "A1AB40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 1, "S3時": 1, "S6時": 1, "S12時": 1, "S24時": 1 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "63000040015", "COUNID": 1, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 6205, "CountyName": "臺北市", "TownName": "中山區", "VillageName": "成功里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "63000040015", "COUNID": 1, "TOWNID": 104, "RainStName": "劍南", "RasinStCode": "A1AD50", "H1": 154, "H3": 154, "H6": 154, "H12": 154, "H24": 154 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7987, "CountyName": "臺北市", "TownName": "中山區", "VillageName": "成功里", "FloodEventCode": "R00497", "FloodEventYear": 2019, "VILLAGESN": "63000040015", "COUNID": 1, "TOWNID": 104, "RainStName": "劍南", "RasinStCode": "A1AD50", "H1": 59, "H3": 62, "H6": 62, "H12": 64, "H24": 65 }], "RAIN": [{ "M10": 0, "H1": 1.5, "H2": 0, "H3": 15.5, "H6": 19, "H12": 32, "H24": 86, "D1": 36, "D2": 104, "D3": 126, "FloodWarnInfo": "正常", "ST_NO": "A1AD50", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 59, "S3時": 62, "S6時": 62, "S12時": 64, "S24時": 65 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "64000380002", "COUNID": 2, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4745, "CountyName": "高雄市", "TownName": "那瑪夏區", "VillageName": "瑪雅里", "FloodEventCode": "R00224", "FloodEventYear": 2015, "VILLAGESN": "64000380002", "COUNID": 2, "TOWNID": 849, "RainStName": "復興", "RasinStCode": "C0C460", "H1": 61, "H3": 115.5, "H6": 211.5, "H12": 325, "H24": 399 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3628, "CountyName": "高雄市", "TownName": "那瑪夏區", "VillageName": "瑪雅里", "FloodEventCode": "R00146", "FloodEventYear": 2013, "VILLAGESN": "64000380002", "COUNID": 2, "TOWNID": 849, "RainStName": "表湖", "RasinStCode": "C0V150", "H1": 52, "H3": 91.5, "H6": 117.5, "H12": 147.5, "H24": 151 }], "RAIN": [{ "M10": 0, "H1": 2.5, "H2": 0, "H3": 4, "H6": 25.5, "H12": 50, "H24": 161, "D1": 52, "D2": 174, "D3": 268.5, "FloodWarnInfo": "正常", "ST_NO": "C0C460", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 52, "S3時": 91.5, "S6時": 117.5, "S12時": 147.5, "S24時": 151 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000100020", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 8361, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "八勢里", "FloodEventCode": "T2004", "FloodEventYear": 2020, "VILLAGESN": "65000100020", "COUNID": 3, "TOWNID": 251, "RainStName": "淡水", "RasinStCode": "466900", "H1": 98, "H3": 120.5, "H6": 145.5, "H12": 165.5, "H24": 168.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4463, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "八勢里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000100020", "COUNID": 3, "TOWNID": 251, "RainStName": "桃源國中", "RasinStCode": "A1A9U0", "H1": 43.5, "H3": 120.5, "H6": 173, "H12": 18.5, "H24": 157.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4664, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "八勢里", "FloodEventCode": "T1521", "FloodEventYear": 2015, "VILLAGESN": "65000100020", "COUNID": 3, "TOWNID": 251, "RainStName": "淡水", "RasinStCode": "466900", "H1": 53, "H3": 123, "H6": 184.5, "H12": 204, "H24": 261.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4665, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "八勢里", "FloodEventCode": "T1521", "FloodEventYear": 2015, "VILLAGESN": "65000100020", "COUNID": 3, "TOWNID": 251, "RainStName": "淡水", "RasinStCode": "466900", "H1": 53, "H3": 123, "H6": 184.5, "H12": 204, "H24": 261.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 6008, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "八勢里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "65000100020", "COUNID": 3, "TOWNID": 251, "RainStName": "關渡", "RasinStCode": "C1AC50", "H1": 91, "H3": 179.5, "H6": 206, "H12": 261.5, "H24": 267 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7576, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "八勢里", "FloodEventCode": "R00474", "FloodEventYear": 2019, "VILLAGESN": "65000100020", "COUNID": 3, "TOWNID": 251, "RainStName": "淡水", "RasinStCode": "466900", "H1": 78, "H3": 187.5, "H6": 222, "H12": 222.5, "H24": 222.5 }], "RAIN": [{ "M10": 0, "H1": 0.5, "H2": 0, "H3": 6.5, "H6": 6.5, "H12": 18, "H24": 31, "D1": 18, "D2": 74, "D3": 93, "FloodWarnInfo": "正常", "ST_NO": "466900", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0, "H2": 0, "H3": 10, "H6": 10.5, "H12": 20, "H24": 36.5, "D1": 20, "D2": 61, "D3": 111, "FloodWarnInfo": "正常", "ST_NO": "A1A9U0", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0.5, "H2": 0, "H3": 6, "H6": 6.5, "H12": 17.5, "H24": 38, "D1": 17.5, "D2": 63, "D3": 122, "FloodWarnInfo": "正常", "ST_NO": "C1AC50", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 43.5, "S3時": 120.5, "S6時": 145.5, "S12時": 18.5, "S24時": 157.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000070028", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 2187, "CountyName": "新北市", "TownName": "樹林區", "VillageName": "圳福里", "FloodEventCode": "T0813", "FloodEventYear": 2008, "VILLAGESN": "65000070028", "COUNID": 3, "TOWNID": 238, "RainStName": "山佳", "RasinStCode": "C0A520", "H1": 35, "H3": 83.5, "H6": 136.5, "H12": 194, "H24": 264 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3578, "CountyName": "新北市", "TownName": "樹林區", "VillageName": "圳福里", "FloodEventCode": "R00161", "FloodEventYear": 2013, "VILLAGESN": "65000070028", "COUNID": 3, "TOWNID": 238, "RainStName": "板橋", "RasinStCode": "466880", "H1": 44.5, "H3": 45, "H6": 45, "H12": 45, "H24": 45 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4505, "CountyName": "新北市", "TownName": "樹林區", "VillageName": "圳福里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000070028", "COUNID": 3, "TOWNID": 238, "RainStName": "板橋", "RasinStCode": "466880", "H1": 39, "H3": 88.5, "H6": 168.5, "H12": 240, "H24": 249 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 3.5, "H6": 10.5, "H12": 17.5, "H24": 41.5, "D1": 17.5, "D2": 59.5, "D3": 86.5, "FloodWarnInfo": "正常", "ST_NO": "466880", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0, "H2": 0, "H3": 5.5, "H6": 13, "H12": 33, "H24": 55.5, "D1": 33, "D2": 75, "D3": 111, "FloodWarnInfo": "正常", "ST_NO": "C0A520", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 35, "S3時": 45, "S6時": 45, "S12時": 45, "S24時": 45 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000230003", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3027, "CountyName": "新北市", "TownName": "八里區", "VillageName": "大崁里", "FloodEventCode": "B00276", "FloodEventYear": 2012, "VILLAGESN": "65000230003", "COUNID": 3, "TOWNID": 249, "RainStName": "八里", "RasinStCode": "C0AD10", "H1": 45.5, "H3": 58, "H6": 60, "H12": 60, "H24": 60 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3483, "CountyName": "新北市", "TownName": "八里區", "VillageName": "大崁里", "FloodEventCode": "T1312", "FloodEventYear": 2013, "VILLAGESN": "65000230003", "COUNID": 3, "TOWNID": 249, "RainStName": "關渡", "RasinStCode": "C1AC50", "H1": 37, "H3": 71.5, "H6": 100, "H12": 145.5, "H24": 232 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3920, "CountyName": "新北市", "TownName": "八里區", "VillageName": "大崁里", "FloodEventCode": "R00191", "FloodEventYear": 2014, "VILLAGESN": "65000230003", "COUNID": 3, "TOWNID": 249, "RainStName": "關渡", "RasinStCode": "C1AC50", "H1": 30, "H3": 30.5, "H6": 30.5, "H12": 33.5, "H24": 33.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5365, "CountyName": "新北市", "TownName": "八里區", "VillageName": "大崁里", "FloodEventCode": "R00271", "FloodEventYear": 2016, "VILLAGESN": "65000230003", "COUNID": 3, "TOWNID": 249, "RainStName": "淡水", "RasinStCode": "466900", "H1": 54.5, "H3": 114.5, "H6": 129, "H12": 129, "H24": 129 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 6016, "CountyName": "新北市", "TownName": "八里區", "VillageName": "大崁里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "65000230003", "COUNID": 3, "TOWNID": 249, "RainStName": "八里", "RasinStCode": "C0AD10", "H1": 101, "H3": 175.5, "H6": 207, "H12": 287.5, "H24": 291.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7579, "CountyName": "新北市", "TownName": "八里區", "VillageName": "大崁里", "FloodEventCode": "R00474", "FloodEventYear": 2019, "VILLAGESN": "65000230003", "COUNID": 3, "TOWNID": 249, "RainStName": "八里", "RasinStCode": "C0AD10", "H1": 78, "H3": 187.5, "H6": 222, "H12": 222.5, "H24": 222.5 }], "RAIN": [{ "M10": 0, "H1": 0.5, "H2": 0, "H3": 6.5, "H6": 6.5, "H12": 18, "H24": 31, "D1": 18, "D2": 74, "D3": 93, "FloodWarnInfo": "正常", "ST_NO": "466900", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0, "H2": 0, "H3": 0, "H6": 0.5, "H12": 11, "H24": 17.5, "D1": 11, "D2": 49.5, "D3": 59, "FloodWarnInfo": "正常", "ST_NO": "C0AD10", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0.5, "H2": 0, "H3": 6, "H6": 6.5, "H12": 17.5, "H24": 38, "D1": 17.5, "D2": 63, "D3": 122, "FloodWarnInfo": "正常", "ST_NO": "C1AC50", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 30, "S3時": 30.5, "S6時": 30.5, "S12時": 33.5, "S24時": 33.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000100018", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3032, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "竹圍里", "FloodEventCode": "B00276", "FloodEventYear": 2012, "VILLAGESN": "65000100018", "COUNID": 3, "TOWNID": 251, "RainStName": "關渡", "RasinStCode": "C1AC50", "H1": 47, "H3": 56.5, "H6": 61, "H12": 61, "H24": 61 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3046, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "竹圍里", "FloodEventCode": "R00119", "FloodEventYear": 2012, "VILLAGESN": "65000100018", "COUNID": 3, "TOWNID": 251, "RainStName": "關渡", "RasinStCode": "C1AC50", "H1": 36.5, "H3": 52.5, "H6": 93.5, "H12": 169, "H24": 205 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4462, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "竹圍里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000100018", "COUNID": 3, "TOWNID": 251, "RainStName": "桃源國中", "RasinStCode": "A1A9U0", "H1": 43.5, "H3": 120.5, "H6": 173, "H12": 18.5, "H24": 157.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7569, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "竹圍里", "FloodEventCode": "R00474", "FloodEventYear": 2019, "VILLAGESN": "65000100018", "COUNID": 3, "TOWNID": 251, "RainStName": "關渡", "RasinStCode": "C1AC50", "H1": 89, "H3": 180.5, "H6": 211.5, "H12": 211.5, "H24": 211.5 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 10, "H6": 10.5, "H12": 20, "H24": 36.5, "D1": 20, "D2": 61, "D3": 111, "FloodWarnInfo": "正常", "ST_NO": "A1A9U0", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0.5, "H2": 0, "H3": 6, "H6": 6.5, "H12": 17.5, "H24": 38, "D1": 17.5, "D2": 63, "D3": 122, "FloodWarnInfo": "正常", "ST_NO": "C1AC50", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 36.5, "S3時": 52.5, "S6時": 61, "S12時": 18.5, "S24時": 61 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000100017", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3047, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "福德里", "FloodEventCode": "R00119", "FloodEventYear": 2012, "VILLAGESN": "65000100017", "COUNID": 3, "TOWNID": 251, "RainStName": "關渡", "RasinStCode": "C1AC50", "H1": 36.5, "H3": 52.5, "H6": 93.5, "H12": 169, "H24": 205 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4461, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "福德里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000100017", "COUNID": 3, "TOWNID": 251, "RainStName": "桃源國中", "RasinStCode": "A1A9U0", "H1": 43.5, "H3": 120.5, "H6": 173, "H12": 18.5, "H24": 157.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 6001, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "福德里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "65000100017", "COUNID": 3, "TOWNID": 251, "RainStName": "關渡", "RasinStCode": "C1AC50", "H1": 91, "H3": 179.5, "H6": 206, "H12": 261.5, "H24": 267 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7891, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "福德里", "FloodEventCode": "R00496", "FloodEventYear": 2019, "VILLAGESN": "65000100017", "COUNID": 3, "TOWNID": 251, "RainStName": "關渡", "RasinStCode": "C1AC50", "H1": 71, "H3": 82.5, "H6": 82.5, "H12": 82.5, "H24": 82.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7568, "CountyName": "新北市", "TownName": "淡水區", "VillageName": "福德里", "FloodEventCode": "R00474", "FloodEventYear": 2019, "VILLAGESN": "65000100017", "COUNID": 3, "TOWNID": 251, "RainStName": "關渡", "RasinStCode": "C1AC50", "H1": 89, "H3": 180.5, "H6": 211.5, "H12": 211.5, "H24": 211.5 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 10, "H6": 10.5, "H12": 20, "H24": 36.5, "D1": 20, "D2": 61, "D3": 111, "FloodWarnInfo": "正常", "ST_NO": "A1A9U0", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0.5, "H2": 0, "H3": 6, "H6": 6.5, "H12": 17.5, "H24": 38, "D1": 17.5, "D2": 63, "D3": 122, "FloodWarnInfo": "正常", "ST_NO": "C1AC50", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 36.5, "S3時": 52.5, "S6時": 82.5, "S12時": 18.5, "S24時": 82.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000070025", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3152, "CountyName": "新北市", "TownName": "樹林區", "VillageName": "北園里", "FloodEventCode": "R00119", "FloodEventYear": 2012, "VILLAGESN": "65000070025", "COUNID": 3, "TOWNID": 238, "RainStName": "山佳", "RasinStCode": "C0A520", "H1": 55, "H3": 136.5, "H6": 160.5, "H12": 236, "H24": 278 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3606, "CountyName": "新北市", "TownName": "樹林區", "VillageName": "北園里", "FloodEventCode": "R00161", "FloodEventYear": 2013, "VILLAGESN": "65000070025", "COUNID": 3, "TOWNID": 238, "RainStName": "山佳", "RasinStCode": "C0A520", "H1": 48, "H3": 49, "H6": 49, "H12": 49, "H24": 49 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 5.5, "H6": 13, "H12": 33, "H24": 55.5, "D1": 33, "D2": 75, "D3": 111, "FloodWarnInfo": "正常", "ST_NO": "C0A520", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 48, "S3時": 49, "S6時": 49, "S12時": 49, "S24時": 49 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000070016", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3155, "CountyName": "新北市", "TownName": "樹林區", "VillageName": "彭厝里", "FloodEventCode": "R00119", "FloodEventYear": 2012, "VILLAGESN": "65000070016", "COUNID": 3, "TOWNID": 238, "RainStName": "山佳", "RasinStCode": "C0A520", "H1": 55, "H3": 136.5, "H6": 160.5, "H12": 236, "H24": 278 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3649, "CountyName": "新北市", "TownName": "樹林區", "VillageName": "彭厝里", "FloodEventCode": "R00161", "FloodEventYear": 2013, "VILLAGESN": "65000070016", "COUNID": 3, "TOWNID": 238, "RainStName": "土城", "RasinStCode": "C0AD40", "H1": 54.5, "H3": 55, "H6": 55, "H12": 55, "H24": 55 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4501, "CountyName": "新北市", "TownName": "樹林區", "VillageName": "彭厝里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000070016", "COUNID": 3, "TOWNID": 238, "RainStName": "土城", "RasinStCode": "C0AD40", "H1": 36.5, "H3": 86.5, "H6": 155.5, "H12": 230.5, "H24": 239 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 5.5, "H6": 13, "H12": 33, "H24": 55.5, "D1": 33, "D2": 75, "D3": 111, "FloodWarnInfo": "正常", "ST_NO": "C0A520", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0, "H2": 0, "H3": 3.5, "H6": 11, "H12": 22, "H24": 54.5, "D1": 22, "D2": 68, "D3": 113.5, "FloodWarnInfo": "正常", "ST_NO": "C0AD40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 36.5, "S3時": 55, "S6時": 55, "S12時": 55, "S24時": 55 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000060056", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3097, "CountyName": "新北市", "TownName": "新店區", "VillageName": "安和里", "FloodEventCode": "R00119", "FloodEventYear": 2012, "VILLAGESN": "65000060056", "COUNID": 3, "TOWNID": 231, "RainStName": "中和", "RasinStCode": "C0AG90", "H1": 44, "H3": 111.5, "H6": 202, "H12": 365, "H24": 391.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4487, "CountyName": "新北市", "TownName": "新店區", "VillageName": "安和里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000060056", "COUNID": 3, "TOWNID": 231, "RainStName": "精忠", "RasinStCode": "81AH40", "H1": 3.5, "H3": 4, "H6": 4.5, "H12": 5, "H24": 5.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4488, "CountyName": "新北市", "TownName": "新店區", "VillageName": "安和里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000060056", "COUNID": 3, "TOWNID": 231, "RainStName": "精忠", "RasinStCode": "81AH40", "H1": 3.5, "H3": 4, "H6": 4.5, "H12": 5, "H24": 5.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4489, "CountyName": "新北市", "TownName": "新店區", "VillageName": "安和里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000060056", "COUNID": 3, "TOWNID": 231, "RainStName": "精忠", "RasinStCode": "81AH40", "H1": 3.5, "H3": 4, "H6": 4.5, "H12": 5, "H24": 5.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4671, "CountyName": "新北市", "TownName": "新店區", "VillageName": "安和里", "FloodEventCode": "T1521", "FloodEventYear": 2015, "VILLAGESN": "65000060056", "COUNID": 3, "TOWNID": 231, "RainStName": "精忠", "RasinStCode": "81AH40", "H1": 2, "H3": 3, "H6": 4, "H12": 4.5, "H24": 6 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4712, "CountyName": "新北市", "TownName": "新店區", "VillageName": "安和里", "FloodEventCode": "R00239", "FloodEventYear": 2015, "VILLAGESN": "65000060056", "COUNID": 3, "TOWNID": 231, "RainStName": "仙跡", "RasinStCode": "A1AG70", "H1": 41.5, "H3": 54, "H6": 57.5, "H12": 57.5, "H24": 57.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4714, "CountyName": "新北市", "TownName": "新店區", "VillageName": "安和里", "FloodEventCode": "R00235", "FloodEventYear": 2015, "VILLAGESN": "65000060056", "COUNID": 3, "TOWNID": 231, "RainStName": "仙跡", "RasinStCode": "A1AG70", "H1": 36.5, "H3": 41.5, "H6": 50.5, "H12": 56.5, "H24": 57 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7894, "CountyName": "新北市", "TownName": "新店區", "VillageName": "安和里", "FloodEventCode": "R00497", "FloodEventYear": 2019, "VILLAGESN": "65000060056", "COUNID": 3, "TOWNID": 231, "RainStName": "新店", "RasinStCode": "A0A9M0", "H1": 74.5, "H3": 100, "H6": 100, "H12": 102, "H24": 102.5 }], "RAIN": [{ "M10": 0, "H1": 0.5, "H2": 0, "H3": 5, "H6": 12.5, "H12": 22, "H24": 78.5, "D1": 23, "D2": 104.5, "D3": 148, "FloodWarnInfo": "正常", "ST_NO": "81AH40", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0, "H2": 0, "H3": 6.5, "H6": 15.5, "H12": 31, "H24": 94, "D1": 31.5, "D2": 120, "D3": 164.5, "FloodWarnInfo": "正常", "ST_NO": "A0A9M0", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0, "H2": 0, "H3": 2.5, "H6": 4, "H12": 13, "H24": 53, "D1": 15, "D2": 72, "D3": 108, "FloodWarnInfo": "正常", "ST_NO": "A1AG70", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 2, "S3時": 3, "S6時": 4, "S12時": 4.5, "S24時": 5.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000010065", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3215, "CountyName": "新北市", "TownName": "板橋區", "VillageName": "深丘里", "FloodEventCode": "R00119", "FloodEventYear": 2012, "VILLAGESN": "65000010065", "COUNID": 3, "TOWNID": 220, "RainStName": "板橋", "RasinStCode": "466880", "H1": 65, "H3": 158, "H6": 267, "H12": 402.5, "H24": 420 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3917, "CountyName": "新北市", "TownName": "板橋區", "VillageName": "深丘里", "FloodEventCode": "R00191", "FloodEventYear": 2014, "VILLAGESN": "65000010065", "COUNID": 3, "TOWNID": 220, "RainStName": "中和", "RasinStCode": "C0AG90", "H1": 26, "H3": 36.4, "H6": 38, "H12": 38.5, "H24": 38.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3841, "CountyName": "新北市", "TownName": "板橋區", "VillageName": "深丘里", "FloodEventCode": "R00161", "FloodEventYear": 2013, "VILLAGESN": "65000010065", "COUNID": 3, "TOWNID": 220, "RainStName": "中和", "RasinStCode": "C0AG90", "H1": 81, "H3": 81, "H6": 81, "H12": 81, "H24": 81 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 3.5, "H6": 10.5, "H12": 17.5, "H24": 41.5, "D1": 17.5, "D2": 59.5, "D3": 86.5, "FloodWarnInfo": "正常", "ST_NO": "466880", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 26, "S3時": 36.4, "S6時": 38, "S12時": 38.5, "S24時": 38.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000060034", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3531, "CountyName": "新北市", "TownName": "新店區", "VillageName": "文中里", "FloodEventCode": "T1312", "FloodEventYear": 2013, "VILLAGESN": "65000060034", "COUNID": 3, "TOWNID": 231, "RainStName": "屈尺", "RasinStCode": "C0A580", "H1": 41, "H3": 85, "H6": 156, "H12": 216, "H24": 260 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4481, "CountyName": "新北市", "TownName": "新店區", "VillageName": "文中里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000060034", "COUNID": 3, "TOWNID": 231, "RainStName": "精忠", "RasinStCode": "81AH40", "H1": 3.5, "H3": 4, "H6": 4.5, "H12": 5, "H24": 5.5 }], "RAIN": [{ "M10": 0, "H1": 0.5, "H2": 0, "H3": 5, "H6": 12.5, "H12": 22, "H24": 78.5, "D1": 23, "D2": 104.5, "D3": 148, "FloodWarnInfo": "正常", "ST_NO": "81AH40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 3.5, "S3時": 4, "S6時": 4.5, "S12時": 5, "S24時": 5.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000050043", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3574, "CountyName": "新北市", "TownName": "新莊區", "VillageName": "丹鳳里", "FloodEventCode": "R00161", "FloodEventYear": 2013, "VILLAGESN": "65000050043", "COUNID": 3, "TOWNID": 242, "RainStName": "板橋", "RasinStCode": "466880", "H1": 44.5, "H3": 45, "H6": 45, "H12": 45, "H24": 45 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4499, "CountyName": "新北市", "TownName": "新莊區", "VillageName": "丹鳳里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000050043", "COUNID": 3, "TOWNID": 242, "RainStName": "板橋", "RasinStCode": "466880", "H1": 39, "H3": 88.5, "H6": 168.5, "H12": 240, "H24": 249 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7553, "CountyName": "新北市", "TownName": "新莊區", "VillageName": "丹鳳里", "FloodEventCode": "R00474", "FloodEventYear": 2019, "VILLAGESN": "65000050043", "COUNID": 3, "TOWNID": 242, "RainStName": "龜山", "RasinStCode": "C0C680", "H1": 82.5, "H3": 106.5, "H6": 112, "H12": 113.5, "H24": 113.5 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 3.5, "H6": 10.5, "H12": 17.5, "H24": 41.5, "D1": 17.5, "D2": 59.5, "D3": 86.5, "FloodWarnInfo": "正常", "ST_NO": "466880", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0, "H2": 0, "H3": 5, "H6": 13, "H12": 33.5, "H24": 45.5, "D1": 34.5, "D2": 74, "D3": 109, "FloodWarnInfo": "正常", "ST_NO": "C0C680", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 39, "S3時": 45, "S6時": 45, "S12時": 45, "S24時": 45 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000090010", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3619, "CountyName": "新北市", "TownName": "三峽區", "VillageName": "大埔里", "FloodEventCode": "R00161", "FloodEventYear": 2013, "VILLAGESN": "65000090010", "COUNID": 3, "TOWNID": 237, "RainStName": "復興", "RasinStCode": "C0C460", "H1": 49, "H3": 94.5, "H6": 94.5, "H12": 94.5, "H24": 94.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5284, "CountyName": "新北市", "TownName": "三峽區", "VillageName": "大埔里", "FloodEventCode": "R00265", "FloodEventYear": 2016, "VILLAGESN": "65000090010", "COUNID": 3, "TOWNID": 237, "RainStName": "三峽", "RasinStCode": "01A220", "H1": 64, "H3": 91, "H6": 92, "H12": 92, "H24": 92 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4403, "CountyName": "新北市", "TownName": "三峽區", "VillageName": "大埔里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000090010", "COUNID": 3, "TOWNID": 237, "RainStName": "三峽", "RasinStCode": "01A220", "H1": 48, "H3": 118, "H6": 192, "H12": 244, "H24": 249 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 2, "H6": 10, "H12": 22, "H24": 61, "D1": 22, "D2": 75, "D3": 138, "FloodWarnInfo": "正常", "ST_NO": "01A220", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 2.5, "H2": 0, "H3": 4, "H6": 25.5, "H12": 50, "H24": 161, "D1": 52, "D2": 174, "D3": 268.5, "FloodWarnInfo": "正常", "ST_NO": "C0C460", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 48, "S3時": 91, "S6時": 92, "S12時": 92, "S24時": 92 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000090019", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3918, "CountyName": "新北市", "TownName": "三峽區", "VillageName": "溪東里", "FloodEventCode": "R00191", "FloodEventYear": 2014, "VILLAGESN": "65000090019", "COUNID": 3, "TOWNID": 237, "RainStName": "土城", "RasinStCode": "C0AD40", "H1": 26.5, "H3": 40, "H6": 41, "H12": 41, "H24": 41 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4405, "CountyName": "新北市", "TownName": "三峽區", "VillageName": "溪東里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000090019", "COUNID": 3, "TOWNID": 237, "RainStName": "土城", "RasinStCode": "C0AD40", "H1": 36.5, "H3": 86.5, "H6": 155.5, "H12": 230.5, "H24": 239 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5525, "CountyName": "新北市", "TownName": "三峽區", "VillageName": "溪東里", "FloodEventCode": "R00286", "FloodEventYear": 2016, "VILLAGESN": "65000090019", "COUNID": 3, "TOWNID": 237, "RainStName": "山佳", "RasinStCode": "C0A520", "H1": 54, "H3": 87, "H6": 137, "H12": 144.5, "H24": 144.5 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 5.5, "H6": 13, "H12": 33, "H24": 55.5, "D1": 33, "D2": 75, "D3": 111, "FloodWarnInfo": "正常", "ST_NO": "C0A520", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0, "H2": 0, "H3": 3.5, "H6": 11, "H12": 22, "H24": 54.5, "D1": 22, "D2": 68, "D3": 113.5, "FloodWarnInfo": "正常", "ST_NO": "C0AD40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 26.5, "S3時": 40, "S6時": 41, "S12時": 41, "S24時": 41 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000060013", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3844, "CountyName": "新北市", "TownName": "新店區", "VillageName": "下城里", "FloodEventCode": "R00161", "FloodEventYear": 2013, "VILLAGESN": "65000060013", "COUNID": 3, "TOWNID": 231, "RainStName": "中和", "RasinStCode": "C0AG90", "H1": 81, "H3": 81, "H6": 81, "H12": 81, "H24": 81 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4484, "CountyName": "新北市", "TownName": "新店區", "VillageName": "下城里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000060013", "COUNID": 3, "TOWNID": 231, "RainStName": "精忠", "RasinStCode": "81AH40", "H1": 3.5, "H3": 4, "H6": 4.5, "H12": 5, "H24": 5.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4486, "CountyName": "新北市", "TownName": "新店區", "VillageName": "下城里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000060013", "COUNID": 3, "TOWNID": 231, "RainStName": "精忠", "RasinStCode": "81AH40", "H1": 3.5, "H3": 4, "H6": 4.5, "H12": 5, "H24": 5.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 7893, "CountyName": "新北市", "TownName": "新店區", "VillageName": "下城里", "FloodEventCode": "R00497", "FloodEventYear": 2019, "VILLAGESN": "65000060013", "COUNID": 3, "TOWNID": 231, "RainStName": "新店", "RasinStCode": "A0A9M0", "H1": 74.5, "H3": 100, "H6": 100, "H12": 102, "H24": 102.5 }], "RAIN": [{ "M10": 0, "H1": 0.5, "H2": 0, "H3": 5, "H6": 12.5, "H12": 22, "H24": 78.5, "D1": 23, "D2": 104.5, "D3": 148, "FloodWarnInfo": "正常", "ST_NO": "81AH40", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0, "H2": 0, "H3": 6.5, "H6": 15.5, "H12": 31, "H24": 94, "D1": 31.5, "D2": 120, "D3": 164.5, "FloodWarnInfo": "正常", "ST_NO": "A0A9M0", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 3.5, "S3時": 4, "S6時": 4.5, "S12時": 5, "S24時": 5.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000060030", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4476, "CountyName": "新北市", "TownName": "新店區", "VillageName": "青潭里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000060030", "COUNID": 3, "TOWNID": 231, "RainStName": "精忠", "RasinStCode": "81AH40", "H1": 3.5, "H3": 4, "H6": 4.5, "H12": 5, "H24": 5.5 }], "RAIN": [{ "M10": 0, "H1": 0.5, "H2": 0, "H3": 5, "H6": 12.5, "H12": 22, "H24": 78.5, "D1": 23, "D2": 104.5, "D3": 148, "FloodWarnInfo": "正常", "ST_NO": "81AH40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 3.5, "S3時": 4, "S6時": 4.5, "S12時": 5, "S24時": 5.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000060032", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4479, "CountyName": "新北市", "TownName": "新店區", "VillageName": "張南里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000060032", "COUNID": 3, "TOWNID": 231, "RainStName": "精忠", "RasinStCode": "81AH40", "H1": 3.5, "H3": 4, "H6": 4.5, "H12": 5, "H24": 5.5 }], "RAIN": [{ "M10": 0, "H1": 0.5, "H2": 0, "H3": 5, "H6": 12.5, "H12": 22, "H24": 78.5, "D1": 23, "D2": 104.5, "D3": 148, "FloodWarnInfo": "正常", "ST_NO": "81AH40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 3.5, "S3時": 4, "S6時": 4.5, "S12時": 5, "S24時": 5.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000060037", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4485, "CountyName": "新北市", "TownName": "新店區", "VillageName": "中興里", "FloodEventCode": "T1513", "FloodEventYear": 2015, "VILLAGESN": "65000060037", "COUNID": 3, "TOWNID": 231, "RainStName": "精忠", "RasinStCode": "81AH40", "H1": 3.5, "H3": 4, "H6": 4.5, "H12": 5, "H24": 5.5 }], "RAIN": [{ "M10": 0, "H1": 0.5, "H2": 0, "H3": 5, "H6": 12.5, "H12": 22, "H24": 78.5, "D1": 23, "D2": 104.5, "D3": 148, "FloodWarnInfo": "正常", "ST_NO": "81AH40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 3.5, "S3時": 4, "S6時": 4.5, "S12時": 5, "S24時": 5.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000060044", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 4670, "CountyName": "新北市", "TownName": "新店區", "VillageName": "中正里", "FloodEventCode": "T1521", "FloodEventYear": 2015, "VILLAGESN": "65000060044", "COUNID": 3, "TOWNID": 231, "RainStName": "精忠", "RasinStCode": "81AH40", "H1": 2, "H3": 3, "H6": 4, "H12": 4.5, "H24": 6 }], "RAIN": [{ "M10": 0, "H1": 0.5, "H2": 0, "H3": 5, "H6": 12.5, "H12": 22, "H24": 78.5, "D1": 23, "D2": 104.5, "D3": 148, "FloodWarnInfo": "正常", "ST_NO": "81AH40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 2, "S3時": 3, "S6時": 4, "S12時": 4.5, "S24時": 6 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "65000060041", "COUNID": 3, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5852, "CountyName": "新北市", "TownName": "新店區", "VillageName": "五峯里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "65000060041", "COUNID": 3, "TOWNID": 231, "RainStName": "精忠", "RasinStCode": "81AH40", "H1": 0.5, "H3": 0.5, "H6": 0.5, "H12": 0.5, "H24": 0.5 }], "RAIN": [{ "M10": 0, "H1": 0.5, "H2": 0, "H3": 5, "H6": 12.5, "H12": 22, "H24": 78.5, "D1": 23, "D2": 104.5, "D3": 148, "FloodWarnInfo": "正常", "ST_NO": "81AH40", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 0.5, "S3時": 0.5, "S6時": 0.5, "S12時": 0.5, "S24時": 0.5 }, "isWarning": true }, { "__type": "DisasterEditorMapWeb.WS.FloodComputeWS+VillageFloodAlertData", "VILLAGESN": "68000050007", "COUNID": 5, "EVENT": [{ "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3952, "CountyName": "桃園市", "TownName": "蘆竹區", "VillageName": "南崁里", "FloodEventCode": "R00191", "FloodEventYear": 2014, "VILLAGESN": "68000050007", "COUNID": 5, "TOWNID": 338, "RainStName": "蘆竹", "RasinStCode": "C0C620", "H1": 31.5, "H3": 32.5, "H6": 32.5, "H12": 35.5, "H24": 36 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 3330, "CountyName": "桃園市", "TownName": "蘆竹區", "VillageName": "南崁里", "FloodEventCode": "R00119", "FloodEventYear": 2012, "VILLAGESN": "68000050007", "COUNID": 5, "TOWNID": 338, "RainStName": "桃園", "RasinStCode": "C0C480", "H1": 105, "H3": 218.5, "H6": 327, "H12": 423, "H24": 434 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5340, "CountyName": "桃園市", "TownName": "蘆竹區", "VillageName": "南崁里", "FloodEventCode": "R00271", "FloodEventYear": 2016, "VILLAGESN": "68000050007", "COUNID": 5, "TOWNID": 338, "RainStName": "蘆竹", "RasinStCode": "C0C620", "H1": 85, "H3": 159, "H6": 167.5, "H12": 167.5, "H24": 167.5 }, { "__type": "DisasterEditorMapWeb.WS.VillageFloodEvent", "ID": 5719, "CountyName": "桃園市", "TownName": "蘆竹區", "VillageName": "南崁里", "FloodEventCode": "R00345", "FloodEventYear": 2017, "VILLAGESN": "68000050007", "COUNID": 5, "TOWNID": 338, "RainStName": "桃園", "RasinStCode": "C0C480", "H1": 64.5, "H3": 122, "H6": 131, "H12": 149, "H24": 154 }], "RAIN": [{ "M10": 0, "H1": 0, "H2": 0, "H3": 1, "H6": 9, "H12": 22, "H24": 37, "D1": 22.5, "D2": 80.5, "D3": 117.5, "FloodWarnInfo": "正常", "ST_NO": "C0C480", "DATE": "/Date(1663043400000)/" }, { "M10": 0, "H1": 0, "H2": 0, "H3": 0.5, "H6": 0.5, "H12": 2.5, "H24": 4, "D1": 2.5, "D2": 11.5, "D3": 17.5, "FloodWarnInfo": "正常", "ST_NO": "C0C620", "DATE": "/Date(1663043400000)/" }], "LIMIT_INFO": { "S1時": 31.5, "S3時": 32.5, "S6時": 32.5, "S12時": 35.5, "S24時": 36 }, "isWarning": true }]');
        //callback(r);
        //return;
        styear = styear || 2003;
        endyear = endyear || 2050;
        if (!_villageFloodAlertDatasByTyphtypeTimer) //清cache
            _villageFloodAlertDatasByTyphtypeTimer = setInterval(function () {
                _villageFloodAlertDatasByTyphtype = {};
            }, 100 * 1000);
        var typhkey = typhtype + '_' + onlyWarningData + '_' + styear + '_' + endyear;
        var callbackkey = 'callback_' + typhkey;

        if (_villageFloodAlertDatasByTyphtype[typhkey])
            callback(_villageFloodAlertDatasByTyphtype[typhkey]);
        else {
            var _callbacks = _villageFloodAlertDatasByTyphtype[callbackkey];
            if (!_callbacks) {
                _villageFloodAlertDatasByTyphtype[callbackkey] = [];
                _callbacks = _villageFloodAlertDatasByTyphtype[callbackkey];
            }
            _callbacks.push(callback);
            if (_callbacks.length == 1) {
                $.BasePinCtrl.helper.ajaxDotnetWebserviceWithParas(app.CSgdsRoot + 'WS/FloodComputeWS.asmx/GetVillageFloodAlertDatas', { typhType: parseInt(typhtype), onlyWarningData: onlyWarningData, stYear: styear, endYear: endyear },
                    function (dat, status) {
                        _villageFloodAlertDatasByTyphtype[typhkey] = dat;
                        //console.log("data..:"+dat.length);
                        $.each(_callbacks, function (_cidx, _callback) {
                            if (_callback) {
                                _callback(_villageFloodAlertDatasByTyphtype[typhkey]);
                            }
                        })
                        _callbacks.splice(0, _callbacks.length);
                    });
            }
        }
    }

    var getVillageFloodImage = function (villageSn, eventCode, callback) {
        $.BasePinCtrl.helper.ajaxGeneralRequest({
            url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/GetVillageFloodImage",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            type: "POST",
            data: JSON.stringify({ villageSn: villageSn, eventCode: eventCode })
        }, function (d) {
            callback(d.d);
        });
    };
    var getVillageFldoodEventRelInf = function (villageSn, eventCode, sensoruid, callback) {
        $.BasePinCtrl.helper.ajaxGeneralRequest({
            url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/GetVillageFldoodEventRelInf",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            type: "POST",
            data: JSON.stringify({ villageSn: villageSn, eventCode: eventCode, sensoruid: sensoruid })
        }, function (d) {
            callback(d.d);
        });
    };


    var getTyphTraceByType = function (type, callback) {
        $.BasePinCtrl.helper.ajaxGeneralRequest({
            url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/GetTyphTraceByType",

            dataType: "json",
            contentType: "application/json; charset=utf-8",
            type: "POST",
            data: JSON.stringify({ type: type })
        }, function (d) {
            callback(d.d);
        });

    }

    //取預報雨量圖
    var getForecastRainfall = function (dt, ftype, hour, bhour, callback) {
        $.BasePinCtrl.helper.ajaxGeneralRequest({
            url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/GetForecastRainfall",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            type: "POST",
            data: JSON.stringify({ dt: dt, fType: ftype, hour: hour, bufferHour: bhour })
        }, function (d) {
            callback(d.d);
        });
    }

    //取單一演算結果DTM
    var loadDEMCalculateData = function (_FloodingClass, callback) {
        var _cd = $.extend({}, _FloodingClass);
        _cd.DATE = JsonDateStr2Datetime(_cd.DATE);
        if (_cd.Recession_DATE) _cd.Recession_DATE = JsonDateStr2Datetime(_cd.Recession_DATE);
        if (_cd.CREATE_DATE) _cd.CREATE_DATE = JsonDateStr2Datetime(_cd.CREATE_DATE);
        if (_cd.MODIFY_DATE) _cd.MODIFY_DATE = JsonDateStr2Datetime(_cd.MODIFY_DATE);
        $.BasePinCtrl.helper.ajaxGeneralRequest({
            url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/GetDEMCalculateData",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            type: "POST",
            data: JSON.stringify({ computeDistance: 500, ds: _cd })
        }, function (d) {
            callback(d.d);
        });
    };
    //雨量站頻率分析資料
    var rainFrequencyData = function (stno, callback) {
        $.BasePinCtrl.helper.ajaxGeneralRequest({
            url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/RainFrequencyData",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            type: "POST",
            data: JSON.stringify({ stno: stno })
        }, function (d) {
            callback(d.d);
        });
    };

    var convertFloodToUiObject = function (d) {
        console.log('淹水點:' + d.d.length);
        //flood:來至水利署(同一網格只用淹水+高程最大資料取代影響戶數及土地利用); floodarea:同一網格只用淹水+高程最大資料; handdrawflood:人工圈繪; statistics:僅用來至水利署且同一網格只用淹水+高程最大資料
        var _r = { flood: [], floodarea: [], handdrawflood: [], statistics: [] };
        var _floodkey = [];
        var _floodGroup = [];
        var _handdrawfloodkey = [];
        var _handdrawfloodGroup = [];

        var _handdrawfloodGridId = [];
        $.each(d.d, function () {
            if (!this.NOTIFICATION_Data) {
                console.log(this.EffectAddress);
                return;
            }
            $.extend(this, this.NOTIFICATION_Data);
            this.Described = this.NOTIFICATION_Data.Described;

            var _key = (this.GridId == 0 ? this.PK_ID : this.GridId) + this.COUNTY_NAME + this.TOWN_NAME;
            //if (Math.random() % 5 == 0)
            //    this.IsFromWraEMIS = false;
            if (this.IsFromWraEMIS) {
                //組group
                if (_floodkey.indexOf(_key) < 0) {
                    _floodkey.push(_key);
                    _floodGroup.push({ key: _key, g: [this] });
                }
                else {
                    var _g = $.grep(_floodGroup, function (_gg) {
                        return _gg.key == _key;
                    })[0];
                    _g.g.push(this);

                }
                _r.flood.push(this);
            }
            else {
                //組group
                if (_handdrawfloodkey.indexOf(_key) < 0) {
                    _handdrawfloodkey.push(_key);
                    _handdrawfloodGroup.push({ key: _key, g: [this] });
                }
                else {
                    var _g = $.grep(_handdrawfloodGroup, function (_gg) {
                        return _gg.key == _key;
                    })[0];
                    _g.g.push(this);

                }
                _r.handdrawflood.push(this);
            }


        });
        //flood找出最大淹水深度+高程,並改同一group計算值
        $.each(_floodGroup, function () {
            var maxdata = this.g[0];
            var maxdataidx = 0;
            if (this.g.length != 1) {
                ////找出最大淹水深度+高程

                $.each(this.g, function (_idx) {
                    if ((this.DEPTH / 100 + this.Z_D) > (maxdata.DEPTH / 100 + maxdata.Z_D)) {
                        maxdata = this;
                        maxdataidx = _idx;
                    }
                });

            }
            $.each(this.g, function (_idx) {
                if (_idx != maxdataidx) {
                    this._Land = this.Land;
                    this.Land = maxdata.Land;
                    this._AffectStat = this.AffectStat;
                    this.AffectStat = maxdata.AffectStat;
                }

                //infoField用
                this.AffectHouse = maxdata.AffectStat ? maxdata.AffectStat.TotalHouse : 0;
                this.AffectArea = maxdata.AffectStat ? maxdata.AffectStat.TotalArea : 0;
                this.AffectHouse30cmUp = maxdata.AffectStat ? maxdata.AffectStat.TotalHouse30cmUp : 0;
                this.AffectArea30cmUp = maxdata.AffectStat ? maxdata.AffectStat.TotalArea30cmUp : 0;
                this.AffectHouse50cmUp = maxdata.AffectStat ? maxdata.AffectStat.TotalHouse50cmUp : 0;
                this.AffectArea50cmUp = maxdata.AffectStat ? maxdata.AffectStat.TotalArea50cmUp : 0;
            });
            _r.statistics.push(maxdata); //加入statistics
            _r.floodarea.push(maxdata);     //加入floodarea
        });
        //handdrawflood找出最大淹水深度+高程,並改同一group計算值
        $.each(_handdrawfloodGroup, function () {
            var maxdata = this.g[0];
            if (this.g.length != 1) {
                ////找出最大淹水深度+高程

                $.each(this.g, function () {
                    if ((this.DEPTH / 100 + this.Z_D) > (maxdata.DEPTH / 100 + maxdata.Z_D))
                        maxdata = this;
                });
            }
            $.each(this.g, function () {
                this._Land = this.Land;
                this.Land = maxdata.Land;
                this._AffectStat = this.AffectStat;
                this.AffectStat = maxdata.AffectStat;

                //infoField用
                this.AffectHouse = maxdata.AffectStat ? maxdata.AffectStat.TotalHouse : 0;
                this.AffectArea = maxdata.AffectStat ? maxdata.AffectStat.TotalArea : 0;
                this.AffectHouse30cmUp = maxdata.AffectStat ? maxdata.AffectStat.TotalHouse30cmUp : 0;
                this.AffectArea30cmUp = maxdata.AffectStat ? maxdata.AffectStat.TotalArea30cmUp : 0;
                this.AffectHouse50cmUp = maxdata.AffectStat ? maxdata.AffectStat.TotalHouse50cmUp : 0;
                this.AffectArea50cmUp = maxdata.AffectStat ? maxdata.AffectStat.TotalArea50cmUp : 0;
            });
            _r.floodarea.push(maxdata);     //加入floodarea
        });

        return _r;
    }

    //
    var estimateFloodingComputeForLightweightDatas = function (floodings, callback) {
        $.BasePinCtrl.helper.ajaxGeneralRequest({
            url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/EstimateFlooding",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            type: "POST",
            data: JSON.stringify({ floodings: floodings })
        }, function (d) {


            callback(convertFloodToUiObject(d));
            // callback(_r);
            //$.each(_floodkey, function () {
            //    var _g = $.grep(_r.flood, function () {
            //    })
            //});

            //_r.flood = $.grep(d.d, function (_d) {
            //    return _d.IsFromWraEMIS;
            //});
            //_r.handdrawflood = $.grep(d.d, function (_d) {
            //    return !_d.IsFromWraEMIS;
            //});
        });
    }

    //取淹水演算結果
    var loadFloodComputeForLightweightDatas = function (st, et, countyID, datatype, callback) {
        $.BasePinCtrl.helper.ajaxGeneralRequest({
            url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/GetFloodComputeForLightweightData",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            type: "POST",
            data: JSON.stringify({ beginDT: st, endDT: et, computeDistance: 500, CountyID: countyID, dataType: datatype })
        }, function (d) {


            callback(convertFloodToUiObject(d));
            // callback(_r);
            //$.each(_floodkey, function () {
            //    var _g = $.grep(_r.flood, function () {
            //    })
            //});

            //_r.flood = $.grep(d.d, function (_d) {
            //    return _d.IsFromWraEMIS;
            //});
            //_r.handdrawflood = $.grep(d.d, function (_d) {
            //    return !_d.IsFromWraEMIS;
            //});
        });
    }

    //取淹水設施結果
    var loadEMISFacilitys = function (st, et, countyID, datatype, callback) {
        $.BasePinCtrl.helper.ajaxGeneralRequest({
            url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/wsEMISWaterByTime",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            type: "POST",
            data: JSON.stringify({ startDate: st, endDate: et })
        }, function (d) {
            var _r = null;
            if (d && d.d)
                _r = $.grep(d.d, function (_f) {
                    var _append = false;
                    if (datatype === undefined || datatype == 2)
                        _append = true;
                    else if (datatype == 0 && !_f.IsTest)
                        _append = true;
                    else if (datatype == 1 && _f.IsTest)
                        _append = true;
                    return _append;
                });
            callback(_r);
        });
    }
    var getThe3rdFloodPotentials = function (callback) {
        $.BasePinCtrl.helper.ajaxGeneralRequest({
            url: app.CSgdsRoot + "WS/FloodComputeWS.asmx/The3rdFloodPotentials",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            type: "POST"
        }, function (d) {
            callback(d.d);
        });
    }
    var getFHYFloodSensorInfoLast24Hours_Address = function (address, callback) {
        $.BasePinCtrl.helper.ajaxGeneralRequest({
            url: app.CSgdsRoot + "WS/FHYBrokerWS.asmx/GetFHYFloodSensorInfoLast24Hours_Address",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({ 'address': address }),
            type: "POST"
        }, function (d) {
            callback(d.d.Data);
        });
    }
    var getFHYFloodSensorStation = function (callback) {
        getData(app.CSgdsRoot + 'WS/FHYBrokerWS.asmx/GetFHYFloodSensorStation', undefined, callback, { type: 'POST' });
    }
    var getFHYFloodSensorInfoRt = function (dt, callback) {
        getData(app.CSgdsRoot + 'WS/FHYBrokerWS.asmx/GetFHYFloodSensorInfoRt', undefined, callback, { type: 'POST' });
    }
    var getFHYFloodSensorInfoLast24Hours = function (id, callback) {
        getData(app.CSgdsRoot + 'WS/FHYBrokerWS.asmx/GetFHYFloodSensorInfoLast24Hours', JSON.stringify({ sensorUUID: id }), callback, { type: 'POST' });
    }

    window.basins = undefined;
    var getBasin = function (callback) {
        if (window.basins) {
            callback(window.basins);
            return;
        }
        $.BasePinCtrl.helper.getWraFhyApi("Basic/Basin", undefined, function (d) {
            callback(d.Data);
        })
    }
    var getAllTown = function (callback) {
        if (window.alltown) {
            callback(window.alltown);
        }
        else
            $.get(app.siteRoot + 'kml/Town.json', function (ts) {
                window.alltown = ts;
                callback(ts);
            });
    }
    var getFHYCity = function (callback) {
        if (window.fhyCity) {
            callback(window.fhyCity);
        }
        else
            getData(app.CSgdsRoot + "WS/FHYBrokerWS.asmx/GetFHYCity", undefined, function (d) {
                window.fhyCity = d;
                callback(window.fhyCity)
            }, { type: 'POST' });
    }
    var getFHYTown = function (cityCode, callback) {
        var k = 'fhyTown' + cityCode;
        if (window[k]) {
            callback(window[k]);
        }
        else
            getData(app.CSgdsRoot + "WS/FHYBrokerWS.asmx/GetFHYTown", JSON.stringify({ cityCode: cityCode }), function (d) {
                window[k] = d;
                callback(window[k])
            }, { type: 'POST' });
    }

    var getAllCctv = function (callback) {
        var _fmg, _tp;
        helper.data.get(app.siteRoot + 'api/fmg/get/allbase', function (cs) {
            var _temp = [];
            $.each(cs, function () {
                if (this == null || this == undefined)
                    return;
                var coor = helper.gis.TWD97ToWGS84(this.x_tm97, this.y_tm97);
                this.X = coor.lon;
                this.Y = coor.lat;
                this.urls = [];
                _temp.push(this);
            });
            _fmg = _temp;
            if (_fmg && _tp) {
                var css = _fmg.concat(_tp);
                callback(css);
            }
        });
        helper.data.get(app.TpCctv, function (cs) {
            var _temp = [];
            $.each(cs, function () {
                if (this == null || this == undefined)
                    return;
                this.id = this.stn_id;
                this.name = this.stn_name+"_tp";
                this.X = this.lon;
                this.Y = this.lat;
                this.urls = [
                    { id: this.id, name: this.name, url: this.url_snapshot }
                ];
                _temp.push(this);
            });
            _tp = _temp;
            if (_fmg && _tp) {
                var css = _fmg.concat(_tp);
                callback(css);
            }
        });
    }
    var getCctvCameras = function (id, sid) {
        var r = null;
        helper.data.get(app.siteRoot + 'api/fmg/get/cctv/' + id + '/' + sid, function (ds) {
            r = ds;
        }, { async: false })
        return r;
    }

    var loadTownGeojson = function (callback) {
        helper.data.get(app.siteRoot + 'Data/Kml/town_geo.json', callback);
    }

    var getComplexData = function (tstr, callback) {
        if (tstr && helper.misc.getRequestParas()['test'])
            tstr = '202308101150';
        if (tstr) {
            if (location.href.indexOf('localhost') >= 0)
                helper.data.get('https://www.dprcflood.org.tw/FDIS/api/alert/complex/' + tstr, callback);
            else
                helper.data.get(app.siteRoot + 'api/alert/complex/' + tstr, callback);
            //helper.data.get(app.siteRoot + 'api/alert/complex/rt/H1/200', callback);
        }
        else
            helper.data.get(app.siteRoot + 'api/alert/complex/rt/all', callback);
    }
    var getComplexRtData = function (callback) {
        getComplexData(undefined, callback);
    }
    var getComplexDataByTime = function (tstr, callback) {
        getComplexData(tstr, callback);
    }
    var getFhyRainfallWarnning = function (tstr, callback) {
        if (tstr) {
            if (helper.misc.getRequestParas()['test'])
                tstr = '202308101150';
            if (location.href.indexOf('localhost') >= 0)
                helper.data.get('https://www.dprcflood.org.tw/FDIS/api/fhy/rainfall/warnning/' + tstr, callback);
            else
                helper.data.get(app.siteRoot+ 'api/fhy/rainfall/warnning/' + tstr, callback);
        }
        else

            helper.data.get(app.siteRoot + 'api/fhy/rainfall/warnning', callback);
    }

    var getFhyRainstasion = function (callback) {
        $.BasePinCtrl.helper.getWraFhyApi('Rainfall/Station', undefined, function (r) {
            callback(r.Data);
        });
    }
    //預抓資料
    var preInitData = function () {
        //if ($("#forestLake").length>0) //服務連不上
        //    datahelper.loadForestEventManager(true);



        var countys = datahelper.loadCountyXY(false);
        datahelper.getFloodEvents(false);

        boundary.helper.GetBoundaryData(boundary.data.County, function (b) { });
        //boundary.helper.GetBoundaryData(boundary.data.Town, function (b) { });

        datahelper.loadAllVillagePolygons(undefined, app.county ? [app.county] : undefined);

        datahelper.getLandUseType();
        datahelper.getEMISWATER_TYPE();
        datahelper.getAllTown(function () { });
        getFHYCity(function () { });
        
        $('body').trigger('preInitData-completed');
    }
    window.datahelper = {
        preInitData: preInitData,                                                   //初始基本資料
        loadCountyXY: loadCountyXY,                                                 //縣市資料
        getCountyXYContains0: getCountyXYContains0,                                 //縣市資料(含全臺)
        getAllTown: getAllTown,                                                     //鄉鎮資料*/ >>淹水感測用
        getBasin: getBasin,                                                         //流域資料
        getFloodEvents: getFloodEvents,                                             //取淹水事件資料
        getLandUseType: getLandUseType,                                             //土地利用種類
        getEMISWATER_TYPE: getEMISWATER_TYPE,                                       //水利設施種類
        loadWraEvents: loadWraEvents,                                               //取水利署事件清單
        loadAllVillagePolygons: loadAllVillagePolygons,                             //抓村里KMZ資料
        loadWraLake: loadWraLake,                                                   //水利署堰塞湖
        loadForestLake: loadForestLake,                                             //林務局堰塞湖
        loadForestEventManager: loadForestEventManager,

        loadComplexVillagePolygons: loadComplexVillagePolygons,                     //抓村里KMZ資料-複合淹水警戒用
        loadTownGeojson: loadTownGeojson,                                           //全台行政區geojson
        getComplexRtData: getComplexRtData,                                         //即時複合淹水警戒
        getComplexDataByTime: getComplexDataByTime,                                 //複合淹水警戒依時間
        getFhyRainfallWarnning: getFhyRainfallWarnning,                             //fhy淹水警戒
        getComplexData: getComplexData,                                             //複合淹水警戒(dstr:undefined 即時)
        getFhyRainstasion: getFhyRainstasion,                                       //fhy雨量基本資料

        getVillageFloodAlertDatas: getVillageFloodAlertDatas,                       //取所有村里歷史淹水資訊
        getVillageFloodAlertDatasByTyphtype: getVillageFloodAlertDatasByTyphtype,   //取指定颱風所有村里歷史淹水資訊

        getVillageForecastFloodAlertDatas: getVillageForecastFloodAlertDatas,       //取村里及時預報淹水資訊
        getVillageFloodImage: getVillageFloodImage,                                 //取村里歷史淹水圖片資訊
        getVillageFldoodEventRelInf: getVillageFldoodEventRelInf,                   //取災情履歷事件相關圖片、pdf、感測器相關資料

        getForecastRainfall: getForecastRainfall,                                    //取預報雨量圖

        getTyphTraceByType: getTyphTraceByType,                                     //依颱風類型(1-9)取資料

        loadFloodComputeForLightweightDatas: loadFloodComputeForLightweightDatas,   //取積淹水演算資料(不含DEM,Adress)
        loadEMISFacilitys: loadEMISFacilitys,                                       //水利設施資料
        loadDEMCalculateData: loadDEMCalculateData,                                 //取淹水網格DEM資料

        estimateFloodingComputeForLightweightDatas: estimateFloodingComputeForLightweightDatas, //災情預估

        getThe3rdFloodPotentials: getThe3rdFloodPotentials,                          //第三代「淹水潛勢圖」

        rainFrequencyData: rainFrequencyData,                                        //雨量站頻率分析資料


        //fmg cctv
        getAllCctv: getAllCctv,
        getCctvCameras: getCctvCameras,

        //淹水感測用
        getFHYFloodSensorInfoLast24Hours_Address: getFHYFloodSensorInfoLast24Hours_Address, //取淹水感測最後24小時資料
        getFHYFloodSensorStation: getFHYFloodSensorStation,
        getFHYFloodSensorInfoRt: getFHYFloodSensorInfoRt,
        getFHYFloodSensorInfoLast24Hours: getFHYFloodSensorInfoLast24Hours,
        getFHYTown: getFHYTown,
        AllTW: '全臺'
    };

})(window);