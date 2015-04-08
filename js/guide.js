"use strict";
window.onload = function(){

	var TD = TD || {};
	TD.imgPath = 'http://xzz.com/up2015/img/screen/';

	//数字补位函数pad(100, 5) => '00100'
	TD.pad = (function() {
		var padLen = 5; //补位常数
		var tbl = [];
		return function(num, n) {
			n = n || padLen;
			var len = n-num.toString().length;
			if (len <= 0) return num;
			if (!tbl[len]) tbl[len] = (new Array(len+1)).join('0');
			return tbl[len] + num;
		}
	})();

	//图片序列预加载
	TD.preloadImgs = (function(){
		var fn = function(el){
			var that = this;

			var prefixName = el.attr('data-prefix');
			var keyTo = parseInt(el.attr('data-keyTo'));
			var keyList = [];
			var count = 0;
			this.len = keyTo+1;
			var successFn = function(){
				count++;

				if (count == keyTo+1) {
					//把已经加载好的dom存入内存缓存中方便后续调用:TD.preloadImgs.home_title
					TD.preloadImgs.buffer[prefixName.slice(0, prefixName.length-1)] = keyList;
					that.onload && that.onload();
				}else {
					//that.onloading && that.onloading(count/(keyTo + 1) * 100);
				}
				that.onloading && that.onloading();
			}

			//写的时候必须先绑定onload，否则有可能从缓存中读取的onload事件会被忽略
			this.onload = null;
			this.onloading = null;
			this.load = function(){
				//如果在内存中已经保存
				if (TD.preloadImgs.buffer[prefixName.slice(0, prefixName.length-1)]) {
					for(var i = 0; i < keyTo+1; i++){
						count++;
						that.onloading && that.onloading();
					}
					that.onload && that.onload();
					return;
				};

				for(var i = 0; i < keyTo+1; i++){
					var img = new Image();
					img.src = TD.imgPath + prefixName + TD.pad(i) + '.jpg';
					img.onload = img.onerror = successFn;
					keyList.push(img);
				}
			}

		}
		//把函数当对象使用，存东西
		fn.buffer = {};
		return fn;
	})();

	//关键帧动画
	TD.KeyAnimation = (function(){
		var main = function(el, fps){
			fps = fps || 24;
			var that = this;
			var prefixName = el.attr('data-prefix');
			this.name = prefixName.slice(0, prefixName.length-1);
			var keyTo = parseInt(el.attr('data-keyTo'));
			var repeat = parseInt(el.attr('data-repeat')) || 0;
			var loop = parseInt(el.attr('data-loop')) || 0;
			var timeMac = null;
			//把已经加载好的图片从内存中拉出来
			var keyList = TD.preloadImgs.buffer[this.name];
			var count = 0;
			var canvas = null;
			var ctx = null;
			var loopLen = (keyTo+1) * loop;
			var loopCount = 0;
			
			var init = function(){
				el.empty();
				canvas = $('<canvas>').get(0);
				ctx = canvas.getContext("2d");
				canvas.width = keyList[0].width;
				canvas.height = keyList[0].height;
				canvas.style.display = 'block';
				canvas.style.width = '100%';
				canvas.style.height = '100%';
				canvas.style.position = 'relative';
				canvas.style.webkitTransform = 'translate3d(0, 0, 0)';
				el.append(canvas);
			}
			var repeatFn = function(){
				if (keyList[count].width != 0) {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(keyList[count], 0, 0, canvas.width, canvas.height);
				};
				count++;
				if (count > keyTo) {
					count = repeat;
				};
				if (loop) {
					loopCount++;
					if (loopCount >= loopLen) {
						loopCount = 0;
						that.wait();
					};
				};
			}
			this.show = function(){
				if (this.state == 'show') {
					return;
				};
				this.state = 'show';
				count = 0;
				repeatFn();
				timeMac = setInterval(repeatFn, 1000/fps);
			}
			this.wait = function(n){
				if (this.state == 'wait') {
					return;
				};
				n = n || 0;
				this.state = 'wait';
				clearInterval(timeMac);
				count = n;
				repeatFn();
			}
			this.stop = function(){
				this.state = 'stop';
				clearInterval(timeMac);
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(keyList[repeat], 0, 0, canvas.width, canvas.height);
				keyList = null;
			}
			this.state = null;
			init();
		};

		var fn = function(el, fps){
			var prefixName = el.attr('data-prefix');
			var name = prefixName.slice(0, prefixName.length-1);
			//如果内存中已经存在该动画则直接返回
			if (fn.buffer[name]) {
				return fn.buffer[name];
			}
			var keyAni = new main(el, fps);
			fn.buffer[name] = keyAni;
			return keyAni;
		}

		//把初始化过的动画都存这里
		fn.buffer = {};
		return fn;
	})(); 

	var imgPreload = function(){
		var imgEls = $('.m-main img');
		var canvasEls = $('.m-main .canvas');

		var loadFirstHandler = function(direction){
			var el = $(this.element);
			var prefixName = el.attr('data-prefix');
			this.disable();
			if (el.find('canvas').length > 0) {
				return;
			};
			el.find('img').attr('src', TD.imgPath + prefixName + '00000.jpg');
		}

		imgEls.each(function(i){
			var el = $(this);
			var src = el.attr('data-src');
			el.attr('src', src);
		});

		//预加载第一张图片
		canvasEls.each(function(i){
			$(this).waypoint({
				handler: loadFirstHandler,
				offset: '100%'
			});
		});
	}

	var canvasPreload = function(){
		var canvasEls = $('.m-main .canvas');

		var loadHandler = function(direction){
			var that = this;
			var pre = new TD.preloadImgs($(this.element));
			pre.load();
			pre.onload = function(){
				showAniHandler.call(that);
			}
			this.destroy();
		}

		var showAniHandler = function(direction){
			var el = $(this.element);
			var prefixName = el.attr('data-prefix');
			var name = prefixName.slice(0, prefixName.length-1);
			//图片还没有加载完成
			if (!TD.preloadImgs.buffer[name]) {
				return;
			};
			//如果还没有创建帧动画则创建
			var keyAni = null;
			if (!TD.KeyAnimation.buffer[name]) {
				keyAni = new TD.KeyAnimation(el, 24);
				keyAni.wait();
				
			}else {
				keyAni = TD.KeyAnimation.buffer[name];
			}

			if (direction == 'up') {
				//向上滑的时候触发
				if (window.scrollY + window.innerHeight + 10 > el.offset().top && el.offset().top >= window.scrollY - this.element.clientHeight) {
					console.log(keyAni.name + ' up show');
					keyAni.show();
				}else {
					//元素已经滑出视窗
					console.log(keyAni.name + ' up wait');
					keyAni.wait();
				}
			}else if (direction == 'down'){
				//向下滑的时候触发
				if (window.scrollY + window.innerHeight >= el.offset().top && el.offset().top > window.scrollY - this.element.clientHeight) {
					console.log(keyAni.name + ' down show');
					keyAni.show();
				}else {
					//元素已经滑出视窗
					console.log(keyAni.name + ' down wait');
					keyAni.wait();
				}
			}else {
				//onload触发的回调
				if (window.scrollY + window.innerHeight >= el.offset().top && el.offset().top >= window.scrollY - this.element.clientHeight) {
					console.log(keyAni.name + ' onload show');
					keyAni.show();
				}else {
					//元素已经滑出视窗
					console.log(keyAni.name + ' onload wait');
					keyAni.wait();
				}
			}
			
		}

		//加载图片事件
		canvasEls.each(function(i){
			$(this).waypoint({
				handler: loadHandler,
				offset: '100%'
			});
		});

		//触发动画事件
		canvasEls.each(function(i){
			$(this).waypoint({
				handler: showAniHandler,
				offset: '100%'
			});

			$(this).waypoint({
				handler: showAniHandler,
				offset: function(){
					return -this.element.clientHeight;
				}
			});
		});
	}

	imgPreload();
	canvasPreload();
};