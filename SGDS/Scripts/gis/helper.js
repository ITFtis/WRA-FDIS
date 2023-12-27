if (typeof console === "undefined") {
    console = {
        log: function () { }
    }
}
if (jQuery && jQuery.fn.jquery == '1.9.1') {
    alert('不支援使用jquery'+jQuery.fn.jquery+'版本，請更新!!' );//bootstrap-table 1.15.1後版本有問題
}
String.format = function () {
    // The string containing the format items (e.g. "{0}")
    // will and always has to be the first argument.
    var theString = arguments[0];

    // start with the second argument (i = 1)
    for (var i = 1; i < arguments.length; i++) {
        // "gm" = RegEx options for Global search (more than one instance)
        // and for Multiline search
        var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
        theString = theString.replace(regEx, arguments[i]);
    }

    return theString;
}

// (new Date()).Format("yyyy-MM-dd HH:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).Format("yyyy-M-d H:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.DateFormat = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "H+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S": this.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) { fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length)); }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) { fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length))); }
    }
    return fmt;
};

//日期增加hours小時
Date.prototype.addHours = function (hours) {
    this.setHours(this.getHours() + hours);
    return this;
};
//日期增加minutes小時
Date.prototype.addMinutes = function (minutes) {
    this.setMinutes(this.getMinutes() + minutes);
    
    return this;
};
//取月份天數 m:1~12
var getDaysInMonth = function (y, m) {
    return /8|3|5|10/.test(--m) ? 30 : m == 1 ? (!(y % 4) && y % 100) || !(y % 400) ? 29 : 28 : 31;
}
//str "/Date(1224043200000)/"
var JsonDateStr2Datetime = function (str) {
    if (str && (typeof str === 'string'))

        if (str.indexOf("Date") >= 0)
            return new Date(parseInt(str.replace(/\/+Date\(([\d+-]+)\)\/+/, '$1')));
        else {
            return new Date(str);
        }
    else
        return str;
};
//number:source, fixed:小數點數, ex:123456.123 -> 123,456.12
function formatNumber(number, fixed) {
    if (number == undefined)
        return '-';
    number = parseFloat(number).toFixed(fixed) + '';
    var x = number.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
};
// left padding s(原始字串) with c(要加字元) to a total of n(結果長度) chars
function padding_left(s, c, l) {
    if (s == undefined || !c || s.length >= l) {
        return s;
    }

    var max = (l - (s + "").length) / (c + "").length;
    for (var i = 0; i < max; i++) {
        s = c + s;
    }
    return s;
}

// right padding s(原始字串) with c(要加字元) to a total of n(結果長度) chars
function padding_right(s, c, l) {
    if (s == undefined || !c || s.length >= l) {
        return s;
    }
    var max = (l - (s + "").length) / (c + "").length;
    for (var i = 0; i < max; i++) {
        s += c;
    }
    return s;
}

//取指定script的網址路徑,filename為檔名(不包含.js),可含路徑,如path\filename,回傳參數的路徑位置
function getScriptPath(filename) {
    var scripts = document.getElementsByTagName('script');
    if (scripts && scripts.length > 0) {
        for (var i in scripts) {
            if (scripts[i].src && scripts[i].src.match(new RegExp(filename + '\\.js$'))) {
                return scripts[i].src.replace(new RegExp('(.*)' + filename + '\\.js$'), '$1');
            }
            else if (scripts[i].src && scripts[i].src.match(new RegExp(filename + '.min\\.js$'))) {
                return scripts[i].src.replace(new RegExp('(.*)' + filename + '.min\\.js$'), '$1');
            }
        }
    }
};
//取絕對URL路徑
var getAbsoluteUrl = function (url) {
    var a = document.createElement('a');
    a.href = url;
    return a.href;
}
//如應用程式架在預設站台或預設站台下，可取的站台或子站台路徑
var getCurrentSiteRootPath = function () {
    if (window.app && app.siteRoot)
        return app.siteRoot;
    var result = "";
    var strFullPath = window.document.location.href;
    if (strFullPath.indexOf("?") >= 0)
        strFullPath = strFullPath.substr(0, strFullPath.indexOf("?"));
    var strPath = window.document.location.pathname;
    if (strPath == '' || strPath == '/') {
        result= strFullPath;
    } else {
        var pos = strFullPath.indexOf(strPath);
        var prePath = strFullPath.substring(0, pos); //主站台root url

        var postPath = strPath.substring(0, strPath.substr(1).indexOf('/') + 1);
        if (prePath.toLowerCase().indexOf('localhost') >= 0) {
            result =  prePath + '/';
        }
        else {
            if (postPath == "") //MVC route deafult
                postPath = strPath;
            result = prePath + postPath;
        }
    }
    console.log("..............."+result.endsWith('/') ? result : result + '/');
    return result.endsWith('/')?result:result+'/';
}

//jcontainer:jQuery Object, optins:ex {title: "訊息",autoclose: 3000,theme: 'warning',position: "center",content: "訊息"}
var jspAlertMsg = function (jcontainer, optins, callback) {
    if (!jcontainer)
        jcontainer = $('body');
    if (typeof jcontainer === "string")
        jcontainer = $(jcontainer);
    var settings = {
        title: "訊息",
        size: undefined,//{ width: 'auto', height: 150, max-width, min-width, max-height },
        //autoclose: 5000,
        overflow: 'hidden',
        theme: 'warning',
        position: "center",
        controls: { buttons: 'closeonly', iconfont: 'font-awesome' },
        content: "訊息",
        classes: 'modal-lg modal-dialog-centered'
    };
    $.extend(settings, optins);
    //var jpMsg = jcontainer.jsPanel(settings);
    //return jpMsg;

    var $_modal = $('<div class="modal fade" tabindex="-1" role="dialog" data-show="true"><div class="modal-dialog ' + settings.classes + '" role="document"><div class="modal-content"></div></div></div>').appendTo(jcontainer);
    if (settings.size){
        for (var _p in settings.size){
            $_modal.find('.modal-dialog').css(_p, settings.size[_p]);
        };
    }

    var bv = helper.bootstrap.getversion();

    var $_content = $_modal.find('.modal-content');
    var $_header = undefined;
    //var $_footer = undefined;
    
    if (bv >= 5)
        $_header = $('<div class="modal-header"><h4 class="modal-title" >' + settings.title + '</h4><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>').appendTo($_content);
        //$_footer = $('<div class="modal-footer"><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">確 定</button></div>').appendTo($_content);
    else
        $_header = $('<div class="modal-header"><h4 class="modal-title pull-left float-left" >' + settings.title + '</h4><button type="button" class="close pull-right float-right btn-close" data-dismiss="modal" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>').appendTo($_content);
    var $_body = $('<div class="modal-body">').appendTo($_content);
    if (typeof settings.content === 'string')
        $_body.html(settings.content);
    else
        $(settings.content).appendTo($_body);
    
    var _autoclose = setTimeout(function () {
        $_modal.modal('hide');
    },settings.autoclose);

    $_modal.on('hidden.bs.modal', function () {
        if(callback)
            callback();
        $_header.find('button').trigger('click'); //為了移除backdrop
        //$_footer.find('button').trigger('click'); //為了移除backdrop
        $_modal.remove();

    });
    return $_modal.modal('show');
    //return $_modal;//.modal('show');//.modal('backdrop', 'static');
};
//jcontainer:jQuery Object, optins:ex {title: "訊息",theme: 'warning',position: "center",content: "請確認"}, callback:function(bool)
var jspConfirmYesNo = function (jcontainer, optins, callback) {
    jcontainer = jcontainer || $('body');
    var settings = {
        title: "確認",
        modal: "modal-yesno",
        size: undefined,//{ width: 'auto', height: 150, max-width, min-width, max-height },
        overflow: 'hidden',
        theme: 'warning',
        position: "center",
        controls: { buttons: 'closeonly', iconfont: 'font-awesome' },
        content: "請確認",
        toolbarFooter: [
                   {
                       buttontext: '確定',
                       buttonclass: 'btn-xs',
                       callback: function () {
                            callback(true); jpMsg.close();
                       }
                   },
                   {
                       buttontext: '取消',
                       buttonclass: 'btn-xs',
                       callback: function () { jpMsg.close(); callback(false); }
                   }
        ]
    };
    $.extend(settings, optins);
    //var jpMsg = jcontainer.jsPanel(settings);
    //return jpMsg;

    var $_modal = $('<div class="modal fade" tabindex="-1" role="dialog" data-show="true"><div class="modal-dialog ' + settings.classes + '" role="document"><div class="modal-content"></div></div></div>').appendTo(jcontainer);
    if (settings.size) {
        for (var _p in settings.size) {
            $_modal.find('.modal-dialog').css(_p, settings.size[_p]);
        };
    }
    var $_content = $_modal.find('.modal-content');
    var $_bv = $.fn.tooltip && $.fn.tooltip.Constructor ?  $.fn.tooltip.Constructor.VERSION : undefined;
    var $_header = undefined;
    if ($_bv && $_bv.startsWith('5'))
        $_header = $('<div class="modal-header"><h4 class="modal-title" id="myModalLabel">' + settings.title + '</h4><button type="button" class="close btn-close" data-dismiss="modal" data-bs-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>').appendTo($_content);
    else
        $_header = $('<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title" id="myModalLabel">' + settings.title + '</h4></div>').appendTo($_content);
    var $_body = $('<div class="modal-body">').appendTo($_content);
    var $_footer = $('<div class="modal-footer">').appendTo($_content);
    var $_confirmbtn = $('<button type="button" class="btn btn-primary btn-sm"> 確 定 </button>').appendTo($_footer);
    var $_closebtn = $('<button type="button" class="btn btn-default btn-outline-dark  取 消  btn-sm" data-dismiss="modal" data-bs-dismiss="modal"> 取 消 </button>').appendTo($_footer);
    
    if (typeof settings.content === 'string')
        $_body.html(settings.content);
    else
        $(settings.content).appendTo($_body);

    var _isFromConfirm = false;
    $_confirmbtn.click(function () {
        _isFromConfirm = true;
        //$_modal.modal('hide');//20221013刪
        var r = callback(true);
        if (r != false) //20221013加
            $_modal.modal('hide');
    });
    $_closebtn.click(function () {
        //$_modal.remove();
        $_modal.modal('hide');
        callback(false);
    });
    $_modal.on('hidden.bs.modal', function () {
        if (!_isFromConfirm)
            $_closebtn.trigger("click");
        $_modal.remove();
        if (!_isFromConfirm)
            callback(false);
    });
    return $_modal.modal('show');
};
var jspConfirm = function (jcontainer, optins, callback) {
    return jspConfirmYesNo(jcontainer, optins, callback);
    
};

