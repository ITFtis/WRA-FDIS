(function () {
    var LBoundaryMap = function (ctrl, inicallback) {
        this.ctrl = ctrl;
        this.map = undefined;
        this._rect = undefined;
        setTimeout(function () { inicallback(); });

        return this;
    };
    LBoundaryMap.prototype.initMap = function () {
        var current = this;
        var mapOptions = {
            center: [23.8, 121],
            mapTypeControl: false,
            overviewMapControl: false,
            panControl: false,
            rotateControl: false,
            scaleControl: false,
            streetViewControl: false,
            zoom: 8,
            trackResize:true,
            zoomControl:false,
            mapTypeId: "emptyMapType" // google.maps.MapTypeId.ROADMAP//"null"//
            //mapTypeId: google.maps.MapTypeId.ROADMAP//"null"//
        };
        this.map = L.map(this.ctrl.$element[0], mapOptions);
        this.resize();

       this.map.on('click', function (evt) {
           //var m = current.map;
           //if(evt.target== evt.originalEvent.target)
                current.ctrl.$element.trigger("map-click", evt);
        });
        //google.maps.event.addListener(this.map, 'tilt_changed', function (evt) {
            
        //    setTimeout(function () {
        //        $(current.ctrl.$element[0]).find('img[src*="google4.png"]').hide(); //google icon
        //        $(current.ctrl.$element[0]).find('a[href*="terms_maps.html"]').hide();//使用條款
        //    },10);a
        //});

        //this.map.mapTypes.set('emptyMapType',
        //           new EmptyMapType(new google.maps.Size(256, 256)));

        //L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //    //    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        //}).addTo(this.map);
        //setTimeout(function () {
        //    //alert('');
        //    current.resize();

        //    current.map.setView(mapOptions.center, mapOptions.zoom);
        //},3000)
        return this.map;
    };
    //LBoundaryMap.prototype.setBoundaryMap = function (boundarysurl) {
    //    var current = this;
    //    var _boundary = new window.boundary.PolygonBoundary(
    //        {
    //            map: this.map,
    //            data: boundarysurl,
    //            style: { fillOpacity: .1, mouseOver: { enable: true, cursor: "pointer", fillOpacity: .1 } },
    //            click: function (data, graphic, evt) {
    //                alert(data.Name);
    //            }
    //        }, function (boundarys) {
    //            window.boundary.GetBoundaryDataRect(boundarysurl, ["高雄市", "宜蘭縣"], function (rect) {
    //                console.log("Boubndary rect.minx:" + rect.minx + " rect.miny:" + rect.miny + " rect.maxx:" + rect.maxx + " rect.maxy:" + rect.maxy);
    //                current.map.fitBounds(new google.maps.LatLngBounds(new google.maps.LatLng(rect.miny, rect.minx), new google.maps.LatLng(rect.maxy, rect.maxx)));
    //                current.ctrl.$element.trigger(boundaryMap.event.load_boundary_completed);
    //            });
    //        }
    //    )
    //};
    LBoundaryMap.prototype.fitBounds = function (_rect) {
        this._rect = _rect;
        this.resize();
       
    };
    LBoundaryMap.prototype.resize = function () {
        this.map.fireEvent('resize');
        this.map.invalidateSize();
        if(this._rect)
            this.map.fitBounds([[this._rect.miny, this._rect.minx],[this._rect.maxy, this._rect.maxx]]);
    };



    //function EmptyMapType(tileSize) {
    //    this.tileSize = tileSize;
    //}

    //EmptyMapType.prototype.maxZoom = 19;
    //EmptyMapType.prototype.name = 'Empty #s';
    //EmptyMapType.prototype.alt = 'Empty Map Type';

    //EmptyMapType.prototype.getTile = function (coord, zoom, ownerDocument) {
    //    var div = ownerDocument.createElement('div');
    //    //div.innerHTML = coord;
    //    div.style.width = this.tileSize.width + 'px';
    //    div.style.height = this.tileSize.height + 'px';
    //    //div.style.fontSize = '10';
    //    //div.style.borderStyle = 'solid';
    //    //div.style.borderWidth = '1px';
    //    //div.style.borderColor = '#AAAAAA';
    //    //div.style.backgroundColor = '#E5E3DF';
    //    return div;
    //};

    window.LBoundaryMap = LBoundaryMap;
})(window);