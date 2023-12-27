/****only for arcgis*****/
(function () {
    var RasterLayer = function (options) {// completed_callback畫完後回call
        this.map = options.map;
        this.displayAllCellInScreen = true; //在Canvas用劃的情況下，如全部資料都在視窗下，在pan時就不從劃
        this.dataCanvas = undefined;    
        this.rasterData = $.extend({}, raster.RasterData);
        this.opacity = 0.6;
        this._id = new Date().getTime();

        var current = this;
        this.map.on("pan-end", function () {
            if (!current.displayAllCellInScreen) //
                current._drawRasterData();
        });
        this.map.on("zoom-end", function () {
            current._drawRasterData();
        });
       
        this.map.on("resize", function () {
            setTimeout(function () {
                if (!current.displayAllCellInScreen) //
                    current._drawRasterData();
            });
        });
       
        if (options.click) {
            //$(document).on("click", "#" + this._id, function (evt) { //chrome有問題 , Canvas會被蓋掉(id:map_gc)
            $(document).on("click", function (evt) {
                if (evt.target) {
                    console.log("evt.target.id:" + evt.target.id + " current._id:" + current._id);
                    if (evt.target.id != current._id && evt.target.id != current.map.id + "_gc")
                        return;
                    var r = current._getValueInScreen(evt.clientX, evt.clientY);
                    if (r) {
                        options.click.call(null, r);
                        console.log("click" + JSON.stringify(r));
                    }
                }
            });
        }
        //}
        if (options.mousemove) {
            //$(document).on("mousemove", "#" + this._id, function (evt) {
            $(document).on("mousemove", function (evt) {
                if (evt.target) {
                    if (evt.target.id != current._id && evt.target.id != current.map.id + "_gc")
                        return;
                    var r = current._getValueInScreen(evt.clientX, evt.clientY);
                    if (r) {
                        options.mousemove.call(null, r);
                        console.log("move" + JSON.stringify(r));
                    }
                }
            });
        }
    };
    
   
    //給資料
    RasterLayer.prototype.setData = function(datas){
        this.rasterData = $.extend(this.rasterData, datas);
        this.rasterData.colorDef.sort(function (c1, c2) { return c2.min - c1.min; });
        this.rasterData.colorData = undefined;
        this.drawImageCanvasSource = undefined;
        
        this.currentDataCanvas = undefined;
        this.cacheCanvas = {};

        this._drawRasterData();
        var current = this;
      
    };
    RasterLayer.prototype._drawRasterData = function () {
        this._clearCanvasLayer();
        if (!this.rasterData.data || this.rasterData.data.length == 0)
            return;
        var current = this;
        if (this.map.getZoom() > this.rasterData.level) {
            //setTimeout(function () {
            current._drawRasterForFillRect(current.map.getZoom()); //高解析
            //}, 100);
        }
        else
            this._drawRasterForDrawImage();    //drawimage
    }
    /******用Canvas的drawImage(效能快，解析度一般)*****/
    RasterLayer.prototype._drawRasterForDrawImage = function () {
         var current = this;
         this.displayAllCellInScreen = false;
         var numColumns = this.rasterData.ncols, numRows = this.rasterData.nrows, size = this.rasterData.cellSize, qdata = this.rasterData.data, noDataValue = current.rasterData.noDataValue;
        if (!this.drawImageCanvasSource) {
            this.drawImageCanvasSource = document.createElement('canvas');

            
            //var data = $.get('data/compref_Test.txt', function (r) {
            var ctxs = this.drawImageCanvasSource.getContext('2d');
            var id = ctxs.createImageData(numColumns, numRows);
            this.drawImageCanvasSource.width = numColumns;
            this.drawImageCanvasSource.height = numRows;
            $(qdata).each(function (i) {
                var value = parseFloat(this);
               
                if (value <= noDataValue || !value)
                    return;
                //var color = colors[Math.floor(value / 36)];
                var color = colorToIntArray(getcolor(current.rasterData.colorDef, value));// colors[Math.floor(value) % colors.length]
                if (!color) return;
                id.data[i * 4] = color[0];
                id.data[i * 4 + 1] = color[1];
                id.data[i * 4 + 2] = color[2];
                id.data[i * 4 + 3] = 255;
               
            });
            ctxs.putImageData(id, 0, 0);
        }

       
        
        require(["esri/geometry/Point", "esri/SpatialReference", "esri/geometry/webMercatorUtils", "dojo/dom-construct"], function (Point, SpatialReference, webMercatorUtils, domConstruct) {

            //if (this.currentDataCanvas)
            //    $(this.currentDataCanvas).remove();
            current.currentDataCanvas = current._createCanvasLayer(domConstruct);

            
            var lowerLeftCorner = new Point(current.rasterData.xllcorner, current.rasterData.yllcorner, new SpatialReference({ wkid: current.rasterData.wkid }));
            var topLeftCorner = lowerLeftCorner.offset(0, (numRows - 1) * size);
            var bottomRightCorner = lowerLeftCorner.offset((numColumns - 1) * size, 0);

            topLeftCorner = current.map.toScreen(topLeftCorner);
            bottomRightCorner = current.map.toScreen(bottomRightCorner);
            var dataWidth = bottomRightCorner.x - topLeftCorner.x;
            var dataHeight = bottomRightCorner.y - topLeftCorner.y;
            //var cellWidth = Math.ceil(dataWidth / numColumns), cellHeight = Math.ceil(dataHeight / numRows); //每一cell size 座標 >=cellWidthR
            var cellWidth = dataWidth / numColumns, cellHeight =dataHeight / numRows; //每一cell size 座標 >=cellWidthR

            var extent = webMercatorUtils.webMercatorToGeographic( current.map.extent);
            if (topLeftCorner.x > current.map.width)
                return;
            
            var ssx = (topLeftCorner.x < 0 ? -topLeftCorner.x  : 0)/cellWidth;
            var ssy = (topLeftCorner.y < 0 ? -topLeftCorner.y  : 0)/cellHeight;
            var ssw = (current.map.width > bottomRightCorner.x ? bottomRightCorner.x : current.map.width) / cellWidth - (topLeftCorner.x>0?topLeftCorner.x:0)/cellWidth;
            var ssh = (current.map.height > bottomRightCorner.y ? bottomRightCorner.y : current.map.height) / cellHeight - (topLeftCorner.y > 0 ? topLeftCorner.y : 0) / cellHeight;
            
            var tsx = topLeftCorner.x < 0 ? 0 : topLeftCorner.x;
            var tsy = topLeftCorner.y < 0 ? 0 : topLeftCorner.y;
            var tsw = (current.map.width > bottomRightCorner.x ? bottomRightCorner.x : current.map.width) - tsx;
            var tsh = (current.map.height > bottomRightCorner.y ? bottomRightCorner.y : current.map.height) - tsy;
            
            var ctx = current.currentDataCanvas.getContext('2d');
            var bdom = document.getElementById(current.map.id + "_basemaplayer");
            //ctx.drawImage(current.drawImageCanvasSource,ssx,ssy,ssw,ssh,tsx,tsy,tsw,tsh);
            //current.currentDataCanvas.style.transform = "translate(" + (-getComputedTranslateX(bdom)) + "px, " + (-getComputedTranslateY(bdom)) + "px)";//  document.getElementById("map_basemaplayer").style.transform;

            //將重設currentDataCanvas 長寬
            current.currentDataCanvas.width = tsw;
            current.currentDataCanvas.height = tsh;
            ctx.drawImage(current.drawImageCanvasSource, ssx, ssy, ssw, ssh, 0, 0, tsw, tsh);
            current.currentDataCanvas.style.transform = "translate(" + (-getComputedTranslateX(bdom) + tsx) + "px, " + (-getComputedTranslateY(bdom) + tsy) + "px)";
        });
    };

    RasterLayer.prototype._getRasterParentContainer = function () {
        //return $("#" + this.map.id + "_layers");
        return $("#" + this.map.id + "_basemaplayer > div")// 和底圖同一層
    };
    RasterLayer.prototype._createCanvasLayer = function (domConstruct) {
        return domConstruct.create("canvas", {
            id: this._id,
            class: "raster-canvas id_"+this._id,
            width: this.map.width + "px",
            height: this.map.height + "px",
            style: "position: absolute; left: 0px; top: 0px;z-index:99;    background-color: black;;opacity:" + this.opacity,
        }, this._getRasterParentContainer()[0]); //和底圖同一層
    };
    RasterLayer.prototype._clearCanvasLayer = function () {
        //$("#" + this._id).remove(); //用id selector 只會找一個
        $(".id_" + this._id, this._getRasterParentContainer()).remove(); //在輪播及UI持續zoom 時會有同時存在多Canvas問題
    };
    var getcolor = function (colorDef, v) {
        for (var i = 0; i < colorDef.length; i++) {
            if (v >= colorDef[i].min)
                return colorDef[i].color;
        }
    };
    var colorToIntArray = function (colorstr) {
        var r = [];
        if (colorstr.length != 7)
            console.log("colorstr 有問題:" + colorstr);
        r.push(parseInt(colorstr.substr(1, 2), 16));
        r.push(parseInt(colorstr.substr(3, 2), 16));
        r.push(parseInt(colorstr.substr(5, 2), 16));
        return r;
    };

    /******用Canvas的fillRect(效能一般，解析度高)*****/
    RasterLayer.prototype._drawRasterForFillRect = function(zl){
        if(this.rasterData.ncols==0){
            console.log("無raster資料");
            return;
        }
        console.log("start _drawRasterData");
        var current = this;
        var numColumns = this.rasterData.ncols, numRows = this.rasterData.nrows, size = this.rasterData.cellSize,
            qdata = this.rasterData.data, noDataValue = this.rasterData.noDataValue;
        if (!this.rasterData.colorData) {
            this.rasterData.colorData = [];
            var st = new Date().getTime();
            $.each(qdata, function (idx) {
                current.rasterData.colorData.push({ value: this, color: this > noDataValue ? getcolor(current.rasterData.colorDef, this) : undefined });
            });
            console.log("tottal1:" + (new Date().getTime()-st));
        }
        require(["esri/geometry/Point", "esri/SpatialReference", "dojo/dom-construct"], function (Point, SpatialReference, domConstruct) {
           
            current.displayAllCellInScreen = true;
           
    
            var lowerLeftCorner = new Point(current.rasterData.xllcorner, current.rasterData.yllcorner, new SpatialReference({ wkid: current.rasterData.wkid }));
            var topLeftCorner = lowerLeftCorner.offset(0, (numRows-1) * size);
            var bottomRightCorner = lowerLeftCorner.offset((numColumns-1) * size, 0);

            //console.log("geo topLeftCorner.x:" + topLeftCorner.x + "  topLeftCorner.y:" + topLeftCorner.y + " bottomRightCorner.x:" + bottomRightCorner.x + "  bottomRightCorner.y:" + bottomRightCorner.y);


            topLeftCorner = current.map.toScreen(topLeftCorner);
            bottomRightCorner = current.map.toScreen(bottomRightCorner);
            var dataWidth = bottomRightCorner.x - topLeftCorner.x;
            var dataHeight = bottomRightCorner.y - topLeftCorner.y;
            var cellWidth = Math.ceil(dataWidth / numColumns), cellHeight = Math.ceil(dataHeight / numRows); //每一cell size px >=cellWidthR
            var cellWidthR = dataWidth / numColumns, cellHeightR = dataHeight / numRows; //每一cell size px

            //Draw
            var top = topLeftCorner.y;
            var leftInSereen = 99999, topInScreen =99999, rightInScreen = -99999, bottomInScreen = -99999;
            var st = new Date().getTime();
            var fillRectDatas = [];
            var st = new Date().getTime();
            for (var row = 0; row < numRows; row++) {
                var left = topLeftCorner.x;
                
                for (var col = 0; col < numColumns; col++) {
                    
                    if (top > current.map.height || left > current.map.width)
                        current.displayAllCellInScreen = false;
                   
                    else if(top>-cellHeight && left > -cellWidth){
                        //var v = qdata[row * numColumns + col];
                        var v = current.rasterData.colorData[row * numColumns + col];
                        //if (v > noDataValue) {
                        if (v.color) {
                            //if (hhhh ||( row % 2 == 0 && col % 2 == 0)) {
                            var _l = Math.floor(left), _t = Math.floor(top), _cw, _ch;
                            _cw = _l >= 0 ? cellWidth : cellWidth + _l;
                            _ch = _t >= 0 ? cellHeight : cellHeight + _t;
                            if (_l < 0) _l = 0;
                            if (_t < 0) _t = 0;
                            if ((_l + _cw) > current.map.width) _cw = current.map.width - _l;
                            if ((_t + _ch) > current.map.height) _ch = current.map.height - _t;
                          

                            if (_cw != 0 && _ch != 0)
                                fillRectDatas.push({ left: _l, top: _t, width: _cw, height: _ch, fill: v.color });
                                //fillRectDatas.push({left:_l, top:_t, width:_cw, height:_ch, fill:getcolor(current.rasterData.colorDef, v)});
                        }
                    }
                    else{
                        current.displayAllCellInScreen = false;
                    }
                    left += cellWidthR;
                    if (left >= current.map.width)
                        break;
                }
                //top = Math.floor( top += cellHeightR);
                top += cellHeightR;
                if (top >= current.map.height)
                    break;
            }
            console.log("tottal2:" + (new Date().getTime() - st));
            $.each(fillRectDatas, function () {
                if (leftInSereen > this.left) leftInSereen = this.left;
                if (topInScreen > this.top) topInScreen = this.top;
                if (rightInScreen < this.left + this.width) rightInScreen = this.left + this.width;
                if (bottomInScreen < this.top + this.height) bottomInScreen = this.top + this.height;
            });

           
           current.currentDataCanvas = current._createCanvasLayer(domConstruct);


            //console.log("Total:" + (new Date().getTime() - st) + " width:" + current.currentDataCanvas.width + " height:" + current.currentDataCanvas.height +
            //    " leftInSereen:" + leftInSereen + " topInScreen:" + topInScreen + " rightInScreen:" + rightInScreen + " bottomInScreen:" + bottomInScreen);
            //st = new Date().getTime();
            
            //if (!current.cacheCanvas.zl) {
                //將重設currentDataCanvas 長寬
                current.currentDataCanvas.width = rightInScreen - leftInSereen;
                current.currentDataCanvas.height = bottomInScreen - topInScreen;

                var ctx = current.currentDataCanvas.getContext("2d");
                var _paintCanvas = function () {
                    $.each(fillRectDatas, function () {
                        ctx.fillStyle = this.fill;
                        ctx.fillRect(this.left - leftInSereen, this.top - topInScreen, this.width, this.height);
                    });
                }
                if (requestAnimationFrame)
                    requestAnimationFrame(_paintCanvas);
                else
                    _paintCanvas();

                //console.log("2Total:" + (new Date().getTime() - st));
            //}
            //設定currentDataCanvas transform
            var bdom = document.getElementById(current.map.id + "_basemaplayer");
            current.currentDataCanvas.style.transform = "translate(" + (-getComputedTranslateX(bdom) + leftInSereen) + "px, " + (-getComputedTranslateY(bdom)+topInScreen) + "px)";//  document.getElementById("map_basemaplayer").style.transform;
            console.log("draw end displayAllCellInScreen:" + current.displayAllCellInScreen);
          
        });
    };

    //透明度
    RasterLayer.prototype.setOpacity = function (v) {
        this.opacity = v;
        if (this.currentDataCanvas)
            this.currentDataCanvas.style.opacity = v;
    }
    //取值
    RasterLayer.prototype._getValueInScreen = function (x, y) {
        var numColumns = this.rasterData.ncols, numRows = this.rasterData.nrows, size = this.rasterData.cellSize,
               qdata = this.rasterData.data, noDataValue = this.rasterData.noDataValue;
        Point = esri.geometry.Point;
        SpatialReference = esri.SpatialReference;
        var lowerLeftCorner = new Point(this.rasterData.xllcorner, this.rasterData.yllcorner, new SpatialReference({ wkid: this.rasterData.wkid }));
        var topLeftCorner = lowerLeftCorner.offset(0, (numRows - 1) * size);
        var bottomRightCorner = lowerLeftCorner.offset((numColumns - 1) * size, 0);

        topLeftCorner = this.map.toScreen(topLeftCorner);
        bottomRightCorner = this.map.toScreen(bottomRightCorner);
        var dataWidth = bottomRightCorner.x - topLeftCorner.x;
        var dataHeight = bottomRightCorner.y - topLeftCorner.y;
        //var cellWidth = Math.ceil(dataWidth / numColumns), cellHeight = Math.ceil(dataHeight / numRows); //每一cell size px >=cellWidthR
        var cellWidth = dataWidth / numColumns, cellHeight = dataHeight / numRows; //每一cell size px
        var colidx = Math.floor((x - topLeftCorner.x) / cellWidth);
        var rowidx = Math.floor((y - topLeftCorner.y) / cellHeight);
        var value = noDataValue;
        if (rowidx >= 0 && rowidx < numRows && colidx >= 0 && colidx < numColumns) {
            value = qdata[rowidx * numColumns + colidx];
        }
        if (value > noDataValue) {
            return { rowidx: rowidx, colidx: colidx, value: value };
        }
    };
    function getComputedTranslateY(obj) {
        if(!window.getComputedStyle) return;
        var style = getComputedStyle(obj),
            transform = style.transform || style.webkitTransform || style.mozTransform;
        var mat = transform.match(/^matrix3d\((.+)\)$/);
        if(mat) return parseFloat(mat[1].split(', ')[13]);
        mat = transform.match(/^matrix\((.+)\)$/);
        return mat ? parseFloat(mat[1].split(', ')[5]) : 0;
    }
    function getComputedTranslateX(obj) {
        if (!window.getComputedStyle) return;
        var style = getComputedStyle(obj),
            transform = style.transform || style.webkitTransform || style.mozTransform;
        var mat = transform.match(/^matrix3d\((.+)\)$/);
        if (mat) return parseFloat(mat[1].split(', ')[12]);
        mat = transform.match(/^matrix\((.+)\)$/);
        return mat ? parseFloat(mat[1].split(', ')[4]) : 0;
    }

    window.raster = {
        RasterLayer: RasterLayer,
        RasterData:{ xllcorner: 0, yllcorner: 0, cellSize: 0.012500000000, ncols: 0, nrows: 0, wkid: 4326, data: [], colorDef:[],noDataValue:0,level:8 }
    }
})(window);