//產GUID碼
var geguid = function () {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010  
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01  
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
};

//以post方式開啟browser新視窗
//paras:[{key:xx,value:XX},...] ; config:new window's config
var OpenNewWindowByPost = function (url, paras, target, config) {
    var f = '<form method="post" action="' + url + '" target="' + target + '" onSubmit="alert(\'ghjhg\');window.open(\'\', \'foo\', \'width=450,height=300,status=yes,resizable=yes,scrollbars=yes\')">';
    if (paras) {
        if ($.isArray(paras)) {
            $.each(paras, function (idx, para) {
                f += '<input type="hidden"  name="' + para.key + '" id="' + para.key + '" value="' + para.value + '">'
            });
        }
        else {
            for (var k in paras) {
                f += '<input type="hidden"  name="' + k + '" id="' + k + '" value="' + paras[k] + '">'
            }
        }
    }
    f += '</form>';

    var $form = $(f);
    document.body.appendChild($form[0]);

    if (config) {
        try {
            var nw = window.open(url, target, config).focus();
        } catch (ex) {
            alert(ex);
        }
    }

    $form[0].submit();
    $form.remove();
};

var _hadGetJavaScriptUrl = {};
//動態載入java script
var getJavaScripts = function (_urls, _callback, _useCache) {
    if (_urls) {
        if ($.isArray(_urls)) {
            if (_urls.length == 0)
                _callback();
            var _c = 0;
            for (var i = 0; i < _urls.length; i++) {
                _getJavaScript(_urls[i], function () {
                    _c++;
                    if (_urls.length == _c)
                        _callback();
                });
            }
        }
        else
            _getJavaScript(_urls, _callback);
    }
};


var _getJavaScript = function (_url, _callback) {
    var _hadgetscript = _hadGetJavaScriptUrl[_url];
    if (_hadgetscript === true) {
        _callback();
        return;
    }
    if (_hadgetscript == undefined) {
        _hadGetJavaScriptUrl[_url] = [_callback];
        $.getScript(_url).done(function () {
            //console.log('done>>>>>' + _url);
            if (_hadGetJavaScriptUrl[_url]) {
                $.each(_hadGetJavaScriptUrl[_url], function () {
                    this();
                });
                //console.log(_url+'_hadGetJavaScriptUrl[_url]:' + _hadGetJavaScriptUrl[_url].length);
                _hadGetJavaScriptUrl[_url] = true;
            }
        }).fail(function (e) {
            console.log("error>>>>>"+_url + " " + e.status + e.statusText);
        });
    }
    else
        _hadGetJavaScriptUrl[_url].push(_callback);
}

//開啟busyIndicator
//同一個dom可在呼叫hide_busyIndicator前呼叫n次show_busyIndicator
//options:{message:訊息資訊, timeout:busy最多等待時間(undefined-不自動關掉), background_color:}
$.fn.show_busyIndicator = function (options) {
    // Sample Result based on the input.
    var _icon = ($.AppConfigOptions && $.AppConfigOptions.default_loading) ? $.AppConfigOptions.default_loading : { icon: window.helper.misc.getCurrentSiteRootPath() + "Scripts/gis/images/loading/loading_black.gif", size: "0.9em" };
    $.each(this, function (idx, _target) {
        var settings = $.extend({ content: "資料處理中", timeout: 60000, background_color: undefined, loading: _icon }, options);

        if (options && options.url)
            settings.loading.icon = options.url;
        if (options && options.size)
            settings.loading.size = options.size;

        var current = $(_target);
        
        //var _busys= $(".busy-indicator-s", this).length;
        var busyobj;
        if ($(" > .busy-indicator-s", current).length > 0) {//紀錄目前busy count
            busyobj = $($(" > .busy-indicator-s", current)[0]);
            busyobj.attr("data-busy-count", parseInt(busyobj.attr("data-busy-count")) + 1);
            busyobj.find('> label > .msg-contont').html(settings.content);
            busyobj.find('img').attr('src', settings.loading.icon);
        }
        else {
            busyobj = $('<span class="busy-indicator-s"><label ><span class="msg-contont">' + settings.content + '</span>' +
                '<img src="' + settings.loading.icon + '" style="height:' + settings.loading.size + (typeof settings.loading.size === 'string' ? '' : 'px') + '" /></label></span>');

            busyobj.attr("data-busy-count", 1);
            current.append(busyobj);

            if (!settings.loading || !settings.loading.icon || !settings.loading.size)
                busyobj.find('img').hide();

            var _maxct = 0;
            var _setBusyObj2Center = function () {
                setTimeout(function () {
                    var _h = busyobj.height();
                    if (_maxct < 20 && (!_h || _h == 0)) {
                        _maxct++;
                        _setBusyObj2Center();
                        return;
                    }
                    if (current.hasClass('popu-ctrl-content') && current.parent().length > 0 && current.parent().hasClass('popu-ctrl')) {
                        busyobj.height(current[0].offsetHeight);
                        busyobj.css('top', current.position().top);
                    }
                    $('label', busyobj).css("padding-top",(_h / 2)-6);// + (_busys==0?0:($('label', busyobj).height() * _busys) + 2));
                }, 100);
            };
            _setBusyObj2Center();
            current.trigger('busy-change', [true]);
        }
        if (settings.background_color)
            busyobj.css("background-color", settings.background_color);


        //自動關閉
        if (settings.timeout) {
            //重設timeout並clearTimeout
            var timeoutHandle = busyobj.attr('data-busyIndicator-timeout');
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
            //最多等待時間
            busyobj.attr('data-busyIndicator-timeout', setTimeout(function () {
                busyobj.remove();
            }, settings.timeout));
        }
    });
};

//關閉busyIndicator, enforceclose:強迫關閉
$.fn.hide_busyIndicator = function (enforceclose) {
    $.each(this, function (idx, item) {
        if ($(' > .busy-indicator-s', this).length === 0)
            return;
        var busyobj = $($(" > .busy-indicator-s", this)[0]);
        var _busycount = parseInt(busyobj.attr("data-busy-count")) - 1;
        if (_busycount <= 0 || enforceclose) {
            var timeoutHandle = busyobj.attr('data-busyIndicator-timeout');
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
            busyobj.remove();
            $(item).trigger('busy-change', [false]);
        }
        else
            busyobj.attr("data-busy-count", _busycount);
    });
};

var _isSupportLocalStorage = undefined;
$.isSupportLocalStorage = function () {
    if (_isSupportLocalStorage !== undefined) {
        return _isSupportLocalStorage;
    }
    try {
        localStorage.setItem("test-localtorage-test", "test-localtorage-test");
        localStorage.removeItem("test-localtorage-test");
        _isSupportLocalStorage = true;
    }
    catch (e) {
        _isSupportLocalStorage = false;
    }
    return _isSupportLocalStorage;
};

$.localCache = {
    set: function (k, v) {
        var key = window.document.title + "_" + k;
        //if(!dojo.isIos && localStorage){ //ios ipay 及 iphone有問題
        if ($.isSupportLocalStorage()) {
            try {
                localStorage.setItem(key, JSON.stringify(v));
            } catch (ex) {
                console.log(ex);
                return 'error';
            }
        }
    },
    get: function (k) {
        var result;
        var key = window.document.title + "_" + k;
        //if (!dojo.isIos && localStorage) {
        if ($.isSupportLocalStorage()) {
            var ls = localStorage.getItem(key);
            if (ls)
                result = JSON.parse(ls);
        }
        return result;
    },
    remove: function (k) {
        if ($.isSupportLocalStorage()) {
            var key = window.document.title + "_" + k;
            localStorage.removeItem(key);
        }
    },
    defaultobj: {}
};

