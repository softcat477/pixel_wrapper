/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _filters = __webpack_require__(1);

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/**
	 * Returns a function, that, as long as it continues to be invoked, will not
	 be triggered. The function will be called after it stops being called for
	 N milliseconds. If `immediate` is passed, trigger the function on the
	 leading edge, instead of the trailing.
	 */
	function debounce(func, wait, immediate) {
	    var timeout = void 0;
	    return function () {
	        var context = this,
	            args = arguments;
	        var later = function later() {
	            timeout = null;
	            if (!immediate) {
	                func.apply(context, args);
	            }
	        };
	        var callNow = immediate && !timeout;
	        clearTimeout(timeout);
	        timeout = setTimeout(later, wait);
	        if (callNow) {
	            func.apply(context, args);
	        }
	    };
	}

	/**
	 * A Diva.js plugin that allows users to manipulate images by adjusting their
	 * brightness, contrast, and other parameters.
	 **/

	var ManipulationPlugin = function () {
	    function ManipulationPlugin(core) {
	        _classCallCheck(this, ManipulationPlugin);

	        this._core = core;
	        this.pageToolsIcon = this.createIcon();
	        this._backdrop = null;
	        this._page = null;
	        this._mainImage = null;
	        this._canvas = null;
	        this._filters = {
	            brightness: null,
	            contrast: null
	        };

	        // store the data for the original main image so that we
	        // do the processing on that, not on a previously-processed image.
	        this._originalData = null;

	        this.boundEscapeListener = this.escapeListener.bind(this);
	    }

	    _createClass(ManipulationPlugin, [{
	        key: 'handleClick',
	        value: function handleClick(event, settings, publicInstance, pageIndex) {
	            document.body.style.overflow = 'hidden';
	            this._backdrop = document.createElement('div');
	            this._backdrop.classList.add('manipulation-fullscreen');

	            this._sidebar = document.createElement('div');
	            this._sidebar.classList.add('manipulation-sidebar');

	            this._mainArea = document.createElement('div');
	            this._mainArea.classList.add('manipulation-main-area');

	            this._tools = document.createElement('div');
	            this._tools.classList.add('manipulation-tools');

	            this._backdrop.appendChild(this._sidebar);
	            this._backdrop.appendChild(this._mainArea);
	            this._backdrop.appendChild(this._tools);

	            this._core.parentObject.appendChild(this._backdrop);
	            document.addEventListener('keyup', this.boundEscapeListener);

	            this._page = settings.manifest.pages[pageIndex];

	            this._canvas = document.createElement('canvas');
	            this._ctx = this._canvas.getContext('2d');
	            this._mainArea.appendChild(this._canvas);

	            this._initializeSidebar();
	            this._initializeTools();
	        }

	        /*
	        *  Returns an SVG object representing the icon for the project. Implemented in code
	        *  here so that the entire Diva object can be passed to the client with no external
	        *  dependencies.
	        **/

	    }, {
	        key: 'createIcon',
	        value: function createIcon() {
	            var manipulationIcon = document.createElement('div');
	            manipulationIcon.classList.add('diva-manipulation-icon');

	            var root = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	            root.setAttribute("x", "0px");
	            root.setAttribute("y", "0px");
	            root.setAttribute("viewBox", "0 0 25 25");
	            root.id = this._core.settings.selector + 'manipulation-icon';

	            var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
	            g.id = this._core.settings.selector + 'manipulation-icon-glyph';
	            g.setAttribute("transform", "matrix(1, 0, 0, 1, -11.5, -11.5)");
	            g.setAttribute("class", "diva-pagetool-icon");

	            var path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
	            path1.setAttribute("d", "M27,21h-1v-9h-3v9h-1c-0.55,0-1,0.45-1,1v3c0,0.55,0.45,1,1,1h1h3h1c0.55,0,1-0.45,1-1v-3C28,21.45,27.55,21,27,21z M27,24h-5v-0.5h5V24z");

	            var path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
	            path2.setAttribute("d", "M35,16h-1v-4h-3v4h-1c-0.55,0-1,0.45-1,1v3c0,0.55,0.45,1,1,1h1h3h1c0.55,0,1-0.45,1-1v-3C36,16.45,35.55,16,35,16z M35,19h-5v-0.5h5V19z");

	            var path3 = document.createElementNS("http://www.w3.org/2000/svg", "path");
	            path3.setAttribute("d", "M19,26h-1V12h-3v14h-1c-0.55,0-1,0.45-1,1v3c0,0.55,0.45,1,1,1h1h3h1c0.55,0,1-0.45,1-1v-3C20,26.45,19.55,26,19,26zM19,29h-5v-0.5h5V29z");

	            var rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	            rect1.setAttribute('x', '23');
	            rect1.setAttribute('y', '27');
	            rect1.setAttribute('width', '3');
	            rect1.setAttribute('height', '9');

	            var rect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	            rect2.setAttribute('x', '31');
	            rect2.setAttribute('y', '22');
	            rect2.setAttribute('width', '3');
	            rect2.setAttribute('height', '14');

	            var rect3 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	            rect3.setAttribute('x', '15');
	            rect3.setAttribute('y', '32');
	            rect3.setAttribute('width', '3');
	            rect3.setAttribute('height', '4');

	            g.appendChild(path1);
	            g.appendChild(path2);
	            g.appendChild(rect1);
	            g.appendChild(path3);
	            g.appendChild(rect2);
	            g.appendChild(rect3);
	            root.appendChild(g);

	            manipulationIcon.appendChild(root);

	            return manipulationIcon;
	        }
	    }, {
	        key: 'escapeListener',
	        value: function escapeListener(event) {
	            if (event.keyCode === 27) {
	                document.removeEventListener('keyup', this.boundEscapeListener);
	                document.body.style.overflow = 'auto';
	                this._core.parentObject.removeChild(this._backdrop);
	            }
	        }
	    }, {
	        key: '_initializeSidebar',
	        value: function _initializeSidebar() {
	            var _this = this;

	            // 150px wide images for the sidebar.
	            var thumbnailSize = "150";
	            var mainPageSidebarImageURL = this._page.url + 'full/' + thumbnailSize + ',/0/default.jpg';

	            var otherImageURLs = this._page.otherImages.map(function (img) {
	                return img.url + 'full/' + thumbnailSize + ',/0/default.jpg';
	            });

	            var primaryImgDiv = document.createElement('div');
	            primaryImgDiv.classList.add('manipulation-sidebar-primary-image');

	            var primaryImg = document.createElement('img');
	            primaryImg.setAttribute('src', mainPageSidebarImageURL);

	            var primaryImgLabel = document.createElement('div');
	            primaryImgLabel.textContent = this._page.il;

	            primaryImgDiv.appendChild(primaryImg);
	            primaryImgDiv.appendChild(primaryImgLabel);

	            this._sidebar.appendChild(primaryImgDiv);

	            primaryImgDiv.addEventListener('click', function () {
	                _this._loadImageInMainArea.call(_this, event, _this._page.url);
	            });

	            otherImageURLs.map(function (url, idx) {
	                var othDiv = document.createElement('div');
	                othDiv.classList.add('manipulation-sidebar-secondary-image');

	                var othImg = document.createElement('img');
	                othImg.setAttribute('src', url);

	                var othImgLabel = document.createElement('div');
	                othImgLabel.textContent = _this._page.otherImages[idx].il;

	                othDiv.appendChild(othImg);
	                othDiv.appendChild(othImgLabel);

	                _this._sidebar.appendChild(othDiv);

	                othDiv.addEventListener('click', function () {
	                    return _this._loadImageInMainArea.call(_this, event, _this._page.otherImages[idx].url);
	                });
	            });
	        }
	    }, {
	        key: '_initializeTools',
	        value: function _initializeTools() {
	            var _this2 = this;

	            var bwDiv = document.createElement('div');
	            var blackWhiteButton = document.createElement('button');
	            blackWhiteButton.textContent = "Grayscale";
	            blackWhiteButton.addEventListener('click', function (e) {
	                return _this2._applyTransformationToImageData(e, _filters.grayscale);
	            });
	            bwDiv.appendChild(blackWhiteButton);

	            var vibDiv = document.createElement('div');
	            var vibranceAdjust = document.createElement('input');
	            vibranceAdjust.setAttribute('type', 'range');
	            vibranceAdjust.setAttribute('max', 100);
	            vibranceAdjust.setAttribute('min', -100);
	            vibranceAdjust.setAttribute('value', 0);

	            vibranceAdjust.addEventListener('change', debounce(function (e) {
	                return _this2._applyTransformationToImageData(e, _filters.vibrance, e.target.value);
	            }, 250));
	            vibDiv.appendChild(vibranceAdjust);

	            var brightDiv = document.createElement('div');
	            var brightnessAdjust = document.createElement('input');
	            brightnessAdjust.setAttribute('type', 'range');
	            brightnessAdjust.setAttribute('max', 100);
	            brightnessAdjust.setAttribute('min', -100);
	            brightnessAdjust.setAttribute('value', 0);

	            brightnessAdjust.addEventListener('change', debounce(function (e) {
	                return _this2._applyTransformationToImageData(e, _filters.brightness, e.target.value);
	            }, 250));
	            brightDiv.appendChild(brightnessAdjust);

	            var contrastDiv = document.createElement('div');
	            var contrastAdjust = document.createElement('input');
	            contrastAdjust.setAttribute('type', 'range');
	            contrastAdjust.setAttribute('max', 100);
	            contrastAdjust.setAttribute('min', -100);
	            contrastAdjust.setAttribute('value', 0);

	            contrastAdjust.addEventListener('change', debounce(function (e) {
	                return _this2._applyTransformationToImageData(e, _filters.contrast, e.target.value);
	            }, 250));
	            contrastDiv.appendChild(contrastAdjust);

	            var invDiv = document.createElement('div');
	            var invertButton = document.createElement('button');
	            invertButton.textContent = "Invert Colours";
	            invertButton.addEventListener('click', function (e) {
	                return _this2._applyTransformationToImageData(e, _filters.invert);
	            });
	            invDiv.appendChild(invertButton);

	            var threshDiv = document.createElement('div');
	            var thresholdAdjust = document.createElement('input');
	            thresholdAdjust.setAttribute('type', 'range');
	            thresholdAdjust.setAttribute('max', 255);
	            thresholdAdjust.setAttribute('min', 64);
	            thresholdAdjust.setAttribute('value', 0);

	            thresholdAdjust.addEventListener('change', debounce(function (e) {
	                return _this2._applyTransformationToImageData(e, _filters.threshold, e.target.value);
	            }, 250));
	            threshDiv.appendChild(thresholdAdjust);

	            var sharpDiv = document.createElement('div');
	            var sharpenAdjust = document.createElement('input');
	            sharpenAdjust.setAttribute('type', 'range');
	            sharpenAdjust.setAttribute('max', 100);
	            sharpenAdjust.setAttribute('min', 0);
	            sharpenAdjust.setAttribute('value', 0);

	            sharpenAdjust.addEventListener('change', debounce(function (e) {
	                return _this2._applyConvolutionFilter(e, _filters.sharpen, e.target.value);
	            }, 250));
	            sharpDiv.appendChild(sharpenAdjust);

	            var hueDiv = document.createElement('div');
	            var hueAdjust = document.createElement('input');
	            hueAdjust.setAttribute('type', 'range');
	            hueAdjust.setAttribute('max', 100);
	            hueAdjust.setAttribute('min', 0);
	            hueAdjust.setAttribute('value', 0);

	            hueAdjust.addEventListener('change', debounce(function (e) {
	                return _this2._applyConvolutionFilter(e, _filters.hue, e.target.value);
	            }, 250));
	            hueDiv.appendChild(hueAdjust);

	            this._tools.appendChild(bwDiv);
	            this._tools.appendChild(invDiv);
	            this._tools.appendChild(vibDiv);
	            this._tools.appendChild(brightDiv);
	            this._tools.appendChild(contrastDiv);
	            this._tools.appendChild(threshDiv);
	            this._tools.appendChild(sharpDiv);
	            this._tools.appendChild(hueDiv);
	        }
	    }, {
	        key: '_loadImageInMainArea',
	        value: function _loadImageInMainArea(event, imageURL) {
	            var _this3 = this;

	            var url = imageURL + 'full/full/0/default.jpg';

	            this._mainImage = new Image();
	            this._mainImage.crossOrigin = "anonymous";

	            this._mainImage.addEventListener('load', function () {
	                // Determine the size of the (square) canvas based on the hypoteneuse
	                _this3._canvas.size = Math.sqrt(_this3._mainImage.width * _this3._mainImage.width + _this3._mainImage.height * _this3._mainImage.height);
	                _this3._canvas.width = _this3._mainImage.width;
	                _this3._canvas.height = _this3._mainImage.height;
	                _this3._canvas.cornerX = (_this3._canvas.size - _this3._mainImage.width) / 2;
	                _this3._canvas.cornerY = (_this3._canvas.size - _this3._mainImage.height) / 2;

	                _this3._ctx.clearRect(0, 0, _this3._canvas.width, _this3._canvas.height);
	                _this3._ctx.drawImage(_this3._mainImage, 0, 0, _this3._canvas.width, _this3._canvas.height);
	                _this3._originalData = _this3._ctx.getImageData(0, 0, _this3._canvas.width, _this3._canvas.height);

	                // clean up the image data since it's been painted to the canvas
	                _this3._mainImage = null;
	            });

	            this._mainImage.src = url;
	        }
	    }, {
	        key: '_applyTransformationToImageData',
	        value: function _applyTransformationToImageData(event, func, value) {
	            var cw = this._canvas.width;
	            var ch = this._canvas.height;
	            var adjustment = void 0;

	            if (value) {
	                adjustment = parseInt(value, 10);
	            }

	            var newData = func(this._originalData, adjustment);

	            this._ctx.clearRect(0, 0, cw, ch);
	            this._ctx.putImageData(newData, 0, 0);
	        }
	    }, {
	        key: '_applyConvolutionFilter',
	        value: function _applyConvolutionFilter(event, func, value) {
	            var cw = this._canvas.width;
	            var ch = this._canvas.height;
	            var adjustment = void 0;

	            if (value) {
	                adjustment = parseInt(value, 10);
	            }

	            var newData = func(this._originalData, adjustment);

	            this._ctx.clearRect(0, 0, cw, ch);
	            this._ctx.putImageData(newData, 0, 0);
	        }
	    }]);

	    return ManipulationPlugin;
	}();

	exports.default = ManipulationPlugin;


	ManipulationPlugin.prototype.pluginName = "manipulation";
	ManipulationPlugin.prototype.isPageTool = true;

	/**
	 * Make this plugin available in the global context
	 * as part of the 'Diva' namespace.
	 **/
	(function (global) {
	    global.Diva.ManipulationPlugin = ManipulationPlugin;
	})(window);

