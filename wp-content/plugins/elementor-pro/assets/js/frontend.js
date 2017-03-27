/*! elementor-pro - v1.2.4 - 21-03-2017 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var handlers = {
	form: require( 'modules/forms/assets/js/frontend/frontend' ),
	countdown: require( 'modules/countdown/assets/js/frontend/frontend' ),
	posts: require( 'modules/posts/assets/js/frontend/frontend' ),
	slides: require( 'modules/slides/assets/js/frontend/frontend' )
};

window.elementorProFrontend = {
	config: ElementorProFrontendConfig,
	modules: {}
};

jQuery( function( $ ) {
	$.each( handlers, function( moduleName ) {
		elementorProFrontend.modules[ moduleName ] = new this( $ );
	} );
} );

},{"modules/countdown/assets/js/frontend/frontend":2,"modules/forms/assets/js/frontend/frontend":4,"modules/posts/assets/js/frontend/frontend":7,"modules/slides/assets/js/frontend/frontend":10}],2:[function(require,module,exports){
module.exports = function() {
	elementorFrontend.hooks.addAction( 'frontend/element_ready/countdown.default', require( './handlers/countdown' ) );
};

},{"./handlers/countdown":3}],3:[function(require,module,exports){
var Countdown = function( $countdown, endTime, $ ) {
	var timeInterval,
		elements = {
			$daysSpan: $countdown.find( '.elementor-countdown-days' ),
			$hoursSpan: $countdown.find( '.elementor-countdown-hours' ),
			$minutesSpan: $countdown.find( '.elementor-countdown-minutes' ),
			$secondsSpan: $countdown.find( '.elementor-countdown-seconds' )
		};

	var updateClock = function() {
		var timeRemaining = Countdown.getTimeRemaining( endTime );

		$.each( timeRemaining.parts, function( timePart ) {
			var $element = elements[ '$' + timePart + 'Span' ],
				partValue = this.toString();

			if ( 1 === partValue.length ) {
				partValue = 0 + partValue;
			}

			if ( $element.length ) {
				$element.text( partValue );
			}
		} );

		if ( timeRemaining.total <= 0 ) {
			clearInterval( timeInterval );
		}
	};

	var initializeClock = function() {
		updateClock();

		timeInterval = setInterval( updateClock, 1000 );
	};

	initializeClock();
};

Countdown.getTimeRemaining = function( endTime ) {
	var timeRemaining = endTime - new Date(),
		seconds = Math.floor( ( timeRemaining / 1000 ) % 60 ),
		minutes = Math.floor( ( timeRemaining / 1000 / 60 ) % 60 ),
		hours = Math.floor( ( timeRemaining / ( 1000 * 60 * 60 ) ) % 24 ),
		days = Math.floor( timeRemaining / ( 1000 * 60 * 60 * 24 ) );

	if ( days < 0 || hours < 0 || minutes < 0 ) {
		seconds = minutes = hours = days = 0;
	}

	return {
		total: timeRemaining,
		parts: {
			days: days,
			hours: hours,
			minutes: minutes,
			seconds: seconds
		}
	};
};

module.exports = function( $scope, $ ) {
	var $element = $scope.find( '.elementor-countdown-wrapper' ),
		date = new Date( $element.data( 'date' ) * 1000 );

	new Countdown( $element, date, $ );
};

},{}],4:[function(require,module,exports){
module.exports = function() {
	elementorFrontend.hooks.addAction( 'frontend/element_ready/form.default', require( './handlers/form' ) );
	elementorFrontend.hooks.addAction( 'frontend/element_ready/form.default', require( './handlers/recaptcha' ) );
};

},{"./handlers/form":5,"./handlers/recaptcha":6}],5:[function(require,module,exports){
module.exports = function( $scope, $ ) {
	var $form = $scope.find( '.elementor-form' );

	$form.on( 'submit', function( event ) {
		event.preventDefault();

		var $submitButton = $form.find( '[type="submit"]' );

		if ( $form.hasClass( 'elementor-form-waiting' ) ) {
			return false;
		}

		$form
			.animate( {
				opacity: '0.45'
			}, 500 )
			.addClass( 'elementor-form-waiting' );

		$submitButton
			.attr( 'disabled', 'disabled' )
			.find( '> span' )
			.prepend( '<span class="elementor-button-text elementor-form-spinner"><i class="fa fa-spinner fa-spin"></i>&nbsp;</span>' );

		$form
			.find( '.elementor-message' )
			.remove();

		$form
			.find( '.elementor-error' )
			.removeClass( 'elementor-error' );

		$form
			.find( 'div.elementor-field-group' )
			.removeClass( 'error' )
			.find( 'span.elementor-form-help-inline' )
			.remove()
			.end()
			.find( ':input' ).attr( 'aria-invalid', 'false' );

		var formData = new FormData( $form[ 0 ] );
		formData.append( 'action', 'elementor_pro_forms_send_form' );
		formData.append( 'referrer', location.toString() );

		$.ajax( {
			url: elementorProFrontend.config.ajaxurl,
			type: 'POST',
			dataType: 'json',
			data: formData,
			processData: false,
			contentType: false,
			success: function( response, status ) {
				$submitButton
					.removeAttr( 'disabled' )
					.find( '.elementor-form-spinner' )
					.remove();

				$form
					.animate( {
						opacity: '1'
					}, 100 )
					.removeClass( 'elementor-form-waiting' );

				if ( ! response.success ) {
					if ( response.data.fields ) {
						$.each( response.data.fields, function( key, title ) {
							$form
								.find( 'div.elementor-field-group' ).eq( key )
								.addClass( 'elementor-error' )
								.append( '<span class="elementor-message elementor-message-danger elementor-help-inline elementor-form-help-inline" role="alert">' + title + '</span>' )
								.find( ':input' ).attr( 'aria-invalid', 'true' );
						} );
					}
					$form.append( '<div class="elementor-message elementor-message-danger" role="alert">' + response.data.message + '</div>' );
				} else {
					$form.trigger( 'submit_success' );
					$form.trigger( 'reset' );

					if ( '' !== response.data.message ) {
						$form.append( '<div class="elementor-message elementor-message-success" role="alert">' + response.data.message + '</div>' );
					}
					if ( '' !== response.data.link ) {
						location.href = response.data.link;
					}
				}
			},

			error: function( xhr, desc ) {
				$form.append( '<div class="elementor-message elementor-message-danger" role="alert">' + desc + '</div>' );

				$submitButton
					.html( $submitButton.text() )
					.removeAttr( 'disabled' );

				$form
					.animate( {
						opacity: '1'
					}, 100 )
					.removeClass( 'elementor-form-waiting' );

				$form.trigger( 'error' );
			}
		} );
	} );
};

},{}],6:[function(require,module,exports){
module.exports = function( $scope, $ ) {
	var $element = $scope.find( '.elementor-g-recaptcha:last' ),
		window;

	if ( ! $element.length ) {
		return;
	}

	var addRecaptcha = function( $element ) {
		var widgetId = window.grecaptcha.render( $element[0], $element.data() ),
			$form = $element.parents( 'form' );

		$element.data( 'widgetId', widgetId );

		$form.on( 'reset error', function() {
			window.grecaptcha.reset( $element.data( 'widgetId' ) );
		} );
	};

	var onRecaptchaApiReady = function( callback ) {
		window = elementorFrontend.getScopeWindow();
		if ( window.grecaptcha ) {
			callback();
		} else {
			// If not ready check again by timeout..
			setTimeout( function() {
				onRecaptchaApiReady( callback );
			}, 350 );
		}
	};

	onRecaptchaApiReady( function() {
		addRecaptcha( $element );
	} );
};

},{}],7:[function(require,module,exports){
module.exports = function() {
	var settings = {};

	var initSettings = function() {
		settings.classes = {
			fitHeight: 'elementor-fit-height'
		};

		settings.selectors = {
			postThumbnail: '.elementor-post__thumbnail'
		};
	};

	var initHandlers = function() {
		elementorFrontend.hooks.addAction( 'frontend/element_ready/portfolio.default', require( './handlers/portfolio' ) );
		elementorFrontend.hooks.addAction( 'frontend/element_ready/posts.classic', require( './handlers/posts' ) );
	};

	var init = function() {
		initSettings();

		initHandlers();
	};

	this.fitImage = function( $post, itemRatio ) {
		var $imageParent = $post.find( settings.selectors.postThumbnail ),
			$image = $imageParent.find( 'img' ),
			image = $image[0];

		if ( ! image ) {
			return;
		}

		var imageParentRatio = $imageParent.outerHeight() / $imageParent.outerWidth(),
			imageRatio = image.naturalHeight / image.naturalWidth;

		$imageParent.toggleClass( settings.classes.fitHeight, imageRatio < imageParentRatio );
	};

	this.setColsCountSettings = function( settings ) {
		var currentDeviceMode = elementorFrontend.getCurrentDeviceMode();

		switch ( currentDeviceMode ) {
			case 'mobile':
				settings.colsCount = settings.columns_mobile;
				break;
			case 'tablet':
				settings.colsCount = settings.columns_tablet;
				break;
			default:
				settings.colsCount = settings.columns;
		}

		settings.colsCount = +settings.colsCount;
	};

	init();
};

},{"./handlers/portfolio":8,"./handlers/posts":9}],8:[function(require,module,exports){
var Portfolio = function( $element, settings, $ ) {
	var elements = {};

	var getOffset = function( itemIndex, itemWidth, itemHeight ) {
		var itemGap = elements.$container.width() / settings.colsCount - itemWidth;

		itemGap += itemGap / ( settings.colsCount - 1 );

		return {
			left: ( itemWidth + itemGap ) * ( itemIndex % settings.colsCount ),
			top: ( itemHeight + itemGap ) * Math.floor( itemIndex / settings.colsCount )
		};
	};

	var filterItems = function( term ) {
		if ( '__all' === term ) {
			elements.$items.addClass( settings.classes.active );

			return;
		}

		elements.$items.not( '.elementor-filter-' + term ).removeClass( settings.classes.active );

		elements.$items.filter( '.elementor-filter-' + term ).addClass( settings.classes.active );
	};

	var removeExtraGhostItems = function() {
		var $shownItems = elements.$items.filter( ':visible' ),
			emptyColumns = ( settings.colsCount - $shownItems.length % settings.colsCount ) % settings.colsCount,
			$ghostItems = elements.$container.find( '.' + settings.classes.ghostItem );

		$ghostItems.slice( emptyColumns ).remove();
	};

	var handleEmptyColumns = function() {
		removeExtraGhostItems();

		var $shownItems = elements.$items.filter( ':visible' ),
			$ghostItems = elements.$container.find( '.' + settings.classes.ghostItem ),
			emptyColumns = ( settings.colsCount - ( ( $shownItems.length + $ghostItems.length ) % settings.colsCount ) ) % settings.colsCount;

		for ( var i = 0; i < emptyColumns; i++ ) {
			elements.$container.append( $( '<div>', { 'class': settings.classes.item + ' ' + settings.classes.ghostItem } ) );
		}
	};

	var fitImages = function() {
		elements.$items.each( function() {
			elementorProFrontend.modules.posts.fitImage( $( this ) );
		} );
	};

	var arrangeGrid = function() {
		var $activeItems = elements.$items.filter( '.' + settings.classes.active ),
			$inactiveItems = elements.$items.not( '.' + settings.classes.active ),
			$shownItems = elements.$items.filter( ':visible' ),
			$activeOrShownItems = elements.$items.filter( function() {
				var $item = $( this );

				return $item.is( '.' + settings.classes.active ) || $item.is( ':visible' );
			} ),
			$activeShownItems = $activeItems.filter( ':visible' ),
			$activeHiddenItems = $activeItems.filter( ':hidden' ),
			$inactiveShownItems = $inactiveItems.filter( ':visible' ),
			itemWidth = $shownItems.outerWidth(),
			itemHeight = $shownItems.outerHeight();

		elements.$items.css( 'transition-duration', settings.transitionDuration + 'ms' );

		$activeHiddenItems.show();

		if ( elementorFrontend.isEditMode() ) {
			fitImages();
		}

		setTimeout( function() {
			$activeHiddenItems.css( {
				opacity: 1
			} );
		} );

		$inactiveShownItems.css( {
			opacity: 0,
			transform: 'scale3d(0.2, 0.2, 1)'
		} );

		removeExtraGhostItems();

		setTimeout( function() {
			$inactiveShownItems.hide();

			$activeItems.css( {
				transitionDuration: '',
				transform: 'translate3d(0px, 0px, 0px)'
			} );

			handleEmptyColumns();
		}, settings.transitionDuration );

		handleEmptyColumns();

		$activeShownItems.each( function() {
			var $item = $( this ),
				currentOffset = getOffset( $activeOrShownItems.index( $item ), itemWidth, itemHeight ),
				requiredOffset = getOffset( $shownItems.index( $item ), itemWidth, itemHeight );

			if ( currentOffset.left === requiredOffset.left && currentOffset.top === requiredOffset.top ) {
				return;
			}

			requiredOffset.left -= currentOffset.left;

			requiredOffset.top -= currentOffset.top;

			$item.css( {
				transitionDuration: '',
				transform: 'translate3d(' + requiredOffset.left + 'px, ' + requiredOffset.top + 'px, 0)'
			} );
		} );

		setTimeout( function() {
			$activeItems.each( function() {
				var $item = $( this ),
					currentOffset = getOffset( $activeOrShownItems.index( $item ), itemWidth, itemHeight ),
					requiredOffset = getOffset( $activeItems.index( $item ), itemWidth, itemHeight );

				$item.css( {
					transitionDuration: settings.transitionDuration + 'ms'
				} );

				requiredOffset.left -= currentOffset.left;

				requiredOffset.top -= currentOffset.top;

				setTimeout( function() {
					$item.css( 'transform', 'translate3d(' + requiredOffset.left + 'px, ' + requiredOffset.top + 'px, 0)' );
				} );
			} );
		} );
	};

	var activeFilterButton = function( filter ) {
		var $button = elements.$filterButtons.filter( '[data-filter="' + filter + '"]' );

		elements.$filterButtons.removeClass( settings.classes.active );

		$button.addClass( settings.classes.active );
	};

	var setFilter = function( filter ) {
		activeFilterButton( filter );

		filterItems( filter );

		arrangeGrid();
	};

	var onFilterButtonClick = function() {
		setFilter( $( this ).data( 'filter' ) );
	};

	var refreshGrid = function() {
		elementorProFrontend.modules.posts.setColsCountSettings( settings );

		arrangeGrid();
	};

	var initSettings = function() {
		settings.transitionDuration = 450;

		settings.classes = {
			active: 'elementor-active',
			fitHeight: 'elementor-fit-height',
			item: 'elementor-portfolio-item',
			ghostItem: 'elementor-portfolio-ghost-item'
		};
	};

	var initElements = function() {
		elements.$container = $element.find( '.elementor-portfolio' );

		elements.$items = elements.$container.find( '.' + settings.classes.item + ':not(.' + settings.classes.ghostItem + ')' );

		elements.$filterButtons = $element.find( '.elementor-portfolio__filter' );

		elements.$scopeWindow = $( elementorFrontend.getScopeWindow() );
	};

	var bindEvents = function() {
		elements.$filterButtons.on( 'click', onFilterButtonClick );

		var uniqueIdentifier = $element.data( 'model-cid' );

		elementorFrontend.addListenerOnce( uniqueIdentifier, 'resize', refreshGrid );

		if ( elementorFrontend.isEditMode() ) {
			elementorFrontend.addListenerOnce( uniqueIdentifier, 'change:portfolio:item_ratio', refreshGrid, elementor.channels.editor );
		}
	};

	var run = function() {
		elementorProFrontend.modules.posts.setColsCountSettings( settings );

		setFilter( '__all' );

		handleEmptyColumns();

		// For slow browsers
		setTimeout( fitImages, 0 );
	};

	var init = function() {
		initSettings();

		initElements();

		bindEvents();

		run();
	};

	init();
};

module.exports = function( $scope, $ ) {
	if ( ! $scope.find( '.elementor-portfolio' ).length ) {
		return;
	}

	new Portfolio( $scope, $scope.find( '.elementor-portfolio' ).data( 'portfolio-options' ), $ );
};

},{}],9:[function(require,module,exports){
var Posts = function( $element, $ ) {
	var settings = {},
		elements = {};

	var fitPostsImage = function() {
		elements.$posts.each( function() {
			var $post = $( this ),
				$image = $post.find( settings.selectors.postThumbnailImage );

			elementorProFrontend.modules.posts.fitImage( $post );

			$image.on( 'load', function() {
				elementorProFrontend.modules.posts.fitImage( $post );
			} );
		} );
	};

	var runMasonry = function() {
		elementorProFrontend.modules.posts.setColsCountSettings( settings );

		elements.$posts.css( 'transform', 'translateY(0)' );

		if ( ! settings.classic_masonry || settings.colsCount < 2 ) {
			elements.$postsContainer
				.height( '' )
				.removeClass( settings.classes.masonry );

			return;
		}

		elements.$postsContainer.addClass( settings.classes.masonry );

		var heights = [];

		elements.$posts.each( function( index ) {
			var row = Math.floor( index / settings.colsCount ),
				indexAtRow = index % settings.colsCount,
				$post = $( this ),
				itemPosition = $post.position(),
				itemHeight = $post.outerHeight();

			if ( row ) {
				$post.css( 'transform', 'translateY(-' + ( itemPosition.top - heights[ indexAtRow ] ) + 'px)' );

				heights[ indexAtRow ] += itemHeight;
			} else {
				heights.push( itemHeight );
			}
		} );

		elements.$postsContainer.height( Math.max.apply( Math, heights ) );
	};

	var initMasonry = function() {
		// TODO: Implement `imagesLoaded` also in frontend
		if ( elementorFrontend.isEditMode() ) {
			elements.$posts.imagesLoaded().always( runMasonry );
		} else {
			runMasonry();
		}
	};

	var onWindowResize = function() {
		fitPostsImage();

		runMasonry();
	};

	var initSettings = function() {
		settings.selectors = {
			postsContainer: '.elementor-posts-container',
			post: '.elementor-post',
			postThumbnail: '.elementor-post__thumbnail',
			postThumbnailImage: '.elementor-post__thumbnail img'
		};

		settings.classes = {
			masonry: 'elementor-posts-masonry'
		};
	};

	var initElements = function() {
		elements.$postsContainer = $element.find( settings.selectors.postsContainer );

		elements.$posts = $element.find( settings.selectors.post );

		$.extend( settings, elements.$postsContainer.data( 'options' ) );
	};

	var bindEvents = function() {
		var uniqueIdentifier = $element.data( 'model-cid' );

		elementorFrontend.addListenerOnce( uniqueIdentifier, 'resize', onWindowResize );

		if ( elementorFrontend.isEditMode() ) {
			elementorFrontend.addListenerOnce( uniqueIdentifier, 'change:posts', function( controlView, elementView ) {
				var controlName = controlView.model.get( 'name' ),
					elementSettings = elementView.model.get( 'settings' );

				if ( undefined !== settings[ controlName ] ) {
					settings[ controlName ] = elementSettings.get( controlName );
				}

				runMasonry();

				if ( /^classic_(item_ratio|masonry)/.test( controlName ) ) {
					fitPostsImage();
				}
			}, elementor.channels.editor );
		}
	};

	var run = function() {
		fitPostsImage();

		initMasonry();
	};

	var init = function() {
		initSettings();

		initElements();

		bindEvents();

		run();
	};

	init();
};

module.exports = function( $scope, $ ) {
	new Posts( $scope, $ );
};

},{}],10:[function(require,module,exports){
module.exports = function() {
	elementorFrontend.hooks.addAction( 'frontend/element_ready/slides.default', require( './handlers/slides' ) );
};

},{"./handlers/slides":11}],11:[function(require,module,exports){
module.exports = function( $scope, $ ) {
	var $slider = $scope.find( '.elementor-slides' );

	if ( ! $slider.length ) {
		return;
	}

	$slider.slick( $slider.data( 'slider_options' ) );

	// Add and remove animation classes to slide content, on slider change
	if ( '' === $slider.data( 'animation' ) ) {
		return;
	}

	$slider.on( {
		beforeChange: function() {
			var $sliderContent = $slider.find( '.elementor-slide-content' );

			$sliderContent.removeClass( 'animated ' + $slider.data( 'animation' ) ).hide();
		},

		afterChange: function( event, slick, currentSlide ) {
			var $currentSlide = $( slick.$slides.get( currentSlide ) ).find( '.elementor-slide-content' ),
				animationClass = $slider.data( 'animation' );

			$currentSlide
				.show()
				.addClass( 'animated ' + animationClass );
		}
	} );
};

},{}]},{},[1])
//# sourceMappingURL=frontend.js.map