//往右open，往左close
$.toggleRightLeftPanel = function ($panel, defaultshow, $othertrigger) {
    $.toggleSliderPanel("right-left", $panel, defaultshow, $othertrigger);
};
//往下open，往上close
$.toggleDownUpPanel = function ($panel, defaultshow, $othertrigger) {
    $.toggleSliderPanel("down-up", $panel, defaultshow, $othertrigger);
};
//slider panel classmode:right-left 、down-up
$.toggleSliderPanel = function (classmode, $panel, defaultshow, $othertrigger) {
    $panel.prev(".toggle-slider-panel-checkbox." + classmode).remove();
    $panel.before('<input class="toggle-slider-panel-checkbox ' + classmode + '" type="checkbox">');

    setTimeout(function () {

        if (defaultshow) {
            $panel.prev().prop("checked", true);
        }
        if ($othertrigger) {
            if ($.isArray($othertrigger)) {
                $.each($othertrigger, function () {
                    this.click(function (evt) {
                        if ("checkbox" == $(evt.traget).attr("type"))
                            $panel.prev().prop("checked", is(':checked'))
                        else
                            $panel.prev().prop("checked", false);
                    });
                });
            }
            else {
                $othertrigger.click(function () {
                    if ("checkbox" == $othertrigger.attr("type"))
                        $panel.prev().prop("checked", is(':checked'))
                    else
                        $panel.prev().prop("checked", false);
                });
            }

        }
    });
};

(function ($) {
    var attachEvent = document.attachEvent,
		stylesCreated = false;

    var jQuery_resize = $.fn.listenResize;

    $.fn.listenResize = function (callback) {
        return this.each(function () {
            if (this == window)
                jQuery_resize.call(jQuery(this), callback);
            else
                addResizeListener(this, callback);
        });
    }

    $.fn.removeResize = function (callback) {
        return this.each(function () {
            removeResizeListener(this, callback);
        });
    }

    if (!attachEvent) {
        var requestFrame = (function () {
            var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
								function (fn) { return window.setTimeout(fn, 20); };
            return function (fn) { return raf(fn); };
        })();

        var cancelFrame = (function () {
            var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame ||
								   window.clearTimeout;
            return function (id) { return cancel(id); };
        })();

        function resetTriggers(element) {
            var triggers = element.__resizeTriggers__,
				expand = triggers.firstElementChild,
				contract = triggers.lastElementChild,
				expandChild = expand.firstElementChild;
            contract.scrollLeft = contract.scrollWidth;
            contract.scrollTop = contract.scrollHeight;
            expandChild.style.width = expand.offsetWidth + 1 + 'px';
            expandChild.style.height = expand.offsetHeight + 1 + 'px';
            expand.scrollLeft = expand.scrollWidth;
            expand.scrollTop = expand.scrollHeight;
        };

        function checkTriggers(element) {
            return element.offsetWidth != element.__resizeLast__.width ||
						 element.offsetHeight != element.__resizeLast__.height;
        }

        function scrollListener(e) {
            var element = this;
            resetTriggers(this);
            if (this.__resizeRAF__) cancelFrame(this.__resizeRAF__);
            this.__resizeRAF__ = requestFrame(function () {
                if (checkTriggers(element)) {
                    element.__resizeLast__.width = element.offsetWidth;
                    element.__resizeLast__.height = element.offsetHeight;
                    element.__resizeListeners__.forEach(function (fn) {
                        fn.call(element, e);
                    });
                }
            });
        };

        /* Detect CSS Animations support to detect element display/re-attach */
        var animation = false,
			animationstring = 'animation',
			keyframeprefix = '',
			animationstartevent = 'animationstart',
			domPrefixes = 'Webkit Moz O ms'.split(' '),
			startEvents = 'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split(' '),
			pfx = '';
        {
            var elm = document.createElement('fakeelement');
            if (elm.style.animationName !== undefined) { animation = true; }

            if (animation === false) {
                for (var i = 0; i < domPrefixes.length; i++) {
                    if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
                        pfx = domPrefixes[i];
                        animationstring = pfx + 'Animation';
                        keyframeprefix = '-' + pfx.toLowerCase() + '-';
                        animationstartevent = startEvents[i];
                        animation = true;
                        break;
                    }
                }
            }
        }

        var animationName = 'resizeanim';
        var animationKeyframes = '@' + keyframeprefix + 'keyframes ' + animationName + ' { from { opacity: 0; } to { opacity: 0; } } ';
        var animationStyle = keyframeprefix + 'animation: 1ms ' + animationName + '; ';
    }

    function createStyles() {
        if (!stylesCreated) {
            //opacity:0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
            var css = (animationKeyframes ? animationKeyframes : '') +
					'.resize-triggers { ' + (animationStyle ? animationStyle : '') + 'visibility: hidden; opacity: 0; } ' +
					'.resize-triggers, .resize-triggers > div, .contract-trigger:before { content: \" \"; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }',
				head = document.head || document.getElementsByTagName('head')[0],
				style = document.createElement('style');

            style.type = 'text/css';
            if (style.styleSheet) {
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }

            head.appendChild(style);
            stylesCreated = true;
        }
    }

    window.addResizeListener = function (element, fn) {
        if (attachEvent) element.attachEvent('onresize', fn);
        else {
            if (!element.__resizeTriggers__) {
                if (getComputedStyle(element).position == 'static') element.style.position = 'relative';
                createStyles();
                element.__resizeLast__ = {};
                element.__resizeListeners__ = [];
                (element.__resizeTriggers__ = document.createElement('div')).className = 'resize-triggers';
                element.__resizeTriggers__.innerHTML = '<div class="expand-trigger"><div></div></div>' +
																						'<div class="contract-trigger"></div>';
                element.appendChild(element.__resizeTriggers__);
                resetTriggers(element);
                element.addEventListener('scroll', scrollListener, true);

                /* Listen for a css animation to detect element display/re-attach */
                animationstartevent && element.__resizeTriggers__.addEventListener(animationstartevent, function (e) {
                    if (e.animationName == animationName)
                        resetTriggers(element);
                });
            }
            element.__resizeListeners__.push(fn);
        }
    };

    window.removeResizeListener = function (element, fn) {
        if (attachEvent) element.detachEvent('onresize', fn);
        else {
            if (element.__resizeListeners__) {
                element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
                if (!element.__resizeListeners__.length) {
                    element.removeEventListener('scroll', scrollListener);
                    element.__resizeTriggers__ = !element.removeChild(element.__resizeTriggers__);
                }
            }
        }
    }
}(jQuery));


