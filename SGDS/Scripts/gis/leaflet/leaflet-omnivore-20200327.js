﻿!function (e) { if ("object" == typeof exports && "undefined" != typeof module) module.exports = e(); else if ("function" == typeof define && define.amd) define([], e); else { var o; "undefined" != typeof window ? o = window : "undefined" != typeof global ? o = global : "undefined" != typeof self && (o = self), o.omnivore = e() } }(function () {
    var define, module, exports; return (function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); throw new Error("Cannot find module '" + o + "'") } var f = n[o] = { exports: {} }; t[o][0].call(f.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, f, f.exports, e, t, n, r) } return n[o].exports } var i = typeof require == "function" && require; for (var o = 0; o < r.length; o++) s(r[o]); return s })({
        1: [function (_dereq_, module, exports) {
            var xhr = _dereq_('corslite'),
                csv2geojson = _dereq_('csv2geojson'),
                wellknown = _dereq_('wellknown'),
                topojson = _dereq_('topojson/topojson.js'),
                toGeoJSON = _dereq_('togeojson');

            module.exports.geojson = geojsonLoad;

            module.exports.topojson = topojsonLoad;
            module.exports.topojson.parse = topojsonParse;

            module.exports.csv = csvLoad;
            module.exports.csv.parse = csvParse;

            module.exports.gpx = gpxLoad;
            module.exports.gpx.parse = gpxParse;

            module.exports.kml = kmlLoad;
            module.exports.kml.parse = kmlParse;

            module.exports.wkt = wktLoad;
            module.exports.wkt.parse = wktParse;

            function addData(l, d) {
                if ('addData' in l) l.addData(d);
                if ('setGeoJSON' in l) l.setGeoJSON(d);
            }

            /**
             * Load a [GeoJSON](http://geojson.org/) document into a layer and return the layer.
             *
             * @param {string} url
             * @param {object} options
             * @param {object} customLayer
             * @returns {object}
             */
            function geojsonLoad(url, options, customLayer) {
                var layer = customLayer || L.geoJson();
                xhr(url, function (err, response) {
                    if (err) return layer.fire('error', { error: err });
                    addData(layer, JSON.parse(response.responseText));
                    layer.fire('ready');
                });
                return layer;
            }

            /**
             * Load a [TopoJSON](https://github.com/mbostock/topojson) document into a layer and return the layer.
             *
             * @param {string} url
             * @param {object} options
             * @param {object} customLayer
             * @returns {object}
             */
            function topojsonLoad(url, options, customLayer) {
                var layer = customLayer || L.geoJson();
                xhr(url, onload);
                function onload(err, response) {
                    if (err) return layer.fire('error', { error: err });
                    addData(layer, topojsonParse(response.responseText));
                    layer.fire('ready');
                }
                return layer;
            }

            /**
             * Load a CSV document into a layer and return the layer.
             *
             * @param {string} url
             * @param {object} options
             * @param {object} customLayer
             * @returns {object}
             */
            function csvLoad(url, options, customLayer) {
                var layer = customLayer || L.geoJson();
                xhr(url, onload);
                function onload(err, response) {
                    var error;
                    if (err) return layer.fire('error', { error: err });
                    function avoidReady() {
                        error = true;
                    }
                    layer.on('error', avoidReady);
                    csvParse(response.responseText, options, layer);
                    layer.off('error', avoidReady);
                    if (!error) layer.fire('ready');
                }
                return layer;
            }

            /**
             * Load a GPX document into a layer and return the layer.
             *
             * @param {string} url
             * @param {object} options
             * @param {object} customLayer
             * @returns {object}
             */
            function gpxLoad(url, options, customLayer) {
                var layer = customLayer || L.geoJson();
                xhr(url, onload);
                function onload(err, response) {
                    var error;
                    if (err) return layer.fire('error', { error: err });
                    function avoidReady() {
                        error = true;
                    }
                    layer.on('error', avoidReady);
                    gpxParse(response.responseXML || response.responseText, options, layer);
                    layer.off('error', avoidReady);
                    if (!error) layer.fire('ready');
                }
                return layer;
            }

            /**
             * Load a [KML](https://developers.google.com/kml/documentation/) document into a layer and return the layer.
             *
             * @param {string} url
             * @param {object} options
             * @param {object} customLayer
             * @returns {object}
             */
            function kmlLoad(url, options, customLayer) {
                var layer = customLayer || L.geoJson();
                xhr(url, onload);
                function onload(err, response) {
                    var error;
                    if (err) return layer.fire('error', { error: err });
                    function avoidReady() {
                        error = true;
                    }
                    layer.on('error', avoidReady);
                    kmlParse(response.responseXML || response.responseText, options, layer);
                    layer.off('error', avoidReady);
                    if (!error) layer.fire('ready');
                }
                return layer;
            }

            /**
             * Load a WKT (Well Known Text) string into a layer and return the layer
             *
             * @param {string} url
             * @param {object} options
             * @param {object} customLayer
             * @returns {object}
             */
            function wktLoad(url, options, customLayer) {
                var layer = customLayer || L.geoJson();
                xhr(url, onload);
                function onload(err, response) {
                    if (err) return layer.fire('error', { error: err });
                    wktParse(response.responseText, options, layer);
                    layer.fire('ready');
                }
                return layer;
            }

            function topojsonParse(data) {
                var o = typeof data === 'string' ?
                    JSON.parse(data) : data;
                var features = [];
                for (var i in o.objects) {
                    var ft = topojson.feature(o, o.objects[i]);
                    if (ft.features) features = features.concat(ft.features);
                    else features = features.concat([ft]);
                }
                return features;
            }

            function csvParse(csv, options, layer) {
                layer = layer || L.geoJson();
                options = options || {};
                csv2geojson.csv2geojson(csv, options, onparse);
                function onparse(err, geojson) {
                    if (err) return layer.fire('error', { error: err });
                    addData(layer, geojson);
                }
                return layer;
            }

            function gpxParse(gpx, options, layer) {
                var xml = parseXML(gpx);
                if (!xml) return layer.fire('error', {
                    error: 'Could not parse GPX'
                });
                layer = layer || L.geoJson();
                var geojson = toGeoJSON.gpx(xml);
                addData(layer, geojson);
                return layer;
            }


            function kmlParse(gpx, options, layer) {
                var xml = parseXML(gpx);
                if (!xml) return layer.fire('error', {
                    error: 'Could not parse GPX'
                });
                layer = layer || L.geoJson();
                var geojson = toGeoJSON.kml(xml);
                addData(layer, geojson);
                return layer;
            }

            function wktParse(wkt, options, layer) {
                layer = layer || L.geoJson();
                var geojson = wellknown(wkt);
                addData(layer, geojson);
                return layer;
            }

            function parseXML(str) {
                if (typeof str === 'string') {
                    return (new DOMParser()).parseFromString(str, 'text/xml');
                } else {
                    return str;
                }
            }

        }, { "corslite": 5, "csv2geojson": 6, "togeojson": 9, "topojson/topojson.js": 10, "wellknown": 11 }], 2: [function (_dereq_, module, exports) {

        }, {}], 3: [function (_dereq_, module, exports) {
            module.exports = _dereq_(2)
        }, {}], 4: [function (_dereq_, module, exports) {
            // shim for using process in browser

            var process = module.exports = {};

            process.nextTick = (function () {
                var canSetImmediate = typeof window !== 'undefined'
                && window.setImmediate;
                var canPost = typeof window !== 'undefined'
                && window.postMessage && window.addEventListener
                ;

                if (canSetImmediate) {
                    return function (f) { return window.setImmediate(f) };
                }

                if (canPost) {
                    var queue = [];
                    window.addEventListener('message', function (ev) {
                        var source = ev.source;
                        if ((source === window || source === null) && ev.data === 'process-tick') {
                            ev.stopPropagation();
                            if (queue.length > 0) {
                                var fn = queue.shift();
                                fn();
                            }
                        }
                    }, true);

                    return function nextTick(fn) {
                        queue.push(fn);
                        window.postMessage('process-tick', '*');
                    };
                }

                return function nextTick(fn) {
                    setTimeout(fn, 0);
                };
            })();

            process.title = 'browser';
            process.browser = true;
            process.env = {};
            process.argv = [];

            function noop() { }

            process.on = noop;
            process.addListener = noop;
            process.once = noop;
            process.off = noop;
            process.removeListener = noop;
            process.removeAllListeners = noop;
            process.emit = noop;

            process.binding = function (name) {
                throw new Error('process.binding is not supported');
            }

            // TODO(shtylman)
            process.cwd = function () { return '/' };
            process.chdir = function (dir) {
                throw new Error('process.chdir is not supported');
            };

        }, {}], 5: [function (_dereq_, module, exports) {
            function corslite(url, callback, cors) {
                var sent = false;

                if (typeof window.XMLHttpRequest === 'undefined') {
                    return callback(Error('Browser not supported'));
                }

                if (typeof cors === 'undefined') {
                    var m = url.match(/^\s*https?:\/\/[^\/]*/);
                    cors = m && (m[0] !== location.protocol + '//' + location.domain +
                            (location.port ? ':' + location.port : ''));
                }

                var x = new window.XMLHttpRequest();

                function isSuccessful(status) {
                    return status >= 200 && status < 300 || status === 304;
                }

                if (cors && !('withCredentials' in x)) {
                    // IE8-9
                    x = new window.XDomainRequest();

                    // Ensure callback is never called synchronously, i.e., before
                    // x.send() returns (this has been observed in the wild).
                    // See https://github.com/mapbox/mapbox.js/issues/472
                    var original = callback;
                    callback = function () {
                        if (sent) {
                            original.apply(this, arguments);
                        } else {
                            var that = this, args = arguments;
                            setTimeout(function () {
                                original.apply(that, args);
                            }, 0);
                        }
                    }
                }

                function loaded() {
                    if (
                        // XDomainRequest
                        x.status === undefined ||
                        // modern browsers
                        isSuccessful(x.status)) callback.call(x, null, x);
                    else callback.call(x, x, null);
                }

                // Both `onreadystatechange` and `onload` can fire. `onreadystatechange`
                // has [been supported for longer](http://stackoverflow.com/a/9181508/229001).
                if ('onload' in x) {
                    x.onload = loaded;
                } else {
                    x.onreadystatechange = function readystate() {
                        if (x.readyState === 4) {
                            loaded();
                        }
                    };
                }

                // Call the callback with the XMLHttpRequest object as an error and prevent
                // it from ever being called again by reassigning it to `noop`
                x.onerror = function error(evt) {
                    // XDomainRequest provides no evt parameter
                    callback.call(this, evt || true, null);
                    callback = function () { };
                };

                // IE9 must have onprogress be set to a unique function.
                x.onprogress = function () { };

                x.ontimeout = function (evt) {
                    callback.call(this, evt, null);
                    callback = function () { };
                };

                x.onabort = function (evt) {
                    callback.call(this, evt, null);
                    callback = function () { };
                };

                // GET is the only supported HTTP Verb by XDomainRequest and is the
                // only one supported here.
                x.open('GET', url, true);

                // Send the request. Sending data is not supported.
                x.send(null);
                sent = true;

                return x;
            }

            if (typeof module !== 'undefined') module.exports = corslite;

        }, {}], 6: [function (_dereq_, module, exports) {
            var dsv = _dereq_('dsv'),
                sexagesimal = _dereq_('sexagesimal');

            function isLat(f) { return !!f.match(/(Lat)(itude)?/gi); }
            function isLon(f) { return !!f.match(/(L)(on|ng)(gitude)?/i); }

            function keyCount(o) {
                return (typeof o == 'object') ? Object.keys(o).length : 0;
            }

            function autoDelimiter(x) {
                var delimiters = [',', ';', '\t', '|'];
                var results = [];

                delimiters.forEach(function (delimiter) {
                    var res = dsv(delimiter).parse(x);
                    if (res.length >= 1) {
                        var count = keyCount(res[0]);
                        for (var i = 0; i < res.length; i++) {
                            if (keyCount(res[i]) !== count) return;
                        }
                        results.push({
                            delimiter: delimiter,
                            arity: Object.keys(res[0]).length,
                        });
                    }
                });

                if (results.length) {
                    return results.sort(function (a, b) {
                        return b.arity - a.arity;
                    })[0].delimiter;
                } else {
                    return null;
                }
            }

            function auto(x) {
                var delimiter = autoDelimiter(x);
                if (!delimiter) return null;
                return dsv(delimiter).parse(x);
            }

            function csv2geojson(x, options, callback) {

                if (!callback) {
                    callback = options;
                    options = {};
                }

                options.delimiter = options.delimiter || ',';

                var latfield = options.latfield || '',
                    lonfield = options.lonfield || '';

                var features = [],
                    featurecollection = { type: 'FeatureCollection', features: features };

                if (options.delimiter === 'auto' && typeof x == 'string') {
                    options.delimiter = autoDelimiter(x);
                    if (!options.delimiter) return callback({
                        type: 'Error',
                        message: 'Could not autodetect delimiter'
                    });
                }

                var parsed = (typeof x == 'string') ? dsv(options.delimiter).parse(x) : x;

                if (!parsed.length) return callback(null, featurecollection);

                if (!latfield || !lonfield) {
                    for (var f in parsed[0]) {
                        if (!latfield && isLat(f)) latfield = f;
                        if (!lonfield && isLon(f)) lonfield = f;
                    }
                    if (!latfield || !lonfield) {
                        var fields = [];
                        for (var k in parsed[0]) fields.push(k);
                        return callback({
                            type: 'Error',
                            message: 'Latitude and longitude fields not present',
                            data: parsed,
                            fields: fields
                        });
                    }
                }

                var errors = [];

                for (var i = 0; i < parsed.length; i++) {
                    if (parsed[i][lonfield] !== undefined &&
                        parsed[i][lonfield] !== undefined) {

                        var lonk = parsed[i][lonfield],
                            latk = parsed[i][latfield],
                            lonf, latf,
                            a;

                        a = sexagesimal(lonk, 'EW');
                        if (a) lonk = a;
                        a = sexagesimal(latk, 'NS');
                        if (a) latk = a;

                        lonf = parseFloat(lonk);
                        latf = parseFloat(latk);

                        if (isNaN(lonf) ||
                            isNaN(latf)) {
                            errors.push({
                                message: 'A row contained an invalid value for latitude or longitude',
                                row: parsed[i]
                            });
                        } else {
                            if (!options.includeLatLon) {
                                delete parsed[i][lonfield];
                                delete parsed[i][latfield];
                            }

                            features.push({
                                type: 'Feature',
                                properties: parsed[i],
                                geometry: {
                                    type: 'Point',
                                    coordinates: [
                                        parseFloat(lonf),
                                        parseFloat(latf)
                                    ]
                                }
                            });
                        }
                    }
                }

                callback(errors.length ? errors : null, featurecollection);
            }

            function toLine(gj) {
                var features = gj.features;
                var line = {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: []
                    }
                };
                for (var i = 0; i < features.length; i++) {
                    line.geometry.coordinates.push(features[i].geometry.coordinates);
                }
                line.properties = features[0].properties;
                return {
                    type: 'FeatureCollection',
                    features: [line]
                };
            }

            function toPolygon(gj) {
                var features = gj.features;
                var poly = {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[]]
                    }
                };
                for (var i = 0; i < features.length; i++) {
                    poly.geometry.coordinates[0].push(features[i].geometry.coordinates);
                }
                poly.properties = features[0].properties;
                return {
                    type: 'FeatureCollection',
                    features: [poly]
                };
            }

            module.exports = {
                isLon: isLon,
                isLat: isLat,
                csv: dsv.csv.parse,
                tsv: dsv.tsv.parse,
                dsv: dsv,
                auto: auto,
                csv2geojson: csv2geojson,
                toLine: toLine,
                toPolygon: toPolygon
            };

        }, { "dsv": 7, "sexagesimal": 8 }], 7: [function (_dereq_, module, exports) {
            var fs = _dereq_("fs");

            module.exports = new Function("dsv.version = \"0.0.3\";\n\ndsv.tsv = dsv(\"\\t\");\ndsv.csv = dsv(\",\");\n\nfunction dsv(delimiter) {\n  var dsv = {},\n      reFormat = new RegExp(\"[\\\"\" + delimiter + \"\\n]\"),\n      delimiterCode = delimiter.charCodeAt(0);\n\n  dsv.parse = function(text, f) {\n    var o;\n    return dsv.parseRows(text, function(row, i) {\n      if (o) return o(row, i - 1);\n      var a = new Function(\"d\", \"return {\" + row.map(function(name, i) {\n        return JSON.stringify(name) + \": d[\" + i + \"]\";\n      }).join(\",\") + \"}\");\n      o = f ? function(row, i) { return f(a(row), i); } : a;\n    });\n  };\n\n  dsv.parseRows = function(text, f) {\n    var EOL = {}, // sentinel value for end-of-line\n        EOF = {}, // sentinel value for end-of-file\n        rows = [], // output rows\n        N = text.length,\n        I = 0, // current character index\n        n = 0, // the current line number\n        t, // the current token\n        eol; // is the current token followed by EOL?\n\n    function token() {\n      if (I >= N) return EOF; // special case: end of file\n      if (eol) return eol = false, EOL; // special case: end of line\n\n      // special case: quotes\n      var j = I;\n      if (text.charCodeAt(j) === 34) {\n        var i = j;\n        while (i++ < N) {\n          if (text.charCodeAt(i) === 34) {\n            if (text.charCodeAt(i + 1) !== 34) break;\n            ++i;\n          }\n        }\n        I = i + 2;\n        var c = text.charCodeAt(i + 1);\n        if (c === 13) {\n          eol = true;\n          if (text.charCodeAt(i + 2) === 10) ++I;\n        } else if (c === 10) {\n          eol = true;\n        }\n        return text.substring(j + 1, i).replace(/\"\"/g, \"\\\"\");\n      }\n\n      // common case: find next delimiter or newline\n      while (I < N) {\n        var c = text.charCodeAt(I++), k = 1;\n        if (c === 10) eol = true; // \\n\n        else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \\r|\\r\\n\n        else if (c !== delimiterCode) continue;\n        return text.substring(j, I - k);\n      }\n\n      // special case: last token before EOF\n      return text.substring(j);\n    }\n\n    while ((t = token()) !== EOF) {\n      var a = [];\n      while (t !== EOL && t !== EOF) {\n        a.push(t);\n        t = token();\n      }\n      if (f && !(a = f(a, n++))) continue;\n      rows.push(a);\n    }\n\n    return rows;\n  };\n\n  dsv.format = function(rows) {\n    if (Array.isArray(rows[0])) return dsv.formatRows(rows); // deprecated; use formatRows\n    var fieldSet = {}, fields = [];\n\n    // Compute unique fields in order of discovery.\n    rows.forEach(function(row) {\n      for (var field in row) {\n        if (!(field in fieldSet)) {\n          fields.push(fieldSet[field] = field);\n        }\n      }\n    });\n\n    return [fields.map(formatValue).join(delimiter)].concat(rows.map(function(row) {\n      return fields.map(function(field) {\n        return formatValue(row[field]);\n      }).join(delimiter);\n    })).join(\"\\n\");\n  };\n\n  dsv.formatRows = function(rows) {\n    return rows.map(formatRow).join(\"\\n\");\n  };\n\n  function formatRow(row) {\n    return row.map(formatValue).join(delimiter);\n  }\n\n  function formatValue(text) {\n    return reFormat.test(text) ? \"\\\"\" + text.replace(/\\\"/g, \"\\\"\\\"\") + \"\\\"\" : text;\n  }\n\n  return dsv;\n}\n" + ";return dsv")();

        }, { "fs": 2 }], 8: [function (_dereq_, module, exports) {
            module.exports = function (x, dims) {
                if (!dims) dims = 'NSEW';
                if (typeof x !== 'string') return null;
                var r = /^([0-9.]+)°? *(?:([0-9.]+)['’′‘] *)?(?:([0-9.]+)(?:''|"|”|″) *)?([NSEW])?/,
                    m = x.match(r);
                if (!m) return null;
                else if (m[4] && dims.indexOf(m[4]) === -1) return null;
                else return (((m[1]) ? parseFloat(m[1]) : 0) +
                    ((m[2] ? parseFloat(m[2]) / 60 : 0)) +
                    ((m[3] ? parseFloat(m[3]) / 3600 : 0))) *
                    ((m[4] && m[4] === 'S' || m[4] === 'W') ? -1 : 1);
            };

        }, {}], 9: [function (_dereq_, module, exports) {
            (function (process) {
                toGeoJSON = (function () {
                    'use strict';

                    var removeSpace = (/\s*/g),
                        trimSpace = (/^\s*|\s*$/g),
                        splitSpace = (/\s+/);
                    // generate a short, numeric hash of a string
                    function okhash(x) {
                        if (!x || !x.length) return 0;
                        for (var i = 0, h = 0; i < x.length; i++) {
                            h = ((h << 5) - h) + x.charCodeAt(i) | 0;
                        } return h;
                    }
                    // all Y children of X
                    function get(x, y) { return x.getElementsByTagName(y); }
                    function attr(x, y) { return x.getAttribute(y); }
                    function attrf(x, y) { return parseFloat(attr(x, y)); }
                    // one Y child of X, if any, otherwise null
                    function get1(x, y) { var n = get(x, y); return n.length ? n[0] : null; }
                    // https://developer.mozilla.org/en-US/docs/Web/API/Node.normalize
                    function norm(el) { if (el.normalize) { el.normalize(); } return el; }
                    // cast array x into numbers
                    function numarray(x) {
                        for (var j = 0, o = []; j < x.length; j++) o[j] = parseFloat(x[j]);
                        return o;
                    }
                    function clean(x) {
                        var o = {};
                        for (var i in x) if (x[i]) o[i] = x[i];
                        return o;
                    }
                    // get the content of a text node, if any
                    function nodeVal(x) { if (x) { norm(x); } return x && x.firstChild && x.firstChild.nodeValue; }
                    // get one coordinate from a coordinate array, if any
                    //function coord1(v) { return numarray(v.replace(removeSpace, '').split(',')); }
                    function coord1(v) { return numarray(v.split(',')); } ///////replace在大量資料會效能不佳，且為多餘的，故移除
                    // get all coordinates from a coordinate array as [[],[]]
                    function coord(v) {
                        var coords = v.replace(trimSpace, '').split(splitSpace),
                            o = [];
                        for (var i = 0; i < coords.length; i++) {
                            o.push(coord1(coords[i]));
                        }
                        return o;
                    }
                    function coordPair(x) {
                        var ll = [attrf(x, 'lon'), attrf(x, 'lat')],
                            ele = get1(x, 'ele');
                        if (ele) ll.push(parseFloat(nodeVal(ele)));
                        return ll;
                    }

                    // create a new feature collection parent object
                    function fc() {
                        return {
                            type: 'FeatureCollection',
                            features: []
                        };
                    }

                    var serializer;
                    if (typeof XMLSerializer !== 'undefined') {
                        serializer = new XMLSerializer();
                        // only require xmldom in a node environment
                    } else if (typeof exports === 'object' && typeof process === 'object' && !process.browser) {
                        serializer = new (_dereq_('xmldom').XMLSerializer)();
                    }
                    function xml2str(str) { return serializer.serializeToString(str); }

                    var t = {
                        kml: function (doc, o) {
                            o = o || {};
                            var gj = fc(),
                                // styleindex keeps track of hashed styles in order to match features
                                styleIndex = {},
                                // atomic geospatial types supported by KML - MultiGeometry is
                                // handled separately
                                geotypes = ['Polygon', 'LineString', 'Point', 'Track'],
                                // all root placemarks in the file
                                placemarks = get(doc, 'Placemark'),
                                styles = get(doc, 'Style'),
                                stylemaps = get(doc, 'StyleMap'); ////add 20190503

                            for (var k = 0; k < styles.length; k++) {
                                styleIndex['#' + attr(styles[k], 'id')] = okhash(xml2str(styles[k])).toString(16);
                            }
                          
                            for (var j = 0; j < placemarks.length; j++) { //////20200327大量資料此方法畚箕效能OK，但步道server端曉能變很慢
                                var ps = getPlacemark(placemarks[j])
                                for (var i = 0; i < ps.length; i++)
                                    gj.features.push(ps[i]);
                            }
                            //////for (var j = 0; j < placemarks.length; j++) { //大量資料此方法畚箕效能OK，但步道server端曉能變很慢
                            //////    gj.features = gj.features.concat(getPlacemark(placemarks[j])); //用concat效能不好，改上面的push
                            //////}

                            function gxCoord(v) { return numarray(v.split(' ')); }
                            function gxCoords(root) {
                                var elems = get(root, 'coord', 'gx'), coords = [];
                                for (var i = 0; i < elems.length; i++) coords.push(gxCoord(nodeVal(elems[i])));
                                return coords;
                            }
                            function getGeometry(root) {
                                var geomNode, geomNodes, i, j, k, geoms = [];
                                if (get1(root, 'MultiGeometry')) return getGeometry(get1(root, 'MultiGeometry'));
                                if (get1(root, 'MultiTrack')) return getGeometry(get1(root, 'MultiTrack'));
                                for (i = 0; i < geotypes.length; i++) {
                                    geomNodes = get(root, geotypes[i]);
                                    if (geomNodes) {
                                        for (j = 0; j < geomNodes.length; j++) {
                                            geomNode = geomNodes[j];
                                            if (geotypes[i] == 'Point') {
                                                geoms.push({
                                                    type: 'Point',
                                                    coordinates: coord1(nodeVal(get1(geomNode, 'coordinates')))
                                                });
                                            } else if (geotypes[i] == 'LineString') {
                                                geoms.push({
                                                    type: 'LineString',
                                                    coordinates: coord(nodeVal(get1(geomNode, 'coordinates')))
                                                });
                                            } else if (geotypes[i] == 'Polygon') {
                                                var rings = get(geomNode, 'LinearRing'),
                                                    coords = [];
                                                for (k = 0; k < rings.length; k++) {
                                                    coords.push(coord(nodeVal(get1(rings[k], 'coordinates'))));
                                                }
                                                geoms.push({
                                                    type: 'Polygon',
                                                    coordinates: coords
                                                });
                                            } else if (geotypes[i] == 'Track') {
                                                geoms.push({
                                                    type: 'LineString',
                                                    coordinates: gxCoords(geomNode)
                                                });
                                            }
                                        }
                                    }
                                }
                                return geoms;
                            }
                            function getPlacemark(root) {
                                var geoms = getGeometry(root), i, properties = {},
                                    name = nodeVal(get1(root, 'name')),
                                    styleUrl = nodeVal(get1(root, 'styleUrl')),
                                    description = nodeVal(get1(root, 'description')),
                                    timeSpan = get1(root, 'TimeSpan'),
                                    extendedData = get1(root, 'ExtendedData');
                                
                                if (!geoms.length) return [];
                                /////*20190306解析個別PlaceMark的Style start*//////
                                var _setStyleValue = function (xev, xe) {
                                    var v = nodeVal(xe);
                                    if (xe.nodeName == 'color' && v) {
                                        xev[xe.nodeName] = '#' + v.substr(6, 2) + v.substr(4, 2) + v.substr(2, 2);
                                    }
                                    else
                                        xev[xe.nodeName] = v;
                                }
                                var _getoffspring = function (xev, xe) {
                                    if (xe) {
                                        if (xe.nodeName == '#text')
                                            return;
                                        if (xe.childElementCount > 0) {
                                            xev[xe.nodeName] = {};
                                            $.each(xe.childNodes, function () {
                                                _getoffspring(xev[xe.nodeName], this)
                                            });
                                        }
                                        else
                                            _setStyleValue(xev,xe);
                                    }
                                }
                                _getoffspring(properties, get1(root, 'Style'));
                                
                                var _getStyleDef = function (_surl) {
                                    if (_surl && styles.length > 0) {
                                        var ss = $.grep(styles, function (s) { return s.getAttribute('id') && ('#' + s.getAttribute('id').replace('-normal', '')) == _surl; });
                                        if (ss.length > 0) _getoffspring(properties, ss[0]);
                                    }
                                }

                                if (!properties.Style) {
                                    _getStyleDef(styleUrl);
                                }
                                if (!properties.Style && styleUrl) {
                                    if (stylemaps && stylemaps.length > 0) {
                                        var ss = $.grep(stylemaps, function (s) { return s.getAttribute('id') && ('#' + s.getAttribute('id').replace('-normal', '')) == styleUrl; });
                                        if (ss.length > 0) {
                                            var _ms = get1(ss[0], 'styleUrl');
                                            if (_ms) 
                                                _getStyleDef(nodeVal(_ms));
                                        }
                                    }
                                }
                                //////*20190306解析個別PlaceMark的Style end *///////
                                if (name) properties.name = name;

                                if (styleUrl && styleIndex[styleUrl]) {
                                    properties.styleUrl = styleUrl;
                                    properties.styleHash = styleIndex[styleUrl];
                                }
                                if (description) properties.description = description;
                                if (timeSpan) {
                                    var begin = nodeVal(get1(timeSpan, 'begin'));
                                    var end = nodeVal(get1(timeSpan, 'end'));
                                    properties.timespan = { begin: begin, end: end };
                                }
                                if (extendedData) {
                                    var datas = get(extendedData, 'Data'),
                                        simpleDatas = get(extendedData, 'SimpleData');

                                    for (i = 0; i < datas.length; i++) {
                                        properties[datas[i].getAttribute('name')] = nodeVal(get1(datas[i], 'value'));
                                    }
                                    for (i = 0; i < simpleDatas.length; i++) {
                                        properties[simpleDatas[i].getAttribute('name')] = nodeVal(simpleDatas[i]);
                                    }
                                }
                                return [{
                                    type: 'Feature',
                                    geometry: (geoms.length === 1) ? geoms[0] : {
                                        type: 'GeometryCollection',
                                        geometries: geoms
                                    },
                                    properties: properties
                                }];
                            }
                            return gj;
                        },
                        gpx: function (doc, o) {
                            var i,
                                tracks = get(doc, 'trk'),
                                routes = get(doc, 'rte'),
                                waypoints = get(doc, 'wpt'),
                                // a feature collection
                                gj = fc();
                            for (i = 0; i < tracks.length; i++) {
                                gj.features.push(getLinestring(tracks[i], 'trkpt'));
                            }
                            for (i = 0; i < routes.length; i++) {
                                gj.features.push(getLinestring(routes[i], 'rtept'));
                            }
                            for (i = 0; i < waypoints.length; i++) {
                                gj.features.push(getPoint(waypoints[i]));
                            }
                            function getLinestring(node, pointname) {
                                var j, pts = get(node, pointname), line = [];
                                for (j = 0; j < pts.length; j++) {
                                    line.push(coordPair(pts[j]));
                                }
                                return {
                                    type: 'Feature',
                                    properties: getProperties(node),
                                    geometry: {
                                        type: 'LineString',
                                        coordinates: line
                                    }
                                };
                            }
                            function getPoint(node) {
                                var prop = getProperties(node);
                                prop.sym = nodeVal(get1(node, 'sym'));
                                return {
                                    type: 'Feature',
                                    properties: prop,
                                    geometry: {
                                        type: 'Point',
                                        coordinates: coordPair(node)
                                    }
                                };
                            }
                            function getProperties(node) {
                                var meta = ['name', 'desc', 'author', 'copyright', 'link',
                                            'time', 'keywords'],
                                    prop = {},
                                    k;
                                for (k = 0; k < meta.length; k++) {
                                    prop[meta[k]] = nodeVal(get1(node, meta[k]));
                                }
                                return clean(prop);
                            }
                            return gj;
                        }
                    };
                    return t;
                })();

                if (typeof module !== 'undefined') module.exports = toGeoJSON;

            }).call(this, _dereq_("FWaASH"))
        }, { "FWaASH": 4, "xmldom": 3 }], 10: [function (_dereq_, module, exports) {
            !function () {
                var topojson = {
                    version: "1.6.8",
                    mesh: function (topology) { return object(topology, meshArcs.apply(this, arguments)); },
                    meshArcs: meshArcs,
                    merge: function (topology) { return object(topology, mergeArcs.apply(this, arguments)); },
                    mergeArcs: mergeArcs,
                    feature: featureOrCollection,
                    neighbors: neighbors,
                    presimplify: presimplify
                };

                function stitchArcs(topology, arcs) {
                    var stitchedArcs = {},
                        fragmentByStart = {},
                        fragmentByEnd = {},
                        fragments = [],
                        emptyIndex = -1;

                    // Stitch empty arcs first, since they may be subsumed by other arcs.
                    arcs.forEach(function (i, j) {
                        var arc = topology.arcs[i < 0 ? ~i : i], t;
                        if (arc.length < 3 && !arc[1][0] && !arc[1][1]) {
                            t = arcs[++emptyIndex], arcs[emptyIndex] = i, arcs[j] = t;
                        }
                    });

                    arcs.forEach(function (i) {
                        var e = ends(i),
                            start = e[0],
                            end = e[1],
                            f, g;

                        if (f = fragmentByEnd[start]) {
                            delete fragmentByEnd[f.end];
                            f.push(i);
                            f.end = end;
                            if (g = fragmentByStart[end]) {
                                delete fragmentByStart[g.start];
                                var fg = g === f ? f : f.concat(g);
                                fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
                            } else {
                                fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
                            }
                        } else if (f = fragmentByStart[end]) {
                            delete fragmentByStart[f.start];
                            f.unshift(i);
                            f.start = start;
                            if (g = fragmentByEnd[start]) {
                                delete fragmentByEnd[g.end];
                                var gf = g === f ? f : g.concat(f);
                                fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
                            } else {
                                fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
                            }
                        } else {
                            f = [i];
                            fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;
                        }
                    });

                    function ends(i) {
                        var arc = topology.arcs[i < 0 ? ~i : i], p0 = arc[0], p1;
                        if (topology.transform) p1 = [0, 0], arc.forEach(function (dp) { p1[0] += dp[0], p1[1] += dp[1]; });
                        else p1 = arc[arc.length - 1];
                        return i < 0 ? [p1, p0] : [p0, p1];
                    }

                    function flush(fragmentByEnd, fragmentByStart) {
                        for (var k in fragmentByEnd) {
                            var f = fragmentByEnd[k];
                            delete fragmentByStart[f.start];
                            delete f.start;
                            delete f.end;
                            f.forEach(function (i) { stitchedArcs[i < 0 ? ~i : i] = 1; });
                            fragments.push(f);
                        }
                    }

                    flush(fragmentByEnd, fragmentByStart);
                    flush(fragmentByStart, fragmentByEnd);
                    arcs.forEach(function (i) { if (!stitchedArcs[i < 0 ? ~i : i]) fragments.push([i]); });

                    return fragments;
                }

                function meshArcs(topology, o, filter) {
                    var arcs = [];

                    if (arguments.length > 1) {
                        var geomsByArc = [],
                            geom;

                        function arc(i) {
                            var j = i < 0 ? ~i : i;
                            (geomsByArc[j] || (geomsByArc[j] = [])).push({ i: i, g: geom });
                        }

                        function line(arcs) {
                            arcs.forEach(arc);
                        }

                        function polygon(arcs) {
                            arcs.forEach(line);
                        }

                        function geometry(o) {
                            if (o.type === "GeometryCollection") o.geometries.forEach(geometry);
                            else if (o.type in geometryType) geom = o, geometryType[o.type](o.arcs);
                        }

                        var geometryType = {
                            LineString: line,
                            MultiLineString: polygon,
                            Polygon: polygon,
                            MultiPolygon: function (arcs) { arcs.forEach(polygon); }
                        };

                        geometry(o);

                        geomsByArc.forEach(arguments.length < 3
                            ? function (geoms) { arcs.push(geoms[0].i); }
                            : function (geoms) { if (filter(geoms[0].g, geoms[geoms.length - 1].g)) arcs.push(geoms[0].i); });
                    } else {
                        for (var i = 0, n = topology.arcs.length; i < n; ++i) arcs.push(i);
                    }

                    return { type: "MultiLineString", arcs: stitchArcs(topology, arcs) };
                }

                function mergeArcs(topology, objects) {
                    var polygonsByArc = {},
                        polygons = [],
                        components = [];

                    objects.forEach(function (o) {
                        if (o.type === "Polygon") register(o.arcs);
                        else if (o.type === "MultiPolygon") o.arcs.forEach(register);
                    });

                    function register(polygon) {
                        polygon.forEach(function (ring) {
                            ring.forEach(function (arc) {
                                (polygonsByArc[arc = arc < 0 ? ~arc : arc] || (polygonsByArc[arc] = [])).push(polygon);
                            });
                        });
                        polygons.push(polygon);
                    }

                    function exterior(ring) {
                        return cartesianRingArea(object(topology, { type: "Polygon", arcs: [ring] }).coordinates[0]) > 0; // TODO allow spherical?
                    }

                    polygons.forEach(function (polygon) {
                        if (!polygon._) {
                            var component = [],
                                neighbors = [polygon];
                            polygon._ = 1;
                            components.push(component);
                            while (polygon = neighbors.pop()) {
                                component.push(polygon);
                                polygon.forEach(function (ring) {
                                    ring.forEach(function (arc) {
                                        polygonsByArc[arc < 0 ? ~arc : arc].forEach(function (polygon) {
                                            if (!polygon._) {
                                                polygon._ = 1;
                                                neighbors.push(polygon);
                                            }
                                        });
                                    });
                                });
                            }
                        }
                    });

                    polygons.forEach(function (polygon) {
                        delete polygon._;
                    });

                    return {
                        type: "MultiPolygon",
                        arcs: components.map(function (polygons) {
                            var arcs = [];

                            // Extract the exterior (unique) arcs.
                            polygons.forEach(function (polygon) {
                                polygon.forEach(function (ring) {
                                    ring.forEach(function (arc) {
                                        if (polygonsByArc[arc < 0 ? ~arc : arc].length < 2) {
                                            arcs.push(arc);
                                        }
                                    });
                                });
                            });

                            // Stitch the arcs into one or more rings.
                            arcs = stitchArcs(topology, arcs);

                            // If more than one ring is returned,
                            // at most one of these rings can be the exterior;
                            // this exterior ring has the same winding order
                            // as any exterior ring in the original polygons.
                            if ((n = arcs.length) > 1) {
                                var sgn = exterior(polygons[0][0]);
                                for (var i = 0, t; i < n; ++i) {
                                    if (sgn === exterior(arcs[i])) {
                                        t = arcs[0], arcs[0] = arcs[i], arcs[i] = t;
                                        break;
                                    }
                                }
                            }

                            return arcs;
                        })
                    };
                }

                function featureOrCollection(topology, o) {
                    return o.type === "GeometryCollection" ? {
                        type: "FeatureCollection",
                        features: o.geometries.map(function (o) { return feature(topology, o); })
                    } : feature(topology, o);
                }

                function feature(topology, o) {
                    var f = {
                        type: "Feature",
                        id: o.id,
                        properties: o.properties || {},
                        geometry: object(topology, o)
                    };
                    if (o.id == null) delete f.id;
                    return f;
                }

                function object(topology, o) {
                    var absolute = transformAbsolute(topology.transform),
                        arcs = topology.arcs;

                    function arc(i, points) {
                        if (points.length) points.pop();
                        for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length, p; k < n; ++k) {
                            points.push(p = a[k].slice());
                            absolute(p, k);
                        }
                        if (i < 0) reverse(points, n);
                    }

                    function point(p) {
                        p = p.slice();
                        absolute(p, 0);
                        return p;
                    }

                    function line(arcs) {
                        var points = [];
                        for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
                        if (points.length < 2) points.push(points[0].slice());
                        return points;
                    }

                    function ring(arcs) {
                        var points = line(arcs);
                        while (points.length < 4) points.push(points[0].slice());
                        return points;
                    }

                    function polygon(arcs) {
                        return arcs.map(ring);
                    }

                    function geometry(o) {
                        var t = o.type;
                        return t === "GeometryCollection" ? { type: t, geometries: o.geometries.map(geometry) }
                            : t in geometryType ? { type: t, coordinates: geometryType[t](o) }
                            : null;
                    }

                    var geometryType = {
                        Point: function (o) { return point(o.coordinates); },
                        MultiPoint: function (o) { return o.coordinates.map(point); },
                        LineString: function (o) { return line(o.arcs); },
                        MultiLineString: function (o) { return o.arcs.map(line); },
                        Polygon: function (o) { return polygon(o.arcs); },
                        MultiPolygon: function (o) { return o.arcs.map(polygon); }
                    };

                    return geometry(o);
                }

                function reverse(array, n) {
                    var t, j = array.length, i = j - n; while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
                }

                function bisect(a, x) {
                    var lo = 0, hi = a.length;
                    while (lo < hi) {
                        var mid = lo + hi >>> 1;
                        if (a[mid] < x) lo = mid + 1;
                        else hi = mid;
                    }
                    return lo;
                }

                function neighbors(objects) {
                    var indexesByArc = {}, // arc index -> array of object indexes
                        neighbors = objects.map(function () { return []; });

                    function line(arcs, i) {
                        arcs.forEach(function (a) {
                            if (a < 0) a = ~a;
                            var o = indexesByArc[a];
                            if (o) o.push(i);
                            else indexesByArc[a] = [i];
                        });
                    }

                    function polygon(arcs, i) {
                        arcs.forEach(function (arc) { line(arc, i); });
                    }

                    function geometry(o, i) {
                        if (o.type === "GeometryCollection") o.geometries.forEach(function (o) { geometry(o, i); });
                        else if (o.type in geometryType) geometryType[o.type](o.arcs, i);
                    }

                    var geometryType = {
                        LineString: line,
                        MultiLineString: polygon,
                        Polygon: polygon,
                        MultiPolygon: function (arcs, i) { arcs.forEach(function (arc) { polygon(arc, i); }); }
                    };

                    objects.forEach(geometry);

                    for (var i in indexesByArc) {
                        for (var indexes = indexesByArc[i], m = indexes.length, j = 0; j < m; ++j) {
                            for (var k = j + 1; k < m; ++k) {
                                var ij = indexes[j], ik = indexes[k], n;
                                if ((n = neighbors[ij])[i = bisect(n, ik)] !== ik) n.splice(i, 0, ik);
                                if ((n = neighbors[ik])[i = bisect(n, ij)] !== ij) n.splice(i, 0, ij);
                            }
                        }
                    }

                    return neighbors;
                }

                function presimplify(topology, triangleArea) {
                    var absolute = transformAbsolute(topology.transform),
                        relative = transformRelative(topology.transform),
                        heap = minAreaHeap(),
                        maxArea = 0,
                        triangle;

                    if (!triangleArea) triangleArea = cartesianTriangleArea;

                    topology.arcs.forEach(function (arc) {
                        var triangles = [];

                        arc.forEach(absolute);

                        for (var i = 1, n = arc.length - 1; i < n; ++i) {
                            triangle = arc.slice(i - 1, i + 2);
                            triangle[1][2] = triangleArea(triangle);
                            triangles.push(triangle);
                            heap.push(triangle);
                        }

                        // Always keep the arc endpoints!
                        arc[0][2] = arc[n][2] = Infinity;

                        for (var i = 0, n = triangles.length; i < n; ++i) {
                            triangle = triangles[i];
                            triangle.previous = triangles[i - 1];
                            triangle.next = triangles[i + 1];
                        }
                    });

                    while (triangle = heap.pop()) {
                        var previous = triangle.previous,
                            next = triangle.next;

                        // If the area of the current point is less than that of the previous point
                        // to be eliminated, use the latter's area instead. This ensures that the
                        // current point cannot be eliminated without eliminating previously-
                        // eliminated points.
                        if (triangle[1][2] < maxArea) triangle[1][2] = maxArea;
                        else maxArea = triangle[1][2];

                        if (previous) {
                            previous.next = next;
                            previous[2] = triangle[2];
                            update(previous);
                        }

                        if (next) {
                            next.previous = previous;
                            next[0] = triangle[0];
                            update(next);
                        }
                    }

                    topology.arcs.forEach(function (arc) {
                        arc.forEach(relative);
                    });

                    function update(triangle) {
                        heap.remove(triangle);
                        triangle[1][2] = triangleArea(triangle);
                        heap.push(triangle);
                    }

                    return topology;
                };

                function cartesianRingArea(ring) {
                    var i = -1,
                        n = ring.length,
                        a,
                        b = ring[n - 1],
                        area = 0;

                    while (++i < n) {
                        a = b;
                        b = ring[i];
                        area += a[0] * b[1] - a[1] * b[0];
                    }

                    return area * .5;
                }

                function cartesianTriangleArea(triangle) {
                    var a = triangle[0], b = triangle[1], c = triangle[2];
                    return Math.abs((a[0] - c[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (c[1] - a[1]));
                }

                function compareArea(a, b) {
                    return a[1][2] - b[1][2];
                }

                function minAreaHeap() {
                    var heap = {},
                        array = [],
                        size = 0;

                    heap.push = function (object) {
                        up(array[object._ = size] = object, size++);
                        return size;
                    };

                    heap.pop = function () {
                        if (size <= 0) return;
                        var removed = array[0], object;
                        if (--size > 0) object = array[size], down(array[object._ = 0] = object, 0);
                        return removed;
                    };

                    heap.remove = function (removed) {
                        var i = removed._, object;
                        if (array[i] !== removed) return; // invalid request
                        if (i !== --size) object = array[size], (compareArea(object, removed) < 0 ? up : down)(array[object._ = i] = object, i);
                        return i;
                    };

                    function up(object, i) {
                        while (i > 0) {
                            var j = ((i + 1) >> 1) - 1,
                                parent = array[j];
                            if (compareArea(object, parent) >= 0) break;
                            array[parent._ = i] = parent;
                            array[object._ = i = j] = object;
                        }
                    }

                    function down(object, i) {
                        while (true) {
                            var r = (i + 1) << 1,
                                l = r - 1,
                                j = i,
                                child = array[j];
                            if (l < size && compareArea(array[l], child) < 0) child = array[j = l];
                            if (r < size && compareArea(array[r], child) < 0) child = array[j = r];
                            if (j === i) break;
                            array[child._ = i] = child;
                            array[object._ = i = j] = object;
                        }
                    }

                    return heap;
                }

                function transformAbsolute(transform) {
                    if (!transform) return noop;
                    var x0,
                        y0,
                        kx = transform.scale[0],
                        ky = transform.scale[1],
                        dx = transform.translate[0],
                        dy = transform.translate[1];
                    return function (point, i) {
                        if (!i) x0 = y0 = 0;
                        point[0] = (x0 += point[0]) * kx + dx;
                        point[1] = (y0 += point[1]) * ky + dy;
                    };
                }

                function transformRelative(transform) {
                    if (!transform) return noop;
                    var x0,
                        y0,
                        kx = transform.scale[0],
                        ky = transform.scale[1],
                        dx = transform.translate[0],
                        dy = transform.translate[1];
                    return function (point, i) {
                        if (!i) x0 = y0 = 0;
                        var x1 = (point[0] - dx) / kx | 0,
                            y1 = (point[1] - dy) / ky | 0;
                        point[0] = x1 - x0;
                        point[1] = y1 - y0;
                        x0 = x1;
                        y0 = y1;
                    };
                }

                function noop() { }

                if (typeof define === "function" && define.amd) define(topojson);
                else if (typeof module === "object" && module.exports) module.exports = topojson;
                else this.topojson = topojson;
            }();

        }, {}], 11: [function (_dereq_, module, exports) {
            module.exports = parse;
            module.exports.parse = parse;
            module.exports.stringify = stringify;

            /*
            * Parse WKT and return GeoJSON.
            *
            * @param {string} _ A WKT geometry
            * @return {?Object} A GeoJSON geometry object
            */
            function parse(_) {
                var parts = _.split(";"),
                    _ = parts.pop(),
                    srid = (parts.shift() || "").split("=").pop();

                var i = 0;

                function $(re) {
                    var match = _.substring(i).match(re);
                    if (!match) return null;
                    else {
                        i += match[0].length;
                        return match[0];
                    }
                }

                function crs(obj) {
                    if (obj && srid.match(/\d+/)) {
                        obj.crs = {
                            type: 'name',
                            properties: {
                                name: 'urn:ogc:def:crs:EPSG::' + srid
                            }
                        };
                    }

                    return obj;
                }

                function white() { $(/^\s*/); }

                function multicoords() {
                    white();
                    var depth = 0, rings = [], stack = [rings],
                        pointer = rings, elem;

                    while (elem =
                        $(/^(\()/) ||
                        $(/^(\))/) ||
                        $(/^(\,)/) ||
                        $(/^[-+]?([0-9]*\.[0-9]+|[0-9]+)/)) {
                        if (elem == '(') {
                            stack.push(pointer);
                            pointer = [];
                            stack[stack.length - 1].push(pointer);
                            depth++;
                        } else if (elem == ')') {
                            pointer = stack.pop();
                            // the stack was empty, input was malformed
                            if (!pointer) return;
                            depth--;
                            if (depth === 0) break;
                        } else if (elem === ',') {
                            pointer = [];
                            stack[stack.length - 1].push(pointer);
                        } else if (!isNaN(parseFloat(elem))) {
                            pointer.push(parseFloat(elem));
                        } else {
                            return null;
                        }
                        white();
                    }

                    if (depth !== 0) return null;
                    return rings;
                }

                function coords() {
                    var list = [], item, pt;
                    while (pt =
                        $(/^[-+]?([0-9]*\.[0-9]+|[0-9]+)/) ||
                        $(/^(\,)/)) {
                        if (pt == ',') {
                            list.push(item);
                            item = [];
                        } else {
                            if (!item) item = [];
                            item.push(parseFloat(pt));
                        }
                        white();
                    }
                    if (item) list.push(item);
                    return list.length ? list : null;
                }

                function point() {
                    if (!$(/^(point)/i)) return null;
                    white();
                    if (!$(/^(\()/)) return null;
                    var c = coords();
                    if (!c) return null;
                    white();
                    if (!$(/^(\))/)) return null;
                    return {
                        type: 'Point',
                        coordinates: c[0]
                    };
                }

                function multipoint() {
                    if (!$(/^(multipoint)/i)) return null;
                    white();
                    var c = multicoords();
                    if (!c) return null;
                    white();
                    return {
                        type: 'MultiPoint',
                        coordinates: c
                    };
                }

                function multilinestring() {
                    if (!$(/^(multilinestring)/i)) return null;
                    white();
                    var c = multicoords();
                    if (!c) return null;
                    white();
                    return {
                        type: 'MultiLineString',
                        coordinates: c
                    };
                }

                function linestring() {
                    if (!$(/^(linestring)/i)) return null;
                    white();
                    if (!$(/^(\()/)) return null;
                    var c = coords();
                    if (!c) return null;
                    if (!$(/^(\))/)) return null;
                    return {
                        type: 'LineString',
                        coordinates: c
                    };
                }

                function polygon() {
                    if (!$(/^(polygon)/i)) return null;
                    white();
                    return {
                        type: 'Polygon',
                        coordinates: multicoords()
                    };
                }

                function multipolygon() {
                    if (!$(/^(multipolygon)/i)) return null;
                    white();
                    return {
                        type: 'MultiPolygon',
                        coordinates: multicoords()
                    };
                }

                function geometrycollection() {
                    var geometries = [], geometry;

                    if (!$(/^(geometrycollection)/i)) return null;
                    white();

                    if (!$(/^(\()/)) return null;
                    while (geometry = root()) {
                        geometries.push(geometry);
                        white();
                        $(/^(\,)/);
                        white();
                    }
                    if (!$(/^(\))/)) return null;

                    return {
                        type: 'GeometryCollection',
                        geometries: geometries
                    };
                }

                function root() {
                    return point() ||
                        linestring() ||
                        polygon() ||
                        multipoint() ||
                        multilinestring() ||
                        multipolygon() ||
                        geometrycollection();
                }

                return crs(root());
            }

            /**
             * Stringifies a GeoJSON object into WKT
             */
            function stringify(gj) {
                if (gj.type === 'Feature') {
                    gj = gj.geometry;
                }

                function pairWKT(c) {
                    if (c.length === 2) {
                        return c[0] + ' ' + c[1];
                    } else if (c.length === 3) {
                        return c[0] + ' ' + c[1] + ' ' + c[2];
                    }
                }

                function ringWKT(r) {
                    return r.map(pairWKT).join(', ');
                }

                function ringsWKT(r) {
                    return r.map(ringWKT).map(wrapParens).join(', ');
                }

                function multiRingsWKT(r) {
                    return r.map(ringsWKT).map(wrapParens).join(', ');
                }

                function wrapParens(s) { return '(' + s + ')'; }

                switch (gj.type) {
                    case 'Point':
                        return 'POINT (' + pairWKT(gj.coordinates) + ')';
                    case 'LineString':
                        return 'LINESTRING (' + ringWKT(gj.coordinates) + ')';
                    case 'Polygon':
                        return 'POLYGON (' + ringsWKT(gj.coordinates) + ')';
                    case 'MultiPoint':
                        return 'MULTIPOINT (' + ringWKT(gj.coordinates) + ')';
                    case 'MultiPolygon':
                        return 'MULTIPOLYGON (' + multiRingsWKT(gj.coordinates) + ')';
                    case 'MultiLineString':
                        return 'MULTILINESTRING (' + ringsWKT(gj.coordinates) + ')';
                    case 'GeometryCollection':
                        return 'GEOMETRYCOLLECTION (' + gj.geometries.map(stringify).join(', ') + ')';
                    default:
                        throw new Error('stringify requires a valid GeoJSON Feature or geometry object as input');
                }
            }

        }, {}]
    }, {}, [1])
    (1)
});