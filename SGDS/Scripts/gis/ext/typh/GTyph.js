var GTyph = function (ctrl, inicallback, color) {
    this.mainctrl = ctrl;
    this.map = ctrl.map;
    this.currentOpacity = 0.9;

    this.tracePoints = [];
    this.line = undefined, this.pline = undefined;
    this._currentRadius7 = undefined, this._currentRadius10 = undefined, this._currentCenter = undefined;
    this.color = color || "#FF0000";
    this.isShowLayer = true;
    if(inicallback)
        setTimeout(function () { inicallback(); });

    return this;
};

GTyph.prototype.show = function () {
    this.isShowLayer = true;
    console.log('isShowLayer = true');
    this.showTrace();
    this.showRadius();
};
GTyph.prototype.hide = function () {
    this.isShowLayer = false;
    console.log('isShowLayer = false');
    this.clearTrace();
    this.clearRadius();
};


GTyph.prototype.paintTyphTrace = function (_warns) {
    var current = this;
    this.clearTrace();
    this.tracePoints = [];
    if (!_warns)
        return;
    var pOptions = {
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: current.color,
            strokeColor: current.color,
            scale: 2,
            strokeWeight: 6,
            labelOrigin: new google.maps.Point(18, 0)
        },
    };
    var ppOptions = {
        //position: _center,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: current.color,
            strokeColor: current.color,
            scale: 4,
            strokeWeight:3,
            labelOrigin: new google.maps.Point(9, 0)
        },
    };
    
    var lpath = [];
    var plpath = [];

    $.each(_warns, function (idx, item) {
        if (!item)
            return;
        pOptions.position = new google.maps.LatLng(item.Lat, item.Long);
        var p = new google.maps.Marker(pOptions);
        p.warn = item;
        current.tracePoints.push(p);
        lpath.push(new google.maps.LatLng(item.Lat, item.Long));

        if (0 === idx) {
            plpath.push(new google.maps.LatLng(item.Lat, item.Long));
            $.each(item.PredDatas, function (pidx, pitem) {
               
                ppOptions.position = new google.maps.LatLng(pitem.Lat, pitem.Long);
                var pp = new google.maps.Marker(ppOptions);
                pp.warn = pitem;
                current.tracePoints.push(pp);

                plpath.push(new google.maps.LatLng(pitem.Lat, pitem.Long));
            });
        }
    });
    
    //路徑
    this.line = new google.maps.Polyline({
        path: lpath,
        strokeColor: current.color,
        strokeOpacity: 1.0,
        strokeWeight: 2,
        cursor: "default"
    });
    //預報路徑
    this.pline = new google.maps.Polyline({
        path: plpath,
        strokeColor: '#555555',
        strokeOpacity: 1.0,
        strokeWeight: 0,
        icons: [{
            icon: {
                path: 'M 0,-1 0,1',
                strokeOpacity: 1,
                scale: 2
            },
            offset: '0',
            repeat: '10px'
        }],
        cursor: "default"
    });
    this.showTrace();
};

GTyph.prototype.paintTyphRadius = function (_warn) {
   
    this.clearRadius();
    if (!_warn) {
        this._currentCenter = undefined;
        this._currentRadius7 = undefined;
        this._currentRadius10 = undefined;
        return;
    }
    var _center = new google.maps.LatLng(_warn.Lat, _warn.Long);
    var radiusOptions = {
        strokeColor: this.color,
        strokeOpacity: 0.6,
        strokeWeight: 1,
        fillColor: this.color,
        fillOpacity: 0.2,
        center: _center,
        cursor:"default"
    };

    
    //.
    if (_warn.Radius7) {
        radiusOptions.radius = _warn.Radius7 * 1000;
        this._currentRadius7 = new google.maps.Circle(radiusOptions);
    }
    if (_warn.Radius10) {
        radiusOptions.radius = _warn.Radius10 * 1000;
        this._currentRadius10 = new google.maps.Circle(radiusOptions);
    }
    //中心點
    var _labeltxt = (_warn.Organization && _warn.Organization == 'CWB' ? '' : _warn.Organization + '\n') + JsonDateStr2Datetime(_warn.DateTime).DateFormat('MM/dd HH');
    this._currentCenter = new google.maps.Marker({
        position: _center,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: this.color,
            strokeColor: this.color,
            strokeOpacity: 0.5,
            scale: 2*3/2,
            strokeWeight: 6 * 3 / 2,
            labelOrigin: new google.maps.Point(13, 0)
        },
        label: _labeltxt,
        cursor: "default"
    });
    this.showRadius();
};

GTyph.prototype.showTrace = function () {
    if (!this.isShowLayer)
        return;
    var current = this;
    var _map = this.map;
    $.each(this.tracePoints, function () {
        this.setMap(_map);
        if (!this.hasEvent) {
            var _marker = this;
            _marker.defalueIcon = _marker.getIcon();
            _marker.focusIcon = JSON.parse( JSON.stringify(  _marker.defalueIcon));
            _marker.focusIcon.scale = _marker.focusIcon.scale * 3 / 2;
            _marker.focusIcon.strokeWeight = _marker.focusIcon.strokeWeight * 3 / 2;
            _marker.focusIcon.labelOrigin = new google.maps.Point(_marker.defalueIcon.labelOrigin.x*2/3, 0);

            var _labeltxt = (_marker.warn.Organization && _marker.warn.Organization == 'CWB' ? '' : _marker.warn.Organization + '\n') + JsonDateStr2Datetime(_marker.warn.DateTime).DateFormat('MM/dd HH');
            _marker.focusIcon.labelOrigin.x += (_labeltxt.length - 8);//* 2;
            google.maps.event.addListener(this, 'click', function () { //加入mouseover、mouseout IE會變double click才會觸發click ???
                if (current.mainctrl.changeWarntime)
                    current.mainctrl.changeWarntime(this.warn);
            });
            google.maps.event.addListener(this, 'mouseover', function () {
                if (current.mainctrl.mouseoverWarnPoint)
                    current.mainctrl.mouseoverWarnPoint(this.warn, current);
                _marker.setOptions({ icon: _marker.focusIcon, label: _labeltxt});
            });
            google.maps.event.addListener(this, 'mouseout', function () {
                if (current.mainctrl.mouseoutWarnPoint)
                    current.mainctrl.mouseoutWarnPoint(this.warn, current);
                _marker.setOptions({icon: _marker.defalueIcon, label:''});
            });
            this.hasEvent = true;
        }
    });
    if (this.line)
        this.line.setMap(_map);
    if (this.pline)
        this.pline.setMap(_map);
  
};
GTyph.prototype.clearTrace = function () {
    $.each(this.tracePoints, function () {
        this.setMap(null);
    });
    if (this.line)
        this.line.setMap(null);
    if (this.pline)
        this.pline.setMap(null);
};
GTyph.prototype.showRadius = function () {
    if(! this.isShowLayer)
        return;
    if (this._currentCenter)
        this._currentCenter.setMap(this.map);
    if (this._currentRadius7)
        this._currentRadius7.setMap(this.map);
    if (this._currentRadius10)
        this._currentRadius10.setMap(this.map);
};
GTyph.prototype.clearRadius = function () {
    if (this._currentCenter)
        this._currentCenter.setMap(null);
    if (this._currentRadius7)
        this._currentRadius7.setMap(null);
    if (this._currentRadius10)
        this._currentRadius10.setMap(null);
};