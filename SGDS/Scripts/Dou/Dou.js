var transactionDouClientDataToServer = function (row, url, callback) {
    //row["my"] = { FKEY: row.FKey, FString: "sdsd", FDT: row.FDatetime1};
    //將時間一律改UTC標準時間yyyy-MM-ddTHH:mm:ss.000Z(直接呼叫toJSON即可)
    var tjsondt = function (r) {
        if (Array.isArray(r)) {
            $.each(r, function (_i, _v) {
                if (!_v)
                    return false;
                tjsondt(this);
            });
        }
        else {
            for (var f in r) {    //json Date(/Date(1525730400000)/) 在serevr(可能無法DeSerialize)端會是null
                if (Array.isArray(r[f])) {
                    $.each(r[f], function (_i, _v) {
                        if (!_v)
                            return false;
                        tjsondt(this);
                    });
                }
                else if (r[f] &&  typeof r[f] == "object") {
                    tjsondt(r[f]);
                }
                else {
                    if (r[f] && (r[f] + "").indexOf('/Date(') >= 0)
                        r[f] = JsonDateStr2Datetime(r[f]).toJSON();//.DateFormat("yyyy/MM/dd HH:mm:ss.S");
                    else if (r[f] && Object.prototype.toString.call(r[f]) === '[object Date]' && !isNaN(r[f]))
                        r[f] = r[f].toJSON();
                }
            }
        }
    }
    tjsondt(row);
    var $_temp = this.rootParentContainer ? $(this.rootParentContainer) : $("body");
    if (helper && $_temp.length > 0)
        $_temp.show_busyIndicator({ timeout: 5000 });
    $.ajax({
        url: url,
        datatype: "json",
        type: "POST",
        data: { "objs": $.isArray(row) ? row : [row] }
    }).done(function (result, textStatus, jqXHR) {
        if (helper && $_temp.length > 0)
            $_temp.hide_busyIndicator();
        if (!result.Success && result.RedirectUrl) { //已timeout或後端重啟...等session中斷
            alert(result.Desc);
            location.href = result.RedirectUrl;
            return;
        }

        callback(result);
    })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert(jqXHR);
            if (helper && $_temp.length > 0)
                $_temp.hide_busyIndicator();
            callback({ Success: false, Desc: jqXHR });
        });
};
(function ($) {
    'use strict';
    $.editformWindowStyle = {
        modal: "modal",
        bottom: "bottom",
        right: "right",
        showEditformOnly: "showEditformOnly",
        detail: "detail",
    };
    $.douDatatype = {
        "default": "default",
        "number": "number",
        "datetime": "datetime",
        "date": "date",
        "boolean": "boolean",
        "select": "select",
        "textlist": "textlist",
        "textarea": "textarea",
        "email": "email",
        "password": "password",
        "image": "image"
    };
    $.douButtonsDefault = $.extend({ //可直接覆寫，但要放在load Dou.js前，jquery後
        add: 'btn-success glyphicon glyphicon-plus',
        update: 'btn-default btn-sm  glyphicon glyphicon-pencil',
        delete: 'btn-default btn-sm  glyphicon glyphicon-trash',
        deleteall: 'btn-danger glyphicon glyphicon-remove',
        view: 'btn-default btn-sm  glyphicon glyphicon-eye-open',
        query: 'btn-secondary',
        remove: 'glyphicon glyphicon-remove',
        error_message: 'glyphicon glyphicon-exclamation-sign'
    }, $.douButtonsDefault || {});
    $.edittableoptions = {
        rootParentContainer: "body",
        title: "",
        fields: [],//如要colspan、rowspan, this.settings.fields=[[....],[...]] >>2層
        _dataFields: [], //有定義對應資料欄位，fields如是一維array _dataFields =fields, 如fields是多層表頭轉單一array(僅資料欄位定義)
        search: true,
        cardView: false,
        toolbar: undefined,
        toolbarAlign: 'left',
        ctrlFieldAlign: 'right',
        editCtrlButtonValign: 'bottom',//top, bottom
        height: undefined,
        addable: true,
        editable: true,
        editable: true,
        useMutiDelete: false,
        useMutiSelect: false,
        buttonClasses: {}, //douButtonsDefault，或直接override $.douButtonsDefault所有值
        editformMaxheight: undefined,
        editformLabelWidth: 12,//1~12
        editformLayoutUrl: undefined,/*edit layout template*/
        editformSize: { width: "auto", height: "auto", minWidth: 450, minHeight: 360 }, //height:fixed至中最大 >>modal用
        editformWindowClasses: undefined, /*modal-sm、modal-lg、modal-xl>> modal用*/
        editformWindowStyle: $.editformWindowStyle.modal,
        datas: [],
        addToListTop:false,
        singleDataEdit: false,
        singleDataEditCompletedReturnUrl: undefined,
        beforeCreateTable: function (setting, callback) {callback() },
        beforeCreateEditDataForm: undefined, //function (row, callback) {todo something....; callback();}
        afterCreateEditDataForm: undefined,//function($_container,row)
        afterEditDataConfirm: undefined,//function編輯完資料，送到Server前
        afterEditDataCancel: undefined,//function取消編輯資料(master-detail，如detail已異動後端資料，master做ui或資料處裡)
        addServerData: function (row, callback) { callback({ Success: true, data: row, Desc: '新增成功' }); },
        deleteServerData: function (row, callback) { callback({ Success: true, data: row, Desc: '刪除成功' }); },
        updateServerData: function (row, callback) { callback({ Success: true, data: row, Desc: '更新成功' }); },
        afterAddServerData: function (row, callback) { callback(); },//更新後端資料後，更新前端UI前
        afterUpdateServerData: function (row, callback) { callback(); },//更新後端資料後，更新前端UI前
        queryFilter: function (params, callback) { callback(); },
        appendCustomToolbars: [],//[{item, event, callback}] //Toolbars
        appendCustomFuncs: [],//[{item, event, callback}] //List Row ,ex:[{item:'<span class="btn btn-default btn-sm  glyphicon glyphicon-star" title="other"></span>',event:'click .glyphicon-star',callback:function(e, value, row, index){} }]
        tableOptions: {//額外提供bootstraptable options
            striped: true,
            mobileResponsive: true,
            //contentType: 'application/x-www-form-urlencoded', //Dou .net code版會給此值，  .net core要用'application/x-www-form-urlencoded'(bootstraptable預設)
            detailFormatter: function detailFormatter(index, row) {
                //this.settings>>來至btn-view-data-manager
                //this.DouEditableTable.settings>>來至bootstraptable.detail
                var fs = (this.settings || this.DouEditableTable.settings)._dataFields;

                var html = [];
                $.each(fs, function () {
                    if (this.field.endsWith("-Start-Between_") || this.field.endsWith("-End-Between_") || this.field == "ctrl" || !this.visibleView)
                        return;
                    var v = row[this.field];
                    html.push('<tr><td class="detail-view-field"><b>' + this.title + '</b> </td><td>' + (this.formatter ? this.formatter(v) : v) + '</td></tr>')
                });
                return '<table class="table-borderless table-striped table-sm"><tbody>' + html.join('') + '</tbody></tbody>';
            },
            //search:true,
            formatSearch: function () {
                return '搜尋';
            }, formatNoMatches: function () {
                return '無符合資料';
            },
            formatLoadingMessage: function () {
                return '載入資料中，請稍候';
            },
            formatRecordsPerPage: function (pageNumber) {
                return '每頁顯示 ' + pageNumber + ' 項記錄';
            },
            formatShowingRows: function (pageFrom, pageTo, totalRows) {
                return '顯示第 ' + pageFrom + ' 到第 ' + pageTo + ' 筆資料，總共 ' + totalRows + ' 筆資料';
            },
            formatPaginationSwitch: function () {
                return '隱藏/顯示分頁';
            },
            formatRefresh: function () {
                return '刷新';
            },
            formatToggle: function () {
                return '切換';
            },
            formatColumns: function () {
                return '列';
            },
            onClickRow: function (item, $element) {
                return false;
            },
            formatAllRows: function formatAllRows() {
                return '*';
            },
            onLoadSuccess: function (datas) {
                return false;
            },
            onLoadError: function (status, dat) {
                return false;
                //改於 init實作 20230116
                //console.log("load-error:" + status + "  " + dat.responseText);
                //if (dat && (dat.responseText && dat.responseText.indexOf('dou-login-container') >= 0 || dat.RedirectUrl))
                //    location.reload();//觸發導向login
                //else
                //    alert('資料讀取發生問題，請重新執行或洽管理員');
            }
        }
    }

    //for douDatatype=select
    //sitems:{k1:v1,...} or {k1:{v:v1,s:s1,data1:other1,data2:other2...}} //k:真正值, v:畫面呈現, s:排序， data1、data2會作為option的data-data1、data-dat2
    var sortSelectItems = function (sitems) {
        var ritems = [];
        $.each(sitems, function (k, v) {//v如包含 @@，前是v，後是順序
            //var o = { k: k };
            //if (typeof v === "object") {
            //    o = $.extend(o, v);
            //    //o.s == o.s == undefined ? 99 : o.s;
            //}
            //else
            //    o.v = v;
            ////if (typeof v === "string") {
            //var vs = (o.v + "").split(/@@/g);
            //o.v = vs[0].trim();
            //o.s = vs[1] || 99;
            //if (o.v.startsWith('{') && o.v.endsWith('}')) //ex:vs0={"v":"Dispaly","dcode":"15"}
            //    $.extend(o, JSON.parse(o.v)); //o變成 { k: k, v: vs0, s: 99,,dcode:"15" };
            ////}
            ritems.push(v);
        });
        ritems.sort(function (a, b) { return a.s - b.s; });
        return ritems;
    }
    //for douDatatype=select
    var getSelectItemDisplay = function (v, r, sitems) {
        try {
           return v === undefined || v === '' ? v : (sitems[v].v === undefined ? v : sitems[v].v);
        } catch(e) {
            return v;
        }
        var _result = v;
        if (v != undefined) {
            _result = sitems[v] || v;
            if (typeof _result === "object") {
                _result = _result.v;
            }
            //else if (typeof v === "string") {
                _result = (_result + "").split(/@@/g)[0];
                if (_result.startsWith('{') && _result.endsWith('}'))
                    _result = JSON.parse(_result).v;
            //}
        
        }
        _result = _result || v;
        return _result;
    }

    //字串轉function
    var stringEval2Function = function (s) {
        if (s && typeof s === 'string' && s.trim().startsWith('(function'))
            return eval(s);
        else
            return s;
    }

    var isInputSupportDate = function (f) {
        var f = f || 'date';
        var input = document.createElement('input');
        input.setAttribute('type', f);
        //input.setAttribute('data-date-format', 'YYYY/MM/DD');

        var notADateValue = 'not-a-date';
        input.setAttribute('value', notADateValue);

        return (input.value !== notADateValue);
    }

    var gearingSelectDom = function ($_list, fopts) {
        if (fopts.selectGearingWith) { //與其他select連動
            var _gearingFiledName = fopts.selectGearingWith.split(',')[0];
            var _gearingFiledSelectItemData = fopts.selectGearingWith.split(',')[1];
            var _inseparable = false;
            if (fopts.selectGearingWith.split(',').length==3)
                _inseparable = fopts.selectGearingWith.split(',')[2].toUpperCase() == 'TRUE';
            var $_allgfoptions = undefined; //欲連動原所有option
            $_list.addClass('field-gearing').on('change', function (e, args) { //連動
                //欲連動可能select、input+datalist
                var $_gf = $_list.closest('.filter-toolbar-plus,.data-edit-form-group').find('select[data-fn="' + _gearingFiledName + '"]');//預連動select
                if ($_gf.length == 0) {
                    $_gf = $_list.closest('.filter-toolbar-plus,.data-edit-form-group').find('input[data-fn="' + _gearingFiledName + '"] + datalist');//預連動select
                    if (!args || !args.fromSetValue)
                        $_list.closest('.filter-toolbar-plus,.data-edit-form-group').find('input[data-fn="' + _gearingFiledName + '"]').val(''); //清空資料
                }

                if (!$_allgfoptions)
                    $_allgfoptions = $_gf.find('option');

                var v = $_list.val();
                $_gf.empty();

                if (v == '') {
                    if (!_inseparable) //_inseparable=false,parent null>>details show all
                        $_allgfoptions.appendTo($_gf);
                    else {
                        if ($_allgfoptions.first().val() == '')
                            $_allgfoptions.first().appendTo($_gf);
                    }
                }
                else {
                    if ($_allgfoptions.first().val() == '')
                        $_allgfoptions.first().appendTo($_gf);
                    $.each($_allgfoptions, function () {
                        var $_this = $(this);
                        if ($_this.attr("data-" + _gearingFiledSelectItemData) == v)
                            $_this.appendTo($_gf);
                    });
                    //$_fnoptions.find('[data-dcode="' + dv + '"]').appendTo($_fnoselect);//.removeClass('d-none');
                }
                if ($_gf.hasClass('field-gearing'))
                    $_gf.trigger('change');
            });//.trigger('change');
            if (_inseparable)
                setTimeout(function () {
                    $_list.trigger('change');
                });
        }
    }

    $.edittable_defaultEdit = {
        "default": {
            editContent: function ($_fieldContainer) {
                var $editEle = $('<input type="text"  class="form-control" data-fn="' + this.field + '" ' +
                    (this.placeholder ? 'placeholder="' + this.placeholder + '"' : (this.key || this.allowNull === false ? 'placeholder="不能空值"' : '')) +
                    (this.maxlength ? ' maxlength="' + this.maxlength + '"' : ' ') + ' ></input>').appendTo($_fieldContainer);

                if (this.defaultvalue)
                    $editEle.val(this.defaultvalue);
            },
            getValue: function ($editEle) {
                return $editEle.val();// .data("fn");
            },
            setValue: function ($editEle, v) {
                if ((this.key || this.editable === false) && v != undefined )
                    $editEle.prop('disabled', true);
                $editEle.val(v);
            }
        },
        "number": {
            editContent: function ($_fieldContainer) {
                var $editEle = $('<input type="number"  class=" form-control" data-fn="' + this.field + '" ' +
                    (this.placeholder ? 'placeholder="' + this.placeholder + '"' : (this.key || this.allowNull === false ? 'placeholder="不能空值"' : '')) +
                    (this.maxlength ? ' maxlength="' + this.maxlength + '"' : ' ') + ' ></input>').appendTo($_fieldContainer);
                if (this.step)
                    $editEle.attr("step", this.step);
                if (this.defaultvalue)
                    $editEle.val(this.defaultvalue);

                $editEle.keydown(function (e) {
                    //console.log(e.keyCode);
                    // Allow: backspace, delete, tab, escape and enter
                    if ($.inArray(e.keyCode, [46, 8, 9, 27, 13]) !== -1 ||
                        // Allow: Ctrl+A, Command+A
                        (e.keyCode == 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                        // Allow: home, end, left, right, down, up
                        (e.keyCode >= 35 && e.keyCode <= 40)) {
                        // let it happen, don't do anything
                        return;
                    }
                    // Ensure that it is a number and stop the keypress
                    if ((e.shiftKey || (e.keyCode < 48 || (e.keyCode > 57 && e.keyCode != 189 && e.keyCode != 190 && e.keyCode != 109 && e.keyCode != 110)))
                        && (e.keyCode < 96 || e.keyCode > 105)) {
                        e.preventDefault();
                    }
                    // 如果使用者輸入-，先判斷現在的值有沒有-，如果有，就不允許輸入
                    if ((e.keyCode == 109 || e.keyCode == 189) && /-/g.test(this.value)) {
                        e.preventDefault();
                    }
                    // 如果使用者輸入.，先判斷現在的值有沒有.，如果有，就不允許輸入
                    if ((e.keyCode == 110 || e.keyCode == 190) && /\./g.test(this.value)) {
                        e.preventDefault();
                    }
                });
                $editEle.keyup(function () {
                    if (/[^0-9\.-]/g.test(this.value)) {
                        this.value = this.value.replace(/[^0-9\.-]/g, '');
                    }

                    if (/-/g.test(this.value) && !/^-/g.test(this.value)) {
                        this.value = this.value.replace(/-/g, '');
                    }
                });
            },
            getValue: function ($editEle) {
                return $editEle.val();// .data("fn");
            },
            setValue: function ($editEle, v) {
                if (this.key || this.editable === false)
                    $editEle.prop('disabled', true);
                $editEle.val(v);
            }
        },
        "datetime": {
            editContent: function ($_fieldContainer) {

                var _id = 'id' + geguid();
                var $_dtp = $("<div id='" + _id + "' class='input-group date datetimeul datepick' data-fn='" + this.field + "'  data-target-input='nearest'>").appendTo($_fieldContainer);
                if (this.useInputType && isInputSupportDate()) {
                    $('<input type="datetime-local" title="' + this.title + '" required class="form-control not-datetimepicker-input" data-target="#' + _id + '" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"/><span class="validity input-group-text-no"></span>').appendTo($_dtp);
                        //.attr('data-placeholder', this.title);//required >>為了filter before show data-placeholder
                }
                else {
                    $('<input type="text" class="form-control datetimepicker-input" data-target="#' + _id + '"/>').appendTo($_dtp);
                    $('<div class="input-group-addon input-group-append" data-target="#' + _id + '" data-toggle="datetimepicker"><span class="input-group-text"><i class="glyphicon glyphicon-calendar"></i></span></div>').appendTo($_dtp);
                    var _format = 'YYYY/MM/DD HH:mm:ss';
                    var _options = { locale: 'zh-tw', format: _format };
                    if (this.editParameter) {
                        if (typeof (this.editParameter) === "string") {
                            this.editParameter = JSON.parse(this.editParameter);
                        }
                        _options = $.extend(_options, this.editParameter)
                    }

                    $_dtp.datetimepicker(_options);

                }

                if (this.defaultvalue) {
                    var _ddt = this.defaultvalue;
                    if (typeof this.defaultvalue === 'string' && this.defaultvalue.indexOf("new") >= 0)
                        _ddt= eval(this.defaultvalue);
                    _ddt= helper.format.JsonDateStr2Datetime(_ddt);
                    if (this.useInputType && isInputSupportDate())
                        $_dtp.find('input').attr('value', _ddt.DateFormat("yyyy-MM-ddTHH:mm:ss"));
                    else
                        $_dtp.datetimepicker("date", _ddt);
                }
            },
            getValue: function ($editEle) {
                var _dt;
                if (this.useInputType && isInputSupportDate())
                    _dt = helper.format.JsonDateStr2Datetime($editEle.find('input').val());
                else 
                    _dt = $editEle.datetimepicker("date") ? $editEle.datetimepicker("date")._d:'';//.date();
                
                if (_dt)
                    return _dt.DateFormat("yyyy/MM/dd HH:mm:ss");
                else return '';
                //var _dtobjs = $editEle.datetimepicker("date");//.date();

                //if (_dtobjs) {
                //    return _dtobjs._d.DateFormat("yyyy/MM/dd HH:mm:ss");//避免JSON.stringify會變成TUC時間
                //}
                //else
                //    return "";
            },
            setValue: function ($editEle, v) {
                if ((this.key || this.editable === false) && v != this.defaultvalue) //20210615 v == this.defaultvalue新增時
                    $editEle.find('> input').prop('disabled', true);
                var d = helper.format.JsonDateStr2Datetime(v);
                if (d) {
                    if (this.useInputType && isInputSupportDate())
                        $editEle.find('input').attr('value',d.DateFormat("yyyy-MM-ddTHH:mm:ss"));
                    else
                        $editEle.datetimepicker("date", d);//$editEle.data("DateTimePicker").date(d);
                }
            }
        },
        "date": {
            editContent: function ($_fieldContainer) {
                var _id = 'id' + geguid();
                var $_dtp = $("<div id='" + _id + "' class='input-group date datetimeul datepick' data-fn='" + this.field + "'  data-target-input='nearest'>").appendTo($_fieldContainer);
                if (this.useInputType && isInputSupportDate()) {
                    //$('<input type="text"  onmouseenter="(this.type=\'date\')" onmouseout="(this.type=\'text\')" title="' + this.title + '" class="form-control not-datetimepicker-input" data-target="#' + _id + '" pattern="\d{4}-\d{2}-\d{2}"/><span class="validity input-group-text-no"></span>').appendTo($_dtp)
                    $('<input type="date" title="' + this.title + '" required class="form-control not-datetimepicker-input" data-target="#' + _id + '" pattern="\d{4}-\d{2}-\d{2}"/><span class="validity input-group-text-no"></span>').appendTo($_dtp);
                        //.attr('data-placeholder', this.title);//required >>為了filter before show data-placeholder
                }
                else {
                    $('<input type="text" class="form-control datetimepicker-input" data-target="#' + _id + '"/>').appendTo($_dtp);
                    $('<div class="input-group-addon input-group-append" data-target="#' + _id + '" data-toggle="datetimepicker"><span class="input-group-text"><i class="glyphicon glyphicon-calendar"></i></span></div>').appendTo($_dtp);
                    var _format = 'YYYY/MM/DD';
                    var _options = { locale: 'zh-tw', format: _format };
                    if (this.editParameter) {
                        if (typeof (this.editParameter) === "string") {
                            this.editParameter = JSON.parse(this.editParameter);
                        }
                        _options = $.extend(_options, this.editParameter)
                    }

                    $_dtp.datetimepicker(_options);
                }

                if (this.defaultvalue) {
                    var _ddt = this.defaultvalue;
                    if (typeof this.defaultvalue === 'string' && this.defaultvalue.indexOf("new") >= 0)
                        _ddt = eval(this.defaultvalue);
                    _ddt = helper.format.JsonDateStr2Datetime(_ddt);
                    if (this.useInputType && isInputSupportDate())
                        $_dtp.find('input').attr('value', _ddt.DateFormat("yyyy-MM-dd"));
                    else
                        $_dtp.datetimepicker("date", _ddt);
                }
            },
            getValue: function ($editEle) {
                var _dt = $editEle.find('input').val();
                if (this.useInputType && isInputSupportDate())
                    _dt = helper.format.JsonDateStr2Datetime($editEle.find('input').val());
                else
                    _dt = $editEle.datetimepicker("date") ? $editEle.datetimepicker("date")._d : '';//.date();

                if (_dt)
                    return _dt.DateFormat("yyyy/MM/dd");
                else return '';
            },
            setValue: function ($editEle, v) {
                if ((this.key || this.editable === false) && v != this.defaultvalue) //20210615 v == this.defaultvalue新增時
                    $editEle.find('> input').prop('disabled', true);
                var d = helper.format.JsonDateStr2Datetime(v);
                if (d) {
                    if (this.useInputType && isInputSupportDate())
                        $editEle.find('input').attr('value', d.DateFormat("yyyy-MM-dd"));
                    else
                        $editEle.datetimepicker("date", d);//$editEle.data("DateTimePicker").date(d);
                }
            }
        },
        "datetimeb3": {
            editContent: function ($_fieldContainer) {
                var $_dtp = $("<div class='input-group date datetimeul datepick' data-fn='" + this.field + "' >").appendTo($_fieldContainer);
                $('<input type="text" class="form-control" />').appendTo($_dtp);
                $('<span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>').appendTo($_dtp);
                //$_dtp = $_dtp.find('input');
                var _format = 'YYYY/MM/DD HH:mm:ss';
                var _options = { locale: 'zh-tw', format: _format };
                if (this.editParameter) {
                    if (typeof (this.editParameter) === "string") {
                        this.editParameter = JSON.parse(this.editParameter);
                        //_format = this.editParameter.format;
                    }
                    //else
                    //    _format = this.editParameter.format
                    _options = $.extend(_options, this.editParameter)
                }

                $_dtp.datetimepicker(_options);

                if (this.defaultvalue) {
                    if (typeof this.defaultvalue === 'string' && this.defaultvalue.indexOf("new") >= 0)
                        $_dtp.datetimepicker("date", eval(this.defaultvalue));
                    else
                        $_dtp.datetimepicker("date", helper.format.JsonDateStr2Datetime(this.defaultvalue));
                }
            },
            getValue: function ($editEle) {
                var _dtobjs = $editEle.data("DateTimePicker").date();
                if (_dtobjs)
                    return _dtobjs._d.DateFormat("yyyy/MM/dd HH:mm:ss");//避免JSON.stringify會變成TUC時間
                else
                    return "";
            },
            setValue: function ($editEle, v) {
                if ((this.key || this.editable === false) && v != this.defaultvalue) //20210615 v == this.defaultvalue新增時
                    $editEle.find('> input').prop('disabled', true);
                var d = helper.format.JsonDateStr2Datetime(v);
                if (d)
                    $editEle.data("DateTimePicker").date(d);
            }
        },
        "dateb3": {
            editContent: function ($_fieldContainer) {
                var $_dtp = $("<div class='input-group date datetimeul' data-fn='" + this.field + "' >").appendTo($_fieldContainer);
                $('<input type="text" class="form-control" />').appendTo($_dtp);
                $('<span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>').appendTo($_dtp);
                var _format = 'YYYY/MM/DD';
                var _options = { locale: 'zh-tw', format: _format };
                if (this.editParameter) {
                    if (typeof (this.editParameter) === "string") {
                        this.editParameter = JSON.parse(this.editParameter);
                    }
                    _options = $.extend(_options, this.editParameter)
                }

                $_dtp.datetimepicker(_options);
                if (this.defaultvalue) {
                    if (typeof this.defaultvalue === 'string' && this.defaultvalue.indexOf("new") >= 0)
                        $_dtp.datetimepicker("date", eval(this.defaultvalue));
                    else
                        $_dtp.datetimepicker("date", helper.format.JsonDateStr2Datetime(this.defaultvalue));
                }
            },
            getValue: function ($editEle) {
                var _dtobjs = $editEle.data("DateTimePicker").date();
                if (_dtobjs)
                    return _dtobjs._d.DateFormat("yyyy/MM/dd");//避免JSON.stringify會變成TUC時間
                else
                    return "";
            },
            setValue: function ($editEle, v) {
                if ((this.key || this.editable === false) && v != this.defaultvalue) //20210615 v == this.defaultvalue新增時
                    $editEle.find('> input').prop('disabled', true);
                var d = helper.format.JsonDateStr2Datetime(v);
                if (d)
                    $editEle.data("DateTimePicker").date(d);
            }
        },
        "boolean": {
            editContent: function ($_fieldContainer) {
                var $editEle = $('<input type="checkbox"  data-fn="' + this.field + '"></input>').appendTo($_fieldContainer);
                if (this.defaultvalue)
                    $editEle.val(this.defaultvalue);
            },
            getValue: function ($editEle) {
                return $editEle.is(":checked");// .data("fn");
            },
            setValue: function ($editEle, v) {
                if (this.key || this.editable === false)
                    $editEle.prop('disabled', true);
                if (v) $editEle.prop("checked", true);
            }
        },
        "textarea": {
            editContent: function ($_fieldContainer, v, flag) {
                var $editEle = undefined;
                if (flag) //filter
                    $editEle = $('<input class=" form-control"  data-fn="' + this.field + '" ></textarea>').appendTo($_fieldContainer);
                else
                    $editEle = $('<textarea rows="' + this.textareaheight +'" class=" form-control"  data-fn="' + this.field + '" ' + (this.key || this.allowNull === false ? 'placeholder="不能空值"' : '') +
                        (this.maxlength ? ' maxlength="' + this.maxlength + '"' : ' ') + '></textarea>').appendTo($_fieldContainer);
                if (this.defaultvalue)
                    $editEle.val(this.defaultvalue);
            },
            getValue: function ($editEle) {
                return $editEle.val();
            },
            setValue: function ($editEle, v) {
                if (this.key || this.editable === false)
                    $editEle.prop('disabled', true);
                $editEle.val(v);
            }
        },
        "textlist": {
            editContent: function ($_fieldContainer, _row, _appendEmpty) {
                if (this.selectitems === undefined)
                    alert(this.field +" selectitems 資料有問題");
                var listid = 'id_' + helper.misc.geguid();
                var $editEle = $('<input type="text" autocomplete="off" class="form-control" data-fn="' + this.field + '" list="' + listid + '" ' +
                    (this.placeholder ? 'placeholder="' + this.placeholder + '"' : (this.key || this.allowNull === false ? 'placeholder="不能空值"' : '')) +
                    (this.maxlength ? ' maxlength="' + this.maxlength + '"' : ' ') + ' ></input>').appendTo($_fieldContainer);
                var $_datalist = $('<datalist id="' + listid + '">').appendTo($_fieldContainer);

                var sitems = sortSelectItems(this.selectitems);//原資料v如包含@@，前是v，後是順序
                $.each(sitems, function () {
                    var datahtml = [];
                    for (var p in this) {
                        datahtml.push("data-" + p + "='" + this[p] + "'");
                    }
                    //datalist value&display都是display值，非object的值，僅為了UI呈現(datalist value!=text會2者都顯示)
                    $("<option value='" + this.v + "' " + datahtml.join(" ") + ">" + this.v + "</option>").appendTo($_datalist);
                });

                if (this.defaultvalue)
                    $editEle.val(this.defaultvalue);

                //驗證input值是否為datalist資料
                if (this.textListMatchValue) {
                    $editEle.on('change', function () {
                        if (this.value == '') {
                            this.setCustomValidity('');
                            return;
                        }
                        var optionFound = false,
                            datalist = this.list;
                        // Determine whether an option exists with the current value of the input.
                        for (var j = 0; j < datalist.options.length; j++) {
                            if (this.value == datalist.options[j].value) {
                                optionFound = true;
                                break;
                            }
                        }
                        // use the setCustomValidity function of the Validation API
                        // to provide an user feedback if the value does not exist in the datalist
                        if (optionFound) {
                            this.setCustomValidity('');
                        } else {
                            this.setCustomValidity('非有效值');
                        }
                    });
                }

                gearingSelectDom($editEle, this);////_appendEmpty來至filter
            },
            getValue: function ($editEle) {
                var tv = $editEle.val();// .data("fn");
                var v = tv;
                for (var k in this.selectitems) {
                    if (this.selectitems[k].v == tv) {
                        v = k;
                        break;
                    }
                }
                return v;
            },
            setValue: function ($editEle, v) {
                if (this.key || this.editable === false)
                    $editEle.prop('disabled', true);
                $editEle.val(this.formatter(v));
                if ($editEle.hasClass('field-gearing'))
                    setTimeout(function () { //setTimeout因select2尚未初始化，會造成$_allgfoptions ==empty
                        $editEle.trigger('change', { fromSetValue:true });
                    });
            }
        },
        "select": {
            editContent: function ($_fieldContainer, _row, _appendEmpty) {
                if (this.selectitems === undefined)
                    alert(this.field + " selectitems 資料有問題");
                var result = [
                    '<select class="form-control form-select" data-fn="' + this.field + '" >'
                ];
                //if (typeof (this.selectitems) === "string")
                //    this.selectitems = JSON.parse(this.selectitems);
                if (this.allowNull || _appendEmpty) ///_appendEmpty來至filter
                    result.push("<option value='' title='所有" + this.title + "'>選擇" + this.title + "</option>");

                var sitems = sortSelectItems(this.selectitems);//原資料v如包含@@，前是v，後是順序
                $.each(sitems, function () {
                    var datahtml = [];
                    for (var k in this) {
                        datahtml.push("data-" + k + "='" + this[k] + "'");
                    }
                    result.push("<option value='" + this.k + "' " + datahtml.join(" ") + ">" + this.v + "</option>");
                });
                result.push("</select>");
                //$_fieldContainer.append(result.join(' '));
                var $_s = $(result.join(' ')).appendTo($_fieldContainer);

                if (!_appendEmpty && this.defaultvalue != undefined) { //_appendEmpty=true來至filter
                    var dv = this.defaultvalue;
                    //if (this.defaultvalue) {
                    //    var _ddt = this.defaultvalue;
                    if (typeof dv === 'string' && dv.startsWith("eval(") >= 0)
                        dv = eval(dv);
                        //_ddt = helper.format.JsonDateStr2Datetime(_ddt);
                        //if (this.useInputType && isInputSupportDate())
                        //    $_dtp.find('input').attr('value', _ddt.DateFormat("yyyy-MM-dd"));
                        //else
                        //    $_dtp.datetimepicker("date", _ddt);
                    //}
                    $_s.val(dv + "");
                }
                else
                    $_fieldContainer.find('select')[0].selectedIndex = 0;

                gearingSelectDom($_s, this, _appendEmpty); //_appendEmpty來至filter
                

            },
            getValue: function ($editEle) {
                return $editEle.val();
            },
            setValue: function ($editEle, v) {
                if (this.key || this.editable === false)
                    $editEle.prop('disabled', true);
                $editEle.val(v + "");//bool要變字串

                //console.log('setValue:' + this.field);
                if ($editEle.hasClass('field-gearing'))
                    setTimeout(function () { //setTimeout因select2尚未初始化，會造成$_allgfoptions ==empty
                        $editEle.trigger('change', { fromSetValue: true });
                    });
            },
            event: function (e, args) {
                var sd = this;
                var sdd = "";
            }
        },
        "radio": { 
            editContent: function ($_fieldContainer, _row, _appendEmpty) {
                if (this.selectitems === undefined)
                    alert(this.field + " selectitems 資料有問題");
                var radioname = this.field+'' + Date.now();
                var $editEle = $('<div  data-fn="' + this.field + '" class="ftype-radio"></div>').appendTo($_fieldContainer);
                var radios = [
                ];
                //if (typeof (this.selectitems) === "string")
                //    this.selectitems = JSON.parse(this.selectitems);
                if (this.allowNull || _appendEmpty) ///_appendEmpty來至filter
                    radios.push('<label><input type="radio" name="' + radioname + '" value="">無</label>');

                var sitems = sortSelectItems(this.selectitems);//原資料v如包含@@，前是v，後是順序
                $.each(sitems, function () {
                    radios.push('<label><input type="radio" name="' + radioname + '" value="' + this.k + '">' + this.v + '</label>');
                });
                //$_fieldContainer.append(result.join(' '));
                var $_s = $(radios.join(' ')).appendTo($editEle);

                if (!_appendEmpty && this.defaultvalue != undefined) {//_appendEmpty=true來至filter
                    $_s.val(this.defaultvalue + "");
                    $('input[name="' + radioname + '"][value="' + this.defaultvalue + '"]', $editEle).prop('checked', true);
                }
                //else
                //    $_fieldContainer.find('select')[0].selectedIndex = 0;

            },
            getValue: function ($editEle) {
                return $('input:checked', $editEle).val();
            },
            setValue: function ($editEle, v) {
                if (this.key || this.editable === false)
                    $editEle.prop('disabled', true);
                if (v != undefined)
                    $('input[value="' + v + '"]', $editEle).prop('checked', true);
            }
        },
        "email": {
            editContent: function ($_fieldContainer) {
                var $editEle = $('<input type="email"  class="form-control" data-fn="' + this.field + '" ' +
                    (this.placeholder ? 'placeholder="' + this.placeholder + '"' : (this.key || this.allowNull === false ? 'placeholder="不能空值"' : '')) +
                    (this.maxlength ? ' maxlength="' + this.maxlength + '"' : ' ') + ' ></input>').appendTo($_fieldContainer);

                if (this.defaultvalue)
                    $editEle.val(this.defaultvalue);
            },
            getValue: function ($editEle) {
                return $editEle.val();// .data("fn");
            },
            setValue: function ($editEle, v) {
                if (this.key || this.editable === false)
                    $editEle.prop('disabled', true);
                $editEle.val(v);
            }
        },
        "password": {
            editContent: function ($_fieldContainer) {
                var $editEle = $('<input type="password"  class="form-control" data-fn="' + this.field + '" ' +
                    (this.placeholder ? 'placeholder="' + this.placeholder + '"' : (this.key || this.allowNull === false ? 'placeholder="不能空值"' : '')) +
                    (this.maxlength ? ' maxlength="' + this.maxlength + '"' : ' ') + ' ></input>').appendTo($_fieldContainer);

                if (this.defaultvalue)
                    $editEle.val(this.defaultvalue);
            },
            getValue: function ($editEle) {
                return $editEle.val();// .data("fn");
            },
            setValue: function ($editEle, v) {
                if (this.key || this.editable === false)
                    $editEle.prop('disabled', true);
                $editEle.val(v);
            }
        },
        "image": { //僅適用//IE(10+)	FIREFOX(3.6+)	CHROME(6.0+)	SAFARI(6.0+)	OPERA(11.1+)
            editContent: function ($_fieldContainer) {
                var current = this;
                var _txt = '<div><img ><a class="glyphicon ms-1 ml-1 btn btn-default change-upload-btn" title="瀏覽" onclick="dataManagerIconUploadClick.call(this);">...</a>' +
                    '<input type="file" accept=".jpg,.jpeg,.png,.ico,.gif,.tif,.tiff,.jfif" style="display:none;" name="page_icon_file" id="page_icon_file" onchange="dataManagerUploadFileChange.call(this);"></div>';
                if (!window.dataManagerIconUploadClick) {
                    window.dataManagerIconUploadClick = function () {
                        $(this).parent().find("input:first").trigger("click");
                    };
                }
                if (!window.dataManagerUploadFileChange) {
                    window.dataManagerUploadFileChange = function () {
                        var __img = document.createElement("img"); //為了取檔案的大小、寬及高
                        __img.onload = function (ecc, bwfg) {
                            //$("#img_width", uploadPanel).val(__img.width);
                            //$("#img_height", uploadPanel).val(__img.height);
                        };
                        var img = $(this).closest("div").find("img");
                        if (!FileReader) {//navigator.userAgent.search("MSIE") > -1 || navigator.userAgent.search("Trident/") > -1) { //IE
                            img.attr('src', $(this).val());//只在IE上work
                            __img.src = img.attr('src');
                        }
                        else { //IE(10+)	FIREFOX(3.6+)	CHROME(6.0+)	SAFARI(6.0+)	OPERA(11.1+)
                            var file = this.files[this.files.length - 1];
                            var imageType = /image.*/;
                            if (file.type.match(imageType)) {//https://disp.cc/b/11-8uqn
                                var reader = new FileReader();
                                reader.onload = function (e) {
                                    __img.src = reader.result;
                                    if (current.imageMaxWidth && current.imageMaxHeight) {
                                        setTimeout(function () {
                                            var width = __img.width,
                                                height = __img.height,
                                                maxWidth = current.imageMaxWidth,
                                                maxHeight = current.imageMaxHeight;

                                            
                                            //寬或高大於設定的上限時，等比例縮小到符合上限
                                            if (width > height) {
                                                if (maxWidth > 0 && width > maxWidth) {
                                                    height *= maxWidth / width;
                                                    width = maxWidth;
                                                }
                                            } else {
                                                if (maxHeight > 0 && height > maxHeight) {
                                                    width *= maxHeight / height;
                                                    height = maxHeight;
                                                }
                                            }
                                            var scale_factor = Math.min(width / __img.width, height / __img.height);
                                            var canvas = document.createElement("canvas");
                                            canvas.width = width;
                                            canvas.height = height;

                                            var ctx = canvas.getContext("2d");


                                            // polyfill 提供了這個方法用來獲取設備的 pixel ratio
                                            var getPixelRatio = function (context) {
                                                var backingStore = context.backingStorePixelRatio ||
                                                    context.webkitBackingStorePixelRatio ||
                                                    context.mozBackingStorePixelRatio ||
                                                    context.msBackingStorePixelRatio ||
                                                    context.oBackingStorePixelRatio ||
                                                    context.backingStorePixelRatio || 1;

                                                return (window.devicePixelRatio || 1) / backingStore;
                                            };

                                            var userAgent = navigator.userAgent || navigator.vendor || window.opera;
                                            var isAndroid = userAgent.match(/Android/i) || userAgent.match(/Linux/i);//true
                                            var ratio = isAndroid ? 1 : getPixelRatio(ctx);
                                            if (userAgent.match(/Windows NT/i)) //一般電腦20230106
                                                ratio = 1;
                                            //console.log("ratio:" + ratio);

                                            //console.log("width:" + width + " outwidth:" + width * ratio + " height:" + height + " outheight:" + height * ratio);
                                            //alert(ratio + "userAgent:" + userAgent + "userAgent1.match(/Android/i):" + isAndroid + ">>" + (width * ratio / __img.width) + ">>" + (height * ratio / __img.height));
                                            ctx.drawImage(__img, 0, 0, width / ratio, height / ratio);
                                            //將canvas轉為圖片的base64編碼
                                            var dataurl = canvas.toDataURL(file.type);
                                            console.log("dataurl.length2:" + dataurl.length)
                                            img.attr('src', dataurl);
                                        });
                                    } else
                                        img.attr('src', reader.result);
                                }
                                reader.readAsDataURL(file);
                            } else {
                                alert('File not supported!');
                            }
                        }
                        img.show();
                    };
                }
                $_fieldContainer.append(_txt);
            },
            getValue: function ($editEle) {
                return $editEle.find("img").attr("src");
            },
            setValue: function ($editEle, v) {
                $editEle.find("img").attr("src", v);
            }
        }
    }

    if ($.fn.datetimepicker && $.fn.datetimepicker.Constructor) { //for bootstrap4以上引用Tempus Dominus
        $.fn.datetimepicker.Constructor.Default = $.extend({}, $.fn.datetimepicker.Constructor.Default, {
            icons: {
                time: 'glyphicon glyphicon-time',
                date: 'glyphicon glyphicon-calendar',
                up: 'glyphicon glyphicon-chevron-up',
                down: 'glyphicon glyphicon-chevron-down',
                previous: 'glyphicon glyphicon-chevron-left',
                next: 'glyphicon glyphicon-chevron-right',
                today: 'glyphicon glyphicon-screenshot',
                clear: 'glyphicon glyphicon-trash',
                close: 'glyphicon glyphicon-remove'
            }
        });
    }

    $.dou = {
        events: {
            add: '--DataAdd--',
            update: '--DataUpadte--',
            delete: '--DataDelete--'
        }
    }
    var pluginName = 'DouEditableTable'
    var pluginclass = function (element, e) {
        try {
            $('body').addClass('bootstrp-version-' + helper.bootstrap.getversion());
        } catch (err) { }
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.$element = $(element);
        this.$rootParentContainer = undefined;
        this.settings = $.extend(true, {}, $.edittableoptions);// {map:undefined, width:240};
        this.$table = undefined;
        this.$___bootstraptable = undefined;
        this.$___currentEditFormWindow = undefined;
        this.$___filterToolbar = undefined;
        this.$_ctrlbtn = undefined;

    };
    pluginclass.prototype = {
        constructor: pluginclass,
        init: function (options) {
            this.$___bootstraptable = undefined;
            this.$___currentEditFormWindow = undefined;
            this.$___filterToolbar = undefined;

            var current = this;
            $.extend(true, this.settings, options);
            this.$rootParentContainer = typeof this.settings.rootParentContainer === "string" ? $(this.settings.rootParentContainer) : this.settings.rootParentContainer;

            //如前端是呼叫Dou後端GetDataManagerOptionsJson，function會是是字串，需string轉成function
            this.settings.addServerData = stringEval2Function(this.settings.addServerData);
            this.settings.updateServerData = stringEval2Function(this.settings.updateServerData);
            this.settings.deleteServerData = stringEval2Function(this.settings.deleteServerData);
            if (this.settings.tableOptions) {
                this.settings.tableOptions.formatNoMatches = stringEval2Function(this.settings.tableOptions.formatNoMatches);
                this.settings.tableOptions.formatSearch = stringEval2Function(this.settings.tableOptions.formatSearch);
                this.settings.tableOptions.responseHandler = stringEval2Function(this.settings.tableOptions.responseHandler);
                this.settings.tableOptions.queryParams = stringEval2Function(this.settings.tableOptions.queryParams);
            }

            this.settings.datas = options.datas; //如options.datas=[] ,則extend後this.settings.datas的實體還是原this.settings.datas[]的實體
            this.settings.tableOptions.search = this.settings.search;
            if (this.settings.cardView !== undefined)
                this.settings.tableOptions.cardView = this.settings.cardView;
            if (this.settings.editformWindowStyle == $.editformWindowStyle.detail) {
                this.settings.tableOptions.detailView = true;
                if (this.settings.tableOptions.detailViewIcon == undefined)
                    this.settings.tableOptions.detailViewIcon = false;
            }
            
            //_dataFields>>fields僅欄位定義內容
            var _f = function (_fd) {
                if ($.isArray(_fd)) { //多層表頭
                    $.each(_fd, function () {
                        _f(this);
                    });
                }
                else if (_fd.field)
                    current.settings._dataFields.push(_fd);
            }
            current.settings._dataFields = []; //清空，避免setOptions會一直累加
            $.each(this.settings.fields, function () {
                _f(this);
            })
            ////
            douHelper.setFieldsDefaultAttribute(this.settings._dataFields);
            $.each(this.settings._dataFields, function () {
                if (this.filter) {
                    current.__initFilter(this);
                }
            });
            if (this.settings.useMutiSelect || (this.settings.useMutiDelete == true && this.settings.deleteable == true)) {
                if ($.isArray(this.settings.fields[0])) //>>多層表頭
                    this.settings.fields[0].splice(0, 0, { checkbox: true, visibleEdit: false, rowspan: this.settings.fields.length });
                else
                    this.settings.fields.splice(0, 0, { checkbox: true, visibleEdit: false });
            }
            //button classes
            this.settings.buttonClasses = $.extend(JSON.parse(JSON.stringify($.douButtonsDefault)), this.settings.buttonClasses);
            if (this.$___filterToolbar) {
                this.$___filterToolbar.find(">.form-inline").append('<div class="form-group col-auto"><span  class="btn btn-confirm ' + this.settings.buttonClasses.query + '">查 詢</span></div>');
                this.settings.tableOptions.toolbarAlign = "right";
                this.settings.tableOptions.toolbar = this.$___filterToolbar;//this.settings.rootParentContainer + " > .filter-toolbar-plus";
            }
            var _ctrf = douHelper.getField(this.settings.fields, 'ctrl');
            if (_ctrf != null) { //setOtions需移掉舊的ctrl field
                var _ctri = this.settings.fields.indexOf(_ctrf);
                this.settings.fields.splice(_ctri, 1);
            }
            if (this.settings.editable === true || this.settings.deleteable === true || this.settings.viewable == true || current.settings.appendCustomFuncs.length > 0) {
                //ctrl-header 為了card-view恐志向靠左用
                _ctrf = {
                    field: "ctrl", title: "&nbsp;", cellStyle: { css: { "ctrl-header": "#aaa" } }, class: 'dou-ctrl-header', width: (current.settings.editable && current.settings.deleteable) ? 94 : 52, visibleEdit: false,
                    formatter: function (value, row) {
                        var _html = "";
                        if (current.settings.editable)
                            _html += '<span style="background-color:rgba(255,255,255,0);" class="btn btn-data-manager-ctrl btn-update-data-manager ' + current.settings.buttonClasses.update + '" title="修改" data-user-id="' + row.Id + '" data-ctrl="1"></span> ';
                        if (current.settings.deleteable)
                            _html += '<span style="background-color:rgba(255,255,255,0);" class="btn btn-data-manager-ctrl btn-delete-data-manager ' + current.settings.buttonClasses.delete + '" title="刪除" data-ctrl="2"></span>';
                        if (current.settings.viewable)
                            _html += '<span style="background-color:rgba(255,255,255,0);" class="btn btn-data-manager-ctrl btn-view-data-manager ' + current.settings.buttonClasses.view + '" title="檢視" data-ctrl="0"></span>';
                        if (current.settings.appendCustomFuncs)
                            $.each(current.settings.appendCustomFuncs, function () {
                                if (typeof this.item === 'function')
                                    _html += this.item.call(current, value, row);
                                else
                                    _html += this.item;
                            });
                        return _html;
                    },
                    events: {
                        'click .btn-update-data-manager': function (e, value, row, index) {
                            current.___update(row, index);
                        },
                        'click .btn-delete-data-manager': function (e, value, row, index) {
                            current.___delete(row, index);
                        },
                        'click .btn-view-data-manager': function (e, value, row, index) {
                            var c = current.settings.tableOptions.detailFormatter.call(current, index, row);
                            helper.jspanel.jspAlertMsg(undefined, { content: c, title: current.settings.title + '-詳細資料', autoclose: 999999 });
                        }
                    }
                };
                if (current.settings.appendCustomFuncs) {
                    $.each(current.settings.appendCustomFuncs, function () {
                        _ctrf.events[this.event] = this.callback;
                    });
                }
                if ($.isArray(this.settings.fields[0])) { //多階表頭
                    _ctrf.rowspan = this.settings.fields.length;
                    if (this.settings.ctrlFieldAlign == 'right')
                        this.settings.fields[0].push(_ctrf);
                    else
                        this.settings.fields[0].splice(this.settings.fields[0][0].hasOwnProperty("checkbox") ? 1 : 0, 0, _ctrf);
                }
                else {
                    if (this.settings.ctrlFieldAlign == 'right')
                        this.settings.fields.push(_ctrf);
                    else
                        this.settings.fields.splice(this.settings.fields[0].hasOwnProperty("checkbox")?1:0, 0, _ctrf);
                }
            }


            //resquest show BusyIndicator
            if (this.settings.tableOptions.queryParams && helper) {
                var orgqQueryParams = this.settings.tableOptions.queryParams;
                this.settings.tableOptions.queryParams = function (params) {
                    //改用bootsrtaptable的資訊
                    //helper.misc.showBusyIndicator(current.$rootParentContainer.find(".bootstrap-table > .fixed-table-container > .fixed-table-body>.fixed-table-loading"));
                    if (current.$___filterToolbar)
                        current.$___filterToolbar.find(".btn-confirm").addClass('disabled');
                    return orgqQueryParams(params)
                };
            }
            if (this.settings.tableOptions.responseHandler && helper) {
                var orgqResponseHandler = this.settings.tableOptions.responseHandler;
                this.settings.tableOptions.responseHandler = function (res) {
                    //if (current.$___bootstraptable)
                    //    helper.misc.hideBusyIndicator(current.$___bootstraptable);
                    if (current.$___filterToolbar)
                        current.$___filterToolbar.find(".btn-confirm").removeClass('disabled');
                    if (res && res.hasOwnProperty('Success') && !res.Success && res.RedirectUrl) {
                        return res;
                    }
                    return orgqResponseHandler(res)
                };
            }
            //單一資料編輯
            if (this.settings.singleDataEdit) {
                if (!this.settings.datas || this.settings.datas.length == 0) {
                    alert("單一資料編輯初始要給資料datas[1]");
                    if (this.settings.singleDataEditCompletedReturnUrl) {
                        if (typeof this.settings.singleDataEditCompletedReturnUrl == 'function')
                            this.settings.singleDataEditCompletedReturnUrl(null, false);
                        else
                            location.href = this.settings.singleDataEditCompletedReturnUrl;
                    }
                }
                this.settings.tableOptions.url = undefined;
            }
            this.settings.tableOptions.height = this.settings.height;
            this.settings.tableOptions.data = this.settings.datas;
            this.settings.tableOptions.columns = this.settings.fields; //含多層表頭


            //this.settings.tableOptions.toolbar = this.settings.toolbar;
            var orgOnLoadSuccess = this.settings.tableOptions.onLoadSuccess;
            this.settings.tableOptions.onLoadSuccess = function (res) { // 從新給settings.datas
                if ($.isArray(res))
                    current.tableReload(res, true); //無page
                else if ($.isArray(res.data))
                    current.tableReload(res.data, true);//有page
                else if (!res.Success && res.RedirectUrl) {
                    alert(res.Desc);
                    location.href = res.RedirectUrl; //已timeout或後端重啟...等session中斷
                    return;
                }
                else
                    alert("onLoadSuccess Error:" + JSON.stringify(res))

                if (orgOnLoadSuccess)
                    orgOnLoadSuccess(res);
            }

            var orgOnLoadError = this.settings.tableOptions.onLoadError;
            this.settings.tableOptions.onLoadError = function (status, dat) {
                console.log("load-error:" + status + "  " + dat.responseText);
                if (dat && (dat.responseText && dat.responseText.indexOf('dou-login-container') >= 0 || dat.RedirectUrl)) {
                    alert(dat.Desc);
                    location.reload();//觸發導向login
                }
                else
                    alert('資料讀取發生問題，請檢查網路是否正常或重新執行\n如持續發生問題洽管理員\nstatus:' + status+'\n'+JSON.stringify(dat));
                if (orgOnLoadError)
                    orgOnLoadError(status, dat);
            }

            this.settings.beforeCreateTable(this.settings, function () {
                current.createBootstrapTable();
                current.ctrlBtnListen();
            });
            
        },
        showTableColumn: function (fn, _show) {
            if (this.$table) {
                var hf = this.$table.bootstrapTable('getHiddenColumns');
                var cfn = douHelper.getField(hf, fn);
                if (_show) {
                    if (cfn) //目前是hide
                        this.$table.bootstrapTable('showColumn', fn);
                }
                else {
                    if (!cfn) //目前是show
                        this.$table.bootstrapTable('hideColumn', fn);
                }
            }
        },
        createBootstrapTable: function () {
            var current = this;
            var $_leftToolbar;
            //this.settings.ta
            this.$table = this.$element.bootstrapTable(this.settings.tableOptions);
            this.$___bootstraptable = this.$table.closest(".bootstrap-table").addClass('dou-bootstrap-table');

            var $_ftToolbar = this.$___bootstraptable.find(">.fixed-table-toolbar");

            //bootstrap-table的columns(內建的table控制項，如匯出)放置最右
            $_ftToolbar.find(' > .columns').prependTo($_ftToolbar);

            this.$___bootstraptable.find('> .fixed-table-container > .fixed-table-body').addClass('default-scrollbar');

            if (this.settings.classes) this.$___bootstraptable.addClass(this.settings.classes);
            if (this.settings.singleDataEdit) {
                //this.$table.find('tr[data-index="你的序號"] .btn-update-data-manager:first').trigger("click");
                //this.$table.find('.btn-update-data-manager:first').trigger("click");
                this.editSpecificData(this.getData()[0]);
                return;
            }
            
            //$(window).resize(function () {
            //    current.$element.bootstrapTable('resetView');
            //});
           
            //$_ftToolbar.find(" > .search.pull-right").css("clear", "both"); //20221122
            $_ftToolbar.find(" > .search.float-right").css("clear", "both");


            this.$___bootstraptable.find("> .fixed-table-container > .fixed-table-header").addClass("fixed-table-header-extend");

            //***左邊功能按鈕 S***
            if (this.settings.addable || (this.settings.deleteable && this.settings.useMutiDelete) ||
                (this.settings.appendCustomToolbars && this.settings.appendCustomToolbars.length > 0)) {
                //$_leftToolbar = $_ftToolbar.find(" > .pull-left");//20221122
                $_leftToolbar = $_ftToolbar.find(" > .float-left");
                if ($_leftToolbar.length == 0)
                    $_leftToolbar = $('<div class="bars bs-bars float-left">').appendTo($_ftToolbar);

                $_leftToolbar.addClass("btn-toolbar");
            }

            if (this.settings.addable) {
                $('<span class="btn btn-add-data-manager ' + this.settings.buttonClasses.add + '" >新 增</span>').appendTo($_leftToolbar).
                    click(function () {
                        current.___add();
                    });
            }

            //多筆刪除
            if (this.settings.deleteable && this.settings.useMutiDelete) {
                var $delAll = $('<span class="btn btn-delete-data-manager ' + this.settings.buttonClasses.deleteall + '">刪 除</span>').appendTo($_leftToolbar);
                $delAll.click(function () {
                    var chs = current.$table.find(" > tbody > tr.selected");
                    var sels = current.$table.bootstrapTable('getSelections');
                    if (sels.length == 0) {
                        jspAlertMsg($("body"), { autoclose: 3000, content: "尚未選擇欲刪除資料!!", classes: 'modal-sm' });
                        return;
                    }
                    var indexs = [];
                    $.each(current.$table.find(" > tbody > tr.selected"), function (_tr) {
                        indexs.push($(this).attr("data-index"));
                    })
                    current.___delete(sels, indexs)
                    //alert(JSON.stringify( current.$table.bootstrapTable('getSelections')));
                });
            }

            //appendCustomToolbars
            if (this.settings.appendCustomToolbars && this.settings.appendCustomToolbars.length > 0) {
                if (typeof this.settings.appendCustomToolbars === 'string') {
                    $_leftToolbar.append(this.settings.appendCustomToolbars);
                }
                else if ($.isArray(this.settings.appendCustomToolbars)) {
                    $.each(this.settings.appendCustomToolbars, function () {
                        var $el = $(this.item).appendTo($_leftToolbar);//.addClass('btn-sm');//給btn-sm why?20221013
                        $el.bind(this.event, this.callback);
                    });
                }
            }
            //***左邊功能按鈕 E***

            if (this.$___filterToolbar)
                this.$___filterToolbar.find(".btn-confirm").click(function () { current.___filter(); });

        },
        ___getFiled: function (fn) {
            return douHelper.getField(this.settings.fields, fn);
        },
        ___add: function () {
            var current = this;
            //var addindex = this.getData().length - 1;//editformWindowStyle-detail，將編輯放置最後一筆detail
            this.editDataForm("新增", null, undefined, function (urow) {
                if (urow) {

                    var autoclose = 2000;
                    current.settings.addServerData(urow, function (result) {
                        var sdfsggdf = this;
                        if (result.Success) {
                            if (result.data) {
                                for (var _key in result.data[0]) {
                                    if (result.data[0][_key] == null)
                                        delete result.data[0][_key];
                                }
                                $.extend(urow, result.data[0])
                            }

                            current.settings.afterAddServerData(urow, function () {
                                current.addDatas(urow);
                                

                                current._editformWindowStyleEnd();
                                if (result.Desc != undefined) // undefined不需alert訊息，特殊客製化需求用
                                    jspAlertMsg($("body"), { autoclose: autoclose, content: result.Desc, classes: 'modal-sm' });//.css("overflow", "hidden").css("width", "251");
                                current.$element.triggerHandler($.dou.events.add, [urow]);
                            });
                        } else {
                            console.log("result.Desc:" + result.ExceptionMsg || result.Desc);
                            current.$___currentEditFormWindow.triggerHandler("set-error-message", result.Desc);
                        }
                    });
                }
            });
        },
        ___update: function (row, trindex) {
            var current = this;
            this.editDataForm("編輯", row, trindex, function (urow) {
                if (urow) { //urow是原row的實體
                    current.settings.updateServerData(urow, function (result) {
                        if (result.Success) {
                            //if (current.settings.singleDataEdit) {
                            if (current.settings.singleDataEdit && current.settings.singleDataEditCompletedReturnUrl) { //20221228
                                helper.jspanel.jspAlertMsg(current.$___currentEditFormWindow, { content: "編輯完成", classes: 'modal-sm' }, function () {
                                    if (current.settings.singleDataEditCompletedReturnUrl)
                                        if (typeof current.settings.singleDataEditCompletedReturnUrl == 'function')
                                            current.settings.singleDataEditCompletedReturnUrl(urow, true);
                                        else
                                            location.href = current.settings.singleDataEditCompletedReturnUrl;
                                });

                            }
                            else {
                                //current.tableReload();
                                if (result.data) {
                                    for (var _key in result.data[0]) {
                                        if (result.data[0][_key] == null)
                                            delete result.data[0][_key];
                                    }
                                    $.extend(urow, result.data[0])
                                }
                                current.settings.afterUpdateServerData(urow, function () {
                                    current.updateDatas(urow); //20221222提出method
                                    current._editformWindowStyleEnd();
                                    current.$element.triggerHandler($.dou.events.update, urow);
                                });
                            }

                        } else {
                            console.log("result.Desc:" + result.ExceptionMsg || result.Desc);
                            current.$___currentEditFormWindow.trigger("set-error-message", result.Desc);
                        }
                    });
                }
            });
        },
        ___delete: function (row, trindex) {
            var current = this;
            //var dssdsdff=current.settings.datas;
            //return;
            jspConfirmYesNo(current.$rootParentContainer, { content: "確定要刪除" + ($.isArray(row) ? (row.length + "筆") : "") + "資料?" }, function (confrim) {
                if (confrim) {
                    helper.misc.showBusyIndicator(current.$table, { timeout: 180000 });
                    current.settings.deleteServerData(row, function (result) {
                        helper.misc.hideBusyIndicator(current.$table);
                        if (result && result.Success) {
                            if ($.isArray(row)) { //多筆
                                if ("server" !== current.settings.tableOptions.sidePagination) {
                                    current.removeDatas(row);
                                }
                                else {

                                    current.$table.bootstrapTable("refresh");
                                }
                            } else {
                                var didx = current.___getDataIndex(row);//如有排序後didx 有可能不等於trIdx
                                var tr = $(".fixed-table-body tbody tr[data-index=" + trindex + "]:eq(0)", current.$___bootstraptable);
                                if (didx >= 0 && tr) {
                                    current.settings.datas.splice(didx, 1);
                                    tr.fadeOut(500, function () {
                                        if ("server" !== current.settings.tableOptions.sidePagination) {
                                            current.tableReload();
                                        }
                                        else
                                            current.$table.bootstrapTable("refresh");
                                    });
                                }
                            }
                            current._editformWindowStyleEnd();
                            current.$element.triggerHandler($.dou.events.delete, $.isArray(row) ? $.isArray(row) : [row]);
                        }
                        else {
                            console.log("result.Desc:" + result.ExceptionMsg || result.Desc);
                            jspAlertMsg($("body"), { autoclose: 99999, content: result.Desc }).css("overflow", "hidden");//.css("width", "251");
                        }
                    });
                }
            });
        },
        getSelections: function () { //取選取的資料
            if (this.$table)
                return this.$table.bootstrapTable('getSelections');
            else
                return [];
        },
        getData: function () {
            if (this.$table)
                return this.$table.bootstrapTable('getData');
            else
                return this.settings.datas;
        },
        removeDatas: function (_rows, _toServer) { //依內容移除前端資料，_toServer未實作
            var current = this;
            var removeidxs = [];
            $.each(_rows, function () {
                var didx = current.___getDataIndex(this);
                removeidxs.push(didx);
            })
            removeidxs.reverse();
            $.each(removeidxs, function () {
                if (this < 0) {
                    return;
                }
                current.settings.datas.splice(this, 1);
            });
            current.tableReload();
        },
        addDatas: function (_rows, _toServer, callback) {
            var current = this;
            if (_toServer) {
                helper.misc.showBusyIndicator(this.$table, { timeout: 180000 });
                current.settings.addServerData(_rows, function (result) {
                    helper.misc.hideBusyIndicator(current.$table);
                    if (result.Success) {
                        current.___appendDataToTable(result.data);
                        jspAlertMsg($("body"), { content: result.Desc, classes: 'modal-sm' });//.css("overflow", "hidden").css("width", "251");
                    } else {
                        jspAlertMsg($("body"), { autoclose: 60000, content: result.Desc });//.css("overflow", "hidden").css("width", "251");
                    }
                    if (callback)
                        callback(result);
                });
            } else {
                this.___appendDataToTable(_rows);
                if (callback)
                    callback(_rows);
            }
        },
        updateDatas: function (_rows, _toServer, callback) {
            var current = this;
            if (_toServer) {
                helper.misc.showBusyIndicator(this.$table, { timeout: 180000 });
                current.settings.updateServerData(_rows, function (result) {
                    helper.misc.hideBusyIndicator(current.$table);
                    if (result.Success) {
                        current.___updateDataToTable(result.data);
                        jspAlertMsg($("body"), { content: result.Desc, classes: 'modal-sm' });//.css("overflow", "hidden").css("width", "251");
                    } else {
                        jspAlertMsg($("body"), { autoclose: 60000, content: result.Desc });//.css("overflow", "hidden").css("width", "251");
                    }
                    if (callback)
                        callback(result);
                });
            } else {
                this.___updateDataToTable(_rows);
                if (callback)
                    callback(_rows);
            }
        },
        ___appendDataToTable: function (_datas) {
            var that = this;
            if (!this.settings.datas)
                this.settings.datas = [];
            var $_pinfo = this.$___bootstraptable.find('>.fixed-table-pagination');
            var ocount = this.settings.datas.length;
            var tocount, tcount;//修正分頁筆數資訊
            if (this.settings.tableOptions.sidePagination =='server' && $_pinfo.length > 0) { 
                var otext = $_pinfo.find('.pagination-info').text();

                var sidx = otext.indexOf('到第') + 2;
                var eidx = otext.indexOf('筆', sidx);
                tocount = parseInt(otext.substr(sidx, eidx - sidx));
                sidx = otext.indexOf('總共') + 2;
                eidx = otext.indexOf('筆', sidx);
                tcount = parseInt(otext.substr(sidx, eidx - sidx));
            }


            var _appendDatas = $.isArray(_datas) ? _datas : [_datas];
            if (!_datas && _appendDatas.length == 0)
                return;
            this.$table.bootstrapTable(this.settings.addToListTop ? 'prepend' :'append', _appendDatas);
            //if ($.isArray(_datas)) {
            _appendDatas.forEach(function (_d) {
                that.settings.datas.push(_d);
            });
            //$.each(_datas, function () {
            //});
            //}
            //else 
            //    this.settings.datas.push(_datas);//需放於.bootstrapTable('append', urow);後
            //current.$table.bootstrapTable('insertRow', {index:0, row:urow});

            //var ntr = this.$table.parent(".fixed-table-body")[0];
            //ntr.scrollTop = ntr.scrollHeight;   //不work
            //$('body').scrollTop(ntr.scrollHeight);  //work 20230512尚未確認用這
            var ridx = this.settings.addToListTop ? 0 : ocount;

            /*for (var _i = 1; _i <= _appendDatas.length; _i++)*/
            for (var _i = 0; _i < _appendDatas.length; _i++)
                $("tr[data-index=" + (ridx+_i) + "]").hide().fadeIn(2000);

            if (this.settings.tableOptions.sidePagination =='server' && $_pinfo.length > 0) {
                $_pinfo.find('.pagination-info').text(otext.replace("到第 " + tocount + " 筆", "到第 " + (tocount+_appendDatas.length) + " 筆").
                    replace("總共 " + tcount + " 筆", "總共 " + (tcount + _appendDatas.length ) + " 筆"));
            }
            if (!this.settings.addToListTop) {
                var element = this.$table.find("tr[data-index=" + ridx + "]")[0];
                element.scrollIntoView();
            }
        },
        ___updateDataToTable: function (_datas) {
            if (!_datas || ($.isArray(_datas) && _datas.length == 0))
                return;
            var that = this;
            if (!this.settings.datas)
                this.settings.datas = [];
            var _updateDatas = $.isArray(_datas) ? _datas : [_datas];

            _updateDatas.forEach(function (_d) {
                var ridx = that.___getDataIndex(_d);//原始資料  index(如資料來至server site，資料index會同uitable.tr index，反之不一定)

                var crow = that.settings.datas[ridx];
                if (crow != _d) { //資料非從server site
                    for (var _key in _d) {
                        if (_d[_key] !== null)
                            crow[_key] = _d[_key];
                    }
                }

                that.$table.bootstrapTable('updateRow', { index: ridx, row: _d }); //index要用原始資料index
            });

            var tableIdx = that.___getDataIndex(_updateDatas[_updateDatas.length - 1], that.getData());//ui table.tr  index
            var tr = $(".fixed-table-body tbody tr[data-index=" + tableIdx + "]:eq(0)", that.$___bootstraptable);
            if (tr) {
                var $_tablebody = $(".fixed-table-body", that.$___bootstraptable);
                var pos = tr[0].offsetTop - tr.height();
                if (pos < $_tablebody[0].scrollTop || pos > ($_tablebody[0].scrollTop + $_tablebody.height())) {
                    $(".fixed-table-body", that.$___bootstraptable)[0].scrollTop = tr[0].offsetTop - tr.height();// trh * rindex;
                }
                tr.hide();
                tr.fadeIn(600);
               
            }
            else
                console.log("找不到資料相對的tr tag index:" + didx);
            //var ntr = this.$table.parent(".fixed-table-body")[0];
            //ntr.scrollTop = ntr.scrollHeight;
            //for (var _i = 1; _i <= _appendDatas.length; _i++)
            //    $("tr[data-index=" + (this.settings.datas.length - _i) + "]").hide().fadeIn(2000);
        },
        ___getDataIndex: function (row, _datas) {
            var iidx = -1;
            var current = this;
            _datas = _datas || this.settings.datas; //預設原始資料
            $.each(_datas, function (idx, d) {
                if (d === row) {
                    iidx = idx;
                    return false;
                }
            });
            if (iidx == -1) { //如row是自行組的或用$.extend或JSON.parse之類物件等不屬於this.settings.datas裡的資料，iidx會是-1
                if (!this._currentKeysField) {
                    this._currentKeysField = $.grep(this.settings._dataFields, function (_f) {
                        return _f.key == true;
                    });
                }
                $.each(_datas, function (idx, d) {
                    var _match = true;
                    $.each(current._currentKeysField, function () {
                        _match = row[this.field] == d[this.field];
                        if (!_match)
                            return false;
                    });
                    if (_match) {
                        iidx = idx;
                        return false;
                    }
                });
            }
            return iidx;
        },
        ctrlBtnListen: function () {
            return; //改於columns的events給event
            var current = this;
            $(".btn-update-data-manager,.btn-delete-data-manager", this.$table).unbind('click').click(function (evt) { //修改
                current.$_ctrlbtn = $(evt.target);
            });
            this.$_ctrlbtn = undefined;
        },
        editSpecificData: function (d) {
            var _i = this.___getDataIndex(d, this.getData());
            this.$table.find('tr[data-index="' + _i +'"] .btn-update-data-manager:first').trigger("click");
        },
        tableReload: function (_datas, _fromServer) {
            var sctop = this.$table.parent(".fixed-table-body")[0].scrollTop;
            if (_datas) {
                this.settings.datas = this.settings.tableOptions.data = _datas;
            }
            if (!_fromServer)
                this.$table.bootstrapTable('load', this.settings.datas);
            //var $sinput = $(".search>input", this.$table.parents('.bootstrap-table').first());

            //$sinput.val("");

            this.$table.parent(".fixed-table-body")[0].scrollTop = sctop;
            this.ctrlBtnListen();
        },
        setOptions: function (_options) {
            var _settings = this.settings;
            this.destroy();
            this.settings = _settings;
            this.init(_options);
        },
        destroy: function () {

            if (this.$table)
                this.$table.bootstrapTable('destroy');
            this._editformWindowStyleEnd();
            if (this.$___filterToolbar)
                this.$___filterToolbar.detach().empty();
            
            this.settings = $.extend(true, {}, $.edittableoptions);
            return this.$table;
        },
        editDataForm: function (title, row, trindex, callback) {
            row = row || {}; //20190521
            var rowTemp;//取消還原用
            try {
                if (row)
                    rowTemp = JSON.parse(JSON.stringify(row));// $.extend({}, row);//20221228，用extend如有detail，dtail會是參考同一物件(修改後無法還原)
            } catch (ex) {
            }
            var current = this;
            var _beginCreateEditDataForm = function (_html) {
                //current.settings.editformWindowStyle = $.editformWindowStyle.modal;
                var _confirmAction = function (e) {

                    var rdata = row || {};
                    //將資料組成新資料
                    $.each(current.settings._dataFields, function (idx, f) {
                        //if (idx == current.settings.fields.length - 1) //ctrl 編輯、刪除
                        if (f.visibleEdit === false) {
                            //rdata[f.field] = row[f.field];
                            return;
                        }
                        var $_del = $(".field-container[data-field=" + f.field + "]", current.$___currentEditFormWindow).find(".field-content").children().first();
                        if ($_del.length > 0) {
                            var v = f.editFormtter.getValue.call(f, $_del, rdata);
                            rdata[f.field] = v;
                        }
                    });
                    var errors = [];
                    var firstErrorField;
                    //驗證
                    $.each(current.settings._dataFields, function (idx, f) {
                        if (f.visibleEdit === false)
                            return;
                        var $_del = $(".field-container[data-field=" + f.field + "]", current.$___currentEditFormWindow).find(".field-content").children().first();
                        var oer;
                        if ($_del.length > 0 ) {
                            if (f.validate && (oer = f.validate(rdata[f.field], rdata)) !== true) 
                                errors.push(f.title + ":" + f.validate(rdata[f.field], rdata));
                            else if ($_del[0].validationMessage)
                                errors.push(f.title + ":" + $_del[0].validationMessage);
                            if (errors.length == 1)
                                firstErrorField = firstErrorField ? firstErrorField : this;
                        } 
                    });
                    var $_error = $(".errormsg", current.$___currentEditFormWindow).hide().empty();
                    var __showErrorMessage = function (_emsgs) {
                        if (_emsgs) {
                            _emsgs = $.isArray(_emsgs) ? _emsgs : [_emsgs];
                            current.$___currentEditFormWindow.trigger("set-error-message", '<span class="' + current.settings.buttonClasses.error_message + '" aria-hidden="true"></span>&nbsp; ' + _emsgs.join('<br><span class="' + current.settings.buttonClasses.error_message +'" aria-hidden="true"></span>&nbsp; '));
                        }
                    }
                    if (errors.length > 0) {
                        __showErrorMessage(errors);
                        //focus第一筆
                        var sdd = $(".field-container[data-field=" + firstErrorField.field + "]", current.$___currentEditFormWindow).find(".field-content").children().first();
                        console.log(JSON.stringify(firstErrorField));
                        $(".field-container[data-field=" + firstErrorField.field + "]", current.$___currentEditFormWindow).find(".field-content").children().first().focus();
                        return false;
                    }

                    if (current.settings.afterEditDataConfirm) {
                        if (current.settings.afterEditDataConfirm.length == 2) { //cb後再處理,如無cb就不做認呵處理
                            current.settings.afterEditDataConfirm(rdata, function (msgs) {
                                msgs = !msgs ? [] : ($.isArray(msgs)?msgs:[msgs]);
                                if (msgs.length>0)
                                    __showErrorMessage(msgs);
                                else
                                    callback.call(current.$___currentEditFormWindow, rdata);
                                    
                            });
                        }
                        else {
                            current.settings.afterEditDataConfirm(rdata);
                            callback.call(current.$___currentEditFormWindow, rdata);
                        }
                    }

                    else
                        callback.call(current.$___currentEditFormWindow, rdata);
                };
                var _cancelAction = function (e) {
                    if (current.settings.singleDataEdit && current.settings.singleDataEditCompletedReturnUrl)
                        if (typeof current.settings.singleDataEditCompletedReturnUrl == 'function')
                            current.settings.singleDataEditCompletedReturnUrl(row, false);
                        else
                            location.href = current.settings.singleDataEditCompletedReturnUrl;
                    else {
                        /***********to do editformWindowStyle**************/
                        current._editformWindowStyleEnd();
                        if (row && rowTemp) //取消還原
                            for (var df in row)
                                row[df] = rowTemp[df];
                        if (current.settings.afterEditDataCancel)
                            current.settings.afterEditDataCancel(row);
                    }
                };


                //var $_form = $('</div><div name="form" action="" class="form-horizontal data-edit-form-group">'); //202206013 bt4
                var $_form = $('</div><div name="form" action="" class="form-horizontal data-edit-form-group row">');


                var $_modal = $('<div data-backdrop="' + (current.settings.editformWindowStyle == $.editformWindowStyle.modal) + '" class="modal ' + ($.editformWindowStyle.modal == current.settings.editformWindowStyle ? 'fade' : '') +
                    ' ' + (current.settings.jsPanelClasses || "") + '" tabindex="-1" role="dialog" data-show="true"><div class="modal-dialog " role="document"><div class="modal-content"></div></div></div>').appendTo($(current.settings.rootParentContainer));

                var _size = calcEditFormSize(current.settings.editformSize, $_modal);
                $_modal.find('.modal-dialog').css('min-width', _size.minWidth);
                $_modal.find('.modal-dialog').css('min-height', _size.minHeight);
                if (_size.width != 'auto')
                    $_modal.find('.modal-dialog').css('width', _size.width);//.css('max-width', _size.width).css('width', _size.width);
                if (_size.height == 'fixed')
                    $_modal.find('.modal-content').height(_size.maxHeight);
                if (current.settings.editformWindowClasses)
                    $_modal.find('.modal-dialog').addClass(current.settings.editformWindowClasses);
                var $_content = $_modal.find('.modal-content');
                var $_header = $('<div class="modal-header"><h5 class="modal-title" id="myModalLabel">' + (current.settings.title + "-" + title) + '</h4></div>').appendTo($_content);
                var $_body = $('<div class="modal-body">').appendTo($_content);
                var $_footer = $('<div class="modal-footer">').appendTo($_content);
                var $_confirmbtn = $('<button type="button" class="btn btn-primary "> 確 定 </button>').appendTo($_footer);
                var $_closebtn = $('<button type="button" class="btn btn-default btn-outline-secondary"> 取 消 </button>').appendTo($_footer);
                //data-bs-dismiss是5.0
                //額外加data-bs-dismiss按鈕，不直接將屬性加在取消鈕，方便"確認"及"取消"可一致呼叫關掉modal
                var $_dismissbtn = $('<button type="button" class="btn btn-default  data-dismiss" data-bs-dismiss="modal" data-dismiss="modal" style="display:none"> 取dfd 消 </button>').appendTo($_footer);

                if (_html && _html.indexOf("data-edit-form-group") < 0)
                    _html = $_form.append($(_html))[0].outerHTML;

                $_body.html('<div id="errormsg' + (new Date()).getTime() + '" class="errormsg alert alert-danger" style="display:none"></div>' + (_html ? _html : $_form[0].outerHTML));
                if (current.$___currentEditFormWindow) {
                    current._editformWindowStyleEnd();
                }
                current.$___currentEditFormWindow = $_modal;
                $_modal.on('hidden.bs.modal', function () {
                    //$_modal.remove(); //20210324原不會自動移除
                    //$_dismissbtn.trigger('click');
                    _cancelAction(); //僅在點modal外會觸發，"確認"、"確認"取消不會觸發20230106
                });
                //var _isFromConfirm = false;
                $_confirmbtn.on('click',function () {
                    if (_confirmAction() === false)
                        return;
                });
                $_closebtn.on('click',function () {
                    _cancelAction();
                });
                //editCtrlButtonValign
                if (current.settings.editCtrlButtonValign == 'top') {
                    $_footer.css('position', 'absolute').css('width', '100%').css('order', '0');
                    //$_closebtn.css('border', '1px #bbb solid');
                    $_body.css('order', '1');
                }



                current.$___currentEditFormWindow.addClass("data-edit-jspanel");
                $_form = current.$___currentEditFormWindow.find(".data-edit-form-group");
                $.each(current.settings._dataFields, function (idx, f) {
                    if (f.visibleEdit === false)
                        return;
                    var $_content = undefined;
                    if (_html) {
                        $_content = $_form.find(".field-container[data-field=" + f.field + "] > .field-content");
                        if ($_content.length > 0)
                            f.editFormtter.editContent.call(f, $_content, row);
                        if ($_content.children().length > 1) {
                            if ($_content.children('input[list]').length==0)
                                alert(this.name + " editContent內文第一層只能含一個dom");
                        }
                        //if (row && row[f.field] != undefined && $_content.length > 0) //20231129
                        if (row  && $_content.length > 0) //20210319 >> 20231129
                            f.editFormtter.setValue.call(f, $_content.children().first(), row[f.field], row);
                    }
                    else {
                        
                        var lw = current.settings.editformLabelWidth == 0 ? 12 : current.settings.editformLabelWidth;
                        douHelper.createDataEditContent($_form, f, row, lw);
                        //var cw = lw == 0 || lw == 12 ? 12 : 12 - lw;
                        ////form-group>> bootstrap<=4, mb-3>>bootstrap >=4
                        //var $_formgroup = $('<div  class="form-group field-container row" data-field="' + f.field + '"><label class="col-sm-' + lw + ' control-label">' + f.title + '</label></div>').appendTo($_form);
                        //$_content = $('<div class="field-content col-sm-' + cw + '"></div>').appendTo($_formgroup);
                        //f.editFormtter.editContent.call(f, $_content, row);
                    }
                    
                });

                $(".jsPanel-hdr-r-btn-close .glyphicon-remove", current.$___currentEditFormWindow).hide();

                current.$___currentEditFormWindow.on("set-error-message", function (evt, msg) {
                    var _id = $(".errormsg", current.$___currentEditFormWindow).html(msg).show().attr('id');
                    document.location = '#' + _id;
                });
                if (current.settings.afterCreateEditDataForm)
                    current.settings.afterCreateEditDataForm.call(current, current.$___currentEditFormWindow, row);


                /***********to do editformWindowStyle**************/
                current._editformWindowStyleStart(row, trindex);

                setTimeout(function () {
                    current.$___currentEditFormWindow.find(".data-edit-form-group input:enabled").first().focus();
                }, 501);//如modal 設 fade會有時間差問題
            }
            if (current.settings.editformLayoutUrl) {
                helper.misc.showBusyIndicator();
                $.get(current.settings.editformLayoutUrl, function (_html) {
                    helper.misc.hideBusyIndicator();
                    if (current.settings.beforeCreateEditDataForm)
                        current.settings.beforeCreateEditDataForm.call(current, row, jQuery.proxy(function () { _beginCreateEditDataForm(_html); }, current));
                    else
                        _beginCreateEditDataForm(_html);
                });
            }
            else {
                if (current.settings.beforeCreateEditDataForm)
                    current.settings.beforeCreateEditDataForm(row, jQuery.proxy(function () { _beginCreateEditDataForm(); }, current));
                else
                    _beginCreateEditDataForm();
            }

        },
        _editformWindowStyleStart: function (row, trindex) {
            var current = this;
            this.$___currentEditFormWindow.show(); //因此時modal還沒實體modal
            this.$___currentEditFormWindow.addClass('window-style-' + this.settings.editformWindowStyle);
            //this.$___currentEditFormWindow.trindex = rowindex; //detailstyle 為關掉detail用
            if ($.editformWindowStyle.detail === this.settings.editformWindowStyle) {

                this.$___currentEditFormWindow.trindex = trindex;
                var _ridx = this.$___currentEditFormWindow.trindex;
                current.$___currentEditFormWindow.css('position', 'initial').find('>.modal-dialog').css('margin', '0');
                this.$table.find('.detail-icon').addClass('disabled');
                if (_ridx == undefined) { //新增
                    current.$___currentEditFormWindow.addClass('window-style-detail-add'); //為了style
                    current.$___currentEditFormWindow.insertAfter(this.$table.closest('.fixed-table-container'));//放置table下方
                }
                else {
                    this.$table.find('tr[data-index="' + trindex + '"]').addClass('window-style-detai-edit-tr');
                    this.$table.bootstrapTable('collapseRow', _ridx); //先關後開，避免settings detailView=true且該row已打開
                    this.$table.bootstrapTable('expandRow', _ridx, function (r, rr) {
                        return current.$___currentEditFormWindow; //將編輯內容變detail的內文
                    });
                }

                $('body .modal-backdrop.show').hide();
            }
            if ($.editformWindowStyle.showEditformOnly === this.settings.editformWindowStyle) {
                this.$___bootstraptable.hide(); //隱藏清單
                var $_mt = this.$table.closest('.body-content');

                //this.$___currentEditFormWindow.insertBefore(this.$table.parents('.bootstrap-table').first()).css("position", "static").css("width", "auto").css("height", "auto").
                this.$___currentEditFormWindow.insertBefore(this.$table.closest('.bootstrap-table')).css("position", "static").css("width", "auto").css("height", "auto").
                    css("min-width", "").css("min-height", "").css("max-height", "").find('.modal-content').css("height", "auto");//處理編輯視窗style
                $('body .modal-backdrop.show').hide();
            }
            if ($.editformWindowStyle.bottom === this.settings.editformWindowStyle) {
                //this.$___currentEditFormWindow.appendTo(this.$rootParentContainer).css("position", "static").css("width", "").css("height", "").
                //    css("min-width", "").css("max-height", "").css("min-height", "");//處理編輯視窗style
                this.$___currentEditFormWindow.appendTo(this.$___bootstraptable.parent()).css("position", "static").css("width", "").css("height", "").css("margin-top", "1rem")
                    .find('.modal-dialog').css('margin', '0');
                //    css("min-width", "").css("max-height", "").css("min-height", "");//處理編輯視窗style
                $("body").animate({
                    scrollTop: $("body")[0].scrollTop + this.$___currentEditFormWindow.offset().top
                }, 1200);
            }
            if ($.editformWindowStyle.right === this.settings.editformWindowStyle) {
                this.$___bootstraptable.find('.fixed-table-container').addClass('edit-style-w-50');
                this.$___currentEditFormWindow.addClass("edit-style-w-50").css("position", "static")
                    .insertAfter(this.$___bootstraptable.find('.fixed-table-container'))
                    .find('.modal-dialog').css('margin', '0')
                    .find('.modal-content > .modal-header').css('height', '0').css('background', 'none');

            }
            if ($.editformWindowStyle.modal == this.settings.editformWindowStyle) {
                this.$___currentEditFormWindow.modal('show');
            }
            $('body').addClass('dou-edit-open').addClass('dou-edit-style-' + this.settings.editformWindowStyle);
        },
        _editformWindowStyleEnd: function () {//rowindex==undefined代表新增
            if (this.$___currentEditFormWindow == undefined)
                return;
            var that = this;

            if ($.editformWindowStyle.detail === this.settings.editformWindowStyle) {
                var _ridx = this.$___currentEditFormWindow.trindex;
                this.$table.find('.detail-icon').removeClass('disabled');
                
                if (_ridx != undefined) {
                    this.$table.find('tr[data-index="' + _ridx + '"]').removeClass('window-style-detai-edit-tr');
                    this.$table.bootstrapTable('collapseRow', _ridx);
                }
            }
            if ($.editformWindowStyle.showEditformOnly === this.settings.editformWindowStyle)
                this.$___bootstraptable.show();
            if ($.editformWindowStyle.right === this.settings.editformWindowStyle) {
                this.$___bootstraptable.find('.fixed-table-container').removeClass('edit-style-w-50')
            }
            if (this.$___currentEditFormWindow) {
                this.$___currentEditFormWindow[0].isFromConfirm = true;
                if ($.editformWindowStyle.modal === this.settings.editformWindowStyle) {
                    var _disbtn = this.$___currentEditFormWindow.find('.data-dismiss');//.length;
                    if(_disbtn.length>0)
                        _disbtn.trigger("click"); //讓modal自行close
                }
                //else
                    this.$___currentEditFormWindow.remove();
            }

            this.$___currentEditFormWindow = undefined;
            $('body').removeClass('dou-edit-open').removeClass('dou-edit-style-' + this.settings.editformWindowStyle)
        },
        ___filter: function () {
            var _fielter = [];
            var current = this;
            $.each(this.$___filterToolbar.find("[data-fn]"), function () {
                var _fn = $(this).attr("data-fn");
                var _filed = current.___getFiled(_fn);
                _fielter.push({ key: _fn, value: _filed.editFormtter.getValue.call(_filed, $(this)) });
            });
            if (this.settings.queryFilter)
            //if (this.settings.tableOptions.url)
            {
                this.settings.queryFilter(_fielter, function (_result) {
                    if (_result !== undefined && $.isArray(_result)) {
                        current.tableReload(_result);
                        current.ctrlBtnListen();
                    }
                    else
                        current.$table.bootstrapTable("refresh", { filterColumns: _fielter }); //透過this.settings.tableOptions.url自動查詢
                });
            }
            else
                this.$table.bootstrapTable("refresh", { filterColumns: _fielter }); //透過this.settings.tableOptions.url自動查詢

        },
        __initFilter: function (_fileld) {
            if (!this.$___filterToolbar)
                this.$___filterToolbar = $('<div class="filter-toolbar-plus"><div class="form-inline row"></div></div>').appendTo(this.$rootParentContainer);
            var $_fg = $('<div class="form-group filter-continer col-auto">').appendTo(this.$___filterToolbar.find(">.form-inline")); //col-auto用在bt5，但還有些須修正
            //var $_fg = $('<div class="form-group">').appendTo(this.$___filterToolbar.find(">.form-inline"));
            //sr-only 4.0 visually-hidden5.0
            $('<label class="sr-only visually-hidden">' + _fileld.title + '</label>').appendTo($_fg);
            _fileld.editFormtter.editContent.call(_fileld, $_fg, undefined, true);
            $_fg.find('[data-fn]').attr('placeholder', _fileld.title);
            var $_e = $_fg.find('[data-fn]').find("input, select").attr('placeholder', _fileld.title);
            if (_fileld.datatype == 'datetime' || _fileld.datatype == 'date' ) {
                $_e.on('mouseenter', function () {
                    if (!_fileld.useInputType)
                        $(this).attr('placeholder', _fileld.editParameter && _fileld.editParameter.format ? _fileld.editParameter.format :
                            (_fileld.datatype == 'datetime' ? 'YYYY/MM/DD h:m:s' : 'YYYY/MM/DD'));
                });
                $_e.on('mouseleave', function () {
                    $(this).attr('placeholder', _fileld.title);
                });
            }
        }
    }
    var calcEditFormSize = function (osize, $_modal) {
        var inh = window.innerHeight;
        var inw = window.innerWidth;
        var m_margintop = $_modal.find('.modal-dialog').css('margin-top').replace('px', '');
        m_margintop = m_margintop ? m_margintop : 30;
        //var m_margis = $_modal.find('.modal-dialog').offset();
        var _size = $.extend({}, osize);
        if (_size.minHeigth && _size.minHeigth > inh - m_margintop * 2)
            _size.minHeigth = inh - m_margintop * 2;
        if (_size.minWidth && _size.minWidth > inw - 40)
            _size.minWidth = inw - 40;


        if (_size.maxHeight && _size.maxHeight > inh - 40)
            _size.maxHeight = inh - 40;
        if (_size.maxWidth && _size.maxWidth > inw - 40)
            _size.maxWidth = inw - 40;
        if (!_size.maxHeight)
            _size.maxHeight = inh - m_margintop * 2 - 6;

        if (_size.maxHeight < _size.minHeight)
            _size.minHeight = _size.maxHeight;

        return _size;
    }
    $.fn[pluginName] = function (arg) {
        var sss;
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

        } else if (typeof arg === 'string' && instance.$table && instance.$table.bootstrapTable.methods.indexOf(arg)>=0) { //直接呼叫bootstrapTable method

            args = Array.prototype.slice.call(arguments, 1);

            return instance.$table.bootstrapTable(arg, args.length==1?args[0]:args);
            //return instance.$table.bootstrapTable.call(instance.$table,arg, args);

        } else {

            $.error('Method ' + arg + ' does not exist on jQuery.' + pluginName);

        }
    };

    $.fn['DouTable'] = $.fn[pluginName];
    $.fn['douTable'] = $.fn[pluginName];
    window.douHelper = window.douHelper || {};
    //依指定欄位(field)，取欄位物件
    window.douHelper.getField = function (fields, fn, attrs) {
        var fns = [];
        var _f = function (_fd) {
            if ($.isArray(_fd)) { //多層表頭
                $.each(_fd, function () {
                    _f(this);
                });
            }
            else if (_fd.field == fn)
                fns.push(_fd);
        }
        $.each(fields, function () {
            _f(this);
        })
        var _r = fns.length > 0 ? fns[0] : undefined;
        $.extend(_r, attrs);
        return _r;
    }
    //產單一欄位Dom
    window.douHelper.createDataEditContent = function ($_container, f, data, labelWidth) {
        var lw = labelWidth || 12;
        var cw = lw == 0 || lw == 12 ? 12 : 12 - lw;

        var colclasstemp = 'col-' + (f.coltier || 'md') + '-';

        if (f.colBreakBefore)
            $('<div class="' + colclasstemp + '-12 data-field-break" data-field-before-break="' + f.field + '" data-field-title="' + (f.colBreakBeforeTitle || '')+'"></div>').appendTo($_container);

        var colclass = colclasstemp + f.colsize || 12;
        var $_formgroup = $('<div  class="form-group field-container '+colclass+'" data-field="' + f.field + '"><label class="col-sm-' + lw + ' control-label">' + f.title + '</label></div>').appendTo($_container);
        var $_content = $('<div class="field-content col-sm-' + cw + '"></div>').appendTo($_formgroup);
        f.editFormtter.editContent.call(f, $_content, data);
        if (data && data[f.field] != undefined && $_content.length > 0)
            f.editFormtter.setValue.call(f, $_content.children().first(), data[f.field], data);

        if (f.colBreakAfter)
            $('<div class="' + colclasstemp + '-12" data-field-after-break="' + f.field + '" data-field-title="' + (f.colBreakAfterTitle || '') + '"></div>').appendTo($_container);
    }
    //取單一欄位Dom值
    window.douHelper.getDataEditContentValue = function ($_container, f) {
        var $_del = $(".field-container[data-field=" + f.field + "]", $_container).find(".field-content").children().first();
        var v = undefined;
        if ($_del.length > 0) {
            v = f.editFormtter.getValue.call(f, $_del);
        }
        return v;
    }
    //設定欄位預設屬性
    window.douHelper.setFieldsDefaultAttribute = function (fields) {
        $.each(fields, function () {
            if (!this.editFormtter) {
                if (this.datatype === "boolean")
                    $.extend(this, { editFormtter: $.edittable_defaultEdit.boolean });
                else if (this.datatype === "number")
                    $.extend(this, { editFormtter: $.edittable_defaultEdit.number });
                else if (this.datatype === "datetime")
                    $.extend(this, { editFormtter: $.edittable_defaultEdit.datetime });
                else if (this.datatype === "date")
                    $.extend(this, { editFormtter: $.edittable_defaultEdit.date });
                else if (this.datatype === "textarea")
                    $.extend(this, { editFormtter: $.edittable_defaultEdit.textarea });
                else if (this.datatype === "image")
                    $.extend(this, { editFormtter: $.edittable_defaultEdit.image });
                else if (this.datatype === "textlist")
                    $.extend(this, { editFormtter: $.edittable_defaultEdit.textlist });
                else if (this.datatype === "select")
                    $.extend(this, { editFormtter: $.edittable_defaultEdit.select });
                else if (this.datatype === "radio")
                    $.extend(this, { editFormtter: $.edittable_defaultEdit.radio });
                else if (this.datatype === "password")
                    $.extend(this, { editFormtter: $.edittable_defaultEdit.password });
                else if (this.datatype === "email")
                    $.extend(this, { editFormtter: $.edittable_defaultEdit.email });
                else
                    $.extend(this, { editFormtter: $.edittable_defaultEdit.default });
            }
            if ((this.datatype === "select" || this.datatype === "radio" || this.datatype === "textlist") && this.selectitems) {
                if ( typeof (this.selectitems) === "string")
                    this.selectitems = JSON.parse(this.selectitems);
                for (var k in this.selectitems) {
                    var tv = this.selectitems[k];
                    if (typeof tv !== "object") {//值轉乘object
                        if (typeof tv == "string") {
                            tv = tv.trim();
                            if (tv.startsWith('{') && tv.endsWith('}'))
                                this.selectitems[k] = JSON.parse(tv);
                            else
                                this.selectitems[k] = { v: tv };
                        }
                        else
                            this.selectitems[k] = { v: tv };
                    }
                    
                    var vs = [this.selectitems[k].v];
                    if (typeof this.selectitems[k].v === "string")
                        vs = this.selectitems[k].v.split(/@@/g); //v值有可能含sort
                    this.selectitems[k].k = k;
                    this.selectitems[k].v = vs[0];
                    this.selectitems[k].s = this.selectitems[k].s == undefined ? vs[1] || 99 : this.selectitems[k].s;
                }
                var sd = "";
            }
            if ((this.datatype === "select" || this.datatype === "radio" || this.datatype === "textlist") && this.selectitems && !this.listFormatter) {
                this.listFormatter = function (v, row) {
                    return getSelectItemDisplay(v, row, this.selectitems);
                }
            }
            if (!this.formatter && this.listFormatter)
                this.formatter = this.listFormatter;
            if (this.datatype === "number") {
                var orgnumbervalidate = this.validate;
                this.validate = function (v, row) {
                    if (v) {
                        if (orgnumbervalidate !== undefined) {
                            var _r = orgnumbervalidate(v, row);
                            if (_r !== true)
                                return _r;
                        }

                        var _test = !(/[^0-9\.-]/g.test(v) || ((/-/g.test(v) && !/^-/g.test(v))));

                        return _test ? true : "格式有問題";
                    } return true;
                }
            }
            if (this.datatype === "datetime" && !this.formatter) {
                this.formatter = function (v, row) {
                    return v ? helper.format.JsonDateStr2Datetime(v).DateFormat("yyyy/MM/dd HH:mm:ss") : "---";
                };
            }
            if (this.datatype === "date" && !this.formatter) {
                this.formatter = function (v, row) {
                    try {
                        return v ? helper.format.JsonDateStr2Datetime(v).DateFormat("yyyy/MM/dd") : "---";
                    } catch (e) {
                        return v;
                    }
                };
            }
            if (this.datatype === "image" && !this.formatter) {
                this.formatter = function (v, row) {
                    return v?'<img src="' + v + '" class="dou-data-image">':'-';
                };
            }
            if (this.datatype === "email") {
                if (!this.validate) {
                    this.validate = function (v, row) {
                        if (v) {
                            var filter = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
                            return filter.test(v) ? true : "email格式有問題";
                        } return true;
                    }
                }
            }
            if ((this.key || this.allowNull === false)) {
                var othervalidate = this.validate;
                this.validate = function (v, row) {
                    if (othervalidate !== undefined && v) {
                        var _r = othervalidate(v, row);
                        if (_r !== true)
                            return _r;
                    }
                    return v ? true : "不能空值";
                }
            }
        });
    }
})(jQuery);

