/***********
esri location-based serveices
https://developers.arcgis.com/rest/geocode/api-reference/geocoding-reverse-geocode.htm

reverseGeocode services
http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=120.3144,22.59735&f=pjson&langCode=TW

findAddressCandidates services
by singleLine
http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?singleLine=高雄市前鎮區中山三路&countryCode=TWN&f=pjson
by magicKey(可從suggest services取得)
http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?magicKey=dHA9MCNsb2M9NDIyMTE2NzYjbG5nPTI2I3BsPTQ0NjUyNDA4I2xicz0xNDo0Nzg1NTg4NA==&f=pjson
by singleLine & magicKey
https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?outSr=4326&forStorage=false&outFields=*&singleLine=桃園市大溪區興和里中山路中山路老街, 335, TWN&magicKey=dHA9MCNsb2M9NDIwNTc4MjAjbG5nPTI2I3BsPTQ0NDc1MzAyI2xicz0xNDo0Nzg1NTg5Mg==&f=json

suggest services
https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?text=中山路&f=json&maxSuggestions=50&countryCode=TWN



esri geocoding control
https://esri.github.io/esri-leaflet/examples/geocoding-control.html
*************/

var LAddressGeocode = function (ctrl, inicallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.map;
    setTimeout(function () { inicallback(); });

    this.marker = undefined;
    this.doubleClickLister = undefined;

    this.draggable = true;
    //this.geocoder = new google.maps.Geocoder();
    return this;
};

LAddressGeocode.prototype.clear = function () {
    if (this.marker) {
        this.marker.remove();
        this.marker = undefined;
    }
};

LAddressGeocode.prototype.setlocation = function (x, y, addr) {
    var current = this;
    this.clear()
    //this.marker = new google.maps.Marker({
    this.marker = L.marker([y, x], {
        draggable: true,
        opacity: .9,
        //icon: L.icon.glyph({ iconUrl: 'https://unpkg.com/leaflet@1.3.3/dist/images/marker-icon.png', prefix: 'mdi', glyph: 'school', glyphColor: 'red' })
        //icon: L.icon.glyph({ iconUrl: 'https://unpkg.com/leaflet@1.3.3/dist/images/marker-icon.png', prefix: '', glyph: '<img src="https://140.124.60.39/map/Scripts/gis/images/meter/水位站-g.png"></img>', glyphColor: 'red' })
        //icon: L.icon.glyph({  prefix: 'glyphicon', glyph: 'home', glyphColor: 'red' })
    }).addTo(this.map);
    
    this.marker.bindTooltip('<div class="pin_label  blue_status">' + addr + '</div>',
              { direction: 'top', sticky: true, permanent: true, className: 'leaflet-tooltip-label ' });
    var $_tooltip_label = $(this.marker.getTooltip().getElement()).find('.pin_label');
    var _statusstyle = window.getComputedStyle($_tooltip_label[0]);//.find('.' + g.pinstatus.classes)[0]);
    $_tooltip_label[0].style.backgroundColor = 'transparent';
    $_tooltip_label[0].style.color = _statusstyle.fill;
    this.marker.getTooltip().getElement().style.marginTop = -(this.marker.options.icon.options.iconAnchor[1] - 2) + "px";

    //this.marker = new MarkerWithLabel({
    //    position: new google.maps.LatLng(y, x),
    //    draggable: this.draggable,
    //    map: this.map,
    //    cursor: "pointer",
    //    raiseOnDrag: true,
    //    labelContent: addr,
    //    labelAnchor: new google.maps.Point(addr.length * 5.6, 56),
    //    labelClass: "pin_label blue_status",// "labels", // the CSS class for the label
    //    labelStyle: { opacity: 0.99 },
    //    opacity: 0.9,
    //    labelInBackground: true,
    //    optimized: true
    //});
    this.marker.on('dragend', function (ev) {
        current.mainctrl.$element.trigger('_change_localtion', [ev.target.getLatLng().lng, ev.target.getLatLng().lat]);
    });
};
//LAddressGeocode.prototype.clear = function (addr) {
//    if (this.marker)
//        this.marker.setMap(null);
//};
LAddressGeocode.prototype.setlabel = function (addr) {
    var ss = "";
    //this.marker.setOptions({
    //    labelContent: addr,
    //    labelAnchor: new google.maps.Point(addr.length * 5.6, 56),
    //});
};

LAddressGeocode.prototype.setMarkerDraggable = function (_enable) {
    this.draggable = _enable;
};


LAddressGeocode.prototype.setDoubleClick = function (_enable) {
    var current = this;
    current.positionDoubleClick = _enable;
    if (_enable) {
        this.map.doubleClickZoom.disable();
       
    }
    else {
        this.map.doubleClickZoom.enable();
        //this.map.off(this._doubleClickHander);
    }
    if (!current.islistendblclick) {
        this.map.on('dblclick', function (ev) {
            if (!current.positionDoubleClick)
                return;
            current.setlocation(ev.latlng.lng, ev.latlng.lat, '');
            current.mainctrl.$element.trigger('_change_localtion', [ev.latlng.lng, ev.latlng.lat]);
        });
    }
    current.islistendblclick = true;
};
LAddressGeocode.prototype.reverseGeocode = function (x, y, callback) {
    $.ajax({
        url: encodeURI('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=' + x + ',' + y + '&f=pjson&langCode=TW'),
        dataType: 'json'
    }).done(function (dat, status) {
        if (dat.error)
            callback([dat],dat.error.code+JSON.stringify(dat.error.details));
        else {
            dat.formatted_address = dat.address.Region + dat.address.City + dat.address.Neighborhood + dat.address.Address;//+ dat.address.Address
            dat.geometry = { location: { lng: dat.location.x, lat: dat.location.y } };
            dat.place_id = helper.misc.geguid();
            callback([dat], 'OK');
        }
    });
}
LAddressGeocode.prototype.findAddressGeocode = function (address, callback) {
    var _url = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/' +
        ((typeof address === 'object' && address.magicKey) ? 'findAddressCandidates?forStorage=false&outFields=*&magicKey=' + address.magicKey : 'suggest?text=' + address) +
        '&f=json&maxSuggestions=50&countryCode=TWN';
    $.ajax({
        url: encodeURI(_url),
        //url: encodeURI('https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?text=' + address + '&f=json&maxSuggestions=50&countryCode=TWN'),
        dataType: 'json'
    }).done(function (dat, status) {
        var _r = [];
        var _status = "OK";
        if (dat.suggestions) {
            if (dat.suggestions.length==0)
                _status = "ZERO_RESULTS";
            $.each(dat.suggestions, function () {
                this.formatted_address = this.text.split(',')[0];
                _r.push(this);
                this.place_id = this.magicKey;
            })
        }
        else if (dat.candidates) {
            address.geometry = { location: { lng: dat.candidates[0].location.x, lat: dat.candidates[0].location.y } };
        }
        callback(_r, _status);
    }).fail(function (dat, status) {
        alert("定位失敗!");
    });
}

LAddressGeocode.prototype.panTo = function (x, y, zoom) {
    this.map.setView([y,x], zoom);
}

