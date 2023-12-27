/**
 * @class L.Draw.Marker
 * @aka Draw.Marker
 * @inherits L.Draw.Feature
 */
L.Draw.TextMarker = L.Draw.Marker.extend({
	statics: {
		TYPE: 'textmarker'
	},

	options: {
		icon: L.divIcon({
			html: '<div class="draw-text-contanier"><input type="text"/><span class="btn btn-outline-info glyphicon glyphicon-ok"></span><div>',
			html: '<div class="input-group draw-text-contanier" id="' + guid + '" ><input type="text" class="form-control" placeholder="請輸入標註文字"><div class="input-group-append"><span class="input-group-text glyphicon glyphicon-ok"></span></div></div>',
			className: 'textIcon',
			iconSize: [200, 32],
			iconAnchor: [100, 17]
		}),
		repeatMode: false,
		zIndexOffset: 2000 // This should be > than the highest z-index any markers
	},

	// @method initialize(): void
	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.TextMarker.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.marker.tooltip.start;

		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	// @method addHooks(): void
	// Add listener hooks to this handler.
	addHooks: function () {
		L.Draw.Marker.prototype.addHooks.call(this);

	},

	// @method removeHooks(): void
	// Remove listener hooks from this handler.
	removeHooks: function () {
		L.Draw.Marker.prototype.removeHooks.call(this);
	}
});


(function () {

	L.TextIcon = L.Icon.extend({
		options: L.extend({
			className: 'leaflet-div-icon',
			//getIconUrl: function (color) {
			//	//if (L.Browser.retina) - use 2x version
			//	return '/images/marker-hole-' + (color || 'blue') + '.svg'
			//}
		}, new L.Icon.Default().options),

		initialize: function (options) {
			L.extend(options, {
				shadowUrl: L.Icon.Default.imagePath + '/marker-shadow.png'
			});
			L.setOptions(this, options);
			var iconUrl = this.options.getIconUrl(this.options.color);
			this._iconImg = this._createImg(iconUrl);
		},
		createIcon: function () {
			//var textDiv = document.createElement('div');
			//textDiv.className = 'icon-text';
			//textDiv.innerHTML = this.options.text || '';

			//var div = document.createElement('div');
			//div.appendChild(this._iconImg);
			//div.appendChild(textDiv);

			//this._setIconStyles(div, 'icon');
			//this._textDiv = textDiv;
			//return div;
			var textDiv = document.createElement('div');
			textDiv.className = 'icon-text';
			textDiv.innerHTML = this.options.text || '';
			this._textDiv = textDiv;
			return textDiv;
		},
		setColor: function (color) {
			this._iconImg.src = this.options.getIconUrl(color);
		},
		setText: function (text) {
			this._textDiv.innerHTML = text || '';
		}
	});

}());

