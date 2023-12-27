/***polygon***/
var LeafletPolygonBoundary = function (options, datas, callback) {
    this.options = options;

    var current = this;
    this._polygons = [];
    this._mouse_normal_options, this.mouse_over_options;
    var init = function () {
        var _clickable = options.click ? true : false;
        current._mouse_normal_options = $.extend({},options.style,  {
            clickable: _clickable,
            color: options.style.strokeColor,// '#FF0000',
            weight: options.style.strokeWeight,// 2,
            fillColor: options.style.fillColor,
            fillOpacity: options.style.fillOpacity//,0.35,
        });

        current._mouse_over_options =$.extend({}, options.style,  {
            color: options.style.mouseOver.strokeColor,// '#FF0000',
            weight: options.style.mouseOver.strokeWeight,//2,
            fillColor: options.style.mouseOver.fillColor,
            fillOpacity: options.style.mouseOver.fillOpacity//0.35
        });

        $.each(datas, function () {
            current._initGeometry(this);
        });

        if (callback)
            callback(current._polygons);
    };
    init();
};
//設定focus, g(string)為id,g(object)為graphic
LeafletPolygonBoundary.prototype.setOnFocus = function (g) {

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
        //this.mouse_out_options = JSON.parse( JSON.stringify( this.options));
        this.setStyle(this.mouse_over_options);
    });
};
//設定lose focus
LeafletPolygonBoundary.prototype.setLoseFocus = function (g) {
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
        this.setStyle(this.mouse_out_options);
    });
};

//清除圖層
LeafletPolygonBoundary.prototype.clear = function () {
    $.each(this._polygons, function () {
        this.remove();//setMap(null);
    });
};
//設定fitBounds (extend)
LeafletPolygonBoundary.prototype.fitBounds = function (_rect) {
    this.options.map.fitBounds([[_rect.miny, _rect.minx],[_rect.maxy, _rect.maxx]]);
};
//畫geometry
LeafletPolygonBoundary.prototype._initGeometry = function (data) {
    var paths = [];
    $.each(data.coors, function () {//google polygon 可[[latlon,...]],line只能[latlon,...]
        var p = [];
        $.each(this, function () {
            p.push([this[1], this[0]]);
        });
        paths.push(p);
    });
    var opts = $.extend({ title: this.Name, paths: data.coors, map: this.options.map }, JSON.parse(JSON.stringify(this._mouse_normal_options)));
    //opts.paths = paths;
  
    var _g = L.polygon(paths, this._mouse_normal_options).addTo(this.options.map);// new google.maps.Polygon(opts);
    _g.mouse_over_options = this._mouse_over_options;
    _g.mouse_out_options = this._mouse_normal_options;
    _g.boundary_data = data;
    this._polygons.push(_g);

    //event
    this._initEvent(_g);
}
//初始單一geometry event listen
LeafletPolygonBoundary.prototype._initEvent = function (g, evt) {
    var current = this;
    if (this.options.style.mouseOver.enable) {
        
        g.on('mouseover', function(){//) google.maps.event.addListener(g, 'mouseover', function () {
            current.setOnFocus(g);
            if (current.options.mouseOver)
                current.options.mouseOver(g.boundary_data, g, evt)
        });

        // assuming you also want to hide the infowindow when user mouses-out
        g.on('mouseout', function () {//google.maps.event.addListener(g, 'mouseout', function () {
            current.setLoseFocus(g);
            if (current.options.mouseOut)
                current.options.mouseOut(g.boundary_data, g, evt)
        });
    }
    if (this.options.click) {
        g.on('click', function (evt) {//google.maps.event.addListener(g, 'click', function (evt) {
            current.options.click(g.boundary_data, g, evt);
            L.DomEvent.stop(evt);//不再向上觸發map event
        });
    }
}

/*** line ***/
var LeafletLineBoundary = function (options, datas, callback) {
    LeafletPolygonBoundary.call(this, options, datas, callback);
};
LeafletLineBoundary.prototype = Object.create(LeafletPolygonBoundary.prototype);
LeafletLineBoundary.prototype.constructor = LeafletLineBoundary;
if (!window.boundaryPolylineLeafletMaxZIndex)
    window.boundaryPolylineLeafletMaxZIndex = 0;
//初始單一geometry event listen
LeafletLineBoundary.prototype._initGeometry = function (data) {
    var current = this;
    $.each(data.coors, function () {//google polygon 可[[latlon,...]],line只能[latlon,...]
        var p = [];
        $.each(this, function () {
            p.push([this[1], this[0]]);
        });

        //var opts = $.extend({ title: data.Name, path: p, map: current.options.map, zIndex: boundaryPolylineGoogleMaxZIndex ++}, JSON.parse(JSON.stringify(current._mouse_normal_options)));
        //opts.paths = paths;

        //var _g = L.polyline(latlngs, { color: 'red' }).addTo(map);//new google.maps.Polyline(opts);
       
        //_g.mouse_over_options = current._mouse_over_options;
        //_g.mouse_out_options = current._mouse_normal_options;
        //_g.boundary_data = { ID: data.ID, Name: data.Name, coors: this };
        //current._polygons.push(_g);

        ////event
        //current._initEvent(_g);
        var _g = L.polyline(p, current._mouse_normal_options).addTo(current.options.map);//new google.maps.Polyline(opts);

        _g.mouse_over_options = current._mouse_over_options;
        _g.mouse_out_options = current._mouse_normal_options;
        _g.boundary_data = { ID: data.ID, Name: data.Name, coors: this };
        current._polygons.push(_g);

        //event
        current._initEvent(_g);
    });
}