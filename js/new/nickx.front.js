(function($){$.fn.touchwipe=function(settings){var config={min_move_x:20,min_move_y:20,wipeLeft:function(){},wipeRight:function(){},wipeUp:function(){},wipeDown:function(){},preventDefaultEvents:true};if(settings)$.extend(config,settings);this.each(function(){var startX;var startY;var isMoving=false;function cancelTouch(){this.removeEventListener('touchmove',onTouchMove);startX=null;isMoving=false}function onTouchMove(e){if(config.preventDefaultEvents){e.preventDefault()}if(isMoving){var x=e.touches[0].pageX;var y=e.touches[0].pageY;var dx=startX-x;var dy=startY-y;if(Math.abs(dx)>=config.min_move_x){cancelTouch();if(dx>0){config.wipeLeft()}else{config.wipeRight()}}else if(Math.abs(dy)>=config.min_move_y){cancelTouch();if(dy>0){config.wipeDown()}else{config.wipeUp()}}}}function onTouchStart(e){if(e.touches.length==1){startX=e.touches[0].pageX;startY=e.touches[0].pageY;isMoving=true;this.addEventListener('touchmove',onTouchMove,false)}}if('ontouchstart'in document.documentElement){this.addEventListener('touchstart',onTouchStart,false)}});return this}})(jQuery);
function parseURL(url){
    url.match(/(http:|https:|)\/\/(player.|www.|m.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/);
    if (RegExp.$3.indexOf('youtu') > -1) {
        var type = 'youtube';
    } else if (RegExp.$3.indexOf('vimeo') > -1) {
        var type = 'vimeo';
    }
    return { type: type, id: RegExp.$6 };
}
const nquery = jQuery;
function onYouTubePlayerStateChange(event){
  if(event.data == 0){
  	if(wc_prd_vid_slider_setting.nickx_lic && wc_prd_vid_slider_setting.nickx_videoloop == 'yes'){
			playPauseVideo("play");  	
		  nquery('.overlay-div').show();
		} else if(wc_prd_vid_slider_setting.nickx_sliderautoplay == 'yes'){
			window.slideWrapper.slideNext();
		  window.slideWrapper.autoplay.start();
		  nquery('.overlay-div').css({display:''});
		}
  }
  if(wc_prd_vid_slider_setting.nickx_sliderautoplay == 'yes'){
		if(event.data == 2){
    	window.slideWrapper.autoplay.start();
	  	nquery('.overlay-div').css({display:''});
  	}
  	if(event.data == 1){
    	window.slideWrapper.autoplay.stop();
	  	nquery('.overlay-div').css({display:''});
  	}
  }
}
var prd_yt_player = [];
function onYouTubeIframeAPIReady(){
	nquery('.product_video_iframe[id^="nickx_yt_video_"]').each(function(index,elem){
		nquery(this).load(function(e){
  		prd_yt_player = new YT.Player(this, { events: { 'onStateChange': onYouTubePlayerStateChange } });
		});
	});
}
function postMessageToPlayer(player, command){
  if (player == null || command == null) return;
  player.contentWindow.postMessage(JSON.stringify(command), "*");
}
function playPauseVideo(control){
	player = nquery('.tc_video_slide.nswiper-slide-active').find('.product_video_iframe').get(0);
	switch (nquery(player).attr('video-type')){
		case "vimeo":
    	player = new Vimeo.Player(player);
	    switch (control) {
	      case "play":
		    	player.play();
	        break;
	      default:
		    	player.pause();
	    }
      break;
    case "youtube":
    	switch (control) {
	      case "play":
	        postMessageToPlayer(player, {
	          "event": "command",
	          "func": "playVideo"
	        });
	        break;
	      default:
	        postMessageToPlayer(player, {
	          "event": "command",
	          "func": "pauseVideo"
	        });
	    }
      break;
    case "html5":
    	switch (control) {
	      case "play":
	    	player.play();
	        break;
	      default:
	    	player.pause();
	    }
      break;
    case "iframe":
    	if(control == "pause"){
	    	nquery(player).attr('src',nquery(player).attr('src'));
    	}
      break;
	}
}
(function(nquery) {	
	function nickx_set_zoom_img(){
		if(wc_prd_vid_slider_setting.nickx_show_zoom != 'off'){
			if(wc_prd_vid_slider_setting.nickx_show_zoom == 'yes' || nquery(window).width() < 768){
				nquery('.nickx-slider-for .nswiper-slide').zoom({magnify:wc_prd_vid_slider_setting.nickx_zoomlevel});
				nquery('.nickx-slider-for .nswiper-slide-active').zoom({magnify:wc_prd_vid_slider_setting.nickx_zoomlevel});
			} else {
				nquery('.zoomWindowContainer,.zoomContainer').remove();
				nquery('.nickx-slider-for .main_arrow, .nickx-slider-nav .thumb_arrow').css({ opacity: 1 });
		    var $activeImage = nquery('.nickx-slider.nickx-slider-for .nswiper-slide-active img');
		    if ($activeImage.length) {
		      $activeImage.closest('.nswiper-slide-active').css('transform', 'none');
					$activeImage.elevateZoom({zoomType:wc_prd_vid_slider_setting.nickx_show_zoom, cursor:"crosshair", borderSize:1, containLensZoom:1, scrollZoom:1,zoomLevel:wc_prd_vid_slider_setting.nickx_zoomlevel, zoomWindowHeight: 550, zoomWindowWidth:550, zoomWindowOffetx: 10});
		    }
			}
		}
	}
	function get_YT_Id(url){
	  var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
	  var match = url.match(regExp);
	  if (match && match[2].length == 11){
	    return match[2];
	  } else {
	    return 'error';
	  }
	}
	function nickx_variations_image_reset() {
		nquery('.zoom.nswiper-slide .wp-post-image').attr('data-zoom-image',nquery('.zoom.nswiper-slide .wp-post-image').attr('data-o_zoom-image'));
		nquery('.zoom.nswiper-slide .wp-post-image').attr('src',nquery('.zoom.nswiper-slide .wp-post-image').attr('data-o_src'));
		nquery('.zoom.nswiper-slide.woocommerce-product-gallery__image span.nickx-popup').attr('href',nquery('.zoom.nswiper-slide .wp-post-image').attr('data-o_zoom-image'));
		nquery('.nickx-slider-nav .wp-post-image-thumb img').attr( 'src', nquery('.nickx-slider-nav .wp-post-image-thumb img').attr('data-o_src'));
		if(nquery('.nickx-slider-nav .wp-post-image-thumb img').attr('srcset')){
			nquery('.nickx-slider-nav .wp-post-image-thumb img').attr( 'srcset', nquery('.nickx-slider-nav .wp-post-image-thumb img').attr('data-o_srcset'));
		}
		if(nquery('.zoom.nswiper-slide .wp-post-image').attr('srcset')){
			nquery('.zoom.nswiper-slide .wp-post-image').attr( 'srcset', nquery('.zoom.nswiper-slide .wp-post-image').attr('data-o_srcset'));
		}
	}
	nquery(document).ready(function() {
		nquery('span.nickx-popup_trigger').click(function(e){
		    nquery('.nswiper-slide-active span.nickx-popup').click();
		});
		if(nquery('.nickx-slider-for').length > 0) {
			let slider_autoplay = (wc_prd_vid_slider_setting.nickx_sliderautoplay == 'yes') ? true : false;
			let infinitescroll = (wc_prd_vid_slider_setting.nickx_arrowinfinite =='yes') ? true : false;
			let slider_arrow = (wc_prd_vid_slider_setting.nickx_arrowdisable =='yes') ? true : false;
			let sliderfade = (wc_prd_vid_slider_setting.nickx_sliderfade =='yes') ? 'fade' : 'slide';
			let nickx_rtl = (wc_prd_vid_slider_setting.nickx_rtl =='1') ? true : false;
			let adaptiveHeight = (wc_prd_vid_slider_setting.nickx_adaptive_height == 'yes') ? true : false;
			let nickx_variation_selector = (wc_prd_vid_slider_setting.nickx_variation_selector == 'document') ? document : wc_prd_vid_slider_setting.nickx_variation_selector;
			if(wc_prd_vid_slider_setting.nickx_show_lightbox != 'yes'){
				nquery('a.nickx-popup').remove();
			}
			var slide_count = nquery('.images.nickx_product_images_with_video .zoom, .images.nickx_product_images_with_video .tc_video_slide').length;
			var sliderlayout = (slide_count > 1 || wc_prd_vid_slider_setting.nickx_hide_thumbnail != 'yes') ? wc_prd_vid_slider_setting.nickx_slider_layout : 'horizontal';
			var verticalslider = (sliderlayout == 'horizontal' && sliderlayout !='' ) ? 'horizontal' : 'vertical';
		
			if(verticalslider == 'vertical' && wc_prd_vid_slider_setting.nickx_slider_responsive == 'yes' && window.innerWidth < 767 ){
				verticalslider = 'horizontal';
			}
			let slider_thumbs = false;
			if(wc_prd_vid_slider_setting.nickx_hide_thumbnails != 'yes' && nquery('.nickx-slider-nav').length > 0 ){
				if( wc_prd_vid_slider_setting.nickx_thumnails_layout == 'slider' ){					
					if( verticalslider == 'vertical' && parseInt(wc_prd_vid_slider_setting.nickx_thumbnails_to_show) > slide_count  ){
						const navstyle = document.createElement('style');
						navstyle.innerHTML = `
						.nickx_product_images_with_video:not(:has(.nswiper.nswiper-vertical .nswiper-slide:nth-child(`+parseInt(wc_prd_vid_slider_setting.nickx_thumbnails_to_show)+`))) .nickx-slider-nav .nswiper-slide{
						  height: auto !important;
						}`;
						document.head.appendChild(navstyle);
					}
					slider_thumbs = new nSwiper('.nickx-slider-nav', {
						slidesPerView: parseInt(wc_prd_vid_slider_setting.nickx_thumbnails_to_show),
						watchSlidesProgress: true,
						centeredSlides: false,
						focusableElements: true,
		    		spaceBetween: 8,
	    			freeMode: true,
	      		direction: verticalslider,
					});
				} else {
					nquery('div#nickx-gallery .nickx-thumbnail').click(function(e){
						nquery('div#nickx-gallery .nickx-thumbnail').removeClass('nswiper-slide-thumb-active');
						nquery(this).addClass('nswiper-slide-thumb-active');
						var index = nquery("div#nickx-gallery .nickx-thumbnail").index(this);
						slideWrapper.slideToLoop(index);
					});
				}
				nquery('.nswiper-button-next.thumb_arrow').on('click', function() {
				    slideWrapper.slideNext();
				});
				nquery('.nswiper-button-prev.thumb_arrow').on('click', function() {
				    slideWrapper.slidePrev();
				});
			}
			const slideWrapper = new nSwiper('.nickx-slider-for', {
		    spaceBetween: 10,
		    focusableElements: true,
		    thumbs: { nswiper: slider_thumbs },
				loop: infinitescroll,
				effect: sliderfade,
				autoplay: slider_autoplay,
				autoHeight: adaptiveHeight,
				slideActiveClass: 'nswiper-slide-active',
				slideDuplicateActiveClass: 'nswiper-slide-duplicate-active',
				watchSlidesProgress: true,
				navigation: {
	        enabled:slider_arrow,
	        nextEl: ".nswiper-button-next",
	        prevEl: ".nswiper-button-prev",
			  },
			  slidesPerView: 1,
			  on: {
			    init: function () {
				    nquery('.zoom.nswiper-slide .wp-post-image').attr('data-o_zoom-image',nquery('.zoom.nswiper-slide .wp-post-image').attr('data-zoom-image'));
						nquery('.zoom.nswiper-slide .wp-post-image').attr('data-o_src',nquery('.zoom.nswiper-slide .wp-post-image').attr('src'));
						nquery('.nickx-slider-nav .wp-post-image-thumb img').attr( 'data-o_src', nquery('.nickx-slider-nav .wp-post-image-thumb img').attr('src'));
						if(nquery('.nickx-slider-nav .wp-post-image-thumb img').attr('srcset')){
							nquery('.nickx-slider-nav .wp-post-image-thumb img').attr( 'data-o_srcset', nquery('.nickx-slider-nav .wp-post-image-thumb img').attr('srcset'));
						}
						if(nquery('.zoom.nswiper-slide .wp-post-image').attr('srcset')){
							nquery('.zoom.nswiper-slide .wp-post-image').attr( 'data-o_srcset', nquery('.zoom.nswiper-slide .wp-post-image').attr('srcset'));
						}
						setIframeHeight();
						set_nickx_popup_trigger();
						equalizeThumbHeights();
						setTimeout(nickx_set_zoom_img, 100);
						setTimeout(equalizeThumbHeights, 1000);
			    }, slideChange: function (nswiper) {
						setTimeout(nickx_set_zoom_img, 100);
						playPauseVideo('pause');
						nickx_set_zoom_img();
						if( wc_prd_vid_slider_setting.nickx_thumnails_layout == 'grid' ){
							nquery('div#nickx-gallery .nickx-thumbnail').removeClass('nswiper-slide-thumb-active');
						}
						setTimeout(function(e){
							set_nickx_popup_trigger();
							if( wc_prd_vid_slider_setting.nickx_thumnails_layout == 'grid' ){
								current = nquery('.nswiper-slide.nswiper-slide-active').attr('data-nswiper-slide-index');
								var active_slide = nquery('div#nickx-gallery .nickx-thumbnail').get(current);
								nquery(active_slide).addClass('nswiper-slide-thumb-active');
							}
							if(wc_prd_vid_slider_setting.nickx_lic && wc_prd_vid_slider_setting.nickx_videoloop == 'yes'){
								if(nquery('.tc_video_slide.nswiper-slide-active').length > 0){
									playPauseVideo("play");
								}
							}
						},200);
					}
			  }
			});
			window.slideWrapper = slideWrapper;
			nquery('.product_video_iframe').each(function(index, elem){
				if(nquery(this).attr('video-type')=='youtube'){
					let yt_youtube_url = nquery(this).attr('src');
					var iframe_src = get_YT_Id(yt_youtube_url);
					let nocookie = '';
					if(yt_youtube_url.search("nocookie") > 0){
						nocookie = '-nocookie';   
					}
			    nquery(this).parent('div').find('.product_video_iframe_light').attr('href','https://www.youtube'+nocookie+'.com/embed/'+iframe_src+'?enablejsapi=1&wmode=opaque&rel=0');
			    if(nquery('.product_video_img.img_'+ index).attr('custom_thumbnail') != 'yes'){
				    nquery('.product_video_img.img_'+ index).attr('src','https://img.youtube.com/vi/'+iframe_src+'/mqdefault.jpg');
			    }
					nquery(this).css({'height':nquery(this).parent('div').width()});
					if(nquery('#iframe-demo').length == 0){
						var tag = document.createElement('script');
						tag.id = 'iframe-demo';
						tag.src = 'https://www.youtube.com/iframe_api';
						var firstScriptTag = document.getElementsByTagName('script')[0];
						firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
					}
				}
				if(wc_prd_vid_slider_setting.nickx_lic && nquery(this).attr('video-type')=='vimeo'){
					var vimeo_url = nquery(this).attr('src');
				  var player = new Vimeo.Player(this);
			    if(wc_prd_vid_slider_setting.nickx_lic && wc_prd_vid_slider_setting.nickx_videoloop == 'yes'){
				    player.setLoop(true);
					} else {
					  player.setLoop(false);
					}
					if(wc_prd_vid_slider_setting.nickx_sliderautoplay == 'yes'){
				    player.on('play', function(){
	    				slideWrapper.autoplay.stop();
					  	nquery('.overlay-div').css({display:''});
				    });
				    player.on('playing', function(){
	    				slideWrapper.autoplay.stop();
					  	nquery('.overlay-div').css({display:''});
				    });
				    player.on('pause', function(){
	    				slideWrapper.autoplay.start();
					  	nquery('.overlay-div').css({display:''});
				    });
		    	 	if(wc_prd_vid_slider_setting.nickx_videoloop != 'yes'){
					    player.on('ended', function(){
					  		nquery('.overlay-div').css({display:''});
						    slideWrapper.slideNext();
						    slideWrapper.autoplay.start();
					    });
						}
					}
				  if(nquery('.product_video_img.img_'+ index).attr('custom_thumbnail') != 'yes'){
						var videoDetails = parseURL(vimeo_url);
						var videoType = videoDetails.type;
						var videoID = videoDetails.id;
						var xhr = new XMLHttpRequest();
			    	xhr.open("GET", "https://vimeo.com/api/v2/video/"+ videoID +".json", true);
			    	xhr.onload = function(e) {
			      		if(xhr.readyState === 4) {
			        		if(xhr.status === 200) {
			          			var data = xhr.responseText;
				        	  	var parsedData = JSON.parse(data);
					          	thumbnail_small = parsedData[0].thumbnail_small;
					          	thumbnail_medium = parsedData[0].thumbnail_medium;
					          	thumbnail_large = parsedData[0].thumbnail_large;
					          	width = nquery('.product_video_img.img_'+ index).attr('width');
					          	height = nquery('.product_video_img.img_'+ index).attr('height');
					          	nquery('.product_video_img.img_'+ index).attr('src',thumbnail_large.replace("d_640", 'd_'+width+'x'+height));
			        		} else {
			          			console.error(xhr.statusText);
			        		}
			      		}
			    	};
			    	xhr.send(null);
			    }
				}
				if(wc_prd_vid_slider_setting.nickx_lic && nquery(this).attr('video-type')=='html5'){
					var vid = this;
					if(wc_prd_vid_slider_setting.nickx_lic && wc_prd_vid_slider_setting.nickx_videoloop == 'yes'){
						nquery(this).attr('loop','loop');
					}
			    if(nquery('.product_video_img.img_'+ index).attr('custom_thumbnail') != 'yes'){
						vid.currentTime = 2;
						let nicx_timesRun = 0;
						let video_thumb = nquery('.product_video_img.img_'+ index);
						let w = video_thumb.attr('width');//video.videoWidth * scaleFactor;
						let h = video_thumb.attr('height');//video.videoHeight * scaleFactor;
						let interval = setInterval(function(){
						    nicx_timesRun++;
						    if(nicx_timesRun === 6){
						        clearInterval(interval);
								vid.currentTime = 0;
						    }
							var canvas = document.createElement('canvas');
							canvas.width = w;
							canvas.height = h;
							var ctx = canvas.getContext('2d');
							ctx.drawImage(vid, 0, 0, w, h);
							var data = canvas.toDataURL("image/jpg");
				          	nquery('.product_video_img.img_'+ index).attr('src',data);
						}, 1000);
					}
					if(wc_prd_vid_slider_setting.nickx_sliderautoplay == 'yes') {
						vid.onplaying = function(){
						  	slideWrapper.autoplay.stop();
						  	nquery('.overlay-div').css({display:''});
						};
						vid.onplay = function(){
						  	slideWrapper.autoplay.stop();
						  	nquery('.overlay-div').css({display:''});
						};
						vid.onpause = function(){
						  	slideWrapper.autoplay.start();
						  	nquery('.overlay-div').css({display:''});
						};
						vid.onended = function(){
						  	nquery('.overlay-div').show();
						  	if(wc_prd_vid_slider_setting.nickx_lic && wc_prd_vid_slider_setting.nickx_videoloop == 'yes'){
								vid.play();
							} else {
								slideWrapper.slideNext();
							  slideWrapper.autoplay.start();
							}
						};
					}
				}
			});
			if( nquery('.product_video_iframe').length > 0 && nquery(window).width() < 768 ){
				var overlayDiv = '<div class="overlay-div" style="position:absolute; background-color:transparent">';
				var iframe = nquery('.product_video_iframe');
				iframe.parent().append(nquery(overlayDiv).css({
					'top':iframe.offset().top,
					'left':iframe.offset().left,
					"width":iframe.width()+"px",
					"height":iframe.height()+"px"
				}));
				nquery(document).on('click touchstart', function(event){
					if(nquery(event.target).attr("class") != 'overlay-div' && nquery(event.target).attr("class") != 'product_video_iframe fitvidsignore')nquery('.overlay-div').css({display:''}); 
				});
				nquery('.overlay-div').on('click touchstart', function(){ nquery(this).hide(); });
				nquery('.overlay-div').touchwipe({
					wipeLeft: function() { slideWrapper.slideNext(); },
					wipeRight: function() { slideWrapper.slidePrev(); },
					min_move_x: 30,
					min_move_y: 30,
					preventDefaultEvents: true
				});
			}
			if(wc_prd_vid_slider_setting.nickx_arrowcolor!=''){
				nquery(".nswiper-button-next, .nswiper-button-prev").css("color",wc_prd_vid_slider_setting.nickx_arrowcolor);
			}
			if(wc_prd_vid_slider_setting.nickx_arrowbgcolor!=''){
				nquery(".nswiper-button-next, .nswiper-button-prev").css("background",wc_prd_vid_slider_setting.nickx_arrowbgcolor);
			}
			const post_thumb_index = nquery('.nswiper-slide .wp-post-image').parent('.nswiper-slide').attr('data-nswiper-slide-index');
			nquery(document).on('reset_image',function(e){
				nickx_variations_image_reset();
				if( slide_count > 1 && nquery('.zoom.nswiper-slide .wp-post-image').attr('data-o_src') != nquery('.zoom.nswiper-slide .wp-post-image').attr('src')){
					slideWrapper.slideToLoop(post_thumb_index);
				}
			});
			nquery(nickx_variation_selector).on('found_variation', function(event,variation) {
				if ( variation && variation.image && variation.image.src && variation.image.src.length > 1 && variation.image.full_src != nquery('.zoom.nswiper-slide .wp-post-image').attr('data-o_zoom-image')) {
					nquery('.zoom.nswiper-slide .wp-post-image').attr('src',variation.image.src);
					nquery('.zoom.nswiper-slide .wp-post-image').attr('data-zoom-image',variation.image.full_src);
					nquery('.zoom.nswiper-slide.woocommerce-product-gallery__image span.nickx-popup').attr('href',variation.image.full_src);
					nquery('.nickx-slider-nav .wp-post-image-thumb img').attr('src', variation.image.gallery_thumbnail_src );
					if(variation.image.srcset){
						nquery('.zoom.nswiper-slide .wp-post-image').attr( 'srcset', variation.image.srcset );
						nquery('.nickx-slider-nav .wp-post-image-thumb img').removeAttr( 'srcset' );
					}
				} else {
					nickx_variations_image_reset();
				}
				nickx_set_zoom_img();
				if ( slide_count > 1 && variation.image.full_src != nquery('.zoom.nswiper-slide .wp-post-image').attr('data-o_zoom-image')) {
					slideWrapper.slideToLoop(post_thumb_index);
				}
			});
			if(wc_prd_vid_slider_setting.nickx_show_lightbox == 'yes'){
				nquery('[data-nfancybox="product-gallery"]').nfancybox(wc_prd_vid_slider_setting.nfancybox);
			}	
		}
		if (nquery(window).width() > 768 && wc_prd_vid_slider_setting.nickx_show_zoom != 'yes'){
			nquery(document).on('click','.zoomLens',function(e){
				if (nquery('.nickx-slider-for .zoomContainer').length == 0) {
			    let pageX = e.pageX;
			    let pageY = e.pageY;
			    const $container = nquery('.nickx-slider-for');
				  const $prevArrow = nquery('.nswiper-button-prev');
				  const $nextArrow = nquery('.nswiper-button-next');
				  const containerOffset = $container.offset();
				  const containerWidth = $container.outerWidth();
				  const containerHeight = $container.outerHeight();
				  const arrowZone = 60;
				    if (
				        pageX >= containerOffset.left &&
				        pageX <= containerOffset.left + arrowZone &&
				        pageY >= containerOffset.top &&
				        pageY <= containerOffset.top + containerHeight
				    ) {
				        $prevArrow.trigger('click');
				    } else if (
				        pageX >= containerOffset.left + containerWidth - arrowZone &&
				        pageX <= containerOffset.left + containerWidth &&
				        pageY >= containerOffset.top &&
				        pageY <= containerOffset.top + containerHeight
				    ) {
				      $nextArrow.trigger('click');
				    } else {
				    	nquery('.nickx-slider.nickx-slider-for .nswiper-slide-active span').click();
				    }
				} else {
			    nquery('.nickx-slider.nickx-slider-for .nswiper-slide-active span').click();
				}
			});
		}
	  setIframeHeight();
	});
	nquery(window).resize(function(){ setIframeHeight(); set_nickx_popup_trigger(); });
	function setIframeHeight(){
		nquery('iframe.product_video_iframe').each(function(i, item){
			var slide_1 = 500;
			if(nquery('.zoom.nswiper-slide').length > 0){
				var slides = nquery('.zoom.nswiper-slide');
				slide_1 = nquery(slides[0]).height();
				if(slide_1 < nquery(slides[1]).height()){
					slide_1 = nquery(slides[1]).height();
				}
			}
			nquery(item).css({ 'height': slide_1 });
			item.height = slide_1;
		});
	}
	function set_nickx_popup_trigger(){
		if(nquery('span.nickx-popup_trigger').length > 0){
			nquery('span.nickx-popup_trigger').css({'opacity':'0'});
			setTimeout(function(e){
				let current_link = nquery('.show_lightbox .nswiper-slide-active span.nickx-popup');
				let offset = current_link.offset();
				if( current_link && offset ){
					current_link.css({'opacity':'0'});
					nquery('span.nickx-popup_trigger').offset({ top: offset.top, left: offset.left}).css({'opacity':''});
				}
			},100);
		}
	}
	function equalizeThumbHeights() {
	  let maxHeight = 0;
	  const thumbs = document.querySelectorAll('.product_thumbnail_item img');
	  thumbs.forEach(img => {
	    if (img.offsetHeight > maxHeight) {
	      maxHeight = img.offsetHeight;
	    }
	  });
	  const videothumbs = document.querySelectorAll('.video-thumbnail img');
	  videothumbs.forEach(videoimg => {
	    videoimg.style.height = maxHeight + 'px';
	  });
	}
})(jQuery);
