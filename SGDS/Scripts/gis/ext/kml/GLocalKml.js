var GLocalKml = function (ctrl, inicallback) {
    this.ctrl = ctrl;
    this.map = ctrl.settings.map;
    setTimeout(function () { inicallback(); });
    this.kmllayers = [];
    return this;
};
GLocalKml.prototype.add = function (data) {
    var current = this;
    if (!data.Error) {
        //window.helper.misc.showBusyIndicator(current.ctrl.$element);
        for (var i = 0; i < data.Kmls.length; i++) {
            var ctaLayer = new google.maps.KmlLayer({
                url: data.Kmls[i].Url,
                map: this.map,
                name: data.Kmls[i].Name
            });
            this.kmllayers.push(ctaLayer);
        }
    }
    else {
        alert(data.Error);
    }
};
GLocalKml.prototype.show = function (_name, _show) {
    for (var i = 0; i < this.kmllayers.length; i++) {
        if (this.kmllayers[i].name == _name) {
            this.kmllayers[i].setMap(_show?this.map:null);
            return;
        }
    }
};
GLocalKml.prototype.removeAll = function () {
    for (var i = 0; i < this.kmllayers.length; i++) {
        this.kmllayers[i].setMap(null);
    }
    this.kmllayers = [];
};