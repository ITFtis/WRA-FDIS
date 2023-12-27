/**
 * @class L.Draw.Polyline
 * @aka Draw.Polyline
 * @inherits L.Draw.Feature
 */
L.DrawExt = {};
L.DrawExt.Freeline = L.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'freeline'
	},

	//Poly: L.Polyline,

	options: {
	    shapeOptions: {
	        stroke: true,
	        color: '#3388ff',
	        weight: 4,
	        opacity: 0.5,
	        fill: true,
	        fillColor: null, //same as color by default
	        fillOpacity: 0.2,
	        clickable: true
	    },
	    showRadius: true,
	    metric: true, // Whether to use the metric measurement system or imperial
	    feet: true, // When not metric, use feet instead of yards for display
	    nautic: false // When not metric, not feet use nautic mile for display
	},

    // @method initialize(): void
	initialize: function (map, options) {
	    // Save the type so super can fire, need to do this as cannot do this.TYPE :(
	    this.type = L.Draw.Polyline.TYPE;

	    this._initialLabelText = L.drawLocal.draw.handlers.circle.tooltip.start;
	    this._measurementRunningTotal = 0;
	    this._tooltipUpdateContentTimer = 0;

	    L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_drawLine: function (latlng) {
	    // Calculate the distance based on the version
	    //if (L.GeometryUtil.isVersion07x()) {
	    //    var distance = this._startLatLng.distanceTo(latlng);
	    //} else {
	    //    var distance = this._map.distance(this._startLatLng, latlng);
	    //}

	    if (!this._shape) {
	        this._shape = new L.polyline([this._startLatLng, latlng], this.options.shapeOptions);
	        this._map.addLayer(this._shape);
	    } else {
	        this._shape.addLatLng(latlng);
	    }
	},

	_fireCreatedEvent: function () {
	    var fline = new L.Polyline( this._shape.getLatLngs(), this.options.shapeOptions);
	    L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, fline);
	    this._previousLatLng = null;
	    this._measurementRunningTotal = 0;
	    clearTimeout(this._tooltipUpdateContentTimer);
	    setTimeout(function () {
	        if (this._tooltip) {
	            this._tooltip.dispose();
	            this._tooltip = null;
	        }
	    },100);
	},
	_getMeasurementString: function () {
	    var currentLatLng = this._currentLatLng,
			previousLatLng = this._previousLatLng || this._startLatLng,
			distance;

	    // Calculate the distance from the last fixed point to the mouse position based on the version
	    if (L.GeometryUtil.isVersion07x()) {
	        distance = previousLatLng && currentLatLng && currentLatLng.distanceTo ? this._measurementRunningTotal + currentLatLng.distanceTo(previousLatLng) * (this.options.factor || 1) : this._measurementRunningTotal || 0;
	    } else {
	        distance = previousLatLng && currentLatLng ? this._measurementRunningTotal + this._map.distance(currentLatLng, previousLatLng) * (this.options.factor || 1) : this._measurementRunningTotal || 0;
	    }
	    this._measurementRunningTotal = distance;
	    return L.GeometryUtil.readableDistance(distance, this.options.metric, this.options.feet, this.options.nautic, this.options.precision);
	},
	_onMouseMove: function (e) {
	    var that = this;
	    var latlng = e.latlng,
			showRadius = this.options.showRadius,
			useMetric = this.options.metric;

	    this._currentLatLng = latlng;
	    
	    if (this._isDrawing) {
	        this._drawLine(latlng);

	        var _subtext= this._getMeasurementString();
	        clearTimeout(this._tooltipUpdateContentTimer);
	        this._tooltipUpdateContentTimer = setTimeout(function () {
	            that._tooltip.updatePosition(latlng);
	            that._tooltip.updateContent({
	                text: L.drawLocal.draw.handlers.freeline.tooltip.cont,
	                subtext: _subtext
	            });
	        },200);
	        this._previousLatLng = latlng;
	    }
	    else {
	        this._tooltip.updatePosition(latlng);
	        //that._tooltip.updateContent({
	        //    text: L.drawLocal.draw.handlers.freeline.tooltip.start,
	        //});
	    }
	    
	}
});

if (L.Draw && L.Draw.Polyline) {
    var _addVertex = L.Draw.Polyline.prototype.addVertex;
    L.Draw.Polyline.prototype.addVertex = function (latlng) {
        var that = this;
        _addVertex.call(this, latlng);
        if (that.options.pasticon) {
            $.each(this._markers, function (idx) {
                if ((that.type == L.Draw.Polygon.TYPE && idx == 0) || (that.type == L.Draw.Polyline.TYPE && idx == that._markers.length-1))
                    return;
                this.setIcon(that.options.pasticon);
            });
        }
    }
}
