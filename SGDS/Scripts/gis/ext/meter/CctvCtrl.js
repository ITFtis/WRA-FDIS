if (!$.BasePinCtrl) {
    alert("未引用(CctvCtrl)BasePinCtrl");
}
(function ($) {


    $.CctvCtrl = {

        defaultSettings: {
            name: "CCTV",
            layerid: "cctv_", map: undefined,
            cctvSize: { width: 250, height: 200 },
            timerInterval: 2000,
            showAllCctvAtFullInfowindow:false, // bool or bootstrap grid(col-md-6)
            stTitle: function (data) { return data.name },
            infoFields: [{ field: 'name', title: '站名' }],
            legendIcons: [$.BasePinCtrl.pinIcons.cctv.normal],
            snapshotUrl: function (u) { //{id:"", name: "", url: "" }
                if (!u || !u.url)
                    return undefined;
                return u.url + (u.url.indexOf("?") >= 0 ? "&" : "?") + "guid=" + geguid();
            },
            checkDataStatus: function (data, index) {
                return this.settings.legendIcons[0];// $.CctvCtrl.defaultSettings.legendIcons[0];
            },
            loadBase: undefined,//"https://water.tainan.gov.tw/WebServices/WaterService.asmx/GetAllStationBaseInfos"
            transformData: function (_base, _info) {
                $.each(_base, function (_idx, b) {
                    if(b.X ==undefined)
                        b.X = b.X || b.lon || b.lng || b.Lon || b.Lng || b.longitude || b.Longitude;
                    if(b.Y == undefined)
                        b.Y = b.Y || b.lat || b.Lat || b.latitude || b.Latitude;
                })
                return _base;
            },
            pinInfoContent: function (data, infofields) {
                var currentsetting = this.settings;
                 var $_carouselInstance;
                infofields = currentsetting.infoFields;
                var iid = geguid();// sid + "_" + new Date().getTime();
                var $div = $('<div id="carousel_' + iid + '" class="carousel meterinfo slide cctv-info-content ' + ('cctv-' + currentsetting.name + '-info-content') + '" data-ride="carousel" data-interval="99999999" data-bs-ride="carousel" data-bs-interval="99999999" style="width:100%;">');// style="width:' + this.cctvSize.width + 'px;height:' + this.cctvSize.height + 'px">');
                var $ol = $('<ol class="carousel-indicators">');
                var $sdiv = $('<div class="carousel-inner">');
                
                var cc =0;
                $.each(data.urls, function (idx,item) {
                    $ol.append(' <li data-target="#carousel_' + iid + '" data-slide-to="' + cc + '" data-bs-slide-to="' + cc +'"' + (cc == 0 ? ' class="active"' : "") + '></li>');

                    $sdiv.append('<div class="item carousel-item ' + (cc == 0 ? 'active' : '') + '"><img alt="' + this.name + '" class="img-cctv" data-index="' + idx + '" data-imgsrc="' + this.url + '"  style="margin: auto; width:' + currentsetting.cctvSize.width + 'px;height:' + currentsetting.cctvSize.height + 'px"></img>' +// min-width:' + currentsetting.cctvSize.width + 'px;min-height:' + currentsetting .cctvSize.height+ 'px"></img>' +
                        '<div class="carousel-caption" style="bottom:2px;padding-bottom:0px;left:2px;right:2px;text-align:left"><h4 style="margin-bottom:0px">' + this.name + '</h4></div></div>');

                    cc++;
                });
               
                var popup = undefined, timerid;

                var getNextImage = function () {
                    clearInterval(timerid);
                    //activeimg找item是active或showAllCctvAtFullInfowindow的class(.all-active)
                    var activeimg = $("#carousel_" + iid + " .carousel-inner >.item.active img,#carousel_" + iid + " .carousel-inner >.item.all-active img");
                    if (whatMap(currentsetting.map) == "google") {
                        if (activeimg.length == 0 || $(".googleContentFix").length==0) { //google googleContentFix
                            //clearInterval(timerid);
                            return;
                        }
                    }

                    else if (whatMap(currentsetting.map) == "arcgis") {
                        if (!popup)
                            popup = $(".esriPopup.esriPopupVisible");
                        if (activeimg.length == 0 || !popup.hasClass("esriPopupVisible")) { //google googleContentFix
                            //clearInterval(timerid);
                            return;
                        }
                    }
                    var $firstactiveimg = activeimg.first();
                    $firstactiveimg.off("load").off("error");
                    $firstactiveimg.on('load',function () {
                        timerid = setTimeout(getNextImage, currentsetting.timerInterval);
                        if ($firstactiveimg[0].displayCount == 1)
                            helper.misc.hideBusyIndicator($_carouselInstance);
                    }).on('error',function () {
                        timerid = setTimeout(getNextImage, currentsetting.timerInterval);
                        if ($firstactiveimg[0].displayCount == 1)
                            helper.misc.hideBusyIndicator($_carouselInstance);
                    });
                    //console.log("activeimg.length:" + activeimg.length);
                    $.each(activeimg, function () { 
                        var $img = $(this);
                        var src = $img.attr("data-imgsrc");
                        var idx = $img.attr("data-index");
                        src = currentsetting.snapshotUrl(data.urls[idx]); // src + (src.indexOf("?")>=0 ? "&" : "?") + "guid=" + geguid();
                        $img.attr("src", src);
                        $img[0].displayCount = ($img[0].displayCount ? ++$img[0].displayCount : 1);
                        //console.log($img[0].displayCount + "timerInterval:" + currentsetting.timerInterval + " idx:" + idx + " src:" + $img.attr("src"));
                    });
                    if (activeimg && activeimg.length > 0 && $firstactiveimg[0].displayCount ==1)
                        helper.misc.showBusyIndicator($_carouselInstance);
                };
                
                timerid = setTimeout(getNextImage, currentsetting.timerInterval);

                $div.append($ol);
                $div.append($sdiv);
                if (data.urls.length > 1) {
                    $div.append('<a class="left carousel-control carousel-control-prev" href="#carousel_' + iid + '" role="button" data-slide="prev" data-bs-slide="prev">' +
                            '<span class="glyphicon glyphicon-chevron-left"></span>' +
                        '</a>' +
                        '<a class="right carousel-control carousel-control-next" href="#carousel_' + iid + '" role="button" data-slide="next" data-bs-slide="next">' +
                            '<span class="glyphicon glyphicon-chevron-right"></span>' +
                        '</a>');
                }
                else
                    $ol.hide();
                //change to do load new image
                setTimeout(function () {
                    $_carouselInstance = $('#' + $div.attr('id'));
                    getNextImage();
                    $_carouselInstance.on('slid.bs.carousel', function () {
                        getNextImage();
                    });
                });
                if (!this.$element[0].haslistenfullInfowindowChange) {
                    this.$element.on($.BasePinCtrl.eventKeys.fullInfowindowChange, function (evt, infowindowContainer, isfull) {
                        console.log('get $.BasePinCtrl.eventKeys.fullInfowindowChange');
                        if (data.urls.length > 1 && currentsetting.showAllCctvAtFullInfowindow && currentsetting.canFullInfowindow) {
                            var $icontainer = $(infowindowContainer);
                            if (isfull) {
                                $icontainer.addClass("show-all-cctv-at-full-infowindow");
                                $icontainer.find(".carousel-inner > .item").addClass('all-active col-md-6');
                            }
                            else {
                                $icontainer.removeClass("show-all-cctv-at-full-infowindow");
                                $icontainer.find(".carousel-inner > .item").removeClass('all-active col-md-6');
                            }
                            getNextImage();
                        }
                    });
                    this.$element[0].haslistenfullInfowindowChange = true;
                }
                return $div[0].outerHTML;// '<div>' + g.attributes.CName + '<img src="' + g.attributes.urls[0].url + '" style="width:' + this.cctvSize.width + 'px;height:' + this.cctvSize.height+ 'px"></img></div>';
            }
        },
        defaultData: { CName: undefined, Display: undefined, urls: [], X: 0, Y: 0 }
    }
    var pluginName = 'CctvCtrl'
    var pluginclass = function (element, e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.settings = $.extend({}, $.CctvCtrl.defaultSettings);// {map:undefined, width:240};
      

        this.__pinctrl = undefined;
        this.__baseData = undefined;
        this.__infoData = undefined;
        
        this.isInitCompleted = false;
    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            $.extend(this.settings, options);
            //if (this.settings.showAllCctvAtFullInfowindow === true)
            //    this.settings.showAllCctvAtFullInfowindow = 'col-md-6';

            var current = this;
            //this.__pinctrl = $("#" + this.$element[0].id).BasePinCtrl(this.settings).on($.BasePinCtrl.eventKeys.initLayer, function (ss) {
            this.__pinctrl = this.$element.BasePinCtrl(this.settings).on($.BasePinCtrl.eventKeys.initLayer, function (ss) {
                current.reload(new Date());
            });

        },
        reload: function (dt) {
            this.currentDatetime = this.__pinctrl.instance.currentDatetime = dt;
            if (this.settings.loadBase === undefined)
                console.log(this.settings.name + " 無設定取基本資料");
            else {
                if (typeof this.settings.loadBase === "string") {
                    $.BasePinCtrl.helper.ajaxDotnetWebserviceEmptyParas.call(this, this.settings.loadBase, this.__loadBaseCompleted)
                }
                else {
                    this.settings.loadBase.call(this, jQuery.proxy(this.__loadBaseCompleted, this));
                }
            }
        },
        setFilter: function (filter) {
            this.__pinctrl.instance.setFilter(filter);
        },
        setBoundary: function (inBoundary) {
            this.__pinctrl.instance.setBoundary(inBoundary);
        },
        __loadBaseCompleted: function (results) {
            this.__baseData = results;
            this.refreshData();
        },
        refreshData: function () {
            var current = this;
            if (this.__baseData ) {
                current.__pinctrl.instance.setData(this.settings.transformData(this.__baseData));
            }
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