/***/ }),
/* 1 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.addFilterToQueue = addFilterToQueue;
	exports.grayscale = grayscale;
	exports.vibrance = vibrance;
	exports.brightness = brightness;
	exports.contrast = contrast;
	exports.invert = invert;
	exports.threshold = threshold;
	exports.hue = hue;
	exports.rgbToHSV = rgbToHSV;
	exports.hsvToRGB = hsvToRGB;
	exports.sharpen = sharpen;

	var _filterQueue = {};

	function addFilterToQueue(filter) {
	    var fname = filter.name;

	    if (_filterQueue.hasOwnProperty(fname)) {
	        // update existing filter
	    } else {
	            // add new filter to the queue
	        }

	    var fkeys = Object.keys(_filterQueue);

	    fkeys.map(function () {});
	}

	/**
	 * Pre-paints the adjustment to an offscreen canvas before moving it to the on-screen canvas.
	 **/
	function _getOffscreenCanvasData(w, h) {
	    var tmpCanvas = document.createElement('canvas');
	    var tmpCtx = tmpCanvas.getContext('2d');

	    return tmpCtx.createImageData(w, h);
	}

	function _manipulateImage(data, func, adjustment) {
	    var len = data.length;

	    for (var i = 0; i < len; i += 4) {
	        var r = data[i];
	        var g = data[i + 1];
	        var b = data[i + 2];

	        var newPixelValue = func(r, g, b, adjustment);

	        data[i] = newPixelValue[0];
	        data[i + 1] = newPixelValue[1];
	        data[i + 2] = newPixelValue[2];
	        data[i + 3] = newPixelValue[3];
	    }

	    return data;
	}

	function _apply(data, pixelFunc, adjust) {
	    var dataArr = new Uint8ClampedArray(data.data);
	    var inverted = _manipulateImage(dataArr, pixelFunc, adjust);

	    var newCanvasData = _getOffscreenCanvasData(data.width, data.height);
	    newCanvasData.data.set(inverted);

	    return newCanvasData;
	}

	/**
	 * Inverts the colours of a canvas.
	 *
	 * @params {object} data - A canvas image data object.
	 * @returns {object} A new canvas data object.
	 **/
	function grayscale(data) {
	    return _apply(data, _grayscale);
	}

	/**
	 * See: https://en.wikipedia.org/wiki/Grayscale#Converting_color_to_grayscale
	 *
	 * Reference: http://www.phpied.com/image-fun/ and https://github.com/meltingice/CamanJS/blob/master/src/lib/filters.coffee#L89
	 *
	 * @params {integer} r - the value of the red pixel
	 * @params {integer} g - the value of the green pixel
	 * @params {integer} b - the value of the blue pixel
	 * @returns {Array} - The computed RGB values for the input, with a constant 255 for the alpha channel.
	 **/
	function _grayscale(r, g, b) {
	    var pixelAverage = 0.3 * r + 0.59 * g + 0.11 * b;

	    return [pixelAverage, pixelAverage, pixelAverage, 255];
	}

	function vibrance(data, adjust) {
	    return _apply(data, _vibrance, adjust);
	}

	/**
	 * Similar to saturation, but adjusts the saturation levels in a slightly smarter, more subtle way.
	 * Vibrance will attempt to boost colors that are less saturated more and boost already saturated
	 * colors less, while saturation boosts all colors by the same level.
	 *
	 * See: https://github.com/meltingice/CamanJS/blob/master/src/lib/filters.coffee#L60
	 *
	 * @params {integer} r - the value of the red pixel
	 * @params {integer} g - the value of the green pixel
	 * @params {integer} b - the value of the blue pixel
	 * @params {integer} adjust - the vibrance value for adjustment, -100 to 100
	 * @returns {Array} - The computed RGB values for the input, with a constant 255 for the alpha channel.
	 **/
	function _vibrance(r, g, b, adjust) {
	    var adj = adjust * -1;

	    var max = Math.max(r, g, b);
	    var avg = r + g + b / 3;
	    var amt = Math.abs(max - avg) * 2 / 255 * adj / 100;

	    return [r !== max ? r + (max - r) * amt : r, g !== max ? g + (max - g) * amt : g, b !== max ? b + (max - b) * amt : b, 255];
	}

	function brightness(data, adjust) {
	    return _apply(data, _brightness, adjust);
	}

	function _brightness(r, g, b, adjust) {
	    var adj = Math.floor(255 * (adjust / 100));

	    return [r + adj, g + adj, b + adj, 255];
	}

	function contrast(data, adjust) {
	    return _apply(data, _contrast, adjust);
	}

	/**
	 * Increases or decreases the color contrast of the image.
	 *
	 * @params {integer} r - the value of the red pixel
	 * @params {integer} g - the value of the green pixel
	 * @params {integer} b - the value of the blue pixel
	 * @params {integer} adjust - the contrast value for adjustment, -100 to 100
	 * @returns {Array} - The computed RGB values for the input, with a constant 255 for the alpha channel.
	 **/
	function _contrast(r, g, b, adjust) {
	    var adj = Math.pow((adjust + 100) / 100, 2);
	    var rr = r,
	        gg = g,
	        bb = b;

	    rr /= 255;
	    rr -= 0.5;
	    rr *= adj;
	    rr += 0.5;
	    rr *= 255;

	    gg /= 255;
	    gg -= 0.5;
	    gg *= adj;
	    gg += 0.5;
	    gg *= 255;

	    bb /= 255;
	    bb -= 0.5;
	    bb *= adj;
	    bb += 0.5;
	    bb *= 255;

	    return [rr, gg, bb, 255];
	}
	/**
	 * Inverts the colours of a canvas.
	 *
	 * @params {object} data - A canvas image data object.
	 * @returns {object} A new canvas data object.
	 **/
	function invert(data) {
	    return _apply(data, _invert);
	}

	/**
	 * Inverts the colours of the image.
	 * See: https://github.com/meltingice/CamanJS/blob/master/src/lib/filters.coffee#L183
	 *
	 * @params {integer} r - the value of the red pixel
	 * @params {integer} g - the value of the green pixel
	 * @params {integer} b - the value of the blue pixel
	 * @returns {Array} - The computed RGB values for the input, with a constant 255 for the alpha channel.
	 **/
	function _invert(r, g, b) {
	    return [255 - r, 255 - g, 255 - b, 255];
	}

	function threshold(data, adjust) {
	    return _apply(data, _threshold, adjust);
	}

	/**
	 * Black pixels above a certain value (0-255); otherwise white. Perceptively weighted.
	 *
	 * See: https://www.html5rocks.com/en/tutorials/canvas/imagefilters/
	 *
	 * @params {integer} r - the value of the red pixel
	 * @params {integer} g - the value of the green pixel
	 * @params {integer} b - the value of the blue pixel
	 * @params {integer} adjust - the threshold value, 0-255
	 * @returns {Array} - The computed RGB values for the input, with a constant 255 for the alpha channel.
	 **/
	function _threshold(r, g, b, adjust) {
	    var v = 0.2126 * r + 0.7152 * g + 0.0722 * b >= adjust ? 255 : 0;

	    return [v, v, v, 255];
	}

	function hue(data, adjust) {
	    return _apply(data, _hue, adjust);
	}

	function _hue(r, g, b, adjust) {
	    var _rgbToHSV = rgbToHSV(r, g, b),
	        h = _rgbToHSV.h,
	        s = _rgbToHSV.s,
	        v = _rgbToHSV.v;

	    h = h * 100;
	    h += Math.abs(adjust);
	    h = h % 100;
	    h /= 100;

	    var res = hsvToRGB(h, s, v);

	    return [res.r, res.g, res.b, 255];
	}

	function rgbToHSV(r, g, b) {
	    var rr = r,
	        gg = g,
	        bb = b;

	    rr /= 255;
	    gg /= 255;
	    bb /= 255;

	    var max = Math.max(rr, gg, bb);
	    var min = Math.min(rr, gg, bb);
	    var v = max;
	    var d = max - min;

	    var s = max === 0 ? 0 : d / max;
	    var h = void 0;

	    if (max === min) h = 0;else {
	        switch (max) {
	            case rr:
	                h = (gg - bb) / d + (gg < bb ? 6 : 0);
	                break;
	            case gg:
	                h = (bb - rr) / d + 2;
	                break;
	            case bb:
	                h = (rr - gg) / d + 4;
	                break;
	        }

	        h /= 6;
	    }

	    return { h: h, s: s, v: v };
	}

	function hsvToRGB(h, s, v) {
	    var b = void 0,
	        f = void 0,
	        g = void 0,
	        i = void 0,
	        p = void 0,
	        q = void 0,
	        r = void 0,
	        t = void 0;
	    i = Math.floor(h * 6);
	    f = h * 6 - i;
	    p = v * (1 - s);
	    q = v * (1 - f * s);
	    t = v * (1 - (1 - f) * s);

	    switch (i % 6) {
	        case 0:
	            r = v;
	            g = t;
	            b = p;
	            break;
	        case 1:
	            r = q;
	            g = v;
	            b = p;
	            break;
	        case 2:
	            r = p;
	            g = v;
	            b = t;
	            break;
	        case 3:
	            r = p;
	            g = q;
	            b = v;
	            break;
	        case 4:
	            r = t;
	            g = p;
	            b = v;
	            break;
	        case 5:
	            r = v;
	            g = p;
	            b = q;
	            break;
	    }

	    return {
	        r: Math.floor(r * 255),
	        g: Math.floor(g * 255),
	        b: Math.floor(b * 255)
	    };
	}

	/*********************************************
	    Convolution filters
	 *********************************************/

	function convolve(data, weights, opaque) {
	    var side = Math.round(Math.sqrt(weights.length));
	    var halfSide = Math.floor(side / 2);

	    var srcData = data.data;
	    var sw = data.width;
	    var sh = data.height;
	    var w = sw;
	    var h = sh;

	    var output = _getOffscreenCanvasData(w, h);
	    var dst = output.data;

	    var alphaFac = opaque ? 1 : 0;

	    for (var y = 0; y < h; y++) {
	        for (var x = 0; x < w; x++) {
	            var sy = y;
	            var sx = x;
	            var dstOff = (y * w + x) * 4;

	            var r = 0,
	                g = 0,
	                b = 0,
	                a = 0;

	            for (var cy = 0; cy < side; cy++) {
	                for (var cx = 0; cx < side; cx++) {
	                    var scy = sy + cy - halfSide;
	                    var scx = sx + cx - halfSide;

	                    if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
	                        var srcOff = (scy * sw + scx) * 4;
	                        var wt = weights[cy * side + cx];
	                        r += srcData[srcOff] * wt;
	                        g += srcData[srcOff + 1] * wt;
	                        b += srcData[srcOff + 2] * wt;
	                        a += srcData[srcOff + 3] * wt;
	                    }
	                }
	            }

	            dst[dstOff] = r;
	            dst[dstOff + 1] = g;
	            dst[dstOff + 2] = b;
	            dst[dstOff + 3] = a + alphaFac * (255 - a);
	        }
	    }
	    return output;
	}

	function sharpen(data, adjust) {
	    var adj = adjust ? adjust : 100;
	    adj /= 100;

	    var weights = [0, -adj, 0, -adj, 4 * adj + 1, -adj, 0, -adj, 0];

	    return convolve(data, weights);
	}

/***/ })
/******/ ]);