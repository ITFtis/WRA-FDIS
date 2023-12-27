
if (!$.BasePinCtrl) {
    alert("未引用(KmlCtrl)BasePinCtrl");
}
//geoxml3
//view-source:https://www.geocodezip.com/geoxml3_test/v3_geoxml3_KML_Samples.html
//需Access-Control-Allow-Origin

(function ($) {


    $.KmlCtrl = {

        defaultSettings: {
            name: "KmlCtrl",
            layerid: "KmlCtrl_", map: undefined,

            stTitle: function (data) {return data.placemarkName;},
            useLabel: true,
            useList: true,
            useCardview: true,
            useSearch: true,
            pinsize: { x: 12, y: 12, minx: 8, maxx: 32, miny: 10, maxy: 32, step: 4, anchor: "bottoms" },
            autoGenLegendIcons: false,//在無設定legendIcons下是否依kml內文自動產legendIcons
            styleSelector: false,//顯示poly的邊線、線寬、填滿編輯
            useSilder:true,
            //legendIcons: [{ 'name': '正常', 'url': 'Images/pump-正常.png', 'classes': 'green_status' }],
            //infoFields: [{ field: '公所別', title: '公所別' }, { field: '公所地址', title: '公所地址' }],
            checkDataStatus: function (data, index) {
                var s= data.kmlStatus?data.kmlStatus:
                    (this.settings.polyStyles && this.settings.polyStyles.length>0? this.settings.polyStyles[0] :
                    (this.settings.legendIcons && this.settings.legendIcons.length > 0 ? this.settings.legendIcons[0] : undefined));
                return s || $.BasePinCtrl.pinIcons.defaultPin;
            },// { 'name': '正常', 'url': 'Images/pump-正常.png', 'classes': 'green_status' } },
          
          
            pinInfoContent: function (data, infofields) {
                if (data.kmlDescription)
                    return '<div class="googleContentFix">' + data.kmlDescription + '</div>';
                else
                    return $.BasePinCtrl.defaultSettings.pinInfoContent.call(this, data, infofields);
            },
            descriptionParser: function (desc) {
                return $.parserStringToObject(desc, "<BR>", ":");
            },
            url: undefined,
            cacheKml:{name:undefined, version:1.1},
            type: $.BasePinCtrl.type.point
        },
        defaultData: { CName: '', Datetime: undefined, WaterLevel: -998, Voltage: undefined, X: 0, Y: 0 }
    }
    var pluginName = 'KmlCtrl'
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = $.extend({}, $.KmlCtrl.defaultSettings);// {map:undefined, width:240};
        this.__pinctrl = undefined;
        this.__fearData = undefined; //description


        this.__useKmlIcons = true;
        this.__useKmlDescription = true;
        this.isInitCompleted = false;
        this.kmlParser;
        this.allFearData;
        var current = this;
     
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
           
            var current = this;
            options.stTitle = options.stTitle || function (data) { return data.placemarkName };
            $.extend(this.settings, options);
            if (this.settings.legendIcons)
                this.__useKmlIcons = false;
            //console.log(name+" 1this.settings.infoFields" + this.settings.infoFields);
            if (this.settings.infoFields) 
                this.__useKmlDescription = false;
            else  
                this.settings.infoFields = [{ field: 'placemarTitle', title: '名稱' }];//清單用
            this.$element.on($.BasePinCtrl.eventKeys.displayLayer, function (evt, _display) {
                current.__displayCtrlStryleUI(_display);
            }).on($.BasePinCtrl.eventKeys.repaintPinCompleted, function () {
                
            });

            //console.log(name + " 2this.settings.infoFields" + this.settings.infoFields);
            //var sdfsd = new geoXML3();
            var _firstload = true;
            this.__pinctrl = this.$element.BasePinCtrl(this.settings).on($.BasePinCtrl.eventKeys.initLayer, function (ss) {
                //if (current.isInitCompleted)   //20230903
                //    return;
                if (!_firstload && current.allFearData === undefined)//20230903
                    return;
                _firstload = false;
                current.isInitCompleted = true;
                current.$element.show_busyIndicator();
                var startLoad = function () {
                    //載入資料
                    current.kmlParser.loadKml(current.settings.url, function (__fearData) {
                        current.allFearData = __fearData;
                        current.$element.hide_busyIndicator();
                        
                        if (__fearData && current.settings.autoGenLegendIcons && !current.settings.legendIcons) { //自動組legendIcons
                            current.settings.legendIcons = [];
                            var ftemp = [];
                            $.each(__fearData, function (idx,d) {
                                var k = JSON.stringify(current.settings.checkDataStatus.call(current,  d,idx ));
                                if (ftemp.indexOf(k) < 0) {
                                    ftemp.push(k);
                                    current.settings.legendIcons.push(JSON.parse(k));
                                }
                            });
                            
                        }
                        current.setData(__fearData);
                        current.__pinctrl.instance.repaintLegendUI(current.settings.legendIcons);
                        current.__initCtrlStryleUI();
                    });
                }
                if (whatMap(current.settings.map) === "google") {
                    if (window.GKmlCtrl)
                        current.kmlParser = new GKmlCtrl(current, startLoad);
                    else {
                        $.getScript($.AppConfigOptions.script.gispath + "/ext/meter/GKmlCtrl.js", function () {
                            current.kmlParser = new GKmlCtrl(current, startLoad);
                        });
                    }
                }
                else if (whatMap(current.settings.map) === "leaflet") {
                    if (window.LKmlCtrl)
                        current.kmlParser = new LKmlCtrl(current, startLoad);
                    else {
                        $.getScript($.AppConfigOptions.script.gispath + "/ext/meter/LKmlCtrl.js", function () {
                            current.kmlParser = new LKmlCtrl(current, startLoad);
                        });
                    }
                }
                else {
                    if (window.AKmlCtrl)
                        current.kmlParser = new AKmlCtrl(current, startLoad);
                    else {
                        $.getScript($.AppConfigOptions.script.gispath + "/ext/meter/AKmlCtrl.js", function () {
                            current.kmlParser = new AKmlCtrl(current, startLoad);
                        });
                    }
                }
            });

        },
        setFilter: function (filter) {
            this.__pinctrl.instance.setFilter(filter);
        },
        setData: function (datas) {
            this.__pinctrl.instance.setData(datas);
        },
        setOpacity: function (_opacity) {
            this.__pinctrl.instance.setOpacity(_opacity);
        },
        setBoundary: function (inBoundary) {
            this.__pinctrl.instance.setBoundary(inBoundary);
        },
        fitBounds: function (options) {
            this.__pinctrl.instance.fitBounds(options);
        },
        _initKmlCtrl: function () {
            var current = this;
            this.isInitCompleted = true;
            this.$element.show_busyIndicator();
            if (typeof this.settings.url === 'function') {
                this.settings.url(function (doc) {
                    current._afterParse.call(current, doc);
                });
            }
            else {
                var geoXml = new geoXML3.parser({
                    afterParse: function (doc) { current._afterParse.call(current, doc); }
                });
                geoXml.parse(this.settings.url);
            }
        },
        //_afterParse: function (doc) {
        //    var current = this;
        //    current.__fearData = [];
        //    var _usekmlstyle = false;
        //    if (current.__useKmlIcons)
        //        current.settings.legendIcons = [];
        //    var _iconsHrefTemp = "";
        //    var cc = 0;
        //    $.each(doc[0].placemarks, function () {
        //        var _d = current.settings.descriptionParser(this.description, "<BR>", ":");
        //        if (current.__useKmlDescription) { //infoWindow用
        //            _d.kmlDescription = this.description;
        //        }
        //        _d.placemarkName = this.name;
                
        //        _d.placemarTitle = current.settings.stTitle(_d);

        //        if (current.settings.type == $.BasePinCtrl.type.polygon) {
        //            _d.paths = this.polygon.getPaths().getArray();
                   
        //            _d.kmlStatus = {
        //                strokeOpacity: this.polygon.strokeOpacity, strokeWeight: this.polygon.strokeWeight, fillOpacity: this.polygon.fillOpacity,
        //                strokeColor: this.polygon.strokeColor, fillColor: this.polygon.fillColor
        //            };
        //        }
        //        else if (current.settings.type == $.BasePinCtrl.type.polyline) {
        //            _d.kmlStatus = {};
        //            //可polygon kml設定type=polyline畫polyline
        //            var _polyline = this.polyline || this.polygon
        //            //MultiGeometry多條線getPath()會是null，paths[0]如是array即MultiGeometry
        //            _d.paths = _polyline.paths ? _polyline.paths : _polyline.getPath().getArray(); 
        //            _d.kmlStatus = {
        //                strokeOpacity: _polyline.strokeOpacity, strokeWeight: _polyline.strokeWeight, strokeColor: _polyline.strokeColor
        //            };
        //        }
        //        else {
        //            _d.X = this.latlng.lng();
        //            _d.Y = this.latlng.lat();
        //            var _iconurl = this.style.href ? this.style.href : this.style.icon.href;
        //            if (current.__useKmlIcons) {
        //                if (_iconsHrefTemp.indexOf(_iconurl) < 0) {
        //                    current.settings.legendIcons.push({ 'name': '', 'url': _iconurl });
        //                    _iconsHrefTemp += "|" + _iconurl;
        //                }
        //            }
        //            _d.kmlStatus = { 'name': '', 'url': _iconurl };
        //        }
        //        current.__fearData.push(_d);
        //    });
        //    current.__pinctrl.instance.repaintLegendUI(current.settings.legendIcons);
        //    current.$element.hide_busyIndicator();
        //    current.setData(current.__fearData);
        //},
        __initCtrlStryleUI: function (_display) {
            var current = this;
            if (this.settings.type == $.BasePinCtrl.type.point)
                return;

            var changeKmlStatus = function (f, v) {
                //console.log('change '+f+' '+v);
                if (current.allFearData) {
                    //變更kmlStatus
                    $.each(current.allFearData, function () {
                        this.kmlStatus[f] = v;
                    });
                    //複寫checkDataStatus
                    var ocs = current.__pinctrl.instance.settings.checkDataStatus;
                    current.settings.checkDataStatus = current.__pinctrl.instance.settings.checkDataStatus = function (d, i) {
                        var o = ocs.call(current, d, i);
                        o[f] = v;
                        return o;
                    }

                    //重新定義legendIcons
                    current.settings.legendIcons = [];
                    var ftemp = [];
                    $.each(current.allFearData, function (idx, d) {
                        var k = JSON.stringify(current.settings.checkDataStatus.call(current, d, idx));
                        if (ftemp.indexOf(k) < 0) {
                            ftemp.push(k);
                            current.settings.legendIcons.push(JSON.parse(k));
                        }
                    });
                    current.__pinctrl.instance.settings.legendIcons = current.settings.legendIcons;

                    current.__pinctrl.instance.___repaint();
                    current.__pinctrl.instance.repaintLegendUI(current.settings.legendIcons);
                }
            }
            this.$_stylectrl = $('<div class="style-ctrl col-xs-12 col-12">').appendTo(this.$element);
            if (this.settings.styleSelector) {
                //顏色
                var $_c = $('<div class="poly-style" ><div ><lable>邊線:</lable><input type="text" class="strokepicker cpicker"></input></div>' +
                    '<div class="fill-ctrl"><lable>填滿:</lable><input type="text" class="fillpicker cpicker"></input></div>' +
                    '<div ><lable>線寬:</lable><select></select></div></div>').appendTo(this.$_stylectrl);
                //線寬
                var firstpin = current.__pinctrl.instance._mapctrl.graphics && current.__pinctrl.instance._mapctrl.graphics.length > 0 ? current.__pinctrl.instance._mapctrl.graphics[0] : undefined;
                var $_lwselect = $_c.find('select')
                for (var i = 0; i < 11; i++)
                    $('<option value="' + i + '">' + i + '</option>').appendTo($_lwselect);
                if (firstpin)
                    $_lwselect.val(Math.round(firstpin.attributes.kmlStatus.strokeWeight));
                $_lwselect.on('change', function () {
                    var v = $_lwselect.val();
                    changeKmlStatus('strokeWeight', v);
                });

                //線的顏色
                var scolor = firstpin ? firstpin.attributes.kmlStatus.strokeColor : '#000000';
                scolor = scolor || '#000000';
                $('.strokepicker', $_c).colpick({
                    layout: 'hex',
                    submit: 0,
                    onChange: function (hsb, hex, rgb, el, bySetColor) {
                        $(el).css('border-color', '#' + hex);
                        // Fill the text box just if the color was set using the picker, and not the colpickSetColor function.
                        if (!bySetColor) {
                            var strokecolor = '#' + hex;
                            $(el).val(strokecolor);
                            changeKmlStatus('strokeColor', strokecolor);
                        }
                    }
                }).val(scolor).keyup(function () {
                    var strokecolor = this.value;
                    $(this).colpickSetColor(strokecolor);
                    changeKmlStatus('strokeColor', strokecolor);
                }).colpickSetColor(scolor);
                //填滿的顏色
                $('.fill-ctrl', this.$element).hide();
                if (this.settings.type == $.BasePinCtrl.type.polygon) {
                    var fcolor = firstpin ? firstpin.attributes.kmlStatus.fillColor : '#000000';
                    fcolor = fcolor || '#000000';
                    $('.fillpicker', this.$element).colpick({
                        layout: 'hex',
                        submit: 0,
                        onChange: function (hsb, hex, rgb, el, bySetColor) {
                            $(el).css('border-color', '#' + hex);
                            // Fill the text box just if the color was set using the picker, and not the colpickSetColor function.
                            if (!bySetColor) {
                                var fillcolor = '#' + hex;
                                $(el).val(fillcolor);
                                changeKmlStatus('fillColor', fillcolor);

                            }
                        }
                    }).val(fcolor).keyup(function () {
                        var fillcolor = this.value;
                        $(this).colpickSetColor(fillcolor);
                        changeKmlStatus('fillColor', fillcolor);
                    }).colpickSetColor(fcolor);//.show();

                    //無填顏色
                    if (firstpin && firstpin.attributes.kmlStatus.fillOpacity != 0)
                        $('.fill-ctrl', this.$element).show();

                    
                }

                $(".colpick").mouseleave(function (e) {
                    $('.cpicker', current.$element).colpickHide();
                });
            }
        
            //透明度
            if (this.settings.useSilder) {
                var $slider = this.$element.find('.opacity-slider').first();
                if ($slider.length == 0) {
                    $slider = $('<div class="col-xs-12"><div class="opacity-slider" title="透明度"></div></div>').appendTo(this.$_stylectrl).find('.opacity-slider')
                        .gis_layer_opacity_slider({
                            map: this.settings.map,
                            //.slider({
                            range: "min",
                            max: 100,
                            min: 0,
                            value: 90,
                            setOpacity: $.proxy(current.setOpacity, current)//setOpacity: function (_op) { current.setOpacity(_op); }
                            //slide: function () { current.setOpacity($(this).slider("value") / 100); },
                            //change: function () { current.setOpacity($(this).slider("value") / 100); }
                        });
                }
            }
           
        },
        __displayCtrlStryleUI: function (_display) {
            if (this.$_stylectrl) {
                if (_display)
                    this.$_stylectrl.show();
                else
                    this.$_stylectrl.hide();
            }
        }
    }


    $.fn[pluginName] = function (arg) {

        var args, instance;

        if (!(this.data(pluginName) instanceof pluginclass)) {

            this.data(pluginName, new pluginclass(this[0]));
        }

        instance = this.data(pluginName);
        if (!instance)
            console.log("請確認selector(" + this.selector + ")是否有問題");


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