/**
 * 參考https://github.com/domoritz/leaflet-maskcanvas/blob/master/src/L.GridLayer.MaskCanvas.js
 * For Leaflet 0.7.x, please use L.TileLayer.MaskCanvas
 */
L.GridLayer.DouMaskRectGrid = L.GridLayer.extend({
    options: {
        useAbsoluteRadius: true,  // true: radius in meters, false: radius in pixels
        color: '#000',
        opacity: 1,
        noMask: true,  // true results in normal (filled) circled, instead masked circles
        lineColor: undefined,  // color of the circle outline if noMask is true
        debug: false,
        zIndex: 18, // if it is lower, then the layer is not in front
        xcellsize: 0.0125,
        ycellsize: 0.0125,
        cacheLevel:8
    },
    //addClick: function () {
    //    L.DomEvent.on(document, 'click', function () {
    //        console.log("click....");
    //        console.log("click....");
    //    }, this);
    //},

    //removeHooks: function () {
    //    L.DomEvent.off(document, 'click', undefined, this);
    //},
    initialize: function (options) {
        this._delegate = null;
        this._timerflag = null;
        this._ismonseover = false;
        this.cachegriddatas = {}; //cache zoom 在options.cacheLevel每個title的griddata
        this.cacheCanvas = {}; //cache zoom 小於等於options.cacheLevel的title Canva(DOMElement)
        L.setOptions(this, options);
    },
    delegate: function (del) {
        this._delegate = del;
        return this;
    },
    _onMousemove: function (e) {
        var _self = this;
       
        if (!this._events.mousemove )//|| _self.maponmove)
            return;
        clearTimeout(_self._timerflag);
        _timerflag = setTimeout(function () {
            if (_self.bounds && _self.bounds.contains(e.latlng)) {
                var gdata = _self.getGriddata(e.latlng);
                if (gdata) {
                    e.griddata = gdata;
                    _self._events.mousemove[0].fn(e);
                    _self._ismonseover = true;
                }
                else if(_self._ismonseover) {
                    _self._events.mouseout[0].fn(e);
                    _self._ismonseover = false;
                }
            } else if (_self._ismonseover && _self._events.mouseout) {
                _self._events.mouseout[0].fn(e);
                _self._ismonseover = false;
            }
        },100);
    },
    _onMouseout: function (e) {
        if (!this._events.mouseout)
            return;
        var _self = this;
        clearTimeout(_self._timerflag);
        _self._events.mouseout[0].fn(e);
        _self._ismonseover = false;
    },
    _onClick: function (e) {
        if (!this._events.click)
            return;
        var _self = this;
        clearTimeout(_self._timerflag);
        _timerflag = setTimeout(function () {
            if (_self.bounds && _self.bounds.contains(e.latlng)) {
                _self._events.click[0].fn(e);
            }
        });
    },
    getEvents: function () {
        var events = L.GridLayer.prototype.getEvents.call(this); //一定要呼叫這，再去override或新增event
        events.click = this._onClick;
        events.mousemove = this._onMousemove;
        events.mouseout = this._onMouseout;

        return events;

    },
    /**
     * 依latlng取對應griddata
     * @param {L.LatLng} latlng
     */
    getGriddata: function (latlng) {
        var _self = this;
        var r = undefined;
        if (!this.griddatas)
            return r;
        $.each(this.griddatas, function () {
            if (Math.abs(this.lat - latlng.lat) <= _self.options.ycellsize/2 && Math.abs(this.lng - latlng.lng) <= _self.options.xcellsize/2) {
                r = this;
                return false;
            }
        });
        return r;
    },
    /**
     * override method
     * @param {any} coords
     */
    createTile: function (coords) {
        var _key = coords.x + "-" + coords.y + "-" + coords.z;
        if (coords.z<=this.options.cacheLevel && this.cacheCanvas && this.cacheCanvas.hasOwnProperty(_key)) {
            return this.cacheCanvas[_key];
        }
        var tile = document.createElement('canvas');
        tile.width = tile.height = this.options.tileSize;

        this._draw(tile, coords);

        if (this.options.debug) {
            this._drawDebugInfo(tile, coords);
        }
        if (coords.z <= this.options.cacheLevel && !L.Browser.mobile) {
            this.cacheCanvas = this.cacheCanvas || {};
            this.cacheCanvas[_key] = tile;
        }
        setTimeout(function () {
            tile.addEventListener('mousedown', function (evt, dd) {
                var sad = "";
            }, false);
        });

        return tile;
    },

    _drawDebugInfo: function (canvas, coords) {
        var tileSize = this.options.tileSize;
        var ctx = canvas.getContext('2d');

        ctx.globalCompositeOperation = 'xor';

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, tileSize, tileSize);

        ctx.strokeStyle = '#000';
        ctx.strokeText('x: ' + coords.x + ', y: ' + coords.y + ', zoom: ' + coords.z, 20, 20);

        ctx.strokeStyle = '#f55';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(tileSize, 0);
        ctx.lineTo(tileSize, tileSize);
        ctx.lineTo(0, tileSize);
        ctx.closePath();
        ctx.stroke();
    },

    /**
     * Pass {lng,lat,color} coordinates.
     * Alternatively you can also pass LatLng objects.
     *
     * Whenever there is no specific color, the default one is used.
     *
     * @param {lng:Number,lat:Number,color:String} dataset
     */
    setData: function (griddatas) {
        var self = this;
        
        this.griddatas = griddatas;//dataset;
        this.cachegriddatas = {}; //cache zoom 在options.cacheLevel每個title的griddata
        this.cacheCanvas = {}; //cache zoom 小於等於options.cacheLevel的title Canva(DOMElement)

        this.bounds = new L.LatLngBounds(this.griddatas);
        if (this._map) {
            this.redraw();
        }
    },

    /**
     * Set default cellsize value.
     *
     * @param {number} xcellsize,ycellsize
     */
    setCellsize: function (xcellsize, ycellsize) {
        this.options.xcellsize = xcellsize;
        this.options.ycellsize = ycellsize;
        this.redraw();
    },
    /**
     * @param {L.Point} coords
     * @param {{x: number, y: number, r: number}} pointCoordinate
     * @returns {[number, number, number]}
     * @private
     */
    _tileRectData: function (coords, pointCoordinate) {
        // start coords to tile 'space'
        var s = coords.multiplyBy(this.options.tileSize);

        // actual coords to tile 'space'
        var cx = this.options.xcellsize / 2;
        var cy = this.options.ycellsize / 2;
        var p = this._map.project(new L.LatLng(pointCoordinate.lat + cy, pointCoordinate.lng - cx), coords.z);
        var p2 = this._map.project(new L.LatLng(pointCoordinate.lat - cy, pointCoordinate.lng + cx), coords.z);

        // point to draw
        var x = Math.round(p.x - s.x);
        var y = Math.round(p.y - s.y);
        var w = Math.round(p2.x - s.x)-x;
        var h = Math.round(p2.y - s.y)-y;
        var c = pointCoordinate.color;
        return { x: x, y: y, w: w, h: h, c: c };
    },

    _boundsToQuery: function (bounds) {
        if (bounds.getSouthWest() == undefined) { return { x: 0, y: 0, width: 0.1, height: 0.1 }; }  // for empty data sets
        return {
            x: bounds.getSouthWest().lng,
            y: bounds.getSouthWest().lat,
            width: bounds.getNorthEast().lng - bounds.getSouthWest().lng,
            height: bounds.getNorthEast().lat - bounds.getSouthWest().lat
        };
    },
    /**
     * This is used instead of this._map.latLngToLayerPoint
     * in order to use custom zoom value.
     *
     * @param {L.LatLng} latLng
     * @param {number} zoom
     * @returns {L.Point}
     * @private
     */
    _latLngToLayerPoint: function (latLng, zoom) {
        var point = this._map.project(latLng, zoom)._round();
        return point._subtract(this._map.getPixelOrigin());
    },
    _long2tile:function(lon, zoom) { return(Math.floor((lon + 180) / 360 * Math.pow(2, zoom))); },
    _lat2tile: function(lat, zoom) { return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))); },
    _tile2long: function(x, z) {return(x/ Math.pow(2, z) * 360 - 180);},
    _tile2lat: function(y, z) {var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));},
    /**
     * @param {HTMLCanvasElement|HTMLElement} canvas
     * @param {L.Point} coords
     * @private
     */
    _draw: function (canvas, coords) {
        //if (!this._quad || !this._map) {
        //    return;
        //}
        if (!this._map || !this.griddatas) {
            return;
        }
      
        var tileSize = this.options.tileSize;

        var nwPoint = coords.multiplyBy(tileSize);
        var sePoint = nwPoint.add(new L.Point(tileSize, tileSize));

        if (this.options.useAbsoluteRadius) {
            var centerPoint = nwPoint.add(new L.Point(tileSize / 2, tileSize / 2));
            this._latLng = this._map.unproject(centerPoint, coords.z);
        }

        var pointCoordinates = [];
        var _key = coords.x + "-" + coords.y + "-" + coords.z;
        if (this.cachegriddatas[_key]) {
            pointCoordinates = this.cachegriddatas[_key];
        }
        else {
            var usegriddatas = this.griddatas;

            //找出cache的prant datagrid，提升選cell的效能
            if (coords.z > this.options.cacheLevel && this.cachegriddatas) {
                var temp = new L.Point((nwPoint.x + sePoint.x) / 2, (nwPoint.y + sePoint.y) / 2);
                var tempLatlng = this._map.unproject(temp, coords.z);
                var xtile = this._long2tile(tempLatlng.lng, this.options.cacheLevel);
                var ytile = this._lat2tile(tempLatlng.lat, this.options.cacheLevel);
                var _cachekey = xtile + "-" + ytile + "-" + this.options.cacheLevel;
                if (this.cachegriddatas.hasOwnProperty(_cachekey))
                    usegriddatas = this.cachegriddatas[_cachekey];
            }
             //padding
            var pad = this._getPappingPoint(coords.z);//  new L.Point(this.getPappingx(coords.z), this.getPappingy(coords.z));

            nwPoint = nwPoint.subtract(pad);
            sePoint = sePoint.add(pad);

            var bounds = new L.LatLngBounds(this._map.unproject(sePoint, coords.z), this._map.unproject(nwPoint, coords.z));
        
            var s1 = Date.now();
            if (this.bounds.intersects(bounds)) {
                pointCoordinates = $.grep(usegriddatas, function (v) {
                    return bounds.contains(v);
                });
            }
            //console.log(_key +"  "+xtile+" "+ytile+ " total: " + (Date.now() - s1));
            if (this.options.cacheLevel == coords.z) 
                this.cachegriddatas[_key] = pointCoordinates;
        }
        //var pointCoordinates = this._quad.retrieveInBounds(this._boundsToQuery(bounds));
        this._drawRects(canvas, coords, pointCoordinates);
    },
    /**
     * 放大padding避免title間的間隙
    */
    _getPappingPoint : function (zoom) {
        var lngt = this.options.xcellsize * 2 / 3,//如瀏覽器的解析調小於100%除2還是會有些間隙，解析調越小lngt要越大
            latLng2 = new L.LatLng(this._latLng.lat, this._latLng.lng - lngt, true),
            point2 = this._latLngToLayerPoint(latLng2, zoom),
            point = this._latLngToLayerPoint(this._latLng, zoom);

        var xw = Math.max(Math.ceil(point.x - point2.x), 1);

        var latt = this.options.ycellsize * 2 / 3;
        latLng2 = new L.LatLng(this._latLng.lat + latt, this._latLng.lng, true);
        point2 = this._latLngToLayerPoint(latLng2, zoom);
        point = this._latLngToLayerPoint(this._latLng, zoom);

        var yh = Math.max(Math.ceil(point.y - point2.y), 1);
        return new L.Point(xw,yh);
    },
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {L.Point} coords
     * @param {[{lng: number, lat: number, color: number}]} pointCoordinates
     * @private
     */
    _drawRects: function (canvas, coords, pointCoordinates) {
        var ctx = canvas.getContext('2d'),
            tileRect;
        ctx.fillStyle = this.options.color;

        if (this.options.lineColor) {
            ctx.strokeStyle = this.options.lineColor;
            ctx.lineWidth = this.options.lineWidth || 1;
        }

        ctx.globalCompositeOperation = 'source-over';
        if (!this.options.noMask && !this.options.debug) {
            ctx.fillRect(0, 0, this.options.tileSize, this.options.tileSize);
            ctx.globalCompositeOperation = 'destination-out';
        }
        for (var index in pointCoordinates) {
            if (pointCoordinates.hasOwnProperty(index)) {
                tileRect = this._tileRectData(coords, pointCoordinates[index]);

                ctx.fillStyle = pointCoordinates[index].color;//this.options.color;
                ctx.beginPath();
                ctx.rect(tileRect.x, tileRect.y, tileRect.w, tileRect.h);
                ctx.fill();
                //  ctx.fillStyle = "red";
                //ctx.beginPath();
                //  ctx.arc(tilePoint[0], tilePoint[1], tilePoint[2], 0, Math.PI * 2);

                //  ctx.fill();
                //  ctx.stroke();
                if (this.options.lineColor) {
                    ctx.stroke();
                }
            }
            //console.log(JSON.stringify(tilePoint));
            //if (index == 2)
            //break;
        }
    }
});


