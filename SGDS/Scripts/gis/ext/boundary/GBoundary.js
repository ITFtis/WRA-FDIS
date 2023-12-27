/***polygon***/
var GooglePolygonBoundary = function (options, datas, callback) {
    this.options = options;

    var current = this;
    this._polygons = [];
    this._mouse_normal_options, this.mouse_over_options;
    var init = function () {
        //require(["esri/Color"], function (Color) {
            //var normal_filll_color = new Color(options.style.fillColor);
        //    normal_filll_color.a = options.style.fillOpacity;
        //console.log(options.style.fillColor);
            //var mouse_over_fill_color = new Color(options.style.mouseOver.fillColor);
        //    mouse_over_fill_color.a = options.style.mouseOver.fillOpacity;
            var _clickable = options.click ? true : false;
            current._mouse_normal_options = $.extend({},options.style,  {
                clickable: _clickable,
                strokeColor: options.style.strokeColor,// '#FF0000',
                //strokeOpacity: 0.8,
                strokeWeight: options.style.strokeWeight,// 2,
                 //fillColor: normal_filll_color.toHex(),
                fillColor:  options.style.fillColor ,
                //fillColor:'#ff00ff',
                fillOpacity: options.style.fillOpacity//,0.35,
            });

            current._mouse_over_options =$.extend({}, options.style,  {
                strokeColor: options.style.mouseOver.strokeColor,// '#FF0000',
                //strokeOpacity: 0.8,
                strokeWeight: options.style.mouseOver.strokeWeight,//2,
                //fillColor: mouse_over_fill_color.toHex(),
                fillColor: options.style.mouseOver.fillColor,
                fillOpacity: options.style.mouseOver.fillOpacity//0.35
            });

            $.each(datas, function () {
                current._initGeometry(this);
            });

            if (callback)
                callback(current._polygons);
        //});
    };
    //if (!window.require) {
    //    $.getScript("https://js.arcgis.com/3.15/", function () {
    //        init();
    //    });
    //}
    //else
        init();
};
//設定focus, g(string)為id,g(object)為graphic
GooglePolygonBoundary.prototype.setOnFocus = function (g) {

    var gs = [];
    var _id = undefined;
    if (typeof g === "string")
        _id = g;
    else
        _id = g.boundary_data.ID;

    $.each(this._polygons, function () {
        if (this.boundary_data.ID === _id || this.boundary_data.Name === _id) {
            gs.push(this);
        }
    });
    $.each(gs, function () {
        this.setOptions(this.mouse_over_options);
    });
};
//設定lose focus
GooglePolygonBoundary.prototype.setLoseFocus = function (g) {
    var gs = [];
    var _id = undefined;
    if (typeof g === "string")
        _id = g;
    else
        _id = g.boundary_data.ID;

    $.each(this._polygons, function () {
        if (this.boundary_data.ID === _id || this.boundary_data.Name === _id) {
            gs.push(this);
        }
    });
    $.each(gs, function () {
        this.setOptions(this.mouse_out_options);
    });
};

//清除圖層
GooglePolygonBoundary.prototype.clear = function () {
    $.each(this._polygons, function () {
        this.setMap(null);
    });
};
//設定fitBounds (extend)
GooglePolygonBoundary.prototype.fitBounds = function (_rect) {
    this.options.map.fitBounds(new google.maps.LatLngBounds(new google.maps.LatLng(_rect.miny, _rect.minx),
            new google.maps.LatLng(_rect.maxy, _rect.maxx)));
};
//畫geometry
GooglePolygonBoundary.prototype._initGeometry = function (data) {
    var paths = [];
    $.each(data.coors, function () {//google polygon 可[[latlon,...]],line只能[latlon,...]
        var p = [];
        $.each(this, function () {
            p.push(new google.maps.LatLng(this[1], this[0]));
        });
        paths.push(p);
    });
    var opts = $.extend({ title: this.Name, paths: paths, map: this.options.map }, JSON.parse(JSON.stringify(this._mouse_normal_options)));
    //opts.paths = paths;
  
    var _g = new google.maps.Polygon(opts);
    _g.mouse_over_options = this._mouse_over_options;
    _g.mouse_out_options = this._mouse_normal_options;
    _g.boundary_data = data;
    this._polygons.push(_g);

    //event
    this._initEvent(_g);
}
//初始單一geometry event listen
GooglePolygonBoundary.prototype._initEvent = function (g, evt) {
    var current = this;
    if (this.options.style.mouseOver.enable) {
        
        google.maps.event.addListener(g, 'mouseover', function () {
            current.setOnFocus(g);
            if (current.options.mouseOver)
                current.options.mouseOver(g.boundary_data, g, evt)
        });

        // assuming you also want to hide the infowindow when user mouses-out
        google.maps.event.addListener(g, 'mouseout', function () {
            current.setLoseFocus(g);
            if (current.options.mouseOut)
                current.options.mouseOut(g.boundary_data, g, evt)
        });
    }
    if (this.options.click) {
        google.maps.event.addListener(g, 'click', function (evt) {
            current.options.click(g.boundary_data, g, evt);
        });
    }
}

/*** line ***/
var GoogleLineBoundary = function (options, datas, callback) {
    GooglePolygonBoundary.call(this, options, datas, callback);
};
GoogleLineBoundary.prototype = Object.create(GooglePolygonBoundary.prototype);
GoogleLineBoundary.prototype.constructor = GoogleLineBoundary;
if (!window.boundaryPolylineGoogleMaxZIndex)
    var boundaryPolylineGoogleMaxZIndex = google.maps.Marker.MAX_ZINDEX * 4 / 5;
//初始單一geometry event listen
GoogleLineBoundary.prototype._initGeometry = function (data) {
    var current = this;
    $.each(data.coors, function () {//google polygon 可[[latlon,...]],line只能[latlon,...]
        var p = [];
        $.each(this, function () {
            p.push(new google.maps.LatLng(this[1], this[0]));
        });

        var opts = $.extend({ title: data.Name, path: p, map: current.options.map, zIndex: boundaryPolylineGoogleMaxZIndex ++}, JSON.parse(JSON.stringify(current._mouse_normal_options)));
        //opts.paths = paths;

        var _g = new google.maps.Polyline(opts);
       
        _g.mouse_over_options = current._mouse_over_options;
        _g.mouse_out_options = current._mouse_normal_options;
        _g.boundary_data = { ID: data.ID, Name: data.Name, coors: this };
        current._polygons.push(_g);

        //event
        current._initEvent(_g);
    });
}