$(document).ready(function () {

    douoptions.editformWindowStyle = $.editformWindowStyle.modal;
    douoptions.ctrlFieldAlign = "left";

    //douoptions.viewable = true;
    douoptions.appendCustomFuncs = [
        {
            item: '<span style="background-color:rgba(255,255,255,0);" class="ms-1 btn  btn-default btn-sm btn-sixboxss  glyphicon glyphicon-eye-open" title="截圖"></span>',
            event: 'click .btn-sixboxss',
            callback: function (e, value, row, index) {
                var $_m = helper.jspanel.jspAlertMsg(undefined, {
                    title: '<a href="' + row.url + '" target="' + row.stationNameExt + '" title="另開視窗">' + row.stationName + '(' + helper.format.JsonDateStr2Datetime(row.fileDate).DateFormat('yyyy/MM/dd HH:mm') + ')</a>',
                    content: '<img src="' + row.url + '" style="width:100%;"></img>', autoclose: 9999999,
                    classes: 'modal-xl sixboxss'
                }).addClass('modal-sixboxss');
                //setTimeout(function () {
                //    $_m.parent();
                //}, 1000);
            }
        }
    ]
    douHelper.getField(douoptions.fields, "stationName", { visible: false });
    douHelper.getField(douoptions.fields, "url", { visible: false });
    douHelper.getField(douoptions.fields, "uuid", { align: 'center' });

    var $_currenttable = $("#_table");
    $_currenttable.DouEditableTable(douoptions); //初始dou table

    var bytime = '依時間';
    var byevent = '依事件';
    var $_tt = $('<div class="form-group filter-continer col-auto time-type-ctrl-container">' +
        //'<label class="form-check-label">' + bytime + '</label>' +
        '<div class="form-check form-switch"><input class="form-check-input time-type-ctrl" type="checkbox" disabled></div>' +
        //'<label class="form-check-label">' + byevent + '</label>' +
        '</div>').prependTo($('.filter-toolbar-plus > div'));

    datahelper.loadWraEvents(function (events) {
        //helper.misc.hideBusyIndicator($floodquerytimertypegroup);
       
        var $_fc = $('<div class="form-group filter-continer col-auto event-ctrl-container"></div>').insertAfter($_tt);

        //$('<label><input type="radio" name="dtype" value="' + bytime + '" checked>' + bytime + ' </label>').appendTo($_fc);
        //$('<label><input type="radio" name="dtype" value="' + byevent +'">' + byevent+' </label>').appendTo($_fc);
        var $eventYearSelect = $('<select class="form-control"></select>').appendTo($_fc);
        var $eventSelect = $('<select class="form-control"></select>').appendTo($_fc);

        var $_sdtc = $('div[data-fn="fileDate-Start-Between_"]');
        var $_edtc = $('div[data-fn="fileDate-End-Between_"]');
        $_tt.find('input').attr('disabled', false).on('change', function () {
            if (!$(this).is(':checked')) {// }  $(this).val() == bytime) {
                $_fc.find('select').hide();
                $_sdtc.show();
                $_edtc.show();
                $_sdtc.find('input').attr('value', '');
                $_edtc.find('input').attr('value', '');
            }
            else {
                $_fc.find('select').show();
                $_sdtc.hide();
                $_edtc.hide();
                var _sp = $eventSelect.find('>option:selected');
                $_sdtc.find('input').attr('value', _sp[0].BeginDate.DateFormat("yyyy-MM-ddTHH:mm:ss"));
                $_edtc.find('input').attr('value', _sp[0].EndDate.DateFormat("yyyy-MM-ddTHH:mm:ss"));

            }
        });
        //$_fc.find('input:checked').trigger('click');
        //setTimeout(function () {
        $_tt.find('input').trigger('change');
        //}, 100);
        events.sort(function (_a, _b) { return JsonDateStr2Datetime(_b.BeginDate).getTime() - JsonDateStr2Datetime(_a.BeginDate).getTime(); })
        var _changeEventYear = function (_y) {
            $eventSelect.empty();
            $.each(events, function () {
                if (!this)
                    return;
                if (JsonDateStr2Datetime(this.BeginDate).getFullYear() == _y) {
                    var $_p = $('<option value="' + this.EventNo + '">' + this.EventName + '</option>').appendTo($eventSelect);
                    $_p[0].BeginDate = JsonDateStr2Datetime(this.BeginDate);
                    $_p[0].EndDate = JsonDateStr2Datetime(this.EndDate);
                }
            });
        };

        var evyears = [];
        $.each(events, function () {
            var _by = JsonDateStr2Datetime(this.BeginDate);
            if (evyears.indexOf(_by.getFullYear()) < 0) {
                evyears.push(_by.getFullYear());
            }
        });

        for (var _yidx = 0; _yidx < evyears.length; _yidx++) {
            $('<option value="' + evyears[_yidx] + '">' + evyears[_yidx] + '</option>').appendTo($eventYearSelect);
        }
        $eventYearSelect.on('change', function () {
            _changeEventYear($eventYearSelect.val());
            $eventSelect.trigger('change');
        });
        $eventSelect.on('change', function () {
            //$_fc.find('input:checked').trigger('click');
            if ($_tt.find('input').is(':checked'))
                $_tt.find('input').trigger('change');
        });
        _changeEventYear(evyears[0]);
    });
});