(function () {
    //IE 不能run
    //單一Worksheet
    var tableToExcel = (function () {
        var uri = 'data:application/vnd.ms-excel;base64,'
        , template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>'
        , base64 = function (s) { return window.btoa(unescape(encodeURIComponent(s))) }
        , format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) }
        return function (el, wsname, name) {
            $(el).find("td:hidden").remove();//mergeCells 用hide會有問題,需移除
            var ctx = { worksheet: wsname || 'Worksheet', table: el.innerHTML };
            if (name) {
                var _$a = $("<a>").hide().appendTo("body");
                _$a[0].href = uri + base64(format(template, ctx));
                _$a[0].download = name + ".xls";
                _$a[0].click();
                _$a.remove();
            }
            else
                window.location.href = uri + base64(format(template, ctx));
        }
    })();
    var tablesToCsv = function (tables, wsnames, wbname) {
        var _lineBreak = "\r\n";
        function tableToCSV(table) {
            // We'll be co-opting `slice` to create arrays
            var slice = Array.prototype.slice;

            return slice.call(table.rows).map(function (row) {
                return slice.call(row.cells).map(function (cell) {
                    return '"t"'.replace("t", cell.textContent);
                }).join(",");
            }).join(_lineBreak);

        }
        var csvs = [];
        $.each(tables, function (idx, t) {
            if (t.innerHTML == "")
                return;
            csvs.push("\ufeff" + (tables.length > 1 ? (idx == 0 ? "" : _lineBreak + _lineBreak) + wsnames[idx] + _lineBreak : "") + tableToCSV(t)); //加\ufeff，解決中文馬)
        });
        //var csv = 
        var blob = new Blob(csvs, { type: 'text/xls,charset=UTF-8' });
        if (navigator.msSaveOrOpenBlob) {
            // Works for Internet Explorer and Microsoft Edge
            navigator.msSaveOrOpenBlob(blob, wbname + ".csv");

        } else {
            var anchor = document.body.appendChild(
                 document.createElement("a")
               );
            // If the [download] attribute is supported, try to use it
            if ("download" in anchor) {
                anchor.download = wbname + ".csv";
                anchor.href = URL.createObjectURL(blob);
                anchor.click();
                $(anchor).remove();
            }
        }

    };
    //多個Worksheet
    var tablesToExcel = (function () {
        var uri = 'data:application/vnd.ms-excel;base64,'
        , tmplWorkbookXML = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'
          + '<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Author>Axel Richter</Author><Created>{created}</Created></DocumentProperties>'
          + '<Styles>'
          + '<Style ss:ID="Currency"><NumberFormat ss:Format="Currency"></NumberFormat></Style>'
          + '<Style ss:ID="Date"><NumberFormat ss:Format="Medium Date"></NumberFormat></Style>'
          + '</Styles>'
          + '{worksheets}</Workbook>'
        , tmplWorksheetXML = '<Worksheet ss:Name="{nameWS}"><Table>{rows}</Table></Worksheet>'
        , tmplCellXML = '<Cell{attributeStyleID}{attributeFormula}{merge}{index}><Data ss:Type="{nameType}">{data}</Data></Cell>'
        , base64 = function (s) { return window.btoa(unescape(encodeURIComponent(s))) }
        , format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) }
        return function (tables, wsnames, wbname, appname) {
            var ctx = "";
            var workbookXML = "";
            var worksheetsXML = "";
            var rowsXML = "";

            for (var i = 0; i < tables.length; i++) {
                //$(tables[i]).find("td:hidden").remove();//mergeCells 用hide會有問題,需移除,
                //$(tables[i]).find("td:not(:visible)").remove();//mergeCells 用hide會有問題,需移除
                if (!tables[i].nodeType) tables[i] = document.getElementById(tables[i]);
                var mergeDownCell = [];
                var hasHiddenCell = false;
                for (var j = 0; j < tables[i].rows.length; j++) {
                    hasHiddenCell = false;
                    rowsXML += '<Row>'
                    for (var k = 0; k < tables[i].rows[j].cells.length; k++) {
                        if ($(tables[i].rows[j].cells[k]).is(":hidden")) {
                            hasHiddenCell = true;
                            continue;
                        }
                        var dataType = tables[i].rows[j].cells[k].getAttribute("data-type");
                        var dataStyle = tables[i].rows[j].cells[k].getAttribute("data-style");
                        var dataValue = tables[i].rows[j].cells[k].getAttribute("data-value");
                        var colSpan = tables[i].rows[j].cells[k].colSpan;
                        var rowSpan = tables[i].rows[j].cells[k].rowSpan;
                        colSpan = colSpan ? colSpan : 1;
                        rowSpan = rowSpan ? rowSpan : 1;

                        if (rowSpan != 1)
                            mergeDownCell.push([j, k, rowSpan, colSpan]);

                        dataValue = (dataValue) ? dataValue : tables[i].rows[j].cells[k].innerHTML;
                        var dataFormula = tables[i].rows[j].cells[k].getAttribute("data-formula");
                        dataFormula = (dataFormula) ? dataFormula : (appname == 'Calc' && dataType == 'DateTime') ? dataValue : null;
                        ctx = {
                            attributeStyleID: (dataStyle == 'Currency' || dataStyle == 'Date') ? ' ss:StyleID="' + dataStyle + '"' : ''
                               , nameType: (dataType == 'Number' || dataType == 'DateTime' || dataType == 'Boolean' || dataType == 'Error') ? dataType : 'String'
                               , data: (dataFormula) ? '' : dataValue
                               , attributeFormula: (dataFormula) ? ' ss:Formula="' + dataFormula + '"' : ''
                               , merge: (rowSpan != 1 || colSpan != 1) ? ' ss:MergeAcross="' + (colSpan - 1) + '" ss:MergeDown="' + (rowSpan - 1) + '"' : ''
                               , index: hasHiddenCell ? (' ss:Index="' + (k + 1)) + '"' : ''
                        };
                        rowsXML += format(tmplCellXML, ctx);
                    }
                    rowsXML += '</Row>'
                }

                ctx = { rows: rowsXML, nameWS: wsnames[i] || 'Sheet' + i };
                //ctx = { rows: tables[i].innerHTML, nameWS: wsnames[i] || 'Sheet' + i };
                worksheetsXML += format(tmplWorksheetXML, ctx);
                rowsXML = "";
            }

            ctx = { created: (new Date()).getTime(), worksheets: worksheetsXML };
            workbookXML = format(tmplWorkbookXML, ctx);

            console.log(wbname);

            var link = document.createElement("A");
            link.href = uri + base64(workbookXML);
            link.download = wbname || 'Workbook.xls';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    })();
    //selector:string, name:string sheet名稱
    function CreateExcelSheet(selector, sheetsname, name, exporttype) {

        var el = $(selector);
        if (el.length == 0)
            alert(selector + "無此DOM");

        var els = [];
        if ($.isArray(selector))
            els = selector;
        else if (typeof selector === "string")
            $.each($(selector), function () { els.push(this); });
        else
            $.each(selector, function () { els.push(this); });
        //tablesToExcel(selector, sheetsname, name);
        //return;
        exporttype = exporttype || 'xlsx';
        if (exporttype==true || exporttype=='csv')
            tablesToCsv(els, sheetsname, name);
        else if (exporttype == 'ods' || exporttype == 'xlsx') { //參考https://sheetjs.com/demos/table.html
            var todoOds = function () {
                sheetsname = sheetsname || 'Sheet';
                var wsns = $.isArray(sheetsname) ? sheetsname : [sheetsname];
                name = name || '下載';
                var wb = XLSX.utils.book_new();
                for (var i = 0; i < els.length; i++) {
                    var elt = els[i];
                    var wsn = wsns.length - 1 >= i ? wsns[i] : wsns[wsns.length - 1] + i;
                    var ws = XLSX.utils.table_to_sheet(elt, { sheet: wsn, raw: true, display:true });//, cellDates: true, dateNF: 'yyyy/MM/dd HH:mm' });
                    XLSX.utils.book_append_sheet(wb, ws, wsn);
                }
                //var wb = XLSX.utils.table_to_book(elt, { sheet: sheetsname, raw:true, cellDates: true, dateNF:'yyyy/MM/dd HH:mm'}); //單一table
                var _url = XLSX.writeFile(wb, name + '.' + exporttype);
            }

            if (!window.XLSX) {
                var jsp = (getScriptPath("gis/helper") || getScriptPath("gis/Main")) + "gis";
                helper.misc.getJavaScripts([jsp+'/other/xlsx.full.min.js'], todoOds)
            }
            else
                todoOds();

        }
        else {
            try {
                //var msie = ua.indexOf("MSIE ");
                //ie 的網際網路及近斷網路 ActiveX要全啟用(將未標示成安全的Active控制項初始化並執行指令碼)
                //如錯誤訊息"傳遞到系統呼叫的資料區太小", 可慮是否中文檔名問題,尚未驗證??? http://www.mobile01.com/topicdetail.php?f=300&t=1584811
                if (window.ActiveXObject) {
                    var xls = new ActiveXObject("Excel.Application");

                    xls.visible = false;
                    xls.Workbooks.Add();
                    //$.each(selector, function (idx) {
                    for (var idx = selector.length - 1; idx >= 0 ; idx--) {
                        var x = selector[idx].rows;
                        if (idx != selector.length - 1)
                            xls.Worksheets.Add();
                        var oSheet = xls.ActiveSheet;
                        //oSheet.Application.Visible = true;
                        oSheet.Name = sheetsname[idx];
                        for (var i = 0; i < x.length; i++) { //x>>table row
                            var y = x[i].cells;

                            var _cellIndexX = i + 1;//cell index 從1開始
                            for (j = 0; j < y.length; j++) { //y>>tabel column
                                var _cellIndexY = j + 1;
                                xls.Cells(_cellIndexX, _cellIndexY).Value = y[j].innerText;
                                var _cSpan = y[j].colSpan ? y[j].colSpan : 1;
                                var _rSpan = y[j].rowSpan ? y[j].rowSpan : 1;
                                if (_cSpan > 1 || _rSpan > 1)
                                    oSheet.Range(oSheet.Cells(_cellIndexX, _cellIndexY), oSheet.Cells(_cellIndexX + _rSpan - 1, _cellIndexY + _cSpan - 1)).Merge();
                            }
                        }
                    }
                    xls.Visible = true;
                    xls.UserControl = true;

                    return xls;
                } else {
                    if (els.length == 1)
                        tableToExcel(els[0], sheetsname, name);
                    else
                        tablesToExcel(els, sheetsname, name);
                }
            } catch (ex) {
                console.log("改產CSV，錯誤原因:"+ex.toString());
                tablesToCsv(els, sheetsname, name);
            }
        }
    }

    var loadWorkbook = function (fileurl, callback) {
        var todoGetWorkbook = function () {
            /* set up async GET request */
            var req = new XMLHttpRequest();
            req.open("GET", fileurl, true);
            req.responseType = "arraybuffer";

            req.onload = function (e) {
                var data = new Uint8Array(req.response);
                var workbook = XLSX.read(data, { type: "array" });
                callback(workbook);
            }
            req.send();
        }
        if (!window.XLSX) {
            var jsp = (getScriptPath("gis/helper") || getScriptPath("gis/Main")) + "gis";
            helper.misc.getJavaScripts([jsp + '/other/xlsx.full.min.js'], todoGetWorkbook)
        }
        else
            todoGetWorkbook();
    }

    var html2image = function (htmlobj, filename, type) {
        filename = filename || 'dfile';
        type = type || 'jpg';
        var $el = $(htmlobj);
        if ($el.length == 0)
            alert(htmlobj + "無此DOM");
        var _html2image = function ($_html) {
            html2canvas($el[0], { //google OK ，arcgis geomerty 有問題，chrome可，IE有問題(只能用 newWindow:false), 另地圖平移或zoom後會有問題
                logging: false,
                useCORS: true,
                onclone: function (document) {
                    $(document).find('.leaflet-container .leaflet-marker-pane img').addClass('print');//.css(m).style.marginLeft = 0; margin html2canvas會有問題
                    //document.querySelector('.leaflet-container .leaflet-marker-pane img').style.marginTop = 0;
                }
            }).then(function (canvas) {
                htmlobj.find('.leaflet-container .leaflet-marker-pane img').removeClass('print');
                if (navigator.msSaveBlob) {
                    var URL = window.URL;
                    var BlobBuilder = window.MSBlobBuilder;
                    navigator.saveBlob = navigator.msSaveBlob;
                    var imgBlob = canvas.msToBlob();
                    if (BlobBuilder && navigator.saveBlob) {
                        var showSave = function (data, name, mimetype) {
                            var builder = new BlobBuilder();
                            builder.append(data);
                            var blob = builder.getBlob(mimetype || "application/octet-stream");
                            if (!name)
                                name = "Download.bin";
                            navigator.saveBlob(blob, name);
                        };
                        setTimeout(function () {
                            showSave(imgBlob, filename + "." + type, "image/" + type);
                        }, 100);
                    }
                }
                else {
                    var uridata = canvas.toDataURL("image/" + type);
                    //console.log(uridata);

                    $("<a>", {
                        href: uridata,
                        download: filename + "." + type
                    })
                        .on("click", function () { $(this).remove();})
                    .appendTo("body")[0].click();
                }
            });
        }
        
        if (!window.html2canvas) {
            var jsf = [];
            var jsp = (getScriptPath("gis/helper") || getScriptPath("gis/Main")) + "gis";

            if (navigator.msSaveBlob) {
                jsf.push(jsp + '/other/html2canvas-ie.js');
                jsf.push(jsp + '/other/html2canvas-svg-ie.js');
                jsf.push(jsp + '/other/bluebird.min.js');
            }
            else
                jsf.push(jsp + '/other/html2canvas.js');
            getJavaScripts(jsf, function () {
                _html2image();
            })
        }
        else
            _html2image();
       
    }

    //options:{data:[], selectMode: helper.tree.selectMode.single, useline: false, checkeditable: false,fixed:false }
    //options.data={name, items, class, collapse}
    var rTree = function (_$dom, _options) {
        if (_$dom.length == 0) {
            console.log("rTree參數_$dom有問題!!")
            throw Error(["rTree參數_$dom有問題!!"])
        }
        this.options = $.extend({ selectMode: helper.tree.selectMode.single, useline: false, checkeditable: false, fixed: false }, _options);
        this.$element = _$dom;
        var current = this;
        //組dom
        if (this.options && $.isArray(this.options.data)) {
            _$dom.empty();
            var $root = $("<ul>").appendTo(_$dom);
            var _appendItem = function (_$p, _item) {
                var _$n = $("<li>" + _item.name + "</li>").appendTo(_$p);
                _$n[0].item = _item;
                if (_item.class)
                    _$n.addClass(_item.class);
                if (_item.collapse == true && current.options.fixed)
                    _$n.addClass("collapse");
                if (_item.items) {
                    var _$ul = $("<ul>").appendTo(_$n);
                    $.each(_item.items, function () {
                        _appendItem(_$ul, this)
                    });
                }
            };
            $.each(this.options.data, function () {
                _appendItem($root, this)
            });
        }
        //int tree 物件
        var _initNode = function (_$ul) {
            var _$items = _$ul.find("> li ").addClass("rtree-node");
            $.each(_$items, function () {
                if ($(this).find(">ul").length > 0) {
                    $(this).addClass("rtree-branch");
                    _initNode($(this).find(">ul"));
                }
                else {
                    $(this).addClass("rtree-leaf");
                }
            });

        };
        var _$rootul;
        if (_$dom[0].type == "ul")
            _$rootul = _$dom;
        else
            _$rootul = _$dom.find(">ul:eq(0)");
        _$rootul.addClass("rtree-root");

        _initNode(_$rootul);

        if (this.options.fixed)
            _$rootul.addClass("fixed-node");

        $('<span class="rtree-node-icon">').prependTo(_$rootul.find(".rtree-node"));

        if (this.options.checkeditable) {
            _$rootul.addClass("checkeditable");
            $('<span class="r-tree-check-icon">').prependTo(_$rootul.find(".rtree-node"));
        }

        if (this.options.useline) {
            _$rootul.addClass("connection-line");

            $('<span class="link-line">').prependTo(_$rootul.find(".rtree-node"));
            $('<span class="hide-border-line">').prependTo(_$rootul.find(".rtree-node"));
        }

        var selectedchange = function (_node) {
            if (current.options.checkeditable) {
                var _c = $(_node).hasClass("selected");
                var $_changeLeaf;
                if (_c) {
                    $(_node).parents(".rtree-branch").addClass("selected"); //所有上層
                    $_changeLeaf = $(_node).find(".rtree-leaf:not(.selected)");
                    $(_node).find(".rtree-branch").addClass("selected");//所有下層
                }
                else {
                    $(_node).parents(".rtree-branch").removeClass("selected"); //所有上層
                    $_changeLeaf = $(_node).find(".rtree-leaf.selected");
                    $(_node).find(".rtree-branch").removeClass("selected");
                }
                $.each($_changeLeaf, function () {
                    $(this).trigger("click");
                });

                var $ps = $(_node).parents(".rtree-branch"); //確認每一branch狀態
                $.each($ps, function () {
                    var $bcb = $(this).find("ul >.rtree-leaf.selected");//同層被選
                    $bcb.length > 0 ? $(this).addClass("selected") : $(this).removeClass("selected");
                });
            }
        };
        //事件
        _$rootul.find(".rtree-branch").click(function (e) {
            //e.preventDefault();
            //if (!current.options.fixed)
            //    $(this).toggleClass("collapse", 300);
            e.target = this;
            $(this).toggleClass("selected");
            if (!current.options.fixed) {
                if ($(this).hasClass('selected')) 
                    $(this).removeClass("collapse", 300);
                else
                    $(this).addClass("collapse", 300).find(".rtree-branch").addClass('collapse').removeClass("selected");//所有child
            }

            e.type = helper.tree.event.selectedBranchChange;
            //_$dom.trigger(e);
            var ne = $.extend({}, e);
            ne.type = helper.tree.event.selectedNoteChange;
            //_$dom.trigger(ne);
            if (current.options.checkeditable)
                selectedchange(this);
            _$dom.trigger(e);
            _$dom.trigger(ne);
            return false;
        });
        _$rootul.find(".rtree-leaf").click(function (e) {
            //e.preventDefault();

            if (current.options.selectMode == helper.tree.selectMode.single)
                _$dom.find(".rtree-leaf").removeClass("selected");
            e.target = this;
            $(this).toggleClass("selected");
            e.type = helper.tree.event.selectedLeafChange;
            _$dom.trigger(e);

            var ne = $.extend({}, e);
            ne.type = helper.tree.event.selectedNoteChange;
            _$dom.trigger(ne);
            if (current.options.checkeditable)
                selectedchange(this);
            return false;
        });
    };
    rTree.prototype.getSelectedLeaf = function () {
        var _s = [];
        $.each(this.$element.find(".rtree-leaf.selected"), function () {
            _s.push({ target: this, value: this.item })
        });
        return _s;
    };
    //Calculates the distance between two latlng locations in m(公尺).
    var pointDistance = function (p1, p2) {
        if (!p1 || !p2) {
            return 0;
        }

        var R = 6371; // Radius of the Earth in km
        var dLat = (p2[1] - p1[1]) * Math.PI / 180;
        var dLon = (p2[0] - p1[0]) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1[1] * Math.PI / 180) * Math.cos(p2[1] * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d * 1000;
    }
    //wgs84Coordinates經緯座標: [[x1,y1],[x2,y2],...],結果單位:平方公尺
    var polygonArea = function (wgs84Coordinates) {
        var i, j, area = 0;//平方度(經緯)
        var twd97Coordinates = []; 
        for (i = 0; i < wgs84Coordinates.length; i++) {
            var _temp = $.WGS84ToTWD97(wgs84Coordinates[i][0], wgs84Coordinates[i][1]);
            twd97Coordinates.push([_temp.x, _temp.y]);
        }
        for (i = 0; i < twd97Coordinates.length; i++) {
            j = (i + 1) % twd97Coordinates.length;
            area += twd97Coordinates[i][0] * twd97Coordinates[j][1];
            area -= twd97Coordinates[i][1] * twd97Coordinates[j][0];
        }
        area /= 2;
        return Math.abs(area);
    }
    var polygonArea1 = function (wgs84Coordinates) {
        var i, j, area = 0;//平方度(經緯)
        for (i = 0; i < wgs84Coordinates.length; i++) {
            j = (i + 1) % wgs84Coordinates.length;
            area += wgs84Coordinates[i][0] * wgs84Coordinates[j][1];
            area -= wgs84Coordinates[i][1] * wgs84Coordinates[j][0];
        }
        area /= 2;
        return Math.abs(area) * (60 * 60) * (1852 * 1852);
    }

    //point:[x,y], polygon:[[x1,y1],[x2,y2],...], or [[[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...]]
    var pointInPolygon = function (p, points) {
        var _result = false;
        if (!points || points.length == 0)
            return _result;
        if ($.isArray(points[0][0])) {
            $.each(points, function () {
                _result = pointInPolygon(p, this);
                if (_result)
                    return false;
            });
        }
        else {
            var j = points.length - 1;
            for (var i = 0; i < points.length; i++) {
                var li = points[i];
                var lj = points[j];
                if (li[1] < p[1] && lj[1] >= p[1] ||
                    lj[1] < p[1] && li[1] >= p[1]) {
                    if (li[0] +
                        (p[1] - li[1]) / (lj[1] - li[1]) *
                        (lj[0] - li[0]) < p[0]) {
                        _result = !_result;
                    }
                }
                j = i;
            }
        }
        return _result;
    }
    //point in geojson polygon geometry
    var pointInPolygonGeometry = function (p,geometry) {
        var r = false;
        if (geometry.type == "Polygon") {
            r = pointInPolygon(p, geometry.coordinates);
        }
        else if (geometry.type == "GeometryCollection") {
            $.each(geometry.geometries, function () {
                if (this.type == "Polygon") {
                    r = pointInPolygon(p, this.coordinates);// pointInGeometry(this);
                    if (r)
                        return false;
                }
            });
        }
        return r;

    }

    //取URL參數，return object
    function getRequestParas() {
        var s1 = location.search.substring(1, location.search.length).split('&'),
            r = {}, s2, i;
        for (i = 0; i < s1.length; i += 1) {
            s2 = s1[i].split('=');
            if (s2[0].trim() != "")
                r[decodeURIComponent(s2[0]).toLowerCase()] = decodeURIComponent(decodeURIComponent(s2[1]));
        }
        return r;
    };


    //WGS84、TWD97坐標轉換
    var cal_a = 6378137.0;
    var cal_b = 6356752.314245;
    var lon0 = 121 * Math.PI / 180;
    var k0 = 0.9999;
    var dx = 250000;
    //經緯度轉TWD97
    $.WGS84ToTWD97 = function (lon, lat) {
        lon = (lon / 180) * Math.PI;
        lat = (lat / 180) * Math.PI;
        //---------------------------------------------------------        
        var e = Math.pow((1 - Math.pow(cal_b, 2) / Math.pow(cal_a, 2)), 0.5);
        var e2 = Math.pow(e, 2) / (1 - Math.pow(e, 2));
        var n = (cal_a - cal_b) / (cal_a + cal_b);
        var nu = cal_a / Math.pow((1 - (Math.pow(e, 2)) * (Math.pow(Math.sin(lat), 2))), 0.5);
        var p = lon - lon0;
        var A = cal_a * (1 - n + (5 / 4) * (Math.pow(n, 2) - Math.pow(n, 3)) + (81 / 64) * (Math.pow(n, 4) - Math.pow(n, 5)));
        var B = (3 * cal_a * n / 2.0) * (1 - n + (7 / 8.0) * (Math.pow(n, 2) - Math.pow(n, 3)) + (55 / 64.0) * (Math.pow(n, 4) - Math.pow(n, 5)));
        var C = (15 * cal_a * (Math.pow(n, 2)) / 16.0) * (1 - n + (3 / 4.0) * (Math.pow(n, 2) - Math.pow(n, 3)));
        var D = (35 * cal_a * (Math.pow(n, 3)) / 48.0) * (1 - n + (11 / 16.0) * (Math.pow(n, 2) - Math.pow(n, 3)));
        var E = (315 * cal_a * (Math.pow(n, 4)) / 51.0) * (1 - n);
        var S = A * lat - B * Math.sin(2 * lat) + C * Math.sin(4 * lat) - D * Math.sin(6 * lat) + E * Math.sin(8 * lat);
        //計算Y值        
        var K1 = S * k0;
        var K2 = k0 * nu * Math.sin(2 * lat) / 4.0;
        var K3 = (k0 * nu * Math.sin(lat) * (Math.pow(Math.cos(lat), 3)) / 24.0) * (5 - Math.pow(Math.tan(lat), 2) + 9 * e2 * Math.pow((Math.cos(lat)), 2) + 4 * (Math.pow(e2, 2)) * (Math.pow(Math.cos(lat), 4)));
        var y = K1 + K2 * (Math.pow(p, 2)) + K3 * (Math.pow(p, 4));
        //計算X值        
        var K4 = k0 * nu * Math.cos(lat);
        var K5 = (k0 * nu * (Math.pow(Math.cos(lat), 3)) / 6.0) * (1 - Math.pow(Math.tan(lat), 2) + e2 * (Math.pow(Math.cos(lat), 2)));
        var x = K4 * p + K5 * (Math.pow(p, 3)) + dx;
        return { x: x, y: y };

    };
    //TWD97轉經緯度
    $.TWD97ToWGS84 = function (x, y) {
        var dy = 0;
        var e = Math.pow((1 - Math.pow(cal_b, 2) / Math.pow(cal_a, 2)), 0.5);
        x -= dx;
        y -= dy;
        // Calculate the Meridional Arc        
        var M = y / k0;
        // Calculate Footprint Latitude        
        var mu = M / (cal_a * (1.0 - Math.pow(e, 2) / 4.0 - 3 * Math.pow(e, 4) / 64.0 - 5 * Math.pow(e, 6) / 256.0));
        var e1 = (1.0 - Math.pow((1.0 - Math.pow(e, 2)), 0.5)) / (1.0 + Math.pow((1.0 - Math.pow(e, 2)), 0.5));
        var J1 = (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32.0);
        var J2 = (21 * Math.pow(e1, 2) / 16 - 55 * Math.pow(e1, 4) / 32.0);
        var J3 = (151 * Math.pow(e1, 3) / 96.0);
        var J4 = (1097 * Math.pow(e1, 4) / 512.0);
        var fp = mu + J1 * Math.sin(2 * mu) + J2 * Math.sin(4 * mu) + J3 * Math.sin(6 * mu) + J4 * Math.sin(8 * mu);
        // Calculate Latitude and Longitude        
        var e2 = Math.pow((e * cal_a / cal_b), 2);
        var C1 = Math.pow(e2 * Math.cos(fp), 2);
        var T1 = Math.pow(Math.tan(fp), 2);
        var R1 = cal_a * (1 - Math.pow(e, 2)) / Math.pow((1 - Math.pow(e, 2) * Math.pow(Math.sin(fp), 2)), (3.0 / 2.0));
        var N1 = cal_a / Math.pow((1 - Math.pow(e, 2) * Math.pow(Math.sin(fp), 2)), 0.5);
        var D = x / (N1 * k0);
        // 計算緯度   
        var Q1 = N1 * Math.tan(fp) / R1;
        var Q2 = (Math.pow(D, 2) / 2.0);
        var Q3 = (5 + 3 * T1 + 10 * C1 - 4 * Math.pow(C1, 2) - 9 * e2) * Math.pow(D, 4) / 24.0;
        var Q4 = (61 + 90 * T1 + 298 * C1 + 45 * Math.pow(T1, 2) - 3 * Math.pow(C1, 2) - 252 * e2) * Math.pow(D, 6) / 720.0;
        var lat = fp - Q1 * (Q2 - Q3 + Q4);
        // 計算經度      
        var Q5 = D;
        var Q6 = (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6;
        var Q7 = (5 - 2 * C1 + 28 * T1 - 3 * Math.pow(C1, 2) + 8 * e2 + 24 * Math.pow(T1, 2)) * Math.pow(D, 5) / 120.0;
        var lon = lon0 + (Q5 - Q6 + Q7) / Math.cos(fp);
        lat = (lat * 180) / Math.PI;
        //緯        
        lon = (lon * 180) / Math.PI;
        //經        
        return { lon: lon, lat: lat };

    };

    //回傳IOS、Android、unknown
    function getMobileOperatingSystem() {
        var userAgent = navigator.userAgent || navigator.vendor || window.opera;

        if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
            return  window.helper.misc.MobileOperatingSystem .iOS;
        }
        else if (userAgent.match(/Android/i)) {
            return window.helper.misc.MobileOperatingSystem.Android;
        }
        else {
            return window.helper.misc.MobileOperatingSystem.unknown; 
        }
    }
    var getbootstrapversion = function () {
        var v = 3;
        try {
            v = ($().modal || $().tab).Constructor.VERSION.split('.')[0];
        } catch(e) {

        }
        return v;
    }
    var genBootstrapTabpanel = function ($_container, _id, _classes, _heads, _contents, _istabsbelow) {
        var id = _id || 'tabpanel' + helper.misc.geguid();

        var $_tabpanel = $('<div id="'+id+'" class="' + (_classes ? _classes : '') + '">');
        var $_ul = $('<ul class="nav nav-tabs" role="tablist">').appendTo($_tabpanel);
        var $_content = $('<div class="tab-content">').appendTo($_tabpanel);
        if (_istabsbelow)
            $_ul.appendTo($_tabpanel);
        
        var _showClass = $.fn.tooltip &&  $.fn.tooltip.Constructor &&  $.fn.tooltip.Constructor.VERSION && $.fn.tooltip.Constructor.VERSION.indexOf('3.')>=0?'active':'show';

        for (var _idx = 0; _idx < _heads.length; _idx++) {
            //$('<div role="tabpanel" class="tab-pane' + (_idx == 0 ? ' ' + _showClass : '') + '" id="' + id + '_' + _idx + '">' + _contents[_idx] + '</div>').appendTo($_content);
            //$('<li role="presentation" class="nav-item' + (_idx == 0 ? ' ' + _showClass : '') + '"><a class="nav-link" href="#' + id + '_' + _idx + '" role="tab" data-toggle="tab" data-bs-toggle="tab">' + _heads[_idx] + '</a></li>').appendTo($_ul);
            if (!_contents[_idx])
                _contents[_idx] = '建構中';
            var $_tab = $('<div role="tabpanel" class="tab-pane" id="' + id + '_' + _idx + '"></div>').appendTo($_content);
            if (_contents[_idx] instanceof jQuery)
                _contents[_idx].appendTo($_tab);
            else
                $_tab.html(_contents[_idx]);
                //$('<div role="tabpanel" class="tab-pane" id="' + id + '_' + _idx + '">' + _contents[_idx] + '</div>').appendTo($_content);

            $('<li role="presentation" class="nav-item"><a class="nav-link" href="#' + id + '_' + _idx + '" role="tab" data-toggle="tab" data-bs-toggle="tab">' + _heads[_idx] + '</a></li>').appendTo($_ul);
        }
        if ($_container) {
            $_tabpanel.appendTo($_container);
            $_tabpanel.find('.nav-item>.nav-link:first').tab("show");
        }
        return $_tabpanel;
    }

    var genBootstrapAccordion = function ($_container, _id, _classes, _heads, _contents) {
        var id = _id || 'accordion_' + helper.misc.geguid();
        var $_accordion = $('<div class="accordion'+(_classes?+' '+_classes:'')+'" id="' + id + '">');
        
        for (var _idx = 0; _idx < _heads.length; _idx++) {
            var $_item = $('<div class="accordion-item">').appendTo($_accordion);
            var _hid = 'h_' + _idx + '_' + id;
            var _cid = 'c_' + _idx + '_' + id;
            $('<div class="accordion-header" id="' + _hid + '"><button class="accordion-button' + (_idx == 0 ? '' :' collapsed')+'" type="button" data-bs-toggle="collapse" data-bs-target="#' + _cid + '" aria-expanded="' + (_idx == 0 ? 'true' : 'false') + '" aria-controls="' + _cid + '">' + _heads[_idx] +'</button></div>').appendTo($_item);
            $('<div id="' + _cid + '" class="accordion-collapse collapse' + (_idx == 0 ? ' show' : '') + '" aria-labelledby="' + _hid + '" data-bs-parent="#' + id + '"><div class="accordion-body">' + _contents[_idx]+'</div></div>').appendTo($_item);
            //$('<div id="content' + _idx + '-' + id + '" class="panel-collapse collapse ' + (_idx == 0 ? 'in show' : '') + '" role="tabpanel" aria-labelledby="content-' + id + '"><div class="panel-body">' + _contents[_idx] + '</div></div>').appendTo($_item);
        }
        if ($_container)
            $_accordion.appendTo($_container);
        return $_accordion;

        //old 20230531
        //var id = _id || 'panel' + helper.misc.geguid();
        //var $_panelGroup = $('<div class="panel-group ' + (_classes ? _classes : '') + '" id="' + id + '" role="tablist" aria-multiselectable="true">');

        //for (var _idx = 0; _idx < _heads.length; _idx++) {
        //    var $_panel = $('<div class="panel panel-default">').appendTo($_panelGroup);
        //    $('<div class="panel-heading" role="tab"><h4 class="panel-title"><a role="button" data-toggle="collapse" data-bs-toggle="collapse" data-parent="#' + id + '" href="#content' + _idx + '-' + id + '" aria-expanded="false" aria-controls="content' + _idx + '-' + id + '">' + _heads[_idx] + '</a></h4></div>').appendTo($_panel);

        //    $('<div id="content' + _idx + '-' + id + '" class="panel-collapse collapse ' + (_idx == 0 ? 'in show' : '') + '" role="tabpanel" aria-labelledby="content-' + id + '"><div class="panel-body">' + _contents[_idx] + '</div></div>').appendTo($_panel);
        //}
        //if ($_container)
        //    $_panelGroup.appendTo($_container);
        //return $_panelGroup;
    }

    var genBootstrapCarousel = function ($_container, _id, _classes, _contents, _contentCaptions) {
        var id = _id || 'carousel' + helper.misc.geguid();
        var $_carousel = $('<div id="' + id + '" class="carousel slide ' + (_classes ? _classes : '') +'" data-ride="carousel" data-bs-ride="carousel">');
        var $_ol = $('<ol class="carousel-indicators">').appendTo($_carousel);

        var $_list = $('<div class="carousel-inner" role="listbox">').appendTo($_carousel);
        $.each(_contents, function (idx, c) {
            $('<li data-target="#' + id + '" data-bs-target="#' + id + '" data-bs-slide-to="' + idx + '" data-slide-to="' + idx + '" class="' + (idx == 0 ? 'active' : '') + '"></li>').appendTo($_ol)
            var $_item = $('<div class="carousel-item item ' + (idx == 0 ? 'active' : '') + '">').appendTo($_list);
            $_item.append(c);
            if (_contentCaptions && _contentCaptions[idx])
                $_item.append('<div class="carousel-caption">' + _contentCaptions[idx] + '</div>');
        });
        $('<a class="carousel-control-prev left carousel-control" data-bs-target="#' + id + '" href="#' + id + '" role="button" data-slide="prev" data-bs-slide="prev"><span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span><span class="sr-only">Previous</span></a>').appendTo($_carousel);
        $('<a class="carousel-control-next right carousel-control" data-bs-target="#' + id + '"href="#' + id + '" role="button" data-slide="next" data-bs-slide="next"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span><span class="sr-only">Next</span></a>').appendTo($_carousel);

        if ($_container)
            $_carousel.appendTo($_container);
        return $_carousel;
    }

    //將debug訊息顯示於視窗(左側)
    var debugLogger = function (msg) {
        var $_log = $('body > .log-container');
        if ($_log.length === 0) {
            $_log = $('<div class="log-container" ><span class="btn btn-default clear-logger">清除</span><span class="btn btn-default close-logger">關</span><div></div>').appendTo('body').css('position', 'fixed').css('z-index', 999999).css('background-color', 'white').css('width', '100px').css('top', 0).css('bottom', 0).css('opacity', 0.85);
            $_log.find('.clear-logger').click(function () {
                $_log.find('>div').empty();
            });
            $_log.find('.close-logger').click(function () {
                if ($(this).css('position') != 'fixed') {
                    $(this).css('position', 'fixed').css('left', 0);
                    $_log.css('left', - $('body').width());
                } else {
                    $(this).css('position', 'static');
                    $_log.css('left', 0);
                }
            });
        }
        $_log.find('> div').html($_log.find('> div').html() + '<br>' + msg);
    }
    var cloneObj = function (obj) {
        return obj == undefined ? obj : JSON.parse(JSON.stringify(obj));
    }

    function DetectIsIE() {
        var ua = window.navigator.userAgent;

        var msie = ua.indexOf('MSIE ');
        if (msie > 0) {
            // 回傳版本 <=10 的版本
            return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
        }

        var trident = ua.indexOf('Trident/');
        if (trident > 0) {
            // 回傳版本 >=11 的版本
            var rv = ua.indexOf('rv:');
            return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
        }

        //var edge = ua.indexOf('Edge/');
        //if (edge > 0) {
        //    // 判斷Edge
        //    return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
        //}

        // other browser
        return false;
    }
      

    var xmlstring2Json = function (xmlstr, options,callback) {
        options = options || {mergeCDATA: false,xmlns: false,attrsAsObject: false,childrenAsArray: false};
        if (!window.xmlToJSON) {
            var jsp = (getScriptPath("gis/helper") || getScriptPath("gis/Main")) + "gis";
            getJavaScripts([getCurrentSiteRootPath()+'other/xmlToJSON.js'], function () {
                callback(xmlToJSON.parseString(xmlstr, options));
            })
        }
        else {
            if (callback)
                callback(xmlToJSON.parseString(xmlstr, options));
            else
                return xmlToJSON.parseString(xmlstr, options);//Main,js會引入
        }
    }

    //arrayFiled:{'field1':'field1.info'}，如颱風預報欄位{ 'PredDatas': 'PredDatas.TyphInfoBase' }
    var setXmlObjTextToValue = function (obj, arrayfileds) {
        if ($.isArray(obj)) {
            $.each(obj, function () {
                setXmlObjTextToValue(this, arrayfileds);
            });
        }
        else {
            for (var key in obj) {
                if ($.isArray(obj[key]))
                    setXmlObjTextToValue(obj[key], arrayfileds);
                else {
                    if (arrayfileds && arrayfileds.hasOwnProperty(key)) {
                        //var vs = eval('obj.' + arrayfileds[key]);////不能直接用eval，如javascript 壓縮(minify)因變數命名改變會有問題 
                        var ps = arrayfileds[key].split('.');
                        var vs = obj;
                        for (var i = 0; i < ps.length; i++) 
                            vs = vs[ps[i]];

                        if (vs) {
                            vs = $.isArray(vs) ? vs : [vs];
                            setXmlObjTextToValue(vs);
                        }
                        obj[key] = vs;
                    }
                    else
                        obj[key] = obj[key]._text;
                }
            }
        }
        return obj;
    }

    var getData = function (url, callback, option, usecache) {
        if (!usecache) {
            var _ajaxoptions = $.extend({
                url: url,
                type: "GET",
            }, option);

            $.ajax(_ajaxoptions)
                .done(function (dat, status) {
                    callback(dat);
                }).fail(function (dat, status) {
                    console.log('error:' + dat.responseText);
                });
        } else {
            var key = url + (option ? JSON.stringify(option) : '');
            window.currentCacheDatas = window.currentCacheDatas || {};
            if (!window.currentCacheDatas[key])
                window.currentCacheDatas[key] = { data: undefined };
            if (window.currentCacheDatas[key].data)
                callback(window.currentCacheDatas[key].data);
            else {
                if (!window.currentCacheDatas[key].waits) {
                    window.currentCacheDatas[key].waits = [];
                    window.currentCacheDatas[key].waits.push(callback);
                    getData(url, function (d) { //呼叫非cache
                        window.currentCacheDatas[key].data = d;
                        for (var i = 0; i < window.currentCacheDatas[key].waits.length; i++) {
                            if (window.currentCacheDatas[key].waits[i])
                                window.currentCacheDatas[key].waits[i](d);
                        }
                        delete window.currentCacheDatas[key].waits;
                    }, option);
                }
                else
                    window.currentCacheDatas[key].waits.push(callback);
            }
        }
    };

    var cloneobj = function (obj) {

        return obj == undefined? obj: JSON.parse(JSON.stringify(obj));
    }
    var getValueByPath = function (obj, filepath, pathsplite) {

        try {
            if (!obj)
                return undefined;
            if (pathsplite == undefined)
                pathsplite = '.';
            var ps = filepath.split(pathsplite);
            var v = obj;
            for (var i = 0; i < ps.length; i++)
                v = v[ps[i]];
            return v;
        } catch (e) {
            console.log('getValueByPath Error:'+filepath+'>>'+ JSON.stringify(obj));
        }
    }

    var browerSupportInputRange = function () {
        var input = document.createElement('input');
        input.setAttribute('type', 'range');
        
        return (input.type === "range");
    }
    var browerSupportInputDate = function () {
        var input = document.createElement('input');
        input.setAttribute('type', 'date');

        var notADateValue = 'not-a-date';
        input.setAttribute('value', notADateValue);

        return (input.value !== notADateValue);
    }

    window.helper = window.helper || {};
    window.helper.loaded = true;
    //other
    window.helper.misc = window.helper.misc || {};
    window.helper.misc.html2image = html2image;
    window.helper.misc.tableToExcel = CreateExcelSheet;
    window.helper.misc.loadWorkbook = loadWorkbook;
    window.helper.misc.geguid = geguid;
    window.helper.misc.getJavaScripts = getJavaScripts;
    window.helper.misc.openNewWindowByPost = OpenNewWindowByPost;
    window.helper.misc.localCache = $.localCache;
    window.helper.misc.showBusyIndicator = function (jqobj, options) {
        if (!jqobj) jqobj = 'body'; jqobj = typeof (jqobj) === "string" ? $(jqobj) : jqobj; jqobj.show_busyIndicator(options);
    };
    window.helper.misc.hideBusyIndicator = function (jqobj, enforceclose) {
        if (!jqobj) jqobj = 'body';
        jqobj = typeof (jqobj) === "string" ? $(jqobj) : jqobj; jqobj.hide_busyIndicator(enforceclose);
    };
    
    window.helper.misc.getRequestParas = getRequestParas;
    window.helper.misc.getScriptPath = getScriptPath;
    window.helper.misc.getAbsoluteUrl = getAbsoluteUrl;
    window.helper.misc.getCurrentSiteRootPath = getCurrentSiteRootPath;
    window.helper.misc.getMobileOperatingSystem = getMobileOperatingSystem;
    window.helper.misc.MobileOperatingSystem = { iOS: 'iOS', Android: 'Android', unknown: 'unknown' };
    window.helper.misc.debugLogger = debugLogger;
    window.helper.misc.cloneObj = cloneObj;
    window.helper.misc.getValueByPath = getValueByPath;
    window.helper.misc.detect = { isIE: DetectIsIE() };
    window.helper.misc.getDaysInMonth = getDaysInMonth;
    window.helper.misc.domResize = function (jqobj, callback) { jqobj.listenResize(callback); };

    
    //bootstrap
    window.helper.bootstrap = window.helper.bootstrap || {};
    window.helper.bootstrap.getversion = getbootstrapversion;
    window.helper.bootstrap.genBootstrapTabpanel = genBootstrapTabpanel;
    window.helper.bootstrap.genBootstrapAccordion = genBootstrapAccordion;
    window.helper.bootstrap.genBootstrapCarousel = genBootstrapCarousel;

    //format
    window.helper.format = window.helper.format || {};
    window.helper.format.formatNumber = formatNumber;
    window.helper.format.paddingLeft = padding_left;
    window.helper.format.paddingRight = padding_right;
    window.helper.format.JsonDateStr2Datetime = JsonDateStr2Datetime;
    window.helper.format.xmlToJson = window.helper.format.xmlToJson || {};
    window.helper.format.xmlToJson.parseString = xmlstring2Json;
    window.helper.format.xmlToJson.setXmlObjTextToValue = setXmlObjTextToValue;
    //jspanel
    window.helper.jspanel = window.helper.jspanel || {};
    window.helper.jspanel.jspConfirmYesNo = jspConfirmYesNo;
    window.helper.jspanel.jspAlertMsg = jspAlertMsg;
    window.helper.jspanel.jspConfirm = jspConfirm;

    //panel
    window.helper.panel = window.helper.panel || {};
    window.helper.panel.toggleRightLeftPanels = $.toggleRightLeftPanel;
    window.helper.panel.toggleDownUpPanel = $.toggleDownUpPanel;
    window.helper.panel.toggleSliderPanel = $.toggleSliderPanel;
    //rtree
    window.helper.tree = window.helper.tree || {};
    window.helper.tree.rTree = rTree;
    window.helper.tree.event = { selectedLeafChange: "r-leaf-selected", selectedBranchChange: "r-branch-selected", selectedNoteChange: "r-note-selected" };
    window.helper.tree.selectMode = { single: 1, multiple: 2 };
    //gis
    window.helper.gis = window.helper.gis || {};
    window.helper.gis.TWD97ToWGS84 = $.TWD97ToWGS84;
    window.helper.gis.WGS84ToTWD97 = $.WGS84ToTWD97;
    window.helper.gis.polygonArea = polygonArea;
    window.helper.gis.pointInPolygon = pointInPolygon;
    window.helper.gis.pointInPolygonGeometry = pointInPolygonGeometry;
    window.helper.gis.pointDistance = pointDistance;

    window.helper.browser = window.helper.browser || {};
    window.helper.browser.support = window.helper.browser.support || {};
    window.helper.browser.support.localStorage = $.isSupportLocalStorage;
    window.helper.browser.support.inputRange = browerSupportInputRange;
    window.helper.browser.support.inputDate = browerSupportInputDate;

    window.helper.data = window.helper.data || {}
    window.helper.data.get = getData;
    return window.helper;
})(this, this.document);
//})(jQuery, window);

//vs2019的intellisense對javascript 特權方法(function(){})()無作用
helper.misc = helper.misc || {}; //為了使vs2019 intellisense對misc有作用QQ
helper.misc.showBusyIndicator = helper.misc.showBusyIndicator;
helper.misc.hideBusyIndicator = helper.misc.hideBusyIndicator;
helper.bootstrap = helper.bootstrap || {};
helper.format = helper.format || {};
helper.format.JsonDateStr2Datetime = helper.format.JsonDateStr2Datetime;
helper.format.formatNumber = helper.format.formatNumber;
helper.jspanel = helper.jspanel || {};
helper.panel = helper.panel || {};
helper.tree = helper.tree || {};
helper.gis = helper.gis || {};
helper.data = helper.data || {};
helper.data.get = helper.data.get || {};
window.dou = window.dou || {};
dou.helper = helper;