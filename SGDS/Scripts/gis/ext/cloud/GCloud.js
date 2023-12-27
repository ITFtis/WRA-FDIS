var GCloud = function (ctrl, inicallback) {
    this.ctrl = ctrl;
    this.map = ctrl.map;
    this.currentOverlay = undefined;
    this.currentOpacity = 0.9;
    setTimeout(function () { inicallback(); });

    return this;
};

GCloud.prototype.initLayer = function () {
};
GCloud.prototype.show = function () {
    if (this.currentOverlay)
        this.currentOverlay.setMap(this.map);
};
GCloud.prototype.hide = function () {
    if (this.currentOverlay)
        this.currentOverlay.setMap(null);
};
GCloud.prototype.removeAllImages = function () {
    if (this.currentOverlay)
        this.currentOverlay.setMap(null);
};
GCloud.prototype.addImages = function (_displayCloud, url) {
    var current = this;
    var imageBounds = new google.maps.LatLngBounds(
     new google.maps.LatLng(_displayCloud.ymin, _displayCloud.xmin),
     new google.maps.LatLng(_displayCloud.ymax, _displayCloud.xmax));

    var newOverlay = new google.maps.GroundOverlay(url, imageBounds, { map: this.map, opacity: this.currentOpacity }); //1.東南亞imageBounds對不齊??;2.GroundOverlay zoom in out會卡卡的

    //var newOverlay = new USGSOverlay(imageBounds, url, this.map, this.currentOpacity); //無法將zindex一至最下層
    
    setTimeout(function () {
        current.removeAllImages();
        current.currentOverlay = newOverlay;
    }, this.ctrl.settings.activeInterval / 10);
};
GCloud.prototype.setOpacity = function (_opacity) {
    if (this.currentOverlay)
        this.currentOverlay.setOpacity(_opacity);
    this.currentOpacity = _opacity;
};


USGSOverlay.prototype = new google.maps.OverlayView();
/** @constructor */
function USGSOverlay(bounds, image, map, _opacity) {

    // Now initialize all properties.
    this.bounds_ = bounds;
    this.image_ = image;
    this.map_ = map;
    this.opacity_ = _opacity;

    // Define a property to hold the image's div. We'll
    // actually create this div upon receipt of the onAdd()
    // method so we'll leave it null for now.
    this.div_ = null;

    // Explicitly call setMap on this overlay
    this.setMap(map);
}

/**
 * onAdd is called when the map's panes are ready and the overlay has been
 * added to the map.
 */
USGSOverlay.prototype.onAdd = function () {

    var div = document.createElement('div');
    div.style.border = 'none';
    div.style.borderWidth = '0px';
    div.style.position = 'absolute';
    //div.style.zIndex = '0';

    // Create the img element and attach it to the div.
    var img = document.createElement('img');
    img.src = this.image_;
    img.style.width = '100%';
    img.style.height = '100%';
    div.appendChild(img);

    this.div_ = div;
    this.setOpacity(this.opacity_);
    // Add the element to the "overlayImage" pane.
    var panes = this.getPanes();
    panes.overlayImage.appendChild(this.div_);
};

USGSOverlay.prototype.draw = function () {

    // We use the south-west and north-east
    // coordinates of the overlay to peg it to the correct position and size.
    // To do this, we need to retrieve the projection from the overlay.
    var overlayProjection = this.getProjection();

    // Retrieve the south-west and north-east coordinates of this overlay
    // in LatLngs and convert them to pixel coordinates.
    // We'll use these coordinates to resize the div.
    var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
    var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

    // Resize the image's div to fit the indicated dimensions.
    var div = this.div_;
    div.style.left = sw.x + 'px';
    div.style.top = ne.y + 'px';
    div.style.width = (ne.x - sw.x) + 'px';
    div.style.height = (sw.y - ne.y) + 'px';
};

USGSOverlay.prototype.onRemove = function () {
    this.div_.parentNode.removeChild(this.div_);
};

// Set the visibility to 'hidden' or 'visible'.
USGSOverlay.prototype.hide = function () {
    if (this.div_) {
        // The visibility property must be a string enclosed in quotes.
        this.div_.style.visibility = 'hidden';
    }
};

USGSOverlay.prototype.show = function () {
    if (this.div_) {
        this.div_.style.visibility = 'visible';
    }
};

USGSOverlay.prototype.toggle = function () {
    if (this.div_) {
        if (this.div_.style.visibility == 'hidden') {
            this.show();
        } else {
            this.hide();
        }
    }
};
USGSOverlay.prototype.setOpacity = function (v) {
    if (this.div_) {
        this.div_.style.opacity = v;
        this.opacity_ = v;
    }
};
// Detach the map from the DOM via toggleDOM().
// Note that if we later reattach the map, it will be visible again,
// because the containing <div> is recreated in the overlay's onAdd() method.
USGSOverlay.prototype.toggleDOM = function () {
    if (this.getMap()) {
        // Note: setMap(null) calls OverlayView.onRemove()
        this.setMap(null);
    } else {
        this.setMap(this.map_);
    }
};

