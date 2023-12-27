var LTyph = function (ctrl, inicallback, color) {
    this.mainctrl = ctrl;
    this.map = ctrl.map;
    this.currentOpacity = 0.9;

    this.tracePoints = [];
    this.line = undefined, this.pline = undefined;
    this._currentRadius7 = undefined, this._currentRadius10 = undefined, this._currentCenter = undefined;
    this.color = color || "#FF0000";
    this.isShowLayer = true;
    if (inicallback)
        setTimeout(function () { inicallback(); });

    return this;
};

LTyph.prototype.show = function () {
    this.isShowLayer = true;
    //console.log('isShowLayer = true');
    this.showTrace();
    this.showRadius();
};
LTyph.prototype.hide = function () {
    this.isShowLayer = false;
    //console.log('isShowLayer = false');
    this.clearTrace();
    this.clearRadius();
};


LTyph.prototype.paintTyphTrace = function (_warns) {
    var current = this;
    this.clearTrace();
    this.tracePoints = [];
    if (!_warns)
        return;
    var lpath = [];
    var plpath = [];

    $.each(_warns, function (idx, item) {
        if (!item)
            return;
        var p = L.circleMarker([item.Lat, item.Long], { className: 'typh-point', radius: 4, color: current.color, fill: true, fillColor: current.color, fillOpacity:1 });
        p.warn = item;
        current.tracePoints.push(p);
        lpath.push([item.Lat, item.Long]);

        if (0 === idx) {
            plpath.push([item.Lat, item.Long]);
            $.each(item.PredDatas, function (pidx, pitem) {
                var pp = L.circleMarker([pitem.Lat, pitem.Long], { className: 'typh-point', radius: 4,  color: current.color,fill:false });
                pp.warn = pitem;
                current.tracePoints.push(pp);

                plpath.push([pitem.Lat, pitem.Long]);
            });
        }
    });

    //路徑
    this.line = L.polyline(lpath, { color: current.color, weight: 2, className: 'typh-cursor-default' });
    //預報路徑
    this.pline = L.polyline(plpath, { color: '#555555', weight: 2, dashArray: '4 4', className: 'typh-cursor-default' });
    this.showTrace();
};

LTyph.prototype.paintTyphRadius = function (_warn) {

    this.clearRadius();
    this._currentCenter = undefined;
    this._currentRadius7 = undefined;
    this._currentRadius10 = undefined;
    if (!_warn) {
        return;
    }
    var _center = [_warn.Lat, _warn.Long];
    var radiusOptions = {
        color: this.color, weight: 1, opacity: 0.6,
        fillColor: this.color, fillOpacity: 0.2, className:'typh-cursor-default'
    };


    //.
    if (_warn.Radius7 && _warn.Radius7 >0) {
        radiusOptions.radius = _warn.Radius7 * 1000;
        this._currentRadius7 = L.circle(_center, radiusOptions);// new google.maps.Circle(radiusOptions);
    }
    if (_warn.Radius10 && _warn.Radius10 > 0) {
        radiusOptions.radius = _warn.Radius10 * 1000;
        this._currentRadius10 = L.circle(_center, radiusOptions); //new google.maps.Circle(radiusOptions);
    }
    //中心點
    var _labeltxt = (_warn.Organization && _warn.Organization == 'CWB' ? '' : _warn.Organization + '\n') + JsonDateStr2Datetime(_warn.DateTime).DateFormat('MM/dd HH');
    this._currentCenter = L.circleMarker(_center, { className: 'typh-cursor-default', radius: 6, color: this.color, fill: this.color, title: _labeltxt });
    this.showRadius();
};

LTyph.prototype.showTrace = function () {
    if (!this.isShowLayer)
        return;
    var current = this;
    var _map = this.map;
    $.each(this.tracePoints, function () {
        this.addTo(_map);
        if (!this.hasEvent) {
            var _marker = this;
            var _labeltxt = (_marker.warn.Organization && _marker.warn.Organization == 'CWB' ? '' : _marker.warn.Organization + '\n') + JsonDateStr2Datetime(_marker.warn.DateTime).DateFormat('MM/dd HH');
            _marker.on('click', function () {
                if (current.mainctrl.changeWarntime)
                    current.mainctrl.changeWarntime(this.warn);
            });
            _marker.on('mouseover', function () {// google.maps.event.addListener(this, 'mouseover', function () {
                if (current.mainctrl.mouseoverWarnPoint)
                    current.mainctrl.mouseoverWarnPoint(this.warn, current);
                _marker.bindTooltip(_labeltxt, { direction: 'top', offset:[0,-5]}).openTooltip();
            });
            _marker.on('mouseout', function () {// google.maps.event.addListener(this, 'mouseout', function () {
                if (current.mainctrl.mouseoutWarnPoint)
                    current.mainctrl.mouseoutWarnPoint(this.warn, current);
                _marker.closeTooltip();
            });
            this.hasEvent = true;
        }
    });
    if (this.line) {
        this.line.addTo(_map);
        this.line.bringToBack();
    }
    if (this.pline) {
        this.pline.addTo(_map);
        this.pline.bringToBack();
    }

};
LTyph.prototype.clearTrace = function () {
    $.each(this.tracePoints, function () {
        this.remove();
    });
    if (this.line)
        this.line.remove();
    if (this.pline)
        this.pline.remove();
};
LTyph.prototype.showRadius = function () {
    if (!this.isShowLayer)
        return;
    if (this._currentCenter) {
        this._currentCenter.addTo(this.map);
        this._currentCenter.bindTooltip(this._currentCenter.options.title, {}).openTooltip();
        this._currentCenter.bringToBack();
    }
    if (this._currentRadius7) {
        this._currentRadius7.addTo(this.map);
        this._currentRadius7.bringToBack();
    }
    if (this._currentRadius10) {
        this._currentRadius10.addTo(this.map);
        this._currentRadius10.bringToBack();
    }
};
LTyph.prototype.clearRadius = function () {
    if (this._currentCenter)
        this._currentCenter.remove();
    if (this._currentRadius7)
        this._currentRadius7.remove();
    if (this._currentRadius10)
        this._currentRadius10.remove();
};