L.GridLayer.DouMaskCanvasImageGrid = L.GridLayer.DouMaskRectGrid.extend({
    options: {
        //useAbsoluteRadius: true,  // true: radius in meters, false: radius in pixels
        //color: '#000',
        //opacity: 1,
        //noMask: true,  // true results in normal (filled) circled, instead masked circles
        //lineColor: undefined,  // color of the circle outline if noMask is true
        //debug: false,
        //zIndex: 18, // if it is lower, then the layer is not in front
        //xcellsize: 0.0125,
        //ycellsize: 0.0125,
        //cacheLevel: 8
        resolution: 1 //dataCanvas width and height放大倍數，值愈大解析度越高
    },
    /**
     * override method
     * @param {any} coords
     */
    createTile: function (coords) {
        
        var _self = this;
        

        //var nwPoint = this._map.project(new L.LatLng(27, 118), coords.z);
        //var sePoint = this._map.project(new L.LatLng(20, 123.5), coords.z);
        var nePoint = this._map.project( this.bounds.getNorthEast(), coords.z);
        var swPoint = this._map.project(this.bounds.getSouthWest(), coords.z);

        var left = swPoint.x,
            top = nePoint.y,
            right = nePoint.x,
            bottom = swPoint.y,
            height = bottom - top,
            width = right - left,
            rateWidth = width / this.dataCanvas.width,// 441,
            rateHeight = height / this.dataCanvas.height,// 561,
            canvas = document.createElement('canvas');
        canvas.width = canvas.height = 256;
        
        var tileSize = this.options.tileSize;
        var tile_nwPoint = coords.multiplyBy(tileSize);
        var tile_sePoint = tile_nwPoint.add(new L.Point(tileSize, tileSize));
        var tilebounds = new L.LatLngBounds(this._map.unproject(tile_sePoint, coords.z), this._map.unproject(tile_nwPoint, coords.z));

        if (this.bounds.intersects(tilebounds)) {
            $(document).queue(function (next) {
                var ctx = canvas.getContext('2d');
                try {
                    //ctx.drawImage(_self.dataCanvas, Math.round((coords.x * 256 - left) / rateWidth), Math.round((coords.y * 256 - top) / rateHeight) - 1, Math.round(256 / rateWidth), Math.round(256 / rateHeight), 0, 0, 256, 256);
                    ctx.drawImage(_self.dataCanvas, Math.floor((tile_nwPoint.x - left) / rateWidth), Math.floor((tile_nwPoint.y - top) / rateHeight), Math.floor(256 / rateWidth), Math.floor(256 / rateHeight), 0, 0, 256, 256);
                } catch (e) {

                }
                next();
            }).delay();
        }
        return canvas;

    },
    /**
     * Pass {lng,lat,color} coordinates.
     * Alternatively you can also pass LatLng objects.
     *
     * Whenever there is no specific color, the default one is used.
     *
     * @param {lng:Number,lat:Number,color:String} dataset
     */
    setData: function (griddatas) {
        var _self = this;
        this.griddatas = griddatas;
        this.bounds = new L.LatLngBounds(this.griddatas);

        var e = this.bounds.getEast();
        var w = this.bounds.getWest();
        var n = this.bounds.getNorth();
        var s = this.bounds.getSouth();

        var dataCol = Math.round((e - w) / this.options.xcellsize) + 1;
        var dataRow = Math.round((n - s) / this.options.ycellsize) + 1;
        var self = this;
        var scale = this.options.resolution;
        this.dataCanvas = document.createElement('canvas');
        //this.dataCanvas.width = Math.round((e - w) / this.options.xcellsize) + 1;//  441;
        this.dataCanvas.width = dataCol * scale;
        //this.dataCanvas.height = Math.round((n - s) / this.options.ycellsize) + 1;// 561;
        this.dataCanvas.height = dataRow * scale;
        var ctx = this.dataCanvas.getContext('2d');
        var image = ctx.createImageData(this.dataCanvas.width, this.dataCanvas.height );
        $.each(griddatas, function (idx, val) {
            var pcidx = Math.round( (val.lng - w) / _self.options.xcellsize) ;
            var pridx = dataRow - Math.round( (val.lat - s) / _self.options.ycellsize) - 1;
            var pidx = pcidx + pridx * dataCol;
            var r = parseInt(val.color.substr(1, 2), 16);
            var g = parseInt(val.color.substr(3, 2), 16);
            var b = parseInt(val.color.substr(5, 2), 16);
            //if (val.color == '#ffffff')
            //    return;
            for (var r = 0; r < scale; r++) {
                for (var c = 0; c < scale; c++) {
                    var _idx = pcidx * scale + c + (pridx * scale + r) * dataCol * scale;
                    image.data[_idx* 4] = r;
                    image.data[_idx * 4 + 1] = g;
                    image.data[_idx * 4 + 2] = b;
                    image.data[_idx * 4 + 3] = 255;
                }
            }
            //image.data[pidx * 4] = r;
            //image.data[pidx * 4 + 1] = g;
            //image.data[pidx * 4 + 2] = b;
            //image.data[pidx * 4 + 3] = 255;
        });
        ctx.putImageData(image, 0, 0);
        this.bounds = new L.LatLngBounds(this.griddatas);
        if (this._map) {
            var sdd =this._tileZoom;
            this.redraw();
            //另一方法
            //var imageLayer = L.imageOverlay(_self.dataCanvas.toDataURL(), this.bounds, {
            //    opacity: 1
            //});
            //imageLayer.addTo(this._map);
        }
    },
    /**
    * 依latlng取對應griddata
    * @param {L.LatLng} latlng
    */
    getGriddata: function (latlng) {
        var _self = this;
        var r = undefined;
        if (!this.griddatas)
            return r;
        $.each(this.griddatas, function () {
            if (latlng.lat <= this.lat && latlng.lat >= this.lat - _self.options.ycellsize && latlng.lng >= this.lng && latlng.lng <= this.lng + _self.options.xcellsize) {
                r = this;
                return false;
            }
        });
        return r;
    }
});

