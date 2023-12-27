(function () {
    /**
     * options:{ url: 'http://maps.nlsc.gov.tw/S_Maps/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=LANDSECT&STYLE=_null&TILEMATRIXSET=EPSG:3857&TILEMATRIX=EPSG:3857:${level}&TILEROW=${row}&TILECOL=${col}&FORMAT=image/png',
     *  tileSize:new google.maps.Size(256, 256)}
     **/
    function ImageTileOverMapType(options, visible) {
        this.tileSize = options.tileSize ? options.tileSize : new google.maps.Size(256, 256);
        this.urltemp = options.url;
        this.visible = visible !== undefined ? visible : true;
    };
    ImageTileOverMapType.prototype.setVisible = function (b) {
        this.visible = b;
    };
    ImageTileOverMapType.prototype.getTile = function (coord, zoom, ownerDocument) {
        if (!this.visible) return;
        var div = ownerDocument.createElement('img');
        div.src = this.urltemp.replace(/\${level}/g, zoom).replace(/\${col}/g, coord.x).replace(/\${row}/g, coord.y);
        div.innerHTML = coord;
        div.style.width = this.tileSize.width + 'px';
        div.style.height = this.tileSize.height + 'px';
        return div;
    };

    
    /**
     *options: {
     *   map:app.map,
     *   url: "http://192.168.55.16:8081/geoserver/Hushan/wms",
     *   tileSize :new google.maps.Size(256*2, 256*2),
     *   options: {
     *       VERSION: "1.1.0", SERVICE: "WMS", REQUEST: "GetMap", FORMAT: "image/png", TRANSPARENT: "TRUE", STYLES: "",
     *       LAYERS: "Contours", SRS: "EPSG:4326"
     *   } 
     **/
    function WMSTileGoogleOverMapType(options, visible) {
        this.tileSize = options.tileSize ? options.tileSize : new google.maps.Size(256, 256);
        this.options = options;
        this.visible = visible;
        this._imags = [];
        this._opacity = 0.9;
        this._zoomtemp = 99;
    };
    WMSTileGoogleOverMapType.prototype.setVisible = function (b) {
        this.visible = b;
    };
    WMSTileGoogleOverMapType.prototype.setOpacity = function (_opacity) {
        this._opacity = _opacity;
        if (this._imags) {
            this._imags.forEach(function (l, idx) {
                l.style.opacity = _opacity;
            });
        }
    }
    WMSTileGoogleOverMapType.prototype.getTile = function (coord, zoom, ownerDocument) {
        if (!this.visible) return;
        if (this._zoomtemp != zoom) {
            this._imags = [];
            this._zoomtemp = zoom;
        }
        //this.ownerDocument = ownerDocument;
        var div = ownerDocument.createElement('img');

        var proj = this.options.map.getProjection();
        var zfactor = Math.pow(2, zoom);
        // get Long Lat coordinates
        var top = proj.fromPointToLatLng(new google.maps.Point(coord.x * this.tileSize.width / zfactor, coord.y * this.tileSize.height / zfactor));
        var bot = proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * this.tileSize.width / zfactor, (coord.y + 1) * this.tileSize.height / zfactor));

        //corrections for the slight shift of the SLP (mapserver)
        var deltaX = 0;// 0.0013;
        var deltaY = 0;//0.00058;

        //create the Bounding box string
        var bbox = (top.lng() + deltaX) + "," +
                        (bot.lat() + deltaY) + "," +
                        (bot.lng() + deltaX) + "," +
                        (top.lat() + deltaY);

        //base WMS URL
        var url = this.options.url + "?";
        url += "BBOX=" + bbox;      // set bounding box
        url += "&WIDTH=" + this.tileSize.width;         //tile size in google
        url += "&HEIGHT=" + this.tileSize.height;
        if (this.options.options) {
            $.each(this.options.options, function (f, v) {
                url += "&" + f + "=" + v;
            });
        }
        div.src = url;
        div.innerHTML = coord;
        div.style.width = this.tileSize.width + 'px';
        div.style.height = this.tileSize.height + 'px';
        div.style.opacity = this._opacity;
        this._imags.push(div);
        
        //console.log("wms.url:" + url);
        return div;
    };

    
    WMSGoogleOverlayView.prototype = new google.maps.OverlayView();
    //USEWMSOverlay.prototype = Object.create(google.maps.OverlayView.prototype);

    /*
     *options: {
     *        url: "http://192.168.55.16:8081/geoserver/Hushan/wms",
     *        options: {
     *            VERSION: "1.1.0", SERVICE: "WMS", REQUEST: "GetMap", FORMAT: "image/png", TRANSPARENT: "TRUE", STYLES: "",
     *            LAYERS: "Contours", SRS: "EPSG:4326"
     *   }
     */
    function WMSGoogleOverlayView(options) {

        // Initialize all properties.
        this.options_ = options;
        this.changeMapViewTimer_;

        // Define a property to hold the image's div. We'll
        // actually create this div upon receipt of the onAdd()
        // method so we'll leave it null for now.
        this.div_ = null;
        this.divloading_ = null;
        this.waitTimer_ = 0;
        // Explicitly call setMap on this overlay.

        this.isInitListener = false;
    }
    WMSGoogleOverlayView.prototype._changeMapView = function () {
        if (!this.getMap())
            return;
        clearTimeout(this.changeMapViewTimer_);
        this.changeMapViewTimer_ = setTimeout($.proxy(this.redraw, this), this.waitTimer_);
        this.waitTimer_ = 800;
    };
    /**
     * onAdd is called when the map's panes are ready and the overlay has been
     * added to the map.
     */
    WMSGoogleOverlayView.prototype.onAdd = function () {
        this.waitTimer_ = 0;
        if (!this.isInitListener) {
            this.isInitListener = true;
            google.maps.event.addListener(this.getMap(), 'dragend', $.proxy(this._changeMapView, this));
            //zoom_changed會觸發draw，所以不用lister
            //google.maps.event.addListener(this.getMap(), 'zoom_changed', $.proxy(this._changeMapViewTimer, this));
        }
    };

    WMSGoogleOverlayView.prototype.draw = function () { //zoom_changed或zoom_changed(map==null)後setMap(map)會觸發
        if (!this.getMap())
            return;
        var overlayProjection = this.getProjection();
        if (this.div_ && this.div_.loaded) {
            sw = overlayProjection.fromLatLngToDivPixel(this.div_.imageBounds.getSouthWest());
            ne = overlayProjection.fromLatLngToDivPixel(this.div_.imageBounds.getNorthEast());
            this.div_.style.left = sw.x + 'px';
            this.div_.style.top = ne.y + 'px';
            this.div_.style.width = (ne.x - sw.x) + 'px';
            this.div_.style.height = (sw.y - ne.y) + 'px';
            //console.log('scale image...' + sw.x + "  " + ne.y);
        }
        this._changeMapView();
    };
    WMSGoogleOverlayView.prototype.redraw = function () {

        if (!this.getMap())
            return;
        var overlayProjection = this.getProjection();

        if (this.divloading_ && !this.divloading_.loaded) { //移除尚未載入資料
            this.divloading_.parentNode.removeChild(this.divloading_);
            this.divloading_ = null;
        }
        this.divloading_ = document.createElement('div');
        this.divloading_.style.borderStyle = 'none';
        this.divloading_.style.borderWidth = '0px';
        this.divloading_.style.position = 'absolute';
        this.idx++;
        this.divloading_.idx = this.idx;


        var that = this;
        //function WGS84toGoogleBing(l) {
        //    var x = l.lng() * 20037508.34 / 180.0;
        //    var y = Math.log(Math.tan((90.0 + l.lat()) * Math.PI / 360.0)) / (Math.PI / 180.0);
        //    y = y * 20037508.34 / 180.0;
        //    return new google.maps.Point(x, y);
        //}
        var imageBounds = this.getMap().getBounds();

        var ll = this.options_.WGS84ConvertToOther ? this.options_.WGS84ConvertToOther(imageBounds.getSouthWest()) : imageBounds.getSouthWest();
        var ur = this.options_.WGS84ConvertToOther ? this.options_.WGS84ConvertToOther(imageBounds.getNorthEast()) : imageBounds.getNorthEast();
        //var LL = WGS84toGoogleBing(ll);//如需轉座標
        //var UR = WGS84toGoogleBing(ur);

        var bbox = ll.lng() + "," + ll.lat() + "," + ur.lng() + "," + ur.lat();

        var mapdiv = this.getMap().getDiv();

        //base WMS URL  
        var url = this.options_.url + "?";
        url += "BBOX=" + bbox;      // set bounding box
        url += "&WIDTH=" + mapdiv.clientWidth;         //tile size in google
        url += "&HEIGHT=" + mapdiv.clientHeight;
        if (this.options_.options) {
            $.each(this.options_.options, function (f, v) {
                url += "&" + f + "=" + v;
            });
        }




        // Create the img element and attach it to the div.
        var img = document.createElement('img');
        img.src = url;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.position = 'absolute';


        img.onload = function () {
            if (that.div_ && that.divloading_ && that.div_.parentNode) {//移除以載入資料
                that.div_.parentNode.removeChild(that.div_);
                //that.onRemove();
            }
            if (!that.divloading_)
                return;//chrome一直 pan數次後 that.divloading_會是null???????????
            that.div_ = that.divloading_;
            that.div_.loaded = true;
            that.divloading_ = null;
        };
        this.divloading_.appendChild(img);
        // Add the element to the "overlayLayer" pane.

        var panes = this.getPanes();
        panes.overlayLayer.appendChild(this.divloading_);


        var sw = overlayProjection.fromLatLngToDivPixel(imageBounds.getSouthWest());
        var ne = overlayProjection.fromLatLngToDivPixel(imageBounds.getNorthEast());
        this.divloading_.style.left = sw.x + 'px';
        this.divloading_.style.top = ne.y + 'px';
        this.divloading_.style.width = (ne.x - sw.x) + 'px';
        this.divloading_.style.height = (sw.y - ne.y) + 'px';
        this.divloading_.imageBounds = imageBounds;
    };
    // The onRemove() method will be called automatically from the API if
    // we ever set the overlay's map property to 'null'.
    WMSGoogleOverlayView.prototype.onRemove = function () {
        if (this.div_)
            this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
        if (this.divloading_)
            this.divloading_.parentNode.removeChild(this.divloading_);
        this.divloading_ = null;
    };

    var addOverlayMapType = function (map, overlay) {
        map.overlayMapTypes.push(overlay);
    }
    var removeOverlayMapType = function (map, overlay) {
        map.overlayMapTypes.forEach(function (l, idx) {
            if (l == overlay)
                map.overlayMapTypes.removeAt(idx);
        });
    }
    window.googleHelper = window.googleHelper || {};
    window.googleHelper.WMSGoogleOverlayView = WMSGoogleOverlayView;            //map.overlayMapTypes以WMS依螢幕呈現
    window.googleHelper.WMSTileGoogleOverMapType = WMSTileGoogleOverMapType;    //map.overlayMapTypes將WMS以tile呈現
    window.googleHelper.ImageTileOverMapType = ImageTileOverMapType;

    window.googleHelper.overlayMapType = window.googleHelper.overlayMapType || {};
    window.googleHelper.overlayMapType.add = addOverlayMapType;
    window.googleHelper.overlayMapType.remove = removeOverlayMapType;
})(window);