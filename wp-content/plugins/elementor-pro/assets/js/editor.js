/*! elementor-pro - v1.2.4 - 21-03-2017 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var EditorModule = function() {
	var self = this;

	this.init = function() {
		Backbone.$( window ).on( 'elementor:init', _.bind( this.onElementorReady, this ) );
	};

	this.onElementorReady = function() {
		self.onElementorInit();

		elementor.on( 'preview:loaded', function() {
			self.onElementorPreviewLoaded();
		} );
	};

	this.init();
};

EditorModule.prototype.onElementorInit = function() {};

EditorModule.prototype.onElementorPreviewLoaded = function() {};

EditorModule.extend = Backbone.View.extend;

module.exports = EditorModule;

},{}],2:[function(require,module,exports){
var ElementorPro = Marionette.Application.extend( {
	config: {},

	modules: {},

	initModules: function() {
		var PanelPostsControl = require( 'modules/panel-posts-control/assets/js/editor' ),
			Forms = require( 'modules/forms/assets/js/editor' ),
			Library = require( 'modules/library/assets/js/editor' ),
			CustomCSS = require( 'modules/custom-css/assets/js/editor' ),
			Slides = require( 'modules/slides/assets/js/editor' ),
			GlobalWidget = require( 'modules/global-widget/assets/js/editor/editor' ),
			FlipBox = require( 'modules/flip-box/assets/js/editor/editor' );

		this.modules = {
			panelPostsControl: new PanelPostsControl(),
			forms: new Forms(),
			library: new Library(),
			customCSS: new CustomCSS(),
			slides: new Slides(),
			globalWidget: new GlobalWidget(),
			flipBox: new FlipBox()
		};
	},

	ajax: {
		send: function() {
			var args = arguments;

			args[0] = 'pro_' + args[0];

			return elementor.ajax.send.apply( elementor.ajax, args );
		}
	},

	translate: function( stringKey, templateArgs ) {
		return elementor.translate( stringKey, templateArgs, this.config.i18n );
	},

	onStart: function() {
		this.config = ElementorProConfig;

		this.initModules();

		Backbone.$( window ).on( 'elementor:init', this.libraryRemoveGetProButtons );
	},

	libraryRemoveGetProButtons: function() {
		elementor.hooks.addFilter( 'elementor/editor/template-library/template/action-button', function() {
			return '#tmpl-elementor-template-library-insert-button';
		});
	}
} );

window.elementorPro = new ElementorPro();

elementorPro.start();

},{"modules/custom-css/assets/js/editor":3,"modules/flip-box/assets/js/editor/editor":5,"modules/forms/assets/js/editor":6,"modules/global-widget/assets/js/editor/editor":8,"modules/library/assets/js/editor":14,"modules/panel-posts-control/assets/js/editor":16,"modules/slides/assets/js/editor":18}],3:[function(require,module,exports){
var EditorModule = require( 'elementor-pro/editor/editor-module' );

module.exports = EditorModule.extend( {
	onElementorInit: function() {
		var CustomCss = require( './editor/custom-css' );
		this.customCss = new CustomCss();
	}
} );

},{"./editor/custom-css":4,"elementor-pro/editor/editor-module":1}],4:[function(require,module,exports){
module.exports = function() {
	var self = this;

	self.init = function() {
		elementor.hooks.addFilter( 'editor/style/styleText', self.addCustomCss );
	};

	self.addCustomCss = function( css, view ) {
		var model = view.getEditModel(),
			customCSS = model.get( 'settings' ).get( 'custom_css' );

		if ( customCSS ) {
			css += customCSS.replace( /selector/g, '.elementor-element-' + view.model.id );
		}

		return css;
	};

	self.init();
};

},{}],5:[function(require,module,exports){
var EditorModule = require( 'elementor-pro/editor/editor-module' );

module.exports = EditorModule.extend( {
	onElementorInit: function() {
		elementor.channels.editor.on( 'section:activated', this.onSectionActivated );
	},

	onSectionActivated: function( sectionName, editor ) {
		var editedElement = editor.getOption( 'editedElementView' );

		if ( 'flip-box' !== editedElement.model.get( 'widgetType' ) ) {
			return;
		}

		var isSideBSection = -1 !== [ 'section_side_b_content', 'section_style_b' ].indexOf( sectionName );

		editedElement.$el.toggleClass( 'elementor-flip-box--flipped', isSideBSection );

		var $backLayer = editedElement.$el.find( '.elementor-flip-box__back' );

		if ( isSideBSection ) {
            $backLayer.css( 'transition', 'none' );
		}

		if ( ! isSideBSection ) {
			setTimeout( function() {
				$backLayer.css( 'transition', '' );
			}, 10 );
		}
	}
} );

},{"elementor-pro/editor/editor-module":1}],6:[function(require,module,exports){
var EditorModule = require( 'elementor-pro/editor/editor-module' );

module.exports = EditorModule.extend( {
	onElementorPreviewLoaded: function() {
		var ReplyToField = require( './editor/reply-to-field' );
		this.replyToField = new ReplyToField();
	}
} );

},{"./editor/reply-to-field":7,"elementor-pro/editor/editor-module":1}],7:[function(require,module,exports){
module.exports = function() {
	var editor,
		editedModel,
		replyToControl;

	var setReplyToControl = function() {
		replyToControl = editor.collection.findWhere( { name: 'email_reply_to' } );
	};

	var getReplyToView = function() {
		return editor.children.findByModelCid( replyToControl.cid );
	};

	var refreshReplyToElement = function() {
		var replyToView = getReplyToView();

		if ( replyToView ) {
			replyToView.render();
		}
	};

	var updateReplyToOptions = function() {
		var settingsModel = editedModel.get( 'settings' ),
			emailModels = settingsModel.get( 'form_fields' ).where( { field_type: 'email' } ),
			emailFields;

		emailModels = _.reject( emailModels, { field_label: '' } );

		emailFields = _.map( emailModels, function( model ) {
			return {
				id: model.get( '_id' ),
				label: elementorPro.translate( 'x_field', [ model.get( 'field_label' ) ] )
			};
		} );

		replyToControl.set( 'options', { '': replyToControl.get( 'options' )[''] } );

		_.each( emailFields, function( emailField ) {
			replyToControl.get( 'options' )[ emailField.id ] = emailField.label;
		} );

		refreshReplyToElement();
	};

	var updateDefaultReplyTo = function( settingsModel ) {
		replyToControl.get( 'options' )[ '' ] = settingsModel.get( 'email_from' );

		refreshReplyToElement();
	};

	var onFormFieldsChange = function( changedModel ) {
		// If it's repeater field
		if ( changedModel.get( '_id' ) ) {
			if ( 'email' === changedModel.get( 'field_type' ) ) {
				updateReplyToOptions();
			}
		}

		if ( changedModel.changed.email_from ) {
			updateDefaultReplyTo( changedModel );
		}
	};

	var onPanelShow = function( panel, model ) {
		editor = panel.getCurrentPageView();

		editedModel = model;

		setReplyToControl();

		var settingsModel = editedModel.get( 'settings' );

		settingsModel.on( 'change', onFormFieldsChange );

		updateDefaultReplyTo( settingsModel );

		updateReplyToOptions();
	};

	var init = function() {
		elementor.hooks.addAction( 'panel/open_editor/widget/form', onPanelShow );
	};

	init();
};

},{}],8:[function(require,module,exports){
var EditorModule = require( 'elementor-pro/editor/editor-module' );

module.exports =  EditorModule.extend( {
	globalModels: {},

	panelWidgets: null,

	addGlobalWidget: function( id, args ) {
		args = _.extend( {}, args, {
			categories: [],
			icon: elementor.config.widgets[ args.widgetType ].icon,
			widgetType: args.widgetType,
			custom: {
				templateID: id
			}
		} );

		var globalModel = this.createGlobalModel( id, args );

		return this.panelWidgets.add( globalModel );
	},

	createGlobalModel: function( id, modelArgs ) {
		var globalModel = new elementor.modules.element.Model( modelArgs );

		globalModel.set( 'id', id );

		return this.globalModels[ id ] = globalModel;
	},

	setWidgetType: function() {
		elementor.hooks.addFilter( 'element/view', function( DefaultView, model ) {
			if ( model.get( 'templateID' ) ) {
				return require( './widget-view' );
			}

			return DefaultView;
		} );

		elementor.hooks.addFilter( 'element/model', function( DefaultModel, attrs ) {
			if ( attrs.templateID ) {
				return require( './widget-model' );
			}

			return DefaultModel;
		} );
	},

	registerTemplateType: function() {
		elementor.templates.registerTemplateType( 'widget', {
			showInLibrary: false,
			saveDialog: {
				title: elementorPro.translate( 'global_widget_save_title' ),
				description: elementorPro.translate( 'global_widget_save_description' )
			},
			prepareSavedData: function( data ) {
				data.widgetType = data.data[0].widgetType;

				return data;
			},
			ajaxParams: {
				success: _.bind( this.onWidgetTemplateSaved, this )
			}
		} );
	},

	addSavedWidgetsToPanel: function() {
		var self = this;

		self.panelWidgets = new Backbone.Collection();

		_.each( elementorPro.config.widget_templates, function( templateArgs, id ) {
			self.addGlobalWidget( id, templateArgs );
		} );

		elementor.hooks.addFilter( 'panel/elements/regionViews', function( regionViews ) {
			_.extend( regionViews.global, {
				view: require( './global-templates-view' ),
				options: {
					collection: self.panelWidgets
				}
			} );

			return regionViews;
		} );
	},

	addPanelPage: function() {
		elementor.getPanelView().addPage( 'globalWidget', {
			view: require( './panel-page' )
		} );
	},

	getGlobalModels: function( id ) {
		if ( ! id ) {
			return this.globalModels;
		}

		return this.globalModels[ id ];
	},

	saveTemplates: function() {
		if ( ! Object.keys( this.globalModels ).length ) {
			return;
		}

		var templatesData = [];

		_.each( this.globalModels, function( templateModel, id ) {
			if ( 'loaded' !== templateModel.get( 'settingsLoadedStatus' ) ) {
				return;
			}

			var data = {
				data: JSON.stringify( [ templateModel ] ),
				source: 'local',
				type: 'widget',
				id: id
			};

			templatesData.push( data );
		} );

		elementor.ajax.send( 'update_templates', {
			data: {
				templates: templatesData
			}
		} );
	},

	setSaveButton: function() {
		elementor.getPanelView().footer.currentView.ui.buttonSave.on( 'click', _.bind( this.saveTemplates, this ) );
	},

	requestGlobalModelSettings: function( globalModel, callback ) {
		elementor.templates.requestTemplateContent( 'local', globalModel.get( 'id' ), {
			success: function( data ) {
				globalModel.set( 'settingsLoadedStatus', 'loaded' ).trigger( 'settings:loaded' );

				var settings = data[0].settings,
					settingsModel = globalModel.get( 'settings' );

				settingsModel.handleRepeaterData( settings );

				settingsModel.set( settings );

				if ( callback ) {
					callback( globalModel );
				}
			}
		} );
	},

	onElementorInit: function() {
		this.setWidgetType();
		this.registerTemplateType();
		this.addSavedWidgetsToPanel();
	},

	onElementorPreviewLoaded: function() {
		this.addPanelPage();
		this.setSaveButton();
	},

	onWidgetTemplateSaved: function( data ) {
		var widgetModel = elementor.templates.getLayout().modalContent.currentView.model,
			widgetModelIndex = widgetModel.collection.indexOf( widgetModel );

		elementor.templates.closeModal();

		data.elType = data.type;
		data.settings = widgetModel.get( 'settings' ).attributes;

		var globalModel = this.addGlobalWidget( data.template_id, data ),
			globalModelAttributes = globalModel.attributes;

		widgetModel.collection.add( {
			id: elementor.helpers.getUniqueID(),
			elType: globalModelAttributes.type,
			templateID: globalModelAttributes.template_id,
			widgetType: 'global'
		}, { at: widgetModelIndex }, true );

		widgetModel.destroy();

		var panel = elementor.getPanelView();

		panel.setPage( 'elements' );

		panel.getCurrentPageView().activateTab( 'global' );
	}
} );

},{"./global-templates-view":9,"./panel-page":11,"./widget-model":12,"./widget-view":13,"elementor-pro/editor/editor-module":1}],9:[function(require,module,exports){
module.exports = elementor.modules.templateLibrary.ElementsCollectionView.extend( {
	id: 'elementor-global-templates',

	getEmptyView: function() {
		if ( this.collection.length ) {
			return null;
		}

		return require( './no-templates' );
	},

	onFilterEmpty: function() {}
} );

},{"./no-templates":10}],10:[function(require,module,exports){
module.exports = Marionette.ItemView.extend( {
	template: '#tmpl-elementor-panel-global-widget-no-templates',

	id: 'elementor-panel-global-widget-no-templates',

	className: 'elementor-panel-nerd-box',

	initialize: function() {
		elementor.getPanelView().getCurrentPageView().search.reset();
	},

	onDestroy: function() {
		elementor.getPanelView().getCurrentPageView().showView( 'search' );
	}
} );

},{}],11:[function(require,module,exports){

module.exports = Marionette.ItemView.extend( {
	id: 'elementor-panel-global-widget',

	template: '#tmpl-elementor-panel-global-widget',

	ui: {
		editButton: '#elementor-global-widget-locked-edit .elementor-button',
		unlinkButton: '#elementor-global-widget-locked-unlink .elementor-button',
		loading: '#elementor-global-widget-loading'
	},

	events: {
		'click @ui.editButton': 'onEditButtonClick',
		'click @ui.unlinkButton': 'onUnlinkButtonClick'
	},

	initialize: function() {
		this.initUnlinkDialog();
	},

	buildUnlinkDialog: function() {
		var self = this;

		return elementor.dialogsManager.createWidget( 'confirm', {
			id: 'elementor-global-widget-unlink-dialog',
			headerMessage: elementorPro.translate( 'unlink_widget' ),
			message: elementorPro.translate( 'dialog_confirm_unlink' ),
			position: {
				my: 'center center',
				at: 'center center'
			},
			strings: {
				confirm: elementorPro.translate( 'unlink' ),
				cancel: elementorPro.translate( 'cancel' )
			},
			onConfirm: function() {
				self.getOption( 'editedView' ).unlink();
			}
		} );
	},

	initUnlinkDialog: function() {
		var dialog;

		this.getUnlinkDialog = function() {
			if ( ! dialog ) {
				dialog = this.buildUnlinkDialog();
			}

			return dialog;
		};
	},

	editGlobalModel: function() {
		var editedView = this.getOption( 'editedView' );

		elementor.getPanelView().openEditor( editedView.getEditModel(), editedView );
	},

	onEditButtonClick: function() {
		var self = this,
			editedView = self.getOption( 'editedView' ),
			editedModel = editedView.getEditModel();

		if ( 'loaded' === editedModel.get( 'settingsLoadedStatus' ) ) {
			self.editGlobalModel();

			return;
		}

		self.ui.loading.removeClass( 'elementor-hidden' );

		elementorPro.modules.globalWidget.requestGlobalModelSettings( editedModel, function() {
			self.ui.loading.addClass( 'elementor-hidden' );

			self.editGlobalModel();
		} );
	},

	onUnlinkButtonClick: function() {
		this.getUnlinkDialog().show();
	}
} );

},{}],12:[function(require,module,exports){
module.exports = elementor.modules.element.Model.extend( {
	initialize: function() {
		this.set( { widgetType: 'global' }, { silent: true } );

		elementor.modules.element.Model.prototype.initialize.apply( this, arguments );
	},

	initSettings: function() {},

	initEditSettings: function() {},

	onDestroy: function() {
		var panel = elementor.getPanelView(),
			currentPageName = panel.getCurrentPageName();

		if ( -1 !== [ 'editor', 'globalWidget' ].indexOf( currentPageName ) ) {
			panel.setPage( 'elements' );
		}
	}
} );

},{}],13:[function(require,module,exports){
var WidgetView = elementor.modules.WidgetView,
	GlobalWidgetView;

GlobalWidgetView = WidgetView.extend( {

	globalModel: null,

	className: function() {
		return WidgetView.prototype.className.apply( this, arguments ) + ' elementor-global-widget elementor-global-' + this.model.get( 'templateID' );
	},

	initialize: function() {
		var self = this,
			templateID = self.model.get( 'templateID' );

		self.globalModel = elementorPro.modules.globalWidget.getGlobalModels( templateID );

		var globalSettingsLoadedStatus = self.globalModel.get( 'settingsLoadedStatus' );

		if ( ! globalSettingsLoadedStatus ) {
			self.globalModel.set( 'settingsLoadedStatus', 'pending' );

			elementorPro.modules.globalWidget.requestGlobalModelSettings( self.globalModel );
		}

		if ( 'loaded' !== globalSettingsLoadedStatus ) {
			self.$el.addClass( 'elementor-loading' );
		}

		self.globalModel.on( 'settings:loaded', function() {
			self.$el.removeClass( 'elementor-loading' );

			self.render();
		} );

		WidgetView.prototype.initialize.apply( self, arguments );
	},

	getEditModel: function() {
		return this.globalModel;
	},

	getHTMLContent: function( html ) {
		if ( 'loaded' === this.globalModel.get( 'settingsLoadedStatus' ) ) {
			return WidgetView.prototype.getHTMLContent.call( this, html );
		}

		return '';
	},

	serializeModel: function() {
		return this.globalModel.toJSON.apply( this.globalModel, _.rest( arguments ) );
	},

	edit: function() {
		elementor.getPanelView().setPage( 'globalWidget', 'Global Editing', { editedView: this } );
	},

	unlink: function() {
		var newModel = new elementor.modules.element.Model( {
			elType: 'widget',
			widgetType: this.globalModel.get( 'widgetType' ),
			id: elementor.helpers.getUniqueID()
		} );

		newModel.set( {
			settings: this.globalModel.get( 'settings' ).clone(),
			editSettings: this.globalModel.get( 'editSettings' ).clone()
		} );

		this._parent.addChildModel( newModel, { at: this.model.collection.indexOf( this.model ) } );

		var newWidget = this._parent.children.findByModelCid( newModel.cid );

		this.model.destroy();

		newWidget.edit();
	}
} );

module.exports = GlobalWidgetView;

},{}],14:[function(require,module,exports){
var EditorModule = require( 'elementor-pro/editor/editor-module' );

module.exports = EditorModule.extend( {
	onElementorPreviewLoaded: function() {
		var EditButton = require( './editor/edit-button' );
		this.editButton = new EditButton();
	}
} );

},{"./editor/edit-button":15,"elementor-pro/editor/editor-module":1}],15:[function(require,module,exports){
module.exports = function() {
	var self = this;

	self.onPanelShow = function(  panel ) {
		var templateIdControl = panel.content.currentView.collection.findWhere( { name: 'template_id' } );

		if ( ! templateIdControl ) {
			return; // No templates
		}
		var templateIdInput = panel.content.currentView.children.findByModelCid( templateIdControl.cid );

		templateIdInput.on( 'input:change', self.onTemplateIdChange ).trigger( 'input:change' );
	};

	self.onTemplateIdChange = function() {
		var templateID = this.options.elementSettingsModel.attributes.template_id,
			type = this.options.model.attributes.types[ templateID ],
			$editButton = this.$el.find( '.elementor-edit-template' );

		if ( '0' === templateID || ! templateID || 'widget' === type ) { // '0' = first option, 'widget' is editable only from Elementor page
			if ( $editButton.length ) {
				$editButton.remove();
			}

			return;
		}

		var editUrl = ElementorConfig.home_url + '?p=' + templateID + '&elementor';

		if ( $editButton.length ) {
			$editButton.prop( 'href', editUrl );
		} else {
			$editButton = jQuery( '<a />', {
				target: '_blank',
				class: 'elementor-button elementor-button-default elementor-edit-template',
				href: editUrl,
				html: '<i class="fa fa-pencil" /> ' + ElementorProConfig.i18n.edit_template
		} );

			this.$el.find( '.elementor-control-input-wrapper' ).after( $editButton );
		}
	};

	self.init = function() {
		elementor.hooks.addAction( 'panel/open_editor/widget/template', self.onPanelShow );
	};

	self.init();
};

},{}],16:[function(require,module,exports){
var EditorModule = require( 'elementor-pro/editor/editor-module' );

module.exports = EditorModule.extend( {
	onElementorPreviewLoaded: function() {
		elementor.addControlView( 'Query', require( './editor/query-control' ) );
	}
} );

},{"./editor/query-control":17,"elementor-pro/editor/editor-module":1}],17:[function(require,module,exports){
module.exports = elementor.modules.controls.Select2.extend( {
	isTitlesReceived: false,

	getSelect2Options: function() {
		var self = this;

		return {
			ajax: {
				transport: function( params, success, failure ) {

					var data = {
						q: params.data.q,
						filter_type: self.model.get( 'filter_type' ),
						object_type: self.model.get( 'object_type' )
					};

					return elementorPro.ajax.send( 'panel_posts_control_filter_autocomplete', {
						data: data,
						success: success,
						error: failure
					} );
				},
				data: function( params ) {
					return {
						q: params.term,
						page: params.page
					};
				},
				cache: true
			},
			escapeMarkup: function( markup ) {
				return markup;
			},
			minimumInputLength: 2
		};
	},

	getValueTitles: function() {
		var self = this,
			value = self.getControlValue(),
			filterType = self.model.get( 'filter_type' );

		if ( ! value || ! filterType ) {
			return;
		}

		var data = {
			filter_type: filterType,
			object_type: self.model.get( 'object_type' ),
			value: value
		};

		var request = elementorPro.ajax.send( 'panel_posts_control_value_titles', { data: data });

		request.then( function( response ) {
			self.isTitlesReceived = true;

			self.model.set( 'options', response.data );

			self.render();
		});
	},

	onReady: function() {
		elementor.modules.controls.Select2.prototype.onReady.apply( this, arguments );

		if ( ! this.isTitlesReceived ) {
			this.getValueTitles();
		}
	}
} );

},{}],18:[function(require,module,exports){
var EditorModule = require( 'elementor-pro/editor/editor-module' );

module.exports = EditorModule.extend( {
	onElementorPreviewLoaded: function() {
		var StopSlider = require( './editor/stop-slider' );
		this.stopSlider = new StopSlider();
	}
} );

},{"./editor/stop-slider":19,"elementor-pro/editor/editor-module":1}],19:[function(require,module,exports){
module.exports = function() {
	var self = this;

	self.onPanelShow = function( panel, model, view ) {
		var $slider = view.$el.find( '.elementor-slides' );

		if ( $slider.length ) {
			$slider.slick( 'slickPause' );

			$slider.on( 'afterChange', function() {
				$slider.slick( 'slickPause' );
			} );
		}
	};

	self.init = function() {
		elementor.hooks.addAction( 'panel/open_editor/widget/slides', self.onPanelShow );
	};

	self.init();
};

},{}]},{},[2])
//# sourceMappingURL=editor.js.map