//L.TileLayer.maskCanvas = function
L.DouLayer = L.DouLayer || {};
L.DouLayer.gridRectCanvas = function(options) {
    return new L.GridLayer.DouMaskRectGrid(options);
};
L.DouLayer.gridCanvasImage = function (options) {
    return new L.GridLayer.DouMaskCanvasImageGrid(options);
};

L.DouLayer.Qqesums = L.DouLayer.Qqesums || {};
L.DouLayer.Qqesums.DefaulParas = {
    xllcorner: 115, yllcorner: 17.9875, xcellsize: 0.012500000000, ycellsize: 0.012500000000, ncols: 921, nrows: 881, wkid: 4326, datas: [], //compref_Test.txt用
    colorDef: [{ min: 80, max: 5000, color: "#FF0000" }, { min: 50, max: 80, color: "#FF6363" }, { min: 40, max: 50, color: "#FF9400" }
        , { min: 30, max: 40, color: "#E7C600" }, { min: 20, max: 30, color: "#FFFF00" }, { min: 15, max: 20, color: "#009400" }
        , { min: 10, max: 15, color: "#00AD00" }, { min: 5, max: 10, color: "#00CE00" }, { min: 2, max: 5, color: "#9C9C9C" }
        , { min: 1, max: 2, color: "#9B6384" }, { min: 0.0001, max: 1, color: "#63529B" }, { min: -999, max: 0.0001, color: "#ffffff" }]
};