!function ($) {  /******* for filter*********/
    'use strict';

    if (!$.fn.bootstrapTable) {
        alert("尚未載入$.fn.bootstrapTable");
    }
    var BootstrapTable = $.fn.bootstrapTable.Constructor,
        _refresh = BootstrapTable.prototype.refresh,
        _resetView = BootstrapTable.prototype.resetView;

    BootstrapTable.prototype.refresh = function (params) {
        this.filterColumnsPartial = params && params.filterColumns;
        _refresh.apply(this, Array.prototype.slice.apply(arguments));
    }
    BootstrapTable.prototype.resetView = function (params) {
        //if (params && params.options) {
        if (this.options.cardView)
            this.$el.addClass('card-view-table');
        else
            this.$el.removeClass('card-view-table');
        //}
        _resetView.apply(this, Array.prototype.slice.apply(arguments));
    }
    var dsasd = $.fn.bootstrapTable;
    $.fn.bootstrapTable.Constructor.DEFAULTS.iconsPrefix = "glyphicon";
    $.fn.bootstrapTable.Constructor.DEFAULTS.icons = {
        paginationSwitchDown: 'glyphicon-collapse-down icon-chevron-down',
        paginationSwitchUp: 'glyphicon-collapse-up icon-chevron-up',
        refresh: 'glyphicon-refresh icon-refresh',
        toggleOff: 'glyphicon-list-alt icon-list-alt',
        toggleOn: 'glyphicon-list-alt icon-list-alt',
        columns: 'glyphicon-th icon-th',
        detailOpen: 'glyphicon-plus icon-plus',
        detailClose: 'glyphicon-minus icon-minus',
        fullscreen: 'glyphicon-fullscreen',
        search: 'glyphicon-search',
        clearSearch: 'glyphicon-trash'
    }
    //Constants.CONSTANTS = CONSTANTS["3"]; //bt3 引用就ICON
    //$.fn.bootstrapTable.Constructor.DEFAULTS.icons.detailOpen = 'glyphicon glyphicon-eye-open icon-plus';
    //$.fn.bootstrapTable.Constructor.DEFAULTS.icons.detailClose = 'glyphicon glyphicon-eye-close icon-minus';
}(jQuery);

