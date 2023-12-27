var GAddressGeocode = function (ctrl, inicallback) {
    this.mainctrl = ctrl;
    this.map = ctrl.map;
    setTimeout(function () { inicallback(); });
    
    this.marker = undefined;
    this.doubleClickLister = undefined;

    this.draggable = true;
    this.geocoder = new google.maps.Geocoder();
    return this;
};

//GAddressGeocode.prototype.show = function () {

//    this.showTrace();
//    this.showRadius();
//};
//GAddressGeocode.prototype.hide = function () {
//    this.clearTrace();
//    this.clearRadius();
//};
GAddressGeocode.prototype.clear = function () {
    this.marker.setMap(null);

    this.marker = undefined;
};

GAddressGeocode.prototype.setlocation = function (x, y, addr) {
    var current = this;
    if (this.marker)
        this.marker.setMap(null);
    //this.marker = new google.maps.Marker({
    this.marker = new MarkerWithLabel({
        position: new google.maps.LatLng(y, x),
        draggable: this.draggable,
        map: this.map,
        cursor: "pointer",
        raiseOnDrag: true,
        labelContent: addr,
        labelAnchor: new google.maps.Point(addr.length * 5.6, 56),
        labelClass: "pin_label blue_status",// "labels", // the CSS class for the label
        labelStyle: { opacity: 0.99 },
        opacity: 0.9,
        labelInBackground: true,
        optimized: true
    });
    google.maps.event.addListener(this.marker, 'dragend', function (me) {
        current.mainctrl.$element.trigger('_change_localtion', [me.latLng.lng(), me.latLng.lat()]);

    });
};
GAddressGeocode.prototype.clear = function (addr) {
    if (this.marker)
        this.marker.setMap(null);
};
GAddressGeocode.prototype.setlabel = function (addr) {
    this.marker.setOptions({
        labelContent: addr,
        labelAnchor: new google.maps.Point(addr.length * 5.6, 56),
    });
};

GAddressGeocode.prototype.setMarkerDraggable = function (_enable) {
    if (this.marker)
        this.marker.setOptions({ draggable: _enable });
    this.draggable = _enable;
};


GAddressGeocode.prototype.setDoubleClick = function (_enable) {
    var current = this;
    this.map.setOptions({ disableDoubleClickZoom: _enable, draggableCursor: _enable?'crosshair' :undefined});
    if (_enable) {
        this.doubleClickLister=google.maps.event.addListener(this.map, 'dblclick', function (me) {
            current.setlocation(me.latLng.lng(), me.latLng.lat(), '');
            current.mainctrl.$element.trigger('_change_localtion', [me.latLng.lng(), me.latLng.lat()]);

        });
    }
    else if (this.doubleClickLister) {
        google.maps.event.removeListener(this.doubleClickLister);
        this.doubleClickLister = undefined;
    }
};

GAddressGeocode.prototype.reverseGeocode = function (x, y, callback) {
    this.geocoder.geocode({ 'location':{lat: y, lng: x}, region: 'zh-TW' }, function (results, status) {
        //if (status == google.maps.GeocoderStatus.OK) {
        //    //current._initAddressSelect({ results: results, status: status }, x,y);
        //} else {
        //    alert("定位失敗: " + status);
        //}
        callback(results,status)
    });
}
GAddressGeocode.prototype.findAddressGeocode = function (address, callback) {
    this.geocoder.geocode({ 'address': address }, function (results, status) {
        //if (status == google.maps.GeocoderStatus.OK) {
        //    current._initAddressSelect({ results:results, status:status});
        //    helper.misc.hideBusyIndicator(current.$element);
        //} else {
        //    alert("定位失敗: " + status);
        //}
        callback(results, status);
    });
}

GAddressGeocode.prototype.panTo = function (x, y, zoom) {
    this.map.setZoom(zoom);
    this.map.panTo({ lat: y, lng: x });
}


//GAddressGeocode.prototype.geocode = function (_options, callback) {
//}

//GAddressGeocode.prototyper.geocode({ 'address': current.$_addressInput.val().trim() }, function (results, status) {
//    if (status == google.maps.GeocoderStatus.OK) {
//        current._initAddressSelect({ results: results, status: status });
//        helper.misc.hideBusyIndicator(current.$element);
//    } else {
//        alert("定位失敗: " + status);
//    }
//});