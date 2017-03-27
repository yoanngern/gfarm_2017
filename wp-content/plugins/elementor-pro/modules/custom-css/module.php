<?php
namespace ElementorPro\Modules\CustomCss;

use Elementor\Controls_Manager;
use Elementor\Element_Base;
use Elementor\Plugin;
use Elementor\Post_CSS_File;
use Elementor\Widget_Base;
use ElementorPro\Base\Module_Base;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
} // Exit if accessed directly

class Module extends Module_Base {

	public function __construct() {
		parent::__construct();

		$this->add_actions();
	}

	public function get_name() {
		return 'custom-css';
	}

	/**
	 * @param $element    Widget_Base
	 * @param $section_id string
	 * @param $args       array
	 */
	public function register_controls( $element, $section_id, $args ) {
		if ( Controls_Manager::TAB_ADVANCED !== $args['tab'] || ( '_section_responsive' !== $section_id /* Section/Widget */ && 'section_responsive' !== $section_id /* Column */ ) ) {
			return;
		}

		$element->start_controls_section(
			'section_custom_css',
			[
				'label' => __( 'Custom CSS', 'elementor-pro' ),
				'tab'   => Controls_Manager::TAB_ADVANCED,
			]
		);

		$element->add_control(
			'custom_css',
			[
				'type'      => Controls_Manager::CODE,
				'label'     => __( 'Add your own custom CSS here', 'elementor-pro' ),
				'language'  => 'css',
				'render_type' => 'ui',
			]
		);

		$element->add_control(
			'custom_css_description',
			[
				'raw'     => __( 'Use "selector" to target wrapper element. Examples:<br>selector {color: red;} // For main element<br>selector .child-element {margin: 10px;} // For child element<br>.my-class {text-align: center;} // Or use any custom selector', 'elementor-pro' ),
				'type'    => Controls_Manager::RAW_HTML,
				'content_classes' => 'elementor-descriptor',
			]
		);

		$element->end_controls_section();
	}

	private function make_unique_selectors( $selectors, $unique_prefix ) {
		$to_replace = [ 'selector', "\n", "\r" ];

		foreach ( $selectors as & $selector ) {
			$selector = $unique_prefix . ' ' . str_replace( $to_replace, '', $selector );

			// Remove the space before pseudo selectors like :hove :before and etc.
			$selector = str_replace( $unique_prefix . ' :', $unique_prefix . ':', $selector );
		}

		return $selectors;
	}

	/**
	 * @param $post_css Post_CSS_File
	 * @param $element  Element_Base
	 */
	public function add_post_css( $post_css, $element ) {
		$element_settings = $element->get_settings();

		if ( empty( $element_settings['custom_css'] ) ) {
			return;
		}

		$css = trim( $element_settings['custom_css'] );

		if ( empty( $css ) ) {
			return;
		}
		$css = str_replace( 'selector', $post_css->get_element_unique_selector( $element ), $css );

		// Add a css comment
		$css = sprintf( '/* Start custom CSS for %s, class: %s */', $element->get_name(), $element->get_unique_selector() ) . $css . '/* End custom CSS */';

		$post_css->get_stylesheet()->add_raw_css( $css );
	}

	/**
	 * @param $element Element_Base
	 */
	public function remove_go_pro_custom_css( $element ) {
		$controls_to_remove = [ 'section_custom_css_pro', 'custom_css_pro' ];

		Plugin::instance()->controls_manager->remove_control_from_stack( $element->get_name(), $controls_to_remove );
	}

	protected function add_actions() {
		add_action( 'elementor/element/after_section_end', [ $this, 'register_controls' ], 10, 3 );
		add_action( 'elementor/element/parse_css', [ $this, 'add_post_css' ], 10, 2 );

		// Remove Custom CSS Banner (From free version)
		foreach ( [ 'section', 'column', 'common' ] as $element ) {
			add_action( 'elementor/element/' . $element . '/section_custom_css_pro/after_section_end', [ $this, 'remove_go_pro_custom_css' ] );
		}
	}
}