L.DouLayer.Qqesums.genLegend = function ($_c, coldefs, cw,ch, unit, name, nameatleft) {
    if (!cw) cw = 30;
    if (!ch) cw = 20;
    unit = unit || '';
    var $_p = $('<div class="dou-layer-gen-legend">').appendTo($_c);
    $('<div class="legned-title">'+unit+'</div>').appendTo($_p);
    var $_l = $('<div style="display:inline-flex" class="legend-content">').appendTo($_p);
    var $_lcolor = $('<div class="legend-color">').appendTo($_l);
    var $_llabel = $('<div class="legend-label" style="margin-top:' + (ch / 2) + 'px;margin-bottom:-' + (ch / 2) + 'px;margin-left:2px;">').appendTo($_l);
    if (name) {
        var $_n = $('<div class="legend-name" style="writing-mode:vertical-lr;text-align:center;">' + name + '</div>');
        if (nameatleft)
            $_n.prependTo($_l);
        else
            $_n.appendTo($_l);
    }
    for (var i = 0; i < coldefs.length; i++) {
        $('<div class="one-legend-color" style="width:' + cw + 'px;height:' + ch + 'px;background-color:' + coldefs[i].color + ';">').appendTo($_lcolor);
        $('<div class="one-legend-label" style="height:' + ch + 'px;"><label>' + coldefs[i].min + '</label></div>').appendTo($_llabel);
    }
}
//[[x,y,z]]to[{lon,lat,val,color}]
L.DouLayer.Qqesums.gridData2cellData = function (gdatas, coldef) {
    var getcolor = function (v) {
        for (var i = 0; i < coldef.length; i++) {
            if (v >= coldef[i].min)
                return coldef[i].color;
        }
    };
    var cdatas = [];//$.map(gdata.datas, function (val, i) {return { lng: val[0], lat: val[1], color: getcolor(gdata.colorDef, val[2]) }});
    $.each(gdatas, function (idx, val) {
        cdatas.push({ lng: val[0], lat: val[1], val: val[2], color: getcolor(val[2]) });
    });
    return cdatas;
}
L.DouLayer.Qqesums.Parser = {};
L.DouLayer.Qqesums.Parser.qpe = function (gdata, r) {
    $(r.split(/[\r\n]+/g)).each(function (i) {

        if (i < 5) {
            var defhs = this.split(' ');
            gdata[defhs[0]] = parseFloat(defhs[defhs.length - 1]);
        }
        else {
            if (i == 5) {
                gdata['xcellsize'] = gdata['ycellsize'] = gdata['cellsize'];
            }
            $(this.split(' ')).each(function (xidx, v) {
                if (this.trim() == "")
                    return;
                if (v > 0) {
                    var x = gdata.xllcorner + xidx * gdata.xcellsize;
                    var y = gdata.yllcorner + (gdata.nrows - (i - 5)) * gdata.ycellsize;
                    gdata.datas.push([x, y, v]);
                }
            });
        }
    });
}
L.DouLayer.Qqesums.Parser.sqpe = function (gdata, r) { //氣象局預報1小時(資料精簡版),有時會回傳所有資料
    var lines = r.split(/[\r\n]+/g);
    var parserbasedef = function (lstr) {
        var temps = lstr.split(',');
        gdata.ncols = parseInt(temps[0]);
        gdata.nrows = parseInt(temps[1]);
        gdata.xllcorner = parseFloat(temps[3]);
        gdata.yllcorner = parseFloat(temps[4]);
        gdata.xcellsize = (parseFloat(temps[5]) - gdata.xllcorner) / (gdata.ncols - 1);
        gdata.ycellsize = (parseFloat(temps[6]) - gdata.yllcorner) / (gdata.nrows - 1);
    }
    var parsercolordef = function (lstr) {
        var temps = lstr.split(',');
        gdata.colorDef = [];
        for (var i = 0; i < temps.length; i++) {
            var c = { color: '#' + convertToHex(parseInt(temps[i])) + convertToHex(parseInt(temps[++i])) + convertToHex(parseInt(temps[++i])), min: temps[++i] / 10 };
            gdata.colorDef.push(c);
        }
        gdata.colorDef.sort(function (a, b) {
            return a.min - b.min;
        });
    }
    var convertToHex = function (num) {
        var r = num.toString(16);
        if (r.length == 1) r = '0' + r;
        return r;
    }
    if (lines.length == 7) {
        //第1行
        parserbasedef(lines[0]);
        //第3行 color legend
        parsercolordef(lines[2]);

        //補max
        for (var i = 0; i < gdata.colorDef.length; i++) {
            if (i == gdata.colorDef.length - 1)
                gdata.colorDef[i].max = 99999;
            else
                gdata.colorDef[i].max = gdata.colorDef[i + 1].min;
        }
        gdata.colorDef.reverse();
        //第4行 有資料cell數
        var ndv = parseInt(lines[3].split(':')[1]);
        //第5、6、7資料段
        var colIdx = lines[4].split(':')[1].split(',');
        var rowPtr = lines[5].split(':')[1].split(',');
        var vals = lines[6].split(':')[1].split(',');
        var il = colIdx.length; //
        var rl = rowPtr.length; //rl=nrows+1, index:n~n+1代表row=n的對應col有值筆數
        var vl = vals.length;
        var cidx = 0;
        gdata.datas = [];
        for (var i = 1; i < rl; i++) { //i代筆rowidx = i-1;
            var rowidx = i - 1;
            var y = gdata.yllcorner + rowidx * gdata.ycellsize;

            var ds = parseInt(rowPtr[i - 1]);
            var de = parseInt(rowPtr[i]);
            //de-ds>0代表該row有資料
            for (var d = ds; d < de; d++) {
                var x = gdata.xllcorner + parseInt(colIdx[d]) * gdata.xcellsize;
                var v = parseInt(vals[d]) / 10;
                gdata.datas.push([x, y, v]);
            }
        }
    }
    else {
        //第1行
        parserbasedef(lines[0]);
        //第3行 color legend
        parsercolordef(lines[2]);
        //地4行後全資料
        gdata.datas = [];
        if (lines.length == gdata.nrows + 3)
            for (var i = 3; i < lines.length; i++) {
                $(lines[i].split(',')).each(function (xidx, v) {
                    if (this.trim() == "")
                        return;
                    if (v > 0) {
                        var x = gdata.xllcorner + xidx * gdata.xcellsize;
                        //var y = gdata.yllcorner + (gdata.nrows - (i - 3)) * gdata.ycellsize;
                        var y = gdata.yllcorner + (i - 3) * gdata.ycellsize;
                        gdata.datas.push([x, y, v/10]);
                    }
                });
            }
    }
}

