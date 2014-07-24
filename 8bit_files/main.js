// Color Cycling in HTML5 Canvas
// BlendShift Technology conceived, designed and coded by Joseph Huckaby
// Copyright (c) 2001-2002, 2010 Joseph Huckaby.
// Released under the LGPL v3.0: http://www.opensource.org/licenses/lgpl-3.0.html

FrameCount.visible = false;

var CanvasCycle = {
	
	ctx: null,
	imageData: null,
	clock: 0,
	inGame: false,
	bmp: null,
	globalTimeStart: (new Date()).getTime(),
	inited: false,
	globalBrightness: 1.0,
	lastBrightness: 0,
	sceneIdx: -1,
	highlightColor: -1,
	defaultMaxVolume: 0.5,
	
	settings: {
		showOptions: false,
		targetFPS: 60,
		zoomFull: true,
		blendShiftEnabled: true,
		speedAdjust: 1.0
	},

	contentSize: {
		width: 640,
		optionsWidth: 0,
		height: 480,
		scale: 0.0
	},

	init: function() {
		// called when DOM is ready
		if (!this.inited) {
			this.inited = true;
			$('container').style.display = 'block';
		
			FrameCount.init();
			this.handleResize();

		
			// pick starting scene
			// var initialSceneIdx = Math.floor( Math.random() * scenes.length );
			var initialSceneIdx = Math.round(Math.random() * scenes.length);
		
			this.loadImage( scenes[initialSceneIdx].name );
			this.sceneIdx = initialSceneIdx;
		}
	},

	jumpScene: function(dir) {
		// next or prev scene
		this.sceneIdx += dir;
		if (this.sceneIdx >= scenes.length) this.sceneIdx = 0;
		else if (this.sceneIdx < 0) this.sceneIdx = scenes.length - 1;
		$('fe_scene').selectedIndex = this.sceneIdx;
		this.switchScene( $('fe_scene') );
	},

	switchScene: function(menu) {
		// switch to new scene (grab menu selection)
		this.stopSceneAudio();
		
		var name = menu.options[menu.selectedIndex].value;
		this.sceneIdx = menu.selectedIndex;
		
		this.inGame = false;
		
		this.ctx.clearRect(0, 0, this.bmp.width, this.bmp.height);
		this.ctx.fillStyle = "rgb(0,0,0)";
		this.ctx.fillRect (0, 0, this.bmp.width, this.bmp.height);
		
		CanvasCycle.globalBrightness = 1.0;
		CanvasCycle.loadImage( name );

	},

	loadImage: function(name) {
		// load image JSON from the server
		this.stop();
		this.showLoading();
		
		var url = '8bit_files/Scenes/'+name+'.js';
		var scr = document.createElement('SCRIPT');
		scr.type = 'text/javascript';
		scr.src = url;
		document.getElementsByTagName('HEAD')[0].appendChild(scr);
	},
	
	showLoading: function() {
		// show spinning loading indicator
		var loading = $('d_loading');
		loading.style.left = '' + Math.floor( ((this.contentSize.width * this.contentSize.scale) / 2) - 16 ) + 'px';
		loading.style.top = '' + Math.floor( ((this.contentSize.height * this.contentSize.scale) / 2) - 16 ) + 'px';
		loading.show();
	},
	
	hideLoading: function() {
		// hide spinning loading indicator
		$('d_loading').hide();
	},

	processImage: function(img) {
		// initialize, receive image data from server
		this.bmp = new Bitmap(img);
		this.bmp.optimize();
	
		// $('d_debug').innerHTML = img.filename;
		
		var canvas = $('mycanvas');
		if (!canvas.getContext) return; // no canvas support
	
		if (!this.ctx) this.ctx = canvas.getContext('2d');
    
		this.ctx.clearRect(0, 0, this.bmp.width, this.bmp.height);
		this.ctx.fillStyle = "rgb(0,0,0)";
		this.ctx.fillRect (0, 0, this.bmp.width, this.bmp.height);
	
		if (!this.imageData) {
			if (this.ctx.createImageData) {
				this.imageData = this.ctx.createImageData( this.bmp.width, this.bmp.height );
			}
			else if (this.ctx.getImageData) {
				this.imageData = this.ctx.getImageData( 0, 0, this.bmp.width, this.bmp.height );
			}
			else return; // no canvas data support
		}
		
		this.globalBrightness = 1.0;
		
		this.hideLoading();
		this.run();
	},
	
	run: function () {
		// start main loop
		if (!this.inGame) {
			this.inGame = true;
			this.animate();
		}
	},
	
	stop: function() {
		// stop main loop
		this.inGame = false;
	},

	animate: function() {
		// animate one frame. and schedule next
		if (this.inGame) {
			var colors = this.bmp.palette.colors;
	
			if (this.settings.showOptions) {
				for (var idx = 0, len = colors.length; idx < len; idx++) {
					var clr = colors[idx];
					var div = $('pal_'+idx);
					div.style.backgroundColor = 'rgb(' + clr.red + ',' + clr.green + ',' + clr.blue + ')';
				}
		
				// if (this.clock % this.settings.targetFPS == 0) $('d_debug').innerHTML = 'FPS: ' + FrameCount.current;
				$('d_debug').innerHTML = 'FPS: ' + FrameCount.current + ((this.highlightColor != -1) ? (' - Color #' + this.highlightColor) : '');
			}
	
			this.bmp.palette.cycle( this.bmp.palette.baseColors, GetTickCount(), this.settings.speedAdjust, this.settings.blendShiftEnabled );
			if (this.highlightColor > -1) {
				this.bmp.palette.colors[ this.highlightColor ] = new Color(255, 255, 255);
			}
			if (this.globalBrightness < 1.0) {
				// bmp.palette.fadeToColor( pureBlack, 1.0 - globalBrightness, 1.0 );
				this.bmp.palette.burnOut( 1.0 - this.globalBrightness, 1.0 );
			}
			this.bmp.render( this.imageData, (this.lastBrightness == this.globalBrightness) && (this.highlightColor == this.lastHighlightColor) );
			this.lastBrightness = this.globalBrightness;
			this.lastHighlightColor = this.highlightColor;
	
			this.ctx.putImageData( this.imageData, 0, 0 );
	
			TweenManager.logic( this.clock );
			this.clock++;
			FrameCount.count();
			this.scaleAnimate();
			if (this.inGame) {
				setTimeout( function() { CanvasCycle.animate(); }, 1 );
			}
		}
	},

	scaleAnimate: function() {
		// scale up to full size
		var totalNativeWidth = 640;
		var maxScaleX = window.innerWidth / totalNativeWidth;
	
		var totalNativeHeight = 480;
		var maxScaleY = window.innerHeight / totalNativeHeight;
	
		var maxScale = Math.min( maxScaleX, maxScaleY ) * 0.75;
	
		if (this.contentSize.scale != maxScale) {
			this.contentSize.scale = maxScale;
		
			var sty = $('mycanvas').style; 
			var left = window.innerWidth/2 - ((640/2)*(this.contentSize.scale-0.75))
			var top = (480/2)*(this.contentSize.scale-0.5)
			if (ua.webkit) sty.webkitTransform = 'translate(' + left + 'px, ' + top + 'px) scale(' + this.contentSize.scale + ')';
			else if (ua.ff) sty.MozTransform = 'translate('+ left +'px, '+ top +'px) scale('+this.contentSize.scale+')';
			else if (ua.op) sty.OTransform = 'translate('+ left +'px, '+ top +'px) scale('+this.contentSize.scale+')';
			else sty.transform = 'translate(' + left + 'px, ' + top + 'px)  scale('+this.contentSize.scale+')';
		}
	},

	handleResize: function() {
		this.scaleAnimate();
	}
};

var CC = CanvasCycle; // shortcut
